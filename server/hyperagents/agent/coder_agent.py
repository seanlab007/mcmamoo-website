#!/usr/bin/env python3
"""
MaoAI HyperAgents — Coder Agent（编码员 Agent）
─────────────────────────────────────────────────────────────────────────────
核心职责：
  1. 代码生成：根据任务描述生成高质量代码
  2. 代码修复：根据 Reviewer 反馈修改代码
  3. Patch 生成：生成标准的 diff/patch 格式
  4. 与 Reviewer 博弈：在反馈循环中不断提升代码质量

工作模式：
  - 首次生成：理解任务 → 生成代码 → 输出 patch
  - 修复模式：根据 Reviewer 反馈 → 修改代码 → 输出新的 patch

用法：
  from coder_agent import CoderAgent

  coder = CoderAgent(api_key="...", workspace="/path/to/project")
  result = coder.generate(task="优化登录模块", context={"files": ["login.tsx"]})
  print(result.code)  # 生成的代码
  print(result.patch)  # diff 格式的补丁
"""

import sys
import json
import time
import os
import re
import subprocess
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum


# ─── 日志工具 ────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志到标准输出（flush=True 确保实时性）"""
    entry = {
        "type": step_type,
        "agent": "coder",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 数据结构 ────────────────────────────────────────────────────────────────

class GenerationMode(Enum):
    """生成模式"""
    INITIAL = "initial"      # 首次生成
    REVISION = "revision"    # 根据反馈修复
    REFACTOR = "refactor"    # 重构
    TEST = "test"           # 生成测试


@dataclass
class CodeContext:
    """代码上下文"""
    task: str
    file_path: str = ""
    language: str = "typescript"
    framework: str = ""
    original_code: str = ""
    related_files: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)


@dataclass
class GenerationResult:
    """生成结果"""
    success: bool
    code: str = ""
    patch: str = ""
    diff_lines: int = 0
    explanation: str = ""
    warnings: List[str] = field(default_factory=list)
    generation_time: float = 0.0


# ─── Coder Agent ─────────────────────────────────────────────────────────────

class CoderAgent:
    """
    编码员 Agent - 与 Reviewer 进行博弈式开发

    特点：
      1. 智能代码生成：理解任务，生成符合最佳实践的代码
      2. 反馈驱动修复：根据 Reviewer 意见精准修改
      3. Patch 生成：生成标准的 unified diff 格式
      4. 上下文感知：理解项目结构和依赖关系
    """

    def __init__(
        self,
        api_key: str = None,
        model: str = "gpt-4o",
        workspace: str = None,
        language: str = "typescript"
    ):
        """
        初始化编码员

        Args:
            api_key: OpenAI API Key
            model: 使用的模型
            workspace: 工作目录
            language: 主要编程语言
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = model
        self.workspace = workspace or os.getcwd()
        self.language = language
        self.generation_history: List[GenerationResult] = []

    def generate(
        self,
        task: str,
        context: Dict = None,
        mode: GenerationMode = GenerationMode.INITIAL,
        reviewer_feedback: str = ""
    ) -> GenerationResult:
        """
        生成或修复代码

        Args:
            task: 任务描述
            context: 上下文信息
            mode: 生成模式
            reviewer_feedback: Reviewer 的反馈（用于修复模式）

        Returns:
            GenerationResult: 生成结果
        """
        start_time = time.time()

        # 构建上下文
        code_context = self._build_context(task, context, mode, reviewer_feedback)

        # 读取相关文件（如果需要）
        if context and context.get("file_path"):
            original_code = self._read_file(context["file_path"])
        else:
            original_code = ""

        log_step("thought", f"Coder 开始{mode.value}模式: {task[:50]}...",
                mode=mode.value, task=task[:100])

        # 调用 LLM 生成代码
        if self.api_key:
            generated = self._generate_with_llm(code_context, original_code, mode, reviewer_feedback)
        else:
            generated = self._generate_mock(code_context, original_code, mode)

        # 生成 patch
        if original_code and generated:
            patch = self._generate_patch(original_code, generated, context.get("file_path", ""))
        else:
            patch = ""

        # 计算结果
        result = GenerationResult(
            success=True,
            code=generated,
            patch=patch,
            diff_lines=len(patch.splitlines()) if patch else 0,
            explanation=f"{mode.value} 完成",
            generation_time=time.time() - start_time
        )

        self.generation_history.append(result)

        log_step("action", f"代码生成完成，{result.diff_lines} 行 diff",
                mode=mode.value,
                code_length=len(generated),
                diff_lines=result.diff_lines,
                time=f"{result.generation_time:.2f}s")

        return result

    def _build_context(
        self,
        task: str,
        context: Dict,
        mode: GenerationMode,
        feedback: str
    ) -> str:
        """构建提示词上下文"""
        ctx = f"""任务：{task}

语言：{self.language}
工作目录：{self.workspace}
"""

        if context:
            if context.get("file_path"):
                ctx += f"\n目标文件：{context['file_path']}"
            if context.get("framework"):
                ctx += f"\n框架：{context['framework']}"
            if context.get("constraints"):
                ctx += f"\n约束条件：{', '.join(context['constraints'])}"

        if mode == GenerationMode.REVISION and feedback:
            ctx += f"""
═══════════════════════════════════════════════════
⚠️ 重要：这是修复模式
Reviewer 审查反馈：
{'-' * 50}
{feedback}
{'-' * 50}
你必须根据上述反馈精确修复代码，不要引入新的问题。
═══════════════════════════════════════════════════
"""

        return ctx

    def _read_file(self, file_path: str) -> str:
        """读取文件内容"""
        try:
            full_path = os.path.join(self.workspace, file_path) if not os.path.isabs(file_path) else file_path
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            log_step("error", f"读取文件失败: {e}", file=file_path)
            return ""

    def _generate_with_llm(
        self,
        context: str,
        original_code: str,
        mode: GenerationMode,
        feedback: str
    ) -> str:
        """使用 LLM 生成代码"""
        mode_instruction = {
            GenerationMode.INITIAL: "请生成完整的、高质量的代码。",
            GenerationMode.REVISION: "请根据 Reviewer 反馈精确修改代码，只改动必要部分。",
            GenerationMode.REFACTOR: "请在保持功能不变的前提下重构代码，提升可维护性。",
            GenerationMode.TEST: "请生成相应的测试代码。"
        }

        prompt = f"""你是 **Coder Agent（编码员）**，负责生成高质量代码。

{context}

{mode_instruction[mode]}

"""

        if original_code:
            prompt += f"""
参考现有代码：
```
{original_code[:1500]}
```
"""

        prompt += """

请生成代码（只输出代码，不要解释）：
```"
        # 代码开始

"""

        try:
            response = self._call_llm(prompt)
            # 提取代码块
            match = re.search(r'```(?:\w+)?\s*(.*?)```', response, re.DOTALL)
            if match:
                return match.group(1).strip()
            return response.strip()
        except Exception as e:
            log_step("error", f"LLM 生成失败: {e}")
            return ""

    def _generate_mock(
        self,
        context: str,
        original_code: str,
        mode: GenerationMode
    ) -> str:
        """模拟代码生成（无 API Key 时使用）"""
        task_match = re.search(r"任务：(.+)", context)
        task = task_match.group(1) if task_match else "代码生成"

        mock_code = f"""// Mock Code - {task}
// Mode: {mode.value}
// This is a placeholder for LLM-generated code

export function placeholder() {{
  // TODO: Implement {task}
  return null;
}}
"""
        return mock_code

    def _generate_patch(self, original: str, modified: str, file_path: str) -> str:
        """生成 unified diff 格式的 patch"""
        try:
            # 使用 difflib 生成 patch
            import difflib

            original_lines = original.splitlines(keepends=True)
            modified_lines = modified.splitlines(keepends=True)

            diff = difflib.unified_diff(
                original_lines,
                modified_lines,
                fromfile=file_path or "original",
                tofile=file_path or "modified",
                lineterm=""
            )

            patch_lines = list(diff)
            return "".join(patch_lines)
        except Exception as e:
            log_step("error", f"Patch 生成失败: {e}")
            return f"--- {file_path or 'original'}\n+++ {file_path or 'modified'}\n@@ -1 +1 @@\n"

    def _call_llm(self, prompt: str) -> str:
        """调用 LLM API"""
        import urllib.request
        import urllib.error

        base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
        url = f"{base_url}/chat/completions"

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 4096,
            "temperature": 0.3,
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result["choices"][0]["message"]["content"]
        except Exception as e:
            log_step("error", f"LLM 调用失败: {e}")
            raise

    def get_statistics(self) -> Dict:
        """获取生成统计"""
        total = len(self.generation_history)
        if total == 0:
            return {"total": 0}

        successful = sum(1 for r in self.generation_history if r.success)
        avg_time = sum(r.generation_time for r in self.generation_history) / total
        avg_diff = sum(r.diff_lines for r in self.generation_history) / total

        return {
            "total": total,
            "successful": successful,
            "success_rate": successful / total,
            "avg_generation_time": avg_time,
            "avg_diff_lines": avg_diff
        }


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Coder Agent")
    parser.add_argument("--task", type=str, required=True, help="任务描述")
    parser.add_argument("--file", type=str, default="", help="目标文件")
    parser.add_argument("--mode", type=str, choices=["initial", "revision", "refactor", "test"],
                       default="initial", help="生成模式")
    parser.add_argument("--feedback", type=str, default="", help="Reviewer 反馈")
    parser.add_argument("--api-key", type=str, default=os.environ.get("OPENAI_API_KEY", ""),
                       help="API Key")
    parser.add_argument("--model", type=str, default="gpt-4o", help="模型")
    parser.add_argument("--workspace", type=str, default=".", help="工作目录")
    args = parser.parse()

    coder = CoderAgent(
        api_key=args.api_key,
        model=args.model,
        workspace=args.workspace
    )

    mode = GenerationMode(args.mode)
    context = {"file_path": args.file} if args.file else {}

    result = coder.generate(
        task=args.task,
        context=context,
        mode=mode,
        reviewer_feedback=args.feedback
    )

    print(json.dumps({
        "success": result.success,
        "code_length": len(result.code),
        "diff_lines": result.diff_lines,
        "patch": result.patch[:500] + "..." if len(result.patch) > 500 else result.patch,
        "time": f"{result.generation_time:.2f}s"
    }, ensure_ascii=False, indent=2))
