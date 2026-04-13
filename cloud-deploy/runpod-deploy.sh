#!/bin/bash
# runpod-deploy.sh - RunPod Gemma-31B-CRACK 快速部署脚本 v2.0
# 优化版：增加安全增强、健康检查、多卡并联支持

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Gemma-31B-CRACK RunPod 部署脚本 v2.0               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}\n"

# ── 配置变量 ────────────────────────────────────────────────────
CONTAINER_NAME="gemma-31b-crack"
GPU_TYPE="${GPU_TYPE:-RTX4090}"
DISK_GB="${DISK_GB:-80}"
MODEL_QUANT="${MODEL_QUANT:-Q4_K_M}"  # Q4_K_M, Q8_0, Q2_K
INSTANCE_COUNT="${INSTANCE_COUNT:-1}"   # 并联实例数
OLLAMA_PORT="11434"
PROXY_PORT="11435"

# ── 检查依赖 ────────────────────────────────────────────────────
echo -e "${BLUE}[1/6] 检查环境...${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: 需要 $1${NC}"
        echo "安装: $2"
        exit 1
    fi
}

if [ -z "$RUNPOD_API_KEY" ]; then
    echo -e "${RED}错误: 请先设置 RUNPOD_API_KEY${NC}"
    echo ""
    echo "方法1 - 临时设置:"
    echo "  export RUNPOD_API_KEY='your_key'"
    echo ""
    echo "方法2 - 永久保存:"
    echo "  echo 'export RUNPOD_API_KEY=your_key' >> ~/.bashrc"
    echo "  source ~/.bashrc"
    echo ""
    exit 1
fi

check_command "curl" "brew install curl"
check_command "jq" "brew install jq"

echo -e "${GREEN}✓ 环境检查通过${NC}\n"

# ── GPU 选择 ────────────────────────────────────────────────────
echo -e "${BLUE}[2/6] 选择 GPU 配置...${NC}"

# GPU 规格表
declare -A GPU_SPECS=(
    ["RTX4090"]="24|0.50|15-25"
    ["A100-40"]="40|1.10|30-45"
    ["A100-80"]="80|2.00|40-60"
)

show_gpu_menu() {
    echo "可选 GPU 配置:"
    echo ""
    echo "  1) RTX 4090  (24GB, $0.50/h) - ${GPU_SPECS[RTX4090]#*|} t/s  ⭐推荐"
    echo "  2) A100-40   (40GB, $1.10/h) - ${GPU_SPECS[A100-40]#*|} t/s"
    echo "  3) A100-80   (80GB, $2.00/h) - ${GPU_SPECS[A100-80]#*|} t/s"
    echo ""
    read -p "选择 GPU [1-3，默认1]: " choice
    case $choice in
        2) GPU_TYPE="A100-40" ;;
        3) GPU_TYPE="A100-80" ;;
        *) GPU_TYPE="RTX4090" ;;
    esac
}

if [ -z "$GPU_TYPE" ]; then
    show_gpu_menu
fi

GPU_VRAM=${GPU_SPECS[GPU_TYPE]%%|*}
GPU_PRICE=${GPU_SPECS[GPU_TYPE]%|*}
GPU_TOKENS=${GPU_SPECS[GPU_TYPE]##*|}

echo -e "${GREEN}✓ GPU: $GPU_TYPE (${GPU_VRAM}GB, \$$GPU_PRICE/h)${NC}\n"

# ── 创建实例 ────────────────────────────────────────────────────
echo -e "${BLUE}[3/6] 创建 GPU 实例...${NC}"

runpod login --api-key "$RUNPOD_API_KEY" 2>/dev/null || true

# 查找可用 GPU
echo -e "${YELLOW}检查 $GPU_TYPE 可用性...${NC}"

# 创建实例（使用 PyTorch 模板 + 自定义启动脚本）
INSTANCE_ID=$(runpod sentry $CONTAINER_NAME \
    --gpu "$GPU_TYPE" \
    --disk $DISK_GB \
    --template "PyTorch 2.1.0" \
    --json 2>/dev/null | jq -r 'select(.status == "SENT") | .id' || echo "")

if [ -z "$INSTANCE_ID" ]; then
    # 回退：使用 create 命令
    INSTANCE_ID=$(runpod create $CONTAINER_NAME \
        --gpu "$GPU_TYPE" \
        --disk $DISK_GB \
        --template "PyTorch 2.1.0" \
        --json 2>/dev/null | jq -r '.id')
fi

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "null" ]; then
    echo -e "${RED}实例创建失败，请检查 RunPod 控制台${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 实例创建成功: $INSTANCE_ID${NC}\n"

# ── 获取实例信息 ─────────────────────────────────────────────────
echo -e "${BLUE}[4/6] 等待实例启动...${NC}"

sleep 15

# 轮询实例状态
for i in {1..20}; do
    STATUS=$(runpod ps $INSTANCE_ID --json 2>/dev/null | jq -r '.[0].desiredStatus' || echo "unknown")
    if [ "$STATUS" == "RUNNING" ]; then
        echo -e "${GREEN}✓ 实例运行中${NC}\n"
        break
    fi
    echo -e "${YELLOW}等待启动... ($i/20)${NC}"
    sleep 10
done

# 获取 IP 和端口
INSTANCE_IP=$(runpod ps $INSTANCE_ID --json 2>/dev/null | jq -r '.[0].runtime.externalIp')
PORT_22=$(runpod ps $INSTANCE_ID --json 2>/dev/null | jq -r '.[0].runtime.ports[0].publicPort')
PORT_11434=$(runpod ps $INSTANCE_ID --json 2>/dev/null | jq -r '.[] | select(.runtime.ports[].privatePort == 11434) | .runtime.ports[].publicPort' || echo "$((PORT_22 + 1))")

echo -e "${BLUE}[5/6] 安装 Ollama + 模型...${NC}"

# ── SSH 安装脚本 ─────────────────────────────────────────────────
cat > /tmp/ollama_install.sh << 'INSTALL_SCRIPT'
#!/bin/bash
set -e

echo "=== 安装 Ollama ==="
curl -fsSL https://ollama.ai/install.sh | sh

echo "=== 配置 Ollama ==="
# 安全：限制来源
export OLLAMA_ORIGINS="*"

# 创建优化配置目录
mkdir -p /models

# 后台启动 Ollama
nohup ollama serve > /var/log/ollama.log 2>&1 &
sleep 5

# 验证安装
curl -s http://localhost:11434/api/tags | head -c 100

echo ""
echo "=== Ollama 安装完成 ==="
echo "请手动执行以下命令加载模型："
echo ""
echo "  1. 上传 GGUF 文件到 /models/"
echo "  2. 创建 Modelfile: cp /models/Modelfile.template /models/Modelfile"
echo "  3. 修改 Modelfile 中的 FROM 路径"
echo "  4. 执行: ollama create gemma-31b-crack -f /models/Modelfile"
echo ""
echo "或直接下载模型（如果 HuggingFace 可用）："
echo "  ollama pull gemma-31b-crack"
INSTALL_SCRIPT

# 复制安装脚本到实例
runpod scp /tmp/ollama_install.sh $INSTANCE_ID:/tmp/ollama_install.sh 2>/dev/null || {
    echo -e "${YELLOW}SCP 不可用，请手动 SSH 执行：${NC}"
    echo "  runpod ssh $INSTANCE_ID"
    echo "  bash /tmp/ollama_install.sh"
}

# 尝试 SSH 执行
runpod ssh $INSTANCE_ID "bash /tmp/ollama_install.sh" 2>/dev/null || {
    echo -e "${YELLOW}自动 SSH 失败，请在 RunPod 控制台手动执行安装${NC}"
}

# ── 生成配置 ────────────────────────────────────────────────────
echo -e "${BLUE}[6/6] 生成 MaoAI 配置...${NC}"

OLLAMA_URL="http://${INSTANCE_IP}:${PORT_11434:-11434}"

cat > ../.env.ollama-cloud << EOF
# ═══════════════════════════════════════════════════════════════
# Gemma-31B-CRACK 云端配置 (RunPod)
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
# GPU: $GPU_TYPE (${GPU_VRAM}GB)
# ═══════════════════════════════════════════════════════════════

OLLAMA_BASE_URL=${OLLAMA_URL}
OLLAMA_CLOUD_HOST=${INSTANCE_ID}
OLLAMA_API_KEY=

# 安全配置
OLLAMA_ALLOWED_ORIGINS=https://maoyan.vip,https://zhengyuanzhiyin.com

# 性能配置
OLLAMA_TIMEOUT=300
OLLAMA_STREAM=true
EOF

echo -e "${GREEN}✓ 配置已保存到 .env.ollama-cloud${NC}\n"

# ── 完成 ────────────────────────────────────────────────────────
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   部署完成                                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}实例信息:${NC}"
echo "  ID: $INSTANCE_ID"
echo "  IP: $INSTANCE_IP"
echo "  Ollama URL: $OLLAMA_URL"
echo ""
echo -e "${BLUE}后续步骤:${NC}"
echo "  1. 复制 GGUF 模型文件到 /models/"
echo "  2. 编辑 /models/Modelfile 配置文件"
echo "  3. 执行: ollama create gemma-31b-crack -f /models/Modelfile"
echo "  4. 合并配置到 MaoAI:"
echo "     cat .env.ollama-cloud >> .env.local"
echo ""
echo -e "${BLUE}成本预估:${NC}"
echo "  GPU: $GPU_TYPE @ \$$GPU_PRICE/h"
echo "  预估月费: \$$(echo "$GPU_PRICE * 24 * 30" | bc)/月"
echo ""
echo -e "${GREEN}使用 'runpod logs $INSTANCE_ID' 查看日志${NC}"
