"""
MaoyanVideoEngine - 统一视频工具引擎
编排 moviepy / VideoLingo / ShortGPT / VideoCaptioner
"""

import os
import logging
from typing import Optional, Dict, Any
from pathlib import Path

from .shortgpt_wrapper import ShortGPTWrapper
from .videolingo_wrapper import VideoLingoWrapper
from .videocaptioner_wrapper import VideoCaptionerWrapper
from .moviepy_wrapper import MoviePyWrapper

logger = logging.getLogger(__name__)


class MaoyanVideoEngine:
    """
    统一入口，同时支持本地执行和云端执行。

    设计原则：
    - 每个工具独立封装，不直接修改原工具源码
    - 通过环境变量区分本地/云端模式
    - 所有操作返回标准化结果字典
    """

    def __init__(
        self,
        workspace_dir: str = "./workspace",
        openai_api_key: Optional[str] = None,
        dashscope_key: Optional[str] = None,
        mode: str = "local",  # "local" | "cloud"
    ):
        self.mode = mode
        self.workspace = Path(workspace_dir)
        self.workspace.mkdir(parents=True, exist_ok=True)

        self.openai_key = openai_api_key or os.getenv("OPENAI_API_KEY", "")
        self.dashscope_key = dashscope_key or os.getenv("DASHSCOPE_API_KEY", "")

        # 初始化四个工具的封装
        self.moviepy = MoviePyWrapper(self.workspace)
        self.videocaptioner = VideoCaptionerWrapper(
            self.workspace,
            openai_api_key=self.openai_key,
            dashscope_key=self.dashscope_key,
        )
        self.videolingo = VideoLingoWrapper(
            self.workspace,
            openai_api_key=self.openai_key,
            dashscope_key=self.dashscope_key,
        )
        self.shortgpt = ShortGPTWrapper(
            self.workspace,
            openai_api_key=self.openai_key,
        )

        logger.info(f"MaoyanVideoEngine initialized (mode={mode})")

    # ── 基础剪辑 ──────────────────────────────────────────────────────────────

    def clip_video(
        self,
        video_path: str,
        start: float,
        end: float,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.moviepy.trim(video_path, start, end, output_path)

    def clip_videos_batch(
        self,
        clips: list[Dict[str, Any]],
    ) -> Dict[str, Any]:
        results = []
        for clip in clips:
            r = self.clip_video(
                video_path=clip["video_path"],
                start=clip["start"],
                end=clip["end"],
                output_path=clip.get("output_path"),
            )
            results.append(r)
        return {"status": "ok", "clips": results}

    def concat_videos(
        self,
        video_paths: list[str],
        output_path: str,
    ) -> Dict[str, Any]:
        return self.moviepy.concat(video_paths, output_path)

    def add_subtitle(
        self,
        video_path: str,
        subtitle_path: str,
        output_path: Optional[str] = None,
        subtitle_mode: str = "hard",
    ) -> Dict[str, Any]:
        return self.moviepy.burn_subtitle(video_path, subtitle_path, output_path, subtitle_mode)

    def add_watermark(
        self,
        video_path: str,
        watermark_path: str,
        output_path: Optional[str] = None,
        position: str = "bottom-right",
    ) -> Dict[str, Any]:
        return self.moviepy.add_watermark(video_path, watermark_path, output_path, position)

    # ── 字幕生成 ──────────────────────────────────────────────────────────────

    def generate_subtitle(
        self,
        video_path: str,
        language: str = "auto",
        asr_engine: str = "whisper",
        output_format: str = "srt",
    ) -> Dict[str, Any]:
        return self.videocaptioner.transcribe(
            video_path=video_path,
            language=language,
            asr_engine=asr_engine,
            output_format=output_format,
        )

    def optimize_subtitle(
        self,
        subtitle_path: str,
        language: str = "auto",
        llm_provider: str = "openai",
    ) -> Dict[str, Any]:
        return self.videocaptioner.optimize(
            subtitle_path=subtitle_path,
            language=language,
            llm_provider=llm_provider,
        )

    def translate_subtitle(
        self,
        subtitle_path: str,
        target_language: str,
        translator: str = "bing",
    ) -> Dict[str, Any]:
        return self.videocaptioner.translate(
            subtitle_path=subtitle_path,
            target_language=target_language,
            translator=translator,
        )

    def full_subtitle_pipeline(
        self,
        video_path: str,
        target_language: str = "en",
        burn_subtitle: bool = True,
    ) -> Dict[str, Any]:
        """
        完整字幕工作流：视频 → ASR字幕 → 优化 → 翻译 → 烧入视频
        基于 VideoCaptioner / VideoLingo
        """
        logger.info(f"Full subtitle pipeline: {video_path} -> {target_language}")
        step1 = self.generate_subtitle(video_path, language="auto")
        if step1.get("status") != "ok":
            return step1

        subtitle_path = step1["subtitle_path"]
        step2 = self.optimize_subtitle(subtitle_path)
        if step2.get("status") != "ok":
            return step2

        optimized = step2["optimized_path"]
        step3 = self.translate_subtitle(optimized, target_language)
        if step3.get("status") != "ok":
            return step3

        translated = step3["translated_path"]

        if burn_subtitle:
            out = video_path.replace(".mp4", f"_sub_{target_language}.mp4")
            step4 = self.moviepy.burn_subtitle(video_path, translated, out)
            return {
                "status": "ok",
                "steps": {"transcribe": step1, "optimize": step2, "translate": step3, "burn": step4},
                "output_path": out,
            }

        return {
            "status": "ok",
            "steps": {"transcribe": step1, "optimize": step2, "translate": step3},
            "subtitle_path": translated,
        }

    # ── 短视频生成 (ShortGPT) ────────────────────────────────────────────────

    def generate_short(
        self,
        script: str,
        background_video: Optional[str] = None,
        voiceover_path: Optional[str] = None,
        language: str = "en",
        style: str = "default",
    ) -> Dict[str, Any]:
        return self.shortgpt.create_short(
            script=script,
            background_video=background_video,
            voiceover_path=voiceover_path,
            language=language,
            style=style,
        )

    def generate_short_from_topic(
        self,
        topic: str,
        duration: int = 60,
        language: str = "en",
    ) -> Dict[str, Any]:
        return self.shortgpt.create_short_from_topic(
            topic=topic,
            duration=duration,
            language=language,
        )

    # ── 配音翻译 (VideoLingo) ────────────────────────────────────────────────

    def dub_video(
        self,
        video_path: str,
        target_language: str,
        voice: str = "default",
    ) -> Dict[str, Any]:
        return self.videolingo.dub(
            video_path=video_path,
            target_language=target_language,
            voice=voice,
        )

    # ── 一键全流程 ────────────────────────────────────────────────────────────

    def auto_process(
        self,
        video_path: str,
        target_language: str = "zh",
        workflow: str = "subtitle_and_burn",
    ) -> Dict[str, Any]:
        if workflow == "subtitle_and_burn":
            return self.full_subtitle_pipeline(video_path, target_language, burn_subtitle=True)
        elif workflow == "short_from_video":
            return {"status": "ok", "message": "short_from_video pending - integrate autoclip pipeline"}
        else:
            return {"status": "error", "message": f"Unknown workflow: {workflow}"}
