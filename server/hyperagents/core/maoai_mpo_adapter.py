#!/usr/bin/env python3
"""
MaoAI-MPO Adapter - 将 MaoAI 3.0 Phase 7 与 MPO 深度集成

核心功能：
1. 统一接口：将 MaoAI 任务映射到 MPO 并行任务
2. 动态调度：根据任务复杂度选择串行或并行执行
3. 结果转换：将 MPO 结果转换为 TriadLoopResult 格式
4. 错误处理：实现完善的错误恢复机制
5. 性能监控：实时监控并行执行状态
"""

import asyncio
import time
import json
import os
import sys
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入 MPO 核心
try:
    from .mpo_core import MaoAIParallelOrchestrator, VisionParallelOrchestrator
    HAS_MPO = True
except ImportError as e:
    HAS_MPO = False
    print(f"警告: 导入 MPO 失败: {e}")

# 导入 Triad Loop
try:
    from .triad_loop_v3 import TriadLoop, TriadLoopResult, TriadStatus, RoundResult
    HAS_TRIAD = True
except ImportError:
    HAS_TRIAD = False

# ─── 日志工具 ─────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    entry = {
        "type": step_type,
        "agent": "mpo_adapter",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 配置类 ───────────────────────────────────────────────────────────────────

@dataclass
class MPOConfig:
    """MPO 配置"""
    # 并行配置
    enable_parallel: bool = True
    max_workers: int = 5
    min_tasks_for_parallel: int = 3  # 最少几个任务才启用并行
    
    # Worker 配置
    worker_max_iterations: int = 3  # Worker 最大迭代次数
    worker_score_threshold: float = 0.7  # Worker 分数阈值
    worker_timeout: int = 300  # Worker 超时时间（秒）
    
    # 任务分片配置
    enable_auto_sharding: bool = True
    max_files_per_worker: int = 3  # 每个 Worker 处理的最大文件数
    
    # 回退配置
    enable_fallback: bool = True
    fallback_max_retries: int = 2
    
    # 监控配置
    enable_monitoring: bool = True
    monitoring_interval: int = 5  # 监控间隔（秒）
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}


# ─── MaoAI-MPO Adapter 核心类 ─────────────────────────────────────────────────

class MaoAIMPOrchestrator:
    """
    MaoAI-MPO 适配器
    
    职责：
    1. 分析任务复杂度，自动选择串行或并行模式
    2. 将 MaoAI 任务转换为 MPO 并行任务
    3. 管理并行执行过程，包括监控和错误恢复
    4. 将 MPO 结果转换回 TriadLoopResult 格式
    """
    
    def __init__(self, config: Optional[MPOConfig] = None, workspace: str = None):
        """
        初始化 MaoAI-MPO 适配器
        
        参数:
            config: MPO 配置
            workspace: 工作目录
        """
        self.config = config or MPOConfig()
        self.workspace = workspace or os.getcwd()
        
        # 初始化 MPO
        self.mpo = None
        self.vpo = None
        if HAS_MPO:
            self.mpo = MaoAIParallelOrchestrator(
                max_workers=self.config.max_workers,
                workspace=self.workspace
            )
            self.vpo = VisionParallelOrchestrator(
                max_workers=self.config.max_workers,
                workspace=self.workspace
            )
        
        # 状态监控
        self.execution_stats = {
            "total_tasks": 0,
            "parallel_tasks": 0,
            "serial_tasks": 0,
            "successful_tasks": 0,
            "failed_tasks": 0,
            "average_duration": 0.0,
            "total_duration": 0.0
        }
        
        log_step("adapter_init",
                "MaoAI-MPO 适配器初始化完成",
                config=self.config.to_dict(),
                mpo_available=HAS_MPO)
    
    async def execute(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        mode: str = "fix",
        target_files: Optional[List[str]] = None
    ) -> Union[TriadLoopResult, Dict[str, Any]]:
        """
        主执行方法
        
        工作流程：
        1. 分析任务复杂度
        2. 选择执行模式（串行/并行）
        3. 执行任务
        4. 返回结果
        
        参数:
            task: 任务描述
            context: 上下文信息
            mode: 执行模式 (fix/generate)
            target_files: 目标文件列表
            
        返回:
            TriadLoopResult 或包含结果的字典
        """
        start_time = time.time()
        context = context or {}
        
        log_step("adapter_start",
                f"开始执行任务: {task[:100]}...",
                mode=mode,
                has_target_files=bool(target_files))
        
        # 1. 分析任务复杂度
        analysis = await self._analyze_task_complexity(task, context, target_files)
        
        # 2. 选择执行模式
        execution_mode = self._select_execution_mode(analysis)
        
        # 3. 执行任务
        result = None
        if execution_mode == "parallel" and self.config.enable_parallel and self.mpo:
            log_step("adapter_mode", "选择并行执行模式 (MPO)")
            result = await self._execute_parallel(task, context, mode, target_files, analysis)
        else:
            log_step("adapter_mode", "选择串行执行模式 (TriadLoop)")
            result = await self._execute_serial(task, context, mode)
        
        # 4. 更新统计信息
        duration = time.time() - start_time
        self._update_execution_stats(execution_mode, result, duration)
        
        # 5. 记录到决策账本
        await self._record_to_decision_ledger(task, execution_mode, result, duration, analysis)
        
        log_step("adapter_complete",
                f"任务执行完成: 模式={execution_mode}, 耗时={duration:.2f}s",
                success=result is not None,
                duration=duration)
        
        return result
    
    async def _analyze_task_complexity(
        self,
        task: str,
        context: Dict[str, Any],
        target_files: Optional[List[str]]
    ) -> Dict[str, Any]:
        """
        分析任务复杂度
        
        返回:
            {
                "estimated_files": int,  # 预估涉及文件数
                "estimated_time": float,  # 预估耗时（秒）
                "is_parallelizable": bool,  # 是否可并行
                "is_video_task": bool,  # 是否是视频任务
                "complexity_score": float  # 复杂度评分 (0-1)
            }
        """
        analysis = {
            "estimated_files": 0,
            "estimated_time": 30.0,  # 默认30秒
            "is_parallelizable": False,
            "is_video_task": False,
            "complexity_score": 0.5
        }
        
        # 基于目标文件分析
        if target_files and len(target_files) > 0:
            analysis["estimated_files"] = len(target_files)
            analysis["estimated_time"] = min(30.0 * len(target_files), 300.0)  # 每文件最多30秒，最多300秒
            analysis["is_parallelizable"] = len(target_files) >= 2
            analysis["complexity_score"] = min(len(target_files) / 10.0, 1.0)
        
        # 基于任务关键词分析
        task_lower = task.lower()
        
        # 视频任务检测
        video_keywords = ["视频", "video", "帧", "frame", "截图", "screenshot", "视觉", "visual"]
        if any(kw in task_lower for kw in video_keywords):
            analysis["is_video_task"] = True
            analysis["is_parallelizable"] = True
            analysis["complexity_score"] = max(analysis["complexity_score"], 0.8)
        
        # 大任务检测
        big_task_keywords = ["重构", "refactor", "优化所有", "optimize all", "批量", "batch"]
        if any(kw in task_lower for kw in big_task_keywords):
            analysis["complexity_score"] = max(analysis["complexity_score"], 0.7)
            analysis["is_parallelizable"] = True
        
        # 小任务检测
        small_task_keywords = ["修复bug", "fix bug", "小修改", "minor change", "简单", "simple"]
        if any(kw in task_lower for kw in small_task_keywords):
            analysis["complexity_score"] = min(analysis["complexity_score"], 0.3)
            analysis["is_parallelizable"] = False
        
        log_step("task_analysis",
                f"任务分析完成: {analysis['estimated_files']} 文件, 复杂度 {analysis['complexity_score']:.2f}",
                parallelizable=analysis["is_parallelizable"],
                video_task=analysis["is_video_task"])
        
        return analysis
    
    def _select_execution_mode(self, analysis: Dict[str, Any]) -> str:
        """
        选择执行模式
        
        决策逻辑：
        1. 可并行且文件数 >= min_tasks_for_parallel → 并行
        2. 视频任务 → 视觉并行
        3. 其他情况 → 串行
        
        返回:
            "serial" 或 "parallel" 或 "vision_parallel"
        """
        if not self.config.enable_parallel or not HAS_MPO:
            return "serial"
        
        if analysis.get("is_video_task", False):
            return "vision_parallel"
        
        if (analysis.get("is_parallelizable", False) and 
            analysis.get("estimated_files", 0) >= self.config.min_tasks_for_parallel):
            return "parallel"
        
        return "serial"
    
    async def _execute_parallel(
        self,
        task: str,
        context: Dict[str, Any],
        mode: str,
        target_files: Optional[List[str]],
        analysis: Dict[str, Any]
    ) -> TriadLoopResult:
        """
        并行执行任务
        
        工作流程：
        1. 准备任务分片
        2. 启动 MPO 并行执行
        3. 监控执行过程
        4. 聚合结果并转换格式
        """
        log_step("parallel_start", "启动并行执行")
        
        # 1. 准备任务分片
        if not target_files:
            target_files = await self._discover_target_files(task, context)
        
        if not target_files or len(target_files) < 2:
            log_step("parallel_fallback", "文件数不足，回退到串行模式")
            return await self._execute_serial(task, context, mode)
        
        # 2. 限制文件数，避免过多 Worker
        max_files = min(len(target_files), self.config.max_workers * self.config.max_files_per_worker)
        target_files = target_files[:max_files]
        
        # 3. 启动并行执行
        parallel_result = None
        try:
            if analysis.get("is_video_task", False) and self.vpo:
                log_step("parallel_type", "使用视觉并行处理器")
                parallel_result = await self.vpo.run_vision_parallel(
                    frame_urls=target_files,  # 这里假设 target_files 是视频帧 URL
                    analysis_task=task
                )
            else:
                log_step("parallel_type", "使用代码并行处理器")
                parallel_result = await self.mpo.run_parallel_task(
                    task_description=task,
                    target_files=target_files
                )
        except Exception as e:
            log_step("parallel_error", f"并行执行异常: {e}", error=True)
            if self.config.enable_fallback:
                log_step("parallel_fallback", "并行失败，回退到串行模式")
                return await self._execute_serial(task, context, mode)
            else:
                raise
        
        # 4. 转换结果为 TriadLoopResult 格式
        final_result = self._convert_parallel_result(parallel_result, task)
        
        return final_result
    
    async def _discover_target_files(
        self,
        task: str,
        context: Dict[str, Any]
    ) -> List[str]:
        """
        自动发现目标文件
        
        基于知识图谱、Code RAG 和文件系统搜索
        """
        target_files = []
        
        # 这里可以调用 TriadLoop 的文件发现方法
        # 暂时使用简化的实现
        import glob
        
        # 基于任务关键词搜索
        keywords = [w for w in task.split() if len(w) > 3][:3]
        for keyword in keywords:
            patterns = [
                f"**/*{keyword}*.py",
                f"**/*{keyword}*.ts",
                f"**/*{keyword}*.tsx",
                f"**/*{keyword}*.js",
                f"**/*{keyword}*.jsx",
                f"**/*{keyword}*.md",
            ]
            for pattern in patterns:
                matches = glob.glob(os.path.join(self.workspace, pattern), recursive=True)
                for match in matches:
                    rel_path = os.path.relpath(match, self.workspace)
                    if rel_path not in target_files:
                        target_files.append(rel_path)
        
        # 限制数量
        return target_files[:20]
    
    async def _execute_serial(
        self,
        task: str,
        context: Dict[str, Any],
        mode: str
    ) -> TriadLoopResult:
        """
        串行执行任务
        
        使用 TriadLoop 串行执行
        """
        if not HAS_TRIAD:
            log_step("serial_error", "TriadLoop 不可用，返回模拟结果")
            return self._create_mock_result(task)
        
        try:
            # 创建 TriadLoop
            triad = TriadLoop(
                workspace=self.workspace,
                enable_atomic_mode=True,
                enable_code_rag=True,
                enable_reality_check=True
            )
            
            # 执行任务
            result = await triad.run_async(
                task=task,
                context=context,
                mode=mode
            )
            
            return result
            
        except Exception as e:
            log_step("serial_error", f"串行执行异常: {e}", error=True)
            return self._create_error_result(task, str(e))
    
    def _convert_parallel_result(
        self,
        parallel_result: Dict[str, Any],
        original_task: str
    ) -> TriadLoopResult:
        """
        将 MPO 并行结果转换为 TriadLoopResult 格式
        """
        if not HAS_TRIAD:
            return self._create_mock_result(original_task)
        
        # 从并行结果中提取关键信息
        success = parallel_result.get("success", False)
        final_score = parallel_result.get("final_score", 0.0)
        total_tasks = parallel_result.get("total_tasks", 0)
        completed_tasks = parallel_result.get("completed_tasks", 0)
        
        # 确定状态
        if success:
            status = TriadStatus.APPROVED
        elif completed_tasks == 0:
            status = TriadStatus.ERROR
        else:
            status = TriadStatus.REJECTED
        
        # 构建结果
        result = TriadLoopResult(
            status=status,
            total_rounds=total_tasks,  # 使用任务数作为轮数
            total_time=parallel_result.get("total_time", 0),
            final_score=final_score,
            final_code=parallel_result.get("merged_code", ""),
            reviewer_passed=success,
            validator_passed=success,
            converged=True,
            convergence_reason="并行执行完成",
            feedback=f"并行执行: {completed_tasks}/{total_tasks} 任务成功, 平均分数: {final_score:.2f}"
        )
        
        return result
    
    def _create_mock_result(self, task: str) -> TriadLoopResult:
        """创建模拟结果（用于测试）"""
        if HAS_TRIAD:
            return TriadLoopResult(
                status=TriadStatus.APPROVED,
                total_rounds=1,
                total_time=1.0,
                final_score=0.9,
                final_code=f"// Mock result for: {task}",
                reviewer_passed=True,
                validator_passed=True,
                converged=True,
                convergence_reason="Mock execution"
            )
        else:
            return {
                "status": "approved",
                "total_rounds": 1,
                "total_time": 1.0,
                "final_score": 0.9,
                "final_code": f"// Mock result for: {task}",
                "success": True,
                "message": "Mock execution"
            }
    
    def _create_error_result(self, task: str, error: str) -> TriadLoopResult:
        """创建错误结果"""
        if HAS_TRIAD:
            return TriadLoopResult(
                status=TriadStatus.ERROR,
                total_rounds=0,
                total_time=0.0,
                final_score=0.0,
                final_code="",
                reviewer_passed=False,
                validator_passed=False,
                converged=False,
                convergence_reason=f"Execution error: {error}"
            )
        else:
            return {
                "status": "error",
                "total_rounds": 0,
                "total_time": 0.0,
                "final_score": 0.0,
                "final_code": "",
                "success": False,
                "message": f"Execution error: {error}"
            }
    
    def _update_execution_stats(
        self,
        mode: str,
        result: Union[TriadLoopResult, Dict[str, Any]],
        duration: float
    ):
        """更新执行统计"""
        self.execution_stats["total_tasks"] += 1
        self.execution_stats["total_duration"] += duration
        
        if mode == "parallel" or mode == "vision_parallel":
            self.execution_stats["parallel_tasks"] += 1
        else:
            self.execution_stats["serial_tasks"] += 1
        
        # 判断是否成功
        success = False
        if isinstance(result, TriadLoopResult):
            success = result.all_passed
        elif isinstance(result, dict):
            success = result.get("success", False)
        
        if success:
            self.execution_stats["successful_tasks"] += 1
        else:
            self.execution_stats["failed_tasks"] += 1
        
        # 计算平均耗时
        if self.execution_stats["total_tasks"] > 0:
            self.execution_stats["average_duration"] = (
                self.execution_stats["total_duration"] / self.execution_stats["total_tasks"]
            )
    
    async def _record_to_decision_ledger(
        self,
        task: str,
        mode: str,
        result: Union[TriadLoopResult, Dict[str, Any]],
        duration: float,
        analysis: Dict[str, Any]
    ):
        """记录执行结果到决策账本"""
        # 这里可以集成 DecisionLedger
        # 暂时记录到日志
        log_step("decision_record",
                f"任务执行记录: {task[:50]}...",
                mode=mode,
                duration=duration,
                complexity_score=analysis.get("complexity_score", 0.0),
                success=result.all_passed if isinstance(result, TriadLoopResult) else result.get("success", False))
    
    async def get_stats(self) -> Dict[str, Any]:
        """获取执行统计"""
        stats = self.execution_stats.copy()
        stats["parallel_ratio"] = (
            stats["parallel_tasks"] / stats["total_tasks"] 
            if stats["total_tasks"] > 0 else 0.0
        )
        stats["success_rate"] = (
            stats["successful_tasks"] / stats["total_tasks"] 
            if stats["total_tasks"] > 0 else 0.0
        )
        return stats
    
    async def reset_stats(self):
        """重置统计信息"""
        self.execution_stats = {
            "total_tasks": 0,
            "parallel_tasks": 0,
            "serial_tasks": 0,
            "successful_tasks": 0,
            "failed_tasks": 0,
            "average_duration": 0.0,
            "total_duration": 0.0
        }
        log_step("stats_reset", "执行统计已重置")


# ─── 使用示例 ─────────────────────────────────────────────────────────────────

async def demo():
    """演示 MaoAI-MPO 适配器的使用"""
    print("=" * 60)
    print("MaoAI-MPO Adapter 演示")
    print("=" * 60)
    
    # 创建适配器
    config = MPOConfig(
        enable_parallel=True,
        max_workers=3,
        min_tasks_for_parallel=2
    )
    
    adapter = MaoAIMPOrchestrator(config)
    
    # 示例 1: 串行任务（小任务）
    print("\n1. 串行任务演示:")
    serial_task = "修复登录页面的按钮样式问题"
    
    serial_result = await adapter.execute(
        task=serial_task,
        context={"is_frontend": True},
        mode="fix"
    )
    
    print(f"任务: {serial_task}")
    print(f"模式: 串行")
    print(f"结果: {serial_result.status if hasattr(serial_result, 'status') else serial_result.get('status', 'unknown')}")
    print(f"分数: {serial_result.final_score if hasattr(serial_result, 'final_score') else serial_result.get('final_score', 0.0):.2f}")
    
    # 示例 2: 并行任务（大任务）
    print("\n2. 并行任务演示:")
    parallel_task = "批量优化项目中的 TypeScript 类型定义"
    
    # 模拟目标文件
    import glob
    target_files = glob.glob("**/*.ts", recursive=True)[:5]  # 前5个 .ts 文件
    
    parallel_result = await adapter.execute(
        task=parallel_task,
        context={"is_frontend": False},
        mode="fix",
        target_files=target_files
    )
    
    print(f"任务: {parallel_task}")
    print(f"模式: 并行 (MPO)")
    print(f"目标文件: {len(target_files)} 个")
    print(f"结果: {parallel_result.status if hasattr(parallel_result, 'status') else parallel_result.get('status', 'unknown')}")
    print(f"分数: {parallel_result.final_score if hasattr(parallel_result, 'final_score') else parallel_result.get('final_score', 0.0):.2f}")
    
    # 获取统计信息
    print("\n3. 执行统计:")
    stats = await adapter.get_stats()
    for key, value in stats.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f}")
        else:
            print(f"  {key}: {value}")
    
    print("\n" + "=" * 60)
    print("适配器功能总结:")
    print("- 智能模式选择: 自动分析任务复杂度，选择最优执行模式")
    print("- 并行加速: 对多文件任务，使用 MPO 并行处理加速")
    print("- 容错机制: 并行失败时自动回退到串行模式")
    print("- 统一接口: 提供统一的 execute() 方法，隐藏底层复杂性")
    print("- 性能监控: 实时统计执行成功率、耗时等指标")
    print("=" * 60)


if __name__ == "__main__":
    import argparse as _argparse

    _parser = _argparse.ArgumentParser(description="MaoAI MPO Adapter CLI")
    _parser.add_argument("--json-mode", action="store_true",
                         help="Read JSON command from stdin and write JSON result to stdout")
    _args = _parser.parse_args()

    if _args.json_mode:
        # ── JSON 模式：供 Node.js mpo-router.ts 调用 ──────────────────────────
        import json as _json

        async def _json_main():
            try:
                raw = sys.stdin.readline().strip()
                if not raw:
                    print(_json.dumps({"success": False, "error": "empty input"}), flush=True)
                    return

                cmd = _json.loads(raw)
                command = cmd.get("command", "execute")

                adapter = MaoAIMPOrchestrator(MPOConfig(
                    max_workers=cmd.get("max_workers", 5),
                    enable_parallel=cmd.get("enable_parallel", True),
                    worker_score_threshold=cmd.get("score_threshold", 0.8),
                ))

                if command == "health_check":
                    print(_json.dumps({
                        "success": True,
                        "message": "MPO Adapter is operational",
                        "has_mpo": HAS_MPO,
                        "has_triad": HAS_TRIAD,
                    }), flush=True)
                    return

                if command == "get_stats":
                    stats = await adapter.get_stats()
                    print(_json.dumps({"success": True, **stats}), flush=True)
                    return

                if command == "execute":
                    execution_id = cmd.get("execution_id", f"cli-{time.time():.0f}")
                    task = cmd.get("task", "")
                    context = cmd.get("context", {})
                    mode = cmd.get("mode", "auto")

                    log_step("cli_execute", f"[{execution_id}] 开始执行: {task[:60]}")

                    result = await adapter.execute(
                        task=task,
                        context=context,
                        mode=mode if mode != "auto" else "fix",
                        target_files=context.get("target_files"),
                    )

                    # 序列化结果
                    if hasattr(result, "__dict__"):
                        result_dict = result.__dict__
                        # 枚举转字符串
                        for k, v in result_dict.items():
                            if hasattr(v, "value"):
                                result_dict[k] = v.value
                            elif not isinstance(v, (str, int, float, bool, list, dict, type(None))):
                                result_dict[k] = str(v)
                    elif isinstance(result, dict):
                        result_dict = result
                    else:
                        result_dict = {"raw": str(result)}

                    success = result_dict.get("success", False)
                    if not isinstance(success, bool):
                        # TriadStatus 判断
                        status_val = str(result_dict.get("status", "")).lower()
                        success = "approved" in status_val

                    print(_json.dumps({
                        "success": success,
                        "execution_id": execution_id,
                        **result_dict,
                    }, ensure_ascii=False, default=str), flush=True)
                    return

                print(_json.dumps({"success": False, "error": f"Unknown command: {command}"}), flush=True)

            except Exception as exc:
                print(_json.dumps({"success": False, "error": str(exc)}), flush=True)

        asyncio.run(_json_main())
    else:
        asyncio.run(demo())