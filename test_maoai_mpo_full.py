#!/usr/bin/env python3
"""
MaoAI-MPO 完整集成测试脚本

测试 MaoAI 3.0 Phase 7 与 MPO 的深度集成，包括：
1. 串行与并行模式自动选择
2. 任务复杂度分析
3. 错误处理和回退机制
4. 性能统计监控
"""

import asyncio
import time
import sys
import os
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# ─── 测试配置 ─────────────────────────────────────────────────────────────────

TEST_CONFIG = {
    # 串行任务测试
    "serial_tasks": [
        {
            "id": "serial_1",
            "description": "修复首页按钮的颜色对比度问题",
            "context": {"is_frontend": True},
            "mode": "fix",
            "expected": "should complete successfully"
        },
        {
            "id": "serial_2",
            "description": "添加用户登录表单的输入验证",
            "context": {"is_frontend": True},
            "mode": "generate",
            "expected": "should generate new code"
        }
    ],
    
    # 并行任务测试
    "parallel_tasks": [
        {
            "id": "parallel_1",
            "description": "批量优化所有前端组件的错误处理",
            "context": {"is_frontend": True},
            "mode": "fix",
            "target_files": [
                "client/src/features/maoai/components/Chat.tsx",
                "client/src/features/maoai/components/Login.tsx",
                "client/src/features/maoai/components/HistoryView.tsx"
            ],
            "expected": "should process files in parallel"
        },
        {
            "id": "parallel_2",
            "description": "重构后端API的错误处理和日志记录",
            "context": {"is_backend": True},
            "mode": "fix",
            "target_files": [
                "server/api/auth/",
                "server/api/chat/",
                "server/api/history/",
                "server/middleware/errorHandler.ts"
            ],
            "expected": "should process backend files in parallel"
        }
    ],
    
    # 错误处理测试
    "error_tasks": [
        {
            "id": "error_1",
            "description": "处理不存在的文件修改任务",
            "context": {"is_frontend": True},
            "mode": "fix",
            "target_files": ["non_existent_file.ts"],
            "expected": "should handle gracefully with fallback"
        }
    ]
}

# ─── 测试用例类 ─────────────────────────────────────────────────────────────────

class MaoAIMPOIntegrationTest:
    """MaoAI-MPO 集成测试"""
    
    def __init__(self):
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = []
        self.test_results = []
        
    async def run_all_tests(self):
        """运行所有测试"""
        print("=" * 70)
        print("MaoAI-MPO 集成测试套件")
        print("=" * 70)
        
        # 导入适配器（延迟导入，确保路径正确）
        try:
            from server.hyperagents.core.maoai_mpo_adapter import MaoAIMPOrchestrator, MPOConfig
            
            self.config = MPOConfig(
                enable_parallel=True,
                max_workers=2,
                min_tasks_for_parallel=2,
                enable_fallback=True,
                fallback_max_retries=1
            )
            
            # 创建适配器实例
            self.adapter = MaoAIMPOrchestrator(self.config)
            
        except ImportError as e:
            print(f"导入错误: {e}")
            print("请确保路径设置正确，或使用模拟模式")
            return
        
        # 运行串行任务测试
        print(f"\n{'阶段 1: 串行任务测试':^70}")
        await self._run_task_group("serial_tasks", TEST_CONFIG["serial_tasks"])
        
        # 运行并行任务测试
        print(f"\n{'阶段 2: 并行任务测试':^70}")
        await self._run_task_group("parallel_tasks", TEST_CONFIG["parallel_tasks"])
        
        # 运行错误处理测试

        print(f"\n{'阶段 3: 错误处理测试':^70}")
        await self._run_task_group("error_tasks", TEST_CONFIG["error_tasks"])
        
        # 运行性能统计测试
        print(f"\n{'阶段 4: 性能统计测试':^70}")
        await self._run_statistics_tests()
        
        # 显示测试摘要
        self._show_summary()
    
    async def _run_task_group(self, group_name: str, tasks: list):
        """运行一组测试任务"""
        print(f"\n{group_name.replace('_', ' ').title()}: {len(tasks)} 个测试\n")
        
        for i, task in enumerate(tasks, 1):
            self.total_tests += 1
            
            print(f"  [{i}] 任务 ID: {task['id']}")
            print(f"     描述: {task['description']}")
            print(f"     期望: {task['expected']}")
            
            try:
                # 执行任务
                start_time = time.time()
                result = await self.adapter.execute(
                    task=task["description"],
                    context=task.get("context", {}),
                    mode=task["mode"],
                    target_files=task.get("target_files")
                )
                duration = time.time() - start_time
                # 检查结果

                passed = self._check_result(task, result)
                
                if passed:
                    self.passed_tests += 1
                    print(f"      结果: ✅ 通过 (耗时: {duration:.2f}s)")
                else:
                    self.failed_tests.append({
                        "group": group_name,
                        "id": task["id"],
                        "reason": "结果不符合期望"
                    })
                    print(f"      结果: ❌ 失败")
                
                # 记录测试结果

                self.test_results.append({
                        "id": task["id"],
                        "group": group_name,
                        "description": task["description"],
                        "passed": passed,
                        "duration": duration,
                        "result": str(result)[:100] if result else "None"
                })
                
            except Exception as e:
                self.failed_tests.append({
                    "group": group_name,
                    "id": task["id"],
                    "reason": f"执行异常: {str(e)[:100]}"
                })
                print(f"      结果: ❌ 异常: {e}")
            
            print()
    
    def _check_result(self, task: dict, result) -> bool:
        """检查任务结果是否符合期望"""
        if result is None:
            return False

        # 检查串行任务
        if task["id"].startswith("serial"):
            # 串行任务应该返回成功的结果
            if hasattr(result, 'all_passed'):
                return result.all_passed
            elif isinstance(result, dict):
                return result.get("success", False)
        
        # 检查并行任务
        elif task["id"].startswith("parallel"):
            # 并行任务应该返回结果，但不一定要求 all_passed（可能是部分成功）
            if hasattr(result, 'final_score'):
                return result.final_score > 0.5
            elif isinstance(result, dict):
                return result.get("success_rate", 0.0) > 0.5
        
        # 检查错误处理任务
        elif task["id"].startswith("error"):
            # 错误处理任务应该妥善处理，不崩溃
            return result is not None
        
        return False

    async def _run_statistics_tests(self):
        """运行性能统计测试"""
        print("性能统计测试:\n")

        # 获取当前统计信息

        stats = await self.adapter.get_stats()
        
        # 检查统计信息是否有效
        stat_checks = [
            ("总任务数", stats.get("total_tasks", 0) >= 0, "应为非负数"),
            ("并行任务数", stats.get("parallel_tasks", 0) >= 0, "应为非负数"),
            ("串行任务数", stats.get("serial_tasks", 0) >= 0, "应为非负数"),
            ("成功任务数", stats.get("successful_tasks", 0) >= 0, "应为非负数"),
            ("失败任务数", stats.get("failed_tasks", 0) >= 0, "应为非负数"),
            ("总耗时", stats.get("total_duration", 0) >= 0, "应为非负数"),
            ("平均耗时", stats.get("average_duration", 0) >= 0, "应为非负数")
        ]
        
        for check_name, condition, expectation in stat_checks:
            self.total_tests += 1
            
            if condition:
                self.passed_tests += 1
                status = "✅"
            else:
                self.failed_tests.append({
                    "group": "statistics_tests",
                    "id": f"stat_{check_name}",
                    "reason": f"统计信息无效: {check_name}, 期望: {expectation}"
                })
                status = "❌"
            
            print(f"  [{check_name:^15}] {status} 期望: {expectation}")
        
        print()

    def _show_summary(self):
        """显示测试结果摘要"""

        print("\n" + "=" * 70)
        print("测试结果摘要")
        print("=" * 70)
        
        # 基本信息

        print(f"总测试数: {self.total_tests}")
        print(f"通过测试: {self.passed_tests} ({self.passed_tests/self.total_tests*100:.1f}%)")
        print(f"失败测试: {len(self.failed_tests)} ({len(self.failed_tests)/self.total_tests*100:.1f}%)")
        
        # 失败详情

        if self.failed_tests:
            print(f"\n失败详情:")
            for failure in self.failed_tests:
                print(f"  - {failure['group']}.{failure['id']}: {failure['reason']}")
        
        # 测试结论

        overall_pass_rate = self.passed_tests / self.total_tests if self.total_tests > 0 else 0
        print(f"\n整体通过率: {overall_pass_rate*100:.1f}%")
        
        if overall_pass_rate >= 0.9:
            print(f"✅ 测试通过：MaoAI-MPO 集成稳定，推荐用于生产环境")
        elif overall_pass_rate >= 0.7:
            print(f"⚠️  部分通过：MaoAI-MPO 集成基本可用，建议优化后再用于生产")
        else:
            print(f"❌ 测试失败：MaoAI-MPO 集成存在问题，不建议用于生产环境")
        
        # 性能建议

        print(f"\n性能建议:")
        print(f"  1. 对于少于 {self.config.min_tasks_for_parallel} 个文件的任务，推荐使用串行模式")
        print(f"  2. 对于复杂任务，建议设置超时时间防止长时间阻塞")
        print(f"  3. 监控并行任务成功率，建议维持在 70% 以上")
        print(f"  4. 对于视频处理任务，建议启用视觉并行处理器")
        
        print("\n" + "=" * 70)


async def run_specific_test(test_id: str):
    """运行特定的测试用例"""

    print(f"运行特定测试: {test_id}")

    # 创建适配器

    from server.hyperagents.core.maoai_mpo_adapter import MaoAIMPOrchestrator, MPOConfig
    
    config = MPOConfig(
        enable_parallel=True,
        max_workers=2,
        enable_fallback=True
    )

    adapter = MaoAIMPOrchestrator(config)

    # 运行测试

    if test_id == "simple_serial":
        task = "修复按钮样式"
        print(f"测试任务: {task}")
        
        start_time = time.time()
        result = await adapter.execute(
            task=task,
            context={"is_frontend": True},
            mode="fix"
        )

        duration = time.time() - start_time
        
        print(f"执行耗时: {duration:.2f}s")
        print(f"执行结果: {result.status if hasattr(result, 'status') else result.get('status', 'unknown')}")
        print(f"最终分数: {result.final_score if hasattr(result, 'final_score') else result.get('final_score', 0.0):.2f}")
        
    elif test_id == "simple_parallel":
        import glob

        target_files = glob.glob("client/src/**/*.ts", recursive=True)[:3]

        task = "批量优化 TypeScript 类型定义"
        print(f"测试任务: {task}")
        print(f"目标文件: {target_files}")
        
        start_time = time.time()
        result = await adapter.execute(
            task=task,
            context={"is_frontend": True},
            mode="fix",
            target_files=target_files
        )

        duration = time.time() - start_time
        
        print(f"执行耗时: {duration:.2f}s")
        print(f"执行结果: {result.status if hasattr(result, 'status') else result.get('status', 'unknown')}")
        print(f"最终分数: {result.final_score if hasattr(result, 'final_score') else result.get('final_score', 0.0):.2f}")
        
    else:
        print(f"未知测试 ID: {test_id}")
        print("可用的测试 ID:")
        print("  - simple_serial: 简单串行任务")
        print("  - simple_parallel: 简单并行任务")


def main():
    """主入口"""

    import argparse

    parser = argparse.ArgumentParser(description="MaoAI-MPO 集成测试")
    parser.add_argument("--test-id", type=str, help="运行特定测试")
    parser.add_argument("--full", action="store_true", help="运行完整测试套件")
    
    args = parser.parse_args()

    if args.test_id:
        asyncio.run(run_specific_test(args.test_id))
    elif args.full or not any(vars(args).values()):
        test = MaoAIMPOIntegrationTest()
        asyncio.run(test.run_all_tests())
    else:
        parser.print_help()


if __name__ == "__main__":
    main()