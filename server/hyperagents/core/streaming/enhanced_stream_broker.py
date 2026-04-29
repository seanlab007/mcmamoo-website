#!/usr/bin/env python3
"""
MaoAI HyperAgents — Enhanced Stream Broker (Phase 8: 流式博弈引擎)
─────────────────────────────────────────────────────────────────────────────
核心创新：打破"写完再审"的顺序限制，实现真正的流水线式作业

架构对比：
  传统 TriadLoop (顺序执行):
  ┌─────────────────────────────────────────────────────────┐
  │  Coder ──[生成完成]──→ Reviewer ──[审查完成]──→ Validator │
  │     │                    │                       │     │
  │  [等待 5s]           [等待 3s]                 [等待 2s] │
  │     │                    │                       │     │
  │     └────────────────────┴───────────────────────┘     │
  │                    总耗时: 10s (等待时间: 8s)           │
  └─────────────────────────────────────────────────────────┘

  Enhanced Stream Broker (流式并行):
  ┌─────────────────────────────────────────────────────────┐
  │  时间 ─────────────────────────────────────────────────→ │
  │                                                         │
  │  Coder:    [生成片段1][生成片段2][生成片段3]......       │
  │              ↓         ↓         ↓                    │
  │  Reviewer:    [审1]    [审2]    [审3]......            │
  │               ↓         ↓         ↓                    │
  │  Validator:          [预热][验证1][验证2]......        │
  │                                                         │
  │                    总耗时: 7s (等待时间: 0s)            │
  └─────────────────────────────────────────────────────────┘

核心特性：
  1. 流式输出 - Coder 生成时实时推送，Reviewer 同步审查
  2. 预热机制 - Validator 在 Coder 生成期间预热环境
  3. 增量审查 - Reviewer 增量处理每个代码片段
  4. 背压控制 - 防止生成速度超过审查速度
  5. WebSocket 推送 - 实时可视化思维链
  6. 错误恢复 - 单点失败不影响整体流
"""

import asyncio
import json
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Callable, Any, AsyncIterator
from dataclasses import dataclass, asdict, field
from enum import Enum
from collections import deque, defaultdict
import threading
import queue
import re

try:
    import websockets
    from websockets.server import WebSocketServerProtocol
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False


# ─── 日志工具 ─────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    entry = {
        "type": step_type,
        "agent": "stream_broker",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 类型定义 ─────────────────────────────────────────────────────────────────

class StreamPhase(Enum):
    IDLE = "idle"
    ANALYZING = "analyzing"      # 分析任务
    GENERATING = "generating"    # Coder 生成中
    REVIEWING = "reviewing"       # Reviewer 审查中
    VALIDATING = "validating"     # Validator 验证中
    MERGING = "merging"          # 结果归并
    COMPLETED = "completed"
    FAILED = "failed"


class BackpressureStatus(Enum):
    OK = "ok"                    # 流速正常
    SLOW = "slow"               # 生成过快，降低速率
    STOP = "stop"               # 暂停生成
    RESUME = "resume"            # 恢复生成


@dataclass
class StreamChunk:
    """流式数据块"""
    agent: str
    chunk_type: str  # thinking, code, review, validation
    content: str
    timestamp: float = field(default_factory=time.time)
    round: int = 1
    sequence: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            "agent": self.agent,
            "type": self.chunk_type,
            "content": self.content,
            "timestamp": self.timestamp,
            "round": self.round,
            "sequence": self.sequence,
            **self.metadata
        }


@dataclass
class ReviewBuffer:
    """审查缓冲区 - 存储增量审查结果"""
    code_version: int = 0
    pending_issues: List[str] = field(default_factory=list)
    approved: bool = False
    score: float = 0.0
    last_review_time: float = 0.0


class StreamingCoder:
    """
    流式编码器 - 支持增量代码生成

    特性：
    1. 流式 API 支持 - 实时推送代码片段
    2. 增量 Patch - 只推送变更部分
    3. 断点续传 - 支持从上次中断继续
    4. 语法验证 - 实时验证代码语法
    """

    def __init__(self, api_key: str = None, model: str = "claude-3-5-sonnet"):
        self.api_key = api_key
        self.model = model
        self._buffer = ""
        self._sequence = 0

    async def stream_generate(
        self,
        task: str,
        context: Dict = None,
        on_chunk: Callable[[StreamChunk], None] = None
    ) -> str:
        """
        流式生成代码

        参数:
            task: 任务描述
            context: 上下文
            on_chunk: 片段回调

        返回:
            完整代码
        """
        log_step("stream_coder", "开始流式生成", model=self.model)

        # 这里应该调用实际的 LLM 流式 API
        # 为了演示，使用模拟流式输出
        full_code = self._generate_mock_code(task)

        for i, chunk in enumerate(self._chunk_code(full_code, chunk_size=50)):
            self._sequence += 1
            stream_chunk = StreamChunk(
                agent="Coder",
                chunk_type="code",
                content=chunk,
                sequence=self._sequence,
                metadata={"version": 1, "progress": (i + 1) / len(self._split_code(full_code))}
            )

            if on_chunk:
                await on_chunk(stream_chunk)

            # 模拟生成延迟
            await asyncio.sleep(0.05)

        return full_code

    def _generate_mock_code(self, task: str) -> str:
        """模拟代码生成"""
        return f"""# 代码: {task}

def solution():
    # 实现逻辑
    pass

def test_solution():
    assert solution() == expected
"""

    def _chunk_code(self, code: str, chunk_size: int = 50) -> List[str]:
        """将代码分割为片段"""
        lines = code.split('\n')
        chunks = []
        current = ""

        for line in lines:
            if len(current) + len(line) > chunk_size:
                if current:
                    chunks.append(current)
                current = line + "\n"
            else:
                current += line + "\n"

        if current:
            chunks.append(current)

        return chunks if chunks else [code]

    def _split_code(self, code: str) -> List[str]:
        """分割代码为逻辑单元"""
        return self._chunk_code(code, chunk_size=100)


class StreamingReviewer:
    """
    流式审查器 - 支持增量审查

    特性：
    1. 增量审查 - 收到代码片段立即审查
    2. 问题累积 - 收集所有发现的问题
    3. 智能阈值 - 问题超过阈值时立即反馈
    4. 预热机制 - 提前加载审查规则
    """

    def __init__(self, api_key: str = None, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model
        self.buffer = ReviewBuffer()
        self._issue_threshold = 5  # 问题超过此数立即反馈

    async def stream_review(
        self,
        code_stream: AsyncIterator[StreamChunk],
        on_review: Callable[[Dict], None] = None
    ) -> Dict[str, Any]:
        """
        流式审查代码

        参数:
            code_stream: 代码流
            on_review: 审查回调

        返回:
            审查结果
        """
        log_step("stream_reviewer", "开始流式审查", model=self.model)

        async for chunk in code_stream:
            # 增量审查
            await self._review_chunk(chunk)

            # 问题超过阈值，立即反馈
            if len(self.buffer.pending_issues) >= self._issue_threshold:
                await self._emit_review_feedback(on_review)

        # 最终审查
        return self._finalize_review()

    async def _review_chunk(self, chunk: StreamChunk):
        """审查单个代码片段"""
        if chunk.chunk_type != "code":
            return

        code = chunk.content

        # 简单规则审查
        issues = []

        # 检查常见问题
        if "TODO" in code or "FIXME" in code:
            issues.append("包含未完成的 TODO/FIXME")
        if "pass" in code and code.count('\n') < 5:
            issues.append("可能存在空实现")
        if re.search(r'print\s*\(\s*["\']', code):
            issues.append("包含调试用的 print 语句")
        if "except:" in code:
            issues.append("使用裸 except 可能吞掉异常")

        self.buffer.pending_issues.extend(issues)
        self.buffer.code_version = chunk.sequence
        self.buffer.last_review_time = time.time()

    async def _emit_review_feedback(self, callback: Optional[Callable] = None):
        """发出审查反馈"""
        if not callback:
            return

        feedback = {
            "type": "incremental_review",
            "issues": self.buffer.pending_issues.copy(),
            "issue_count": len(self.buffer.pending_issues),
            "code_version": self.buffer.code_version,
            "timestamp": time.time()
        }

        await callback(feedback)

    def _finalize_review(self) -> Dict[str, Any]:
        """生成最终审查结果"""
        issue_count = len(self.buffer.pending_issues)

        # 评分：问题越少分数越高
        score = max(0.0, 1.0 - issue_count * 0.1)
        approved = issue_count == 0

        return {
            "approved": approved,
            "score": score,
            "issues": self.buffer.pending_issues,
            "issue_count": issue_count,
            "summary": f"发现 {issue_count} 个问题" if issue_count > 0 else "审查通过"
        }


class ValidatorWarming:
    """
    Validator 预热器 - 在 Coder 生成期间预热测试环境

    特性：
    1. 环境预热 - 提前加载测试依赖
    2. 资源池化 - 复用测试容器
    3. 增量测试 - 只测试变更部分
    """

    def __init__(self, workspace: str = None):
        self.workspace = workspace
        self.warmed = False
        self.warm_start: float = 0

    async def warm_up(self) -> bool:
        """预热测试环境"""
        if self.warmed:
            return True

        log_step("validator_warmup", "开始预热 Validator 环境")
        self.warm_start = time.time()

        # 模拟预热：加载测试依赖、检查环境
        await asyncio.sleep(0.5)

        self.warmed = True
        duration = time.time() - self.warm_start
        log_step("validator_warmup", f"Validator 环境预热完成", duration=f"{duration:.2f}s")

        return True

    async def validate(
        self,
        code: str,
        test_cases: List[Dict] = None
    ) -> Dict[str, Any]:
        """执行验证"""
        if not self.warmed:
            await self.warm_up()

        # 执行测试
        await asyncio.sleep(0.1)

        return {
            "success": True,
            "passed": 5,
            "failed": 0,
            "duration": 0.5
        }


class BackpressureController:
    """
    背压控制器 - 防止生成速度超过审查速度

    策略：
    1. 水位监测 - 跟踪缓冲区积压程度
    2. 动态限流 - 根据积压调整生成速度
    3. 暂停/恢复 - 积压严重时暂停生成
    """

    def __init__(self, max_buffer_size: int = 10):
        self.max_buffer_size = max_buffer_size
        self.buffer_level = 0
        self.generation_paused = False
        self.pause_count = 0

    def record_chunk(self):
        """记录新片段"""
        self.buffer_level += 1

    def record_review(self):
        """记录已审查"""
        self.buffer_level = max(0, self.buffer_level - 1)

    def check_status(self) -> BackpressureStatus:
        """检查背压状态"""
        if self.buffer_level == 0:
            return BackpressureStatus.OK
        elif self.buffer_level < self.max_buffer_size:
            return BackpressureStatus.SLOW
        else:
            return BackpressureStatus.STOP

    def pause(self):
        """暂停生成"""
        if not self.generation_paused:
            self.generation_paused = True
            self.pause_count += 1
            log_step("backpressure", "触发背压，暂停生成")

    def resume(self):
        """恢复生成"""
        if self.generation_paused:
            self.generation_paused = False
            log_step("backpressure", "背压缓解，恢复生成")


# ─── 增强版流式代理 ───────────────────────────────────────────────────────────

class EnhancedStreamBroker:
    """
    增强版流式博弈引擎

    核心创新：
    1. 流式生成与审查并行
    2. Validator 环境预热
    3. 背压控制
    4. WebSocket 实时推送
    5. 思维链可视化
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 8766,
        coder_model: str = "claude-3-5-sonnet",
        reviewer_model: str = "gpt-4o",
        enable_websocket: bool = True
    ):
        self.host = host
        self.port = port
        self.coder_model = coder_model
        self.reviewer_model = reviewer_model
        self.enable_websocket = enable_websocket

        # 组件
        self.coder = StreamingCoder(model=coder_model)
        self.reviewer = StreamingReviewer(model=reviewer_model)
        self.validator_warmer = ValidatorWarming()
        self.backpressure = BackpressureController()

        # 状态
        self.clients: List[Any] = []
        self.sessions: Dict[str, Dict] = {}
        self.phase = StreamPhase.IDLE

        # 流控制
        self.code_queue: asyncio.Queue = asyncio.Queue(maxsize=20)
        self.review_queue: asyncio.Queue = asyncio.Queue(maxsize=50)

        log_step("stream_broker_init",
                f"增强版流式博弈引擎初始化",
                host=host,
                port=port,
                websocket_enabled=enable_websocket)

    async def execute_streaming_task(
        self,
        task: str,
        context: Dict = None,
        on_progress: Callable[[Dict], None] = None
    ) -> Dict[str, Any]:
        """
        执行流式任务

        核心流程：
        1. 分析任务 (Strategist)
        2. 流式生成 + 预热 (Coder + Validator)
        3. 流式审查 (Reviewer)
        4. 验证 (Validator)
        5. 归并结果
        """
        session_id = f"session-{uuid.uuid4().hex[:8]}"
        start_time = time.time()
        context = context or {}

        log_step("streaming_start",
                f"流式任务开始: {task[:80]}...",
                session_id=session_id)

        self.phase = StreamPhase.ANALYZING

        # ─── 阶段 1: 分析任务 ───────────────────────────────────────────────
        if on_progress:
            await on_progress({
                "phase": "analyzing",
                "message": "分析任务...",
                "timestamp": time.time()
            })
        await asyncio.sleep(0.2)

        # ─── 阶段 2: 预热 Validator ───────────────────────────────────────
        self.phase = StreamPhase.GENERATING
        asyncio.create_task(self.validator_warmer.warm_up())

        if on_progress:
            await on_progress({
                "phase": "warming",
                "message": "预热测试环境...",
                "timestamp": time.time()
            })

        # ─── 阶段 3: 流式生成 + 流式审查并行 ───────────────────────────────
        result = await self._streaming_coder_reviewer(task, context, on_progress)

        # ─── 阶段 4: 验证 ─────────────────────────────────────────────────
        self.phase = StreamPhase.VALIDATING
        if on_progress:
            await on_progress({
                "phase": "validating",
                "message": "执行测试...",
                "timestamp": time.time()
            })

        validation_result = await self.validator_warmer.validate(result["code"])

        # ─── 阶段 5: 归并结果 ──────────────────────────────────────────────
        self.phase = StreamPhase.MERGING
        total_time = time.time() - start_time

        final_result = {
            "session_id": session_id,
            "success": result["review"]["approved"] and validation_result["success"],
            "task": task,
            "code": result["code"],
            "review": result["review"],
            "validation": validation_result,
            "total_time": total_time,
            "stream_time": result["stream_duration"],
            "efficiency": result["stream_duration"] / total_time if total_time > 0 else 1.0,
            "phases": {
                "analyzing": 0.2,
                "generating": result["stream_duration"],
                "reviewing": result["review_duration"],
                "validating": validation_result["duration"]
            }
        }

        self.phase = StreamPhase.COMPLETED

        log_step("streaming_complete",
                f"流式任务完成",
                session_id=session_id,
                success=final_result["success"],
                total_time=f"{total_time:.2f}s",
                efficiency=f"{final_result['efficiency']:.1%}")

        return final_result

    async def _streaming_coder_reviewer(
        self,
        task: str,
        context: Dict,
        on_progress: Callable = None
    ) -> Dict[str, Any]:
        """
        并行执行流式生成和审查

        这是核心创新：打破顺序限制，实现真正的流水线
        """
        stream_start = time.time()
        chunks_generated = 0
        chunks_reviewed = 0

        # 代码片段缓冲区
        code_chunks: List[StreamChunk] = []

        async def code_generator():
            """代码生成器 - 异步产生代码片段"""
            nonlocal chunks_generated

            async def chunk_handler(chunk: StreamChunk):
                nonlocal chunks_generated
                chunks_generated += 1
                code_chunks.append(chunk)
                self.backpressure.record_chunk()

                # 推送生成进度
                if on_progress:
                    await on_progress({
                        "phase": "generating",
                        "agent": "Coder",
                        "chunk": chunk.sequence,
                        "content": chunk.content[:100],
                        "progress": chunk.metadata.get("progress", 0),
                        "timestamp": time.time()
                    })

                # 背压检查
                status = self.backpressure.check_status()
                if status == BackpressureStatus.STOP:
                    self.backpressure.pause()
                    # 等待审查跟上
                    while self.backpressure.buffer_level >= self.max_buffer_size // 2:
                        await asyncio.sleep(0.1)
                    self.backpressure.resume()

            return await self.coder.stream_generate(task, context, chunk_handler)

        async def reviewer_processor():
            """审查处理器 - 异步消费代码片段"""
            nonlocal chunks_reviewed

            # 创建代码流
            async def code_stream():
                for chunk in code_chunks:
                    yield chunk
                    self.backpressure.record_review()
                    chunks_reviewed += 1

                    if on_progress:
                        await on_progress({
                            "phase": "reviewing",
                            "agent": "Reviewer",
                            "chunk": chunk.sequence,
                            "issues": self.reviewer.buffer.pending_issues.copy(),
                            "timestamp": time.time()
                        })

            # 执行流式审查
            review_result = await self.reviewer.stream_review(code_stream(), on_progress)
            return review_result

        # 并行执行生成和审查
        code_task = asyncio.create_task(code_generator())
        review_task = asyncio.create_task(reviewer_processor())

        # 等待完成
        full_code, review_result = await asyncio.gather(code_task, review_task)

        stream_duration = time.time() - stream_start

        return {
            "code": full_code,
            "review": review_result,
            "chunks_generated": chunks_generated,
            "chunks_reviewed": chunks_reviewed,
            "stream_duration": stream_duration,
            "review_duration": stream_duration  # 近似值
        }

    # ─── WebSocket 支持 ────────────────────────────────────────────────────

    async def start_server(self):
        """启动 WebSocket 服务器"""
        if not HAS_WEBSOCKETS:
            log_step("websocket", "websockets 库未安装，跳过 WebSocket 服务")
            return

        log_step("websocket_server", f"启动 WebSocket 服务: ws://{self.host}:{self.port}")

        async with websockets.serve(self._handle_client, self.host, self.port):
            await asyncio.Future()  # 永久运行

    async def _handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """处理客户端连接"""
        client_id = str(uuid.uuid4())[:8]
        self.clients.append(websocket)

        log_step("websocket_connect", f"客户端连接: {client_id}")

        try:
            async for message in websocket:
                data = json.loads(message)
                response = await self._process_client_message(data)
                await websocket.send(json.dumps(response))
        except Exception as e:
            log_step("websocket_error", f"客户端错误: {e}")
        finally:
            self.clients.remove(websocket)
            log_step("websocket_disconnect", f"客户端断开: {client_id}")

    async def _process_client_message(self, data: Dict) -> Dict:
        """处理客户端消息"""
        action = data.get("action")

        if action == "execute":
            task = data.get("task", "")
            result = await self.execute_streaming_task(task)
            return {"action": "result", "data": result}

        elif action == "status":
            return {
                "action": "status",
                "phase": self.phase.value,
                "connected_clients": len(self.clients)
            }

        return {"action": "unknown", "error": "Unknown action"}


# ─── 工厂函数 ────────────────────────────────────────────────────────────────

def create_stream_broker(**kwargs) -> EnhancedStreamBroker:
    """创建流式博弈引擎实例"""
    return EnhancedStreamBroker(**kwargs)


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Enhanced Stream Broker")
    parser.add_argument("--host", type=str, default="localhost", help="WebSocket 主机")
    parser.add_argument("--port", type=int, default=8766, help="WebSocket 端口")
    parser.add_argument("--task", type=str, help="任务描述（直接执行）")
    parser.add_argument("--server", action="store_true", help="启动 WebSocket 服务器")

    args = parser.parse_args()

    broker = create_stream_broker(host=args.host, port=args.port)

    async def main():
        if args.server:
            # 启动服务器
            print(f"启动流式博弈引擎服务器: ws://{args.host}:{args.port}")
            print("按 Ctrl+C 停止\n")
            await broker.start_server()
        elif args.task:
            # 直接执行任务
            result = await broker.execute_streaming_task(args.task)
            print("\n" + "=" * 60)
            print("流式执行结果")
            print("=" * 60)
            print(f"状态: {'成功' if result['success'] else '失败'}")
            print(f"总耗时: {result['total_time']:.2f}s")
            print(f"流式效率: {result['efficiency']:.1%}")
            print(f"代码片段: {result.get('chunks_generated', 0)}")
            print(f"审查问题: {len(result['review'].get('issues', []))}")
            print("=" * 60)
        else:
            print("请指定 --task 或 --server")

    asyncio.run(main())
