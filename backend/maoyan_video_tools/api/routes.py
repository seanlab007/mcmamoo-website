"""
FastAPI 路由 - 视频工具 API
本地/云端双轨运行

支持端点：
  /api/v1/video/clip        - 视频剪切
  /api/v1/video/batch-clip  - 批量剪切
  /api/v1/video/concat       - 视频拼接
  /api/v1/video/subtitle     - 字幕生成
  /api/v1/video/translate    - 字幕翻译
  /api/v1/video/dub          - 配音翻译
  /api/v1/video/short        - 短视频生成
  /api/v1/video/auto         - 一键全流程
  /api/v1/video/info         - 视频信息
"""

import os
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ..core.engine import MaoyanVideoEngine

logger = logging.getLogger(__name__)

# ── Request / Response 模型 ──────────────────────────────────────────────────

class ClipRequest(BaseModel):
    video_path: str
    start: float
    end: float
    output_path: Optional[str] = None

class BatchClipRequest(BaseModel):
    clips: list[dict]  # [{"video_path": "...", "start": 0, "end": 30}]

class ConcatRequest(BaseModel):
    video_paths: list[str]
    output_path: str

class SubtitleRequest(BaseModel):
    video_path: str
    language: str = "auto"
    asr_engine: str = "whisper"
    output_format: str = "srt"

class TranslateRequest(BaseModel):
    subtitle_path: str
    target_language: str
    translator: str = "bing"

class DubRequest(BaseModel):
    video_path: str
    target_language: str
    voice: str = "default"

class ShortRequest(BaseModel):
    script: str
    background_video: Optional[str] = None
    voiceover_path: Optional[str] = None
    language: str = "en"

class ShortTopicRequest(BaseModel):
    topic: str
    duration: int = 60
    language: str = "en"

class AutoProcessRequest(BaseModel):
    video_path: str
    target_language: str = "zh"
    workflow: str = "subtitle_and_burn"

class SubtitleBurnRequest(BaseModel):
    video_path: str
    subtitle_path: str
    output_path: Optional[str] = None
    subtitle_mode: str = "hard"

class WatermarkRequest(BaseModel):
    video_path: str
    watermark_path: str
    output_path: Optional[str] = None
    position: str = "bottom-right"


# ── 创建 FastAPI 应用 ────────────────────────────────────────────────────────

def create_app(
    workspace_dir: str = "./workspace",
    openai_api_key: Optional[str] = None,
    dashscope_key: Optional[str] = None,
) -> FastAPI:
    """
    创建视频工具 FastAPI 应用

    usage:
      from maoyan_video_tools.api.routes import create_app
      app = create_app(
          workspace_dir="/data/workspace",
          openai_api_key="sk-...",
          dashscope_key="sk-...",
      )
      import uvicorn; uvicorn.run(app, port=8080)
    """
    app = FastAPI(
        title="Maoyan Video Tools API",
        description="猫眼内容平台视频工具 API - moviepy + VideoLingo + ShortGPT + VideoCaptioner",
        version="1.0.0",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 初始化引擎
    engine = MaoyanVideoEngine(
        workspace_dir=workspace_dir,
        openai_api_key=openai_api_key,
        dashscope_key=dashscope_key,
        mode=os.getenv("RUN_MODE", "local"),
    )

    # ── 基础剪辑 ────────────────────────────────────────────────────────────

    @app.post("/api/v1/video/clip")
    async def clip_video(req: ClipRequest):
        result = engine.clip_video(
            video_path=req.video_path,
            start=req.start,
            end=req.end,
            output_path=req.output_path,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result)
        return result

    @app.post("/api/v1/video/batch-clip")
    async def batch_clip(req: BatchClipRequest):
        result = engine.clip_videos_batch(clips=req.clips)
        return result

    @app.post("/api/v1/video/concat")
    async def concat_videos(req: ConcatRequest):
        result = engine.concat_videos(
            video_paths=req.video_paths,
            output_path=req.output_path,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result)
        return result

    @app.post("/api/v1/video/subtitle-burn")
    async def burn_subtitle(req: SubtitleBurnRequest):
        result = engine.add_subtitle(
            video_path=req.video_path,
            subtitle_path=req.subtitle_path,
            output_path=req.output_path,
            subtitle_mode=req.subtitle_mode,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result)
        return result

    @app.post("/api/v1/video/watermark")
    async def add_watermark(req: WatermarkRequest):
        result = engine.add_watermark(
            video_path=req.video_path,
            watermark_path=req.watermark_path,
            output_path=req.output_path,
            position=req.position,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result)
        return result

    @app.get("/api/v1/video/info")
    async def video_info(video_path: str):
        result = engine.moviepy.get_video_info(video_path)
        return result

    # ── 字幕生成 ────────────────────────────────────────────────────────────

    @app.post("/api/v1/video/subtitle")
    async def generate_subtitle(req: SubtitleRequest):
        result = engine.generate_subtitle(
            video_path=req.video_path,
            language=req.language,
            asr_engine=req.asr_engine,
            output_format=req.output_format,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result.get("message", "failed"))
        return result

    @app.post("/api/v1/video/subtitle/optimize")
    async def optimize_subtitle(subtitle_path: str, language: str = "auto"):
        result = engine.optimize_subtitle(subtitle_path, language)
        if result.get("status") != "ok":
            raise HTTPException(400, result.get("message", "failed"))
        return result

    @app.post("/api/v1/video/translate")
    async def translate_subtitle(req: TranslateRequest):
        result = engine.translate_subtitle(
            subtitle_path=req.subtitle_path,
            target_language=req.target_language,
            translator=req.translator,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result.get("message", "failed"))
        return result

    # ── 短视频 ──────────────────────────────────────────────────────────────

    @app.post("/api/v1/video/short")
    async def create_short(req: ShortRequest):
        result = engine.generate_short(
            script=req.script,
            background_video=req.background_video,
            voiceover_path=req.voiceover_path,
            language=req.language,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result.get("message", "failed"))
        return result

    @app.post("/api/v1/video/short/topic")
    async def create_short_from_topic(req: ShortTopicRequest):
        result = engine.generate_short_from_topic(
            topic=req.topic,
            duration=req.duration,
            language=req.language,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result.get("message", "failed"))
        return result

    # ── 配音翻译 ────────────────────────────────────────────────────────────

    @app.post("/api/v1/video/dub")
    async def dub_video(req: DubRequest):
        result = engine.dub_video(
            video_path=req.video_path,
            target_language=req.target_language,
            voice=req.voice,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result.get("message", "failed"))
        return result

    # ── 一键全流程 ──────────────────────────────────────────────────────────

    @app.post("/api/v1/video/auto")
    async def auto_process(req: AutoProcessRequest, background: BackgroundTasks):
        result = engine.auto_process(
            video_path=req.video_path,
            target_language=req.target_language,
            workflow=req.workflow,
        )
        if result.get("status") != "ok":
            raise HTTPException(400, result.get("message", "failed"))
        return result

    # ── 健康检查 ────────────────────────────────────────────────────────────

    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "mode": engine.mode,
            "tools": {
                "moviepy": engine.moviepy.moviepy_available,
                "videocaptioner": engine.videocaptioner.available,
                "videolingo": engine.videolingo.available,
                "shortgpt": engine.shortgpt.available,
            },
            "workspace": str(engine.workspace),
        }

    @app.get("/api/v1/tools")
    async def list_tools():
        """列出所有可用工具"""
        return {
            "tools": [
                {
                    "id": "moviepy",
                    "name": "MoviePy 视频剪辑",
                    "description": "基础视频剪切/拼接/字幕/水印",
                    "available": engine.moviepy.moviepy_available,
                    "features": ["trim", "concat", "burn_subtitle", "watermark", "extract_audio", "resize", "to_vertical"],
                },
                {
                    "id": "videocaptioner",
                    "name": "VideoCaptioner 字幕助手",
                    "description": "AI字幕生成/优化/翻译/视频合成",
                    "available": engine.videocaptioner.available,
                    "features": ["transcribe", "optimize", "translate", "synthesize"],
                },
                {
                    "id": "videolingo",
                    "name": "VideoLingo 配音翻译",
                    "description": "全自动字幕组工具：ASR→断句→翻译→TTS配音→合成",
                    "available": engine.videolingo.available,
                    "features": ["transcribe", "split", "translate", "dub"],
                },
                {
                    "id": "shortgpt",
                    "name": "ShortGPT 短视频自动化",
                    "description": "AI短视频框架：脚本→配音→素材→剪辑→渲染",
                    "available": engine.shortgpt.available,
                    "features": ["create_short", "create_short_from_topic", "auto_edit"],
                },
            ]
        }

    return app
