#!/bin/bash
# ============================================================
# MaoAI 3.0 安全启动脚本
# ============================================================
# 核心原则：
#   - 绝不使用 pkill -f（会误杀 WorkBuddy 等其他进程）
#   - 绝不批量 kill -9（先 SIGTERM 等 3 秒，迫不得已才 SIGKILL）
#   - 只清理属于 mcmamoo-website 项目的进程
# 用法：
#   ./start-maoai.sh        # 启动
#   ./stop-maoai.sh         # 停止
# ============================================================

cd "$(dirname "$0")"

# ── 端口配置 ──
PORTS=(3000 3001 5000 8000 8765)
PROJECT_DIR="$(pwd)"

# ── 颜色 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  MaoAI 3.0 — 安全启动${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── [1/3] 安全清理端口 ──
echo ""
echo -e "${YELLOW}🧹 [1/3] 安全扫描并清理端口...${NC}"

for PORT in "${PORTS[@]}"; do
  PIDS=$(lsof -ti :${PORT} -sTCP:LISTEN 2>/dev/null)
  if [ -z "$PIDS" ]; then
    echo -e "  ${GREEN}✓ 端口 ${PORT} 空闲${NC}"
    continue
  fi

  for PID in $PIDS; do
    # 验证进程属于 mcmamoo-website，跳过其他项目的进程（如 WorkBuddy）
    PROC_CWD=$(lsof -p $PID -Fn 2>/dev/null | grep "^n.*mcmamoo" | head -1 | sed 's/^n//')
    PROC_CMD=$(ps -p $PID -o command= 2>/dev/null)

    if [ -z "$PROC_CWD" ] && ! echo "$PROC_CMD" | grep -q "mcmamoo"; then
      echo -e "  ${YELLOW}⏭ 端口 ${PORT} PID=${PID} 不属于 mcmamoo-website，跳过${NC}"
      continue
    fi

    # 先 SIGTERM，等待 3 秒优雅退出
    echo -e "  ${YELLOW}🔄 端口 ${PORT} PID=${PID}，发送 SIGTERM...${NC}"
    kill $PID 2>/dev/null

    WAITED=0
    while [ $WAITED -lt 3 ]; do
      if ! kill -0 $PID 2>/dev/null; then
        echo -e "  ${GREEN}✓ PID=${PID} 已正常退出${NC}"
        break
      fi
      sleep 1
      WAITED=$((WAITED + 1))
    done

    # 迫不得已才 SIGKILL
    if kill -0 $PID 2>/dev/null; then
      echo -e "  ${RED}⚠ PID=${PID} 未响应 SIGTERM，发送 SIGKILL${NC}"
      kill -9 $PID 2>/dev/null
      echo -e "  ${RED}✗ PID=${PID} 已强制终止${NC}"
    fi
  done
done

sleep 1

# ── [2/3] 启动后端服务 ──
echo ""
echo -e "${YELLOW}🚀 [2/3] 启动 MaoAI 后端服务...${NC}"
nohup npx tsx --require ./server/_core/preload.cjs server/_core/index.ts > /tmp/maoai.log 2>&1 &
BACKEND_PID=$!
echo -e "  后端 PID: ${CYAN}${BACKEND_PID}${NC}"

# ── [3/3] 启动前端开发服务器 ──
echo ""
echo -e "${YELLOW}🚀 [3/3] 启动前端开发服务器...${NC}"
nohup npx vite --port 3000 > /tmp/maoai-frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "  前端 PID: ${CYAN}${FRONTEND_PID}${NC}"

# 保存 PID 到文件，方便 stop 脚本使用
echo "${BACKEND_PID} ${FRONTEND_PID}" > /tmp/maoai-pids

# ── 完成 ──
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ MaoAI 3.0 已后台启动${NC}"
echo -e "  🌐 前端: ${CYAN}http://localhost:3000${NC}"
echo -e "  🔧 后端: ${CYAN}http://localhost:8000${NC}"
echo -e "  📋 后端日志: ${CYAN}tail -f /tmp/maoai.log${NC}"
echo -e "  📋 前端日志: ${CYAN}tail -f /tmp/maoai-frontend.log${NC}"
echo -e "  🛑 停止服务: ${CYAN}./stop-maoai.sh${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
