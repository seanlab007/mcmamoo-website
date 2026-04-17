#!/bin/bash
# ============================================================
# MaoAI 3.0 停止脚本 — 一键停止所有服务
# ============================================================

PORTS=(3000 3001 5000 8000 8765)

echo "🛑 正在停止 MaoAI 服务..."

# 方式1：从 PID 文件停止
if [ -f /tmp/maoai-pids ]; then
  PIDS=$(cat /tmp/maoai-pids)
  for PID in $PIDS; do
    if kill -0 $PID 2>/dev/null; then
      kill $PID 2>/dev/null
      echo "  ✓ 已停止 PID=${PID}"
    fi
  done
  rm -f /tmp/maoai-pids
fi

# 方式2：兜底清理端口占用
for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti :${PORT} -sTCP:LISTEN 2>/dev/null)
  if [ -n "$PID" ]; then
    kill -9 $PID 2>/dev/null
    echo "  ✓ 端口 ${PORT} 进程已清理 (PID=${PID})"
  fi
done

# 清理残留 tsx 进程
pkill -f "tsx.*server/_core" 2>/dev/null && echo "  ✓ tsx server 已清理"
pkill -f "node.*vite" 2>/dev/null && echo "  ✓ vite dev 已清理"

echo "✅ MaoAI 服务已全部停止"
