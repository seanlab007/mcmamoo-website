"""
MaoAI Core - 「手脑合一」核心能力模块

战略之脑 + 执行之手 = 通用智能指挥官

模块结构:
- modules/: 执行之手
  - browser_agent: 浏览器自动化 (Manus Max级别)
  - sandbox_engine: 隔离执行环境
  
- memory/: 长记忆
  - decision_ledger: 决策日志图谱
  - experience_inheritance: 经验传承引擎
  
- streaming/: 流式协同
  - stream_broker: WebSocket实时通信
  
- multimodal/: 多模态感知
  - vision_strategist: 视觉战略分析
  
- sentinel/: 战略哨兵
  - strategic_sentinel: 24小时主动监控
  
- adversarial/: 红蓝对抗
  - red_blue_agents: 红蓝对抗引擎
"""

from .modules import BrowserAgent, SandboxEngine, BrowserTask, SandboxTask
from .memory import DecisionLedger, ExperienceInheritance, Decision
from .streaming import StreamBroker, StreamMessage, AgentType
from .multimodal import VisionStrategist, VisualData, StrategicAnalysis
from .sentinel import StrategicSentinel, AlertLevel, MonitorEvent
from .adversarial import RedBlueAdversarial, RedAgent, BlueAgent, Proposal

__all__ = [
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
    "RedBlueAdversarial", "RedAgent", "BlueAgent", "Proposal"
]

__version__ = "2.0.0"
__author__ = "MaoAI"
