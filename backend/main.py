"""
Maoyan Video Tools - FastAPI 主入口
猫眼内容平台 视频处理后端
本地 / 云端 双轨运行
"""

import os, asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import logging

from maoyan_video_tools.api.routes import router as api_router
from maoyan_video_tools.core.engine import MaoyanVideoEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("maoyan-video-tools")

# ─── 全局引擎实例 ───────────────────────────────────────────
_engine: MaoyanVideoEngine | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _engine
    logger.info("🚀 MaoyanVideoEngine 初始化中...")
    _engine = MaoyanVideoEngine()
    await _engine.initialize()
    logger.info("✅ MaoyanVideoEngine 就绪")
    yield
    logger.info("👋 关闭 MaoyanVideoEngine...")

# ─── FastAPI 应用 ───────────────────────────────────────────
app = FastAPI(
    title="Maoyan Video Tools API",
    description="猫眼内容平台 视频智能处理后端 — MoviePy + VideoLingo + ShortGPT + VideoCaptioner",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载 API 路由
app.include_router(api_router, prefix="/api/v1/video", tags=["视频处理"])

# 健康检查
@app.get("/health")
async def health():
    return {"status": "ok", "service": "maoyan-video-tools", "engine": "ready" if _engine else "loading"}

@app.get("/")
async def root():
    return {
        "service": "Maoyan Video Tools",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "moviepy": "/api/v1/video/clip",
            "caption": "/api/v1/video/caption",
            "translate": "/api/v1/video/translate",
            "tts": "/api/v1/video/tts",
            "short": "/api/v1/video/short",
            "download": "/api/v1/video/download",
            "status": "/api/v1/video/status/{job_id}",
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
