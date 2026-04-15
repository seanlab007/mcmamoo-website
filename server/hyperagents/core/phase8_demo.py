#!/usr/bin/env python3
"""
MaoAI HyperAgents — Phase 8 性能优化演示
─────────────────────────────────────────────────────────────────────────────
参考 Manus MAX 的架构思路，为 MaoAI 实现的三大性能优化：

1. Map-Reduce 任务调度器 - 实现真正的异构并行
   "从 1 个 Agent 干 10 小时变为 10 个 Agent 干 1 小时"

2. 流式博弈引擎 - 打破顺序限制
   "消除 Agent 间的等待空窗期，实现流水线式作业"

3. 推测性执行器 - 空间换时间
   "预启动 3 个不同的 Coder 实例，只要有一个成功就立即终止其他"

使用方法：
  python phase8_demo.py --mode all
  python phase8_demo.py --mode scheduler
  python phase8_demo.py --mode streaming
  python phase8_demo.py --mode speculative
"""

import asyncio
import json
import time
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.scheduler import MapReduceScheduler, create_map_reduce_scheduler
from core.streaming.enhanced_stream_broker import (
    EnhancedStreamBroker,
    create_stream_broker
)
from core.speculative_executor import (
    SpeculativeExecutor,
    create_speculative_executor,
    StrategyType
)


def log_demo(title: str, content: str = ""):
    """打印演示标题"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)
    if content:
        print(content)
    print()


async def demo_map_reduce_scheduler():
    """演示 Map-Reduce 任务调度器"""
    log_demo("Phase 8-1: Map-Reduce 任务调度器",
             "实现真正的异构并行：将复杂任务拆分为 N 个子任务并行执行")

    # 创建调度器
    scheduler = create_map_reduce_scheduler(
        workspace=".",
        max_workers=4,
        enable_parallel=True
    )

    # 演示任务
    task = "优化用户认证模块的性能"

    print("任务:", task)
    print("策略: 将任务拆分为多个可并行的子任务")
    print()

    # 执行任务
    result = await scheduler.execute(
        task=task,
        context={"files": [], "dependencies": {}}
    )

    print(f"\n执行结果:")
    print(f"  任务ID: {result.task_id}")
    print(f"  状态: {'成功' if result.success else '失败'}")
    print(f"  子任务数: {len(result.sub_tasks)}")
    print(f"  完成率: {result.success_rate:.0%}")
    print(f"  总耗时: {result.total_duration:.2f}s")
    print(f"  并行耗时: {result.parallel_time:.2f}s")
    print(f"  加速比: {result.speedup_ratio:.2f}x")

    return result


async def demo_streaming_broker():
    """演示增强版流式博弈引擎"""
    log_demo("Phase 8-2: 流式博弈引擎",
             "打破 '写完再审' 的顺序限制，实现 Coder 和 Reviewer 并行")

    # 创建流式引擎
    broker = create_stream_broker(
        host="localhost",
        port=8766,
        coder_model="claude-3-5-sonnet",
        reviewer_model="gpt-4o",
        enable_websocket=False  # 演示模式，不启动 WebSocket
    )

    # 演示任务
    task = "实现一个高效的排序算法"

    print("任务:", task)
    print("策略: 流式生成 + 预热 + 并行审查")
    print()

    # 执行任务
    result = await broker.execute_streaming_task(task)

    print(f"\n执行结果:")
    print(f"  会话ID: {result['session_id']}")
    print(f"  状态: {'成功' if result['success'] else '失败'}")
    print(f"  总耗时: {result['total_time']:.2f}s")
    print(f"  流式效率: {result['efficiency']:.1%}")
    print(f"  审查问题数: {len(result['review'].get('issues', []))}")

    return result


async def demo_speculative_executor():
    """演示推测性执行器"""
    log_demo("Phase 8-3: 推测性执行器",
             "通过 '空间换时间'，预判下一步并并行尝试多种修复策略")

    # 创建推测性执行器
    executor = create_speculative_executor(
        workspace=".",
        max_parallel=3,
        enable_caching=True
    )

    # 演示任务和问题
    task = "修复排序算法中的边界条件问题"
    issues = [
        "空数组未处理",
        "边界条件可能导致索引越界",
        "大数据集性能下降"
    ]

    print("任务:", task)
    print("发现的问题:", issues)
    print("策略: 同时尝试 3 种不同的修复方案")
    print()

    # 执行推测性任务
    result = await executor.execute(
        task=task,
        issues=issues,
        code="def sort(arr): return arr.sort()"
    )

    print(f"\n执行结果:")
    print(f"  候选方案ID: {result.candidate_id}")
    print(f"  状态: {'成功' if result.success else '失败'}")
    print(f"  耗时: {result.duration:.2f}s")
    print(f"  分数: {result.score:.2f}")
    if result.issues_fixed:
        print(f"  已修复问题: {result.issues_fixed}")

    # 打印统计
    stats = executor.get_statistics()
    print(f"\n执行统计:")
    print(f"  总执行次数: {stats['total_executions']}")
    print(f"  成功率: {stats['success_rate']:.1%}")
    print(f"  当前并行度: {stats['current_parallelism']}")
    if "cache" in stats:
        print(f"  缓存命中率: {stats['cache']['hit_rate']:.1%}")

    return result


def demo_architecture_comparison():
    """演示架构对比"""
    log_demo("架构对比: Manus MAX vs MaoAI Phase 8")

    comparison = """
┌─────────────────────────────────────────────────────────────────────────┐
│                    Manus MAX 的底层逻辑                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ 计算范式    │ 异构并行 (Heterogeneous Parallelism)                      │
│             │ 主 Agent 决策 + 千个子 Agent 并行执行                     │
├─────────────────────────────────────────────────────────────────────────┤
│ 环境隔离    │ 轻量化容器云 (Serverless Sandboxes)                       │
│             │ 毫秒级启动的微型容器，互不干扰                             │
├─────────────────────────────────────────────────────────────────────────┤
│ 数据流转    │ 零拷贝消息总线 (Zero-copy Bus)                             │
│             │ 传递状态指针和增量 Patch，而非完整文件                      │
├─────────────────────────────────────────────────────────────────────────┤
│ 模型调度    │ 动态负载均衡 (Dynamic Load Balancing)                     │
│             │ 简单任务用 Nano，复杂任务用 Pro，并发调用 API               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    MaoAI Phase 8 的实现                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ 计算范式    │ Map-Reduce 任务调度器                                     │
│             │ TaskSplitter 拆分 + 并行 TriadLoop 执行 + PatchMerger 归并│
├─────────────────────────────────────────────────────────────────────────┤
│ 环境隔离    │ Sandbox Engine (现有) + 轻量化容器 (未来)                 │
│             │ 每个子任务在独立 TriadLoop 实例中运行                      │
├─────────────────────────────────────────────────────────────────────────┤
│ 数据流转    │ 原子化 Patch 交换 (Phase 5 已实现)                        │
│             │ Agent 间只传递 Unified Diff，而非完整代码                 │
├─────────────────────────────────────────────────────────────────────────┤
│ 模型调度    │ 推测性执行器 (Speculative Executor)                        │
│             │ 问题类型匹配策略 + 多方案并行 + 早期终止                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    性能提升预估                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Map-Reduce    │ N 个子任务并行 → 理论加速比接近 N                       │
│ 流式博弈      │ 消除等待空窗期 → 效率提升 30-50%                       │
│ 推测性执行    │ 空间换时间 → 平均节省 1-2 轮迭代                        │
├─────────────────────────────────────────────────────────────────────────┤
│ 综合提升      │ 复杂任务：10x 加速                                       │
│               │ 简单任务：2-3x 加速                                       │
└─────────────────────────────────────────────────────────────────────────┘
"""
    print(comparison)


async def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Phase 8 性能优化演示")
    parser.add_argument("--mode", type=str, default="all",
                       choices=["all", "scheduler", "streaming", "speculative", "compare"],
                       help="演示模式")
    args = parser.parse_args()

    print("=" * 70)
    print("  MaoAI HyperAgents - Phase 8 性能优化")
    print("  参考 Manus MAX 的高性能架构思路")
    print("=" * 70)

    if args.mode == "all":
        demo_architecture_comparison()
        await demo_map_reduce_scheduler()
        await demo_streaming_broker()
        await demo_speculative_executor()

    elif args.mode == "scheduler":
        await demo_map_reduce_scheduler()

    elif args.mode == "streaming":
        await demo_streaming_broker()

    elif args.mode == "speculative":
        await demo_speculative_executor()

    elif args.mode == "compare":
        demo_architecture_comparison()

    print("\n" + "=" * 70)
    print("  演示完成!")
    print("  " + "=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
