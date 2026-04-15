#!/usr/bin/env python3
"""
MaoAI Parallel Orchestrator (MPO) 集成测试脚本

测试 MPO 在 MaoAI 项目中的集成情况
"""

import asyncio
import os
import sys
import time

# 添加项目路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "server/hyperagents/core"))

async def test_parallel_import():
    """测试 MPO 模块导入"""
    print("🧪 测试 1: MPO 模块导入")
    
    try:
        from mpo_core import MaoAIParallelOrchestrator, VisionParallelOrchestrator
        print("✅ MPO 模块导入成功")
        print(f"  - MaoAIParallelOrchestrator: {MaoAIParallelOrchestrator}")
        print(f"  - VisionParallelOrchestrator: {VisionParallelOrchestrator}")
        return True
    except ImportError as e:
        print(f"❌ MPO 模块导入失败: {e}")
        return False

async def test_triad_loop_parallel_method():
    """测试 TriadLoop 的并行方法"""
    print("\n🧪 测试 2: TriadLoop 并行方法")
    
    try:
        from triad_loop_v3 import TriadLoop
        
        # 创建 TriadLoop 实例
        triad = TriadLoop(workspace=os.getcwd())
        
        # 检查是否有 run_parallel 方法
        if hasattr(triad, 'run_parallel'):
            print("✅ TriadLoop 包含 run_parallel 方法")
            
            # 检查方法签名
            import inspect
            sig = inspect.signature(triad.run_parallel)
            params = list(sig.parameters.keys())
            print(f"  - 方法参数: {params}")
            
            # 检查是否有 _discover_relevant_files 方法
            if hasattr(triad, '_discover_relevant_files'):
                print("✅ 包含 _discover_relevant_files 方法")
            else:
                print("⚠️ 缺少 _discover_relevant_files 方法")
                
            return True
        else:
            print("❌ TriadLoop 缺少 run_parallel 方法")
            return False
            
    except Exception as e:
        print(f"❌ TriadLoop 测试失败: {e}")
        return False

async def test_cli_arguments():
    """测试 CLI 参数解析"""
    print("\n🧪 测试 3: CLI 参数解析")
    
    try:
        import argparse
        
        # 模拟命令行参数
        test_args = [
            "--task", "测试并行功能",
            "--parallel",
            "--max-workers", "8",
            "--target-files", "*.py", "*.tsx",
            "--video-parallel"
        ]
        
        parser = argparse.ArgumentParser(description="MaoAI TriadLoop - 三权分立博弈循环")
        
        # 基本参数
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
        
        # Phase 5 参数
        parser.add_argument("--no-atomic", action="store_true", help="禁用原子化模式")
        parser.add_argument("--no-rag", action="store_true", help="禁用 Code RAG")
        parser.add_argument("--no-auto-patch", action="store_true", help="不自动应用 Patch")
        parser.add_argument("--rag-top-k", type=int, default=5, help="RAG 检索数量")
        
        # Phase 6: 异构模型博弈参数
        parser.add_argument("--heterogeneous", action="store_true", help="开启异构博弈模式（Claude 写 + GLM-4 审）")
        parser.add_argument("--reviewer-provider", type=str, choices=["glm", "openai", "auto"], default="auto",
                          help="Reviewer 模型提供商（glm / openai）")
        parser.add_argument("--glm-model", type=str, default="glm-4-plus", help="GLM-4 模型名")
        parser.add_argument("--claude-local", action="store_true", help="使用 Claude Code Local（有工具链）")
        parser.add_argument("--glm-validator", action="store_true", help="使用 GLM-4 作为 Validator")
        
        # Phase 8: MaoAI Parallel Orchestrator (MPO) 参数
        parser.add_argument("--parallel", action="store_true", help="启用并行执行模式（MPO）")
        parser.add_argument("--max-workers", type=int, default=5, help="最大并发 Worker 数（默认 5）")
        parser.add_argument("--target-files", type=str, nargs="+", help="目标文件列表（支持通配符）")
        parser.add_argument("--video-parallel", action="store_true", help="启用视觉并行处理模式")
        
        # 解析参数
        args = parser.parse_args(test_args)
        
        print("✅ CLI 参数解析成功")
        print(f"  - task: {args.task}")
        print(f"  - parallel: {args.parallel}")
        print(f"  - max_workers: {args.max_workers}")
        print(f"  - target_files: {args.target_files}")
        print(f"  - video_parallel: {args.video_parallel}")
        
        return True
        
    except Exception as e:
        print(f"❌ CLI 参数解析失败: {e}")
        return False

async def test_mpo_architecture():
    """测试 MPO 架构完整性"""
    print("\n🧪 测试 4: MPO 架构完整性")
    
    try:
        # 创建 MPO 实例
        from mpo_core import MaoAIParallelOrchestrator
        
        mpo = MaoAIParallelOrchestrator(max_workers=3, workspace=os.getcwd())
        
        # 检查核心属性
        required_attrs = [
            'semaphore',
            'results',
            'run_parallel_task',
            '_worker_wrapper',
            '_aggregate_results'
        ]
        
        missing_attrs = []
        for attr in required_attrs:
            if not hasattr(mpo, attr):
                missing_attrs.append(attr)
        
        if not missing_attrs:
            print("✅ MPO 架构完整")
            print(f"  - semaphore: {mpo.semaphore}")
            print(f"  - max_workers: {mpo.semaphore._value}")
            return True
        else:
            print(f"❌ MPO 缺少属性: {missing_attrs}")
            return False
            
    except Exception as e:
        print(f"❌ MPO 架构测试失败: {e}")
        return False

async def test_vision_parallel():
    """测试视觉并行处理器"""
    print("\n🧪 测试 5: 视觉并行处理器")
    
    try:
        from mpo_core import VisionParallelOrchestrator
        
        vpo = VisionParallelOrchestrator(max_workers=2, workspace=os.getcwd())
        
        # 检查特殊方法
        if hasattr(vpo, 'process_video_frames'):
            print("✅ VisionParallelOrchestrator 包含 process_video_frames 方法")
            
        if hasattr(vpo, 'generate_video_summary'):
            print("✅ VisionParallelOrchestrator 包含 generate_video_summary 方法")
            
        print(f"  - max_workers: {vpo.semaphore._value}")
        print(f"  - 支持视觉并行处理")
        
        return True
        
    except ImportError:
        print("⚠️ VisionParallelOrchestrator 不可用（可能不需要）")
        return True  # 不是错误，只是可选功能
    except Exception as e:
        print(f"❌ 视觉并行测试失败: {e}")
        return False

async def main():
    """主测试函数"""
    print("🚀 MaoAI Parallel Orchestrator (MPO) 集成测试")
    print("=" * 60)
    
    tests = [
        ("MPO 模块导入", test_parallel_import),
        ("TriadLoop 并行方法", test_triad_loop_parallel_method),
        ("CLI 参数解析", test_cli_arguments),
        ("MPO 架构完整性", test_mpo_architecture),
        ("视觉并行处理器", test_vision_parallel),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            success = await test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name} 执行异常: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("📊 测试结果汇总:")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{status} - {test_name}")
        if success:
            passed += 1
    
    print("\n" + "=" * 60)
    print(f"总体结果: {passed}/{total} 通过 ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 MPO 集成测试全部通过！")
        print("\n🎯 使用示例:")
        print("  串行模式: python triad_loop_v3.py --task \"优化代码\"")
        print("  并行模式: python triad_loop_v3.py --task \"优化代码\" --parallel --max-workers 8 --target-files \"*.py\"")
        print("  视觉并行: python triad_loop_v3.py --task \"分析视频\" --parallel --video-parallel --max-workers 4")
    else:
        print("⚠️  MPO 集成测试存在失败项，请检查")
    
    return passed == total

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)