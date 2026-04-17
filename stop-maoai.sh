#!/bin/bash
# ============================================================
# MaoAI 3.0 安全停止脚本
# ============================================================
# 核心原则：
#   - 绝不使用 pkill -f（会误杀 WorkBuddy 等其他进程）
#   - 绝不批量 kill -9（先 SIGTERM 等 3 秒，迫不得已才 SIGKILL）
#   - 只停止属于 mcmamoo-website 项目的进程
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORTS=(3000 3001 5000 8000 8765)

echo "🛑 正在安全停止 MaoAI 服务..."

# ── 方式1：从 PID 文件停止（最安全） ──
if [ -f /tmp/maoai-pids ]; then
  for PID in $(cat /tmp/maoai-pids); do
    if kill -0 $PID 2>/dev/null; then
      # 先 SIGTERM
      kill $PID 2>/dev/null
      echo "  🔄 SIGTERM -> PID=${PID}"

      # 等 3 秒
      WAITED=0
      while [ $WAITED -lt 3 ]; do
        if ! kill -0 $PID 2>/dev/null; then
          echo "  ✓ PID=${PID} 已正常退出"
          break
        fi
        sleep 1
        WAITED=$((WAITED + 1))
      done

      # 迫不得已才 SIGKILL
      if kill -0 $PID 2>/dev/null; then
        kill -9 $PID 2>/dev/null
        echo "  ⚠ PID=${PID} 已强制终止"
      fi
    fi
  done
  rm -f /tmp/maoai-pids
fi

# ── 方式2：兜底清理端口占用（仅 mcmamoo-website 进程） ──
for PORT in "${PORTS[@]}"; do
  PIDS=$(lsof -ti :${PORT} -sTCP:LISTEN 2>/dev/null)
  if [ -z "$PIDS" ]; then
    continue
  fi

  for PID in $PIDS; do
    # 验证进程属于 mcmamoo-website，跳过其他项目
    PROC_CWD=$(lsof -p $PID -Fn 2>/dev/null | grep "^n.*mcmamoo" | head -1 | sed 's/^n//')
    PROC_CMD=$(ps -p $PID -o command= 2>/dev/null)

    if [ -z "$PROC_CWD" ] && ! echo "$PROC_CMD" | grep -q "mcmamoo"; then
      echo "  ⏭ 端口 ${PORT} PID=${PID} 不属于 mcmamoo-website，跳过"
      continue
    fi

    # 先 SIGTERM
    kill $PID 2>/dev/null
    echo "  🔄 SIGTERM -> 端口 ${PORT} PID=${PID}"

    # 等 3 秒
    WAITED=0
    while [ $WAITED -lt 3 ]; do
      if ! kill -0 $PID 2>/dev/null; then
        echo "  ✓ 端口 ${PORT} PID=${PID} 已正常退出"
        break
      fi
      sleep 1
      WAITED=$((WAITED + 1))
    done

    # 迫不得已才 SIGKILL
    if kill -0 $PID 2>/dev/null; then
      kill -9 $PID 2>/dev/null
      echo "  ⚠ 端口 ${PORT} PID=${PID} 已强制终止"
    fi
  done
done

echo "✅ MaoAI 服务已安全停止"
