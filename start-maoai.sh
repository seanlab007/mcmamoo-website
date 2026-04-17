#!/bin/bash
# ============================================================
# MaoAI 3.0 自动清理并启动脚本（非阻塞版本）
# ============================================================
# 解决问题：端口被僵尸进程占用导致天天手动 kill -9
# 策略：启动前自动清理所有相关端口，后台启动服务后立即退出
# 用法：
#   ./start-maoai.sh        # 启动
#   ./stop-maoai.sh         # 停止
# ============================================================

cd "$(dirname "$0")"

# ── 端口配置 ──
PORTS=(3000 3001 5000 8000 8765)

# ── 颜色 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  MaoAI 3.0 — 自动清理并启动${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── [1/3] 清理端口 ──
echo ""
echo -e "${YELLOW}🧹 [1/3] 扫描并清理端口...${NC}"

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti :${PORT} -sTCP:LISTEN 2>/dev/null)
  if [ -n "$PID" ]; then
    echo -e "  ${RED}✗ 端口 ${PORT} 被占用 PID=${PID}，正在清理...${NC}"
    kill -9 $PID 2>/dev/null
    # 二次确认，fuser 兜底
    sleep 0.3
    PID_CHECK=$(lsof -ti :${PORT} -sTCP:LISTEN 2>/dev/null)
    if [ -n "$PID_CHECK" ]; then
      fuser -k ${PORT}/tcp 2>/dev/null
    fi
  else
    echo -e "  ${GREEN}✓ 端口 ${PORT} 空闲${NC}"
  fi
done

# 清理残留 tsx/vite 进程（仅本项目相关）
pkill -f "tsx.*server/_core" 2>/dev/null && echo -e "  ${GREEN}✓ 已清理 tsx server 进程${NC}"
pkill -f "node.*vite" 2>/dev/null && echo -e "  ${GREEN}✓ 已清理 vite dev 进程${NC}"

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
