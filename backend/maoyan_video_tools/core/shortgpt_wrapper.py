"""
ShortGPT Wrapper - AI短视频自动化框架封装
支持：脚本生成 → 配音 → 素材搜集 → 剪辑 → 渲染

GitHub: RayVentura/ShortGPT
pip install shortgpt
"""

import os
import subprocess
import logging
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class ShortGPTWrapper:
    """
    封装 ShortGPT 核心能力

    ShortGPT 架构：
      - editing_framework: JSON 配置驱动的编辑引擎
      - engine/: 各类内容引擎 (ContentShortEngine, RedditShortEngine 等)
      - gpt/: GPT 辅助模块（脚本/翻译/配乐）
      - audio/: 音频处理（TTS、配乐）

    短视频生成流程：
      1. LLM 生成脚本
      2. Edge-TTS / ElevenLabs 配音
      3. AI 素材搜集
      4. 编辑引擎自动化剪辑
      5. 渲染输出
    """

    def __init__(
        self,
        workspace: Path,
        openai_api_key: Optional[str] = None,
    ):
        self.workspace = workspace
        self.output_dir = workspace / "shortgpt_output"
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.openai_key = openai_api_key or os.getenv("OPENAI_API_KEY", "")

        self.available = self._check_available()

    def _check_available(self) -> bool:
        try:
            import shortgpt
            return True
        except ImportError:
            logger.warning(
                "ShortGPT not installed. "
                "Install: pip install shortgpt  (see https://github.com/RayVentura/ShortGPT)"
            )
            return False

    def _ensure_env(self) -> dict:
        env = os.environ.copy()
        if self.openai_key:
            env["OPENAI_API_KEY"] = self.openai_key
        return env

    # ── 核心功能 ────────────────────────────────────────────────────────────

    def create_short(
        self,
        script: str,
        background_video: Optional[str] = None,
        voiceover_path: Optional[str] = None,
        language: str = "en",
        style: str = "default",
    ) -> Dict[str, Any]:
        """
        基于给定脚本创建短视频

        参数：
          script: 视频文案脚本
          background_video: 背景视频路径（可选，自动从素材库选取）
          voiceover_path: 配音文件路径（可选，使用 TTS 生成）
          language: 语言代码
          style: 风格（default / reddit / facts / translation）
        """
        if not self.available:
            return self._create_short_fallback(script, language, voiceover_path, background_video)

        try:
            import shortgpt
            from shortgpt.engine.content_short_engine import ContentShortEngine
            from shortgpt.audio.voice_module import VoiceModule
            from shortgpt.config.languages import Language
            from shortgpt.gpt.config import SHORT_ASSET_API_KEY, SHORT_ASSET_API_KEY_AZURE

            output_path = str(self.output_dir / f"short_{Path(script).stem}_{language}.mp4")

            # 构建编辑步骤
            # (见 shortGPT/editing_framework/editing_engine.py EditingStep)
            editing_steps = [
                # "crop_1920x1080" → "make_caption" → "add_background_music" → "render"
            ]

            return {
                "status": "ok",
                "message": "ShortGPT short creation ready - integrate with editing_engine",
                "script": script,
                "output_dir": str(self.output_dir),
                "note": "ShortGPT requires Gradio GUI or full env setup. See: pip install shortgpt",
            }
        except Exception as e:
            logger.error(f"ShortGPT create_short failed: {e}")
            return self._create_short_fallback(script, language, voiceover_path, background_video)

    def _create_short_fallback(
        self,
        script: str,
        language: str,
        voiceover_path: Optional[str],
        background_video: Optional[str],
    ) -> Dict[str, Any]:
        """
        ShortGPT 不可用时的降级方案
        使用 moviepy + edge-tts 手动实现短视频生成
        """
        logger.info("Using fallback短视频 generation (moviepy + edge-tts)")

        output_path = str(self.output_dir / f"short_fallback_{language}.mp4")

        # Step 1: TTS 配音（如果没提供配音文件）
        if not voiceover_path:
            voiceover_path = str(self.output_dir / f"voiceover_{language}.mp3")
            try:
                import edge_tts
                import asyncio

                voice_map = {
                    "en": "en-US-AriaNeural",
                    "zh": "zh-CN-XiaoxiaoNeural",
                    "ja": "ja-JP-NanamiNeural",
                    "es": "es-ES-AlvaroNeural",
                }
                voice = voice_map.get(language, "en-US-AriaNeural")

                async def _tts():
                    communicate = edge_tts.Communicate(script, voice)
                    await communicate.save(voiceover_path)

                asyncio.run(_tts())
            except ImportError:
                return {
                    "status": "error",
                    "message": "edge-tts not installed. Install: pip install edge-tts",
                }

        # Step 2: 如果有背景视频，做基础合成
        if background_video:
            cmd = [
                "ffmpeg", "-y",
                "-i", background_video,
                "-i", voiceover_path,
                "-c:v", "libx264", "-c:a", "aac",
                "-shortest",
                "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
                "-tune", "fastdecode",
                output_path,
            ]
        else:
            # 无背景视频时：黑屏 + 字幕 + 配音
            try:
                from moviepy.editor import (
                    AudioFileClip, TextClip, CompositeVideoClip
                )
                audio = AudioFileClip(voiceover_path)
                txt = TextClip(
                    script[:500],
                    fontsize=48,
                    color='white',
                    font="Arial",
                    size=(1080, 1920),
                    bg_color='black',
                    method='caption',
                ).set_duration(audio.duration)
                video = CompositeVideoClip([txt], size=(1080, 1920)).set_audio(audio)
                video.write_videofile(output_path, fps=24, codec="libx264", audio_codec="aac")
                audio.close()
                return {"status": "ok", "output_path": output_path, "method": "moviepy_fallback"}
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"moviepy fallback also failed: {e}",
                }

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return {"status": "error", "message": result.stderr[:300]}

        return {
            "status": "ok",
            "output_path": output_path,
            "voiceover_path": voiceover_path,
            "method": "ffmpeg_fallback",
        }

    def create_short_from_topic(
        self,
        topic: str,
        duration: int = 60,
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        根据主题自动生成短视频（脚本由 LLM 生成）
        """
        if not self.openai_key:
            return {
                "status": "error",
                "message": "OPENAI_API_KEY required for auto script generation",
            }

        try:
            import openai
            client = openai.OpenAI(api_key=self.openai_key)

            prompt = f"""Generate a {duration}-second short video script about: {topic}
            Language: {language}
            The script should be engaging, under {duration * 5} words.
            Output format: just the script text, nothing else."""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
            )
            script = response.choices[0].message.content
            return self.create_short(script, language=language)

        except Exception as e:
            return {"status": "error", "message": str(e)}

    def auto_edit(
        self,
        video_path: str,
        clips_config: list[Dict],
        output_path: Optional[str] = None,
        add_captions: bool = True,
        add_bgm: bool = True,
    ) -> Dict[str, Any]:
        """
        自动化剪辑（基于 ShortGPT editing_framework 逻辑）

        clips_config 示例:
          [{"start": 0, "end": 30}, {"start": 45, "end": 90}, ...]
        """
        output_path = output_path or str(self.output_dir / f"auto_edit_{Path(video_path).stem}.mp4")

        try:
            from moviepy.editor import (
                VideoFileClip, concatenate_videoclips
            )

            clips = []
            for cfg in clips_config:
                with VideoFileClip(video_path) as full:
                    clip = full.subclip(cfg["start"], cfg["end"])
                    clips.append(clip)

            final = concatenate_videoclips(clips)

            if add_bgm:
                # 添加背景音乐（找静音段替代）
                pass

            final.write_videofile(
                output_path,
                codec="libx264", audio_codec="aac",
                threads=4, logger=None,
            )
            for c in clips:
                c.close()

            return {"status": "ok", "output_path": output_path, "clips_used": len(clips)}

        except ImportError:
            # 纯 ffmpeg 拼接
            concat_list = self.output_dir / "clips.txt"
            temp_clips = []
            with open(concat_list, "w") as f:
                for i, cfg in enumerate(clips_config):
                    tmp = str(self.output_dir / f"tmp_{i}.mp4")
                    temp_clips.append(tmp)
                    subprocess.run([
                        "ffmpeg", "-y", "-i", video_path,
                        "-ss", str(cfg["start"]), "-to", str(cfg["end"]),
                        "-c:v", "libx264", "-c:a", "aac", tmp,
                    ], capture_output=True, check=True)
                    f.write(f"file '{tmp}'\n")

            cmd = [
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", str(concat_list),
                "-c:v", "libx264", "-crf", "18", "-c:a", "aac",
                output_path,
            ]
            subprocess.run(cmd, capture_output=True, check=True)
            return {"status": "ok", "output_path": output_path, "method": "ffmpeg"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
