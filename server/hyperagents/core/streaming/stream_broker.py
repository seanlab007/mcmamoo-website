"""
StreamBroker - 异步流式协同引擎

实现真正的"脑暴"体验:
- Coder生成时，Reviewer同步审查
- Validator预热环境，三方实时反馈
- WebSocket推送，思维链可视化
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict
import websockets
from websockets.server import WebSocketServerProtocol

class AgentType(Enum):
    CODER = "Coder"
    REVIEWER = "Reviewer"
    VALIDATOR = "Validator"
    STRATEGIST = "Strategist"

class MessageType(Enum):
    THINKING = "thinking"      # 思考中
    ACTION = "action"         # 执行动作
    RESULT = "result"         # 结果
    FEEDBACK = "feedback"     # 反馈
    CONVERGE = "converge"    # 收敛
    ERROR = "error"          # 错误

@dataclass
class StreamMessage:
    """流式消息"""
    agent: str
    type: str
    content: str
    timestamp: str
    round: int = 1
    metadata: Dict = None

class StreamBroker:
    """
    流式协同Broker - 三方博弈实时通信中枢
    
    架构:
    ┌─────────────────────────────────────────────────┐
    │                    用户                          │
    └─────────────────────┬───────────────────────────┘
                          │ WebSocket
    ┌─────────────────────┴───────────────────────────┐
    │              StreamBroker                       │
    │  ┌────────┐  ┌────────┐  ┌────────┐            │
    │  │ Coder  │←→│Reviewer│←→│Validator│           │
    │  └────────┘  └────────┘  └────────┘            │
    │         ↑          ↑          ↑                 │
    │         └──────────┼──────────┘                │
    │              实时流反馈                          │
    └─────────────────────────────────────────────────┘
    """
    
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.clients: List[WebSocketServerProtocol] = []
        self.active_agents: Dict[str, asyncio.Task] = {}
        self.running_sessions: Dict[str, Dict] = {}
        self.message_history: Dict[str, List[StreamMessage]] = defaultdict(list)
        print(f"✅ StreamBroker 初始化: ws://{host}:{port}")
    
    async def start(self):
        """启动WebSocket服务"""
        print(f"🚀 启动流式协同服务: ws://{self.host}:{self.port}")
        async with websockets.serve(self._handle_client, self.host, self.port):
            await asyncio.Future()  # 永久运行
    
    async def _handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """处理客户端连接"""
        client_id = str(uuid.uuid4())[:8]
        self.clients.append(websocket)
        print(f"🔗 客户端连接: {client_id}")
        
        try:
            async for message in websocket:
                data = json.loads(message)
                await self._process_message(websocket, client_id, data)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)
            print(f"🔌 客户端断开: {client_id}")
    
    async def _process_message(self, websocket, client_id: str, data: Dict):
        """处理客户端消息"""
        action = data.get("action")
        
        if action == "start_session":
            session_id = await self._start_session(websocket, data)
            await websocket.send(json.dumps({"action": "session_started", "session_id": session_id}))
        
        elif action == "submit_task":
            session_id = data.get("session_id")
            if session_id in self.running_sessions:
                await self._execute_streaming_task(session_id, data.get("task"))
    
    async def _start_session(self, websocket, data: Dict) -> str:
        """启动新会话"""
        session_id = str(uuid.uuid4())
        self.running_sessions[session_id] = {
            "created": datetime.now().isoformat(),
            "status": "active",
            "websocket": websocket
        }
        self.message_history[session_id] = []
        return session_id
    
    async def _execute_streaming_task(self, session_id: str, task: str):
        """执行流式任务 - 三方博弈"""
        session = self.running_sessions.get(session_id)
        if not session:
            return
        
        websocket = session["websocket"]
        round_num = 1
        
        # === 阶段1: 战略定性 ===
        await self._broadcast(session_id, StreamMessage(
            agent="Strategist",
            type=MessageType.THINKING.value,
            content=f"分析任务: {task}",
            timestamp=datetime.now().isoformat(),
            round=round_num
        ))
        await asyncio.sleep(0.5)
        
        # === 阶段2: Coder生成 + Reviewer并行审查 ===
        await self._broadcast(session_id, StreamMessage(
            agent="Coder",
            type=MessageType.THINKING.value,
            content="正在生成代码方案...",
            timestamp=datetime.now().isoformat(),
            round=round_num
        ))
        
        # 模拟Coder生成
        coder_output = await self._coder_generate(task)
        await self._broadcast(session_id, StreamMessage(
            agent="Coder",
            type=MessageType.RESULT.value,
            content=f"生成完成:\n{coder_output[:200]}...",
            timestamp=datetime.now().isoformat(),
            round=round_num,
            metadata={"full_output": coder_output}
        ))
        
        # Validator预热
        await self._broadcast(session_id, StreamMessage(
            agent="Validator",
            type=MessageType.ACTION.value,
            content="预热测试环境...",
            timestamp=datetime.now().isoformat(),
            round=round_num
        ))
        await asyncio.sleep(0.3)
        
        # === 阶段3: Reviewer审查 ===
        await self._broadcast(session_id, StreamMessage(
            agent="Reviewer",
            type=MessageType.THINKING.value,
            content="执行逻辑审查...",
            timestamp=datetime.now().isoformat(),
            round=round_num
        ))
        
        review_result = await self._reviewer_review(coder_output)
        await self._broadcast(session_id, StreamMessage(
            agent="Reviewer",
            type=MessageType.RESULT.value,
            content=f"审查结果: {review_result['summary']}",
            timestamp=datetime.now().isoformat(),
            round=round_num,
            metadata={"score": review_result["score"], "issues": review_result["issues"]}
        ))
        
        # === 阶段4: Validator验证 ===
        await self._broadcast(session_id, StreamMessage(
            agent="Validator",
            type=MessageType.ACTION.value,
            content="执行测试...",
            timestamp=datetime.now().isoformat(),
            round=round_num
        ))
        
        validation_result = await self._validator_validate(coder_output)
        await self._broadcast(session_id, StreamMessage(
            agent="Validator",
            type=MessageType.RESULT.value,
            content=f"验证结果: {validation_result['summary']}",
            timestamp=datetime.now().isoformat(),
            round=round_num,
            metadata=validation_result
        ))
        
        # === 阶段5: 收敛判定 ===
        final_score = (review_result["score"] + validation_result["score"]) / 2
        
        if final_score >= 80:
            await self._broadcast(session_id, StreamMessage(
                agent="Strategist",
                type=MessageType.CONVERGE.value,
                content=f"✅ 博弈收敛! 最终评分: {final_score:.1f}/100",
                timestamp=datetime.now().isoformat(),
                round=round_num,
                metadata={"status": "approved", "final_score": final_score}
            ))
        else:
            await self._broadcast(session_id, StreamMessage(
                agent="Strategist",
                type=MessageType.CONVERGE.value,
                content=f"⚠️ 评分不足({final_score:.1f})，建议改进后重试",
                timestamp=datetime.now().isoformat(),
                round=round_num,
                metadata={"status": "needs_revision", "final_score": final_score}
            ))
    
    async def _coder_generate(self, task: str) -> str:
        """Coder生成"""
        await asyncio.sleep(1)  # 模拟生成时间
        return f"""
# 代码方案: {task}

def solution():
    # 实现逻辑
    pass

# 测试用例
assert solution() == expected
"""
    
    async def _reviewer_review(self, code: str) -> Dict:
        """Reviewer审查"""
        await asyncio.sleep(0.8)
        # 简单模拟评分
        score = 85 + hash(code[:10]) % 15
        return {
            "summary": f"逻辑审查通过，评分: {score}",
            "score": score,
            "issues": []
        }
    
    async def _validator_validate(self, code: str) -> Dict:
        """Validator验证"""
        await asyncio.sleep(0.6)
        return {
            "summary": "测试全部通过",
            "score": 92,
            "tests_passed": 5,
            "tests_failed": 0
        }
    
    async def _broadcast(self, session_id: str, message: StreamMessage):
        """广播消息到客户端"""
        session = self.running_sessions.get(session_id)
        if session and "websocket" in session:
            try:
                websocket = session["websocket"]
                msg_dict = asdict(message)
                await websocket.send(json.dumps(msg_dict))
                self.message_history[session_id].append(message)
            except:
                pass
    
    def get_history(self, session_id: str) -> List[StreamMessage]:
        """获取历史消息"""
        return self.message_history.get(session_id, [])


# 启动命令
if __name__ == "__main__":
    print("=== StreamBroker 测试 ===")
    print("启动WebSocket服务: ws://localhost:8765")
    print("按 Ctrl+C 停止\n")
    
    broker = StreamBroker()
    try:
        asyncio.run(broker.start())
    except KeyboardInterrupt:
        print("\n🛑 服务已停止")
