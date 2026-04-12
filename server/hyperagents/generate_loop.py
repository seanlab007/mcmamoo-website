#!/usr/bin/env python3
"""
MaoAI HyperAgents Engine — Manus Max 架构
─────────────────────────────────────────────────────────────────────────────
核心：ReAct (Reasoning + Acting) 自主循环 + 流式 JSON 日志输出
支持：Multi-Agent Swarm (多代理集群协作)

输出格式（每行 JSON，flush=True）：
  { "type": "start",      "task": "...", "timestamp": 1234567890 }
  { "type": "thought",    "round": 1, "content": "...", "timestamp": 1234567890 }
  { "type": "action",     "round": 1, "tool": "...", "args": {...}, "timestamp": 1234567890 }
  { "type": "observation","round": 1, "tool": "...", "success": true, "output": "...", "timestamp": 1234567890 }
  { "type": "score",      "round": 1, "score": 0.82, "reasoning": "...", "timestamp": 1234567890 }
  { "type": "patch",      "round": 2, "diff": "...", "timestamp": 1234567890 }
  { "type": "iteration",   "round": 2, "status": "improved|worse|same", "timestamp": 1234567890 }
  { "type": "error",      "category": "env|timeout|logic", "message": "...", "retry": true, "timestamp": 1234567890 }
  { "type": "done",       "answer": "...", "rounds": 3, "timestamp": 1234567890 }

  Multi-Agent Swarm 日志：
  { "type": "swarm_start", "task": "...", "agents": ["architect", "coder", "reviewer", "test"] }
  { "type": "swarm_step",  "agent": "architect|coder|reviewer|test", "step": "...", "status": "..." }
  { "type": "swarm_review","approved": true/false, "score": 0.85, "issues": [...] }
  { "type": "swarm_done",  "success": true, "iterations": 2, "answer": "..." }

用法：
  python3 generate_loop.py --task "优化登录逻辑" --domain coding --mode swarm --workspace /path/to/project
  python3 generate_loop.py --task "优化登录逻辑" --domain coding --mode react --workspace /path/to/project
"""

import sys
import json
import time
import os
import re
import subprocess
import tempfile
from datetime import datetime

# ─── 日志工具 ────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志到标准输出（flush=True 确保实时性）"""
    entry = {
        "type": step_type,
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 工具执行器 ─────────────────────────────────────────────────────────────

class ToolExecutor:
    """可扩展的工具执行器（映射 Python 函数到工具名）"""

    def __init__(self, workspace: str = None):
        self.workspace = workspace or os.getcwd()
        self.tools = {
            "web_search": self._web_search,
            "run_code": self._run_code,
            "read_file": self._read_file,
            "read_project_structure": self._read_project_structure,
            "run_npm_test": self._run_npm_test,
            "build_verify": self._build_verify,
            "run_shell": self._run_shell,
        }

    def execute(self, tool_name: str, args: dict) -> dict:
        """执行工具并返回结果字典"""
        if tool_name not in self.tools:
            return {"success": False, "output": "", "error": f"Unknown tool: {tool_name}"}
        try:
            return self.tools[tool_name](args)
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def _web_search(self, args: dict) -> dict:
        """模拟联网搜索（实际集成 Tavily/Serper API）"""
        query = args.get("query", "")
        log_step("action", f"执行联网搜索: {query}", tool="web_search", args=args)
        # 实际生产环境请替换为 Tavily API:
        # from tavily import TavilyClient; client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
        # results = client.search(query=query, max_results=args.get("max_results", 5))
        output = f"[模拟搜索结果] 关于「{query}」的相关信息...（生产环境请配置 TAVILY_API_KEY）"
        return {"success": True, "output": output}

    def _run_code(self, args: dict) -> dict:
        """在沙箱中执行 Python/JS 代码（实际集成 E2B）"""
        code = args.get("code", "")
        language = args.get("language", "python")
        log_step("action", f"执行 {language} 代码...", tool="run_code", args={"language": language, "code_length": len(code)})
        # 实际生产环境请使用 E2B 代码执行沙箱:
        # from e2b import Sandbox; sandbox = Sandbox()
        # result = await sandbox.run_code(language=language, code=code)
        output = f"[模拟执行] {language} 代码执行成功（生产环境请配置 E2B_API_KEY）"
        return {"success": True, "output": output}

    def _read_file(self, args: dict) -> dict:
        """读取项目文件"""
        file_path = args.get("path", "")
        max_lines = args.get("max_lines", 100)
        recursive = args.get("recursive", False)
        log_step("action", f"读取文件: {file_path}", tool="read_file", args=args)
        try:
            full_path = os.path.join(self.workspace, file_path) if not os.path.isabs(file_path) else file_path
            if not os.path.exists(full_path):
                return {"success": False, "output": "", "error": f"File not found: {file_path}"}
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = [f.readline() for _ in range(max_lines)]
                content = "".join(lines)
            return {"success": True, "output": content}
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def _read_project_structure(self, args: dict) -> dict:
        """递归扫描项目目录结构"""
        root = args.get("root", self.workspace)
        max_depth = args.get("max_depth", 3)
        extensions = args.get("extensions", [".ts", ".tsx", ".py", ".js", ".jsx", ".json"])
        log_step("action", f"扫描项目结构: {root}", tool="read_project_structure", args=args)

        def _scan(path: str, depth: int = 0) -> list:
            if depth > max_depth:
                return []
            items = []
            try:
                for entry in sorted(os.scandir(path), key=lambda e: (not e.is_dir(), e.name)):
                    if entry.name.startswith("."):
                        continue
                    if entry.name in ["node_modules", "__pycache__", ".git", "dist", "build", ".next", "venv"]:
                        continue
                    rel = os.path.relpath(entry.path, root)
                    if entry.is_dir():
                        items.append({"type": "dir", "path": rel})
                        items.extend(_scan(entry.path, depth + 1))
                    else:
                        if any(rel.endswith(ext) for ext in extensions):
                            items.append({"type": "file", "path": rel})
            except PermissionError:
                pass
            return items

        structure = _scan(root)
        output = json.dumps(structure, ensure_ascii=False)
        return {"success": True, "output": output}

    def _run_npm_test(self, args: dict) -> dict:
        """运行项目测试套件（TDD 自我修正核心）"""
        test_args = args.get("args", "")
        log_step("action", f"运行测试套件: npm test {test_args}", tool="run_npm_test", args=args)
        try:
            result = subprocess.run(
                f"npm test -- {test_args}".split(),
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=60
            )
            # 解析测试结果
            passed = failed = 0
            for line in result.stdout.splitlines():
                m = re.search(r"PASS|passed", line, re.IGNORECASE)
                if m: passed += 1
                m = re.search(r"FAIL|failed", line, re.IGNORECASE)
                if m: failed += 1
            return {
                "success": result.returncode == 0,
                "output": result.stdout[:2000],
                "error": None if result.returncode == 0 else f"Exit code: {result.returncode}"
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "output": "", "error": "Test timeout (>60s)"}
        except FileNotFoundError:
            return {"success": False, "output": "", "error": "npm not found in PATH"}
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def _build_verify(self, args: dict) -> dict:
        """构建并验证项目能否成功编译"""
        build_cmd = args.get("command", "npm run build")
        log_step("action", f"执行构建验证: {build_cmd}", tool="build_verify", args=args)
        try:
            result = subprocess.run(
                build_cmd.split(),
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=120
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout[-2000:] if result.stdout else "",
                "error": None if result.returncode == 0 else result.stderr[-500:]
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "output": "", "error": "Build timeout (>120s)"}
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def _run_shell(self, args: dict) -> dict:
        """执行任意 Shell 命令（高风险，请谨慎使用）"""
        command = args.get("command", "")
        log_step("action", f"执行 Shell: {command}", tool="run_shell", args={"command": command[:100]})
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=30
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout[-3000:],
                "error": None if result.returncode == 0 else result.stderr[-500:]
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "output": "", "error": "Shell timeout (>30s)"}
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}


# ─── ReAct 推理循环 ─────────────────────────────────────────────────────────

class ReActAgent:
    """
    ReAct (Reasoning + Acting) 自主代理引擎

    核心循环：
    Thought → Action → Observation → Score → (可选) Patch → Repeat → Final Answer
    """

    def __init__(self, api_key: str = None, model: str = "gpt-4o", workspace: str = None, domain: str = "general"):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = model
        self.workspace = workspace or os.getcwd()
        self.domain = domain
        self.tools = ToolExecutor(workspace=self.workspace)
        self.max_rounds = 8
        self.conversation = []
        self._setup_system_prompt()

    def _setup_system_prompt(self):
        domain_prompts = {
            "coding": """你是 **代码工程代理**，专注于优化、调试和重构代码。

**你的工作流程：**
1. 先用 read_project_structure 了解项目全貌
2. 用 read_file 阅读关键文件
3. 制定修改计划（Thought）
4. 实施修改（Action）
5. 用 run_npm_test 或 build_verify 验证（Observation）
6. 如果失败，根据错误信息自我修正（Patch）
7. 直到通过所有测试，给出最终答案

**关键原则：**
- 每次修改后立即验证，不要积累多个未验证的改动
- 优先理解代码结构和依赖，再动手修改
- 错误信息是最好的老师，仔细阅读再行动""",

            "research": """你是 **深度研究代理**，专注于联网搜索、信息整合和报告生成。

**你的工作流程：**
1. 理解研究问题，确定搜索关键词（Thought）
2. 执行 web_search 获取一手信息（Action）
3. 分析搜索结果，补充更多细节（Observation）
4. 整合信息，生成结构化报告（Final Answer）

**关键原则：**
- 多角度搜索，确保信息全面
- 交叉验证关键事实
- 引用信息源，注明出处""",

            "general": """你是 **通用助手代理**，擅长多领域任务处理。

**你的工作流程：**
1. 理解用户需求（Thought）
2. 决定使用哪个工具（Action）
3. 执行并观察结果（Observation）
4. 继续或给出最终答案（Final Answer）

**工具集：**
- web_search: 联网搜索
- read_file: 读取文件
- read_project_structure: 扫描项目结构
- run_code: 执行代码
- run_npm_test: 运行测试
- build_verify: 构建验证
- run_shell: 执行 Shell 命令"""
        }

        system = f"""你是 MaoAI HyperAgents Engine — Manus Max 架构下的自主代理。

{domain_prompts.get(self.domain, domain_prompts["general"])}

**ReAct 格式要求（严格遵守）：**

当需要使用工具时，必须输出：
[THOUGHT]
你的思考过程（分析任务、选择工具、构造参数）
[/THOUGHT]

[ACTION]
{{"name": "工具名", "args": {{"参数1": "值1", ...}}}}
[/ACTION]

当工具返回结果后，继续分析或给出最终答案。
当你确认已有足够信息回答问题时，输出：

[FINAL]
你的完整回答
[/FINAL]"""

        self.conversation = [{"role": "system", "content": system}]

    def _call_llm(self, max_tokens: int = 1024) -> str:
        """调用 OpenAI API（支持兼容 API）"""
        import urllib.request
        import urllib.error

        if not self.api_key:
            # 无 API Key 时返回模拟思考（用于测试）
            return "[THOUGHT]\n这是测试任务，模拟 ReAct 推理过程...\n[/THOUGHT]\n\n[ACTION]\n{\"name\": \"read_project_structure\", \"args\": {\"root\": \".\", \"max_depth\": 2}}\n[/ACTION]"

        base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
        url = f"{base_url}/chat/completions"

        payload = {
            "model": self.model,
            "messages": self.conversation,
            "max_tokens": max_tokens,
            "temperature": 0.0,
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise RuntimeError(f"OpenAI API Error {e.code}: {error_body}")
        except Exception as e:
            raise RuntimeError(f"LLM call failed: {e}")

    def _parse_llm_output(self, text: str) -> tuple:
        """解析 LLM 输出，提取 thought、action 和 final"""
        thought = ""
        action = None
        final = None

        thought_match = re.search(r"\[THOUGHT\](.*?)\[/THOUGHT\]", text, re.DOTALL | re.IGNORECASE)
        if thought_match:
            thought = thought_match.group(1).strip()

        action_match = re.search(r"\[ACTION\]\s*(\{.*?\})\s*\[/ACTION\]", text, re.DOTALL | re.IGNORECASE)
        if action_match:
            try:
                action = json.loads(action_match.group(1))
            except json.JSONDecodeError:
                action = None

        final_match = re.search(r"\[FINAL\](.*?)\[/FINAL\]", text, re.DOTALL | re.IGNORECASE)
        if final_match:
            final = final_match.group(1).strip()

        return thought, action, final

    def run(self, task: str) -> str:
        """运行完整 ReAct 循环"""
        log_step("start", f"开始执行任务: {task[:100]}", domain=self.domain, model=self.model, workspace=self.workspace)
        self.conversation.append({"role": "user", "content": task})

        for round_num in range(1, self.max_rounds + 1):
            log_step("thought", f"第 {round_num} 轮推理中...", round=round_num)

            # 调用 LLM
            try:
                response = self._call_llm()
            except Exception as e:
                log_step("error", f"LLM 调用失败: {e}", category="logic", retry=False, round=round_num)
                self.conversation.append({"role": "user", "content": f"Error: {e}"})
                continue

            self.conversation.append({"role": "assistant", "content": response})
            thought, action, final = self._parse_llm_output(response)

            if thought:
                log_step("thought", thought, round=round_num, raw=response[:500])

            if final:
                log_step("done", final, rounds=round_num)
                return final

            if action:
                tool_name = action.get("name", "")
                tool_args = action.get("args", {})

                log_step("action", f"调用工具: {tool_name}", round=round_num, tool=tool_name, args=tool_args)

                # 执行工具
                result = self.tools.execute(tool_name, tool_args)

                observation = (
                    f"[OBSERVATION]\n"
                    f"Tool: {tool_name}\n"
                    f"Success: {result['success']}\n"
                    f"Output: {result.get('output', '')[:1500]}\n"
                    f"Error: {result.get('error', '')}\n"
                    f"[/OBSERVATION]"
                )

                log_step(
                    "observation",
                    f"工具 {tool_name} {'成功' if result['success'] else '失败'}",
                    round=round_num,
                    tool=tool_name,
                    success=result["success"],
                    output=result.get("output", "")[:500],
                    error=result.get("error"),
                )

                # 根据结果打分（0-1）
                score = 1.0 if result["success"] else 0.0
                if result["success"]:
                    # 检查是否仍有改进空间
                    if "error" in result.get("output", "").lower() or result.get("error"):
                        score = 0.5
                log_step("score", f"本轮得分: {score}", round=round_num, score=score, reasoning=f"Based on tool execution result")

                self.conversation.append({"role": "user", "content": observation})
            else:
                # LLM 没有输出有效格式，提示它继续
                nudge = "[请继续。记住：需要工具时用 [ACTION]{{...}}[/ACTION]，完成时用 [FINAL]...[/FINAL]]"
                log_step("thought", "输出格式不完整，引导继续...", round=round_num)
                self.conversation.append({"role": "user", "content": nudge})

        log_step("done", "达到最大轮次限制", rounds=self.max_rounds)
        return "任务已达到最大推理轮次限制（8轮），建议拆分为更小的子任务。"


# ─── CLI 入口 ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI HyperAgents Engine")
    parser.add_argument("--task", type=str, default="", help="任务描述")
    parser.add_argument("--domain", type=str, default="general", choices=["coding", "research", "general"], help="领域")
    parser.add_argument("--model", type=str, default=os.environ.get("OPENAI_MODEL", "gpt-4o"), help="模型")
    parser.add_argument("--workspace", type=str, default=os.environ.get("WORKSPACE", "."), help="工作目录")
    parser.add_argument("--api-key", type=str, default=os.environ.get("OPENAI_API_KEY", ""), help="API Key")
    parser.add_argument("--mode", type=str, default="react", choices=["react", "swarm"], help="运行模式: react(单代理) 或 swarm(多代理)")
    args = parser.parse_args()

    if not args.task:
        log_step("error", "缺少 --task 参数", category="logic", retry=False)
        sys.exit(1)

    if args.mode == "swarm":
        # Multi-Agent Swarm 模式
        try:
            from agent.swarm import MultiAgentSwarm
        except ImportError:
            log_step("error", "swarm 模块未找到，请确保 agent/swarm.py 存在", category="logic")
            sys.exit(1)

        log_step("swarm_start", f"启动 Multi-Agent Swarm: {args.task[:80]}",
                mode="swarm", domain=args.domain, model=args.model)

        swarm = MultiAgentSwarm(
            api_key=args.api_key,
            model=args.model,
            workspace=args.workspace
        )

        try:
            result = swarm.run(args.task)
            log_step("swarm_done", "Multi-Agent Swarm 执行完成",
                    success=result["success"],
                    iterations=result["iterations"],
                    answer=result["answer"])
            sys.stdout.flush()
        except KeyboardInterrupt:
            log_step("error", "用户中断执行", category="env", retry=False)
            sys.exit(130)
        except Exception as e:
            log_step("error", f"未预期错误: {e}", category="logic", retry=False)
            sys.exit(1)
    else:
        # ReAct 单代理模式（原有逻辑）
        agent = ReActAgent(
            api_key=args.api_key,
            model=args.model,
            workspace=args.workspace,
            domain=args.domain,
        )

        try:
            answer = agent.run(args.task)
            sys.stdout.flush()
        except KeyboardInterrupt:
            log_step("error", "用户中断执行", category="env", retry=False)
            sys.exit(130)
        except Exception as e:
            log_step("error", f"未预期错误: {e}", category="logic", retry=False)
            sys.exit(1)
