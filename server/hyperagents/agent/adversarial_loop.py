#!/usr/bin/env python3
"""
MaoAI HyperAgents — Adversarial Loop（博弈循环）
─────────────────────────────────────────────────────────────────────────────
核心逻辑：Coder ↔ Reviewer 博弈循环

     ┌─────────────────────────────────────────────────────────────┐
     │                     Adversarial Loop                         │
     │                                                              │
     │   ┌──────────┐    生成代码     ┌──────────┐                  │
     │   │  Coder   │ ──────────────→│ Reviewer │                  │
     │   │  Agent   │ ←────────────── │  Agent   │                  │
     │   └──────────┘    审查反馈      └──────────┘                  │
     │        ↑              │            │                          │
     │        │              │ 循环直到    │                          │
     │        └──────────────┘  通过或     │                          │
     │                   达到最大次数      │                          │
     └─────────────────────────────────────────────────────────────┘

核心特点：
  1. 严格门禁：只有 score >= threshold 才能通过
  2. 结构化反馈：Reviewer 的反馈直接指导 Coder 修复
  3. 博弈收敛：多次迭代后代码质量收敛到稳定状态
  4. 实时日志：流式输出每轮的状态，便于前端展示

用法：
  from adversarial_loop import AdversarialLoop

  loop = AdversarialLoop(
      coder=CoderAgent(...),
      reviewer=ReviewerAgent(...),
      max_iterations=3,
      score_threshold=0.8
  )

  result = loop.run(task="优化登录模块", context={"file_path": "login.tsx"})
  if result.approved:
      print(f"通过！得分: {result.score}, 迭代: {result.iterations}")
  else:
      print(f"未通过: {result.feedback}")
"""

import sys
import json
import time
import os
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum

# 导入 Agent
from .coder_agent import CoderAgent, GenerationMode, GenerationResult
from .reviewer_agent import ReviewerAgent, ReviewResult


# ─── 日志工具 ────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志到标准输出（flush=True 确保实时性）"""
    entry = {
        "type": step_type,
        "agent": "adversarial_loop",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 数据结构 ────────────────────────────────────────────────────────────────

class LoopStatus(Enum):
    """循环状态"""
    RUNNING = "running"       # 运行中
    APPROVED = "approved"     # 通过
    REJECTED = "rejected"     # 拒绝（达到最大次数）
    ERROR = "error"           # 错误


@dataclass
class IterationResult:
    """单次迭代结果"""
    iteration: int
    coder_result: GenerationResult
    reviewer_result: ReviewResult
    feedback: str = ""
    improvement: float = 0.0  # 与上一轮相比的改进分数


@dataclass
class LoopResult:
    """完整循环结果"""
    status: LoopStatus
    approved: bool
    score: float
    iterations: int
    final_code: str = ""
    final_patch: str = ""
    iteration_results: List[IterationResult] = field(default_factory=list)
    total_time: float = 0.0
    feedback: str = ""
    error: str = ""


# ─── Adversarial Loop ────────────────────────────────────────────────────────

class AdversarialLoop:
    """
    博弈循环引擎 — Coder ↔ Reviewer 对抗式开发

    核心算法：
      1. Coder 生成代码（首次）或修复代码（非首次）
      2. Reviewer 严苛审查，输出结构化反馈
      3. 如果通过（score >= threshold），退出循环
      4. 如果未通过，将反馈传给 Coder，进入下一轮
      5. 达到最大迭代次数，退出循环

    评分策略：
      - 异构博弈：建议 Coder 用 Claude，Reviewer 用 GPT-4
      - 阈值严格：默认 0.8，只有高质量代码才能通过
      - 关键漏洞：存在 critical 级别问题，直接拒绝
    """

    def __init__(
        self,
        coder: CoderAgent = None,
        reviewer: ReviewerAgent = None,
        max_iterations: int = 3,
        score_threshold: float = 0.8,
        workspace: str = None,
        coder_api_key: str = None,
        reviewer_api_key: str = None,
        coder_model: str = "claude-3-5-sonnet",
        reviewer_model: str = "gpt-4o"
    ):
        """
        初始化博弈循环

        Args:
            coder: Coder Agent 实例
            reviewer: Reviewer Agent 实例
            max_iterations: 最大迭代次数
            score_threshold: 通过分数阈值（0.0-1.0）
            workspace: 工作目录
            coder_api_key: Coder 的 API Key
            reviewer_api_key: Reviewer 的 API Key
            coder_model: Coder 使用的模型
            reviewer_model: Reviewer 使用的模型
        """
        self.workspace = workspace or os.getcwd()

        # 初始化 Agent（如果未提供）
        self.coder = coder or CoderAgent(
            api_key=coder_api_key,
            model=coder_model,
            workspace=self.workspace
        )
        self.reviewer = reviewer or ReviewerAgent(
            api_key=reviewer_api_key,
            model=reviewer_model,
            workspace=self.workspace
        )

        self.max_iterations = max_iterations
        self.score_threshold = score_threshold
        self.iteration_results: List[IterationResult] = []

    def run(
        self,
        task: str,
        context: Dict = None,
        mode: str = "auto"
    ) -> LoopResult:
        """
        运行博弈循环

        Args:
            task: 任务描述
            context: 上下文信息
            mode: 运行模式
              - "auto": 完全自动
              - "strict": 严格模式（提高阈值）
              - "fast": 快速模式（减少迭代）

        Returns:
            LoopResult: 完整循环结果
        """
        start_time = time.time()

        # 调整参数
        if mode == "strict":
            threshold = max(self.score_threshold, 0.85)
        elif mode == "fast":
            threshold = max(self.score_threshold, 0.75)
            self.max_iterations = min(self.max_iterations, 2)
        else:
            threshold = self.score_threshold

        log_step("start", f"博弈循环启动: {task[:80]}",
                task=task,
                max_iterations=self.max_iterations,
                threshold=threshold,
                mode=mode)

        self.iteration_results = []
        current_iteration = 0
        accumulated_feedback = ""
        previous_score = 0.0

        while current_iteration < self.max_iterations:
            current_iteration += 1

            log_step("iteration_start", f"=== 第 {current_iteration} 轮迭代 ===",
                    iteration=current_iteration,
                    max=self.max_iterations)

            # ── Step 1: Coder 生成/修复代码 ────────────────────────────
            log_step("thought", f"Coder 正在{'生成' if current_iteration == 1 else '修复'}代码...",
                    iteration=current_iteration)

            if current_iteration == 1:
                coder_result = self.coder.generate(
                    task=task,
                    context=context,
                    mode=GenerationMode.INITIAL
                )
            else:
                # 修复模式：传入 Reviewer 的反馈
                coder_result = self.coder.generate(
                    task=task,
                    context=context,
                    mode=GenerationMode.REVISION,
                    reviewer_feedback=accumulated_feedback
                )

            if not coder_result.success:
                log_step("error", f"Coder 生成失败", iteration=current_iteration)
                return LoopResult(
                    status=LoopStatus.ERROR,
                    approved=False,
                    score=0.0,
                    iterations=current_iteration,
                    error="Coder generation failed"
                )

            log_step("action", f"代码生成完成，{coder_result.diff_lines} 行 diff",
                    iteration=current_iteration,
                    diff_lines=coder_result.diff_lines)

            # ── Step 2: Reviewer 审查代码 ──────────────────────────────
            log_step("thought", f"Reviewer 正在审查代码...",
                    iteration=current_iteration)

            reviewer_result = self.reviewer.review(
                code=coder_result.code,
                context={"task": task, **(context or {})}
            )

            # ── Step 3: 判断是否通过 ───────────────────────────────────
            critical_issues = [i for i in reviewer_result.issues if i.severity == "critical"]
            improvement = reviewer_result.overall_score - previous_score
            previous_score = reviewer_result.overall_score

            # 构建反馈
            if reviewer_result.issues:
                feedback_parts = []
                for issue in reviewer_result.issues[:5]:  # 最多 5 个问题
                    feedback_parts.append(f"[{issue.severity}] {issue.dimension.value}: {issue.description}")
                    if issue.suggestion:
                        feedback_parts.append(f"  → {issue.suggestion}")
                accumulated_feedback = "\n".join(feedback_parts)
            else:
                accumulated_feedback = ""

            # 记录迭代结果
            iteration_result = IterationResult(
                iteration=current_iteration,
                coder_result=coder_result,
                reviewer_result=reviewer_result,
                feedback=accumulated_feedback,
                improvement=improvement
            )
            self.iteration_results.append(iteration_result)

            # 审查结果日志
            log_step("score", f"审查完成，评分: {reviewer_result.overall_score:.2f}",
                    iteration=current_iteration,
                    score=reviewer_result.overall_score,
                    approved=reviewer_result.approved,
                    threshold=threshold,
                    critical_issues=len(critical_issues),
                    improvement=improvement)

            if reviewer_result.issues:
                log_step("observation", f"发现 {len(reviewer_result.issues)} 个问题",
                        iteration=current_iteration,
                        issues=[{"dim": i.dimension.value, "sev": i.severity, "desc": i.description[:50]}
                                for i in reviewer_result.issues[:3]])

            # ── Step 4: 判断是否退出循环 ───────────────────────────────
            if reviewer_result.approved and reviewer_result.overall_score >= threshold:
                # 通过！退出循环
                log_step("done", f"✓ 审查通过！最终得分: {reviewer_result.overall_score:.2f}",
                        iteration=current_iteration,
                        score=reviewer_result.overall_score,
                        iterations=current_iteration)

                return LoopResult(
                    status=LoopStatus.APPROVED,
                    approved=True,
                    score=reviewer_result.overall_score,
                    iterations=current_iteration,
                    final_code=coder_result.code,
                    final_patch=coder_result.patch,
                    iteration_results=self.iteration_results,
                    total_time=time.time() - start_time,
                    feedback=accumulated_feedback
                )

            elif current_iteration >= self.max_iterations:
                # 达到最大次数，退出
                log_step("done", f"✗ 达到最大迭代次数（{self.max_iterations}），审查未通过",
                        iteration=current_iteration,
                        final_score=reviewer_result.overall_score,
                        threshold=threshold)

                return LoopResult(
                    status=LoopStatus.REJECTED,
                    approved=False,
                    score=reviewer_result.overall_score,
                    iterations=current_iteration,
                    final_code=coder_result.code,
                    final_patch=coder_result.patch,
                    iteration_results=self.iteration_results,
                    total_time=time.time() - start_time,
                    feedback=f"达到最大迭代次数（{self.max_iterations}），仍存在 {len(reviewer_result.issues)} 个问题"
                )

            else:
                # 未通过，继续下一轮
                log_step("thought", f"审查未通过，将反馈传给 Coder 进行第 {current_iteration + 1} 轮...",
                        iteration=current_iteration,
                        next_iteration=current_iteration + 1)

        # 不应该到达这里
        return LoopResult(
            status=LoopStatus.ERROR,
            approved=False,
            score=0.0,
            iterations=current_iteration,
            error="Unexpected loop exit"
        )

    def run_with_fallback(
        self,
        task: str,
        context: Dict = None
    ) -> LoopResult:
        """
        运行博弈循环（带降级策略）

        如果严格模式失败，自动降级到标准模式
        """
        # 先尝试严格模式
        result = self.run(task, context, mode="strict")

        if result.approved:
            return result

        # 降级到标准模式
        log_step("thought", "严格模式未通过，降级到标准模式...")
        self.iteration_results = []  # 重置历史
        result = self.run(task, context, mode="auto")

        if result.approved:
            return result

        # 最后降级到快速模式
        log_step("thought", "标准模式未通过，降级到快速模式...")
        self.iteration_results = []
        return self.run(task, context, mode="fast")

    def get_statistics(self) -> Dict:
        """获取统计信息"""
        if not self.iteration_results:
            return {}

        scores = [r.reviewer_result.overall_score for r in self.iteration_results]
        return {
            "total_iterations": len(self.iteration_results),
            "final_score": scores[-1] if scores else 0.0,
            "score_progression": scores,
            "improvement": scores[-1] - scores[0] if len(scores) > 1 else 0.0,
            "final_approved": self.iteration_results[-1].reviewer_result.approved if self.iteration_results else False
        }


# ─── 便捷工厂函数 ────────────────────────────────────────────────────────────

def create_adversarial_loop(
    workspace: str = None,
    coder_api_key: str = None,
    reviewer_api_key: str = None,
    coder_model: str = "claude-3-5-sonnet",
    reviewer_model: str = "gpt-4o",
    max_iterations: int = 3,
    score_threshold: float = 0.8
) -> AdversarialLoop:
    """
    创建博弈循环实例（便捷工厂函数）

    推荐配置：
      - Coder: Claude-3.5-Sonnet（写代码能力强）
      - Reviewer: GPT-4o（逻辑严密，审查细致）
      - 这种"异构博弈"效果最好
    """
    return AdversarialLoop(
        max_iterations=max_iterations,
        score_threshold=score_threshold,
        workspace=workspace,
        coder_api_key=coder_api_key,
        reviewer_api_key=reviewer_api_key,
        coder_model=coder_model,
        reviewer_model=reviewer_model
    )


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Adversarial Loop")
    parser.add_argument("--task", type=str, required=True, help="任务描述")
    parser.add_argument("--file", type=str, default="", help="目标文件")
    parser.add_argument("--mode", type=str, choices=["auto", "strict", "fast"],
                       default="auto", help="运行模式")
    parser.add_argument("--max-iterations", type=int, default=3, help="最大迭代次数")
    parser.add_argument("--threshold", type=float, default=0.8, help="通过分数阈值")
    parser.add_argument("--coder-model", type=str, default="claude-3-5-sonnet", help="Coder 模型")
    parser.add_argument("--reviewer-model", type=str, default="gpt-4o", help="Reviewer 模型")
    parser.add_argument("--api-key", type=str, default=os.environ.get("OPENAI_API_KEY", ""),
                       help="API Key（用于 Coder 和 Reviewer）")
    parser.add_argument("--workspace", type=str, default=".", help="工作目录")
    args = parser.parse()

    # 创建博弈循环
    loop = create_adversarial_loop(
        workspace=args.workspace,
        coder_api_key=args.api_key,
        reviewer_api_key=args.api_key,
        coder_model=args.coder_model,
        reviewer_model=args.reviewer_model,
        max_iterations=args.max_iterations,
        score_threshold=args.threshold
    )

    # 构建上下文
    context = {"file_path": args.file} if args.file else {}

    # 运行循环
    result = loop.run(task=args.task, context=context, mode=args.mode)

    # 输出结果
    print("\n" + "=" * 60)
    print("博弈循环执行结果")
    print("=" * 60)
    print(f"状态: {'✓ 通过' if result.approved else '✗ 未通过'}")
    print(f"最终得分: {result.score:.2f}")
    print(f"迭代次数: {result.iterations}")
    print(f"总耗时: {result.total_time:.2f}s")
    print("-" * 60)

    if result.feedback:
        print("最终反馈:")
        print(result.feedback[:500])

    if result.iteration_results:
        print("-" * 60)
        print("迭代历史:")
        for i, ir in enumerate(result.iteration_results):
            print(f"  第 {i+1} 轮: score={ir.reviewer_result.overall_score:.2f}, "
                  f"issues={len(ir.reviewer_result.issues)}, "
                  f"improvement={ir.improvement:+.2f}")

    print("=" * 60)
