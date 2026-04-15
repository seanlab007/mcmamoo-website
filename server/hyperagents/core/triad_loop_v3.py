"""
TriadLoop V3 - 集成 HealingAgent 的三权分立的博弈循环
═══════════════════════════════════════════════════════════════════════════════
MaoAI 3.0 "破壁者" 核心执行引擎

核心增强：
- 每个执行阶段都有 @reality_check 保护
- Validator 失败后自动触发 HealingAgent
- 流式状态推送包含自愈过程
- 元认知监控：停滞检测与策略重构
- 环境状态锚点：断点续传与上下文保持
- 怀疑论验证：逻辑幻觉检测与现实验证

Author: MaoAI Core 3.0
Version: 3.0.0 "破壁者"
"""

import asyncio
import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, AsyncGenerator

from .healing_agent import HealingAgent, HealingReport, get_healing_agent
from .skill_registry import SkillRegistry, get_skill_registry
from .streaming import StreamBroker, AgentType, MessageType

# 实战派人感逻辑组件
from .metacognitive_monitor import (
    StagnationDetector,
    StagnationReport,
    get_stagnation_detector,
)
from .state_snapshot import (
    StateSnapshotManager,
    TaskContext,
    get_snapshot_manager,
)
from .skeptical_validator import (
    SkepticalValidator,
    SkepticalValidationReport,
    ValidationStatus,
    get_skeptical_validator,
)


# ───────────────────────────────────────────────────────────────────────────────
# 数据模型
# ───────────────────────────────────────────────────────────────────────────────

class TriadPhase(Enum):
    """三权分立阶段"""
    STRATEGIST = "strategist"       # 战略分析
    CODER = "coder"                 # 代码生成
    REVIEWER = "reviewer"           # 代码审查
    VALIDATOR = "validator"         # 验证测试
    HEALING = "healing"             # 自愈修复 (新增)
    CONVERGED = "converged"         # 博弈收敛


@dataclass
class TriadContext:
    """三权博弈上下文"""
    task_id: str
    goal: str
    current_phase: TriadPhase = TriadPhase.STRATEGIST
    
    # 各阶段输出
    strategist_output: Optional[str] = None
    coder_output: Optional[str] = None
    reviewer_output: Optional[str] = None
    validator_output: Optional[str] = None
    
    # 自愈记录
    healing_reports: List[HealingReport] = field(default_factory=list)
    healing_attempts: int = 0
    max_healing_attempts: int = 3
    
    # 评分
    scores: Dict[str, float] = field(default_factory=dict)
    
    # 状态
    status: str = "running"  # running, healing, converged, failed
    error: Optional[str] = None
    
    # 时间戳
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    # 实战派人感逻辑组件状态
    stagnation_reports: List[StagnationReport] = field(default_factory=list)
    validation_reports: List[SkepticalValidationReport] = field(default_factory=list)
    snapshots: List[str] = field(default_factory=list)
    current_strategy: str = "default"
    strategy_history: List[Dict] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        """序列化为字典"""
        return {
            "task_id": self.task_id,
            "goal": self.goal,
            "current_phase": self.current_phase.value,
            "status": self.status,
            "scores": self.scores,
            "healing_attempts": self.healing_attempts,
            "stagnation_count": len(self.stagnation_reports),
            "validation_count": len(self.validation_reports),
            "current_strategy": self.current_strategy,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


# ───────────────────────────────────────────────────────────────────────────────
# TriadLoop V3
# ───────────────────────────────────────────────────────────────────────────────

class TriadLoopV3:
    """
    三权分立博弈循环 V3 - 集成 HealingAgent + 实战派人感逻辑
    
    核心流程：
    1. Strategist 战略定性
    2. Coder 代码生成 (@reality_check 保护)
    3. Reviewer 代码审查
    4. Validator 验证测试 (@reality_check 保护 + 怀疑论验证)
    5. 元认知监控 - 检查停滞与策略重构
    6. 如果验证失败 → HealingAgent 自愈 → 回到步骤2
    7. 博弈收敛
    
    实战派人感逻辑：
    - 停滞检测：连续多轮无进展时触发策略重构
    - 状态锚点：每轮捕获快照，支持断点续传
    - 怀疑验证：检测逻辑幻觉，以现实结果为准
    
    使用方式：
        loop = TriadLoopV3()
        
        async for message in loop.execute("实现一个快速排序算法"):
            print(message)
    """
    
    def __init__(
        self,
        stream_broker: Optional[StreamBroker] = None,
        healing_agent: Optional[HealingAgent] = None,
        skill_registry: Optional[SkillRegistry] = None,
        stagnation_detector: Optional[StagnationDetector] = None,
        snapshot_manager: Optional[StateSnapshotManager] = None,
        skeptical_validator: Optional[SkepticalValidator] = None,
        browser_agent = None,
    ):
        self.stream_broker = stream_broker
        self.healing_agent = healing_agent or get_healing_agent()
        self.skill_registry = skill_registry or get_skill_registry()
        
        # 实战派人感逻辑组件
        self.stagnation_detector = stagnation_detector or get_stagnation_detector()
        self.snapshot_manager = snapshot_manager or get_snapshot_manager()
        self.skeptical_validator = skeptical_validator or get_skeptical_validator(browser_agent)
        self.browser_agent = browser_agent
        
        # 注册 BrowserUseSkill
        from ..skills.browser_use_skill import BrowserUseSkill
        self.skill_registry.register_builtin("browser_use", BrowserUseSkill)
        
        # 任务上下文
        self.contexts: Dict[str, TriadContext] = {}
    
    async def execute(
        self,
        goal: str,
        task_id: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        执行三权分立博弈循环
        
        Yields:
            流式状态更新消息
        """
        task_id = task_id or f"triad_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        context = TriadContext(task_id=task_id, goal=goal)
        self.contexts[task_id] = context
        
        # 发送开始消息
        yield self._create_message(context, "start", "开始三权分立博弈循环")
        
        try:
            # Phase 1: Strategist
            context.current_phase = TriadPhase.STRATEGIST
            yield self._create_message(context, "phase_start", "战略分析阶段")
            
            strategist_result = await self._run_strategist(context)
            context.strategist_output = strategist_result
            yield self._create_message(context, "phase_complete", "战略分析完成", {
                "output": strategist_result,
            })
            
            # Phase 2-5: 循环直到收敛或达到最大自愈次数
            iteration = 0
            while context.status == "running" and iteration < context.max_healing_attempts * 2:
                iteration += 1
                
                # 捕获状态快照
                await self._capture_snapshot(context)
                
                # Phase 2: Coder
                context.current_phase = TriadPhase.CODER
                yield self._create_message(context, "phase_start", f"第 {iteration} 轮 - 代码生成阶段")
                
                coder_result = await self._run_coder(context)
                context.coder_output = coder_result
                yield self._create_message(context, "phase_complete", "代码生成完成", {
                    "output_preview": coder_result[:200] if coder_result else None,
                })
                
                # Phase 3: Reviewer
                context.current_phase = TriadPhase.REVIEWER
                yield self._create_message(context, "phase_start", "代码审查阶段")
                
                review_result = await self._run_reviewer(context)
                context.reviewer_output = review_result
                reviewer_score = review_result.get("score", 0)
                context.scores["reviewer"] = reviewer_score
                
                yield self._create_message(context, "phase_complete", "代码审查完成", {
                    "score": reviewer_score,
                    "issues": review_result.get("issues", []),
                })
                
                # Phase 4: Validator (怀疑论验证)
                context.current_phase = TriadPhase.VALIDATOR
                yield self._create_message(context, "phase_start", "怀疑论验证阶段")
                
                validation_result = await self._run_validator(context)
                context.validator_output = validation_result
                validator_score = validation_result.get("score", 0)
                context.scores["validator"] = validator_score
                
                # 记录验证报告
                if isinstance(validation_result, dict):
                    # 创建简化的验证报告
                    from .skeptical_validator import SkepticalValidationReport, ValidationStatus
                    report = SkepticalValidationReport(
                        task_id=context.task_id,
                        timestamp=datetime.now(),
                        overall_status=ValidationStatus.PASSED if validation_result.get("success") else ValidationStatus.FAILED,
                        overall_score=validator_score,
                    )
                    context.validation_reports.append(report)
                
                # 检查逻辑幻觉
                if validation_result.get("is_hallucination"):
                    yield self._create_message(context, "hallucination_detected", "🚨 检测到逻辑幻觉！", {
                        "gap": validation_result.get("logic_reality_gap", ""),
                    })
                
                # 元认知监控 - 检查停滞
                stagnation_report = self.stagnation_detector.check(
                    round_number=iteration,
                    phase=context.current_phase.value,
                    score=(reviewer_score + validator_score) / 2,
                    error_message=validation_result.get("error"),
                    strategy_signature=context.current_strategy,
                )
                
                if stagnation_report.is_stagnant:
                    context.stagnation_reports.append(stagnation_report)
                    yield self._create_message(context, "stagnation_detected", stagnation_report.human_feedback, {
                        "type": stagnation_report.stagnation_type.value,
                        "confidence": stagnation_report.confidence,
                        "primary_contradiction": stagnation_report.primary_contradiction,
                    })
                    
                    # 策略重构
                    if stagnation_report.suggested_action.value == "pivot_strategy":
                        await self._switch_strategy(context, stagnation_report)
                        yield self._create_message(context, "strategy_switch", f"策略切换: {context.current_strategy}")
                
                # 检查验证结果
                if validation_result.get("success") and not validation_result.get("is_hallucination"):
                    # 验证通过，博弈收敛
                    context.status = "converged"
                    context.current_phase = TriadPhase.CONVERGED
                    context.completed_at = datetime.now()
                    
                    final_score = sum(context.scores.values()) / len(context.scores) if context.scores else 0
                    
                    yield self._create_message(context, "converged", "博弈收敛，任务完成", {
                        "final_score": final_score,
                        "healing_attempts": context.healing_attempts,
                        "stagnation_count": len(context.stagnation_reports),
                        "strategy_switches": len(context.strategy_history),
                    })
                    break
                
                else:
                    # 验证失败，触发自愈
                    if context.healing_attempts >= context.max_healing_attempts:
                        context.status = "failed"
                        context.error = f"达到最大自愈次数 ({context.max_healing_attempts})"
                        yield self._create_message(context, "failed", context.error)
                        break
                    
                    context.healing_attempts += 1
                    context.current_phase = TriadPhase.HEALING
                    context.status = "healing"
                    
                    yield self._create_message(context, "healing_start", f"验证失败，启动自愈 (尝试 {context.healing_attempts}/{context.max_healing_attempts})", {
                        "validation_error": validation_result.get("error"),
                    })
                    
                    # 执行自愈
                    healing_report = await self._run_healing(context, validation_result)
                    context.healing_reports.append(healing_report)
                    
                    if healing_report.status.value == "applied":
                        yield self._create_message(context, "healing_complete", "自愈成功，重新执行", {
                            "patch_id": healing_report.patches[0].patch_id if healing_report.patches else None,
                        })
                        context.status = "running"  # 继续循环
                    else:
                        yield self._create_message(context, "healing_failed", "自愈失败", {
                            "error": healing_report.error_context.error_message if healing_report.error_context else None,
                        })
                        # 即使自愈失败也继续尝试，直到达到最大次数
                        context.status = "running"
        
        except Exception as e:
            context.status = "failed"
            context.error = str(e)
            yield self._create_message(context, "error", f"执行异常: {e}")
        
        finally:
            # 发送最终状态
            yield self._create_message(context, "complete", "三权分立博弈结束", {
                "final_status": context.status,
                "total_healing": context.healing_attempts,
            })
    
    async def _run_strategist(self, context: TriadContext) -> str:
        """运行战略分析"""
        # 简化实现：返回任务目标作为战略分析
        return f"战略分析: {context.goal}\n\n主要矛盾识别: 需要高效实现{context.goal}"
    
    async def _run_coder(self, context: TriadContext) -> str:
        """运行代码生成（带自愈保护）"""
        # 使用 @reality_check 装饰器保护
        @self.healing_agent.reality_check
        async def generate_code():
            # 实际代码生成逻辑
            # 这里简化实现
            return f"# 生成的代码\n# 目标: {context.goal}\n\ndef solution():\n    pass"
        
        try:
            return await generate_code()
        except Exception as e:
            # 即使自愈失败也返回错误信息
            return f"# 代码生成失败: {e}"
    
    async def _run_reviewer(self, context: TriadContext) -> Dict:
        """运行代码审查"""
        # 简化实现
        return {
            "score": 85.0,
            "issues": [],
            "feedback": "代码结构良好",
        }
    
    async def _run_validator(self, context: TriadContext) -> Dict:
        """运行验证测试（带自愈保护）"""
        @self.healing_agent.reality_check
        async def validate():
            # 实际验证逻辑
            # 这里简化实现，模拟验证
            import random
            if random.random() > 0.7:  # 30% 失败率用于测试自愈
                raise RuntimeError("验证失败: 测试用例未通过")
            
            return {"success": True, "score": 90.0}
        
        try:
            result = await validate()
            return {**result, "success": True}
        except Exception as e:
            return {"success": False, "error": str(e), "score": 0}
    
    async def _run_healing(
        self,
        context: TriadContext,
        validation_result: Dict,
    ) -> HealingReport:
        """运行自愈"""
        from .healing_agent import ErrorContext
        
        # 创建错误上下文
        error_context = ErrorContext(
            error_type="ValidationError",
            error_message=validation_result.get("error", "Unknown validation error"),
            traceback_str="",
            source_code=context.coder_output,
            function_name="validate",
        )
        
        # 执行自愈
        # 注意：这里简化实现，实际应该调用 healing_agent._heal
        # 由于 _heal 是内部方法，这里模拟自愈过程
        
        report = HealingReport(
            error_context=error_context,
            status=None,  # 将在下面设置
        )
        
        # 模拟自愈成功
        report.status = None  # 使用 HealingStatus
        from .healing_agent import HealingStatus
        report.status = HealingStatus.APPLIED
        
        return report
    
    def _create_message(
        self,
        context: TriadContext,
        event_type: str,
        message: str,
        data: Optional[Dict] = None,
    ) -> Dict:
        """创建流式消息"""
        msg = {
            "type": "triad_loop_v3",
            "event": event_type,
            "task_id": context.task_id,
            "phase": context.current_phase.value,
            "status": context.status,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "data": data or {},
        }
        
        # 如果配置了 StreamBroker，也发送给它
        if self.stream_broker:
            asyncio.create_task(
                self.stream_broker.broadcast(json.dumps(msg))
            )
        
        return msg
    
    def get_context(self, task_id: str) -> Optional[TriadContext]:
        """获取任务上下文"""
        return self.contexts.get(task_id)
    
    async def _capture_snapshot(self, context: TriadContext):
        """捕获状态快照"""
        task_ctx = TaskContext(
            task_id=context.task_id,
            goal=context.goal,
            current_phase=context.current_phase.value,
            iteration=context.healing_attempts,
            key_decisions=[s.get("reason", "") for s in context.strategy_history],
            open_issues=[r.primary_contradiction for r in context.stagnation_reports],
        )
        
        snapshot = await self.snapshot_manager.capture(
            task_context=task_ctx,
            capture_browser=(context.current_phase == TriadPhase.VALIDATOR),
            browser_agent=self.browser_agent,
            tags=["triad_loop", context.current_strategy],
        )
        
        context.snapshots.append(snapshot.snapshot_id)
    
    async def _switch_strategy(self, context: TriadContext, stagnation_report: StagnationReport):
        """切换策略"""
        old_strategy = context.current_strategy
        
        # 简单的策略切换逻辑
        strategies = ["default", "github_search", "decomposition", "brute_force"]
        current_index = strategies.index(context.current_strategy) if context.current_strategy in strategies else 0
        new_strategy = strategies[(current_index + 1) % len(strategies)]
        
        context.current_strategy = new_strategy
        context.strategy_history.append({
            "from": old_strategy,
            "to": new_strategy,
            "reason": stagnation_report.primary_contradiction,
            "timestamp": datetime.now().isoformat(),
        })
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        total = len(self.contexts)
        converged = sum(1 for c in self.contexts.values() if c.status == "converged")
        failed = sum(1 for c in self.contexts.values() if c.status == "failed")
        total_healing = sum(c.healing_attempts for c in self.contexts.values())
        total_stagnations = sum(len(c.stagnation_reports) for c in self.contexts.values())
        
        return {
            "total_tasks": total,
            "converged": converged,
            "failed": failed,
            "success_rate": converged / total if total > 0 else 0,
            "total_healing_attempts": total_healing,
            "avg_healing_per_task": total_healing / total if total > 0 else 0,
            "total_stagnations": total_stagnations,
            "avg_stagnations_per_task": total_stagnations / total if total > 0 else 0,
        }


# ───────────────────────────────────────────────────────────────────────────────
# 全局实例
# ───────────────────────────────────────────────────────────────────────────────

_loop: Optional[TriadLoopV3] = None


def get_triad_loop_v3() -> TriadLoopV3:
    """获取全局 TriadLoopV3"""
    global _loop
    if _loop is None:
        _loop = TriadLoopV3()
    return _loop


# ───────────────────────────────────────────────────────────────────────────────
# 测试
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test_triad_loop_v3():
        """测试 TriadLoop V3"""
        loop = TriadLoopV3()
        
        print("=" * 60)
        print("TriadLoop V3 测试 - 集成 HealingAgent")
        print("=" * 60)
        
        async for message in loop.execute("实现一个快速排序算法"):
            print(f"[{message['phase'].upper()}] {message['message']}")
            if message['event'] == 'converged':
                print(f"\n✅ 任务完成！最终评分: {message['data'].get('final_score')}")
                print(f"🩹 自愈次数: {message['data'].get('healing_attempts')}")
        
        print("\n统计:")
        print(json.dumps(loop.get_stats(), indent=2))
    
    asyncio.run(test_triad_loop_v3())
