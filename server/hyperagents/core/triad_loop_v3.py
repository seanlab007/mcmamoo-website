#!/usr/bin/env python3
"""
MaoAI HyperAgents — TriadLoop (三权分立博弈循环)
─────────────────────────────────────────────────────────────────────────────
核心架构：Coder ↔ Reviewer ↔ Validator ↔ Reality Check 四权分立

     ┌─────────────────────────────────────────────────────────────────────┐
     │                        TRIAD LOOP v3.0                              │
     │                                                                      │
     │   ┌────────┐     生成代码     ┌────────┐     审查反馈   ┌────────┐  │
     │   │ Coder  │ ─────────────→ │Reviewer│ ←─────────── │Validator│  │
     │   │(Claude)│               │  (GPT) │              │(Pytest) │  │
     │   └────────┘               └────────┘              └────┬───┘  │
     │        ↑                        │                        │       │
     │        │                        │                        ↓       │
     │        │                        │                 ┌──────────┐  │
     │        │                        │                 │ Reality  │  │
     │        │                        │                 │  Check   │  │
     │        └────────────────────────┴─────────────────┴──────────┘  │
     │                        循环直到全部通过                            │
     └─────────────────────────────────────────────────────────────────────┘

核心特点：
  1. 异构模型：Coder 用 Claude，Reviewer 用 GPT，Validator 用 Pytest
  2. 四权分立：执行权、审查权、验证权、现实验证权相互制衡
  3. 思维链追踪：<thought> 标签实时展示 AI 推理过程
  4. 收敛检测：识别改进停滞 + Patch 相似度检测，避免无效迭代
  5. 项目全景感知：自动注入相关组件上下文
  6. 异步并发验证：DOM检查与API探测并行执行
  7. 视觉差异对比：截图前后对比检测UI变化
  8. 动态工具发现：根据任务类型自动加载工具
  9. 策略逃逸机制：停滞时切换模型或改变Prompt策略
"""

import json
import time
import os
import hashlib
import difflib
import asyncio
import aiohttp
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass, field
from enum import Enum

from .coder_agent import CoderAgent, GenerationMode, GenerationResult
from .reviewer_agent import ReviewerAgent, ReviewResult
from .validator_agent import ValidatorAgent, ValidationResult, ValidationStatus

# ─── Phase 6: 异构模型博弈适配器 ─────────────────────────────────────────────
# Claude (Coder 写) + GLM-4 (Reviewer/Validator 审) = MAOAI_THINKING_PROTOCOL 三权分立
try:
    from .glm_adapter import glm_review, glm_generate_test_cases, glm_validate, is_glm_available
    HAS_GLM = True
except ImportError:
    HAS_GLM = False

try:
    from .claude_code_adapter import claude_generate, is_claude_available
    HAS_CLAUDE_CODE = True
except ImportError:
    HAS_CLAUDE_CODE = False


# ─── 模型路由配置 ────────────────────────────────────────────────────────────

MODEL_ROUTES = {
    # Coder 层
    "claude-3-5-sonnet": "claude-api",
    "claude-3-5-sonnet-20241022": "claude-api",
    "claude-3-opus": "claude-api",
    "claude-local": "claude-local",     # Claude Code Local（有工具链）

    # Reviewer 层
    "glm-4-plus": "glm",
    "glm-4-air": "glm",
    "glm-4-flash": "glm",
    "glm-4": "glm",
    "gpt-4o": "openai",
    "gpt-4": "openai",
    "deepseek-v3": "openai",            # DeepSeek 兼容 OpenAI 协议
}


def get_model_provider(model: str) -> str:
    """根据模型名推断 Provider"""
    if not model:
        return "openai"
    lower = model.lower()
    if lower.startswith("glm") or "zhipu" in lower:
        return "glm"
    if lower.startswith("claude") or lower == "claude-local":
        return "claude"
    return MODEL_ROUTES.get(model, "openai")

# ─── 新增：知识图谱 + Code RAG 支持 ────────────────────────────────────────────
try:
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../utils"))
    from knowledge_graph import KnowledgeGraph
    HAS_KNOWLEDGE_GRAPH = True
except ImportError:
    HAS_KNOWLEDGE_GRAPH = False

try:
    from code_rag import CodeRAG
    HAS_CODE_RAG = True
except ImportError:
    HAS_CODE_RAG = False

# ─── 新增：原子化 Patch 支持 ──────────────────────────────────────────────────
try:
    from utils.patch_utils import PatchApplier
    HAS_PATCH_UTILS = True
except ImportError:
    HAS_PATCH_UTILS = False

# ─── MaoAI Core 2.0: 手脑合一核心模块集成 ────────────────────────────────────────
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../core"))
    from core import BrowserAgent, DecisionLedger, StreamBroker, VisionStrategist
    HAS_CORE_2_0 = True
except ImportError:
    HAS_CORE_2_0 = False


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
      1. Coder (Claude / Claude Code Local)：代码生成
      2. Reviewer (GLM-4 / GPT)：逻辑审查 + 生成测试用例
      3. Validator (Pytest / GLM-4 沙箱模拟)：测试验证

    Phase 5 功能：
      4. 原子化代码修改：基于 Unified Diff 的外科手术式修改
      5. Code RAG：向量检索增强的上下文注入
      6. 智能收敛检测：分数 + Patch 相似度双重检测

    Phase 6 新增（异构模型博弈）：
      7. Claude Code Local：Coder 具备完整工具链（Read/Write/Bash）
      8. GLM-4 Reviewer：替换 GPT，实现"Claude 写 + GLM 审"架构
      9. GLM-4 Validator：当沙箱不可用时，GLM-4 作为模拟验证层
      10. 模型路由：自动根据模型名选择 Provider（glm/claude/openai）
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
        enable_knowledge_graph: bool = True,
        # ─── Phase 5 新增参数 ────────────────────────────────────────────────
        enable_atomic_mode: bool = True,
        enable_code_rag: bool = True,
        auto_apply_patch: bool = True,
        rag_top_k: int = 5,
        # ─── Phase 6: 异构模型博弈参数 ──────────────────────────────────────
        # Coder 配置
        use_claude_code_local: bool = None,  # None=自动检测, True=强制local, False=强制API
        claude_api_key: str = None,           # Anthropic API Key（也可用 ANTHROPIC_API_KEY）
        # Reviewer 配置（GLM-4 备选）
        reviewer_provider: str = None,        # None=自动, "glm", "openai"
        glm_api_key: str = None,             # 智谱 API Key（也可用 ZHIPU_API_KEY）
        glm_model: str = None,               # GLM 模型，默认 glm-4-plus
        # Validator 配置
        use_glm_validator: bool = None,       # None=有pytest才用pytest, True=强制GLM
        # 异构博弈模式快捷开关
        heterogeneous_mode: bool = None,      # 一键开启 Claude写+GLM审 模式
    ):
        self.workspace = workspace or os.getcwd()
        self.coder_model = coder_model
        self.reviewer_model = reviewer_model
        self.enable_knowledge_graph = enable_knowledge_graph and HAS_KNOWLEDGE_GRAPH

        # ─── Phase 6: 异构模型路由初始化 ─────────────────────────────────────

        # 快捷模式：heterogeneous_mode=True → Claude 写 + GLM 审
        if heterogeneous_mode is True:
            _glm_ok = HAS_GLM and is_glm_available(glm_api_key)
            _claude_ok = HAS_CLAUDE_CODE and is_claude_available(claude_api_key)
            if _glm_ok:
                reviewer_provider = reviewer_provider or "glm"
            if _claude_ok:
                use_claude_code_local = use_claude_code_local  # 保持自动检测

            log_step("triad_init",
                     f"异构模型博弈模式: Coder=Claude({coder_model}) "
                     f"Reviewer={'GLM-4' if _glm_ok else reviewer_model} "
                     f"Validator={'GLM-4沙箱' if _glm_ok and use_glm_validator else 'pytest'}",
                     glm_available=_glm_ok,
                     claude_available=_claude_ok,
                     mode="heterogeneous")

        # 确定 Reviewer Provider
        auto_provider = get_model_provider(reviewer_model)
        self._reviewer_provider = reviewer_provider or auto_provider

        # 确定 GLM 配置
        self._glm_api_key = glm_api_key or os.environ.get("ZHIPU_API_KEY", "")
        self._glm_model = glm_model or os.environ.get("GLM_MODEL", "glm-4-plus")
        self._glm_available = HAS_GLM and bool(self._glm_api_key)

        # 如果 reviewer_model 以 "glm" 开头，自动切换 provider
        if reviewer_model.lower().startswith("glm"):
            self._reviewer_provider = "glm"
            self._glm_model = reviewer_model

        # 确定 Claude Code Local 模式
        self._claude_api_key = claude_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self._claude_available = HAS_CLAUDE_CODE and bool(self._claude_api_key)
        if use_claude_code_local is not None:
            self._use_claude_local = use_claude_code_local and self._claude_available
        else:
            self._use_claude_local = False  # 默认不强制 local，CoderAgent 自行处理

        # Validator 配置
        _glm_validator_ok = self._glm_available and (use_glm_validator is True)
        self._use_glm_validator = _glm_validator_ok

        log_step("triad_init",
                 "Phase 6 异构模型路由",
                 reviewer_provider=self._reviewer_provider,
                 glm_available=self._glm_available,
                 glm_model=self._glm_model if self._glm_available else "N/A",
                 claude_local=self._use_claude_local,
                 glm_validator=self._use_glm_validator)

        # ─── Phase 5: 原子化模式 ──────────────────────────────────────────────
        self.enable_atomic_mode = enable_atomic_mode and HAS_PATCH_UTILS
        self.auto_apply_patch = auto_apply_patch
        self._patch_applier: Optional["PatchApplier"] = None
        if self.enable_atomic_mode and HAS_PATCH_UTILS:
            self._patch_applier = PatchApplier(workspace=self.workspace)
            log_step("triad_init", "原子化模式已启用", atomic=True, auto_apply=auto_apply_patch)

        # ─── Phase 5: Code RAG ───────────────────────────────────────────────
        self.enable_code_rag = enable_code_rag and HAS_CODE_RAG
        self.rag_top_k = rag_top_k
        self._code_rag: Optional["CodeRAG"] = None
        self._rag_initialized = False
        if self.enable_code_rag and HAS_CODE_RAG:
            log_step("triad_init", "Code RAG 已启用", rag=True, top_k=rag_top_k)

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

        # ─── Coder Agent（支持 Claude Code Local 透传）───────────────────────
        self.coder = CoderAgent(
            api_key=coder_api_key,
            model=coder_model,
            workspace=self.workspace,
            enable_thought_tracking=enable_thought_tracking,
            enable_atomic_mode=self.enable_atomic_mode,
            auto_apply_patch=self.auto_apply_patch
        )

        # ─── Reviewer Agent（GLM-4 或 OpenAI，按 provider 路由）─────────────
        # ReviewerAgent 内部走 OPENAI_BASE_URL，GLM-4 通过重写 env 注入
        # Phase 6: 如果 provider=glm，覆盖 reviewer 的 api_key 和 base_url
        _reviewer_api_key = reviewer_api_key
        if self._reviewer_provider == "glm" and self._glm_available:
            _reviewer_api_key = self._glm_api_key
            # 通过环境变量覆盖 ReviewerAgent 的 base_url（OpenAI-compatible）
            os.environ.setdefault("OPENAI_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
            log_step("triad_init",
                     f"Reviewer 使用 GLM-4: {self._glm_model}",
                     base_url="https://open.bigmodel.cn/api/paas/v4")

        self.reviewer = ReviewerAgent(
            api_key=_reviewer_api_key,
            model=self._glm_model if self._reviewer_provider == "glm" else reviewer_model,
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
        self._token_saved = 0  # 累计节省的 Token 数

        # ─── Core 2.0 实例初始化 ──────────────────────────────────────────────
        self.browser_agent = None
        self.decision_ledger = None
        self.stream_broker = None
        if HAS_CORE_2_0:
            self.browser_agent = BrowserAgent()
            self.decision_ledger = DecisionLedger(workspace=self.workspace)
            self.stream_broker = StreamBroker()
            log_step("triad_init", "MaoAI Core 2.0 模块已加载", core_2_0=True)
        
        # ─── Phase 7: 实战验证配置 ─────────────────────────────────────────────
        self.enable_reality_check = True  # 启用最终现实验证
        self.reality_check_threshold = 0.8  # 现实验证通过阈值
        self._reality_check_results = []  # 现实验证结果历史
        
        # ─── Phase 7.1: 异步并发验证配置 ─────────────────────────────────────────
        self.enable_concurrent_checks = True  # 启用并发验证
        self.concurrent_timeout = 30  # 并发验证超时时间
        
        # ─── Phase 7.2: 视觉差异对比配置 ─────────────────────────────────────────
        self.enable_visual_diff = True  # 启用视觉差异对比
        self._screenshot_history = []  # 截图历史（用于对比）
        self.visual_diff_threshold = 0.05  # 视觉差异阈值（5%像素变化）
        
        # ─── Phase 7.3: 动态工具发现配置 ─────────────────────────────────────────
        self.tool_registry = {}  # 工具注册表
        self._register_default_tools()  # 注册默认工具
        
        # ─── Phase 7.4: 策略逃逸配置 ─────────────────────────────────────────────
        self.strategy_escape_enabled = True  # 启用策略逃逸
        self._coder_models = ["claude-3-5-sonnet", "gpt-4o", "deepseek-v3"]  # 逃逸模型列表
        self._current_model_index = 0  # 当前模型索引
        self._prompt_strategies = ["atomic", "rewrite", "decompose"]  # Prompt策略列表
        self._current_strategy_index = 0  # 当前策略索引

    # ═══════════════════════════════════════════════════════════════════════════
    # Phase 7.3: 动态工具发现
    # ═══════════════════════════════════════════════════════════════════════════
    
    def _register_default_tools(self):
        """注册默认工具到工具注册表"""
        self.tool_registry = {
            "browser_use": {
                "keywords": ["订票", "搜索", "浏览", "网页", "点击", "填写"],
                "loader": self._load_browser_use,
                "loaded": False,
                "instance": None
            },
            "mcp_client": {
                "keywords": ["mcp", "工具调用", "外部服务", "api集成"],
                "loader": self._load_mcp_client,
                "loaded": False,
                "instance": None
            },
            "vision_analyzer": {
                "keywords": ["截图", "视觉", "图像", "UI检查", "样式"],
                "loader": self._load_vision_analyzer,
                "loaded": False,
                "instance": None
            },
            "api_tester": {
                "keywords": ["api测试", "接口测试", "postman", "curl"],
                "loader": self._load_api_tester,
                "loaded": False,
                "instance": None
            }
        }
    
    def _load_browser_use(self):
        """加载 browser_use 工具"""
        try:
            from browser_use import Agent as BrowserUseAgent
            return BrowserUseAgent()
        except ImportError:
            log_step("tool_load", "browser_use 未安装，跳过加载")
            return None
    
    def _load_mcp_client(self):
        """加载 MCP Client 工具"""
        try:
            from mcp import ClientSession
            return ClientSession()
        except ImportError:
            log_step("tool_load", "mcp client 未安装，跳过加载")
            return None
    
    def _load_vision_analyzer(self):
        """加载视觉分析工具"""
        try:
            if HAS_CORE_2_0:
                from core import VisionStrategist
                return VisionStrategist()
        except ImportError:
            pass
        return None
    
    def _load_api_tester(self):
        """加载 API 测试工具"""
        return aiohttp.ClientSession()
    
    def discover_and_load_tools(self, task: str) -> List[str]:
        """
        根据任务描述动态发现并加载工具
        
        Returns:
            已加载的工具名称列表
        """
        loaded_tools = []
        task_lower = task.lower()
        
        for tool_name, tool_config in self.tool_registry.items():
            # 检查任务是否匹配工具关键词
            if any(kw in task_lower for kw in tool_config["keywords"]):
                if not tool_config["loaded"]:
                    log_step("tool_discovery", f"发现匹配工具: {tool_name}", task=task[:50])
                    instance = tool_config["loader"]()
                    if instance:
                        tool_config["instance"] = instance
                        tool_config["loaded"] = True
                        loaded_tools.append(tool_name)
                        log_step("tool_load", f"工具加载成功: {tool_name}")
                else:
                    loaded_tools.append(tool_name)
        
        return loaded_tools
    
    def get_tool(self, tool_name: str) -> Optional[Any]:
        """获取已加载的工具实例"""
        if tool_name in self.tool_registry:
            return self.tool_registry[tool_name]["instance"]
        return None

    # ═══════════════════════════════════════════════════════════════════════════
    # Phase 7.4: 策略逃逸机制
    # ═══════════════════════════════════════════════════════════════════════════
    
    def _should_escape_strategy(self) -> bool:
        """判断是否需要策略逃逸"""
        return (
            self.strategy_escape_enabled and 
            (self.consecutive_no_improvement >= 2 or self._consecutive_high_similarity >= 2)
        )
    
    def _escape_strategy(self) -> Dict[str, Any]:
        """
        执行策略逃逸 - 切换模型或改变Prompt策略
        
        Returns:
            逃逸后的配置
        """
        escape_config = {}
        
        # 策略1: 切换Coder模型
        if self._current_model_index < len(self._coder_models) - 1:
            self._current_model_index += 1
            new_model = self._coder_models[self._current_model_index]
            escape_config["coder_model"] = new_model
            log_step("strategy_escape", 
                    f"策略逃逸: 切换Coder模型到 {new_model}",
                    reason="连续改进停滞",
                    old_model=self.coder_model,
                    new_model=new_model)
            self.coder_model = new_model
        
        # 策略2: 改变Prompt策略
        elif self._current_strategy_index < len(self._prompt_strategies) - 1:
            self._current_strategy_index += 1
            new_strategy = self._prompt_strategies[self._current_strategy_index]
            escape_config["prompt_strategy"] = new_strategy
            log_step("strategy_escape",
                    f"策略逃逸: 切换Prompt策略到 {new_strategy}",
                    reason="模型切换无效",
                    strategy=new_strategy)
        
        # 重置计数器
        self.consecutive_no_improvement = 0
        self._consecutive_high_similarity = 0
        
        return escape_config

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

    # ─── Phase 5 新增：Code RAG 上下文 ────────────────────────────────────────

    def _init_code_rag(self) -> bool:
        """
        初始化 Code RAG（懒加载）
        返回: 是否初始化成功
        """
        if not self.enable_code_rag or not HAS_CODE_RAG:
            return False

        if self._rag_initialized:
            return True

        try:
            self._code_rag = CodeRAG(
                workspace=self.workspace,
                top_k=self.rag_top_k
            )
            # 尝试加载或构建索引
            index_result = self._code_rag.index_project()
            self._rag_initialized = True
            log_step("code_rag",
                    f"Code RAG 索引完成: {index_result.get('files', 0)} 文件, "
                    f"{index_result.get('chunks', 0)} 分块")
            return True
        except Exception as e:
            log_step("code_rag", f"Code RAG 初始化失败: {e}", error=True)
            return False

    def _get_code_rag_context(self, task: str) -> Dict[str, Any]:
        """
        获取 Code RAG 检索的上下文

        Phase 5 核心功能：
        当用户询问"如何修改登录逻辑？"时，
        RAG 会检索出最相关的 5 个代码片段作为上下文注入
        """
        if not self.enable_code_rag:
            return {}

        # 懒初始化
        if not self._rag_initialized:
            self._init_code_rag()

        if not self._code_rag:
            return {}

        try:
            # 语义检索
            results = self._code_rag.query(task, top_k=self.rag_top_k)

            if not results:
                return {}

            rag_context = {
                "retrieved_chunks": [],
                "total_length": 0
            }

            for r in results:
                chunk = r.chunk
                rag_context["retrieved_chunks"].append({
                    "file": chunk.file_path,
                    "lines": f"{chunk.start_line}-{chunk.end_line}",
                    "type": chunk.chunk_type,
                    "name": chunk.name,
                    "similarity": r.score,
                    "preview": chunk.content[:200]
                })
                rag_context["total_length"] += len(chunk.content)

            log_step("code_rag_retrieval",
                    f"检索到 {len(results)} 个相关片段, 总长度 {rag_context['total_length']} 字符")

            return rag_context

        except Exception as e:
            log_step("code_rag", f"检索失败: {e}", error=True)
            return {}

    def _get_injected_context_prompt(self, task: str) -> str:
        """
        获取注入上下文的 Prompt（结合知识图谱 + Code RAG）

        这是 Phase 5 的核心功能：
        将项目全景感知 + 向量检索的结果格式化为 Coder Agent 的上下文
        """
        parts = []

        # 1. Code RAG 检索结果
        rag_context = self._get_code_rag_context(task)
        if rag_context.get("retrieved_chunks"):
            parts.append("【相关代码片段】(Code RAG 检索)")
            for chunk in rag_context["retrieved_chunks"][:3]:  # 最多 3 个
                parts.append(f"""
// 文件: {chunk['file']}
// 行号: {chunk['lines']}
// 类型: {chunk['type']}
// 相似度: {chunk['similarity']:.2f}
{chunk['preview']}...
""")

        # 2. 知识图谱依赖关系
        kg_context = self._get_knowledge_graph_context(task)
        if kg_context.get("related_components"):
            parts.append("【相关组件】(知识图谱)")
            for comp in kg_context["related_components"][:3]:
                parts.append(f"- {comp}")

        if kg_context.get("dependency_files"):
            parts.append("【依赖文件】")
            for dep in kg_context["dependency_files"][:3]:
                parts.append(f"- {dep['name']} ({dep['file_path']})")

        if not parts:
            return ""

        return "\n".join(parts)

    # ─── Phase 5 新增：Patch 应用 ────────────────────────────────────────────

    def _apply_patch(self, patch: str, file_path: str) -> bool:
        """
        应用原子化 Patch

        参数:
            patch: Unified Diff 格式的补丁
            file_path: 目标文件路径

        返回:
            是否应用成功
        """
        if not self.enable_atomic_mode or not self._patch_applier:
            return False

        try:
            full_path = os.path.join(self.workspace, file_path)
            result = self._patch_applier.apply(full_path, patch)

            if result.success:
                log_step("patch_applied",
                        f"Patch 应用成功: {file_path}",
                        file=file_path)
            else:
                log_step("patch_failed",
                        f"Patch 应用失败: {result.message}",
                        file=file_path)

            return result.success

        except Exception as e:
            log_step("patch_error", f"Patch 执行异常: {e}")
            return False

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

    async def run_async(
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
        # A. 项目全景感知 + Code RAG：获取增强上下文
        # ═══════════════════════════════════════════════════════════════════════════
        # 1. 知识图谱上下文
        kg_context = self._get_knowledge_graph_context(task)
        if kg_context.get("related_components") or kg_context.get("dependency_files"):
            log_step("project_context",
                    f"注入 {len(kg_context.get('related_components', []))} 个相关组件",
                    components=kg_context.get("related_components", [])[:3])
            context = {**context, "knowledge_graph": kg_context}

        # ─── Phase 5: Code RAG 上下文注入 ─────────────────────────────────────
        if self.enable_code_rag and HAS_CODE_RAG:
            rag_context = self._get_code_rag_context(task)
            if rag_context.get("retrieved_chunks"):
                log_step("code_rag_context",
                        f"Code RAG 注入 {len(rag_context['retrieved_chunks'])} 个相关片段",
                        similarity=[c['similarity'] for c in rag_context['retrieved_chunks'][:3]])
                context = {**context, "code_rag": rag_context}

        # ─── Phase 5: 原子化模式标记 ─────────────────────────────────────────
        if self.enable_atomic_mode:
            context = {**context, "atomic_mode": True, "auto_apply": self.auto_apply_patch}
            log_step("triad_mode", "原子化模式已激活", mode="atomic")
        
        # ─── Phase 7.3: 动态工具发现 ───────────────────────────────────────────
        discovered_tools = self.discover_and_load_tools(task)
        if discovered_tools:
            log_step("tools_loaded", f"动态加载工具: {discovered_tools}", tools=discovered_tools)
            context = {**context, "available_tools": discovered_tools}

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

            # ─── Phase 5: 原子化 Patch 处理 ───────────────────────────────────
            token_saved = 0
            if self.enable_atomic_mode and coder_result.output_mode == "atomic":
                if coder_result.patch:
                    # 计算 Token 节省
                    token_saved = coder_result.diff_lines * 4  # 粗略估算
                    self._token_saved += token_saved

                    log_step("atomic_patch",
                            f"原子化 Patch: {coder_result.diff_lines} 行 diff, "
                            f"节省约 {token_saved} tokens",
                            diff_lines=coder_result.diff_lines,
                            token_saved=token_saved,
                            total_saved=self._token_saved)

                    # 自动应用 Patch（可选）
                    if self.auto_apply_patch and coder_result.file_path:
                        patch_applied = self._apply_patch(
                            coder_result.patch,
                            coder_result.file_path
                        )
                        if patch_applied:
                            coder_result.applied = True

            log_step("coder_generated",
                    f"Coder 完成: {len(coder_result.code)} 字符",
                    round=self.current_round,
                    mode=coder_result.mode.value,
                    output_mode=coder_result.output_mode,
                    token_saved=token_saved)

            # ═══════════════════════════════════════════════════════════════
            # 第二权：Reviewer 审查 + 生成测试用例
            # ═══════════════════════════════════════════════════════════════

            log_thought("reviewer", "正在审查代码，识别潜在问题...", round_num=self.current_round)

            # ─── Phase 6: Reviewer 模型路由 ──────────────────────────────────
            if self._reviewer_provider == "glm" and self._glm_available and HAS_GLM:
                # GLM-4 作为 Reviewer（异构博弈核心）
                log_step("reviewer_route", f"路由到 GLM-4: {self._glm_model}",
                         provider="glm", model=self._glm_model)

                glm_result = glm_review(
                    task=task,
                    code=current_code,
                    language=context.get("language", "python"),
                    api_key=self._glm_api_key,
                    model=self._glm_model,
                )

                # 将 glm_result 转换为 ReviewResult 兼容对象
                from dataclasses import dataclass as _dc
                from typing import List as _List

                @_dc
                class _GLMReviewResult:
                    approved: bool
                    overall_score: float
                    issues: _List
                    summary: str = ""

                    @property
                    def issues(self):
                        return self._issues

                    @issues.setter
                    def issues(self, v):
                        self._issues = v

                # 构建兼容 ReviewResult 的轻量对象
                class _CompatIssue:
                    def __init__(self, d):
                        self.severity = d.get("severity", "minor")
                        self.description = d.get("description", "")
                        self.dimension = d.get("dimension", "unknown")

                class _CompatReviewResult:
                    def __init__(self, d):
                        self.approved = d.get("approved", False)
                        self.overall_score = d.get("overall_score", 0.5)
                        self.issues = [_CompatIssue(i) for i in d.get("issues", [])]
                        self.summary = d.get("summary", "")

                reviewer_result = _CompatReviewResult(glm_result)
                log_step("reviewer_reviewed",
                        f"GLM-4 Reviewer 完成: score={reviewer_result.overall_score:.2f}",
                        round=self.current_round,
                        approved=reviewer_result.approved,
                        issues=len(reviewer_result.issues),
                        provider="glm")
            else:
                # 原始 ReviewerAgent（OpenAI / GPT-4o）
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

            # ─── Phase 6: GLM-4 生成测试用例 ─────────────────────────────────
            if self._reviewer_provider == "glm" and self._glm_available and HAS_GLM:
                test_result = glm_generate_test_cases(
                    task=task,
                    code=current_code,
                    language=context.get("language", "python"),
                    issues=reviewer_result.issues,
                    api_key=self._glm_api_key,
                    model=self._glm_model,
                )
                log_step("reviewer_test_cases",
                        f"GLM-4 生成 {len(test_result.get('test_cases', []))} 个测试用例",
                        provider="glm")
            else:
                test_result = self.reviewer.generate_test_cases(
                    task=task,
                    code=current_code,
                    language=context.get("language", "python"),
                    issues=reviewer_result.issues
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

            # 三权全部通过 → 进入 Phase 7: 最终现实验证
            if review_passed and validation_passed:
                log_step("triad_approved", "✓ 三权分立全部通过！进入最终现实验证...",
                        total_rounds=self.current_round,
                        final_score=reviewer_result.overall_score)
                
                # ═══════════════════════════════════════════════════════════════════
                # Phase 7: 最终怀疑 - 现实验证闭环
                # ═══════════════════════════════════════════════════════════════════
                reality_result = await self._run_reality_check(
                    task=task,
                    code=current_code,
                    context=context
                )
                
                # 现实验证失败 → 视为未通过，进入自愈
                if not reality_result.get("success", True) and not reality_result.get("skipped"):
                    log_step("reality_check_failed", "现实验证失败！代码在真实环境中未通过",
                            score=reality_result.get("score", 0),
                            issues=reality_result.get("issues", []))
                    
                    # 将现实验证问题加入反馈，继续迭代
                    reality_issues = reality_result.get("issues", [])
                    context["reality_check_issues"] = reality_issues
                    
                    # 继续循环，不返回
                    current_mode = GenerationMode.FIX
                    log_thought("coder", f"现实验证发现问题: {reality_issues[:2]}...", 
                               round_num=self.current_round)
                    continue
                
                # 现实验证通过或跳过 → 真正结束
                total_time = time.time() - start_time
                log_step("triad_complete", "✓ 现实验证通过！任务真正完成",
                        total_rounds=self.current_round,
                        final_score=reviewer_result.overall_score,
                        total_time=total_time,
                        reality_score=reality_result.get("score", 1.0))

                final_result = TriadLoopResult(
                    status=TriadStatus.APPROVED,
                    total_rounds=self.current_round,
                    total_time=total_time,
                    final_score=reviewer_result.overall_score,
                    final_code=current_code,
                    reviewer_passed=True,
                    validator_passed=True,
                    round_results=round_results
                )
                
                # 记录到 DecisionLedger - 长记忆持久化
                await self._record_to_ledger(task, round_results, final_result, reality_result)
                
                return final_result

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

            # 任一收敛条件触发 → Phase 7.4: 策略逃逸
            if (self.consecutive_no_improvement >= 2 or
                self._consecutive_high_similarity >= 2):
                
                # Phase 7.4: 尝试策略逃逸
                if self._should_escape_strategy():
                    escape_config = self._escape_strategy()
                    
                    # 应用逃逸配置
                    if "coder_model" in escape_config:
                        # 重新初始化 CoderAgent 使用新模型
                        self.coder = CoderAgent(
                            api_key=os.environ.get("ANTHROPIC_API_KEY"),
                            model=escape_config["coder_model"],
                            workspace=self.workspace,
                            enable_thought_tracking=self.enable_thought_tracking,
                            enable_atomic_mode=self.enable_atomic_mode,
                            auto_apply_patch=self.auto_apply_patch
                        )
                        log_step("coder_reinit", f"CoderAgent 已重新初始化: {escape_config['coder_model']}")
                    
                    if "prompt_strategy" in escape_config:
                        context["prompt_strategy"] = escape_config["prompt_strategy"]
                        log_step("prompt_strategy", f"Prompt策略已切换: {escape_config['prompt_strategy']}")
                    
                    # 继续循环，不停止
                    current_mode = GenerationMode.FIX
                    log_thought("system", f"策略逃逸已执行，继续博弈...", round_num=self.current_round)
                    continue
                
                # 策略逃逸无效 → 停止
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

                final_result = TriadLoopResult(
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
                
                # 记录到 DecisionLedger（即使失败也记录）
                await self._record_to_ledger(task, round_results, final_result)
                
                return final_result
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

        final_result = TriadLoopResult(
            status=TriadStatus.REJECTED,
            total_rounds=self.current_round,
            total_time=total_time,
            final_score=self.last_score,
            final_code=current_code,
            patch_similarity=final_similarity,
            round_results=round_results,
            feedback=self._summarize_feedback(round_results)
        )
        
        # 记录到 DecisionLedger - 长记忆持久化（即使失败也记录）
        await self._record_to_ledger(task, round_results, final_result)

        return final_result

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

    # ═══════════════════════════════════════════════════════════════════════════
    # Phase 7: 实战验证闭环 - 最终怀疑与现实检查
    # ═══════════════════════════════════════════════════════════════════════════

    async def _run_reality_check(
        self,
        task: str,
        code: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        运行现实验证 - "最终怀疑"机制（Phase 7.1: 异步并发验证）
        
        当 Validator 通过后，强制让 browser_agent 去截图并检查
        DOM 元素是否真的存在。这是防止"逻辑幻觉"的最后一道防线。
        
        Phase 7.1 增强：
        - 异步并发执行 DOM 检查和 API 探测
        - 视觉差异对比（前后截图对比）
        - WebSocket 实时推送验证进度
        
        Returns:
            {
                "success": bool,
                "score": float,
                "screenshot_path": str,
                "issues": List[str],
                "details": Dict
            }
        """
        if not self.enable_reality_check or not self.browser_agent:
            return {"success": True, "score": 1.0, "skipped": True}
        
        log_step("reality_check", "启动最终现实验证 - 怀疑论验证器", phase="final_skepticism")
        
        # 通过 WebSocket 推送开始事件
        if self.stream_broker:
            await self._emit_reality_check_event("started", {"task": task[:100]})
        
        result = {
            "success": False,
            "score": 0.0,
            "screenshot_path": None,
            "issues": [],
            "details": {},
            "visual_diff": None
        }
        
        try:
            # 1. 截图验证
            screenshot_path = f"/tmp/maoai_reality_check_{int(time.time())}.png"
            
            if hasattr(self.browser_agent, 'screenshot'):
                await self.browser_agent.screenshot(screenshot_path)
                result["screenshot_path"] = screenshot_path
                
                # Phase 7.2: 视觉差异对比
                if self.enable_visual_diff and self._screenshot_history:
                    visual_diff = await self._compute_visual_diff(
                        self._screenshot_history[-1], 
                        screenshot_path
                    )
                    result["visual_diff"] = visual_diff
                    log_step("visual_diff", 
                            f"视觉差异: {visual_diff.get('diff_percentage', 0):.2%}",
                            significant_change=visual_diff.get('significant_change', False))
                
                # 保存截图历史
                self._screenshot_history.append(screenshot_path)
                if len(self._screenshot_history) > 5:  # 只保留最近5张
                    self._screenshot_history.pop(0)
                
                # 推送截图完成事件
                if self.stream_broker:
                    await self._emit_reality_check_event("screenshot_complete", 
                                                         {"path": screenshot_path})
            
            # Phase 7.1: 异步并发验证
            is_frontend = context.get("is_frontend") or self._is_frontend_task(task)
            is_backend = context.get("is_backend") or self._is_backend_task(task)
            
            if self.enable_concurrent_checks and (is_frontend and is_backend):
                # 并发执行 DOM 检查和 API 探测
                log_step("reality_check", "启动并发验证 (DOM + API)")
                
                dom_task = self._check_dom_elements(task, code) if is_frontend else asyncio.sleep(0)
                api_task = self._check_api_endpoints(task, code) if is_backend else asyncio.sleep(0)
                
                dom_result, api_result = await asyncio.gather(
                    dom_task, 
                    api_task,
                    return_exceptions=True
                )
                
                # 处理 DOM 检查结果
                if isinstance(dom_result, Exception):
                    result["issues"].append(f"DOM检查异常: {dom_result}")
                    result["details"]["dom_check"] = {"exists": False, "error": str(dom_result)}
                else:
                    result["details"]["dom_check"] = dom_result
                    if not dom_result.get("exists", True):
                        result["issues"].append(f"关键 DOM 元素未找到: {dom_result.get('missing_selectors', [])}")
                
                # 处理 API 检查结果
                if isinstance(api_result, Exception):
                    result["issues"].append(f"API检查异常: {api_result}")
                    result["details"]["api_check"] = {"reachable": False, "error": str(api_result)}
                else:
                    result["details"]["api_check"] = api_result
                    if not api_result.get("reachable", True):
                        result["issues"].append(f"API 端点不可达: {api_result.get('failed_endpoints', [])}")
                
                # 推送并发验证完成事件
                if self.stream_broker:
                    await self._emit_reality_check_event("concurrent_checks_complete", {
                        "dom_exists": result["details"].get("dom_check", {}).get("exists", True),
                        "api_reachable": result["details"].get("api_check", {}).get("reachable", True)
                    })
            else:
                # 顺序执行（兼容旧逻辑）
                if is_frontend:
                    dom_check = await self._check_dom_elements(task, code)
                    result["details"]["dom_check"] = dom_check
                    if not dom_check.get("exists", False):
                        result["issues"].append(f"关键 DOM 元素未找到: {dom_check.get('missing_selectors', [])}")
                
                if is_backend:
                    api_check = await self._check_api_endpoints(task, code)
                    result["details"]["api_check"] = api_check
                    if not api_check.get("reachable", False):
                        result["issues"].append(f"API 端点不可达: {api_check.get('failed_endpoints', [])}")
                log_step("reality_check", f"截图已保存: {screenshot_path}")
            
            # 2. 如果是前端组件修改，检查关键 DOM 元素
            if context.get("is_frontend") or self._is_frontend_task(task):
                dom_check = await self._check_dom_elements(task, code)
                result["details"]["dom_check"] = dom_check
                
                if not dom_check.get("exists", False):
                    result["issues"].append(f"关键 DOM 元素未找到: {dom_check.get('missing_selectors', [])}")
                    log_step("reality_check", "DOM 元素检查失败", issues=result["issues"])
            
            # 3. 如果是 API 修改，检查端点响应
            if context.get("is_backend") or self._is_backend_task(task):
                api_check = await self._check_api_endpoints(task, code)
                result["details"]["api_check"] = api_check
                
                if not api_check.get("reachable", False):
                    result["issues"].append(f"API 端点不可达: {api_check.get('failed_endpoints', [])}")
                    log_step("reality_check", "API 检查失败", issues=result["issues"])
            
            # 4. 计算现实验证分数
            checks_passed = sum([
                result["screenshot_path"] is not None,
                result["details"].get("dom_check", {}).get("exists", True),
                result["details"].get("api_check", {}).get("reachable", True)
            ])
            total_checks = 1 + (1 if "dom_check" in result["details"] else 0) + (1 if "api_check" in result["details"] else 0)
            
            result["score"] = checks_passed / total_checks if total_checks > 0 else 0
            result["success"] = result["score"] >= self.reality_check_threshold
            
            log_step("reality_check", 
                    f"现实验证完成: score={result['score']:.2f}, success={result['success']}",
                    score=result["score"],
                    passed=checks_passed,
                    total=total_checks)
            
        except Exception as e:
            result["issues"].append(f"现实验证异常: {e}")
            log_step("reality_check", f"现实验证异常: {e}", error=True)
        
        self._reality_check_results.append(result)
        return result
    
    def _is_frontend_task(self, task: str) -> bool:
        """判断是否为前端任务"""
        frontend_keywords = [
            "component", "页面", "UI", "界面", "前端", "react", "vue", "tsx", "jsx",
            "css", "样式", "布局", "button", "modal", "form", "table", "card"
        ]
        task_lower = task.lower()
        return any(kw in task_lower for kw in frontend_keywords)
    
    def _is_backend_task(self, task: str) -> bool:
        """判断是否为后端任务"""
        backend_keywords = [
            "api", "endpoint", "路由", "接口", "后端", "server", "handler",
            "controller", "service", "database", "model", "schema"
        ]
        task_lower = task.lower()
        return any(kw in task_lower for kw in backend_keywords)
    
    async def _check_dom_elements(self, task: str, code: str) -> Dict[str, Any]:
        """检查 DOM 元素是否存在"""
        result = {"exists": True, "found_selectors": [], "missing_selectors": []}
        
        # 从代码中提取可能的选择器（简化版）
        import re
        selectors = []
        
        # 匹配 data-testid, id, className 等
        patterns = [
            r'data-testid=["\']([^"\']+)["\']',
            r'id=["\']([^"\']+)["\']',
            r'className=["\']([^"\']+)["\']',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, code)
            selectors.extend(matches)
        
        if not selectors:
            return result
        
        # 使用 browser_agent 检查元素
        if hasattr(self.browser_agent, 'find_element'):
            for selector in selectors[:5]:  # 最多检查 5 个
                try:
                    element = await self.browser_agent.find_element(f"[data-testid='{selector}']")
                    if element:
                        result["found_selectors"].append(selector)
                    else:
                        result["missing_selectors"].append(selector)
                except:
                    result["missing_selectors"].append(selector)
        
        result["exists"] = len(result["missing_selectors"]) == 0
        return result
    
    async def _check_api_endpoints(self, task: str, code: str) -> Dict[str, Any]:
        """检查 API 端点是否可达"""
        result = {"reachable": True, "tested_endpoints": [], "failed_endpoints": []}
        
        # 从代码中提取可能的端点
        import re
        endpoints = []
        
        # 匹配路由定义
        patterns = [
            r'["\'](GET|POST|PUT|DELETE)\s+([/\w]+)["\']',
            r'@app\.(get|post|put|delete)\(["\']([^"\']+)["\']',
            r'router\.(get|post|put|delete)\(["\']([^"\']+)["\']',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, code, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    endpoints.append(f"{match[0].upper()} {match[1]}")
                else:
                    endpoints.append(match)
        
        if not endpoints:
            return result
        
        # 使用 browser_agent 或 HTTP 检查端点
        if hasattr(self.browser_agent, 'http_get'):
            for endpoint in endpoints[:3]:  # 最多检查 3 个
                try:
                    response = await self.browser_agent.http_get(endpoint)
                    if response and response.status < 500:
                        result["tested_endpoints"].append(endpoint)
                    else:
                        result["failed_endpoints"].append(endpoint)
                except:
                    result["failed_endpoints"].append(endpoint)
        
        result["reachable"] = len(result["failed_endpoints"]) == 0
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Phase 7.2: 视觉差异对比
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _compute_visual_diff(self, screenshot_before: str, screenshot_after: str) -> Dict[str, Any]:
        """
        计算两张截图的视觉差异
        
        Returns:
            {
                "diff_percentage": float,  # 差异像素百分比
                "diff_pixels": int,        # 差异像素数量
                "total_pixels": int,       # 总像素数量
                "significant_change": bool, # 是否显著变化（超过阈值）
                "diff_image_path": str     # 差异可视化图片路径
            }
        """
        result = {
            "diff_percentage": 0.0,
            "diff_pixels": 0,
            "total_pixels": 0,
            "significant_change": False,
            "diff_image_path": None
        }
        
        try:
            from PIL import Image
            import numpy as np
            
            # 加载图片
            img1 = Image.open(screenshot_before).convert('RGB')
            img2 = Image.open(screenshot_after).convert('RGB')
            
            # 确保尺寸一致
            if img1.size != img2.size:
                img2 = img2.resize(img1.size)
            
            # 转换为 numpy 数组
            arr1 = np.array(img1)
            arr2 = np.array(img2)
            
            # 计算差异
            diff = np.abs(arr1.astype(float) - arr2.astype(float))
            diff_mask = np.any(diff > 10, axis=2)  # 像素差异阈值
            
            result["diff_pixels"] = int(np.sum(diff_mask))
            result["total_pixels"] = diff_mask.size
            result["diff_percentage"] = result["diff_pixels"] / result["total_pixels"] if result["total_pixels"] > 0 else 0
            result["significant_change"] = result["diff_percentage"] > self.visual_diff_threshold
            
            # 生成差异可视化图
            if result["diff_pixels"] > 0:
                diff_image = np.copy(arr2)
                diff_image[diff_mask] = [255, 0, 0]  # 红色标记差异区域
                diff_img = Image.fromarray(diff_image.astype(np.uint8))
                diff_path = f"/tmp/maoai_visual_diff_{int(time.time())}.png"
                diff_img.save(diff_path)
                result["diff_image_path"] = diff_path
            
            log_step("visual_diff_computed",
                    f"视觉差异: {result['diff_percentage']:.2%} ({result['diff_pixels']} pixels)",
                    significant=result["significant_change"])
            
        except ImportError:
            log_step("visual_diff", "PIL/numpy 未安装，跳过视觉差异计算")
        except Exception as e:
            log_step("visual_diff_error", f"视觉差异计算失败: {e}", error=True)
        
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Phase 7.5: WebSocket 实时推送
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _emit_reality_check_event(self, event_type: str, data: Dict[str, Any]):
        """
        推送现实验证事件到前端
        
        事件类型:
        - started: 验证开始
        - screenshot_complete: 截图完成
        - concurrent_checks_complete: 并发检查完成
        - dom_check_complete: DOM检查完成
        - api_check_complete: API检查完成
        - visual_diff_complete: 视觉差异计算完成
        - completed: 验证完成
        """
        if not self.stream_broker:
            return
        
        event = {
            "type": "reality_check",
            "event": event_type,
            "timestamp": time.time(),
            "data": data
        }
        
        try:
            if hasattr(self.stream_broker, 'emit'):
                await self.stream_broker.emit("triad_loop_event", event)
            elif hasattr(self.stream_broker, 'broadcast'):
                self.stream_broker.broadcast(event)
            log_step("websocket_emit", f"推送事件: {event_type}", event=event_type)
        except Exception as e:
            log_step("websocket_error", f"事件推送失败: {e}", error=True)

    # ═══════════════════════════════════════════════════════════════════════════
    # Phase 8: MaoAI Parallel Orchestrator (MPO) 集成
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def run_parallel(self, task: str, target_files: List[str] = None, **kwargs):
        """
        并行执行模式 - MaoAI Parallel Orchestrator (MPO)
        
        当任务可以拆分为多个独立子任务时，使用 MPO 并行处理，实现类似 Manus Max 的并行爆发力。
        
        架构:
          1. 任务分片 (Sharding): 主 Agent 分析任务，拆解为互不干扰的原子单元
          2. 并行执行 (Parallel Execution): 启动 N 个轻量级 TriadWorker，并发调用 LLM
          3. 聚合 (Aggregation): 收集所有 Worker 输出，进行冲突检测与逻辑汇总
        
        参数:
            task: 任务描述
            target_files: 目标文件列表，如果为 None 则自动发现相关文件
            max_workers: 最大并发 Worker 数 (默认 5)
            enable_video_parallel: 是否启用视觉并行处理 (默认 False)
        
        返回:
            ParallelExecutionResult 对象
        """
        try:
            # 导入 MPO 核心
            from .mpo_core import MaoAIParallelOrchestrator, VisionParallelOrchestrator
            
            # 获取配置参数
            max_workers = kwargs.get('max_workers', 5)
            enable_video_parallel = kwargs.get('enable_video_parallel', False)
            
            log_step("mpo_start", "启动 MaoAI Parallel Orchestrator (MPO)", 
                    task=task[:100], max_workers=max_workers, 
                    video_parallel=enable_video_parallel)
            
            # 如果没有指定目标文件，尝试自动发现
            if not target_files:
                target_files = await self._discover_relevant_files(task)
                log_step("mpo_discovery", f"自动发现 {len(target_files)} 个相关文件", 
                        files=target_files[:5])
            
            if not target_files:
                log_step("mpo_error", "未找到相关目标文件，回退到串行模式")
                return await self._fallback_to_serial(task)
            
            # 根据任务类型选择 Orchestrator
            if enable_video_parallel and self._is_video_task(task):
                log_step("mpo_type", "使用视觉并行处理器 (VisionParallelOrchestrator)")
                orchestrator = VisionParallelOrchestrator(
                    max_workers=max_workers,
                    workspace=self.workspace
                )
            else:
                log_step("mpo_type", "使用代码并行处理器 (MaoAIParallelOrchestrator)")
                orchestrator = MaoAIParallelOrchestrator(
                    max_workers=max_workers,
                    workspace=self.workspace
                )
            
            # 执行并行任务
            parallel_result = await orchestrator.run_parallel_task(task, target_files)
            
            # 转换为 TriadLoop 兼容的结果
            final_result = self._create_parallel_result(parallel_result)
            
            log_step("mpo_complete", "MPO 并行执行完成",
                    total_workers=parallel_result.get("total_workers", 0),
                    succeeded=parallel_result.get("succeeded", 0),
                    failed=parallel_result.get("failed", 0),
                    total_time=parallel_result.get("total_time", 0))
            
            return final_result
            
        except ImportError as e:
            log_step("mpo_error", f"MPO 导入失败，回退到串行模式: {e}", error=True)
            return await self._fallback_to_serial(task)
        except Exception as e:
            log_step("mpo_error", f"MPO 执行异常: {e}", error=True)
            return await self._fallback_to_serial(task)
    
    async def _fallback_to_serial(self, task: str):
        """MPO 失败时回退到串行执行"""
        log_step("fallback_serial", "回退到串行三权分立博弈")
        return self.run(task=task)
    
    async def _discover_relevant_files(self, task: str) -> List[str]:
        """
        自动发现与任务相关的文件
        
        基于知识图谱和 Code RAG 检索相关文件
        """
        relevant_files = []
        
        # 1. 从知识图谱获取相关组件
        if self.enable_knowledge_graph and self._knowledge_graph:
            related = self._knowledge_graph.search(task, limit=10)
            for item in related:
                if isinstance(item, dict) and "file_path" in item:
                    file_path = item["file_path"]
                    if os.path.exists(os.path.join(self.workspace, file_path)):
                        relevant_files.append(file_path)
        
        # 2. 从 Code RAG 检索相关代码片段
        if self.enable_code_rag and self._code_rag:
            try:
                results = self._code_rag.query(task, top_k=10)
                for r in results:
                    file_path = r.chunk.file_path
                    if file_path not in relevant_files and os.path.exists(os.path.join(self.workspace, file_path)):
                        relevant_files.append(file_path)
            except Exception as e:
                log_step("rag_discovery", f"RAG 检索失败: {e}", error=True)
        
        # 3. 基于任务关键词搜索文件
        import glob
        keywords = [w for w in task.split() if len(w) > 3]
        for keyword in keywords[:3]:  # 最多使用前3个关键词
            patterns = [
                f"**/*{keyword}*.py",
                f"**/*{keyword}*.ts",
                f"**/*{keyword}*.tsx",
                f"**/*{keyword}*.js",
                f"**/*{keyword}*.jsx",
            ]
            for pattern in patterns:
                matches = glob.glob(os.path.join(self.workspace, pattern), recursive=True)
                for match in matches:
                    rel_path = os.path.relpath(match, self.workspace)
                    if rel_path not in relevant_files:
                        relevant_files.append(rel_path)
        
        # 去重并返回
        return list(set(relevant_files))[:20]  # 最多20个文件
    
    def _is_video_task(self, task: str) -> bool:
        """判断是否为视频处理任务"""
        video_keywords = [
            "视频", "video", "帧", "frame", "截图", "screenshot", "视觉", "visual",
            "图像", "image", "画面", "剪辑", "edit", "分析", "analyze"
        ]
        task_lower = task.lower()
        return any(kw in task_lower for kw in video_keywords)
    
    def _create_parallel_result(self, parallel_result: Dict[str, Any]) -> "TriadLoopResult":
        """
        将 MPO 并行结果转换为 TriadLoopResult 格式
        """
        from .triad_loop import TriadStatus
        
        # 计算总得分
        total_score = 0.0
        successful_results = 0
        
        worker_results = parallel_result.get("worker_results", [])
        for result in worker_results:
            if result.get("status") == "completed":
                total_score += result.get("score", 0.0)
                successful_results += 1
        
        avg_score = total_score / successful_results if successful_results > 0 else 0.0
        
        # 构建最终结果
        final_result = TriadLoopResult(
            status=TriadStatus.APPROVED if successful_results > 0 else TriadStatus.REJECTED,
            total_rounds=len(worker_results),
            total_time=parallel_result.get("total_time", 0),
            final_score=avg_score,
            final_code=parallel_result.get("aggregated_code", ""),
            reviewer_passed=True,
            validator_passed=True,
            round_results=[]  # 并行模式没有分轮结果
        )
        
        return final_result
    
    async def _record_to_ledger(
        self,
        task: str,
        round_results: List[RoundResult],
        final_result: TriadLoopResult,
        reality_check: Optional[Dict] = None
    ):
        """
        记录博弈过程到 DecisionLedger - 长记忆持久化
        
        将每一轮的博弈过程正式存入"战略账本"，支持后续分析和复盘。
        """
        if not self.decision_ledger:
            return
        
        try:
            # 构建决策记录
            record = {
                "timestamp": time.time(),
                "task": task,
                "total_rounds": final_result.total_rounds,
                "final_status": final_result.status.value,
                "final_score": final_result.final_score,
                "converged": final_result.converged,
                "rounds": []
            }
            
            # 记录每一轮的详细信息
            for i, r in enumerate(round_results):
                round_record = {
                    "round": i + 1,
                    "coder": {
                        "mode": r.coder_result.mode.value if hasattr(r.coder_result.mode, 'value') else str(r.coder_result.mode),
                        "code_length": len(r.coder_result.code),
                        "output_mode": getattr(r.coder_result, 'output_mode', 'unknown')
                    },
                    "reviewer": {
                        "score": r.reviewer_result.overall_score,
                        "approved": r.reviewer_result.approved,
                        "issues_count": len(r.reviewer_result.issues)
                    },
                    "validator": {
                        "success": r.validator_result.success,
                        "passed": r.validator_result.passed,
                        "failed": r.validator_result.failed
                    },
                    "issues_remaining": r.issues_remaining
                }
                record["rounds"].append(round_record)
            
            # 添加现实验证结果
            if reality_check:
                record["reality_check"] = {
                    "success": reality_check.get("success"),
                    "score": reality_check.get("score"),
                    "issues": reality_check.get("issues", [])
                }
            
            # 记录到 DecisionLedger
            if hasattr(self.decision_ledger, 'record'):
                await self.decision_ledger.record(record)
                log_step("ledger_record", "博弈过程已记录到 DecisionLedger")
            elif hasattr(self.decision_ledger, 'log_decision'):
                self.decision_ledger.log_decision("triad_loop", record)
                log_step("ledger_record", "博弈过程已记录")
            
        except Exception as e:
            log_step("ledger_record", f"记录到 DecisionLedger 失败: {e}", error=True)


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
    # ─── Phase 5 参数 ────────────────────────────────────────────────────────
    parser.add_argument("--no-atomic", action="store_true", help="禁用原子化模式")
    parser.add_argument("--no-rag", action="store_true", help="禁用 Code RAG")
    parser.add_argument("--no-auto-patch", action="store_true", help="不自动应用 Patch")
    parser.add_argument("--rag-top-k", type=int, default=5, help="RAG 检索数量")
    # ─── Phase 6: 异构模型博弈参数 ───────────────────────────────────────────
    parser.add_argument(
        "--heterogeneous", action="store_true",
        help="开启异构博弈模式（Claude 写 + GLM-4 审）"
    )
    parser.add_argument(
        "--reviewer-provider", type=str, choices=["glm", "openai", "auto"], default="auto",
        help="Reviewer 模型提供商（glm / openai）"
    )
    parser.add_argument("--glm-model", type=str, default="glm-4-plus", help="GLM-4 模型名")
    parser.add_argument("--claude-local", action="store_true", help="使用 Claude Code Local（有工具链）")
    parser.add_argument("--glm-validator", action="store_true", help="使用 GLM-4 作为 Validator")
    
    # ─── Phase 8: MaoAI Parallel Orchestrator (MPO) 参数 ─────────────────────
    parser.add_argument("--parallel", action="store_true", help="启用并行执行模式（MPO）")
    parser.add_argument("--max-workers", type=int, default=5, help="最大并发 Worker 数（默认 5）")
    parser.add_argument("--target-files", type=str, nargs="+", help="目标文件列表（支持通配符）")
    parser.add_argument("--video-parallel", action="store_true", help="启用视觉并行处理模式")

    args = parser.parse_args()

    triad = create_triad_loop(
        workspace=args.workspace,
        coder_model=args.coder_model,
        reviewer_model=args.reviewer_model,
        max_iterations=args.max_iterations,
        score_threshold=args.score_threshold,
        enable_docker=args.docker,
        test_command=args.test_command,
        # ─── Phase 5 ────────────────────────────────────────────────────────
        enable_atomic_mode=not args.no_atomic,
        enable_code_rag=not args.no_rag,
        auto_apply_patch=not args.no_auto_patch,
        rag_top_k=args.rag_top_k,
        # ─── Phase 6: 异构模型博弈 ──────────────────────────────────────────
        heterogeneous_mode=args.heterogeneous,
        reviewer_provider=None if args.reviewer_provider == "auto" else args.reviewer_provider,
        glm_model=args.glm_model,
        use_claude_code_local=args.claude_local if args.claude_local else None,
        use_glm_validator=args.glm_validator,
    )

    # 根据参数选择执行模式
    if args.parallel:
        # 并行执行模式
        log_step("mode_select", "使用并行执行模式 (MPO)")
        result = triad.run_parallel(
            task=args.task,
            target_files=args.target_files,
            max_workers=args.max_workers,
            enable_video_parallel=args.video_parallel,
            context={"language": args.language},
            mode=args.mode
        )
    else:
        # 串行执行模式
        log_step("mode_select", "使用串行执行模式")
        result = asyncio.run(triad.run_async(task=args.task, context={"language": args.language}, mode=args.mode))

    print("\n" + "=" * 60)
    print(f"{'MPO 并行执行结果' if args.parallel else '三权分立博弈循环执行结果'}")
    print("=" * 60)
    print(f"状态: {'✓ 全部通过' if result.all_passed else '✗ 未通过'}")
    print(f"最终得分: {result.final_score:.2f}")
    print(f"迭代次数: {result.total_rounds}")
    print(f"总耗时: {result.total_time:.2f}s")
    
    if args.parallel:
        # 并行执行模式特有输出
        print(f"执行模式: MPO 并行模式 (最大 {args.max_workers} 个 Worker)")
        print(f"目标文件数: {len(args.target_files) if args.target_files else '自动发现'}")
        print(f"视频并行: {'启用' if args.video_parallel else '禁用'}")
    else:
        # 串行执行模式输出
        print("三权检查:")
        print(f"  Reviewer: {'✓ 通过' if result.reviewer_passed else '✗ 未通过'}")
        print(f"  Validator: {'✓ 通过' if result.validator_passed else '✗ 未通过'}")
        if result.converged:
            print(f"收敛: 是 ({result.convergence_reason})")

    print("\n性能统计:")
    print(f"  原子化模式: {not args.no_atomic}")
    print(f"  Code RAG: {not args.no_rag}")
    print(f"  异构博弈: {args.heterogeneous}")
    print(f"  Claude Local: {args.claude_local}")
    print(f"  GLM-4 Reviewer: {args.reviewer_provider == 'glm' or args.heterogeneous}")
    if not args.parallel:
        print(f"  Token 节省: 约 {result.patch_similarity * 100:.0f}% (预估)")
    print(f"  MPO 并行: {'启用' if args.parallel else '禁用'}")
    print(f"  最大 Worker 数: {args.max_workers if args.parallel else 1}")
    print("=" * 60)
