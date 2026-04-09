#!/bin/bash
# MaoAI 本地一键启动脚本
# 用法：终端运行 ./start-maoai.sh 或双击运行

PROJECT_DIR="/Users/mac/Desktop/mcmamoo-website"
LOG_FILE="/tmp/maoai-server.log"
PORT=3000

# 检查是否已在运行
if lsof -i :$PORT -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then
    echo "✅ MaoAI 已在运行 → http://localhost:$PORT"
    open "http://localhost:$PORT"
    exit 0
fi

# 检查 .env 文件，缺失则从模板创建
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "📄 创建 .env 配置文件..."
    cat > "$PROJECT_DIR/.env" << 'ENVFILE'
# Mc&Mamoo Website - Environment Variables
PORT=3000

# Supabase
SUPABASE_URL=https://fczherphuixpdjuevzsh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDM0OTEsImV4cCI6MjA4OTIxOTQ5MX0.t7FSUWbWDsKIcU-m-1ul65aVVu87RZn0zHleqccDEo4
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg

# JWT Secret
JWT_SECRET=change-this-to-a-secure-random-string-in-production

# Owner email (admin)
OWNER_EMAIL=benedictashford20@gmail.com

# Vite client vars
VITE_SUPABASE_URL=https://fczherphuixpdjuevzsh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDM0OTEsImV4cCI6MjA4OTIxOTQ5MX0.t7FSUWbWDsKIcU-m-1ul65aVVu87RZn0zHleqccDEo4

# Backend URL
VITE_BACKEND_URL=http://localhost:3000

# Umami Analytics (本地开发禁用)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
ENVFILE
    echo "✅ .env 已创建"
fi

# 检查依赖是否安装
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo "📦 安装依赖..."
    cd "$PROJECT_DIR" && pnpm install
fi

# 启动服务
cd "$PROJECT_DIR"
echo "🚀 启动 MaoAI..."
nohup pnpm dev > "$LOG_FILE" 2>&1 &
PID=$!

# 等待服务就绪
echo "⏳ 等待服务启动（约 15 秒）..."
for i in $(seq 1 30); do
    if lsof -i :$PORT -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then
        echo ""
        echo "✅ MaoAI 启动成功！PID=$PID"
        echo "🔗 http://localhost:$PORT"
        open "http://localhost:$PORT"
        exit 0
    fi
    sleep 1
    printf "\r⏳ %ds..." "$i"
done

echo ""
echo "❌ 启动超时，请查看日志：$LOG_FILE"
tail -20 "$LOG_FILE"
