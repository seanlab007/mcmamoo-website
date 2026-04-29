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

# ─── Phase 6: 异构模型博弈适配器 ─────────────────────────────────────────────
# GLM-4 (Reviewer/Validator) + Claude Code Local (Coder)
try:
    from .glm_adapter import (
        glm_review,
        glm_generate_test_cases,
        glm_validate,
        is_glm_available,
    )
    _HAS_GLM = True
except ImportError:
    _HAS_GLM = False

try:
    from .claude_code_adapter import (
        claude_generate,
        claude_code_local,
        claude_code_api,
        is_claude_available,
    )
    _HAS_CLAUDE_CODE = True
except ImportError:
    _HAS_CLAUDE_CODE = False

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
    "create_adversarial_loop",
    # Phase 6: 异构模型博弈
    "glm_review",
    "glm_generate_test_cases",
    "glm_validate",
    "is_glm_available",
    "claude_generate",
    "claude_code_local",
    "claude_code_api",
    "is_claude_available",
]
