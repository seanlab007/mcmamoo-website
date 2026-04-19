#!/usr/bin/env python3
"""
MaoAI HyperAgents — Multi-Agent Swarm (多代理集群)
─────────────────────────────────────────────────────────────────────────────
核心角色：
  Architect Agent  : 全局任务拆解，技术方案设计
  Coder Agent      : 代码编写，工具调用
  Reviewer Agent   : 代码审查，漏洞检测，拒绝不达标代码
  Test Agent       : 测试用例生成，TDD 执行

协作流程：
  [用户任务] → Architect(拆解) → Coder(编写) → Reviewer(审查) → Test(测试)
                ↑                                              ↓
                └──────────────── 通过否？──────────────────────┘

用法：
  from swarm import MultiAgentSwarm
  swarm = MultiAgentSwarm(api_key="...", workspace="/path/to/project")
  result = swarm.run("优化登录模块的错误处理")
"""

import sys
import json
import time
import os
import re
import subprocess
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass, field
from enum import Enum

# ─── 日志工具 ────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志到标准输出（flush=True 确保实时性）"""
    entry = {
        "type": step_type,
        "agent": "swarm",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 角色定义 ────────────────────────────────────────────────────────────────

class AgentRole(Enum):
    ARCHITECT = "architect"
    CODER = "coder"
    REVIEWER = "reviewer"
    TEST = "test"


@dataclass
class AgentMessage:
    """Agent 间消息传递的数据结构"""
    from_role: AgentRole
    to_role: AgentRole
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


@dataclass
class ReviewResult:
    """审查结果"""
    approved: bool
    issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    score: float = 0.0  # 0.0-1.0


@dataclass
class TestResult:
    """测试结果"""
    passed: bool
    test_count: int = 0
    failed_count: int = 0
    error_message: str = ""
    coverage: float = 0.0


# ─── Base Agent ──────────────────────────────────────────────────────────────

class BaseAgent:
    """所有 Agent 的基类"""

    def __init__(self, api_key: str = None, model: str = "gpt-4o", workspace: str = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = model
        self.workspace = workspace or os.getcwd()
        self.conversation: List[Dict] = []
        self.role: AgentRole = AgentRole.CODER

    def _setup_system_prompt(self, role: AgentRole):
        """设置角色专属的系统提示词"""
        prompts = {
            AgentRole.ARCHITECT: """你是 **Architect Agent（架构师）**。

**核心职责：**
- 理解用户需求，进行全局任务拆解
- 设计技术方案，输出结构化的实施步骤
- 不写代码，只出方案和决策

**输出格式（严格遵守）：**
[ANALYSIS]
- 需求理解：...
- 技术选型：...
- 风险评估：...
[/ANALYSIS]

[PLAN]
1. [步骤1描述]
2. [步骤2描述]
3. [步骤3描述]
[/PLAN]

[METRICS]
- 成功标准：...
- 验收条件：...
[/METRICS]

**关键原则：**
- 方案要具体，步骤要可执行
- 考虑边界情况和错误处理
- 明确每个步骤的输入输出""",

            AgentRole.CODER: """你是 **Coder Agent（程序员）**。

**核心职责：**
- 根据架构师方案编写代码
- 严格遵循 [ACTION] 格式调用工具
- 每次修改后立即验证

**ReAct 格式（严格遵守）：**
[THOUGHT]
你的思考过程（分析任务、选择工具、构造参数）
[/THOUGHT]

[ACTION]
{"name": "工具名", "args": {"参数1": "值1", ...}}
[/ACTION]

当工具返回结果后，继续分析或给出最终答案。
[FINAL]
你的完整回答和代码摘要
[/FINAL]

**可用工具：**
- read_file: 读取文件
- edit_file: 编辑文件
- run_shell: 执行命令
- web_search: 联网搜索
- run_npm_test: 运行测试

**关键原则：**
- 每次修改后立即验证
- 错误信息是最好的老师
- 保持代码风格一致""",

            AgentRole.REVIEWER: """你是 **Reviewer Agent（审查员）**。

**核心职责：**
- 严格审查 Coder 输出的代码
- 识别潜在 Bug、安全漏洞、性能问题
- 给出明确的通过/拒绝理由

**审查维度：**
1. **正确性**：逻辑是否正确？边界条件是否处理？
2. **安全性**：是否有注入风险？权限控制是否到位？
3. **性能**：是否有 O(n²) 或更差复杂度？资源泄漏？
4. **可维护性**：命名是否清晰？结构是否合理？
5. **测试覆盖**：核心逻辑是否有测试？

**输出格式（严格遵守）：**
[REVIEW]
{
  "approved": true/false,
  "score": 0.0-1.0,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}
[/REVIEW]

**关键原则：**
- 宁缺毋滥，不达标的代码必须拒绝
- 问题要具体，修复建议要可操作""",

            AgentRole.TEST: """你是 **Test Agent（测试员）**。

**核心职责：**
- 根据代码生成测试用例
- 执行 TDD 循环
- 验证修复是否有效

**输出格式（严格遵守）：**
[TEST_PLAN]
- 测试场景1：[描述]
- 测试场景2：[描述]
[/TEST_PLAN]

[TEST_CODE]
```typescript
// 测试代码
```
[/TEST_CODE]

[TEST_RESULT]
{
  "passed": true/false,
  "test_count": N,
  "failed_count": N,
  "coverage": 0.0-1.0
}
[/TEST_RESULT]

**关键原则：**
- 测试用例要覆盖核心路径
- 包含边界条件和异常场景
- 测试要独立、可重复"""
        }
        return prompts.get(role, prompts[AgentRole.CODER])

    def _call_llm(self, messages: List[Dict], max_tokens: int = 2048) -> str:
        """调用 LLM API"""
        if not self.api_key:
            return self._mock_response()

        import urllib.request
        import urllib.error

        base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
        url = f"{base_url}/chat/completions"

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.0,
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
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result["choices"][0]["message"]["content"]
        except Exception as e:
            log_step("error", f"LLM 调用失败: {e}", agent=self.role.value, category="logic")
            return f"[ERROR] LLM call failed: {e}"

    def _mock_response(self) -> str:
        """无 API Key 时的模拟响应"""
        if self.role == AgentRole.ARCHITECT:
            return "[ANALYSIS]\n需求理解：分析用户任务\n技术选型：采用分步骤实现\n[/ANALYSIS]\n\n[PLAN]\n1. 理解需求\n2. 编写代码\n3. 测试验证\n[/PLAN]"
        elif self.role == AgentRole.REVIEWER:
            return "[REVIEW]\n{\n  \"approved\": true,\n  \"score\": 0.9,\n  \"issues\": [],\n  \"suggestions\": []\n}\n[/REVIEW]"
        elif self.role == AgentRole.TEST:
            return "[TEST_RESULT]\n{\n  \"passed\": true,\n  \"test_count\": 5,\n  \"failed_count\": 0,\n  \"coverage\": 0.85\n}\n[/TEST_RESULT]"
        else:
            return "[FINAL]\n代码已完成编写。\n[/FINAL]"

    def think(self, user_input: str, context: Dict = None) -> str:
        """Agent 思考并返回响应"""
        self.conversation = [
            {"role": "system", "content": self._setup_system_prompt(self.role)}
        ]
        if context:
            self.conversation.append({"role": "system", "content": f"上下文信息：{json.dumps(context, ensure_ascii=False)}"})
        self.conversation.append({"role": "user", "content": user_input})

        log_step("thought", f"{self.role.value} 正在思考...", agent=self.role.value)
        response = self._call_llm(self.conversation)
        log_step("observation", f"{self.role.value} 思考完成", agent=self.role.value, response_length=len(response))

        return response

    def parse_review(self, text: str) -> ReviewResult:
        """解析审查结果"""
        match = re.search(r"\[REVIEW\]\s*(\{.*?\})\s*\[/REVIEW\]", text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                return ReviewResult(
                    approved=data.get("approved", False),
                    issues=data.get("issues", []),
                    suggestions=data.get("suggestions", []),
                    score=data.get("score", 0.0)
                )
            except json.JSONDecodeError:
                pass
        return ReviewResult(approved=True, score=0.5)


# ─── Architect Agent ────────────────────────────────────────────────────────

class ArchitectAgent(BaseAgent):
    """架构师 Agent - 任务拆解和技术方案设计"""

    def __init__(self, api_key: str = None, model: str = "gpt-4o", workspace: str = None):
        super().__init__(api_key, model, workspace)
        self.role = AgentRole.ARCHITECT

    def design(self, task: str) -> Dict[str, Any]:
        """设计技术方案"""
        log_step("start", f"Architect 开始任务拆解: {task[:80]}...", agent="architect")

        response = self.think(f"请分析以下任务并给出技术方案：\n{task}")

        # 解析方案
        plan = {"task": task, "steps": [], "metrics": {}, "raw": response}

        analysis_match = re.search(r"\[ANALYSIS\](.*?)\[/ANALYSIS\]", response, re.DOTALL)
        if analysis_match:
            plan["analysis"] = analysis_match.group(1).strip()

        plan_match = re.search(r"\[PLAN\](.*?)\[/PLAN\]", response, re.DOTALL)
        if plan_match:
            steps = []
            for line in plan_match.group(1).strip().splitlines():
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith("-")):
                    steps.append(line)
            plan["steps"] = steps

        metrics_match = re.search(r"\[METRICS\](.*?)\[/METRICS\]", response, re.DOTALL)
        if metrics_match:
            plan["metrics"] = {"success_criteria": metrics_match.group(1).strip()}

        log_step("done", f"Architect 方案设计完成，共 {len(plan['steps'])} 个步骤",
                agent="architect", steps_count=len(plan["steps"]), plan=plan)

        return plan


# ─── Coder Agent ─────────────────────────────────────────────────────────────

class CoderAgent(BaseAgent):
    """程序员 Agent - 代码编写和修改"""

    def __init__(self, api_key: str = None, model: str = "gpt-4o", workspace: str = None):
        super().__init__(api_key, model, workspace)
        self.role = AgentRole.CODER
        self.max_rounds = 5

    def code(self, task: str, plan: Dict = None, previous_issues: List[str] = None) -> Dict[str, Any]:
        """执行编码任务"""
        context = {}
        if plan:
            context["plan"] = json.dumps(plan, ensure_ascii=False)
        if previous_issues:
            context["previous_issues"] = "\n".join(f"- {i}" for i in previous_issues)

        user_input = f"任务：{task}\n"
        if context:
            user_input += f"\n上下文：\n{json.dumps(context, ensure_ascii=False, indent=2)}\n"
        if previous_issues:
            user_input += f"\n之前的审查问题（请修复）：\n" + "\n".join(f"- {i}" for i in previous_issues)

        log_step("action", f"Coder 开始编写代码...", agent="coder")

        response = self.think(user_input, context)
        self.conversation.append({"role": "assistant", "content": response})

        # 解析 ReAct 输出
        actions = []
        final_answer = None

        for action_match in re.finditer(r"\[ACTION\]\s*(\{.*?\})\s*\[/ACTION\]", response, re.DOTALL):
            try:
                action = json.loads(action_match.group(1))
                actions.append(action)
                log_step("action", f"执行工具: {action.get('name')}", agent="coder",
                        tool=action.get("name"), args=action.get("args"))
            except json.JSONDecodeError:
                pass

        final_match = re.search(r"\[FINAL\](.*?)\[/FINAL\]", response, re.DOTALL)
        if final_match:
            final_answer = final_match.group(1).strip()

        return {
            "response": response,
            "actions": actions,
            "final_answer": final_answer,
            "conversation": self.conversation
        }

    def execute_action(self, action: Dict) -> Dict:
        """执行单个工具调用"""
        tool_name = action.get("name", "")
        args = action.get("args", {})

        if tool_name == "read_file":
            return self._read_file(args)
        elif tool_name == "run_shell":
            return self._run_shell(args)
        elif tool_name == "web_search":
            return self._web_search(args)
        elif tool_name == "run_npm_test":
            return self._run_npm_test(args)
        else:
            return {"success": False, "output": "", "error": f"Unknown tool: {tool_name}"}

    def _read_file(self, args: Dict) -> Dict:
        """读取文件"""
        file_path = args.get("path", "")
        try:
            full_path = os.path.join(self.workspace, file_path) if not os.path.isabs(file_path) else file_path
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            return {"success": True, "output": content[:3000]}
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def _run_shell(self, args: Dict) -> Dict:
        """执行 Shell 命令"""
        command = args.get("command", "")
        try:
            result = subprocess.run(
                command, shell=True, cwd=self.workspace,
                capture_output=True, text=True, timeout=60
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout[-2000:],
                "error": None if result.returncode == 0 else result.stderr[-500:]
            }
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def _web_search(self, args: Dict) -> Dict:
        """联网搜索"""
        query = args.get("query", "")
        log_step("action", f"联网搜索: {query}", agent="coder")
        return {"success": True, "output": f"[模拟搜索] 关于 {query} 的信息..."}

    def _run_npm_test(self, args: Dict) -> Dict:
        """运行测试"""
        try:
            result = subprocess.run(
                "npm test".split(), cwd=self.workspace,
                capture_output=True, text=True, timeout=60
            )
            return {"success": result.returncode == 0, "output": result.stdout[-1000:]}
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}


# ─── Reviewer Agent ──────────────────────────────────────────────────────────

class ReviewerAgent(BaseAgent):
    """审查员 Agent - 代码审查和质量把关"""

    def __init__(self, api_key: str = None, model: str = "gpt-4o", workspace: str = None):
        super().__init__(api_key, model, workspace)
        self.role = AgentRole.REVIEWER

    def review(self, code: str, context: Dict = None) -> ReviewResult:
        """审查代码"""
        user_input = f"请审查以下代码：\n\n```\n{code[:3000]}\n```"
        if context:
            user_input += f"\n\n上下文信息：{json.dumps(context, ensure_ascii=False)}"

        log_step("action", "Reviewer 开始审查代码...", agent="reviewer")

        response = self.think(user_input)
        result = self.parse_review(response)

        log_step("score", f"审查完成，评分: {result.score:.2f}, {'通过' if result.approved else '拒绝'}",
                agent="reviewer", approved=result.approved, score=result.score,
                issues_count=len(result.issues), suggestions_count=len(result.suggestions))

        return result


# ─── Test Agent ─────────────────────────────────────────────────────────────

class TestAgent(BaseAgent):
    """测试员 Agent - 测试用例生成和执行"""

    def __init__(self, api_key: str = None, model: str = "gpt-4o", workspace: str = None):
        super().__init__(api_key, model, workspace)
        self.role = AgentRole.TEST

    def generate_tests(self, code: str, task: str) -> Dict[str, Any]:
        """生成测试用例"""
        user_input = f"任务：{task}\n\n代码：\n```\n{code[:3000]}\n```"

        log_step("action", "Test Agent 生成测试用例...", agent="test")

        response = self.think(user_input)

        # 解析测试结果
        test_code = ""
        test_match = re.search(r"\[TEST_CODE\](.*?)\[/TEST_CODE\]", response, re.DOTALL)
        if test_match:
            test_code = test_match.group(1).strip()

        test_result_match = re.search(r"\[TEST_RESULT\]\s*(\{.*?\})\s*\[/TEST_RESULT\]", response, re.DOTALL)
        test_result = TestResult(passed=False)
        if test_result_match:
            try:
                data = json.loads(test_result_match.group(1))
                test_result = TestResult(
                    passed=data.get("passed", False),
                    test_count=data.get("test_count", 0),
                    failed_count=data.get("failed_count", 0),
                    coverage=data.get("coverage", 0.0)
                )
            except json.JSONDecodeError:
                pass

        log_step("score", f"测试完成: {test_result.test_count} 个测试, {test_result.failed_count} 个失败",
                agent="test", passed=test_result.passed,
                test_count=test_result.test_count, failed_count=test_result.failed_count,
                coverage=test_result.coverage)

        return {
            "test_code": test_code,
            "test_result": test_result,
            "response": response
        }

    def create_reproducer(self, bug_description: str, code: str) -> Dict[str, Any]:
        """创建 Bug 复现用例（Reproducer）"""
        user_input = f"请为以下 Bug 创建复现测试用例：\n\nBug 描述：{bug_description}\n\n相关代码：\n```\n{code[:3000]}\n```"

        log_step("action", f"Test Agent 创建 Reproducer: {bug_description[:50]}...", agent="test")

        response = self.think(user_input)

        # 提取复现用例代码
        reproducer_code = ""
        test_match = re.search(r"\[TEST_CODE\](.*?)\[/TEST_CODE\]", response, re.DOTALL)
        if test_match:
            reproducer_code = test_match.group(1).strip()

        log_step("done", "Reproducer 测试用例生成完成", agent="test", has_code=bool(reproducer_code))

        return {
            "reproducer_code": reproducer_code,
            "response": response
        }


# ─── Multi-Agent Swarm ──────────────────────────────────────────────────────

class MultiAgentSwarm:
    """
    多代理集群 - 协调所有角色完成复杂任务

    工作流程：
    1. Architect 拆解任务
    2. Coder 按方案编写代码
    3. Reviewer 审查代码
    4. 如果审查不通过 → Coder 修复 → 重复 3-4
    5. Test 执行测试验证
    6. 循环直到所有角色通过
    """

    def __init__(self, api_key: str = None, model: str = "gpt-4o", workspace: str = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = model
        self.workspace = workspace or os.getcwd()

        # 初始化各角色 Agent
        self.architect = ArchitectAgent(api_key, model, workspace)
        self.coder = CoderAgent(api_key, model, workspace)
        self.reviewer = ReviewerAgent(api_key, model, workspace)
        self.test = TestAgent(api_key, model, workspace)

        self.max_iterations = 3  # 最大评审-修复循环次数

    def run(self, task: str) -> Dict[str, Any]:
        """
        运行完整的多代理协作流程

        Returns:
            {
                "success": bool,
                "answer": str,
                "iterations": int,
                "review_results": [ReviewResult],
                "test_results": [TestResult]
            }
        """
        log_step("start", f"Multi-Agent Swarm 启动: {task[:80]}", task=task)

        result = {
            "success": False,
            "answer": "",
            "iterations": 0,
            "review_results": [],
            "test_results": [],
            "final_code": ""
        }

        # Step 1: Architect 设计方案
        log_step("thought", "🧠 Architect 分析任务，设计技术方案...", agent="swarm")
        plan = self.architect.design(task)
        log_step("iteration", f"方案设计完成，共 {len(plan['steps'])} 个步骤",
                agent="swarm", steps=plan["steps"])

        # Step 2-4: Coder → Reviewer 循环
        all_issues = []
        for iteration in range(1, self.max_iterations + 1):
            result["iterations"] = iteration
            log_step("iteration", f"🔄 第 {iteration} 轮评审循环开始", agent="swarm", iteration=iteration)

            # Coder 编写代码
            log_step("thought", "💻 Coder 根据方案编写代码...", agent="swarm")
            coding_result = self.coder.code(task, plan, all_issues if all_issues else None)

            # 提取代码（从最终答案或对话历史）
            code = coding_result.get("final_answer", "") or ""
            if not code and coding_result.get("conversation"):
                # 从对话中提取最后一个 assistant 消息
                for msg in reversed(coding_result["conversation"]):
                    if msg["role"] == "assistant":
                        code = msg["content"]
                        break

            result["final_code"] = code

            # Reviewer 审查代码
            log_step("thought", "🔍 Reviewer 审查代码质量...", agent="swarm")
            review_result = self.reviewer.review(code, {"plan": plan})

            result["review_results"].append(review_result)

            if review_result.approved and review_result.score >= 0.7:
                log_step("score", f"✅ Reviewer 通过！评分: {review_result.score:.2f}",
                        agent="swarm", approved=True, score=review_result.score)
                break
            else:
                all_issues = review_result.issues + review_result.suggestions
                log_step("iteration", f"❌ Reviewer 拒绝，评分: {review_result.score:.2f}，需修复 {len(all_issues)} 个问题",
                        agent="swarm", approved=False, score=review_result.score, issues=all_issues)

        # Step 5: Test 执行测试
        if result["review_results"][-1].approved:
            log_step("thought", "🧪 Test Agent 执行测试验证...", agent="swarm")
            test_result = self.test.generate_tests(result["final_code"], task)
            result["test_results"].append(test_result["test_result"])

            if test_result["test_result"].passed:
                result["success"] = True
                result["answer"] = f"✅ 任务完成！\n\n代码审查：{result['review_results'][-1].score:.0%} 通过\n测试覆盖：{test_result['test_result'].coverage:.0%}\n评审循环：{result['iterations']} 轮"
                log_step("done", "🎉 任务完成！所有检查通过", agent="swarm", success=True)
            else:
                result["answer"] = f"⚠️ 代码审查通过，但测试未通过：{test_result['test_result'].failed_count} 个失败"
                log_step("iteration", "⚠️ 测试未通过，需进一步调试", agent="swarm", passed=False)
        else:
            result["answer"] = f"❌ 代码审查未通过（评分: {result['review_results'][-1].score:.2f}），已达到最大循环次数"
            log_step("error", "任务失败：代码审查未通过", agent="swarm", success=False)

        return result


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Multi-Agent Swarm")
    parser.add_argument("--task", type=str, default="", help="任务描述")
    parser.add_argument("--model", type=str, default=os.environ.get("OPENAI_MODEL", "gpt-4o"), help="模型")
    parser.add_argument("--workspace", type=str, default=os.environ.get("WORKSPACE", "."), help="工作目录")
    parser.add_argument("--api-key", type=str, default=os.environ.get("OPENAI_API_KEY", ""), help="API Key")
    parser.add_argument("--iterations", type=int, default=3, help="最大评审循环次数")
    args = parser.parse_args()

    if not args.task:
        log_step("error", "缺少 --task 参数", category="logic")
        sys.exit(1)

    swarm = MultiAgentSwarm(
        api_key=args.api_key,
        model=args.model,
        workspace=args.workspace
    )
    swarm.max_iterations = args.iterations

    try:
        result = swarm.run(args.task)
        log_step("done", "Multi-Agent Swarm 执行完成",
                success=result["success"],
                iterations=result["iterations"],
                final_answer=result["answer"])
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        log_step("error", f"未预期错误: {e}", category="logic")
        sys.exit(1)
