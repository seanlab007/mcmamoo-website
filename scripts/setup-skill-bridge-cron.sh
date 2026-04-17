#!/bin/bash
# setup-skill-bridge-cron.sh
#
# 在服务器上设置 skill-bridge 定时同步 (crontab)
# 用法: bash scripts/setup-skill-bridge-cron.sh [interval_minutes]
# 默认: 每 30 分钟同步一次
#
# 也可通过 PM2 module (pm2-cron) 实现更精细的进程管理。

set -e

INTERVAL="${1:-30}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BRIDGE_SCRIPT="$PROJECT_DIR/scripts/skill-bridge.mjs"
LOG_FILE="$PROJECT_DIR/logs/skill-bridge-cron.log"

# 确保日志目录存在
mkdir -p "$PROJECT_DIR/logs"

# 检查 skill-bridge 脚本是否存在
if [ ! -f "$BRIDGE_SCRIPT" ]; then
  echo "❌ skill-bridge.mjs not found at $BRIDGE_SCRIPT"
  exit 1
fi

# 检查 node 是否可用
if ! command -v node &> /dev/null; then
  echo "❌ node not found in PATH"
  exit 1
fi

# 获取当前 crontab 条目
CRON_CMD="*/${INTERVAL} * * * * cd $PROJECT_DIR && /usr/bin/env node scripts/skill-bridge.mjs >> $LOG_FILE 2>&1"
CRON_MARKER="# SKILL-BRIDGE-AUTO-SYNC"

echo "🔧 Setting up skill-bridge cron sync..."
echo "   Interval: every ${INTERVAL} minutes"
echo "   Script:   $BRIDGE_SCRIPT"
echo "   Log:      $LOG_FILE"

# 移除旧的同名 cron 条目
(crontab -l 2>/dev/null | grep -v "$CRON_MARKER") | crontab -

# 添加新条目
(crontab -l 2>/dev/null; echo "$CRON_MARKER"; echo "$CRON_CMD") | crontab -

echo "✅ Cron job installed. Current crontab:"
echo "---"
crontab -l | grep -A1 "SKILL-BRIDGE" || echo "(no entries found)"
echo "---"
echo ""
echo "📊 View logs:  tail -f $LOG_FILE"
echo "🗑  Remove:     crontab -l | grep -v 'SKILL-BRIDGE' | crontab -"
