#!/usr/bin/env python3
"""
Maoyan Video Tools - FastAPI 启动脚本
猫眼内容平台视频工具微服务

使用方法:
    python main.py                      # 本地模式
    python main.py --mode cloud        # 云端模式
    python main.py --port 8080         # 自定义端口
    python main.py --workspace /data   # 自定义工作目录
"""

import argparse
import logging
import os
import sys

# 添加 backend 目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from maoyan_video_tools.api.routes import create_app

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Maoyan Video Tools API Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python main.py
    python main.py --port 8080
    python main.py --mode cloud --workspace /data/video
    python main.py --openai-key sk-xxx --dashscope-key sk-xxx
        """,
    )
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=int(os.getenv("VIDEO_API_PORT", "8080")),
        help="服务端口 (default: 8080)",
    )
    parser.add_argument(
        "--host", "-h",
        type=str,
        default=os.getenv("VIDEO_API_HOST", "0.0.0.0"),
        help="服务地址 (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--mode", "-m",
        type=str,
        choices=["local", "cloud"],
        default=os.getenv("RUN_MODE", "local"),
        help="运行模式 local/cloud (default: local)",
    )
    parser.add_argument(
        "--workspace", "-w",
        type=str,
        default=os.getenv("VIDEO_WORKSPACE", "./workspace/video"),
        help="工作目录 (default: ./workspace/video)",
    )
    parser.add_argument(
        "--openai-key",
        type=str,
        default=os.getenv("OPENAI_API_KEY"),
        help="OpenAI API Key",
    )
    parser.add_argument(
        "--dashscope-key",
        type=str,
        default=os.getenv("DASHSCOPE_API_KEY"),
        help="阿里 DashScope API Key",
    )
    parser.add_argument(
        "--reload", "-r",
        action="store_true",
        help="启用热重载 (开发模式)",
    )
    parser.add_argument(
        "--workers", "-n",
        type=int,
        default=1,
        help="Worker 进程数 (default: 1)",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    # 确保工作目录存在
    os.makedirs(args.workspace, exist_ok=True)

    # 创建 FastAPI 应用
    app = create_app(
        workspace_dir=args.workspace,
        openai_api_key=args.openai_key,
        dashscope_key=args.dashscope_key,
    )

    # 导入 uvicorn
    import uvicorn

    logger.info("=" * 60)
    logger.info("  Maoyan Video Tools API")
    logger.info("=" * 60)
    logger.info(f"  Mode:     {args.mode}")
    logger.info(f"  Workspace: {args.workspace}")
    logger.info(f"  Host:     {args.host}")
    logger.info(f"  Port:     {args.port}")
    logger.info("=" * 60)

    # 启动服务
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers,
        log_level="info",
    )


if __name__ == "__main__":
    main()
