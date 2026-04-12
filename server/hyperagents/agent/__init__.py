# HyperAgents Agent 模块
from .swarm import (
    BaseAgent,
    ArchitectAgent,
    CoderAgent,
    ReviewerAgent as SwarmReviewerAgent,
    TestAgent,
    MultiAgentSwarm,
    AgentRole,
    AgentMessage,
    ReviewResult,
    TestResult,
    log_step
)
from .reviewer_agent import (
    ReviewerAgent,
    ReviewResult as DetailedReviewResult,
    ReviewIssue,
    ReviewDimension,
    StaticAnalysisRules,
    ReviewerAgent as AdversarialReviewer
)
from .coder_agent import (
    CoderAgent as GenerationCoderAgent,
    GenerationMode,
    GenerationResult,
    CodeContext
)
from .adversarial_loop import (
    AdversarialLoop,
    LoopResult,
    LoopStatus,
    IterationResult,
    create_adversarial_loop
)

__all__ = [
    # Swarm 模块
    "BaseAgent",
    "ArchitectAgent",
    "CoderAgent",
    "SwarmReviewerAgent",
    "TestAgent",
    "MultiAgentSwarm",
    "AgentRole",
    "AgentMessage",
    "ReviewResult",
    "TestResult",
    "log_step",
    # Reviewer 模块
    "ReviewerAgent",
    "DetailedReviewResult",
    "ReviewIssue",
    "ReviewDimension",
    "StaticAnalysisRules",
    "AdversarialReviewer",
    # Coder 模块（独立版）
    "GenerationCoderAgent",
    "GenerationMode",
    "GenerationResult",
    "CodeContext",
    # Adversarial Loop 模块
    "AdversarialLoop",
    "LoopResult",
    "LoopStatus",
    "IterationResult",
    "create_adversarial_loop"
]
