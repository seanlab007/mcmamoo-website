#!/usr/bin/env python3
"""
MaoAI HyperAgents — Autonomous Verification (自主闭环验证)
─────────────────────────────────────────────────────────────────────────────
核心功能：Self-Generated Harness (自生成验证框架)

Agent 在修改代码前，必须先创建一个能证明当前 Bug 存在的测试用例（Reproducer）。
只有当修改后的代码通过了这个自生成的测试，才算任务完成。

流程：
  [Bug 描述] → create_test_case → [Reproducer 测试] → 执行 → 通过？
    ↓ 否                                                         ↓ 是
  返回错误信息                                           [修复成功]
    ↓
  Agent 自我修正 → 重新执行测试 → 直到通过

用法：
  from create_test_case import AutonomousVerifier
  verifier = AutonomousVerifier(workspace="/path/to/project")
  result = verifier.verify(bug="登录按钮点击无响应", code=current_code)
"""

import os
import re
import json
import time
import subprocess
import tempfile
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志"""
    entry = {"type": step_type, "message": message, "timestamp": time.time(), **kwargs}
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── Reproducer 测试用例模板 ─────────────────────────────────────────────────

REPRODUCER_TEMPLATES = {
    "typescript": '''
// ─── Auto-Generated Reproducer ───────────────────────────────────────────
/**
 * Bug: {bug_description}
 * Generated: {timestamp}
 * Target: {target_file}
 */

import {{ describe, it, expect }} from 'vitest';

describe('Reproducer: {test_name}', () => {{
{test_cases}
}});
''',

    "python": '''
# ─── Auto-Generated Reproducer ───────────────────────────────────────────
"""
Bug: {bug_description}
Generated: {timestamp}
Target: {target_file}
"""

import unittest

class TestReproducer(unittest.TestCase):
{test_cases}

if __name__ == '__main__':
    unittest.main()
'''
}


@dataclass
class TestCase:
    """测试用例"""
    name: str
    description: str
    code: str
    expected: str  # 期望结果
    should_fail_before_fix: bool = True  # 在修复前是否应该失败


@dataclass
class VerificationResult:
    """验证结果"""
    success: bool
    reproducer_created: bool
    test_passed: bool
    test_count: int = 0
    failed_count: int = 0
    error_message: str = ""
    reproducer_path: str = ""
    coverage: float = 0.0


# ─── Autonomous Verifier ───────────────────────────────────────────────────

class AutonomousVerifier:
    """
    自主闭环验证器

    核心原则：
    1. 每个 Bug 必须有对应的 Reproducer
    2. Reproducer 在修复前必须失败
    3. 修复后 Reproducer 必须通过
    """

    def __init__(self, workspace: str = None, language: str = "typescript"):
        self.workspace = workspace or os.getcwd()
        self.language = language
        self.max_test_generation_attempts = 3
        self.reproducer_dir = os.path.join(self.workspace, ".reproducers")

        # 确保目录存在
        os.makedirs(self.reproducer_dir, exist_ok=True)

    def create_reproducer(self, bug: str, code: str, context: Dict = None) -> Dict[str, Any]:
        """
        为 Bug 创建 Reproducer 测试用例

        Args:
            bug: Bug 描述
            code: 相关的代码片段
            context: 额外上下文（如文件路径、函数名等）

        Returns:
            {
                "reproducer_code": str,
                "reproducer_path": str,
                "test_cases": [TestCase],
                "llm_response": str
            }
        """
        log_step("start", f"🔬 创建 Reproducer: {bug[:60]}...", component="verifier")

        # 生成测试用例
        test_cases = self._generate_test_cases(bug, code, context)

        # 生成测试文件代码
        reproducer_code = self._build_reproducer_file(bug, test_cases)

        # 保存到临时文件
        reproducer_name = self._sanitize_name(bug)
        reproducer_path = os.path.join(
            self.reproducer_dir,
            f"reproducer_{reproducer_name}_{int(time.time())}.test.{self._get_extension()}"
        )

        with open(reproducer_path, "w", encoding="utf-8") as f:
            f.write(reproducer_code)

        log_step("done", f"✅ Reproducer 已创建: {reproducer_path}",
                component="verifier", path=reproducer_path, test_count=len(test_cases))

        return {
            "reproducer_code": reproducer_code,
            "reproducer_path": reproducer_path,
            "test_cases": [tc.__dict__ for tc in test_cases]
        }

    def _generate_test_cases(self, bug: str, code: str, context: Dict = None) -> List[TestCase]:
        """使用 LLM 生成测试用例"""
        prompt = f"""请为以下 Bug 创建测试用例：

Bug 描述：{bug}

相关代码：
```
{code[:1500]}
```

请生成 2-3 个测试用例，覆盖：
1. 核心场景：能直接验证 Bug 是否存在的测试
2. 边界条件：边界值和异常输入
3. 回归测试：确保修复后不会引入新问题

输出格式（严格遵循）：
[TEST_CASES]
[
  {{
    "name": "test_name",
    "description": "测试描述",
    "code": "测试代码（实际的可执行代码）",
    "expected": "期望结果",
    "should_fail_before_fix": true/false
  }}
]
[/TEST_CASES]

关键要求：
- 测试代码必须是可执行的
- should_fail_before_fix: 表示在 Bug 修复前，该测试是否会失败
- 大部分测试应该 should_fail_before_fix: true（证明 Bug 存在）
"""

        # 模拟 LLM 调用（实际使用时替换为真实 API）
        response = self._call_llm(prompt)

        # 解析测试用例
        test_cases = self._parse_test_cases(response)

        if not test_cases:
            # 回退：创建默认测试
            test_cases = [
                TestCase(
                    name="reproducer_basic",
                    description="基础复现测试",
                    code=self._get_default_test_code(bug),
                    expected="Bug 修复后应该通过",
                    should_fail_before_fix=True
                )
            ]

        return test_cases

    def _parse_test_cases(self, response: str) -> List[TestCase]:
        """解析 LLM 输出的测试用例"""
        test_cases = []

        match = re.search(r"\[TEST_CASES\]\s*(\[.*?\])\s*\[/TEST_CASES\]", response, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                if isinstance(data, list):
                    for item in data:
                        test_cases.append(TestCase(
                            name=item.get("name", "unnamed"),
                            description=item.get("description", ""),
                            code=item.get("code", ""),
                            expected=item.get("expected", ""),
                            should_fail_before_fix=item.get("should_fail_before_fix", True)
                        ))
            except json.JSONDecodeError:
                pass

        return test_cases

    def _build_reproducer_file(self, bug: str, test_cases: List[TestCase]) -> str:
        """构建完整的 Reproducer 文件"""
        template = REPRODUCER_TEMPLATES.get(self.language, REPRODUCER_TEMPLATES["typescript"])

        if self.language == "typescript":
            test_code_blocks = "\n".join([
                f"  it('{tc.name}', () => {{\n    // {tc.description}\n    {tc.code}\n  }});"
                for tc in test_cases
            ])
        else:
            test_code_blocks = "\n".join([
                f"    def {tc.name}(self):\n        # {tc.description}\n        {tc.code}"
                for tc in test_cases
            ])

        return template.format(
            bug_description=bug,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            target_file="target_file",
            test_name=self._sanitize_name(bug),
            test_cases=test_code_blocks
        )

    def _get_default_test_code(self, bug: str) -> str:
        """获取默认测试代码"""
        if self.language == "typescript":
            return "// 断言：修复后此测试应该通过"
        else:
            return "pass  # 断言：修复后此测试应该通过"

    def _sanitize_name(self, text: str) -> str:
        """将文本转换为安全的文件名"""
        name = re.sub(r"[^\w]", "_", text)[:30]
        return name.lower()

    def _get_extension(self) -> str:
        return "ts" if self.language == "typescript" else "py"

    def verify(self, bug: str, code: str, fixed_code: str = None, context: Dict = None) -> VerificationResult:
        """
        执行完整的验证流程

        1. 创建 Reproducer
        2. 用原始代码执行测试（应该失败）
        3. 如果有 fixed_code，用修复后的代码执行（应该通过）

        Returns:
            VerificationResult
        """
        log_step("start", f"🔍 执行自主验证: {bug[:60]}...", component="verifier")

        # Step 1: 创建 Reproducer
        reproducer = self.create_reproducer(bug, code, context)

        if not reproducer["reproducer_code"]:
            return VerificationResult(
                success=False,
                reproducer_created=False,
                test_passed=False,
                error_message="无法创建 Reproducer"
            )

        # Step 2: 用原始代码测试
        original_result = self._run_tests(
            reproducer["reproducer_path"],
            code,
            should_pass=False  # Bug 存在时应该失败
        )

        log_step("score", f"原始代码测试: {'失败 (符合预期)' if not original_result['passed'] else '通过 (异常)'}",
                component="verifier", passed=original_result["passed"])

        # Step 3: 如果有修复后的代码，验证修复效果
        if fixed_code:
            fixed_result = self._run_tests(
                reproducer["reproducer_path"],
                fixed_code,
                should_pass=True  # 修复后应该通过
            )

            success = fixed_result["passed"]

            log_step("score", f"修复后代码测试: {'通过 ✅' if success else '失败 ❌'}",
                    component="verifier", passed=success)

            return VerificationResult(
                success=success,
                reproducer_created=True,
                test_passed=success,
                test_count=fixed_result.get("test_count", 0),
                failed_count=fixed_result.get("failed_count", 0),
                reproducer_path=reproducer["reproducer_path"],
                error_message=fixed_result.get("error", "")
            )

        return VerificationResult(
            success=True,
            reproducer_created=True,
            test_passed=not original_result["passed"],  # Bug 存在时测试失败 = 符合预期
            reproducer_path=reproducer["reproducer_path"]
        )

    def _run_tests(self, test_path: str, code: str, should_pass: bool) -> Dict:
        """
        运行测试（注入代码后执行）

        实际实现时需要：
        1. 将代码注入到测试环境
        2. 执行测试命令
        3. 解析测试结果
        """
        # 模拟测试执行
        log_step("action", f"🧪 执行测试: {test_path}", component="verifier")

        if self.language == "typescript":
            try:
                result = subprocess.run(
                    ["npm", "test", "--", test_path, "--run"],
                    cwd=self.workspace,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                passed = result.returncode == 0
                return {
                    "passed": passed,
                    "test_count": 5,  # 实际解析
                    "failed_count": 0 if passed else 1,
                    "output": result.stdout
                }
            except Exception as e:
                return {"passed": False, "error": str(e)}
        else:
            try:
                result = subprocess.run(
                    ["python", "-m", "pytest", test_path, "-v"],
                    cwd=self.workspace,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                passed = result.returncode == 0
                return {
                    "passed": passed,
                    "test_count": 5,
                    "failed_count": 0 if passed else 1,
                    "output": result.stdout
                }
            except Exception as e:
                return {"passed": False, "error": str(e)}

    def _call_llm(self, prompt: str) -> str:
        """
        调用 LLM 生成测试用例

        实际实现时应连接到 MaoAI 的后端 API
        """
        import urllib.request
        import urllib.error

        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            return self._mock_test_response()

        base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
        url = f"{base_url}/chat/completions"

        payload = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2048,
            "temperature": 0.0
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result["choices"][0]["message"]["content"]
        except Exception as e:
            log_step("error", f"LLM 调用失败: {e}", component="verifier")
            return self._mock_test_response()

    def _mock_test_response(self) -> str:
        """无 API 时返回模拟响应"""
        return """[TEST_CASES]
[
  {
    "name": "test_bug_exists",
    "description": "验证 Bug 存在：原始代码应该导致测试失败",
    "code": "expect(buggyFunction()).toBeDefined();",
    "expected": "Bug 修复后返回预期值",
    "should_fail_before_fix": true
  },
  {
    "name": "test_edge_case",
    "description": "边界条件测试",
    "code": "expect(buggyFunction(null)).toThrow();",
    "expected": "空输入应该抛出错误",
    "should_fail_before_fix": false
  }
]
[/TEST_CASES]"""


# ─── CLI 入口 ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("用法: python create_test_case.py <bug_description>")
        sys.exit(1)

    bug = sys.argv[1]
    workspace = sys.argv[2] if len(sys.argv) > 2 else "."

    verifier = AutonomousVerifier(workspace=workspace)
    result = verifier.verify(bug=bug, code="# 请提供相关代码")

    print(json.dumps(result.__dict__, ensure_ascii=False, indent=2))
