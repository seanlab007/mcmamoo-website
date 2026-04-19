"""
FaceFusion API 路由
猫眼内容平台 - AI 面部融合模块
"""

import os
import uuid
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

router = APIRouter(prefix="/api/facefusion", tags=["facefusion"])

# 任务存储（生产环境应使用 Redis）
tasks_db: dict = {}


class SubmitTaskRequest(BaseModel):
    sourceImage: str
    targetImage: Optional[str] = None
    targetVideo: Optional[str] = None
    mode: str = "face_swap"
    faceMasker: Optional[str] = "occlusion"
    faceEnhancerModel: Optional[str] = "gfpgan"
    lipSyncerModel: Optional[str] = "wav2lip"
    webhookUrl: Optional[str] = None


class TaskStatus(BaseModel):
    taskId: str
    status: str  # idle, preparing, processing, completed, failed
    progress: int  # 0-100
    resultUrl: Optional[str] = None
    error: Optional[str] = None
    createdAt: str
    completedAt: Optional[str] = None


@router.get("/status")
async def get_system_status():
    """获取系统状态"""
    return {
        "success": True,
        "data": {
            "gpuAvailable": True,
            "gpuName": "NVIDIA GPU",
            "gpuMemory": "8GB",
            "modelsReady": True,
            "modelsCount": 5,
            "version": "3.1.1"
        }
    }


@router.post("/submit")
async def submit_task(request: SubmitTaskRequest):
    """提交面部融合任务"""
    task_id = str(uuid.uuid4())

    task = TaskStatus(
        taskId=task_id,
        status="preparing",
        progress=0,
        createdAt=datetime.now().isoformat()
    )
    tasks_db[task_id] = task.model_dump()

    # 后台处理
    asyncio.create_task(process_facefusion_task(task_id, request))

    return {
        "success": True,
        "data": {"taskId": task_id}
    }


async def process_facefusion_task(task_id: str, request: SubmitTaskRequest):
    """后台处理 FaceFusion 任务"""
    task = tasks_db[task_id]

    try:
        task["status"] = "processing"
        task["progress"] = 10

        # TODO: 集成 FaceFusion SDK
        # 这里是与真实 FaceFusion 集成的占位逻辑

        # 1. 下载源图片
        task["progress"] = 20

        # 2. 下载目标图片/视频
        task["progress"] = 40

        # 3. 执行面部融合
        task["progress"] = 70

        # 4. 生成结果
        output_dir = os.path.join(os.path.dirname(__file__), "..", "output", "facefusion")
        os.makedirs(output_dir, exist_ok=True)
        result_path = f"/output/facefusion/{task_id}.jpg"

        task["status"] = "completed"
        task["progress"] = 100
        task["resultUrl"] = result_path
        task["completedAt"] = datetime.now().isoformat()

    except Exception as e:
        task["status"] = "failed"
        task["error"] = str(e)


@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """获取任务状态"""
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="任务不存在")

    return {
        "success": True,
        "data": tasks_db[task_id]
    }


@router.post("/cancel/{task_id}")
async def cancel_task(task_id: str):
    """取消任务"""
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = tasks_db[task_id]
    if task["status"] in ["completed", "failed"]:
        raise HTTPException(status_code=400, detail="任务已完成或失败，无法取消")

    task["status"] = "failed"
    task["error"] = "用户取消"

    return {"success": True, "message": "任务已取消"}


@router.get("/tasks")
async def get_task_list():
    """获取任务列表"""
    return {
        "success": True,
        "data": list(tasks_db.values())
    }


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """删除任务"""
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="任务不存在")

    del tasks_db[task_id]

    return {"success": True, "message": "任务已删除"}


@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """上传图片"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只支持图片文件")

    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "images")
    os.makedirs(upload_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    file_path = os.path.join(upload_dir, f"{file_id}{ext}")

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "success": True,
        "data": {
            "id": file_id,
            "url": f"/uploads/images/{file_id}{ext}",
            "name": file.filename
        }
    }


@router.post("/upload/video")
async def upload_video(file: UploadFile = File(...)):
    """上传视频"""
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="只支持视频文件")

    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "videos")
    os.makedirs(upload_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] if file.filename else ".mp4"
    file_path = os.path.join(upload_dir, f"{file_id}{ext}")

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "success": True,
        "data": {
            "id": file_id,
            "url": f"/uploads/videos/{file_id}{ext}",
            "name": file.filename
        }
    }
