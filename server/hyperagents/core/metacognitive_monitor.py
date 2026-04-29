"""
Metacognitive Monitor - 元认知监控层
═══════════════════════════════════════════════════════════════════════════════
MaoAI 3.0 "破壁者" 核心组件

解决痛点：AI 盲目自信、在错误路径上死循环

核心能力：
- 停滞检测：识别连续多轮无进展的博弈状态
- 策略重构信号：触发自适应策略切换
- 人感反馈：像真人一样表达"挫败感驱动的改进动力"

Author: MaoAI Core 3.0
Version: 3.0.0 "破壁者"
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional, Callable, Any
import json


class StagnationType(Enum):
    """停滞类型"""
    SCORE_STAGNANT = "score_stagnant"      # 分数停滞
    ERROR_LOOPING = "error_looping"        # 错误循环
    TIMEOUT = "timeout"                     # 超时
    RESOURCE_EXHAUSTED = "resource_exhausted"  # 资源耗尽


class StrategyAction(Enum):
    """策略重构动作"""
    CONTINUE = "continue"                   # 继续当前策略
    PIVOT_STRATEGY = "pivot_strategy"       # 切换策略
    ESCALATE = "escalate"                   # 升级处理
    HALT = "halt"                           # 停止执行


@dataclass
class RoundRecord:
    """单轮博弈记录"""
    round_number: int
    timestamp: datetime
    phase: str
    score: float
    error_message: Optional[str] = None
    error_type: Optional[str] = None
    strategy_signature: str = ""  # 策略特征签名
    
    def to_dict(self) -> Dict:
        return {
            "round_number": self.round_number,
            "timestamp": self.timestamp.isoformat(),
            "phase": self.phase,
            "score": self.score,
            "error_message": self.error_message,
            "error_type": self.error_type,
            "strategy_signature": self.strategy_signature,
        }


@dataclass
class StagnationReport:
    """停滞检测报告"""
    is_stagnant: bool
    stagnation_type: Optional[StagnationType] = None
    confidence: float = 0.0  # 置信度 0-1
    detected_at: datetime = field(default_factory=datetime.now)
    window_size: int = 3
    records_analyzed: List[RoundRecord] = field(default_factory=list)
    
    # 人感反馈
    human_feedback: str = ""  # 像真人一样的反馈文案
    primary_contradiction: str = ""  # 识别的主要矛盾
    suggested_action: StrategyAction = StrategyAction.CONTINUE
    alternative_strategies: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "is_stagnant": self.is_stagnant,
            "stagnation_type": self.stagnation_type.value if self.stagnation_type else None,
            "confidence": self.confidence,
            "detected_at": self.detected_at.isoformat(),
            "human_feedback": self.human_feedback,
            "primary_contradiction": self.primary_contradiction,
            "suggested_action": self.suggested_action.value,
            "alternative_strategies": self.alternative_strategies,
        }


class StagnationDetector:
    """
    停滞检测器 - 元认知监控核心
    
    检测逻辑：
    1. 分数停滞：连续 N 轮评分波动 < threshold
    2. 错误循环：连续 N 轮报错信息完全相同
    3. 超时：单轮执行时间超过阈值
    4. 资源耗尽：Token 或内存使用超过阈值
    
    使用方式：
        detector = StagnationDetector(window_size=3)
        
        # 每轮博弈后调用
        report = detector.check(
            round_number=1,
            phase="reviewer",
            score=75.0,
            error_message=None,
            strategy_signature="strategy_v1"
        )
        
        if report.is_stagnant:
            print(report.human_feedback)  # "我发现当前的修复路径已陷入死循环..."
    """
    
    def __init__(
        self,
        window_size: int = 3,
        score_threshold: float = 0.01,  # 分数波动阈值
        timeout_seconds: float = 300.0,  # 单轮超时
        max_rounds: int = 10,  # 最大轮数
    ):
        self.window_size = window_size
        self.score_threshold = score_threshold
        self.timeout_seconds = timeout_seconds
        self.max_rounds = max_rounds
        
        self.history: List[RoundRecord] = []
        self.current_round = 0
        
        # 策略切换回调
        self._strategy_switch_callbacks: List[Callable[[StagnationReport], Any]] = []
    
    def on_strategy_switch(self, callback: Callable[[StagnationReport], Any]):
        """注册策略切换回调"""
        self._strategy_switch_callbacks.append(callback)
        return callback
    
    def check(
        self,
        round_number: int,
        phase: str,
        score: float,
        error_message: Optional[str] = None,
        error_type: Optional[str] = None,
        strategy_signature: str = "",
        execution_time: Optional[float] = None,
    ) -> StagnationReport:
        """
        检查是否陷入停滞
        
        Args:
            round_number: 当前轮数
            phase: 当前阶段
            score: 当前评分
            error_message: 错误信息
            error_type: 错误类型
            strategy_signature: 策略特征签名
            execution_time: 执行耗时（秒）
        
        Returns:
            StagnationReport: 停滞检测报告
        """
        self.current_round = round_number
        
        # 记录本轮
        record = RoundRecord(
            round_number=round_number,
            timestamp=datetime.now(),
            phase=phase,
            score=score,
            error_message=error_message,
            error_type=error_type,
            strategy_signature=strategy_signature,
        )
        self.history.append(record)
        
        # 如果历史记录不足，直接返回
        if len(self.history) < self.window_size:
            return StagnationReport(is_stagnant=False)
        
        # 获取最近 window_size 轮记录
        recent_records = self.history[-self.window_size:]
        
        # 检查各种停滞类型
        checks = [
            self._check_score_stagnation(recent_records),
            self._check_error_looping(recent_records),
            self._check_timeout(execution_time),
            self._check_max_rounds(round_number),
        ]
        
        # 找到置信度最高的停滞类型
        stagnant_checks = [c for c in checks if c[0]]
        if stagnant_checks:
            # 按置信度排序
            stagnant_checks.sort(key=lambda x: x[2], reverse=True)
            stagnation_type, _, confidence = stagnant_checks[0]
            
            # 生成报告
            report = self._generate_report(
                stagnation_type=stagnation_type,
                confidence=confidence,
                records=recent_records,
            )
            
            # 触发回调
            for callback in self._strategy_switch_callbacks:
                try:
                    callback(report)
                except Exception:
                    pass
            
            return report
        
        return StagnationReport(is_stagnant=False)
    
    def _check_score_stagnation(self, records: List[RoundRecord]) -> tuple:
        """检查分数是否停滞"""
        scores = [r.score for r in records]
        score_range = max(scores) - min(scores)
        
        if score_range < self.score_threshold:
            # 计算置信度：波动越小，置信度越高
            confidence = 1.0 - (score_range / self.score_threshold)
            return (StagnationType.SCORE_STAGNANT, True, confidence)
        
        return (StagnationType.SCORE_STAGNANT, False, 0.0)
    
    def _check_error_looping(self, records: List[RoundRecord]) -> tuple:
        """检查错误是否循环"""
        errors = [r.error_message for r in records if r.error_message]
        
        if len(errors) < self.window_size:
            return (StagnationType.ERROR_LOOPING, False, 0.0)
        
        # 检查错误是否完全相同
        if len(set(errors)) == 1:
            # 所有错误都相同
            confidence = 0.9
            return (StagnationType.ERROR_LOOPING, True, confidence)
        
        # 检查错误类型是否相同
        error_types = [r.error_type for r in records if r.error_type]
        if len(set(error_types)) == 1 and len(error_types) == self.window_size:
            confidence = 0.7
            return (StagnationType.ERROR_LOOPING, True, confidence)
        
        return (StagnationType.ERROR_LOOPING, False, 0.0)
    
    def _check_timeout(self, execution_time: Optional[float]) -> tuple:
        """检查是否超时"""
        if execution_time and execution_time > self.timeout_seconds:
            confidence = min(execution_time / self.timeout_seconds - 1.0, 1.0)
            return (StagnationType.TIMEOUT, True, confidence)
        
        return (StagnationType.TIMEOUT, False, 0.0)
    
    def _check_max_rounds(self, round_number: int) -> tuple:
        """检查是否超过最大轮数"""
        if round_number >= self.max_rounds:
            confidence = 1.0
            return (StagnationType.RESOURCE_EXHAUSTED, True, confidence)
        
        return (StagnationType.RESOURCE_EXHAUSTED, False, 0.0)
    
    def _generate_report(
        self,
        stagnation_type: StagnationType,
        confidence: float,
        records: List[RoundRecord],
    ) -> StagnationReport:
        """生成停滞检测报告"""
        
        # 识别人感反馈文案
        human_feedback = self._generate_human_feedback(stagnation_type, records)
        
        # 识别主要矛盾
        primary_contradiction = self._identify_primary_contradiction(stagnation_type, records)
        
        # 建议动作
        suggested_action = self._suggest_action(stagnation_type)
        
        # 备选策略
        alternative_strategies = self._generate_alternatives(stagnation_type)
        
        return StagnationReport(
            is_stagnant=True,
            stagnation_type=stagnation_type,
            confidence=confidence,
            window_size=self.window_size,
            records_analyzed=records,
            human_feedback=human_feedback,
            primary_contradiction=primary_contradiction,
            suggested_action=suggested_action,
            alternative_strategies=alternative_strategies,
        )
    
    def _generate_human_feedback(
        self,
        stagnation_type: StagnationType,
        records: List[RoundRecord],
    ) -> str:
        """生成像真人一样的反馈文案"""
        
        if stagnation_type == StagnationType.SCORE_STAGNANT:
            scores = [r.score for r in records]
            avg_score = sum(scores) / len(scores)
            
            if avg_score < 50:
                return (
                    f"🤔 我发现当前的修复路径已陷入死循环。"
                    f"连续 {self.window_size} 轮的评分都在 {avg_score:.1f} 分左右徘徊，"
                    f"说明当前策略无法有效解决问题。"
                    f"主要矛盾在于：基础方案存在结构性缺陷，需要切换思路。"
                    f"我将尝试从 GitHub 寻找新工具或采用完全不同的修复策略。"
                )
            else:
                return (
                    f"📊 修复进展陷入停滞。"
                    f"评分在 {min(scores):.1f} 到 {max(scores):.1f} 之间波动，"
                    f"改进幅度微乎其微。"
                    f"这表明我们已经触及了当前方法的性能天花板，"
                    f"需要引入新的验证维度或调整评分标准。"
                )
        
        elif stagnation_type == StagnationType.ERROR_LOOPING:
            error_msg = records[-1].error_message or "Unknown error"
            error_preview = error_msg[:100] + "..." if len(error_msg) > 100 else error_msg
            
            return (
                f"🔄 我陷入了错误循环。"
                f"连续 {self.window_size} 轮都遇到相同的错误：{error_preview}"
                f"这说明我没有真正理解问题的根源，只是在表面打转。"
                f"主要矛盾在于：错误处理逻辑存在盲区。"
                f"让我停下来深度反思，重新分析错误上下文。"
            )
        
        elif stagnation_type == StagnationType.TIMEOUT:
            return (
                f"⏱️ 执行超时了。"
                f"这一轮的执行时间超过了 {self.timeout_seconds} 秒的阈值，"
                f"可能是遇到了死循环或资源竞争。"
                f"我需要检查是否有无限循环的代码，或者简化当前的处理逻辑。"
            )
        
        elif stagnation_type == StagnationType.RESOURCE_EXHAUSTED:
            return (
                f"💀 已达到最大尝试次数 ({self.max_rounds} 轮)。"
                f"这个问题可能比预期的更复杂，或者我的能力边界暂时无法覆盖。"
                f"建议：1) 人工介入分析 2) 分解任务为更小的子任务 3) 升级模型能力"
            )
        
        return "检测到停滞状态，正在重新评估策略..."
    
    def _identify_primary_contradiction(
        self,
        stagnation_type: StagnationType,
        records: List[RoundRecord],
    ) -> str:
        """识别主要矛盾"""
        
        contradictions = {
            StagnationType.SCORE_STAGNANT: "策略能力与问题复杂度不匹配",
            StagnationType.ERROR_LOOPING: "错误理解深度不足，停留在表象修复",
            StagnationType.TIMEOUT: "计算资源与任务规模失衡",
            StagnationType.RESOURCE_EXHAUSTED: "问题边界定义不清，任务过于宏大",
        }
        
        return contradictions.get(stagnation_type, "未知矛盾")
    
    def _suggest_action(self, stagnation_type: StagnationType) -> StrategyAction:
        """建议动作"""
        
        actions = {
            StagnationType.SCORE_STAGNANT: StrategyAction.PIVOT_STRATEGY,
            StagnationType.ERROR_LOOPING: StrategyAction.PIVOT_STRATEGY,
            StagnationType.TIMEOUT: StrategyAction.ESCALATE,
            StagnationType.RESOURCE_EXHAUSTED: StrategyAction.HALT,
        }
        
        return actions.get(stagnation_type, StrategyAction.CONTINUE)
    
    def _generate_alternatives(self, stagnation_type: StagnationType) -> List[str]:
        """生成备选策略"""
        
        alternatives = {
            StagnationType.SCORE_STAGNANT: [
                "从 GitHub 搜索相似问题的解决方案",
                "引入新的验证维度（如性能测试）",
                "降低当前目标，先实现最小可行版本",
                "切换模型或调整 temperature 参数",
            ],
            StagnationType.ERROR_LOOPING: [
                "深度分析错误堆栈，定位根因",
                "引入异常隔离机制，分段执行",
                "增加前置条件检查",
                "采用防御式编程，增加容错处理",
            ],
            StagnationType.TIMEOUT: [
                "增加超时检测和优雅降级",
                "分解任务为异步子任务",
                "优化算法复杂度",
                "增加资源配额",
            ],
            StagnationType.RESOURCE_EXHAUSTED: [
                "人工介入分析",
                "任务分解为更小的子任务",
                "升级模型能力或上下文长度",
                "暂停任务，等待资源释放",
            ],
        }
        
        return alternatives.get(stagnation_type, [])
    
    def get_history(self) -> List[Dict]:
        """获取历史记录"""
        return [r.to_dict() for r in self.history]
    
    def reset(self):
        """重置检测器"""
        self.history = []
        self.current_round = 0


class AdaptiveStrategy:
    """
    自适应策略管理器
    
    根据停滞检测报告自动切换策略
    """
    
    def __init__(self):
        self.strategies: Dict[str, Dict] = {}
        self.current_strategy: Optional[str] = None
        self.strategy_history: List[Dict] = []
    
    def register_strategy(
        self,
        name: str,
        description: str,
        executor: Callable,
        fallback_to: Optional[str] = None,
    ):
        """注册策略"""
        self.strategies[name] = {
            "name": name,
            "description": description,
            "executor": executor,
            "fallback_to": fallback_to,
            "usage_count": 0,
            "success_count": 0,
        }
    
    def switch_strategy(self, report: StagnationReport) -> Optional[str]:
        """根据停滞报告切换策略"""
        
        if report.suggested_action == StrategyAction.PIVOT_STRATEGY:
            # 尝试备选策略
            for alt in report.alternative_strategies:
                # 简化：返回第一个备选策略
                return f"切换到: {alt}"
        
        elif report.suggested_action == StrategyAction.ESCALATE:
            return "升级到更强的模型或更多资源"
        
        elif report.suggested_action == StrategyAction.HALT:
            return "停止执行，等待人工介入"
        
        return None
    
    def get_strategy_stats(self) -> Dict:
        """获取策略统计"""
        return {
            name: {
                "usage_count": s["usage_count"],
                "success_count": s["success_count"],
                "success_rate": s["success_count"] / s["usage_count"] if s["usage_count"] > 0 else 0,
            }
            for name, s in self.strategies.items()
        }


# ───────────────────────────────────────────────────────────────────────────────
# 全局实例
# ───────────────────────────────────────────────────────────────────────────────

_detector: Optional[StagnationDetector] = None


def get_stagnation_detector() -> StagnationDetector:
    """获取全局停滞检测器"""
    global _detector
    if _detector is None:
        _detector = StagnationDetector()
    return _detector


def reset_stagnation_detector():
    """重置全局检测器"""
    global _detector
    _detector = None


# ───────────────────────────────────────────────────────────────────────────────
# 测试
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    detector = StagnationDetector(window_size=3)
    
    print("=" * 60)
    print("StagnationDetector 测试")
    print("=" * 60)
    
    # 模拟分数停滞
    print("\n--- 测试分数停滞 ---")
    for i in range(1, 5):
        report = detector.check(
            round_number=i,
            phase="reviewer",
            score=75.0,  # 固定分数
            strategy_signature="strategy_v1"
        )
        print(f"Round {i}: score=75.0, stagnant={report.is_stagnant}")
        if report.is_stagnant:
            print(f"\n🚨 检测到停滞！")
            print(f"类型: {report.stagnation_type.value}")
            print(f"置信度: {report.confidence:.2f}")
            print(f"\n💬 人感反馈:\n{report.human_feedback}")
            print(f"\n🎯 主要矛盾: {report.primary_contradiction}")
            print(f"📋 建议动作: {report.suggested_action.value}")
            print(f"🔀 备选策略: {report.alternative_strategies}")
    
    # 重置，测试错误循环
    detector.reset()
    print("\n" + "=" * 60)
    print("--- 测试错误循环 ---")
    
    for i in range(1, 5):
        report = detector.check(
            round_number=i,
            phase="validator",
            score=0.0,
            error_message="TypeError: cannot concatenate 'str' and 'int' objects",
            error_type="TypeError",
            strategy_signature="strategy_v1"
        )
        print(f"Round {i}: error=TypeError, stagnant={report.is_stagnant}")
        if report.is_stagnant:
            print(f"\n🚨 检测到错误循环！")
            print(f"\n💬 人感反馈:\n{report.human_feedback}")
