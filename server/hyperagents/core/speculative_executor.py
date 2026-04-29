#!/usr/bin/env python3
"""
MaoAI HyperAgents — Speculative Executor (Phase 8: 推测性执行引擎)
─────────────────────────────────────────────────────────────────────────────
核心创新：通过"空间换时间"，预判下一步并并行尝试多种方案

架构对比：
  传统单线程博弈:
  ┌─────────────────────────────────────────────────────────┐
  │  Coder 生成 ──[发现问题]──→ 修复方案 A ──[失败]──→ 重试 │
  │                                        │                │
  │                                        ↓                │
  │                                  [浪费 1 轮迭代]         │
  └─────────────────────────────────────────────────────────┘

  推测性执行 (Speculative Execution):
  ┌─────────────────────────────────────────────────────────┐
  │  Reviewer 发现问题 ──→ 同时启动 3 个 Coder 实例          │
  │                           │         │         │        │
  │                    [方案A] [方案B] [方案C]  ← 并行尝试  │
  │                      ↓        ↓        ↓              │
  │                     失败     成功!     失败            │
  │                           ↓                            │
  │                    立即终止 B、C ──→ 采用方案 B        │
  │                           ↓                            │
  │                    节省 2 轮迭代时间                    │
  └─────────────────────────────────────────────────────────┘

核心特性：
  1. 多方案并行 - 同时尝试 3 种不同修复策略
  2. 早期终止 - 第一个成功立即终止其他
  3. 智能选择 - 根据问题类型选择候选方案
  4. 资源管理 - 控制最大并发实例数
  5. 结果缓存 - 避免重复计算相同方案
  6. 适应性冷却 - 根据成功率动态调整并行度
"""

import asyncio
import json
import time
import uuid
import hashlib
from typing import Dict, List, Optional, Callable, Any, TypeVar
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict
import threading
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import random

# ─── 日志工具 ─────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    entry = {
        "type": step_type,
        "agent": "speculative_executor",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 类型定义 ─────────────────────────────────────────────────────────────────

class StrategyType(Enum):
    """修复策略类型"""
    ATOMIC = "atomic"           # 原子化修改
    REWITE = "rewrite"         # 重写部分代码
    DECOMPOSE = "decompose"     # 分解问题
    REFACTOR = "refactor"       # 重构
    SIMPLIFY = "simplify"       # 简化逻辑
    EXPAND = "expand"           # 扩展功能


@dataclass
class SpeculativeCandidate:
    """推测性候选方案"""
    id: str
    strategy: StrategyType
    description: str
    prompt_addition: str
    priority: int = 1  # 1=最高, 3=最低
    estimated_success: float = 0.5  # 预估成功率


@dataclass
class SpeculativeResult:
    """推测性执行结果"""
    candidate_id: str
    success: bool
    code: str = ""
    duration: float = 0.0
    score: float = 0.0
    issues_fixed: List[str] = field(default_factory=list)
    new_issues: List[str] = field(default_factory=list)
    error: str = ""


@dataclass
class ExecutionPlan:
    """执行计划"""
    candidates: List[SpeculativeCandidate]
    max_parallel: int = 3
    timeout_per_candidate: float = 30.0
    first_success_timeout: float = 60.0


class StrategySelector:
    """
    策略选择器 - 根据问题类型智能选择候选方案

    选择逻辑：
    1. 分析问题特征（错误类型、上下文）
    2. 匹配最可能的成功策略
    3. 生成互补的候选方案组合
    """

    def __init__(self):
        # 问题模式 → 策略映射
        self.pattern_map = {
            # 逻辑错误
            r"(logic|condition|if|else)": [
                StrategyType.SIMPLIFY,
                StrategyType.REFACTOR,
                StrategyType.DECOMPOSE
            ],
            # 空指针/None
            r"(null|none|nil|undefined|None)": [
                StrategyType.ATOMIC,
                StrategyType.EXPAND,
                StrategyType.DECOMPOSE
            ],
            # 性能问题
            r"(slow|performance|loop|bottleneck)": [
                StrategyType.REFACTOR,
                StrategyType.SIMPLIFY,
                StrategyType.REWRITE
            ],
            # 语法错误
            r"(syntax|parse|indentation)": [
                StrategyType.ATOMIC,
                StrategyType.REWRITE,
                StrategyType.DECOMPOSE
            ],
            # 边界条件
            r"(boundary|edge|overflow|underflow)": [
                StrategyType.EXPAND,
                StrategyType.DECOMPOSE,
                StrategyType.ATOMIC
            ],
            # 类型错误
            r"(type|typeerror|cast)": [
                StrategyType.ATOMIC,
                StrategyType.EXPAND,
                StrategyType.REWRITE
            ],
            # 默认策略
            "default": [
                StrategyType.ATOMIC,
                StrategyType.REWRITE,
                StrategyType.DECOMPOSE
            ]
        }

        # 策略 → Prompt 增强
        self.strategy_prompts = {
            StrategyType.ATOMIC: """
策略：原子化最小修改
要求：
- 只修改最少的代码行
- 保持原有代码结构
- 精确修复指定问题
""",
            StrategyType.REWRITE: """
策略：部分重写
要求：
- 重写问题相关的代码段
- 保留其他正常部分
- 优化整体结构
""",
            StrategyType.DECOMPOSE: """
策略：分解问题
要求：
- 将复杂问题拆解为多个简单问题
- 逐个解决子问题
- 最后组合
""",
            StrategyType.REFACTOR: """
策略：重构优化
要求：
- 重构问题代码
- 提高代码可读性
- 保持功能不变
""",
            StrategyType.SIMPLIFY: """
策略：简化逻辑
要求：
- 简化复杂的条件判断
- 使用更简单的算法
- 减少嵌套层级
""",
            StrategyType.EXPAND: """
策略：扩展处理
要求：
- 添加边界条件处理
- 增加空值检查
- 完善错误处理
"""
        }

    def select(self, task: str, issues: List[str], code: str = "") -> ExecutionPlan:
        """
        根据问题选择执行计划

        参数:
            task: 原始任务
            issues: 发现的问题列表
            code: 当前代码（用于上下文分析）

        返回:
            执行计划
        """
        log_step("strategy_select", f"分析问题选择策略", issues_count=len(issues))

        # 分析问题类型
        problem_patterns = self._analyze_issues(issues)

        # 选择策略
        strategies = []
        for pattern, matched_strategies in problem_patterns.items():
            for strategy in matched_strategies:
                if strategy not in strategies:
                    strategies.append(strategy)

        # 限制数量（最多 3 个并发）
        strategies = strategies[:3] if len(strategies) > 3 else strategies

        # 如果没有匹配，使用默认策略
        if not strategies:
            strategies = [StrategyType.ATOMIC, StrategyType.REWRITE, StrategyType.DECOMPOSE]

        # 生成候选方案
        candidates = []
        for i, strategy in enumerate(strategies):
            candidate = SpeculativeCandidate(
                id=f"candidate-{uuid.uuid4().hex[:8]}",
                strategy=strategy,
                description=f"{strategy.value} 策略 #{i+1}",
                prompt_addition=self.strategy_prompts[strategy],
                priority=i + 1,
                estimated_success=self._estimate_success(strategy, issues)
            )
            candidates.append(candidate)

        # 添加一些随机候选以增加多样性
        if len(candidates) < 3:
            extra_strategies = [s for s in StrategyType if s not in [c.strategy for c in candidates]]
            for strategy in extra_strategies[:3 - len(candidates)]:
                candidates.append(SpeculativeCandidate(
                    id=f"candidate-{uuid.uuid4().hex[:8]}",
                    strategy=strategy,
                    description=f"{strategy.value} 策略 (备用)",
                    prompt_addition=self.strategy_prompts[strategy],
                    priority=len(candidates) + 1,
                    estimated_success=0.3
                ))

        log_step("strategy_select_complete",
                f"生成 {len(candidates)} 个候选方案",
                candidates=[c.strategy.value for c in candidates])

        return ExecutionPlan(
            candidates=candidates,
            max_parallel=min(3, len(candidates)),
            timeout_per_candidate=30.0,
            first_success_timeout=60.0
        )

    def _analyze_issues(self, issues: List[str]) -> Dict[str, List[StrategyType]]:
        """分析问题类型"""
        matched = defaultdict(list)

        for issue in issues:
            issue_lower = issue.lower()
            for pattern, strategies in self.pattern_map.items():
                if pattern != "default" and pattern.lower() in issue_lower:
                    matched[pattern].extend(strategies)
                    break
            else:
                matched["default"].extend([StrategyType.ATOMIC, StrategyType.REWRITE])

        return dict(matched)

    def _estimate_success(self, strategy: StrategyType, issues: List[str]) -> float:
        """估算策略成功率"""
        # 简单估算：基于问题数量
        base = 0.5
        if len(issues) <= 2:
            base = 0.8
        elif len(issues) <= 5:
            base = 0.6

        # 策略加成
        if strategy == StrategyType.ATOMIC:
            return base + 0.1  # 简单问题用原子化效果好
        elif strategy == StrategyType.REWRITE:
            return base
        elif strategy == StrategyType.DECOMPOSE:
            return base + 0.1  # 复杂问题用分解效果好

        return base


class ResultCache:
    """
    结果缓存 - 避免重复计算相同方案

    缓存策略：
    1. 基于任务 + 策略 + 代码哈希
    2. TTL 过期机制
    3. LRU 淘汰策略
    """

    def __init__(self, max_size: int = 100):
        self.max_size = max_size
        self.cache: Dict[str, SpeculativeResult] = {}
        self.access_times: Dict[str, float] = {}
        self.hit_count = 0
        self.miss_count = 0

    def _make_key(self, task: str, strategy: StrategyType, code_hash: str) -> str:
        """生成缓存键"""
        return hashlib.sha256(
            f"{task}:{strategy.value}:{code_hash}".encode()
        ).hexdigest()[:32]

    def get(self, task: str, strategy: StrategyType, code: str) -> Optional[SpeculativeResult]:
        """获取缓存结果"""
        code_hash = hashlib.md5(code.encode()).hexdigest()
        key = self._make_key(task, strategy, code_hash)

        if key in self.cache:
            self.hit_count += 1
            self.access_times[key] = time.time()
            log_step("cache_hit", f"缓存命中: {strategy.value}")
            return self.cache[key]

        self.miss_count += 1
        return None

    def put(self, task: str, strategy: StrategyType, code: str, result: SpeculativeResult):
        """存入缓存"""
        if len(self.cache) >= self.max_size:
            # LRU 淘汰
            oldest_key = min(self.access_times.items(), key=lambda x: x[1])[0]
            del self.cache[oldest_key]
            del self.access_times[oldest_key]

        code_hash = hashlib.md5(code.encode()).hexdigest()
        key = self._make_key(task, strategy, code_hash)
        self.cache[key] = result
        self.access_times[key] = time.time()

    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计"""
        total = self.hit_count + self.miss_count
        hit_rate = self.hit_count / total if total > 0 else 0.0
        return {
            "size": len(self.cache),
            "hit_count": self.hit_count,
            "miss_count": self.miss_count,
            "hit_rate": hit_rate
        }


class AdaptiveCooling:
    """
    适应性冷却 - 根据成功率动态调整并行度

    策略：
    1. 高成功率 → 增加并行度
    2. 低成功率 → 减少并行度
    3. 连续失败 → 进入冷却期
    """

    def __init__(self, initial_parallel: int = 3):
        self.current_parallel = initial_parallel
        self.max_parallel = 5
        self.min_parallel = 1
        self.success_history: List[bool] = []
        self.history_window = 10

    def record_result(self, success: bool):
        """记录执行结果"""
        self.success_history.append(success)
        if len(self.success_history) > self.history_window:
            self.success_history.pop(0)

    def get_optimal_parallelism(self) -> int:
        """获取最优并行度"""
        if not self.success_history:
            return self.current_parallel

        # 计算成功率
        success_rate = sum(self.success_history) / len(self.success_history)

        # 动态调整
        if success_rate > 0.8:
            # 高成功率 → 增加并行度
            self.current_parallel = min(self.max_parallel, self.current_parallel + 1)
        elif success_rate < 0.3:
            # 低成功率 → 减少并行度
            self.current_parallel = max(self.min_parallel, self.current_parallel - 1)

        return self.current_parallel


# ─── 推测性执行器 ────────────────────────────────────────────────────────────

class SpeculativeExecutor:
    """
    推测性执行器

    核心算法：
    1. 策略选择 - 根据问题类型选择多个候选方案
    2. 并行执行 - 同时运行多个 Coder 实例
    3. 早期终止 - 第一个成功立即终止其他
    4. 结果归并 - 合并最优结果
    """

    def __init__(
        self,
        workspace: str = None,
        max_parallel: int = 3,
        enable_caching: bool = True,
        triad_loop_factory: Callable = None
    ):
        self.workspace = workspace
        self.max_parallel = max_parallel
        self.enable_caching = enable_caching
        self.triad_loop_factory = triad_loop_factory

        # 组件
        self.strategy_selector = StrategySelector()
        self.cache = ResultCache() if enable_caching else None
        self.cooling = AdaptiveCooling(initial_parallel=max_parallel)

        # 状态
        self.active_executors: Dict[str, asyncio.Task] = {}
        self.completed_results: List[SpeculativeResult] = []
        self.first_success = None

        log_step("speculative_init",
                f"推测性执行器初始化",
                max_parallel=max_parallel,
                caching_enabled=enable_caching)

    async def execute(
        self,
        task: str,
        issues: List[str],
        code: str = "",
        context: Dict = None
    ) -> SpeculativeResult:
        """
        执行推测性任务

        参数:
            task: 原始任务
            issues: 发现的问题
            code: 当前代码
            context: 上下文

        返回:
            推测性执行结果
        """
        execution_id = f"exec-{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        log_step("speculative_start",
                f"推测性执行开始",
                execution_id=execution_id,
                issues_count=len(issues))

        # ─── Step 1: 检查缓存 ──────────────────────────────────────────────
        if self.enable_caching and self.cache:
            for candidate in self.strategy_selector.pattern_map.values():
                cached = self.cache.get(task, StrategyType.ATOMIC, code)
                if cached:
                    log_step("speculative_cache", "使用缓存结果")
                    return cached

        # ─── Step 2: 选择执行计划 ──────────────────────────────────────────
        plan = self.strategy_selector.select(task, issues, code)
        plan.max_parallel = self.cooling.get_optimal_parallelism()

        log_step("speculative_plan",
                f"执行计划: {len(plan.candidates)} 个候选方案",
                candidates=[c.strategy.value for c in plan.candidates],
                parallelism=plan.max_parallel)

        # ─── Step 3: 并行执行 ─────────────────────────────────────────────
        results = await self._execute_parallel(plan, task, code, context)

        # ─── Step 4: 选择最优结果 ──────────────────────────────────────────
        best_result = self._select_best_result(results)

        # ─── Step 5: 更新状态 ─────────────────────────────────────────────
        self.cooling.record_result(best_result.success)
        self.completed_results.append(best_result)

        # 缓存成功结果
        if self.enable_caching and self.cache and best_result.success:
            self.cache.put(task, StrategyType.ATOMIC, code, best_result)

        duration = time.time() - start_time
        log_step("speculative_complete",
                f"推测性执行完成",
                execution_id=execution_id,
                success=best_result.success,
                duration=f"{duration:.2f}s",
                candidates_tried=len(results),
                best_strategy=best_result.candidate_id)

        return best_result

    async def _execute_parallel(
        self,
        plan: ExecutionPlan,
        task: str,
        code: str,
        context: Dict
    ) -> List[SpeculativeResult]:
        """
        并行执行多个候选方案

        核心逻辑：
        1. 为每个候选方案启动独立的 Coder 实例
        2. 使用 asyncio.gather 并行执行
        3. 第一个成功立即取消其他任务
        """
        results: List[SpeculativeResult] = []
        first_success_event = asyncio.Event()

        async def execute_candidate(candidate: SpeculativeCandidate) -> SpeculativeResult:
            """执行单个候选方案"""
            candidate_start = time.time()

            log_step("candidate_start",
                    f"启动候选方案: {candidate.strategy.value}",
                    candidate_id=candidate.id,
                    priority=candidate.priority)

            try:
                # 模拟 Coder 执行
                # 实际场景应该调用 TriadLoop 或 LLM
                success = random.random() < candidate.estimated_success
                duration = random.uniform(1.0, 5.0)

                await asyncio.sleep(duration)

                result = SpeculativeResult(
                    candidate_id=candidate.id,
                    success=success,
                    code=f"# {candidate.strategy.value} 生成的代码",
                    duration=time.time() - candidate_start,
                    score=candidate.estimated_success if success else 0.0,
                    issues_fixed=["问题已修复"] if success else [],
                    new_issues=["新问题"] if random.random() < 0.1 else []
                )

                log_step("candidate_complete",
                        f"候选方案完成: {candidate.strategy.value}",
                        candidate_id=candidate.id,
                        success=success,
                        duration=f"{result.duration:.2f}s")

                # 第一个成功 → 触发终止
                if success and not first_success_event.is_set():
                    first_success_event.set()
                    log_step("candidate_first_success",
                            f"首个成功方案: {candidate.id}",
                            candidate_id=candidate.id)

                return result

            except Exception as e:
                log_step("candidate_error",
                        f"候选方案执行错误",
                        candidate_id=candidate.id,
                        error=str(e))
                return SpeculativeResult(
                    candidate_id=candidate.id,
                    success=False,
                    duration=time.time() - candidate_start,
                    error=str(e)
                )

        # 创建所有候选任务
        tasks = [
            asyncio.create_task(execute_candidate(candidate))
            for candidate in plan.candidates[:plan.max_parallel]
        ]

        # 等待第一个成功或全部完成
        try:
            # 使用 wait_for 限制总时间
            await asyncio.wait_for(
                first_success_event.wait(),
                timeout=plan.first_success_timeout
            )

            # 第一个成功后，取消其他任务
            for task_obj in tasks:
                if not task_obj.done():
                    task_obj.cancel()

            log_step("speculative_early_termination",
                    "早期终止：首个成功方案已完成")

        except asyncio.TimeoutError:
            # 超时 → 等待所有任务完成
            log_step("speculative_timeout",
                    f"等待超时，取消剩余任务")
            for task_obj in tasks:
                if not task_obj.done():
                    task_obj.cancel()

        # 收集结果
        for task_obj in tasks:
            if task_obj.done() and not task_obj.cancelled():
                try:
                    result = task_obj.result()
                    results.append(result)
                except Exception:
                    pass

        return results

    def _select_best_result(self, results: List[SpeculativeResult]) -> SpeculativeResult:
        """选择最优结果"""
        if not results:
            return SpeculativeResult(
                candidate_id="none",
                success=False,
                error="无可用结果"
            )

        # 按成功状态和分数排序
        successful = [r for r in results if r.success]
        if successful:
            # 选择分数最高的
            best = max(successful, key=lambda x: x.score)
            log_step("speculative_best",
                    f"最优方案: {best.candidate_id}",
                    score=best.score)
            return best

        # 没有成功 → 选择分数最高的（即使失败）
        best = max(results, key=lambda x: x.score)
        log_step("speculative_best",
                f"无可用成功方案，选择次优: {best.candidate_id}",
                score=best.score)
        return best

    def get_statistics(self) -> Dict[str, Any]:
        """获取执行统计"""
        total = len(self.completed_results)
        successful = sum(1 for r in self.completed_results if r.success)

        stats = {
            "total_executions": total,
            "successful": successful,
            "success_rate": successful / total if total > 0 else 0.0,
            "average_duration": sum(r.duration for r in self.completed_results) / total if total > 0 else 0.0,
            "current_parallelism": self.cooling.current_parallel,
            "optimal_parallelism": self.cooling.get_optimal_parallelism()
        }

        if self.cache:
            stats["cache"] = self.cache.get_stats()

        return stats


# ─── 工厂函数 ────────────────────────────────────────────────────────────────

def create_speculative_executor(**kwargs) -> SpeculativeExecutor:
    """创建推测性执行器实例"""
    return SpeculativeExecutor(**kwargs)


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Speculative Executor")
    parser.add_argument("--task", type=str, required=True, help="任务描述")
    parser.add_argument("--issues", type=str, nargs="+", help="发现的问题")
    parser.add_argument("--code", type=str, help="当前代码")
    parser.add_argument("--parallel", type=int, default=3, help="最大并行数")

    args = parser.parse_args()

    executor = create_speculative_executor(max_parallel=args.parallel)

    async def main():
        result = await executor.execute(
            task=args.task,
            issues=args.issues or ["通用问题"],
            code=args.code or ""
        )

        print("\n" + "=" * 60)
        print("推测性执行结果")
        print("=" * 60)
        print(f"状态: {'成功' if result.success else '失败'}")
        print(f"候选方案ID: {result.candidate_id}")
        print(f"耗时: {result.duration:.2f}s")
        print(f"分数: {result.score:.2f}")
        if result.issues_fixed:
            print(f"已修复问题: {result.issues_fixed}")
        if result.error:
            print(f"错误: {result.error}")
        print("=" * 60)

        stats = executor.get_statistics()
        print(f"\n统计:")
        print(f"  总执行次数: {stats['total_executions']}")
        print(f"  成功率: {stats['success_rate']:.1%}")
        print(f"  当前并行度: {stats['current_parallelism']}")
        if "cache" in stats:
            print(f"  缓存命中率: {stats['cache']['hit_rate']:.1%}")

    asyncio.run(main())
