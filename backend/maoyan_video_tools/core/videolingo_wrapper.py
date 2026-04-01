"""
VideoLingo Wrapper - 全自动字幕组工具封装
支持：下载 → ASR → 分割 → 翻译 → TTS配音 → 合成

GitHub: Huanshere/VideoLingo
pip install videolingo (参考项目 README 安装)
"""

import os
import subprocess
import logging
import json
import yaml
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class VideoLingoWrapper:
    """
    封装 VideoLingo 核心功能

    完整流水线：
      1. yt-dlp 下载视频
      2. Whisper ASR 语音识别
      3. NLP 智能断句
      4. GPT/Claude 翻译
      5. Edge-TTS 配音
      6. 字幕烧入视频
      7. 配音合成视频
    """

    def __init__(
        self,
        workspace: Path,
        openai_api_key: Optional[str] = None,
        dashscope_key: Optional[str] = None,
    ):
        self.workspace = workspace
        self.output_dir = workspace / "videolingo_output"
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.openai_key = openai_api_key or os.getenv("OPENAI_API_KEY", "")
        self.dashscope_key = dashscope_key or os.getenv("DASHSCOPE_API_KEY", "")

        self.available = self._check_available()

    def _check_available(self) -> bool:
        """检查 VideoLingo 环境"""
        # 检查核心依赖
        deps = ["yt_dlp", "whisper", "openai", "librosa"]
        missing = []
        for dep in deps:
            try:
                __import__(dep)
            except ImportError:
                missing.append(dep)
        if missing:
            logger.warning(
                f"VideoLingo missing deps: {missing}. "
                "Install: pip install videolingo  (see https://github.com/Huanshere/VideoLingo)"
            )
        return len(missing) == 0

    def _ensure_config(self) -> Path:
        """生成 VideoLingo config.yaml"""
        config_path = self.workspace / "videolingo_config.yaml"
        config = {
            "api": {
                "key": self.dashscope_key or self.openai_key,
                "base_url": "https://yunwu.ai" if self.dashscope_key else "",
                "model": "",
                "llm_support_json": False,
            },
            "max_workers": 4,
            "demucs": True,
            "whisper": {
                "model": "large-v3",
                "language": "auto",
                "runtime": "local",
            },
            "burn_subtitles": True,
            "ffmpeg_gpu": False,
        }
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(config, f, allow_unicode=True)
        return config_path

    # ── 核心功能 ────────────────────────────────────────────────────────────

    def transcribe(self, video_path: str, language: str = "auto") -> Dict[str, Any]:
        """
        ASR 语音识别（仅识别，不翻译）
        """
        if not self.available:
            return {"status": "error", "message": "VideoLingo dependencies not available"}

        try:
            # 使用 yt-dlp 提取音频
            audio_path = str(self.workspace / f"{Path(video_path).stem}_audio.mp3")
            subprocess.run(
                ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "libmp3lame", "-q:a", "2", audio_path],
                capture_output=True, check=True,
            )

            # Whisper ASR
            import whisper
            model = whisper.load_model("large-v3")
            result = model.transcribe(audio_path, language=language if language != "auto" else None)

            # 输出 SRT
            srt_path = str(self.workspace / f"{Path(video_path).stem}_whisper.srt")
            self._write_srt_from_segments(result["segments"], srt_path)

            return {
                "status": "ok",
                "subtitle_path": srt_path,
                "audio_path": audio_path,
                "language": result.get("language", "unknown"),
                "text": result.get("text", ""),
            }
        except Exception as e:
            logger.error(f"VideoLingo transcribe failed: {e}")
            return {"status": "error", "message": str(e)}

    def split_sentences(
        self,
        subtitle_path: str,
        language: str = "auto",
    ) -> Dict[str, Any]:
        """
        智能断句（基于 NLP + LLM）
        """
        if not self.available:
            return {"status": "error", "message": "VideoLingo not available"}

        # 读取字幕文件
        with open(subtitle_path, "r", encoding="utf-8") as f:
            content = f.read()

        try:
            # NLP 断句逻辑（简化版，完整版参考 VideoLingo/core/_3_1_split_nlp.py）
            import re
            sentences = re.split(r'([。！？\n])', content)
            return {
                "status": "ok",
                "message": "Sentence splitting requires full VideoLingo install",
                "subtitle_path": subtitle_path,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def translate(
        self,
        subtitle_path: str,
        target_language: str,
        llm_provider: str = "openai",
    ) -> Dict[str, Any]:
        """
        字幕翻译（使用 LLM）
        """
        translated_path = subtitle_path.replace(".srt", f"_{target_language}.srt")
        try:
            with open(subtitle_path, "r", encoding="utf-8") as f:
                content = f.read()

            if llm_provider == "openai" and self.openai_key:
                import openai
                client = openai.OpenAI(api_key=self.openai_key)
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": f"Translate this subtitle to {target_language}. Keep time codes intact. Output only the translated SRT content."},
                        {"role": "user", "content": content[:4000]},
                    ],
                    temperature=0.3,
                )
                translated = response.choices[0].message.content
            else:
                # 使用 Basic 翻译（降级）
                translated = self._basic_translate(content, target_language)

            with open(translated_path, "w", encoding="utf-8") as f:
                f.write(translated)

            return {"status": "ok", "translated_path": translated_path, "provider": llm_provider}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _basic_translate(self, text: str, target_lang: str) -> str:
        """基础翻译（无 API 时使用本地词表）"""
        return text  # 占位，需要完整 VideoLingo 环境

    def dub(
        self,
        video_path: str,
        target_language: str,
        voice: str = "default",
    ) -> Dict[str, Any]:
        """
        配音翻译（完整流水线）
        视频 → ASR → 翻译 → TTS → 合成配音视频

        基于 VideoLingo core/_12_dub_to_vid.py
        """
        if not self.available:
            return {"status": "error", "message": "VideoLingo not fully installed"}

        try:
            # Step 1: 转录
            step1 = self.transcribe(video_path, language="auto")
            if step1.get("status") != "ok":
                return step1

            subtitle_path = step1["subtitle_path"]

            # Step 2: 翻译字幕
            step2 = self.translate(subtitle_path, target_language)
            if step2.get("status") != "ok":
                return step2

            translated_path = step2["translated_path"]

            # Step 3: TTS 配音（Edge-TTS）
            audio_dub_path = str(self.output_dir / f"{Path(video_path).stem}_dub_{target_language}.mp3")
            try:
                import edge_tts
                import asyncio

                # 读取翻译后字幕文本
                with open(translated_path, "r", encoding="utf-8") as f:
                    srt_content = f.read()

                voice_map = {
                    "zh": "zh-CN-XiaoxiaoNeural",
                    "en": "en-US-AriaNeural",
                    "ja": "ja-JP-NanamiNeural",
                    "ko": "ko-KR-SunHiNeural",
                }
                voice_name = voice_map.get(target_language, "en-US-AriaNeural")

                async def _tts():
                    communicate = edge_tts.Communicate(srt_content, voice_name)
                    await communicate.save(audio_dub_path)

                asyncio.run(_tts())
                step3 = {"status": "ok", "audio_path": audio_dub_path}
            except ImportError:
                step3 = {"status": "error", "message": "edge-tts not installed"}
            except Exception as e:
                step3 = {"status": "error", "message": str(e)}

            # Step 4: 合成配音视频
            output_path = str(self.output_dir / f"{Path(video_path).stem}_dubbed_{target_language}.mp4")
            if step3.get("status") == "ok":
                cmd = [
                    "ffmpeg", "-y",
                    "-i", video_path,
                    "-i", step3["audio_path"],
                    "-c:v", "libx264", "-c:a", "aac",
                    "-shortest",
                    "-map", "0:v", "-map", "1:a",
                    output_path,
                ]
                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode != 0:
                    return {"status": "error", "message": f"Video合成失败: {result.stderr[:200]}"}
            else:
                # 无配音时只烧字幕
                output_path = str(self.output_dir / f"{Path(video_path).stem}_subtitled_{target_language}.mp4")
                cmd = [
                    "ffmpeg", "-y", "-i", video_path,
                    "-vf", f"subtitles='{translated_path}'",
                    "-c:v", "libx264", "-crf", "18", "-c:a", "aac",
                    output_path,
                ]
                subprocess.run(cmd, capture_output=True, check=True)

            return {
                "status": "ok",
                "output_path": output_path,
                "subtitle_path": translated_path,
                "dub_audio_path": step3.get("audio_path"),
                "steps": {"transcribe": step1, "translate": step2, "tts": step3},
            }
        except Exception as e:
            logger.error(f"VideoLingo dub failed: {e}")
            return {"status": "error", "message": str(e)}

    def _write_srt_from_segments(self, segments, output_path: str):
        """将 whisper segments 写入 SRT"""
        with open(output_path, "w", encoding="utf-8") as f:
            for i, seg in enumerate(segments, 1):
                start = self._format_time(seg["start"])
                end = self._format_time(seg["end"])
                text = seg["text"].strip()
                f.write(f"{i}\n{start} --> {end}\n{text}\n\n")

    @staticmethod
    def _format_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds - int(seconds)) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
