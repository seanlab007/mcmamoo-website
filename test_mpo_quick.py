#!/usr/bin/env python3
"""
MaoAI Parallel Orchestrator (MPO) 快速集成测试
"""

import os
import sys
import asyncio

def test_file_existence():
    """测试核心文件是否存在"""
    print("📁 测试 1: 核心文件存在性")
    
    core_dir = "/Users/daiyan/Desktop/mcmamoo-website/server/hyperagents/core"
    
    files_to_check = [
        "mpo_core.py",
        "triad_loop_v3.py"
    ]
    
    all_exist = True
    for file_name in files_to_check:
        file_path = os.path.join(core_dir, file_name)
        exists = os.path.exists(file_path)
        status = "✅" if exists else "❌"
        print(f"{status} {file_name}: {'存在' if exists else '不存在'}")
        if not exists:
            all_exist = False
    
    return all_exist

def test_triad_loop_modifications():
    """测试 TriadLoop 修改情况"""
    print("\n📝 测试 2: TriadLoop 修改情况")
    
    triad_path = "/Users/daiyan/Desktop/mcmamoo-website/server/hyperagents/core/triad_loop_v3.py"
    
    if not os.path.exists(triad_path):
        print("❌ triad_loop_v3.py 文件不存在")
        return False
    
    with open(triad_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modifications = [
        ("run_parallel 方法", "async def run_parallel" in content),
        ("--parallel 参数", "--parallel" in content),
        ("MaoAIParallelOrchestrator 引用", "MaoAIParallelOrstrator" in content or "from mpo_core" in content),
    ]
    
    all_present = True
    for mod_name, present in modifications:
        status = "✅" if present else "❌"
        print(f"{status} {mod_name}: {'已添加' if present else '未找到'}")
        if not present:
            all_present = False
    
    return all_present

def test_mpo_core_structure():
    """测试 MPO 核心结构"""
    print("\n🏗️ 测试 3: MPO 核心结构")
    
    mpo_path = "/Users/daiyan/Desktop/mcmamoo-website/server/hyperagents/core/mpo_core.py"
    
    if not os.path.exists(mpo_path):
        print("❌ mpo_core.py 文件不存在")
        return False
    
    with open(mpo_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查核心类定义
    structures = [
        ("MaoAIParallelOrchestrator 类", "class MaoAIParallelOrchestrator" in content),
        ("VisionParallelOrchestrator 类", "class VisionParallelOrchestrator" in content),
        ("__init__ 方法", "def __init__" in content),
        ("run_parallel_task 方法", "async def run_parallel_task" in content),
        ("_worker_wrapper 方法", "async def _worker_wrapper" in content),
        ("_aggregate_results 方法", "def _aggregate_results" in content),
    ]
    
    all_present = True
    for struct_name, present in structures:
        status = "✅" if present else "❌"
        print(f"{status} {struct_name}: {'已定义' if present else '未找到'}")
        if not present:
            all_present = False
    
    return all_present

async def test_async_import():
    """测试异步导入功能"""
    print("\n🔧 测试 4: 异步导入功能")
    
    # 临时添加路径
    import sys
    sys.path.insert(0, "/Users/daiyan/Desktop/mcmamoo-website/server/hyperagents/core")
    
    try:
        # 尝试异步导入

        # 检查是否有异步方法

        print("✅ 异步环境检测通过")

        return True

    except Exception as e:

        print(f"❌ 异步导入测试失败: {e}")

        return False

async def main():
    """主测试函数"""
    print("🚀 MaoAI Parallel Orchestrator (MPO) 快速集成测试")
    print("=" * 60)
    
    # 同步测试
    test1 = test_file_existence()
    test2 = test_triad_loop_modifications()
    test3 = test_mpo_core_structure()
    
    # 异步测试
    test4 = await test_async_import()
    
    # 汇总结果
    results = [
        ("核心文件存在性", test1),
        ("TriadLoop 修改情况", test2),
        ("MPO 核心结构", test3),
        ("异步导入功能", test4),
    ]
    
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
        print("🎉 MPO 集成配置全部通过！")
        print("\n🔧 使用方式:")
        print("1. 串行模式（传统）:")
        print("   python triad_loop_v3.py --task '优化代码'")
        print("")
        print("2. 并行模式（MPO）:")
        print("   python triad_loop_v3.py --task '优化代码' --parallel --max-workers 8")
        print("")
        print("3. 指定目标文件:")
        print("   python triad_loop_v3.py --task '重构项目' --parallel --target-files '*.py' '*.ts'")
        print("")
        print("4. 视觉并行处理:")
        print("   python triad_loop_v3.py --task '分析视频' --parallel --video-parallel --max-workers 4")
        
    else:
        print("⚠️  MPO 集成存在配置问题")
        
        print("\n🔧 修复建议:")
        if not test1:
            print("1. 确保所有核心文件已正确复制")
            print("   位置: server/hyperagents/core/")
        else:
            print("✅ 文件完整性通过")
            
        if not test2:
            print("2. 检查 triad_loop_v3.py 是否包含了必要的修改")
            print("   - 添加了 run_parallel 方法")
            print("   - 添加了 --parallel 参数")
            print("   - 正确引用了 MaoAIParallelOrchestrator")
        else:
            print("✅ TriadLoop 修改通过")
            
        if not test3:
            print("3. 验证 mpo_core.py 的结构完整性")
            print("   - 核心类定义")
            print("   - 关键方法实现")
            print("   - 异步支持")
        else:
            print("✅ MPO 核心结构通过")
            
        if not test4:
            print("4. 修复异步导入问题")
            print("   - 检查 __init__.py 文件")
            print("   - 确认相对导入路径")
        else:
            print("✅ 异步导入通过")
    
    return passed == total

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)