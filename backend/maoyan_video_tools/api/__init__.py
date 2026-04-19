"""
Maoyan Video Tools API - FastAPI 入口
"""

import os, logging
from .routes import create_app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

app = create_app(
    workspace_dir=os.getenv("WORKSPACE_DIR", "./workspace"),
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    dashscope_key=os.getenv("DASHSCOPE_API_KEY"),
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
