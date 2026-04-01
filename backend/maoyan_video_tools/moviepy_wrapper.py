"""
MoviePy Wrapper - 统一视频编辑操作
封装 moviepy 核心能力，支持本地/云端
"""

import os
import subprocess
import logging
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# moviepy 是所有工具的基础依赖，优先尝试导入
try:
    from moviepy.editor import (
        VideoFileClip,
        concatenate_videoclips,
        AudioFileClip,
        CompositeVideoClip,
        ImageClip,
        ColorClip,
        TextClip,
    )
    from moviepy.video.fx import all as vfx
    from moviepy.audio.fx import all as afx
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    logger.warning("moviepy not installed. Run: pip install moviepy")


def _run_ffmpeg(cmd: list, check=True) -> str:
    """直接用 ffmpeg 执行命令（moviepy 不可用时的降级方案）"""
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")
    return result.stdout


class MoviePyWrapper:
    """
    统一视频剪辑封装
    优先使用 moviepy，moviepy 不可用时降级到纯 ffmpeg
    """

    def __init__(self, workspace: Path):
        self.workspace = workspace
        self.output_dir = workspace / "moviepy_output"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.moviepy_available = MOVIEPY_AVAILABLE

    # ── 基础操作 ────────────────────────────────────────────────────────────

    def trim(
        self,
        video_path: str,
        start: float,
        end: float,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        剪切视频片段
        usage: trim("/path/to/video.mp4", 10.0, 30.0, "/output/clip.mp4")
        """
        if not output_path:
            name = Path(video_path).stem
            output_path = str(self.output_dir / f"{name}_clip_{start}_{end}.mp4")

        if self.moviepy_available:
            try:
                with VideoFileClip(video_path) as clip:
                    trimmed = clip.subclip(start, end)
                    trimmed.write_videofile(
                        output_path,
                        codec="libx264",
                        audio_codec="aac",
                        threads=4,
                        logger=None,
                    )
                    duration = end - start
                    return {
                        "status": "ok",
                        "output_path": output_path,
                        "duration": duration,
                        "method": "moviepy",
                    }
            except Exception as e:
                logger.warning(f"moviepy trim failed, falling back to ffmpeg: {e}")

        # ffmpeg fallback
        cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-ss", str(start), "-to", str(end),
            "-c:v", "libx264", "-c:a", "aac",
            "-threads", "4", output_path,
        ]
        _run_ffmpeg(cmd)
        return {
            "status": "ok",
            "output_path": output_path,
            "duration": end - start,
            "method": "ffmpeg",
        }

    def concat(
        self,
        video_paths: list[str],
        output_path: str,
    ) -> Dict[str, Any]:
        """
        拼接多个视频
        """
        if self.moviepy_available and len(video_paths) <= 10:
            try:
                clips = [VideoFileClip(p) for p in video_paths]
                final = concatenate_videoclips(clips)
                final.write_videofile(
                    output_path, codec="libx264", audio_codec="aac",
                    threads=4, logger=None,
                )
                for c in clips:
                    c.close()
                return {"status": "ok", "output_path": output_path, "method": "moviepy"}
            except Exception as e:
                logger.warning(f"moviepy concat failed: {e}")

        # ffmpeg concat (用临时文件列表)
        concat_list = self.output_dir / "concat_list.txt"
        with open(concat_list, "w") as f:
            for p in video_paths:
                f.write(f"file '{p}'\n")
        cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_list), "-c:v", "libx264", "-c:a", "aac", output_path,
        ]
        _run_ffmpeg(cmd)
        return {"status": "ok", "output_path": output_path, "method": "ffmpeg"}

    def burn_subtitle(
        self,
        video_path: str,
        subtitle_path: str,
        output_path: Optional[str] = None,
        subtitle_mode: str = "hard",
    ) -> Dict[str, Any]:
        """
        烧入字幕到视频
        subtitle_mode: "hard" = 硬字幕烧入, "soft" = 软字幕封装
        """
        if not output_path:
            name = Path(video_path).stem
            output_path = str(self.output_dir / f"{name}_subbed.mp4")

        if subtitle_mode == "soft":
            # 软字幕：直接封装
            cmd = [
                "ffmpeg", "-y", "-i", video_path,
                "-i", subtitle_path,
                "-c:v", "copy", "-c:a", "copy",
                "-c:s", "mov_text",
                "-metadata:s:s:0", "language=chi",
                output_path,
            ]
        else:
            # 硬字幕：用 ffmpeg 滤镜烧入
            cmd = [
                "ffmpeg", "-y", "-i", video_path,
                "-vf", f"subtitles='{subtitle_path}'",
                "-c:v", "libx264", "-crf", "18",
                "-c:a", "aac", output_path,
            ]

        _run_ffmpeg(cmd)
        return {"status": "ok", "output_path": output_path, "method": "ffmpeg"}

    def add_watermark(
        self,
        video_path: str,
        watermark_path: str,
        output_path: Optional[str] = None,
        position: str = "bottom-right",
    ) -> Dict[str, Any]:
        """
        加水印
        position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
        """
        if not output_path:
            name = Path(video_path).stem
            output_path = str(self.output_dir / f"{name}_watermarked.mp4")

        overlay_positions = {
            "top-left": "10:10",
            "top-right": "W-w-10:10",
            "bottom-left": "10:H-h-10",
            "bottom-right": "W-w-10:H-h-10",
            "center": "(W-w)/2:(H-h)/2",
        }
        pos = overlay_positions.get(position, overlay_positions["bottom-right"])

        cmd = [
            "ffmpeg", "-y", "-i", video_path, "-i", watermark_path,
            "-filter_complex", f"overlay={pos}",
            "-c:v", "libx264", "-crf", "18", "-c:a", "aac",
            output_path,
        ]
        _run_ffmpeg(cmd)
        return {"status": "ok", "output_path": output_path, "method": "ffmpeg"}

    def extract_audio(
        self,
        video_path: str,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """从视频提取音频"""
        if not output_path:
            name = Path(video_path).stem
            output_path = str(self.workspace / f"{name}_audio.mp3")

        cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-acodec", "libmp3lame", "-q:a", "2", output_path,
        ]
        _run_ffmpeg(cmd)
        return {"status": "ok", "output_path": output_path}

    def get_video_info(self, video_path: str) -> Dict[str, Any]:
        """获取视频元信息"""
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", video_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        import json as _json
        data = _json.loads(result.stdout)
        video_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), {})
        audio_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), {})
        fmt = data.get("format", {})
        return {
            "duration": float(fmt.get("duration", 0)),
            "width": int(video_stream.get("width", 0)),
            "height": int(video_stream.get("height", 0)),
            "fps": eval(video_stream.get("r_frame_rate", "0/1")) if "/" in video_stream.get("r_frame_rate", "") else 0,
            "codec": video_stream.get("codec_name", ""),
            "size_bytes": int(fmt.get("size", 0)),
            "format": fmt.get("format_name", ""),
        }

    def resize(
        self,
        video_path: str,
        width: int,
        height: int,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """调整分辨率"""
        if not output_path:
            name = Path(video_path).stem
            output_path = str(self.output_dir / f"{name}_{width}x{height}.mp4")

        cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
            "-c:v", "libx264", "-c:a", "aac", output_path,
        ]
        _run_ffmpeg(cmd)
        return {"status": "ok", "output_path": output_path}

    def to_vertical(
        self,
        video_path: str,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """将横屏视频转换为竖屏（9:16），用于抖音/短视频"""
        if not output_path:
            name = Path(video_path).stem
            output_path = str(self.output_dir / f"{name}_vertical.mp4")

        # 先缩放然后加黑边补齐 9:16
        cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
            "-c:v", "libx264", "-crf", "18", "-c:a", "aac", output_path,
        ]
        _run_ffmpeg(cmd)
        return {"status": "ok", "output_path": output_path}
