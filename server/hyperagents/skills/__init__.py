"""
MaoAI HyperAgents Skills - 技能模块
─────────────────────────────────────────────────────────────────────────────
技能说明：标准化 MaoAI 技能接口，支持懒加载和 TriadLoop 集成

已实现技能：
    - video_gen_skill: 视频生成技能（图片+音频 -> 视频）

使用方式：
    from skills.video_gen_skill import VideoGenSkill, quick_generate
    
    # 方式1: 实例化
    skill = VideoGenSkill(mode="triad")
    result = skill.execute(script="...", images=[...], audio="...")
    
    # 方式2: 快捷调用
    result = quick_generate(script="...", images=[...], audio="...")
"""

from .video_gen_skill import (
    VideoGenSkill,
    VideoTask,
    VideoStyle,
    VideoStatus,
    quick_generate
)

__all__ = [
    "VideoGenSkill",
    "VideoTask", 
    "VideoStyle",
    "VideoStatus",
    "quick_generate"
]
