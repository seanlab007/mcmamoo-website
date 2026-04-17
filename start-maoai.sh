#!/bin/bash
# MaoAI 本地启动脚本
# 关键：必须用 --require preload.cjs 预加载 dotenv，否则环境变量加载失败导致登录失败

cd "$(dirname "$0")"

# 杀掉旧进程
pkill -f "tsx.*server/_core" 2>/dev/null
sleep 1

# 启动服务
echo "🚀 启动 MaoAI 服务..."
npx tsx --require ./server/_core/preload.cjs server/_core/index.ts > /tmp/maoai.log 2>&1 &
echo "PID=$!"

sleep 5
echo "✅ 服务已启动: http://localhost:3000"
echo "📋 查看日志: tail -f /tmp/maoai.log"
