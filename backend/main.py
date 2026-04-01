"""
Maoyan Video Tools - FastAPI 主入口
猫眼内容平台 视频处理后端
本地 / 云端 双轨运行
"""

import os
from maoyan_video_tools.api.routes import create_app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
