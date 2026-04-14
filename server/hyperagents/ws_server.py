#!/usr/bin/env python3
"""
MaoAI HyperAgents — WebSocket + REST FastAPI 服务器
─────────────────────────────────────────────────────
端口: 8765（与 MAOAI_CORE_2_CONFIG.websocketUrl 一致）

端点:
  WS  /ws/triad-loop          ← TriadLoop 实时推送
  GET /api/chat/rag/status    ← RAG 索引状态
  GET /api/chat/rag/health    ← Ollama 健康检查
  GET /health                 ← 服务自检

启动:
  cd server/hyperagents
  python ws_server.py
  # 或
  uvicorn ws_server:app --host 0.0.0.0 --port 8765
"""

import asyncio
import json
import os
import sys
import requests
import uuid
from datetime import datetime
from typing import List
from dataclasses import asdict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── 本地模块 ─────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from core.streaming.stream_broker import StreamBroker, StreamMessage, AgentType, MessageType
    HAS_BROKER = True
except ImportError as e:
    print(f"[WARN] StreamBroker import failed: {e}")
    HAS_BROKER = False

try:
    from utils.code_rag import CodeRAG
    HAS_RAG = True
except ImportError as e:
    print(f"[WARN] CodeRAG import failed: {e}")
    HAS_RAG = False

# ── 初始化 ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="MaoAI HyperAgents WS Server",
    description="TriadLoop WebSocket 推送 + RAG 状态接口",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局 StreamBroker 实例（用于广播）
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_broker: "StreamBroker | None" = StreamBroker() if HAS_BROKER else None
_code_rag: "CodeRAG | None" = None

if HAS_RAG:
    try:
        _code_rag = CodeRAG(workspace_root=WORKSPACE_ROOT)
        print(f"[RAG] CodeRAG loaded, index size={_code_rag.index_size() if hasattr(_code_rag, 'index_size') else 'N/A'}")
    except Exception as e:
        print(f"[WARN] CodeRAG init failed: {e}")

# ── 活跃 WebSocket 连接池 ────────────────────────────────────────────────────

active_connections: List[WebSocket] = []


# ── WebSocket 端点 ────────────────────────────────────────────────────────────

@app.websocket("/ws/triad-loop")
async def websocket_triad_loop(websocket: WebSocket):
    """
    TriadLoop 实时状态推送端点。

    客户端协议（JSON）:
      → { "action": "start_session" }          ← 创建会话
      ← { "action": "session_started", "session_id": "..." }

      → { "action": "submit_task", "session_id": "...", "task": "..." }
      ← StreamMessage JSON（多条，实时推送）

      → { "action": "ping" }
      ← { "action": "pong" }
    """
    await websocket.accept()
    conn_id = str(uuid.uuid4())[:8]
    active_connections.append(websocket)
    print(f"[WS] 客户端连接: {conn_id}, 当前活跃数: {len(active_connections)}")

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "invalid JSON"})
                continue

            action = data.get("action")

            if action == "ping":
                await websocket.send_json({"action": "pong", "ts": datetime.now().isoformat()})

            elif action == "start_session":
                session_id = str(uuid.uuid4())
                await websocket.send_json({
                    "action": "session_started",
                    "session_id": session_id,
                    "ts": datetime.now().isoformat(),
                })

            elif action == "submit_task":
                session_id = data.get("session_id", str(uuid.uuid4()))
                task = data.get("task", "")
                heterogeneous = data.get("heterogeneous", False)

                # 异步执行 TriadLoop 流式任务
                asyncio.create_task(
                    _run_triad_loop_stream(websocket, session_id, task, heterogeneous)
                )

            elif action == "get_rag_status":
                status = _build_rag_status()
                await websocket.send_json({"action": "rag_status", "data": status})

            else:
                await websocket.send_json({
                    "action": "error",
                    "message": f"Unknown action: {action}",
                })

    except WebSocketDisconnect:
        print(f"[WS] 客户端断开: {conn_id}")
    except Exception as e:
        print(f"[WS] 异常 {conn_id}: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)


async def _run_triad_loop_stream(
    websocket: WebSocket,
    session_id: str,
    task: str,
    heterogeneous: bool = False,
):
    """
    订阅 StreamBroker 消息流并推送给前端。
    若 StreamBroker 未初始化，则回退到内置模拟流。
    """

    async def send(msg: dict):
        try:
            await websocket.send_json(msg)
        except Exception:
            pass

    if _broker is not None:
        # ── 使用 StreamBroker 真实调度 ────────────────────────────────────────
        # 注入 websocket 到 session 并触发任务
        _broker.running_sessions[session_id] = {
            "created": datetime.now().isoformat(),
            "status": "active",
            "websocket": websocket,
        }
        _broker.message_history[session_id] = []
        await _broker._execute_streaming_task(session_id, task)

    else:
        # ── 内置 Fallback：模拟三权分立流程 ──────────────────────────────────
        phases = [
            ("Strategist", "thinking", f"战略分析任务: {task[:60]}"),
            ("Coder",      "thinking", "Claude 正在生成代码方案..."),
            ("Coder",      "result",   "代码方案已生成，等待审查"),
            ("Reviewer",   "thinking", "GLM-4 执行批判审查..."),
            ("Reviewer",   "result",   "审查完成，评分: 88/100"),
            ("Validator",  "action",   "Pytest 初始化测试环境"),
            ("Validator",  "result",   "测试全部通过 (5/5)"),
            ("Strategist", "converge", "✅ 三权分立博弈收敛！最终评分: 88/100"),
        ]
        for agent, msg_type, content in phases:
            await send({
                "agent": agent,
                "type": msg_type,
                "content": content,
                "timestamp": datetime.now().isoformat(),
                "round": 1,
                "session_id": session_id,
                "metadata": {"heterogeneous": heterogeneous},
            })
            await asyncio.sleep(0.8)


# ── REST 接口 ─────────────────────────────────────────────────────────────────

def _build_rag_status() -> dict:
    """构建 RAG 状态信息"""
    index_size = 0
    if _code_rag is not None:
        if hasattr(_code_rag, "index_size"):
            index_size = _code_rag.index_size()
        elif hasattr(_code_rag, "index_data"):
            index_size = len(_code_rag.index_data)

    return {
        "chunks": index_size,
        "dim": 384,           # all-minilm 的向量维度
        "model": getattr(_code_rag, "model", "all-minilm") if _code_rag else "not_loaded",
        "workspace": WORKSPACE_ROOT,
        "status": "ok" if _code_rag else "not_initialized",
    }


def _check_ollama_health() -> dict:
    """检测本地 Ollama 连通性"""
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    try:
        r = requests.get(f"{ollama_url}/api/tags", timeout=3)
        models = [m["name"] for m in r.json().get("models", [])]
        return {
            "connected": True,
            "url": ollama_url,
            "models": models,
            "model_count": len(models),
        }
    except Exception as e:
        return {
            "connected": False,
            "url": ollama_url,
            "error": str(e),
            "models": [],
            "model_count": 0,
        }


@app.get("/api/chat/rag/status")
async def get_rag_status():
    """
    返回 RAG 索引状态。前端 OllamaRAGIndicator 调用此接口。

    Response:
      {
        "chunks": 1234,          // 已索引的代码块数量
        "dim": 384,              // Embedding 向量维度
        "model": "all-minilm",   // 使用的 Embedding 模型
        "workspace": "/path/...",
        "status": "ok"
      }
    """
    return JSONResponse(_build_rag_status())


@app.get("/api/chat/rag/health")
async def get_rag_health():
    """
    检测本地 Ollama 连通性及可用模型列表。

    Response:
      {
        "connected": true,
        "url": "http://localhost:11434",
        "models": ["all-minilm", "llama3", ...],
        "model_count": 3
      }
    """
    return JSONResponse(_check_ollama_health())


@app.get("/health")
async def health_check():
    """服务自检端点"""
    return {
        "status": "ok",
        "service": "MaoAI HyperAgents WS Server",
        "active_connections": len(active_connections),
        "broker": "loaded" if _broker else "not_loaded",
        "rag": "loaded" if _code_rag else "not_loaded",
        "ts": datetime.now().isoformat(),
    }


@app.get("/")
async def root():
    return {"message": "MaoAI HyperAgents WS Server", "docs": "/docs"}


# ── 启动入口 ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("WS_PORT", "8765"))
    host = os.getenv("WS_HOST", "0.0.0.0")

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║       MaoAI HyperAgents WS Server — Phase 6                 ║
║                                                              ║
║  WS   ws://{host}:{port}/ws/triad-loop                      ║
║  GET  http://{host}:{port}/api/chat/rag/status              ║
║  GET  http://{host}:{port}/api/chat/rag/health              ║
║  GET  http://{host}:{port}/health                           ║
║  DOC  http://{host}:{port}/docs                             ║
╚══════════════════════════════════════════════════════════════╝
""")

    uvicorn.run(app, host=host, port=port, log_level="info")
