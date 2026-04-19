#!/bin/bash
#
# 本地混合模式启动脚本
# 一键启动：Ollama + MaoAI + WorkBuddy/OpenClaw 节点注册
#
# 使用方法：
#   chmod +x start-local-hybrid.sh
#   ./start-local-hybrid.sh
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
MAOAI_DIR="/Users/daiyan/Desktop/mcmamoo-website"
OLLAMA_URL="http://127.0.0.1:11434"
MAOAI_URL="http://localhost:3000"
NODE_REGISTRATION_TOKEN="${NODE_REGISTRATION_TOKEN:-maoai-local-token-2026}"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         MaoAI 本地混合模式启动器 (Local Hybrid Mode)          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查依赖
check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}✗ $1 未安装${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 已安装${NC}"
        return 0
    fi
}

echo -e "\n${YELLOW}▶ 检查依赖...${NC}"
check_dependency "ollama" || { echo "请安装 Ollama: https://ollama.ai"; exit 1; }
check_dependency "node" || { echo "请安装 Node.js"; exit 1; }
check_dependency "pnpm" || { echo "请安装 pnpm: npm install -g pnpm"; exit 1; }

# 检查 Ollama 运行状态
echo -e "\n${YELLOW}▶ 检查 Ollama 状态...${NC}"
if curl -s "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama 运行中 ($OLLAMA_URL)${NC}"
    echo -e "${BLUE}  可用模型:${NC}"
    curl -s "$OLLAMA_URL/api/tags" | grep -o '"name":"[^"]*"' | head -5 | sed 's/"name":"/    - /;s/"//'
else
    echo -e "${YELLOW}⚠ Ollama 未运行，尝试启动...${NC}"
    ollama serve &
    sleep 3
    if curl -s "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Ollama 启动成功${NC}"
    else
        echo -e "${RED}✗ Ollama 启动失败，请手动启动: ollama serve${NC}"
        exit 1
    fi
fi

# 检查环境变量
echo -e "\n${YELLOW}▶ 检查环境变量...${NC}"
if [ -f "$MAOAI_DIR/.env.local" ]; then
    echo -e "${GREEN}✓ .env.local 存在${NC}"
    export $(grep -v '^#' "$MAOAI_DIR/.env.local" | xargs) 2>/dev/null || true
else
    echo -e "${YELLOW}⚠ .env.local 不存在，使用默认配置${NC}"
    cat > "$MAOAI_DIR/.env.local" << EOF
# 本地 Ollama 配置
OLLAMA_BASE_URL=http://127.0.0.1:11434
NODE_REGISTRATION_TOKEN=$NODE_REGISTRATION_TOKEN

# 可选：云端 API Keys（用于混合模式）
# DEEPSEEK_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GEMINI_API_KEY=AIzaSy...
EOF
    echo -e "${GREEN}✓ 已创建 .env.local${NC}"
fi

# 启动 MaoAI
echo -e "\n${YELLOW}▶ 启动 MaoAI...${NC}"
cd "$MAOAI_DIR"

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}  安装依赖...${NC}"
    pnpm install
fi

# 启动开发服务器
echo -e "${BLUE}  启动开发服务器 (端口 3000)...${NC}"
pnpm dev &
MAOAI_PID=$!

# 等待 MaoAI 启动
echo -e "${BLUE}  等待 MaoAI 就绪...${NC}"
for i in {1..30}; do
    if curl -s "$MAOAI_URL/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MaoAI 启动成功 ($MAOAI_URL)${NC}"
        break
    fi
    sleep 1
    echo -n "."
done

if ! curl -s "$MAOAI_URL/api/health" > /dev/null 2>&1; then
    echo -e "\n${RED}✗ MaoAI 启动超时${NC}"
    kill $MAOAI_PID 2>/dev/null || true
    exit 1
fi

# 注册 WorkBuddy 节点（如果 WorkBuddy 正在运行）
echo -e "\n${YELLOW}▶ 检查 WorkBuddy...${NC}"
if curl -s "http://localhost:8080/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ WorkBuddy 运行中，注册节点...${NC}"
    cd "$MAOAI_DIR"
    npx ts-node scripts/register-workbuddy-node.ts &
else
    echo -e "${YELLOW}⚠ WorkBuddy 未运行，跳过注册${NC}"
    echo -e "${BLUE}  如需注册，请启动 WorkBuddy 后运行:${NC}"
    echo -e "${BLUE}    npx ts-node scripts/register-workbuddy-node.ts${NC}"
fi

# 注册 OpenClaw 节点（如果 OpenClaw 正在运行）
echo -e "\n${YELLOW}▶ 检查 OpenClaw...${NC}"
if curl -s "http://localhost:5000/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OpenClaw 运行中，注册节点...${NC}"
    cd "$MAOAI_DIR"
    npx ts-node scripts/register-openclaw-node.ts &
else
    echo -e "${YELLOW}⚠ OpenClaw 未运行，跳过注册${NC}"
    echo -e "${BLUE}  如需注册，请启动 OpenClaw 后运行:${NC}"
    echo -e "${BLUE}    npx ts-node scripts/register-openclaw-node.ts${NC}"
fi

# 显示状态
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   🎉 本地混合模式已启动!                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  服务状态:                                                    ║"
echo "║    • Ollama:     $OLLAMA_URL                              ║"
echo "║    • MaoAI:      $MAOAI_URL                              ║"
echo "║                                                               ║"
echo "║  可用端点:                                                    ║"
echo "║    • 聊天:       $MAOAI_URL/api/ai/chat/stream            ║"
echo "║    • 模型列表:   $MAOAI_URL/api/ai/v1/models              ║"
echo "║    • 健康检查:   $MAOAI_URL/api/health                    ║"
echo "║                                                               ║"
echo "║  使用方法:                                                    ║"
echo "║    1. 打开浏览器访问: $MAOAI_URL                          ║"
echo "║    2. 登录管理员账号                                          ║"
echo "║    3. 在模型选择器中选择 "本地节点"                           ║"
echo "║    4. 开始零 Token 消耗的本地聊天!                           ║"
echo "║                                                               ║"
echo "║  按 Ctrl+C 停止所有服务                                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 等待中断
trap 'echo -e "\n${YELLOW}▶ 正在停止服务...${NC}"; kill $MAOAI_PID 2>/dev/null || true; exit 0' INT TERM
wait $MAOAI_PID
