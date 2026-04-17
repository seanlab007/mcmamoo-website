#!/bin/bash
# ============================================================
# Supabase PostgreSQL 直连测试脚本
# 用法: ./test-supabase-connection.sh [PASSWORD]
# ============================================================

set -e

# Supabase 项目信息
PROJECT_REF="fczherphuixpdjuevzsh"
HOST="aws-0-apsoutheast-1.pooler.supabase.com"
PORT="6543"
DATABASE="postgres"
USER="postgres"

if [ -z "$1" ]; then
  echo "用法: $0 [PASSWORD]"
  echo ""
  echo "在 Supabase Dashboard 获取连接信息："
  echo "  https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database"
  exit 1
fi

PASSWORD="$1"

echo "正在测试 Supabase PostgreSQL 直连..."
echo "Host: ${HOST}:${PORT}"
echo "Database: ${DATABASE}"

# 使用 psql 测试连接（需要安装 postgresql 客户端）
if command -v psql &>/dev/null; then
  PGPASSWORD="${PASSWORD}" psql \
    -h "${HOST}" \
    -p "${PORT}" \
    -U "${USER}" \
    -d "${DATABASE}" \
    -c "SELECT version(); SELECT current_database();" \
    && echo "✅ 连接成功！"
else
  # fallback: 用 npx 或 docker 测试
  echo "psql 未安装，尝试用 Docker..."
  docker run --rm \
    -e PGPASSWORD="${PASSWORD}" \
    postgres:16 \
    psql -h "${HOST}" -p "${PORT}" -U "${USER}" -d "${DATABASE}" \
    -c "SELECT 1 AS connected;"
fi
