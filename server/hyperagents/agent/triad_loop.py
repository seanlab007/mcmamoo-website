#!/usr/bin/env python3
"""
MaoAI HyperAgents — TriadLoop (三权分立博弈循环)
─────────────────────────────────────────────────────────────────────────────
核心架构：Coder ↔ Reviewer ↔ Validator 三权分立

     ┌─────────────────────────────────────────────────────────────────────┐
     │                        TRIAD LOOP                                   │
     │                                                                      │
     │   ┌────────┐     生成代码     ┌────────┐     审查反馈   ┌────────┐  │
     │   │ Coder  │ ─────────────→ │Reviewer│ ←─────────── │Validator│  │
     │   │ (Claude)│               │  (GPT) │              │(Pytest) │  │
     │   └────────┘               └────────┘              └────────┘  │
     │        ↑                        │                        │       │
     │        │                        │                        │       │
     │        └────────────────────────┴────────────────────────┘       │
     │                        循环直到全部通过                            │
     └─────────────────────────────────────────────────────────────────────┘

核心特点：
  1. 异构模型：Coder 用 Claude，Reviewer 用 GPT，Validator 用 Pytest
  2. 三权分立：执行权、审查权、验证权相互制衡
  3. 思维链追踪：<thought> 标签实时展示 AI 推理过程
  4. 收敛检测：识别改进停滞 + Patch 相似度检测，避免无效迭代
  5. 项目全景感知：自动注入相关组件上下文
"""

import json
import time
import os
import hashlib
import difflib
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum

from .coder_agent import CoderAgent, GenerationMode, GenerationResult
from .reviewer_agent import ReviewerAgent, ReviewResult
from .validator_agent import ValidatorAgent, ValidationResult, ValidationStatus

# ─── 新增：知识图谱支持 ────────────────────────────────────────────────────────
try:
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../utils"))
    from knowledge_graph import KnowledgeGraph
    HAS_KNOWLEDGE_GRAPH = True
except ImportError:
    HAS_KNOWLEDGE_GRAPH = False


def log_step(step_type: str, message: str = "", **kwargs):
    entry = {
        "type": step_type,
        "agent": "triad_loop",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


def log_thought(agent: str, thought: str, round_num: int = 0):
    """思维链追踪：实时展示 AI 推理过程"""
    log_step("thought", thought, agent=agent, round=round_num, tag="CoT")


class TriadStatus(Enum):
    RUNNING = "running"
    APPROVED = "approved"
    REJECTED = "rejected"
    TIMEOUT = "timeout"
    ERROR = "error"


@dataclass
class RoundResult:
    round_num: int
    coder_result: GenerationResult
    reviewer_result: ReviewResult
    validator_result: ValidationResult
    issues_remaining: List[str] = field(default_factory=list)

    @property
    def score(self) -> float:
        return self.reviewer_result.overall_score

    @property
    def passed_review(self) -> bool:
        return self.reviewer_result.approved

    @property
    def passed_validation(self) -> bool:
        return self.validator_result.success


@dataclass
class TriadLoopResult:
    status: TriadStatus
    total_rounds: int
    total_time: float
    final_score: float = 0.0
    final_code: str = ""
    reviewer_passed: bool = False
    validator_passed: bool = False
    round_results: List[RoundResult] = field(default_factory=list)
    feedback: str = ""
    converged: bool = False
    convergence_reason: str = ""
    patch_similarity: float = 0.0  # 新增：Patch 相似度

    @property
    def all_passed(self) -> bool:
        return (self.status == TriadStatus.APPROVED and
                self.reviewer_passed and self.validator_passed)


class TriadLoop:
    """
    三权分立博弈循环

    三个角色：
      1. Coder (Claude)：代码生成
      2. Reviewer (GPT)：逻辑审查 + 生成测试用例
      3. Validator (Pytest)：测试验证
    """

    def __init__(
        self,
        workspace: str = None,
        coder_api_key: str = None,
        reviewer_api_key: str = None,
        coder_model: str = "claude-3-5-sonnet",
        reviewer_model: str = "gpt-4o",
        max_iterations: int = 5,
        score_threshold: float = 0.8,
        convergence_threshold: float = 0.02,
        enable_thought_tracking: bool = True,
        enable_docker: bool = False,
        test_command: str = None,
        enable_knowledge_graph: bool = True  # 新增：启用知识图谱
    ):
        self.workspace = workspace or os.getcwd()
        self.coder_model = coder_model
        self.reviewer_model = reviewer_model
        self.enable_knowledge_graph = enable_knowledge_graph and HAS_KNOWLEDGE_GRAPH

        # 知识图谱实例（按需初始化）
        self._knowledge_graph: Optional["KnowledgeGraph"] = None

        # Patch 相似度历史（用于收敛检测）
        self._code_history: List[str] = []
        self.max_iterations = max_iterations
        self.score_threshold = score_threshold
        self.convergence_threshold = convergence_threshold
        self.enable_thought_tracking = enable_thought_tracking
        self.enable_docker = enable_docker
        self.test_command = test_command

        self.coder = CoderAgent(
            api_key=coder_api_key,
            model=coder_model,
            workspace=self.workspace,
            enable_thought_tracking=enable_thought_tracking
        )
        self.reviewer = ReviewerAgent(
            api_key=reviewer_api_key,
            model=reviewer_model,
            workspace=self.workspace
        )
        self.validator = ValidatorAgent(
            workspace=self.workspace,
            enable_docker=enable_docker
        )

        self.current_round = 0
        self.last_score = 0.0
        self.consecutive_no_improvement = 0
        self._consecutive_high_similarity = 0  # 新增：连续高相似度计数

    def _get_knowledge_graph_context(self, task: str) -> Dict[str, Any]:
        """
        获取知识图谱上下文 - 项目全景感知

        当修改某个文件时，自动注入相关的依赖组件代码
        """
        if not self.enable_knowledge_graph:
            return {}

        # 懒加载知识图谱
        if self._knowledge_graph is None:
            try:
                self._knowledge_graph = KnowledgeGraph(self.workspace)
                self._knowledge_graph.build(max_depth=3)
                log_step("knowledge_graph", "知识图谱构建完成",
                        nodes=len(self._knowledge_graph.nodes),
                        edges=len(self._knowledge_graph.edges))
            except Exception as e:
                log_step("knowledge_graph", f"知识图谱构建失败: {e}")
                return {}

        # 提取关键词（从任务描述中）
        keywords = [w for w in task.split() if len(w) > 3]

        related_context = {"related_components": [], "dependency_files": []}

        # 搜索相关组件
        for keyword in keywords:
            related = self._knowledge_graph.search(keyword, limit=5)
            for item in related:
                if item not in related_context["related_components"]:
                    related_context["related_components"].append(item)

        # 获取被修改文件的直接依赖
        target_files = []
        for keyword in keywords:
            matches = self._knowledge_graph.search(keyword, limit=3)
            for match in matches:
                node_data = match.get("node", {})
                if isinstance(node_data, dict):
                    fp = node_data.get("file_path", "")
                    if fp and fp not in target_files:
                        target_files.append(fp)

        # 获取这些文件的依赖
        for file_path in target_files[:5]:
            for edge in self._knowledge_graph.edges:
                if edge.file_path == file_path and edge.relation_type == "imports":
                    related_node = self._knowledge_graph.nodes.get(edge.from_node)
                    if related_node:
                        related_context["dependency_files"].append({
                            "name": related_node.name,
                            "file_path": related_node.file_path,
                            "relation": "imports"
                        })

        return related_context

    def _compute_patch_similarity(self, code1: str, code2: str) -> float:
        """
        计算两个代码片段的相似度（基于 difflib）

        用于收敛检测：如果连续两轮代码相似度 > 95%，认为陷入死循环
        """
        if not code1 or not code2:
            return 0.0

        # 移除空白差异
        seq = difflib.SequenceMatcher(None,
            ''.join(code1.split()),
            ''.join(code2.split()))
        return seq.ratio()

    def run(
        self,
        task: str,
        context: Dict[str, Any] = None,
        mode: str = "fix"
    ) -> TriadLoopResult:
        start_time = time.time()
        context = context or {}

        log_step("triad_start", f"三权分立启动: {task}",
                coder_model=self.coder_model,
                reviewer_model=self.reviewer_model,
                max_iterations=self.max_iterations,
                knowledge_graph=self.enable_knowledge_graph)

        log_thought("system", f"接收到任务: {task}", round_num=0)
        log_thought("coder", "正在分析任务需求，准备生成代码...", round_num=1)

        round_results = []
        current_code = ""
        current_mode = GenerationMode.FIX if mode == "fix" else GenerationMode.GENERATE

        # ═══════════════════════════════════════════════════════════════════════════
        # A. 项目全景感知：获取知识图谱上下文
        # ═══════════════════════════════════════════════════════════════════════════
        kg_context = self._get_knowledge_graph_context(task)
        if kg_context.get("related_components") or kg_context.get("dependency_files"):
            log_step("project_context",
                    f"注入 {len(kg_context.get('related_components', []))} 个相关组件",
                    components=kg_context.get("related_components", [])[:3])
            # 将知识图谱上下文合并到主 context
            context = {**context, "knowledge_graph": kg_context}

        while self.current_round < self.max_iterations:
            self.current_round += 1

            log_step("triad_round", f"第 {self.current_round} 轮开始",
                    round=self.current_round, total_rounds=self.max_iterations)

            # ═══════════════════════════════════════════════════════════════
            # 第一权：Coder 生成代码
            # ═══════════════════════════════════════════════════════════════

            log_thought("coder", f"开始第 {self.current_round} 轮代码生成...", round_num=self.current_round)

            coder_result = self.coder.generate(
                task=task,
                context=context,
                mode=current_mode,
                previous_code=current_code,
                feedback=self._build_feedback(round_results) if round_results else None
            )

            current_code = coder_result.code

            log_step("coder_generated", f"Coder 完成: {len(coder_result.code)} 字符",
                    round=self.current_round, mode=coder_result.mode.value)

            # ═══════════════════════════════════════════════════════════════
            # 第二权：Reviewer 审查 + 生成测试用例
            # ═══════════════════════════════════════════════════════════════

            log_thought("reviewer", "正在审查代码，识别潜在问题...", round_num=self.current_round)

            reviewer_result = self.reviewer.review(
                task=task,
                code=current_code,
                language=context.get("language", "python")
            )

            log_step("reviewer_reviewed",
                    f"Reviewer 完成: score={reviewer_result.overall_score:.2f}",
                    round=self.current_round,
                    approved=reviewer_result.approved,
                    issues=len(reviewer_result.issues))

            # ═══════════════════════════════════════════════════════════════════════════
            # A. 自生成测试用例：Reviewer 生成 Bug 复现测试
            # ═══════════════════════════════════════════════════════════════════════════
            test_result = self.reviewer.generate_test_cases(
                task=task,
                code=current_code,
                language=context.get("language", "python"),
                issues=reviewer_result.issues  # 传入已发现的问题
            )

            if test_result.get("success"):
                log_step("reviewer_test_cases",
                        f"生成 {len(test_result.get('test_cases', []))} 个测试用例")
            else:
                log_step("reviewer_test_cases", "测试用例生成失败，使用默认测试")

            # ═══════════════════════════════════════════════════════════════
            # 第三权：Validator 测试验证
            # ═══════════════════════════════════════════════════════════════

            log_thought("validator", "在沙箱中运行测试验证...", round_num=self.current_round)

            test_cases = []
            if test_result.get("success") and test_result.get("test_cases"):
                for tc in test_result["test_cases"]:
                    test_cases.append(type('TestCase', (), {
                        "name": tc.get("name", "unnamed"),
                        "code": tc.get("code", ""),
                        "language": context.get("language", "python"),
                        "expected_output": tc.get("expected", ""),
                        "timeout": tc.get("timeout", 30)
                    })())

            validator_result = self.validator.validate(
                code=current_code,
                language=context.get("language", "python"),
                test_command=self.test_command,
                test_cases=test_cases
            )

            log_step("validator_result",
                    f"验证{'通过' if validator_result.success else '失败'}",
                    status=validator_result.status.value,
                    passed=validator_result.passed,
                    failed=validator_result.failed,
                    errors=validator_result.errors,
                    duration=validator_result.duration)

            # ═══════════════════════════════════════════════════════════════
            # 判断是否通过
            # ═══════════════════════════════════════════════════════════════

            review_passed = (reviewer_result.approved and
                           reviewer_result.overall_score >= self.score_threshold)
            validation_passed = validator_result.success

            round_result = RoundResult(
                round_num=self.current_round,
                coder_result=coder_result,
                reviewer_result=reviewer_result,
                validator_result=validator_result,
                issues_remaining=[i.description for i in reviewer_result.issues]
            )
            round_results.append(round_result)

            # 三权全部通过 → 结束
            if review_passed and validation_passed:
                total_time = time.time() - start_time
                log_step("triad_approved", "✓ 三权分立全部通过！",
                        total_rounds=self.current_round,
                        final_score=reviewer_result.overall_score,
                        total_time=total_time)

                return TriadLoopResult(
                    status=TriadStatus.APPROVED,
                    total_rounds=self.current_round,
                    total_time=total_time,
                    final_score=reviewer_result.overall_score,
                    final_code=current_code,
                    reviewer_passed=True,
                    validator_passed=True,
                    round_results=round_results
                )

            # ═══════════════════════════════════════════════════════════════════════════
            # B. 收敛检测：分数改进 + Patch 相似度
            # ═══════════════════════════════════════════════════════════════════════════
            improvement = reviewer_result.overall_score - self.last_score

            # B-1. 分数收敛检测
            score_converged = abs(improvement) < self.convergence_threshold

            # B-2. Patch 相似度检测（新增）
            patch_similarity = 0.0
            if self._code_history:
                patch_similarity = self._compute_patch_similarity(
                    self._code_history[-1], current_code)
                log_step("patch_similarity",
                        f"与上轮代码相似度: {patch_similarity:.2%}",
                        similarity=patch_similarity)

            # 相似度 > 95% 认为陷入死循环
            similarity_converged = patch_similarity > 0.95

            if score_converged:
                self.consecutive_no_improvement += 1
            else:
                self.consecutive_no_improvement = 0

            if similarity_converged:
                self._consecutive_high_similarity += 1
            else:
                self._consecutive_high_similarity = 0

            # 任一收敛条件触发 → 停止
            if (self.consecutive_no_improvement >= 2 or
                self._consecutive_high_similarity >= 2):
                total_time = time.time() - start_time

                reason = (
                    "连续两轮代码相似度超过 95%，陷入死循环"
                    if similarity_converged
                    else "连续两轮改进小于阈值"
                )
                log_step("triad_converged", f"博弈循环收敛: {reason}",
                        score_converged=score_converged,
                        similarity_converged=similarity_converged,
                        patch_similarity=patch_similarity)

                return TriadLoopResult(
                    status=TriadStatus.REJECTED,
                    total_rounds=self.current_round,
                    total_time=total_time,
                    final_score=self.last_score,
                    final_code=current_code,
                    converged=True,
                    convergence_reason="连续两轮改进小于阈值或代码相似度 > 95%",
                    patch_similarity=patch_similarity,
                    round_results=round_results,
                    feedback=self._summarize_feedback(round_results)
                )
            else:
                self.consecutive_no_improvement = 0
                self._consecutive_high_similarity = 0
                self.last_score = reviewer_result.overall_score

            # 记录代码历史（用于相似度检测）
            self._code_history.append(current_code)

            current_mode = GenerationMode.FIX
            log_thought("coder", f"收到反馈，准备修复。剩余 {self.max_iterations - self.current_round} 次机会",
                       round_num=self.current_round)

        # 达到最大次数 → 失败
        total_time = time.time() - start_time
        log_step("triad_rejected", f"达到最大迭代次数 {self.max_iterations}",
                total_rounds=self.current_round,
                final_score=self.last_score,
                total_time=total_time)

        # 计算最终相似度
        final_similarity = 0.0
        if len(self._code_history) >= 2:
            final_similarity = self._compute_patch_similarity(
                self._code_history[0], self._code_history[-1])

        return TriadLoopResult(
            status=TriadStatus.REJECTED,
            total_rounds=self.current_round,
            total_time=total_time,
            final_score=self.last_score,
            final_code=current_code,
            patch_similarity=final_similarity,
            round_results=round_results,
            feedback=self._summarize_feedback(round_results)
        )

    def _build_feedback(self, round_results: List[RoundResult]) -> str:
        if not round_results:
            return ""
        last = round_results[-1]
        reviewer_feedback = "\n".join([
            f"- {issue.severity.upper()}: {issue.description}"
            for issue in last.reviewer_result.issues
        ])
        validator_feedback = ""
        if not last.validator_result.success:
            validator_feedback = f"\n测试失败: {last.validator_result.failed} failed"
        return f"Reviewer 审查 (得分: {last.reviewer_result.overall_score:.2f}):\n{reviewer_feedback}\n{validator_feedback}\n请修复代码。"

    def _summarize_feedback(self, round_results: List[RoundResult]) -> str:
        if not round_results:
            return "无反馈"
        return "\n".join([
            f"第 {i+1} 轮: score={r.score:.2f}, issues={len(r.reviewer_result.issues)}"
            for i, r in enumerate(round_results)
        ])


def create_triad_loop(**kwargs) -> TriadLoop:
    return TriadLoop(**kwargs)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI TriadLoop - 三权分立博弈循环")
    parser.add_argument("--task", type=str, required=True, help="任务描述")
    parser.add_argument("--workspace", type=str, default=".", help="工作目录")
    parser.add_argument("--coder-model", type=str, default="claude-3-5-sonnet", help="Coder 模型")
    parser.add_argument("--reviewer-model", type=str, default="gpt-4o", help="Reviewer 模型")
    parser.add_argument("--max-iterations", type=int, default=5, help="最大迭代次数")
    parser.add_argument("--score-threshold", type=float, default=0.8, help="通过分数阈值")
    parser.add_argument("--language", type=str, default="python", help="编程语言")
    parser.add_argument("--mode", type=str, default="fix", choices=["fix", "generate"], help="运行模式")
    parser.add_argument("--test-command", type=str, help="自定义测试命令")
    parser.add_argument("--docker", action="store_true", help="启用 Docker 沙箱")

    args = parser.parse_args()

    triad = create_triad_loop(
        workspace=args.workspace,
        coder_model=args.coder_model,
        reviewer_model=args.reviewer_model,
        max_iterations=args.max_iterations,
        score_threshold=args.score_threshold,
        enable_docker=args.docker,
        test_command=args.test_command
    )

    result = triad.run(task=args.task, context={"language": args.language}, mode=args.mode)

    print("\n" + "=" * 60)
    print("三权分立博弈循环执行结果")
    print("=" * 60)
    print(f"状态: {'✓ 全部通过' if result.all_passed else '✗ 未通过'}")
    print(f"最终得分: {result.final_score:.2f}")
    print(f"迭代次数: {result.total_rounds}")
    print(f"总耗时: {result.total_time:.2f}s")
    print("三权检查:")
    print(f"  Reviewer: {'✓ 通过' if result.reviewer_passed else '✗ 未通过'}")
    print(f"  Validator: {'✓ 通过' if result.validator_passed else '✗ 未通过'}")
    if result.converged:
        print(f"收敛: 是 ({result.convergence_reason})")
    print("=" * 60)
