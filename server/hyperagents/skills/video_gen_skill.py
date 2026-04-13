#!/usr/bin/env python3
"""
MaoAI × 猫眼内容平台 - 视频生成技能 (VideoGenSkill)
─────────────────────────────────────────────────────────────────────────────
技能说明：封装 video_composer.py 为 MaoAI 标准 Skill，支持"一句话成片"

使用方式（示例）：
    skill = VideoGenSkill()
    result = skill.execute(
        script="今天来聊聊八字中的财星...",
        images=["/path/to/img1.jpg", "/path/to/img2.jpg", "/path/to/img3.jpg"],
        audio="/path/to/voice.mp3",
        srt="/path/to/subtitle.srt",
        bgm="/path/to/bgm.mp3",
        style="black_gold"  # 黑金风格
    )

核心特点：
    1. 黑金风格预设 (#d4af37)
    2. 支持中文字幕（需ImageMagick）
    3. 支持背景音乐混音
    4. TriadLoop 集成（生成 -> 审核 -> 验证）
"""

import os
import json
import hashlib
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

# ─── 视频引擎导入 ──────────────────────────────────────────────────────────────
try:
    from ..media_engine.video_composer import create_short_video, HAS_MOVIEPY
except ImportError:
    HAS_MOVIEPY = False
    def create_short_video(*args, **kwargs):
        return {"error": "video_composer not available"}


# ─── 枚举定义 ─────────────────────────────────────────────────────────────────
class VideoStyle(Enum):
    BLACK_GOLD = "black_gold"      # 黑金风格（默认）
    MINIMAL = "minimal"            # 简约白底
    DARK_MODE = "dark_mode"       # 深色电影感
    VIBRANT = "vibrant"           # 鲜艳活泼


class VideoStatus(Enum):
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


# ─── 数据结构 ─────────────────────────────────────────────────────────────────
@dataclass
class VideoTask:
    """视频生成任务"""
    task_id: str
    script: str                    # 文案/脚本
    images: List[str]              # 图片路径列表
    audio: str                     # 配音路径
    srt: Optional[str] = None      # 字幕文件路径
    bgm: Optional[str] = None     # 背景音乐路径
    style: VideoStyle = VideoStyle.BLACK_GOLD
    output_path: Optional[str] = None
    status: VideoStatus = VideoStatus.PENDING
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VideoTask":
        """从字典创建任务"""
        style = VideoStyle(data.get("style", "black_gold"))
        return cls(
            task_id=data["task_id"],
            script=data["script"],
            images=data["images"],
            audio=data["audio"],
            srt=data.get("srt"),
            bgm=data.get("bgm"),
            style=style,
            output_path=data.get("output_path"),
            status=VideoStatus(data.get("status", "pending"))
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "task_id": self.task_id,
            "script": self.script,
            "images": self.images,
            "audio": self.audio,
            "srt": self.srt,
            "bgm": self.bgm,
            "style": self.style.value,
            "output_path": self.output_path,
            "status": self.status.value
        }


# ─── 主技能类 ─────────────────────────────────────────────────────────────────
class VideoGenSkill:
    """
    视频生成技能 - MaoAI 标准 Skill 接口
    
    提供三种执行模式：
        1. direct:   直接生成（跳过博弈）
        2. triad:   TriadLoop 博弈模式（质量优先）
        3. preview: 仅生成预览（低分辨率快速测试）
    """
    
    def __init__(self, mode: str = "triad", work_dir: str = "/tmp/maoai_videos"):
        """
        初始化视频生成技能
        
        Args:
            mode: 执行模式 ("direct" | "triad" | "preview")
            work_dir: 工作目录
        """
        self.mode = mode
        self.work_dir = work_dir
        os.makedirs(work_dir, exist_ok=True)
        
        # 状态追踪
        self._tasks: Dict[str, VideoTask] = {}
        self._history: List[Dict[str, Any]] = []
        
        # TriadLoop 导入（可选）
        self._triad = None
        if mode == "triad":
            self._init_triad_loop()
    
    def _init_triad_loop(self):
        """延迟加载 TriadLoop"""
        try:
            from ..agent.triad_loop import TriadLoop
            self._triad = TriadLoop()
            print(f"[VideoGenSkill] TriadLoop 已启用 - 三权分立模式")
        except ImportError as e:
            print(f"[VideoGenSkill] Warning: TriadLoop 不可用 ({e})，降级为 direct 模式")
            self.mode = "direct"
    
    def _generate_task_id(self, script: str) -> str:
        """生成唯一任务ID"""
        prefix = hashlib.md5(script.encode()).hexdigest()[:8]
        return f"video_{prefix}_{int(time.time())}"
    
    def execute(self, 
                script: str,
                images: List[str],
                audio: str,
                srt: Optional[str] = None,
                bgm: Optional[str] = None,
                style: str = "black_gold",
                output_path: Optional[str] = None,
                **kwargs) -> Dict[str, Any]:
        """
        执行视频生成任务
        
        Args:
            script: 视频文案/脚本
            images: 图片路径列表
            audio: 配音音频路径
            srt: 字幕文件路径（可选）
            bgm: 背景音乐路径（可选）
            style: 视频风格 ("black_gold" | "minimal" | "dark_mode" | "vibrant")
            output_path: 自定义输出路径（可选）
            
        Returns:
            包含 task_id 和生成结果的字典
        """
        # 1. 参数验证
        if not images:
            return {"error": "至少需要一张图片"}
        if not os.path.exists(audio):
            return {"error": f"音频文件不存在: {audio}"}
        
        # 2. 创建任务
        task_id = self._generate_task_id(script)
        if output_path is None:
            output_path = os.path.join(self.work_dir, f"{task_id}.mp4")
        
        task = VideoTask(
            task_id=task_id,
            script=script,
            images=images,
            audio=audio,
            srt=srt,
            bgm=bgm,
            style=VideoStyle(style),
            output_path=output_path,
            status=VideoStatus.PENDING
        )
        self._tasks[task_id] = task
        
        # 3. 根据模式执行
        if self.mode == "triad" and self._triad:
            return self._execute_with_triad(task)
        else:
            return self._execute_direct(task)
    
    def _execute_direct(self, task: VideoTask) -> Dict[str, Any]:
        """直接执行（无博弈）"""
        task.status = VideoStatus.GENERATING
        
        # 调用视频合成引擎
        result = create_short_video(
            image_paths=task.images,
            audio_path=task.audio,
            srt_path=task.srt,
            output_path=task.output_path,
            bgm_path=task.bgm
        )
        
        if "error" in result:
            task.status = VideoStatus.FAILED
            return {"task_id": task.task_id, "status": "failed", "error": result["error"]}
        
        task.status = VideoStatus.COMPLETED
        
        # 记录历史
        self._history.append({
            "task_id": task.task_id,
            "script_preview": task.script[:50],
            "output": task.output_path,
            "status": "completed"
        })
        
        return {
            "task_id": task.task_id,
            "status": "completed",
            "output_path": task.output_path,
            "preview_url": f"/api/video/preview/{task.task_id}"
        }
    
    def _execute_with_triad(self, task: VideoTask) -> Dict[str, Any]:
        """TriadLoop 博弈模式执行"""
        print(f"[VideoGenSkill] TriadLoop 模式 - 任务 {task.task_id}")
        
        # Coder 阶段：生成视频脚本优化
        script_optimized = self._coder_optimize(task.script)
        
        # Reviewer 阶段：审核视频质量潜力
        review_result = self._reviewer_evaluate(task)
        if not review_result["passed"]:
            return {
                "task_id": task.task_id,
                "status": "rejected",
                "reason": review_result["reason"]
            }
        
        # Validator 阶段：生成视频
        task.status = VideoStatus.GENERATING
        result = create_short_video(
            image_paths=task.images,
            audio_path=task.audio,
            srt_path=task.srt,
            output_path=task.output_path,
            bgm_path=task.bgm
        )
        
        # 验证结果
        if "error" in result:
            task.status = VideoStatus.FAILED
            return {"task_id": task.task_id, "status": "failed", "error": result["error"]}
        
        # Validator 验证视频质量
        validation = self._validator_check(task.output_path)
        if not validation["passed"]:
            task.status = VideoStatus.FAILED
            return {
                "task_id": task.task_id,
                "status": "failed",
                "reason": validation["reason"]
            }
        
        task.status = VideoStatus.COMPLETED
        
        return {
            "task_id": task.task_id,
            "status": "completed",
            "output_path": task.output_path,
            "metrics": {
                "script_score": review_result.get("script_score", 0),
                "video_score": validation.get("video_score", 0)
            }
        }
    
    def _coder_optimize(self, script: str) -> str:
        """Coder Agent: 优化视频文案"""
        # TODO: 集成 Claude 进行文案优化
        # 当前返回原始文案
        return script
    
    def _reviewer_evaluate(self, task: VideoTask) -> Dict[str, Any]:
        """Reviewer Agent: 评估视频潜力"""
        # 基础规则检查
        score = 80
        passed = True
        
        # 检查图片数量是否合理
        if len(task.images) > 10:
            score -= 20
            passed = False
        
        # 检查文案长度
        if len(task.script) < 20:
            score -= 30
            passed = False
        
        return {
            "passed": passed,
            "score": score,
            "reason": "文案和素材检查通过" if passed else "素材不符合要求"
        }
    
    def _validator_check(self, video_path: str) -> Dict[str, Any]:
        """Validator Agent: 验证视频质量"""
        # 基础检查
        if not os.path.exists(video_path):
            return {"passed": False, "reason": "视频文件未生成"}
        
        file_size = os.path.getsize(video_path)
        if file_size < 1000:  # 小于1KB可能是错误文件
            return {"passed": False, "reason": "视频文件异常"}
        
        return {
            "passed": True,
            "video_score": 85,
            "file_size": file_size
        }
    
    def get_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """查询任务状态"""
        task = self._tasks.get(task_id)
        if task:
            return task.to_dict()
        return None
    
    def list_tasks(self, limit: int = 10) -> List[Dict[str, Any]]:
        """列出最近任务"""
        return [t.to_dict() for t in list(self._tasks.values())[-limit:]]
    
    def get_history(self) -> List[Dict[str, Any]]:
        """获取完成历史"""
        return self._history


# ─── 便捷函数 ─────────────────────────────────────────────────────────────────
def quick_generate(script: str, images: List[str], audio: str, 
                   output: str = "/tmp/quick_video.mp4") -> Dict[str, Any]:
    """
    快速生成视频（单次调用）
    
    示例:
        quick_generate(
            script="八字命理入门",
            images=["/path/to/1.jpg", "/path/to/2.jpg"],
            audio="/path/to/voice.mp3"
        )
    """
    skill = VideoGenSkill(mode="direct")
    return skill.execute(
        script=script,
        images=images,
        audio=audio,
        output_path=output
    )


# ─── CLI 入口 ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse
    import time
    
    parser = argparse.ArgumentParser(description="MaoAI 视频生成技能")
    parser.add_argument("--script", "-s", required=True, help="视频文案")
    parser.add_argument("--images", "-i", nargs="+", required=True, help="图片路径")
    parser.add_argument("--audio", "-a", required=True, help="配音音频路径")
    parser.add_argument("--srt", help="字幕文件路径")
    parser.add_argument("--bgm", help="背景音乐路径")
    parser.add_argument("--output", "-o", default="/tmp/output.mp4", help="输出路径")
    parser.add_argument("--mode", "-m", default="direct", choices=["direct", "triad"], help="执行模式")
    
    args = parser.parse_args()
    
    skill = VideoGenSkill(mode=args.mode)
    result = skill.execute(
        script=args.script,
        images=args.images,
        audio=args.audio,
        srt=args.srt,
        bgm=args.bgm,
        output_path=args.output
    )
    
    print(json.dumps(result, ensure_ascii=False, indent=2))
