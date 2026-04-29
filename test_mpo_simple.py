#!/usr/bin/env python3
"""
MaoAI Parallel Orchestrator (MPO) 简单集成测试
"""

import os
import sys

print("🚀 测试 MPO 核心文件导入...")

# 测试 mpo_core.py 导入
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "server/hyperagents/core"))
    print("✅ 添加了 core 目录到 sys.path")
    
    # 尝试导入 mpo_core
    try:
        from mpo_core import MaoAIParallelOrchestrator
        print("✅ MaoAIParallelOrchestrator 导入成功")
    except ImportError as e:
        print(f"❌ MaoAIParallelOrchestrator 导入失败: {e}")
        
    # 检查文件是否存在
    mpo_path = os.path.join(os.path.dirname(__file__), "server/hyperagents/core/mpo_core.py")
    if os.path.exists(mpo_path):
        print(f"✅ mpo_core.py 文件存在: {mpo_path}")
        
        # 检查文件大小
        file_size = os.path.getsize(mpo_path)
        print(f"  - 文件大小: {file_size / 1024:.1f} KB")
    else:
        print(f"❌ mpo_core.py 文件不存在: {mpo_path}")
        
except Exception as e:
    print(f"❌ 测试过程中出错: {e}")

print("\n📁 检查文件结构...")

# 检查 triad_loop_v3.py
triad_path = os.path.join(os.path.dirname(__file__), "server/hyperagents/core/triad_loop_v3.py")
if os.path.exists(triad_path):
    print(f"✅ triad_loop_v3.py 文件存在: {triad_path}")
    
    # 检查文件是否包含 run_parallel 方法
    with open(triad_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        if 'async def run_parallel' in content:
            print("✅ triad_loop_v3.py 包含 run_parallel 方法")
        else:
            print("❌ triad_loop_v3.py 不包含 run_parallel 方法")
            
        if 'MaoAIParallelOrchestrator' in content:
            print("✅ triad_loop_v3.py 引用了 MaoAIParallelOrchestrator")
        else:
            print("❌ triad_loop_v3.py 未引用 MaoAIParallelOrchestrator")
            
        if '--parallel' in content:
            print("✅ triad_loop_v3.py 包含 --parallel 参数")
        else:
            print("❌ triad_loop_v3.py 不包含 --parallel 参数")
else:
    print(f"❌ triad_loop_v3.py 文件不存在: {triad_path}")

print("\n🎯 集成状态总结:")
print("-" * 40)

# 总结集成状态
checks = [
    ("mpo_core.py 文件", os.path.exists(mpo_path) if 'mpo_path' in locals() else False),
    ("triad_loop_v3.py 文件", os.path.exists(triad_path)),
    ("run_parallel 方法", 'async def run_parallel' in locals().get('content', '') if 'content' in locals() else False),
    ("--parallel 参数", '--parallel' in locals().get('content', '') if 'content' in locals() else False),
]

all_passed = True
for check_name, passed in checks:
    status = "✅" if passed else "❌"
    print(f"{status} {check_name}")
    if not passed:
        all_passed = False

print("\n" + "=" * 40)
if all_passed:
    print("🎉 MPO 集成基本配置完成！")
    print("\n📋 下一步:")
    print("1. 运行实际测试: python triad_loop_v3.py --task '测试' --parallel --max-workers 3")
    print("2. 测试文件发现: python triad_loop_v3.py --task '优化代码' --parallel --target-files '*.py'")
    print("3. 验证 Worker 并发: 观察日志中的 Worker 启动信息")
else:
    print("⚠️  MPO 集成存在配置问题，请检查上述错误")
    print("\n🔧 修复建议:")
    print("1. 确保 mpo_core.py 已正确复制到 server/hyperagents/core/")
    print("2. 检查 triad_loop_v3.py 是否包含了必要的修改")
    print("3. 验证文件路径和导入语句")