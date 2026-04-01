"""
VideoCaptioner Wrapper - AI字幕助手封装
支持：语音转字幕 / 字幕优化 / 字幕翻译 / 视频合成

GitHub: WEIFENG2333/VideoCaptioner
pip install videocaptioner
"""

import os
import subprocess
import logging
import tempfile
import shutil
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class VideoCaptionerWrapper:
    """
    封装 VideoCaptioner CLI，提供标准化 Python 接口

    支持 ASR 引擎：
      - whisper    : OpenAI Whisper (默认，需要 whisper API key 或本地模型)
      - bijian     : 毕简 ASR (免费，中英文)
      - jianying   : 剪映 ASR (免费，中英文)
      - whisper-cpp: 本地 Whisper.cpp

    支持翻译服务：
      - bing       : 微软必应翻译 (免费)
      - google     : 谷歌翻译 (免费)
      - openai     : OpenAI 翻译
      - deepseek   : DeepSeek 翻译
    """

    def __init__(
        self,
        workspace: Path,
        openai_api_key: Optional[str] = None,
        dashscope_key: Optional[str] = None,
    ):
        self.workspace = workspace
        self.output_dir = workspace / "videocaptioner_output"
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.openai_key = openai_api_key or os.getenv("OPENAI_API_KEY", "")
        self.dashscope_key = dashscope_key or os.getenv("DASHSCOPE_API_KEY", "")

        # 检测 videocaptioner 是否可用
        self.available = self._check_available()

    def _check_available(self) -> bool:
        try:
            result = subprocess.run(
                ["videocaptioner", "--help"],
                capture_output=True, text=True, timeout=10,
            )
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            pass

        # 检查 Python 包
        try:
            import videocaptioner
            return True
        except ImportError:
            logger.warning(
                "VideoCaptioner not installed. "
                "Install with: pip install videocaptioner"
            )
            return False

    def _run_videocaptioner(self, args: list, env: Optional[dict] = None) -> str:
        """执行 videocaptioner 命令"""
        base_env = os.environ.copy()
        if self.openai_key:
            base_env["OPENAI_API_KEY"] = self.openai_key
        if self.dashscope_key:
            base_env["DASHSCOPE_API_KEY"] = self.dashscope_key
        if env:
            base_env.update(env)

        cmd = ["videocaptioner"] + args
        logger.info(f"Running: {' '.join(cmd)}")
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            env=base_env, timeout=600,
        )
        if result.returncode != 0:
            raise RuntimeError(f"videocaptioner failed: {result.stderr[:500]}")
        return result.stdout

    # ── 核心功能 ────────────────────────────────────────────────────────────

    def transcribe(
        self,
        video_path: str,
        language: str = "auto",
        asr_engine: str = "whisper",
        output_format: str = "srt",
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        语音转字幕
        """
        if not self.available:
            return self._transcribe_fallback(video_path, language, asr_engine, output_format)

        output_path = output_path or str(self.output_dir / f"{Path(video_path).stem}.srt")

        args = [
            "transcribe", video_path,
            "--asr", asr_engine,
            "--language", language,
            "-o", output_path,
            "--format", output_format,
        ]

        try:
            self._run_videocaptioner(args)
            return {
                "status": "ok",
                "subtitle_path": output_path,
                "engine": asr_engine,
                "language": language,
            }
        except Exception as e:
            logger.warning(f"videocaptioner transcribe failed: {e}, using fallback")
            return self._transcribe_fallback(video_path, language, asr_engine, output_format)

    def _transcribe_fallback(
        self,
        video_path: str,
        language: str,
        asr_engine: str,
        output_format: str,
    ) -> Dict[str, Any]:
        """
        VideoCaptioner 不可用时的降级方案：
        使用 yt-dlp 提取音频 + whisper API 生成字幕
        """
        logger.info("Using fallback transcription: yt-dlp + whisper")

        # 1. 提取音频
        audio_path = str(self.workspace / f"{Path(video_path).stem}_audio.mp3")
        subprocess.run(
            ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "libmp3lame", "-q:a", "2", audio_path],
            capture_output=True, check=True,
        )

        # 2. 使用 OpenAI Whisper API 转录
        if self.openai_key:
            return self._whisper_api_transcribe(audio_path, language, output_format)
        else:
            # 使用 faster-whisper 本地模型（需要安装）
            return self._faster_whisper_transcribe(audio_path, language, output_format)

    def _whisper_api_transcribe(
        self,
        audio_path: str,
        language: str,
        output_format: str,
    ) -> Dict[str, Any]:
        """使用 OpenAI Whisper API 转录"""
        import openai
        client = openai.OpenAI(api_key=self.openai_key)
        lang_map = {"auto": None, "zh": "zh", "en": "en", "ja": "ja", "ko": "ko"}
        with open(audio_path, "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                language=lang_map.get(language),
                response_format=output_format if output_format != "srt" else "srt",
            )

        output_path = audio_path.replace(".mp3", f".{output_format}")
        with open(output_path, "w", encoding="utf-8") as out:
            out.write(str(transcript))

        return {
            "status": "ok",
            "subtitle_path": output_path,
            "engine": "whisper-api",
            "method": "openai",
        }

    def _faster_whisper_transcribe(
        self,
        audio_path: str,
        language: str,
        output_format: str,
    ) -> Dict[str, Any]:
        """使用 faster-whisper 本地模型"""
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            return {
                "status": "error",
                "message": "faster-whisper not installed and no OpenAI key provided. "
                           "Run: pip install faster-whisper",
            }

        lang_map = {"auto": None, "zh": "zh", "en": "en", "ja": "ja"}
        model_size = "large-v3" if language == "zh" else "large-v2"

        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        segments, _ = model.transcribe(audio_path, language=lang_map.get(language))

        output_path = audio_path.replace(".mp3", f".{output_format}")
        if output_format == "srt":
            self._write_srt(segments, output_path)
        else:
            text = "\n".join(s.text for s in segments)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text)

        return {
            "status": "ok",
            "subtitle_path": output_path,
            "engine": "faster-whisper",
            "model": model_size,
        }

    def _write_srt(self, segments, output_path: str):
        """将 whisper segments 写入 SRT 文件"""
        with open(output_path, "w", encoding="utf-8") as f:
            for i, seg in enumerate(segments, 1):
                start = self._format_time(seg.start)
                end = self._format_time(seg.end)
                f.write(f"{i}\n{start} --> {end}\n{seg.text.strip()}\n\n")

    @staticmethod
    def _format_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds - int(seconds)) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    def optimize(
        self,
        subtitle_path: str,
        language: str = "auto",
        llm_provider: str = "openai",
    ) -> Dict[str, Any]:
        """
        字幕优化：智能断句 + 纠错
        """
        if not self.available:
            return {
                "status": "error",
                "message": "videocaptioner not available. Subtitle optimization requires CLI install.",
            }

        optimized_path = subtitle_path.replace(".srt", "_optimized.srt")
        args = [
            "subtitle", subtitle_path,
            "--llm", llm_provider,
            "-o", optimized_path,
        ]

        try:
            self._run_videocaptioner(args)
            return {"status": "ok", "optimized_path": optimized_path}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def translate(
        self,
        subtitle_path: str,
        target_language: str,
        translator: str = "bing",
    ) -> Dict[str, Any]:
        """
        字幕翻译
        """
        if not self.available:
            return {
                "status": "error",
                "message": "videocaptioner not available. Translation requires CLI install.",
            }

        translated_path = subtitle_path.replace(".srt", f"_{target_language}.srt")
        args = [
            "subtitle", subtitle_path,
            "--translator", translator,
            "--target-language", target_language,
            "-o", translated_path,
        ]

        try:
            self._run_videocaptioner(args)
            return {"status": "ok", "translated_path": translated_path, "translator": translator}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def synthesize(
        self,
        video_path: str,
        subtitle_path: str,
        subtitle_mode: str = "hard",
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        字幕烧入视频
        """
        if not output_path:
            output_path = str(self.output_dir / f"{Path(video_path).stem}_subtitled.mp4")

        if subtitle_mode == "soft":
            cmd = [
                "ffmpeg", "-y", "-i", video_path, "-i", subtitle_path,
                "-c:v", "copy", "-c:a", "copy", "-c:s", "mov_text",
                output_path,
            ]
        else:
            cmd = [
                "ffmpeg", "-y", "-i", video_path,
                "-vf", f"subtitles='{subtitle_path}'",
                "-c:v", "libx264", "-crf", "18", "-c:a", "aac",
                output_path,
            ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return {"status": "error", "message": result.stderr[:300]}

        return {"status": "ok", "output_path": output_path, "mode": subtitle_mode}
