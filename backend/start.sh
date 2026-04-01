#!/bin/bash
# Maoyan Video Tools - 本地启动脚本
set -e

echo "检查依赖..."
if ! command -v ffmpeg &> /dev/null; then
    echo "[错误] 需要 ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Linux: sudo apt install ffmpeg"
    exit 1
fi

if [ ! -d ".venv" ]; then
    python3 -m venv .venv && echo "虚拟环境已创建"
fi

source .venv/bin/activate
pip install -r requirements.txt

mkdir -p uploads clips subtitles tts output downloads

echo "启动 Maoyan Video Tools (http://localhost:8080)..."
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
