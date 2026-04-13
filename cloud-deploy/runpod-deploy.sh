#!/bin/bash
# runpod-deploy.sh - RunPod Gemma-31B-CRACK 快速部署脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Gemma-31B-CRACK RunPod 部署 ===${NC}\n"

# 检查依赖
command -v runpod >/dev/null 2>&1 || {
    echo -e "${YELLOW}安装 runpod CLI...${NC}"
    pip install runpod
}

# 检查 API Key
if [ -z "$RUNPOD_API_KEY" ]; then
    echo -e "${RED}错误: 请设置 RUNPOD_API_KEY 环境变量${NC}"
    echo "export RUNPOD_API_KEY='your_api_key'"
    exit 1
fi

# 配置
CONTAINER_NAME="gemma-31b-crack"
GPU_TYPE="${GPU_TYPE:-A100-40}"  # 可选: A100-40, A100-80, RTX4090
DISK_GB="${DISK_GB:-100}"
MODEL_NAME="${MODEL_NAME:-gemma-4-31b-crack-q4km}"

echo -e "${GREEN}配置:${NC}"
echo "  GPU: $GPU_TYPE"
echo "  磁盘: ${DISK_GB}GB"
echo "  模型: $MODEL_NAME"
echo ""

# 查找可用 GPU
echo -e "${YELLOW}检查可用 GPU...${NC}"
AVAILABLE_GPUS=$(runpod gpu list --json 2>/dev/null | jq -r '.[] | select(.id == "'$GPU_TYPE'" and .available == true) | .id' | head -1)

if [ -z "$AVAILABLE_GPUS" ]; then
    echo -e "${YELLOW}指定 GPU 不可用，查找替代方案...${NC}"
    GPU_TYPE=$(runpod gpu list --json 2>/dev/null | jq -r '.[] | select(.available == true) | .id' | head -1)
    echo -e "${GREEN}使用: $GPU_TYPE${NC}"
fi

# 创建实例
echo -e "${YELLOW}创建 GPU 实例...${NC}"
INSTANCE_ID=$(runpod create $CONTAINER_NAME \
    --gpu $GPU_TYPE \
    --disk $DISK_GB \
    --template "PyTorch 2.1.0" \
    --env OLLAMA_MODELS=/models \
    --json 2>/dev/null | jq -r '.id')

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "null" ]; then
    echo -e "${RED}实例创建失败${NC}"
    exit 1
fi

echo -e "${GREEN}实例创建成功: $INSTANCE_ID${NC}"

# 等待实例就绪
echo -e "${YELLOW}等待实例启动...${NC}"
sleep 10

# 获取 IP
INSTANCE_IP=$(runpod ps $INSTANCE_ID --json 2>/dev/null | jq -r '.[0].runtime.externalIp')

echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo ""
echo "实例 IP: $INSTANCE_IP"
echo "SSH 命令: runpod ssh $INSTANCE_ID"
echo ""
echo "在实例中执行以下命令安装 Ollama:"
echo ""
cat << 'EOF'
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve &
sleep 5
# 下载模型（根据你的 GGUF 文件路径）
ollama create gemma-31b-crack -f /path/to/Modelfile
EOF
echo ""

# 保存配置到 .env
cat >> ../.env.local << EOF

# Ollama 云端配置
OLLAMA_BASE_URL=http://$INSTANCE_IP:11434
OLLAMA_CLOUD_HOST=$INSTANCE_ID
EOF

echo -e "${GREEN}配置已保存到 .env.local${NC}"
