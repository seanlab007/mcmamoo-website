#!/usr/bin/env python3
"""
Claude Code Local Adapter — MaoAI TriadLoop Coder 层
─────────────────────────────────────────────────────────────────────────────
将 Anthropic Claude Code SDK（@anthropic-ai/claude-code）的 Python 接口
集成到 TriadLoop 的 Coder Agent 中。

两种运行模式：
  1. claude-code-local  → 调用本地已安装的 claude-code CLI（npx claude）
     - 具备完整工具链：文件读写、shell 执行、代码搜索
     - 真正的 Agentic 编码能力（Write/Edit/Bash）
     - 需要 ANTHROPIC_API_KEY 环境变量

  2. claude-api         → 直接调用 Anthropic Messages API
     - 纯文本代码生成
     - 无文件工具，但速度更快
     - 同样需要 ANTHROPIC_API_KEY

环境变量：
  ANTHROPIC_API_KEY    Anthropic API Key
  CLAUDE_MODEL         模型名，默认 claude-3-5-sonnet-20241022
  CLAUDE_CODE_MODE     local | api，默认 local（如 claude-code CLI 可用）
  CLAUDE_MAX_TOKENS    最大 Token，默认 8192

MAOAI_THINKING_PROTOCOL 对应角色：
  Coder (Claude) → 生成原子化 Patch，负责代码实现与重构
"""

import os
import sys
import json
import time
import subprocess
import tempfile
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List

# ─── 常量 ────────────────────────────────────────────────────────────────────

CLAUDE_DEFAULT_MODEL = "claude-3-5-sonnet-20241022"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_API_VERSION = "2023-06-01"

CODER_SYSTEM_PROMPT = """你是 MaoAI TriadLoop 的 Coder（编码员）。遵循 MAOAI_THINKING_PROTOCOL 三权分立原则。

你的职责：
1. 生成高质量、可执行的代码
2. 根据 Reviewer 反馈精准修复问题（外科手术式，不要重写整个文件）
3. 输出 Unified Diff 格式的 Patch（当修改已有代码时）
4. 在 <thought> 标签内展示推理过程

输出格式：
- 新文件：直接输出完整代码
- 修改已有文件：输出 Unified Diff，格式如下：
  ```diff
  --- a/path/to/file.py
  +++ b/path/to/file.py
  @@ -行号,行数 +行号,行数 @@
   context line
  -removed line
  +added line
  ```

风格要求：
- 代码注释用中文
- TypeScript 项目使用严格类型
- 函数必须有文档字符串
- 错误处理不能省略
"""


# ─── 日志 ────────────────────────────────────────────────────────────────────

def _log(step: str, msg: str = "", **kwargs):
    entry = {
        "type": step,
        "agent": "claude_code_adapter",
        "message": msg,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 模式检测 ────────────────────────────────────────────────────────────────

def _detect_mode() -> str:
    """
    自动检测可用模式：
    - 如果 claude-code CLI 或 npx claude 可用 → local
    - 否则 → api
    """
    preferred = os.environ.get("CLAUDE_CODE_MODE", "auto")
    if preferred in ("local", "api"):
        return preferred

    # 检查 claude-code 是否已安装
    try:
        result = subprocess.run(
            ["npx", "--yes", "claude", "--version"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            _log("claude_mode_detect", "检测到 claude-code CLI，使用 local 模式", mode="local")
            return "local"
    except Exception:
        pass

    _log("claude_mode_detect", "claude-code CLI 不可用，使用 API 模式", mode="api")
    return "api"


# ─── Claude Code Local 模式（完整 Agentic 能力）────────────────────────────────

def claude_code_local(
    task: str,
    workspace: str = None,
    context: Dict[str, Any] = None,
    api_key: str = None,
    model: str = None,
    max_turns: int = 10,
    timeout: int = 300,
) -> Dict[str, Any]:
    """
    通过 claude-code CLI 以 Agentic 模式生成/修改代码。

    Claude Code 具有完整工具链：
    - Read / Write / Edit 文件
    - Bash 执行命令
    - 代码搜索和理解

    返回：
    {
      "success": bool,
      "code": str,         # 生成的代码（新文件完整内容）
      "patch": str,        # Unified Diff（修改已有文件时）
      "files_modified": [], # 修改的文件列表
      "thought": str,      # Claude 的思考过程
      "mode": "claude-local"
    }
    """
    _api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    _model = model or os.environ.get("CLAUDE_MODEL", CLAUDE_DEFAULT_MODEL)
    _workspace = workspace or os.getcwd()

    if not _api_key:
        _log("claude_warn", "ANTHROPIC_API_KEY 未配置，降级到 API 模式")
        return claude_code_api(task, workspace, context, api_key, model)

    _log("claude_local_start", f"Claude Code Local 启动: {task[:60]}...", workspace=_workspace)

    # 构建提示词（注入上下文）
    context_desc = _format_context(context)
    full_prompt = f"""{CODER_SYSTEM_PROMPT}

{context_desc}

---
任务：{task}

请在工作区 {_workspace} 中完成此任务。
优先使用原子化修改（Edit 工具），而非重写整个文件。
完成后，总结修改了哪些文件以及主要改动。
"""

    # 写入临时 prompt 文件（避免 shell 注入）
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(full_prompt)
        prompt_file = f.name

    try:
        env = os.environ.copy()
        env["ANTHROPIC_API_KEY"] = _api_key

        # claude-code CLI: npx claude --print --model <model> < prompt.txt
        result = subprocess.run(
            [
                "npx", "--yes", "claude",
                "--print",                      # 非交互模式，输出后退出
                "--model", _model,
                "--max-turns", str(max_turns),
            ],
            stdin=open(prompt_file, "r", encoding="utf-8"),
            capture_output=True,
            text=True,
            cwd=_workspace,
            env=env,
            timeout=timeout,
        )

        if result.returncode != 0:
            _log("claude_local_error", f"claude-code 退出码 {result.returncode}: {result.stderr[:300]}")
            # 降级到 API 模式
            return claude_code_api(task, workspace, context, api_key, model)

        output = result.stdout
        _log("claude_local_success", f"Claude Code 完成: {len(output)} 字符输出")

        # 从输出中提取代码和 Patch
        code, patch = _extract_code_and_patch(output)

        return {
            "success": True,
            "code": code,
            "patch": patch,
            "files_modified": _extract_modified_files(output),
            "thought": _extract_thought(output),
            "raw_output": output,
            "mode": "claude-local",
            "model": _model,
        }

    except subprocess.TimeoutExpired:
        _log("claude_local_timeout", f"Claude Code 执行超时 ({timeout}s)")
        return claude_code_api(task, workspace, context, api_key, model)
    except Exception as e:
        _log("claude_local_error", f"执行异常: {e}")
        return claude_code_api(task, workspace, context, api_key, model)
    finally:
        try:
            os.unlink(prompt_file)
        except Exception:
            pass


# ─── Claude API 模式（纯文本生成）────────────────────────────────────────────

def claude_code_api(
    task: str,
    workspace: str = None,
    context: Dict[str, Any] = None,
    api_key: str = None,
    model: str = None,
    max_tokens: int = None,
) -> Dict[str, Any]:
    """
    通过 Anthropic Messages API 生成代码（无 Agentic 工具）。

    当 claude-code CLI 不可用时的 fallback。
    """
    _api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    _model = model or os.environ.get("CLAUDE_MODEL", CLAUDE_DEFAULT_MODEL)
    _max_tokens = max_tokens or int(os.environ.get("CLAUDE_MAX_TOKENS", "8192"))

    if not _api_key:
        _log("claude_api_error", "ANTHROPIC_API_KEY 未配置")
        return {"success": False, "code": "", "patch": "", "mode": "error"}

    context_desc = _format_context(context)
    user_message = f"""{context_desc}

任务：{task}

工作区：{workspace or os.getcwd()}

请生成代码。修改已有文件时输出 Unified Diff。
"""

    payload = {
        "model": _model,
        "max_tokens": _max_tokens,
        "system": CODER_SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_message}],
    }

    _log("claude_api_start", f"Claude API 调用: {_model}", task=task[:50])

    try:
        req = urllib.request.Request(
            CLAUDE_API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-api-key": _api_key,
                "anthropic-version": CLAUDE_API_VERSION,
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            text = data["content"][0]["text"]

            code, patch = _extract_code_and_patch(text)

            _log("claude_api_success", f"Claude API 完成: {len(text)} 字符", model=_model)

            return {
                "success": True,
                "code": code,
                "patch": patch,
                "files_modified": [],
                "thought": _extract_thought(text),
                "raw_output": text,
                "mode": "claude-api",
                "model": _model,
            }

    except urllib.error.HTTPError as e:
        err = e.read().decode()[:300]
        _log("claude_api_error", f"HTTP {e.code}: {err}")
        return {"success": False, "code": "", "patch": "", "mode": "error", "error": err}
    except Exception as e:
        _log("claude_api_error", f"调用异常: {e}")
        return {"success": False, "code": "", "patch": "", "mode": "error", "error": str(e)}


# ─── 统一入口 ────────────────────────────────────────────────────────────────

def claude_generate(
    task: str,
    workspace: str = None,
    context: Dict[str, Any] = None,
    api_key: str = None,
    model: str = None,
    force_mode: str = None,  # None | "local" | "api"
) -> Dict[str, Any]:
    """
    Claude Code 统一生成入口。

    自动检测并选择最佳模式：
    - claude-local: 完整 Agentic 能力（有工具链）
    - claude-api: 纯文本生成（降级）
    """
    mode = force_mode or _detect_mode()

    if mode == "local":
        return claude_code_local(task, workspace, context, api_key, model)
    else:
        return claude_code_api(task, workspace, context, api_key, model)


def is_claude_available(api_key: str = None) -> bool:
    """检查 Claude API 是否可用"""
    key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    return bool(key)


# ─── 工具函数 ────────────────────────────────────────────────────────────────

def _format_context(context: Dict[str, Any] = None) -> str:
    if not context:
        return ""

    parts = []

    # Code RAG 上下文
    rag = context.get("code_rag", {})
    if rag.get("retrieved_chunks"):
        parts.append("【相关代码片段（Code RAG 检索）】")
        for chunk in rag["retrieved_chunks"][:3]:
            parts.append(f"// 文件: {chunk['file']} | 行: {chunk['lines']} | 相似度: {chunk.get('similarity', 0):.2f}")
            parts.append(chunk.get("preview", "")[:200])

    # 知识图谱上下文
    kg = context.get("knowledge_graph", {})
    if kg.get("related_components"):
        parts.append("【相关组件（知识图谱）】")
        for comp in kg["related_components"][:3]:
            parts.append(f"- {comp}")

    # 语言
    if context.get("language"):
        parts.append(f"编程语言：{context['language']}")

    return "\n".join(parts)


def _extract_code_and_patch(text: str):
    """从输出中提取代码和 Patch"""
    import re

    # 提取 diff/patch
    diff_match = re.search(r"```diff\s*([\s\S]*?)```", text)
    patch = diff_match.group(1).strip() if diff_match else ""

    # 提取代码块（非 diff）
    code_blocks = re.findall(r"```(?!diff)(\w*)\s*([\s\S]*?)```", text)
    if code_blocks:
        # 取最长的代码块
        code = max(code_blocks, key=lambda x: len(x[1]))[1].strip()
    else:
        # 如果没有代码块，取整个文本
        code = text.strip()

    return code, patch


def _extract_modified_files(text: str) -> List[str]:
    """从输出中提取修改的文件列表"""
    import re
    files = []

    # 从 diff 头提取
    for match in re.finditer(r"^\+\+\+ b/(.+)$", text, re.MULTILINE):
        f = match.group(1)
        if f not in files:
            files.append(f)

    return files


def _extract_thought(text: str) -> str:
    """提取思维链（<thought> 标签或 <思考> 标签）"""
    import re
    thought_match = re.search(r"<(?:thought|思考)>([\s\S]*?)</(?:thought|思考)>", text)
    if thought_match:
        return thought_match.group(1).strip()
    return ""
