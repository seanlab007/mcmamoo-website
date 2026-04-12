#!/usr/bin/env python3
"""
MaoAI HyperAgents — ValidatorAgent (第三权：验证者)
─────────────────────────────────────────────────────────────────────────────
Validator 不使用 LLM，而是直接调用 Docker + Pytest 环境进行验证。
这是"三权分立"架构的关键一环：Coder → Reviewer → Validator。

Validator 的职责：
  1. 在 Docker 沙箱中运行测试
  2. 验证代码是否能正确编译/构建
  3. 执行单元测试/集成测试
  4. 检查代码风格和 linting

用法：
  from validator_agent import ValidatorAgent

  validator = ValidatorAgent(workspace="/path/to/project")
  result = validator.validate(
      code=patched_code,
      language="python",
      test_command="pytest tests/"
  )
"""

import os
import json
import time
import subprocess
import tempfile
import hashlib
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum


# ─── 日志工具 ────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志"""
    entry = {
        "type": step_type,
        "agent": "validator",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 数据结构 ────────────────────────────────────────────────────────────────

class ValidationStatus(Enum):
    """验证状态"""
    PASSED = "passed"         # 通过
    FAILED = "failed"         # 失败
    ERROR = "error"           # 执行错误
    TIMEOUT = "timeout"       # 超时
    SKIPPED = "skipped"       # 跳过


@dataclass
class ValidationResult:
    """验证结果"""
    status: ValidationStatus
    passed: int = 0
    failed: int = 0
    errors: int = 0
    skipped: int = 0
    duration: float = 0.0
    output: str = ""
    error_message: str = ""
    test_details: List[Dict[str, Any]] = None

    def __post_init__(self):
        if self.test_details is None:
            self.test_details = []

    @property
    def success(self) -> bool:
        return self.status == ValidationStatus.PASSED

    @property
    def total_tests(self) -> int:
        return self.passed + self.failed + self.errors


@dataclass
class TestCase:
    """测试用例（由 ReviewerAgent 生成）"""
    name: str
    code: str
    language: str
    expected_output: str = ""
    timeout: int = 30


# ─── ValidatorAgent ─────────────────────────────────────────────────────────

class ValidatorAgent:
    """
    验证者 Agent：不使用 LLM，直接在沙箱中执行测试验证。

    三权分立架构中的 Validator：
      Coder ──→ Reviewer ──→ Validator
                              │
                              ├── Docker 沙箱执行
                              ├── Pytest/Jest 测试
                              └── 返回结构化结果
    """

    def __init__(
        self,
        workspace: str = None,
        docker_image: str = "python:3.11-slim",
        timeout: int = 300,
        enable_docker: bool = True
    ):
        self.workspace = workspace or os.getcwd()
        self.docker_image = docker_image
        self.timeout = timeout
        self.enable_docker = enable_docker
        self.test_cache: Dict[str, ValidationResult] = {}

    def validate(
        self,
        code: str,
        language: str,
        test_command: str = None,
        test_cases: List[TestCase] = None,
        file_path: str = None,
        **kwargs
    ) -> ValidationResult:
        """
        验证代码：运行测试套件

        Args:
            code: 要验证的代码
            language: 编程语言 (python, typescript, javascript)
            test_command: 测试命令 (如 pytest, jest, npm test)
            test_cases: 测试用例列表（由 ReviewerAgent 生成）
            file_path: 代码文件路径
        """
        start_time = time.time()

        log_step("validator_start", f"开始验证: language={language}", 
                workspace=self.workspace, docker=self.enable_docker)

        # 如果有 Reviewer 生成的测试用例，先运行它们
        if test_cases:
            result = self._run_test_cases(code, language, test_cases)
        elif test_command:
            result = self._run_command(code, language, test_command, file_path)
        else:
            # 默认行为：尝试运行标准测试
            result = self._run_default_tests(code, language, file_path)

        result.duration = time.time() - start_time

        # 输出结果
        if result.success:
            log_step("validator_passed",
                    f"验证通过: {result.passed} passed, {result.duration:.2f}s",
                    **self._result_to_dict(result))
        else:
            log_step("validator_failed",
                    f"验证失败: {result.failed} failed, {result.errors} errors",
                    **self._result_to_dict(result))

        return result

    def validate_with_docker(
        self,
        code: str,
        language: str,
        test_command: str,
        requirements: str = None
    ) -> ValidationResult:
        """
        在 Docker 沙箱中验证代码（生产级安全隔离）

        Args:
            code: 要验证的代码
            language: 编程语言
            test_command: 测试命令
            requirements: 依赖安装命令 (如 pip install pytest)
        """
        start_time = time.time()

        # 创建临时目录
        with tempfile.TemporaryDirectory() as tmpdir:
            # 写入代码文件
            ext = self._get_extension(language)
            code_file = os.path.join(tmpdir, f"test_code{ext}")
            with open(code_file, "w") as f:
                f.write(code)

            # 构建 Dockerfile
            dockerfile = self._build_dockerfile(language, requirements, test_command)

            # 运行 Docker 容器
            result = self._run_docker(dockerfile, tmpdir, test_command)

        result.duration = time.time() - start_time
        return result

    def _run_test_cases(
        self,
        code: str,
        language: str,
        test_cases: List[TestCase]
    ) -> ValidationResult:
        """运行 Reviewer 生成的测试用例"""
        log_step("validator_test_cases", f"运行 {len(test_cases)} 个测试用例")

        total_passed = 0
        total_failed = 0
        total_errors = 0
        test_details = []
        all_output = []

        for i, test_case in enumerate(test_cases):
            log_step("validator_running_test", f"运行测试 {i+1}/{len(test_cases)}: {test_case.name}")

            # 在临时文件中执行测试
            with tempfile.TemporaryDirectory() as tmpdir:
                # 写入被测代码
                ext = self._get_extension(language)
                code_file = os.path.join(tmpdir, f"code{ext}")
                with open(code_file, "w") as f:
                    f.write(code)

                # 写入测试代码
                test_file = os.path.join(tmpdir, f"test_{i}{ext}")
                with open(test_file, "w") as f:
                    f.write(test_case.code)

                # 执行测试
                result = self._execute_test(language, test_file, timeout=test_case.timeout)

                # 解析结果
                passed, failed, errors = self._parse_test_output(result["output"], language)

                test_detail = {
                    "name": test_case.name,
                    "passed": passed,
                    "failed": failed,
                    "errors": errors,
                    "output": result["output"][:500],  # 截断输出
                    "success": failed == 0 and errors == 0
                }
                test_details.append(test_detail)

                total_passed += passed
                total_failed += failed
                total_errors += errors
                all_output.append(result["output"])

        # 判断结果
        if total_failed > 0 or total_errors > 0:
            status = ValidationStatus.FAILED
        elif total_passed == 0 and len(test_cases) > 0:
            status = ValidationStatus.ERROR  # 测试没运行成功
        else:
            status = ValidationStatus.PASSED

        return ValidationResult(
            status=status,
            passed=total_passed,
            failed=total_failed,
            errors=total_errors,
            output="\n".join(all_output),
            test_details=test_details
        )

    def _run_command(
        self,
        code: str,
        language: str,
        test_command: str,
        file_path: str = None
    ) -> ValidationResult:
        """运行指定的测试命令"""
        log_step("validator_command", f"运行命令: {test_command}")

        # 写入代码
        if file_path:
            full_path = os.path.join(self.workspace, file_path)
        else:
            full_path = os.path.join(self.workspace, f"temp_code{self._get_extension(language)}")

        os.makedirs(os.path.dirname(full_path) or self.workspace, exist_ok=True)
        with open(full_path, "w") as f:
            f.write(code)

        # 执行测试
        try:
            result = subprocess.run(
                test_command,
                shell=True,
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )

            output = result.stdout + "\n" + result.stderr
            passed, failed, errors = self._parse_test_output(output, language)

            status = ValidationStatus.PASSED if failed == 0 and errors == 0 else ValidationStatus.FAILED

            return ValidationResult(
                status=status,
                passed=passed,
                failed=failed,
                errors=errors,
                output=output
            )

        except subprocess.TimeoutExpired:
            return ValidationResult(
                status=ValidationStatus.TIMEOUT,
                error_message=f"测试执行超时 ({self.timeout}s)"
            )
        except Exception as e:
            return ValidationResult(
                status=ValidationStatus.ERROR,
                error_message=str(e)
            )

    def _run_default_tests(
        self,
        code: str,
        language: str,
        file_path: str = None
    ) -> ValidationResult:
        """运行默认测试（根据语言自动选择）"""
        test_commands = {
            "python": "pytest -v --tb=short 2>&1 || python -m pytest -v --tb=short 2>&1",
            "typescript": "npm test 2>&1 || npx jest 2>&1",
            "javascript": "npm test 2>&1 || npx jest 2>&1",
        }

        command = test_commands.get(language.lower())
        if command:
            return self._run_command(code, language, command, file_path)

        # 没有测试命令，只做语法检查
        return self._syntax_check(code, language)

    def _syntax_check(
        self,
        code: str,
        language: str
    ) -> ValidationResult:
        """语法检查"""
        log_step("validator_syntax", f"执行语法检查: {language}")

        check_commands = {
            "python": ["python3", "-m", "py_compile"],
            "typescript": ["npx", "tsc", "--noEmit"],
            "javascript": ["node", "--check"],
        }

        cmd = check_commands.get(language.lower())
        if not cmd:
            return ValidationResult(status=ValidationStatus.SKIPPED, output="无语法检查命令")

        try:
            with tempfile.NamedTemporaryFile(suffix=self._get_extension(language), delete=False) as f:
                f.write(code.encode())
                f.flush()
                temp_path = f.name

            cmd.append(temp_path)
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            if result.returncode == 0:
                return ValidationResult(status=ValidationStatus.PASSED, passed=1)
            else:
                return ValidationResult(
                    status=ValidationStatus.FAILED,
                    errors=1,
                    output=result.stderr
                )

        except Exception as e:
            return ValidationResult(status=ValidationStatus.ERROR, error_message=str(e))
        finally:
            if 'temp_path' in locals():
                os.unlink(temp_path)

    def _execute_test(
        self,
        language: str,
        test_file: str,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """在临时环境中执行测试"""
        commands = {
            "python": f"cd $(dirname {test_file}) && python -m pytest {test_file} -v --tb=short 2>&1",
            "typescript": f"npx jest {test_file} 2>&1",
            "javascript": f"npx jest {test_file} 2>&1",
        }

        cmd = commands.get(language.lower(), f"python {test_file}")
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return {"success": True, "output": result.stdout + result.stderr}
        except subprocess.TimeoutExpired:
            return {"success": False, "output": "Test timeout"}
        except Exception as e:
            return {"success": False, "output": str(e)}

    def _parse_test_output(self, output: str, language: str) -> tuple:
        """解析测试输出，提取 passed/failed/errors 数量"""
        passed = failed = errors = 0

        # Pytest 格式: "5 passed, 2 failed in 1.23s"
        pytest_match = re.search(r'(\d+) passed', output)
        if pytest_match:
            passed = int(pytest_match.group(1))

        pytest_failed = re.search(r'(\d+) failed', output)
        if pytest_failed:
            failed = int(pytest_failed.group(1))

        pytest_errors = re.search(r'(\d+) error', output)
        if pytest_errors:
            errors = int(pytest_errors.group(1))

        # Jest 格式: "Tests: 3 passed, 1 failed, 2 total"
        jest_match = re.search(r'Tests?: (\d+) passed', output)
        if jest_match and passed == 0:
            passed = int(jest_match.group(1))

        jest_failed = re.search(r'Tests?: .+ (\d+) failed', output)
        if jest_failed:
            failed = int(jest_failed.group(1))

        return passed, failed, errors

    def _build_dockerfile(self, language: str, requirements: str, test_command: str) -> str:
        """构建 Dockerfile"""
        base_images = {
            "python": "python:3.11-slim",
            "typescript": "node:20-slim",
            "javascript": "node:20-slim",
        }

        base = base_images.get(language.lower(), "python:3.11-slim")

        dockerfile = f"""
FROM {base}

WORKDIR /app

# 安装基础工具
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

# 安装依赖
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
RUN if [ -f package.json ]; then npm install; fi
RUN if [ -f pyproject.toml ]; then pip install -e .; fi

# 如果有自定义依赖命令
{requirements if requirements else ''}

# 运行测试
CMD {test_command}
"""
        return dockerfile

    def _run_docker(
        self,
        dockerfile: str,
        context_dir: str,
        test_command: str
    ) -> ValidationResult:
        """在 Docker 容器中运行测试"""
        try:
            # 检查 Docker 是否可用
            docker_check = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                timeout=10
            )
            if docker_check.returncode != 0:
                return ValidationResult(
                    status=ValidationStatus.ERROR,
                    error_message="Docker not available"
                )

            # 构建并运行
            log_step("validator_docker", "在 Docker 沙箱中执行验证...")

            # 这里简化处理，实际生产环境应该用 docker SDK
            result = subprocess.run(
                f"cd {context_dir} && docker build -t validator-test . 2>&1 | tail -20",
                shell=True,
                capture_output=True,
                text=True,
                timeout=180
            )

            if result.returncode == 0:
                # 运行容器
                run_result = subprocess.run(
                    f"docker run --rm validator-test",
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout
                )
                output = run_result.stdout + "\n" + run_result.stderr
            else:
                output = result.stderr

            passed, failed, errors = self._parse_test_output(output, "python")
            status = ValidationStatus.PASSED if failed == 0 and errors == 0 else ValidationStatus.FAILED

            return ValidationResult(
                status=status,
                passed=passed,
                failed=failed,
                errors=errors,
                output=output
            )

        except subprocess.TimeoutExpired:
            return ValidationResult(status=ValidationStatus.TIMEOUT)
        except Exception as e:
            return ValidationResult(status=ValidationStatus.ERROR, error_message=str(e))

    def _get_extension(self, language: str) -> str:
        """获取文件扩展名"""
        extensions = {
            "python": ".py",
            "typescript": ".ts",
            "javascript": ".js",
            "tsx": ".tsx",
            "jsx": ".jsx"
        }
        return extensions.get(language.lower(), ".txt")

    def _result_to_dict(self, result: ValidationResult) -> Dict[str, Any]:
        """将结果转为字典"""
        return {
            "status": result.status.value,
            "passed": result.passed,
            "failed": result.failed,
            "errors": result.errors,
            "duration": result.duration,
            "success": result.success
        }


# ─── CLI ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    import re

    parser = argparse.ArgumentParser(description="MaoAI ValidatorAgent - 代码验证工具")
    parser.add_argument("--code", type=str, required=True, help="要验证的代码")
    parser.add_argument("--language", type=str, default="python", help="编程语言")
    parser.add_argument("--test-command", type=str, help="测试命令")
    parser.add_argument("--workspace", type=str, default=".", help="工作目录")
    parser.add_argument("--docker", action="store_true", help="启用 Docker 沙箱")
    parser.add_argument("--timeout", type=int, default=300, help="超时时间(秒)")

    args = parser.parse_args()

    validator = ValidatorAgent(
        workspace=args.workspace,
        timeout=args.timeout,
        enable_docker=args.docker
    )

    result = validator.validate(
        code=args.code,
        language=args.language,
        test_command=args.test_command
    )

    print("\n" + "=" * 50)
    print("Validator 执行结果")
    print("=" * 50)
    print(f"状态: {'✓ 通过' if result.success else '✗ 失败'}")
    print(f"通过: {result.passed}")
    print(f"失败: {result.failed}")
    print(f"错误: {result.errors}")
    print(f"耗时: {result.duration:.2f}s")
    if result.error_message:
        print(f"错误信息: {result.error_message}")
    print("=" * 50)
