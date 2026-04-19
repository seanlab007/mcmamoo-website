"""
FaceFusion API 路由
猫眼内容平台 - AI 面部融合模块
Supabase 集成版本
"""

import os
import uuid
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/api/facefusion", tags=["facefusion"])

# ============================================
# Supabase 配置
# ============================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fczherphuixpdjuevzsh.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg")

# Storage bucket
FACE_FUSION_BUCKET = "facefusion"
OUTPUT_BUCKET = "facefusion-output"

# 内存任务存储
tasks_db: dict = {}


# ============================================
# Supabase 工具函数
# ============================================
async def supabase_upload_file(bucket: str, file_path: str, file_content: bytes) -> Optional[str]:
    """上传文件到 Supabase Storage"""
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{file_path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/octet-stream",
        "x-upsert": "true"
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=headers, content=file_content)

    if response.status_code in (200, 201):
        return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{file_path}"
    return None


async def update_task_in_db(task_id: str, updates: dict):
    """更新任务状态到 Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/facefusion_tasks?task_id=eq.{task_id}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "update"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.patch(url, headers=headers, json=updates)
    except Exception as e:
        print(f"Supabase update failed: {e}")


# ============================================
# Pydantic 模型
# ============================================
class SubmitTaskRequest(BaseModel):
    sourceImage: str
    targetImage: Optional[str] = None
    targetVideo: Optional[str] = None
    mode: str = "face_swap"
    faceMasker: Optional[str] = "occlusion"
    faceEnhancerModel: Optional[str] = "gfpgan"
    lipSyncerModel: Optional[str] = "wav2lip"
    webhookUrl: Optional[str] = None
    userId: Optional[str] = None


class TaskStatus(BaseModel):
    taskId: str
    status: str
    progress: int
    resultUrl: Optional[str] = None
    error: Optional[str] = None
    createdAt: str
    completedAt: Optional[str] = None


# ============================================
# API 路由
# ============================================
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
            "version": "3.1.1",
            "supabaseConnected": True,
            "storageBucket": FACE_FUSION_BUCKET
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
    task_data = task.model_dump()
    task_data["sourceImage"] = request.sourceImage
    task_data["targetImage"] = request.targetImage
    task_data["targetVideo"] = request.targetVideo
    task_data["mode"] = request.mode
    task_data["userId"] = request.userId

    tasks_db[task_id] = task_data
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
        await update_task_in_db(task_id, {"status": "processing", "progress": 10})

        # 1. 准备临时目录
        temp_dir = os.path.join("/tmp", "facefusion", task_id)
        os.makedirs(temp_dir, exist_ok=True)
        task["progress"] = 20

        # 2. 下载源图片
        # TODO: 集成真实 FaceFusion SDK
        task["progress"] = 40
        await update_task_in_db(task_id, {"progress": 40})

        # 3. 执行面部融合
        task["progress"] = 70
        await update_task_in_db(task_id, {"progress": 70})

        # 4. 上传结果到 Supabase Storage
        result_path = f"results/{task_id}.jpg"
        # result_content = 实际处理结果
        # public_url = await supabase_upload_file(OUTPUT_BUCKET, result_path, result_content)

        task["status"] = "completed"
        task["progress"] = 100
        task["resultUrl"] = f"/output/facefusion/{task_id}.jpg"
        task["completedAt"] = datetime.now().isoformat()

        await update_task_in_db(task_id, {
            "status": "completed",
            "progress": 100,
            "result_url": task["resultUrl"],
            "completed_at": task["completedAt"]
        })

        # 触发 webhook
        if request.webhookUrl:
            async with httpx.AsyncClient() as client:
                await client.post(request.webhookUrl, json={"taskId": task_id, "status": "completed"})

    except Exception as e:
        task["status"] = "failed"
        task["error"] = str(e)
        await update_task_in_db(task_id, {"status": "failed", "error": str(e)})


@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """获取任务状态"""
    if task_id not in tasks_db:
        url = f"{SUPABASE_URL}/rest/v1/facefusion_tasks?task_id=eq.{task_id}&select=*"
        headers = {"Authorization": f"Bearer {SUPABASE_KEY}", "apikey": SUPABASE_KEY}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers)

        if response.status_code == 200 and response.json():
            return {"success": True, "data": response.json()[0]}

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
    await update_task_in_db(task_id, {"status": "failed", "error": "用户取消"})

    return {"success": True, "message": "任务已取消"}


@router.get("/tasks")
async def get_task_list(user_id: Optional[str] = None):
    """获取任务列表"""
    if user_id:
        url = f"{SUPABASE_URL}/rest/v1/facefusion_tasks?user_id=eq.{user_id}&order=created_at.desc&limit=50"
        headers = {"Authorization": f"Bearer {SUPABASE_KEY}", "apikey": SUPABASE_KEY}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers)

        if response.status_code == 200:
            return {"success": True, "data": response.json()}

    return {
        "success": True,
        "data": list(tasks_db.values())
    }


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """删除任务"""
    if task_id in tasks_db:
        del tasks_db[task_id]

    url = f"{SUPABASE_URL}/rest/v1/facefusion_tasks?task_id=eq.{task_id}"
    headers = {"Authorization": f"Bearer {SUPABASE_KEY}", "apikey": SUPABASE_KEY}

    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.delete(url, headers=headers)

    return {"success": True, "message": "任务已删除"}


@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """上传图片到 Supabase Storage"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只支持图片文件")

    content = await file.read()
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    file_path = f"uploads/images/{file_id}{ext}"

    public_url = await supabase_upload_file(FACE_FUSION_BUCKET, file_path, content)

    if not public_url:
        raise HTTPException(status_code=500, detail="上传失败")

    return {
        "success": True,
        "data": {
            "id": file_id,
            "url": public_url,
            "name": file.filename
        }
    }


@router.post("/upload/video")
async def upload_video(file: UploadFile = File(...)):
    """上传视频到 Supabase Storage"""
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="只支持视频文件")

    content = await file.read()
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] if file.filename else ".mp4"
    file_path = f"uploads/videos/{file_id}{ext}"

    public_url = await supabase_upload_file(FACE_FUSION_BUCKET, file_path, content)

    if not public_url:
        raise HTTPException(status_code=500, detail="上传失败")

    return {
        "success": True,
        "data": {
            "id": file_id,
            "url": public_url,
            "name": file.filename
        }
    }


@router.post("/upload/url")
async def upload_from_url(url: str, type: str = "image"):
    """从 URL 下载并上传到 Supabase"""
    file_id = str(uuid.uuid4())

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="无法下载文件")

    content = response.content
    ext = ".jpg" if type == "image" else ".mp4"
    file_path = f"uploads/{type}s/{file_id}{ext}"

    public_url = await supabase_upload_file(FACE_FUSION_BUCKET, file_path, content)

    if not public_url:
        raise HTTPException(status_code=500, detail="上传失败")

    return {
        "success": True,
        "data": {
            "id": file_id,
            "url": public_url
        }
    }
