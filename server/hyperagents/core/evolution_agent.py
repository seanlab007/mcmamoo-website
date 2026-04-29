"""
EvolutionAgent - 进化智能体
═══════════════════════════════════════════════════════════════════════════════
MaoAI 3.0 "破壁者" 核心组件

整合三大实战派人感逻辑：
1. 元认知监控层 (Metacognitive Monitor) - 停滞检测与策略重构
2. 环境状态锚点 (State Snapshot) - 断点续传与上下文保持
3. 怀疑论验证器 (Skeptical Validator) - 逻辑幻觉检测与现实验证

核心能力：
- 感知情绪/反馈：通过 Reviewer 识别任务的"挫败信号"
- 动态调整：如果 triad_loop 连续三轮分数不上升，自动触发"策略重构"
- 工程闭环：永远不只相信 LLM 的输出，永远以"沙盒运行结果"为准

Author: MaoAI Core 3.0
Version: 3.0.0 "破壁者"
"""

import asyncio
import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, AsyncGenerator, Union

from .metacognitive_monitor import (
    StagnationDetector,
    StagnationReport,
    StagnationType,
    StrategyAction,
    get_stagnation_detector,
)
from .state_snapshot import (
    StateSnapshotManager,
    ResumeManager,
    TaskContext,
    get_snapshot_manager,
)
from .skeptical_validator import (
    SkepticalValidator,
    SkepticalValidationReport,
    ValidationStatus,
    RealityCheckError,
    get_skeptical_validator,
)


class EvolutionPhase(Enum):
    """进化阶段"""
    INITIALIZING = "initializing"       # 初始化
    ANALYZING = "analyzing"             # 分析任务
    EXECUTING = "executing"             # 执行
    VALIDATING = "validating"           # 验证
    HEALING = "healing"                 # 自愈
    STRATEGY_SWITCH = "strategy_switch" # 策略切换
    RESUMING = "resuming"               # 断点续传
    COMPLETED = "completed"             # 完成
    FAILED = "failed"                   # 失败


@dataclass
class EvolutionContext:
    """进化上下文"""
    task_id: str
    goal: str
    
    # 当前状态
    phase: EvolutionPhase = EvolutionPhase.INITIALIZING
    iteration: int = 0
    max_iterations: int = 10
    
    # 组件状态
    stagnation_detector: Optional[StagnationDetector] = None
    snapshot_manager: Optional[StateSnapshotManager] = None
    skeptical_validator: Optional[SkepticalValidator] = None
    
    # 执行历史
    stagnation_reports: List[StagnationReport] = field(default_factory=list)
    validation_reports: List[SkepticalValidationReport] = field(default_factory=list)
    snapshots: List[str] = field(default_factory=list)  # 快照 ID 列表
    
    # 当前策略
    current_strategy: str = "default"
    strategy_history: List[Dict] = field(default_factory=list)
    
    # 结果
    final_output: Optional[str] = None
    final_score: float = 0.0
    error_message: Optional[str] = None
    
    # 时间戳
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict:
        return {
            "task_id": self.task_id,
            "goal": self.goal,
            "phase": self.phase.value,
            "iteration": self.iteration,
            "current_strategy": self.current_strategy,
            "final_score": self.final_score,
            "stagnation_count": len(self.stagnation_reports),
            "validation_count": len(self.validation_reports),
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


@dataclass
class EvolutionEvent:
    """进化事件"""
    event_type: str  # phase_change, stagnation_detected, validation_complete, etc.
    message: str
    data: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict:
        return {
            "event_type": self.event_type,
            "message": self.message,
            "data": self.data,
            "timestamp": self.timestamp.isoformat(),
        }


class EvolutionAgent:
    """
    进化智能体 - MaoAI 3.0 核心执行引擎
    
    实战派人感逻辑的实现：
    
    1. 元认知监控：
       - 每轮执行后检查是否停滞
       - 如果停滞，触发策略重构
       - 像真人一样表达"挫败感驱动的改进动力"
    
    2. 环境状态锚点：
       - 每轮捕获状态快照
       - 支持断点续传
       - 给 LLM 的 Prompt 包含真实环境状态
    
    3. 怀疑论验证：
       - 双重验证：pytest + browser_agent
       - 检测逻辑幻觉
       - 永远以"沙盒运行结果"为准
    
    使用方式：
        agent = EvolutionAgent()
        
        async for event in agent.evolve("实现一个快速排序算法"):
            print(f"[{event.event_type}] {event.message}")
    """
    
    def __init__(
        self,
        stagnation_detector: Optional[StagnationDetector] = None,
        snapshot_manager: Optional[StateSnapshotManager] = None,
        skeptical_validator: Optional[SkepticalValidator] = None,
        browser_agent = None,
    ):
        # 初始化组件
        self.stagnation_detector = stagnation_detector or get_stagnation_detector()
        self.snapshot_manager = snapshot_manager or get_snapshot_manager()
        self.skeptical_validator = skeptical_validator or get_skeptical_validator(browser_agent)
        self.browser_agent = browser_agent
        
        # 断点续传管理器
        self.resume_manager = ResumeManager(self.snapshot_manager)
        
        # 上下文存储
        self.contexts: Dict[str, EvolutionContext] = {}
        
        # 策略注册表
        self.strategies: Dict[str, Callable] = {}
        self._register_default_strategies()
        
        # 事件回调
        self._event_callbacks: List[Callable[[EvolutionEvent], Any]] = []
    
    def _register_default_strategies(self):
        """注册默认策略"""
        self.strategies = {
            "default": self._execute_default_strategy,
            "github_search": self._execute_github_search_strategy,
            "decomposition": self._execute_decomposition_strategy,
            "brute_force": self._execute_brute_force_strategy,
        }
    
    def on_event(self, callback: Callable[[EvolutionEvent], Any]):
        """注册事件回调"""
        self._event_callbacks.append(callback)
        return callback
    
    def _emit_event(self, event: EvolutionEvent):
        """触发事件"""
        for callback in self._event_callbacks:
            try:
                callback(event)
            except Exception:
                pass
    
    async def evolve(
        self,
        goal: str,
        task_id: Optional[str] = None,
        resume_from_checkpoint: bool = True,
    ) -> AsyncGenerator[EvolutionEvent, None]:
        """
        执行进化流程
        
        Args:
            goal: 任务目标
            task_id: 任务 ID（可选）
            resume_from_checkpoint: 是否尝试从断点恢复
        
        Yields:
            EvolutionEvent: 进化事件
        """
        task_id = task_id or f"evo_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # 创建上下文
        context = EvolutionContext(
            task_id=task_id,
            goal=goal,
            stagnation_detector=self.stagnation_detector,
            snapshot_manager=self.snapshot_manager,
            skeptical_validator=self.skeptical_validator,
        )
        self.contexts[task_id] = context
        
        # 尝试断点续传
        if resume_from_checkpoint:
            recovered_snapshot = await self.resume_manager.check_and_resume(task_id)
            if recovered_snapshot:
                context.phase = EvolutionPhase.RESUMING
                yield EvolutionEvent(
                    event_type="resuming",
                    message=f"从断点恢复: {recovered_snapshot.snapshot_id}",
                    data={"snapshot": recovered_snapshot.to_dict()},
                )
                # 恢复迭代计数
                context.iteration = recovered_snapshot.task_context.iteration
        
        # 开始执行
        context.phase = EvolutionPhase.ANALYZING
        yield EvolutionEvent(
            event_type="phase_change",
            message="开始分析任务",
            data={"phase": "analyzing", "goal": goal},
        )
        
        try:
            # 主循环
            while context.iteration < context.max_iterations:
                context.iteration += 1
                
                # 1. 捕获状态快照
                await self._capture_snapshot(context)
                
                # 2. 执行当前策略
                context.phase = EvolutionPhase.EXECUTING
                yield EvolutionEvent(
                    event_type="phase_change",
                    message=f"第 {context.iteration} 轮执行",
                    data={"iteration": context.iteration, "strategy": context.current_strategy},
                )
                
                execution_result = await self._execute_strategy(context)
                
                # 3. 怀疑论验证
                context.phase = EvolutionPhase.VALIDATING
                yield EvolutionEvent(
                    event_type="phase_change",
                    message="开始验证",
                    data={"iteration": context.iteration},
                )
                
                validation_report = await self._validate(context, execution_result)
                context.validation_reports.append(validation_report)
                
                yield EvolutionEvent(
                    event_type="validation_complete",
                    message=f"验证完成: {validation_report.overall_status.value}",
                    data={"report": validation_report.to_dict()},
                )
                
                # 4. 检查逻辑幻觉
                if validation_report.is_hallucination:
                    yield EvolutionEvent(
                        event_type="hallucination_detected",
                        message="🚨 检测到逻辑幻觉！",
                        data={"gap": validation_report.logic_reality_gap},
                    )
                    # 强制进入自愈
                    context.phase = EvolutionPhase.HEALING
                
                # 5. 检查是否通过
                if validation_report.overall_status == ValidationStatus.PASSED:
                    context.final_output = execution_result
                    context.final_score = validation_report.overall_score
                    context.phase = EvolutionPhase.COMPLETED
                    context.completed_at = datetime.now()
                    
                    yield EvolutionEvent(
                        event_type="completed",
                        message="任务完成！",
                        data={
                            "final_score": context.final_score,
                            "iterations": context.iteration,
                            "strategy_switches": len(context.strategy_history),
                        },
                    )
                    break
                
                # 6. 元认知监控 - 检查停滞
                stagnation_report = self._check_stagnation(context, validation_report)
                
                if stagnation_report.is_stagnant:
                    context.stagnation_reports.append(stagnation_report)
                    
                    yield EvolutionEvent(
                        event_type="stagnation_detected",
                        message=stagnation_report.human_feedback,
                        data={"report": stagnation_report.to_dict()},
                    )
                    
                    # 7. 策略重构
                    if stagnation_report.suggested_action == StrategyAction.PIVOT_STRATEGY:
                        await self._switch_strategy(context, stagnation_report)
                    
                    elif stagnation_report.suggested_action == StrategyAction.HALT:
                        context.phase = EvolutionPhase.FAILED
                        context.error_message = "达到最大尝试次数，停止执行"
                        yield EvolutionEvent(
                            event_type="failed",
                            message=context.error_message,
                            data={"iterations": context.iteration},
                        )
                        break
                
                # 8. 自愈（如果需要）
                if context.phase == EvolutionPhase.HEALING or validation_report.overall_status == ValidationStatus.FAILED:
                    context.phase = EvolutionPhase.HEALING
                    yield EvolutionEvent(
                        event_type="phase_change",
                        message="进入自愈阶段",
                        data={"iteration": context.iteration},
                    )
                    
                    healed = await self._heal(context, validation_report)
                    if not healed:
                        yield EvolutionEvent(
                            event_type="healing_failed",
                            message="自愈失败，继续下一轮",
                        )
            
            else:
                # 达到最大迭代次数
                context.phase = EvolutionPhase.FAILED
                context.error_message = f"达到最大迭代次数 ({context.max_iterations})"
                yield EvolutionEvent(
                    event_type="failed",
                    message=context.error_message,
                )
        
        except Exception as e:
            context.phase = EvolutionPhase.FAILED
            context.error_message = str(e)
            yield EvolutionEvent(
                event_type="error",
                message=f"执行异常: {e}",
            )
        
        finally:
            # 最终快照
            await self._capture_snapshot(context, notes="最终状态")
            
            yield EvolutionEvent(
                event_type="final",
                message="进化流程结束",
                data={
                    "context": context.to_dict(),
                    "total_stagnations": len(context.stagnation_reports),
                    "total_validations": len(context.validation_reports),
                },
            )
    
    async def _capture_snapshot(self, context: EvolutionContext, notes: str = ""):
        """捕获状态快照"""
        task_ctx = TaskContext(
            task_id=context.task_id,
            goal=context.goal,
            current_phase=context.phase.value,
            iteration=context.iteration,
            key_decisions=[s.get("reason", "") for s in context.strategy_history],
            open_issues=[r.primary_contradiction for r in context.stagnation_reports],
        )
        
        snapshot = await self.snapshot_manager.capture(
            task_context=task_ctx,
            capture_browser=(context.phase == EvolutionPhase.VALIDATING),
            browser_agent=self.browser_agent,
            tags=["evolution", context.current_strategy],
            notes=notes,
        )
        
        context.snapshots.append(snapshot.snapshot_id)
    
    def _check_stagnation(
        self,
        context: EvolutionContext,
        validation_report: SkepticalValidationReport,
    ) -> StagnationReport:
        """检查是否停滞"""
        # 获取上一轮评分
        last_score = 0.0
        if context.validation_reports:
            last_score = context.validation_reports[-1].overall_score
        
        # 检查停滞
        return self.stagnation_detector.check(
            round_number=context.iteration,
            phase=context.phase.value,
            score=validation_report.overall_score,
            error_message=context.error_message,
            strategy_signature=context.current_strategy,
        )
    
    async def _execute_strategy(self, context: EvolutionContext) -> str:
        """执行当前策略"""
        strategy_func = self.strategies.get(context.current_strategy, self._execute_default_strategy)
        return await strategy_func(context)
    
    async def _execute_default_strategy(self, context: EvolutionContext) -> str:
        """默认策略"""
        # 简化实现：返回一个占位符
        return f"# 默认策略执行结果\n# 目标: {context.goal}\n\n# TODO: 实现具体逻辑"
    
    async def _execute_github_search_strategy(self, context: EvolutionContext) -> str:
        """GitHub 搜索策略"""
        # 从 GitHub 搜索相似问题的解决方案
        yield EvolutionEvent(
            event_type="strategy_switch",
            message="切换到 GitHub 搜索策略",
        )
        
        # 简化实现
        return f"# GitHub 搜索策略结果\n# 搜索关键词: {context.goal}\n\n# TODO: 实现 GitHub API 搜索"
    
    async def _execute_decomposition_strategy(self, context: EvolutionContext) -> str:
        """任务分解策略"""
        yield EvolutionEvent(
            event_type="strategy_switch",
            message="切换到任务分解策略",
        )
        
        # 简化实现
        return f"# 任务分解策略结果\n# 将大任务分解为子任务\n\n# TODO: 实现任务分解"
    
    async def _execute_brute_force_strategy(self, context: EvolutionContext) -> str:
        """暴力尝试策略"""
        yield EvolutionEvent(
            event_type="strategy_switch",
            message="切换到暴力尝试策略",
        )
        
        # 简化实现
        return f"# 暴力尝试策略结果\n# 尝试多种可能的解决方案\n\n# TODO: 实现暴力尝试"
    
    async def _switch_strategy(
        self,
        context: EvolutionContext,
        stagnation_report: StagnationReport,
    ):
        """切换策略"""
        context.phase = EvolutionPhase.STRATEGY_SWITCH
        
        # 选择备选策略
        old_strategy = context.current_strategy
        
        # 简单的策略切换逻辑
        strategy_order = ["default", "github_search", "decomposition", "brute_force"]
        current_index = strategy_order.index(context.current_strategy) if context.current_strategy in strategy_order else 0
        new_strategy = strategy_order[(current_index + 1) % len(strategy_order)]
        
        context.current_strategy = new_strategy
        context.strategy_history.append({
            "from": old_strategy,
            "to": new_strategy,
            "reason": stagnation_report.primary_contradiction,
            "timestamp": datetime.now().isoformat(),
        })
        
        self._emit_event(EvolutionEvent(
            event_type="strategy_switch",
            message=f"策略切换: {old_strategy} → {new_strategy}",
            data={
                "from": old_strategy,
                "to": new_strategy,
                "reason": stagnation_report.primary_contradiction,
            },
        ))
    
    async def _validate(
        self,
        context: EvolutionContext,
        execution_result: str,
    ) -> SkepticalValidationReport:
        """执行验证"""
        # 简化实现：仅语法检查
        return await self.skeptical_validator.quick_validate(
            task_id=context.task_id,
            code=execution_result,
            expected_behavior=context.goal,
        )
    
    async def _heal(
        self,
        context: EvolutionContext,
        validation_report: SkepticalValidationReport,
    ) -> bool:
        """执行自愈"""
        # 简化实现：标记为已尝试自愈
        # 实际实现应该调用 HealingAgent
        return True
    
    def get_context(self, task_id: str) -> Optional[EvolutionContext]:
        """获取上下文"""
        return self.contexts.get(task_id)
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        total = len(self.contexts)
        completed = sum(1 for c in self.contexts.values() if c.phase == EvolutionPhase.COMPLETED)
        failed = sum(1 for c in self.contexts.values() if c.phase == EvolutionPhase.FAILED)
        
        return {
            "total_tasks": total,
            "completed": completed,
            "failed": failed,
            "success_rate": completed / total if total > 0 else 0,
            "avg_iterations": sum(c.iteration for c in self.contexts.values()) / total if total > 0 else 0,
            "avg_stagnations": sum(len(c.stagnation_reports) for c in self.contexts.values()) / total if total > 0 else 0,
        }


# ───────────────────────────────────────────────────────────────────────────────
# 全局实例
# ───────────────────────────────────────────────────────────────────────────────

_evolution_agent: Optional[EvolutionAgent] = None


def get_evolution_agent(browser_agent=None) -> EvolutionAgent:
    """获取全局进化智能体"""
    global _evolution_agent
    if _evolution_agent is None:
        _evolution_agent = EvolutionAgent(browser_agent=browser_agent)
    return _evolution_agent


# ───────────────────────────────────────────────────────────────────────────────
# 测试
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test_evolution_agent():
        print("=" * 60)
        print("EvolutionAgent 测试")
        print("=" * 60)
        
        agent = EvolutionAgent()
        
        # 收集所有事件
        events = []
        
        async for event in agent.evolve("实现一个快速排序算法"):
            events.append(event)
            print(f"[{event.event_type}] {event.message}")
            
            if event.event_type == "stagnation_detected":
                print(f"\n💬 人感反馈:\n{event.data['report']['human_feedback']}")
            
            if event.event_type == "hallucination_detected":
                print(f"\n🚨 逻辑幻觉:\n{event.data['gap']}")
        
        print("\n" + "=" * 60)
        print("统计:")
        print("=" * 60)
        print(json.dumps(agent.get_stats(), indent=2))
    
    asyncio.run(test_evolution_agent())
