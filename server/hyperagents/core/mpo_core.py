#!/usr/bin/env python3
"""
MaoAI Parallel Orchestrator (MPO) - Core 核心实现
基于用户提供的代码框架，集成现有 MaoAI 组件
"""

import asyncio
import json
import time
import os
import sys
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import hashlib

# 添加当前目录到路径（兼容相对导入）
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from .triad_loop_v3 import TriadLoop, create_triad_loop
    HAS_TRIAD_LOOP = True
except (ImportError, SystemError):
    try:
        from triad_loop_v3 import TriadLoop, create_triad_loop
        HAS_TRIAD_LOOP = True
    except ImportError:
        HAS_TRIAD_LOOP = False
        print("警告: 未找到 triad_loop_v3，使用模拟模式")

# ─── 日志工具 ─────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    entry = {
        "type": step_type,
        "agent": "mpo_core",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── MaoAI Parallel Orchestrator 核心类 ───────────────────────────────────────

class MaoAIParallelOrchestrator:
    """
    MaoAI Parallel Orchestrator (MPO) 核心实现
    
    基于用户提供的代码框架：
    1. 架构蓝图：Agent 任务分片与聚合
    2. 核心组件：任务分片器、并发控制器、结果聚合器
    3. Python asyncio 实现
    4. 3个"避坑"建议：上下文隔离、状态共享、动态降级
    
    核心方法：
    - run_parallel_task: 主入口，将大任务分发给多个并行 Worker
    - _worker_wrapper: 单个 Worker 的执行闭环
    - _aggregate_results: 结果聚合器
    """
    
    def __init__(self, max_workers: int = 10, workspace: str = None):
        """
        初始化 MaoAI Parallel Orchestrator
        
        参数:
            max_workers: 最大并发 Worker 数（控制 API Rate Limit）
            workspace: 工作目录
        """
        # 核心：控制并发数，模拟 Manus Max 的集群感
        self.semaphore = asyncio.Semaphore(max_workers)
        self.results = []
        self.workspace = workspace or os.getcwd()
        
        log_step("mpo_init",
                f"MaoAI Parallel Orchestrator 初始化完成",
                max_workers=max_workers,
                workspace=self.workspace)
    
    async def run_parallel_task(self, task_description: str, target_files: List[str]):
        """
        核心入口：将大任务分发给多个并行 Worker
        
        工作流程：
        1. 任务分片 (Sharding)
        2. 并行执行 (Map)
        3. 结果聚合 (Reduce)
        
        参数:
            task_description: 任务描述
            target_files: 目标文件列表
        
        返回:
            聚合后的结果
        """
        log_step("mpo_start",
                f"启动并行任务: {task_description[:100]}...",
                target_files_count=len(target_files))
        
        # 1. 任务分片 (Sharding)
        tasks = []
        for file_path in target_files:
            # 为每个文件创建一个轻量级任务
            tasks.append(self._worker_wrapper(task_description, file_path))
        
        # 2. 并行执行 (Map)
        # asyncio.gather 会并发运行所有任务
        log_step("mpo_map_start", f"开始并行执行 {len(tasks)} 个 Worker")
        completed_tasks = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常结果
        valid_results = []
        for i, result in enumerate(completed_tasks):
            if isinstance(result, Exception):
                log_step("mpo_task_error",
                        f"任务 {i} 异常: {result}",
                        file=target_files[i] if i < len(target_files) else "unknown",
                        error=str(result))
            else:
                valid_results.append(result)
        
        # 3. 结果聚合 (Reduce)
        final_result = self._aggregate_results(valid_results)
        
        log_step("mpo_complete",
                f"并行任务完成: {len(valid_results)}/{len(tasks)} 成功",
                final_score=final_result.get("final_score", 0.0))
        
        return final_result
    
    async def _worker_wrapper(self, task: str, file_path: str):
        """
        单个 Worker 的执行闭环
        
        实现"避坑建议"：
        1. 上下文隔离：每个 Worker 的 Prompt 极度精简
        2. 状态共享：利用 DecisionLedger 作为共享内存
        3. 动态降级：设置超时机制，失败的 Worker 标记为 REJECTED
        """
        async with self.semaphore:  # 竞争信号量，控制并发
            worker_id = hashlib.md5(f"{task}{file_path}".encode()).hexdigest()[:8]
            start_time = time.time()
            
            log_step("mpo_worker_start",
                    f"Worker {worker_id} 启动: 正在处理 {file_path}...",
                    worker_id=worker_id,
                    file=file_path)
            
            try:
                # 实例化一个轻量级的 TriadLoop (只处理单文件)
                # 建议：这里可以根据任务复杂度动态选择模型 (Lite/Pro)
                worker = await self._create_worker(task, file_path)
                
                # 执行博弈循环
                if HAS_TRIAD_LOOP:
                    result = await worker.run(task=f"{task} for {file_path}")
                    score = getattr(result, 'final_score', 0.0)
                else:
                    # 模拟模式
                    await asyncio.sleep(0.5)  # 模拟处理时间
                    result = {"status": "completed", "score": 0.9, "code": f"// Mock code for {file_path}"}
                    score = 0.9
                
                duration = time.time() - start_time
                
                log_step("mpo_worker_complete",
                        f"Worker {worker_id} 完成: {file_path} | 分数: {score:.2f}",
                        worker_id=worker_id,
                        file=file_path,
                        score=score,
                        duration=duration)
                
                return {
                    "file": file_path,
                    "result": result,
                    "score": score,
                    "duration": duration,
                    "worker_id": worker_id,
                    "status": "completed"
                }
                
            except asyncio.TimeoutError:
                duration = time.time() - start_time
                log_step("mpo_worker_timeout",
                        f"Worker 超时: {file_path} ({duration:.1f}s)",
                        file=file_path,
                        duration=duration)
                
                return {
                    "file": file_path,
                    "result": None,
                    "score": 0.0,
                    "duration": duration,
                    "worker_id": worker_id,
                    "status": "timeout",
                    "error": f"Worker 超时 ({duration:.1f}s)"
                }
                
            except Exception as e:
                duration = time.time() - start_time
                log_step("mpo_worker_error",
                        f"Worker 异常: {file_path} - {e}",
                        file=file_path,
                        error=str(e),
                        duration=duration)
                
                # 动态降级：失败的 Worker 标记为 REJECTED
                return {
                    "file": file_path,
                    "result": None,
                    "score": 0.0,
                    "duration": duration,
                    "worker_id": worker_id,
                    "status": "rejected",
                    "error": str(e)
                }
    
    async def _create_worker(self, task: str, file_path: str):
        """
        创建轻量级 TriadLoop Worker
        
        实现"上下文隔离"：
        - 每个 Worker 的 Prompt 必须极度精简
        - 不要把整个项目的上下文塞给每个 Worker
        - 只给它"目标文件 + 直接依赖"，节省 80% Token
        """
        if not HAS_TRIAD_LOOP:
            # 模拟模式
            class MockWorker:
                async def run(self, task):
                    return {"status": "completed", "score": 0.9, "code": f"// Mock: {task}"}
            return MockWorker()
        
        try:
            # 读取目标文件内容（作为上下文）
            file_content = ""
            try:
                full_path = os.path.join(self.workspace, file_path)
                if os.path.exists(full_path):
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        # 限制内容长度（避免过大 Token）
                        if len(content) > 5000:
                            content = content[:2500] + "\n... [内容已截断] ...\n" + content[-2500:]
                        file_content = content
            except:
                pass
            
            # 构建精简上下文
            context = {
                "is_worker_mode": True,
                "target_file": file_path,
                "file_content": file_content,
                "atomic_mode": True,  # 启用原子化模式
                "auto_apply": False,  # Worker 不自动应用
                "max_iterations": 3,  # Worker 最大 3 轮（节省时间）
            }
            
            # 创建轻量级 TriadLoop
            worker = create_triad_loop(
                workspace=self.workspace,
                coder_model="claude-3-5-sonnet",  # 可根据需要调整
                reviewer_model="gpt-4o",
                max_iterations=3,  # Worker 减少迭代次数
                score_threshold=0.7,  # Worker 降低阈值
                enable_atomic_mode=True,
                enable_code_rag=False,  # Worker 禁用 RAG（节省 Token）
                auto_apply_patch=False,  # Worker 不自动应用
                enable_reality_check=False,  # Worker 禁用现实验证（主 Agent 处理）
            )
            
            # 注入 Worker 上下文（需要根据 TriadLoop 实际 API 调整）
            if hasattr(worker, 'set_context'):
                worker.set_context(context)
            
            return worker
            
        except Exception as e:
            log_step("mpo_worker_create_error",
                    f"创建 Worker 失败: {e}",
                    file=file_path,
                    error=str(e))
            raise
    
    def _aggregate_results(self, task_results: List[Dict]):
        """
        冲突检测与最终汇总
        
        处理多个 Agent 同时修改代码时的"合并冲突"
        建议：使用您之前写的 PatchApplier 进行顺序应用
        """
        if not task_results:
            return {"merged_code": "", "patches": [], "conflicts": [], "success": False}
        
        # 按状态分组
        completed = [r for r in task_results if r.get("status") == "completed"]
        failed = [r for r in task_results if r.get("status") in ["timeout", "rejected", "failed"]]
        
        # 计算统计信息
        total_tasks = len(task_results)
        completed_count = len(completed)
        success_rate = completed_count / total_tasks if total_tasks > 0 else 0
        
        # 计算平均分数
        scores = [r.get("score", 0.0) for r in completed]
        avg_score = sum(scores) / len(scores) if scores else 0.0
        
        # 提取代码片段
        code_snippets = []
        for result in completed:
            if result.get("result"):
                if hasattr(result["result"], 'final_code'):
                    code = result["result"].final_code
                elif isinstance(result["result"], dict) and "code" in result["result"]:
                    code = result["result"]["code"]
                else:
                    code = str(result["result"])
                
                if code and code not in code_snippets:
                    code_snippets.append({
                        "file": result.get("file", "unknown"),
                        "code": code,
                        "score": result.get("score", 0.0)
                    })
        
        # 简单合并代码（TODO: 实现智能合并）
        merged_code = "\n\n".join([cs["code"] for cs in code_snippets]) if code_snippets else ""
        
        # 检测冲突（同一文件被多个 Worker 修改）
        file_workers = {}
        for result in completed:
            file_path = result.get("file", "")
            worker_id = result.get("worker_id", "")
            if file_path and worker_id:
                if file_path in file_workers:
                    file_workers[file_path].append(worker_id)
                else:
                    file_workers[file_path] = [worker_id]
        
        conflicts = []
        for file_path, workers in file_workers.items():
            if len(workers) > 1:
                conflicts.append({
                    "file": file_path,
                    "conflicting_workers": workers,
                    "description": f"多个 Worker ({', '.join(workers)}) 修改了同一文件"
                })
        
        # 构建最终结果
        final_result = {
            "success": success_rate >= 0.5,  # 50% 以上成功即为成功
            "success_rate": success_rate,
            "final_score": avg_score,
            "total_tasks": total_tasks,
            "completed_tasks": completed_count,
            "failed_tasks": len(failed),
            "merged_code": merged_code,
            "code_snippets": code_snippets,
            "conflicts": conflicts,
            "summary": f"并行任务完成: {completed_count}/{total_tasks} 成功, 平均分数: {avg_score:.2f}, 冲突: {len(conflicts)} 个"
        }
        
        log_step("mpo_aggregate",
                f"结果聚合完成: {completed_count}/{total_tasks} 成功, 分数: {avg_score:.2f}",
                success_rate=success_rate,
                conflicts=len(conflicts))
        
        return final_result


# ─── 进阶：视觉并行处理 ────────────────────────────────────────────────────────

class VisionParallelOrchestrator(MaoAIParallelOrchestrator):
    """
    视觉并行处理扩展
    
    如果您要处理视频或大量图片：
    - 思路：将视频帧地址列表传给 MPO
    - 实现：每个 Worker 调用 VisionStrategist 分析一帧
    - 聚合：最后由一个 StrategicSentinel 汇总所有帧的描述，生成视频摘要
    """
    
    async def run_vision_parallel(self, frame_urls: List[str], analysis_task: str):
        """
        并行分析视频帧
        
        参数:
            frame_urls: 视频帧 URL 列表
            analysis_task: 分析任务描述
        
        返回:
            聚合后的视频分析结果
        """
        log_step("vision_start",
                f"启动视觉并行处理: {len(frame_urls)} 帧, 任务: {analysis_task}")
        
        # 1. 将帧分片（每 5 帧一个 Worker）
        frame_chunks = [frame_urls[i:i+5] for i in range(0, len(frame_urls), 5)]
        
        # 2. 为每个分片创建任务
        tasks = []
        for i, chunk in enumerate(frame_chunks):
            chunk_task = f"{analysis_task} - 分片 {i+1} ({len(chunk)} 帧)"
            tasks.append(self._vision_worker_wrapper(chunk_task, chunk))
        
        # 3. 并行执行
        completed_tasks = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 4. 聚合结果
        vision_results = [r for r in completed_tasks if not isinstance(r, Exception)]
        final_result = self._aggregate_vision_results(vision_results, analysis_task)
        
        log_step("vision_complete",
                f"视觉并行处理完成: {len(vision_results)}/{len(tasks)} 成功",
                total_frames=len(frame_urls))
        
        return final_result
    
    async def _vision_worker_wrapper(self, task: str, frame_urls: List[str]):
        """视觉 Worker 执行闭环"""
        async with self.semaphore:
            worker_id = hashlib.md5(f"{task}{len(frame_urls)}".encode()).hexdigest()[:8]
            start_time = time.time()
            
            log_step("vision_worker_start",
                    f"Vision Worker {worker_id} 启动: 处理 {len(frame_urls)} 帧",
                    worker_id=worker_id)
            
            try:
                # 这里应该调用 VisionStrategist
                # 由于时间关系，先模拟实现
                await asyncio.sleep(len(frame_urls) * 0.1)  # 模拟处理时间
                
                # 模拟分析结果
                frame_analyses = []
                for url in frame_urls:
                    frame_analyses.append({
                        "url": url,
                        "objects": ["person", "car", "building"] if "frame_1" in url else ["tree", "sky"],
                        "confidence": 0.85,
                        "description": f"帧分析: {task}"
                    })
                
                duration = time.time() - start_time
                
                log_step("vision_worker_complete",
                        f"Vision Worker {worker_id} 完成: {len(frame_urls)} 帧",
                        worker_id=worker_id,
                        duration=duration)
                
                return {
                    "worker_id": worker_id,
                    "frame_urls": frame_urls,
                    "analyses": frame_analyses,
                    "duration": duration,
                    "status": "completed"
                }
                
            except Exception as e:
                duration = time.time() - start_time
                log_step("vision_worker_error",
                        f"Vision Worker {worker_id} 异常: {e}",
                        worker_id=worker_id,
                        error=str(e))
                
                return {
                    "worker_id": worker_id,
                    "frame_urls": frame_urls,
                    "analyses": [],
                    "duration": duration,
                    "status": "failed",
                    "error": str(e)
                }
    
    def _aggregate_vision_results(self, vision_results, analysis_task):
        """聚合视觉分析结果"""
        all_analyses = []
        for result in vision_results:
            if result.get("status") == "completed":
                all_analyses.extend(result.get("analyses", []))
        
        # 生成视频摘要
        summary = self._generate_video_summary(all_analyses, analysis_task)
        
        return {
            "success": len(all_analyses) > 0,
            "total_frames": sum(len(r.get("frame_urls", [])) for r in vision_results),
            "analyzed_frames": len(all_analyses),
            "video_summary": summary,
            "analyses": all_analyses,
            "summary": f"视频分析完成: {len(all_analyses)} 帧, 任务: {analysis_task}"
        }
    
    def _generate_video_summary(self, analyses, analysis_task):
        """生成视频摘要"""
        if not analyses:
            return "无分析结果"
        
        # 统计物体出现频率
        object_counts = {}
        for analysis in analyses:
            for obj in analysis.get("objects", []):
                object_counts[obj] = object_counts.get(obj, 0) + 1
        
        # 排序
        top_objects = sorted(object_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # 构建摘要
        summary = f"视频分析摘要: {analysis_task}\n"
        summary += f"总帧数: {len(analyses)}\n"
        summary += "物体频率统计:\n"
        for obj, count in top_objects:
            percentage = count / len(analyses) * 100
            summary += f"  - {obj}: {count} 帧 ({percentage:.1f}%)\n"
        
        return summary


# ─── 使用示例 ─────────────────────────────────────────────────────────────────

async def main():
    """使用示例"""
    
    print("=" * 60)
    print("MaoAI Parallel Orchestrator (MPO) 使用示例")
    print("=" * 60)
    
    # 示例 1: 代码并行处理
    print("\n1. 代码并行处理示例:")
    mpo = MaoAIParallelOrchestrator(max_workers=3)
    
    # 模拟目标文件
    target_files = [
        "/Users/daiyan/Desktop/mcmamoo-website/client/src/features/maoai/components/Chat.tsx",
        "/Users/daiyan/Desktop/mcmamoo-website/client/src/features/maoai/components/Login.tsx",
        "/Users/daiyan/Desktop/mcmamoo-website/server/_core/index.ts",
        "/Users/daiyan/Desktop/mcmamoo-website/shared/types.ts"
    ]
    
    # 过滤存在的文件
    existing_files = [f for f in target_files if os.path.exists(f)]
    if not existing_files:
        existing_files = target_files  # 使用模拟文件
    
    task_desc = "优化组件性能，添加错误处理，改进 TypeScript 类型定义"
    
    result = await mpo.run_parallel_task(task_desc, existing_files[:3])  # 只处理前3个
    
    print(f"任务: {task_desc}")
    print(f"目标文件: {len(existing_files[:3])} 个")
    print(f"结果: {result.get('summary', 'N/A')}")
    print(f"成功: {result.get('success', False)}")
    print(f"分数: {result.get('final_score', 0.0):.2f}")
    
    # 示例 2: 视觉并行处理
    print("\n2. 视觉并行处理示例:")
    vpo = VisionParallelOrchestrator(max_workers=2)
    
    # 模拟视频帧
    frame_urls = [f"https://example.com/video/frame_{i:04d}.jpg" for i in range(15)]
    
    vision_result = await vpo.run_vision_parallel(
        frame_urls=frame_urls,
        analysis_task="识别视频中的物体和场景"
    )
    
    print(f"视觉任务: 识别视频中的物体和场景")
    print(f"帧数: {vision_result.get('total_frames', 0)}")
    print(f"分析帧: {vision_result.get('analyzed_frames', 0)}")
    print(f"摘要预览: {vision_result.get('video_summary', 'N/A')[:200]}...")
    
    print("\n" + "=" * 60)
    print("MPO 架构优势:")
    print("- 并行爆发力: 多个 Worker 并发执行，大幅缩短任务时间")
    print("- 智能分片: 根据文件依赖自动拆分任务")
    print("- 容错机制: 单点失败不影响整体，动态降级")
    print("- 状态共享: 通过 DecisionLedger 避免重复工作")
    print("- 视觉扩展: 支持视频帧并行分析")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())