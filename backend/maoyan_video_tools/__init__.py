"""
Maoyan Video Tools - 猫眼内容平台视频工具整合包
整合: moviepy + VideoLingo + ShortGPT + VideoCaptioner

本地/云端双轨运行，支持 FastAPI 调用
"""

__version__ = "1.0.0"
__author__ = "Mc&Mamoo Brand Management Inc."

from .core.engine import MaoyanVideoEngine

__all__ = ["MaoyanVideoEngine"]
