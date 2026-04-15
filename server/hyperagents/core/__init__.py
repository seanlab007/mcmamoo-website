"""
MaoAI Core - 「手脑合一」核心能力模块
═══════════════════════════════════════════════════════════════════════════════
战略之脑 + 执行之手 = 通用智能指挥官

MaoAI 3.0 "破壁者" 架构:
- healing_agent/: 运行时自修复循环 (怀疑精神)
- skill_registry/: 进化技能系统 (技能实验室)
- mcp_tool_bus/: MCP 万用工具总线
- modules/: 执行之手
  - browser_agent: 浏览器自动化 (Manus Max级别)
  - sandbox_engine: 隔离执行环境
- memory/: 长记忆
- streaming/: 流式协同
- multimodal/: 多模态感知
- sentinel/: 战略哨兵
- adversarial/: 红蓝对抗

MaoAI 3.0 Phase 8 "性能革命":
- scheduler/: Map-Reduce 任务调度器 (异构并行集群)
- streaming/enhanced_stream_broker.py: 增强版流式博弈引擎
- speculative_executor.py: 推测性执行器 (空间换时间)
"""

# ─── 3.0 新增核心模块 ─────────────────────────────────────────────────────────
from .healing_agent import (
    HealingAgent,
    HealingReport,
    HealingStatus,
    HealingPatch,
    ErrorContext,
    reality_check,
    get_healing_agent,
)
from .skill_registry import (
    SkillRegistry,
    SkillManifest,
    SkillStatus,
    SkillSource,
    get_skill_registry,
)
from .mcp_tool_bus import (
    MCPToolBus,
    MCPTool,
    MCPServer,
    ToolCallResult,
    get_tool_bus,
)

# ─── 2.0 既有模块 ─────────────────────────────────────────────────────────────
from .modules import BrowserAgent, SandboxEngine, BrowserTask, SandboxTask
from .memory import DecisionLedger, ExperienceInheritance, Decision
from .streaming import StreamBroker, StreamMessage, AgentType
from .multimodal import VisionStrategist, VisualData, StrategicAnalysis
from .sentinel import StrategicSentinel, AlertLevel, MonitorEvent
from .adversarial import RedBlueAdversarial, RedAgent, BlueAgent, Proposal

# ─── Phase 8: 性能革命模块 ────────────────────────────────────────────────────
from .scheduler import (
    MapReduceScheduler,
    TaskSplitter,
    PatchMerger,
    SubTask,
    TaskResult,
    create_map_reduce_scheduler,
)
from .streaming.enhanced_stream_broker import (
    EnhancedStreamBroker,
    StreamingCoder,
    StreamingReviewer,
    ValidatorWarming,
    BackpressureController,
    StreamChunk,
    create_stream_broker,
)
from .speculative_executor import (
    SpeculativeExecutor,
    SpeculativeResult,
    StrategySelector,
    ResultCache,
    AdaptiveCooling,
    StrategyType,
    create_speculative_executor,
)

__all__ = [
    # ─── 3.0 新增 ─────────────────────────────────────────────────────────────
    # Healing Agent (自愈)
    "HealingAgent", "HealingReport", "HealingStatus", "HealingPatch",
    "ErrorContext", "reality_check", "get_healing_agent",
    # Skill Registry (技能实验室)
    "SkillRegistry", "SkillManifest", "SkillStatus", "SkillSource",
    "get_skill_registry",
    # MCP Tool Bus (万用工具)
    "MCPToolBus", "MCPTool", "MCPServer", "ToolCallResult", "get_tool_bus",
    # ─── 2.0 既有 ─────────────────────────────────────────────────────────────
    # 执行之手
    "BrowserAgent", "SandboxEngine", "BrowserTask", "SandboxTask",
    # 长记忆
    "DecisionLedger", "ExperienceInheritance", "Decision",
    # 流式协同
    "StreamBroker", "StreamMessage", "AgentType",
    # 多模态感知
    "VisionStrategist", "VisualData", "StrategicAnalysis",
    # 战略哨兵
    "StrategicSentinel", "AlertLevel", "MonitorEvent",
    # 红蓝对抗
    "RedBlueAdversarial", "RedAgent", "BlueAgent", "Proposal",
    # ─── Phase 8: 性能革命 ─────────────────────────────────────────────────────
    # Map-Reduce 调度器
    "MapReduceScheduler", "TaskSplitter", "PatchMerger", "SubTask", "TaskResult",
    "create_map_reduce_scheduler",
    # 流式博弈引擎
    "EnhancedStreamBroker", "StreamingCoder", "StreamingReviewer",
    "ValidatorWarming", "BackpressureController", "StreamChunk",
    "create_stream_broker",
    # 推测性执行器
    "SpeculativeExecutor", "SpeculativeResult", "StrategySelector",
    "ResultCache", "AdaptiveCooling", "StrategyType",
    "create_speculative_executor",
]

__version__ = "3.0.8"
__codename__ = "性能革命"
__author__ = "MaoAI"
__phase__ = "Phase 8 - Map-Reduce + Streaming + Speculative Execution"
