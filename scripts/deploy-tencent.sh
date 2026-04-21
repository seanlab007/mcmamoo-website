#!/bin/bash
# MaoAI 腾讯云部署脚本
# 适用于腾讯云轻量服务器/CVM

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  MaoAI 腾讯云部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    echo "sudo bash deploy-tencent.sh"
    exit 1
fi

# 1. 更新系统
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
apt-get update && apt-get upgrade -y

# 2. 安装 Docker
echo -e "${YELLOW}[2/8] 安装 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}Docker 已安装${NC}"
fi

# 3. 安装 Docker Compose
echo -e "${YELLOW}[3/8] 安装 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
else
    echo -e "${GREEN}Docker Compose 已安装${NC}"
fi

# 4. 创建应用目录
echo -e "${YELLOW}[4/8] 创建应用目录...${NC}"
APP_DIR="/opt/maoai"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/nginx/ssl
mkdir -p $APP_DIR/nginx/logs

# 5. 克隆代码
echo -e "${YELLOW}[5/8] 克隆代码...${NC}"
cd $APP_DIR
if [ -d ".git" ]; then
    git pull origin main
else
    git clone https://github.com/seanlab007/mcmamoo-website.git .
fi

# 6. 配置环境变量
echo -e "${YELLOW}[6/8] 配置环境变量...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}警告: .env 文件不存在${NC}"
    echo "请手动创建 .env 文件并配置环境变量"
    echo "参考: .env.example"
    exit 1
fi

# 7. 构建并启动服务
echo -e "${YELLOW}[7/8] 构建并启动服务...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 8. 等待服务启动
echo -e "${YELLOW}[8/8] 等待服务启动...${NC}"
sleep 10

# 健康检查
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "应用地址: http://$(curl -s ifconfig.me)"
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
    echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  部署可能失败，请检查日志${NC}"
    echo -e "${RED}========================================${NC}"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi
