#!/bin/bash
# MaoAI 3.0 「破壁者」一键启动脚本 (Manus Sandbox v3.0)
# --------------------------------------------------

PROJECT_DIR="/home/ubuntu/mcmamoo-website"
FRONTEND_PORT=3000
BACKEND_PORT=5000

cd $PROJECT_DIR || exit

echo "🚀 [MaoAI] 正在启动系统..."

# 1. 清理旧进程
echo "🧹 [1/5] 清理旧进程 (端口 $FRONTEND_PORT, $BACKEND_PORT)..."
lsof -ti :$FRONTEND_PORT,:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
sleep 2

# 2. 创建/验证 .env 文件
echo "📄 [2/5] 检查 .env 配置文件..."
if [ ! -f ".env" ]; then
    echo "  -> .env 文件不存在，正在从模板创建..."
    cat > .env << EOF
# 自动生成的 .env 文件 for MaoAI Sandbox

# 后端服务端口
PORT=$BACKEND_PORT

# Supabase (使用本地模拟值)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=dummy_key_for_local_dev
SUPABASE_ANON_KEY=dummy_key_for_local_dev

# GitHub Token (从用户需求中获取)
GITHUB_TOKEN=

# 管理员 Token
ADMIN_TOKEN=maoai_admin_2026

# JWT Secret
JWT_SECRET=a-very-secret-jwt-token-for-dev

# Vite 前端环境变量
VITE_BACKEND_URL=http://localhost:$BACKEND_PORT
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=dummy_key_for_local_dev
EOF
    echo "  -> ✅ .env 已创建。"
else
    echo "  -> ✅ .env 文件已存在。"
fi

# 3. 检查并安装依赖
echo "📦 [3/5] 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "  -> 正在安装 pnpm 依赖..."
    pnpm install
else
    echo "  -> ✅ pnpm 依赖已安装。"
fi

# 4. 启动后端和前端服务
echo "🚀 [4/5] 启动后端 (Express) 和前端 (Vite)..."
nohup pnpm dev > backend.log 2>&1 &
BACKEND_PID=$!
nohup pnpm dev:frontend > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "  -> 后端 PID: $BACKEND_PID"
echo "  -> 前端 PID: $FRONTEND_PID"

# 5. 等待并验证服务
echo "⏳ [5/5] 等待服务就绪 (最多30秒)..."
MAX_RETRIES=30
COUNT=0
while ! netstat -tuln | grep -q ":$FRONTEND_PORT" || ! netstat -tuln | grep -q ":$BACKEND_PORT"; do
    sleep 1
    COUNT=$((COUNT+1))
    printf "\r⏳ %ds..." "$COUNT"
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "\n❌ [错误] 服务启动超时！"
        echo "--- 后端日志 (backend.log) ---"
        tail -n 20 backend.log
        echo "--- 前端日志 (frontend.log) ---"
        tail -n 20 frontend.log
        exit 1
    fi
done

echo "\n✅ [成功] MaoAI 3.0 已就绪！"
echo "--------------------------------------------------"
echo "  - 前端访问 -> http://localhost:$FRONTEND_PORT"
echo "  - 后端 API -> http://localhost:$BACKEND_PORT"
echo "--------------------------------------------------"
