#!/bin/bash
# ============================================
# FaceFusion Supabase 配置脚本
# 猫眼内容平台
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  FaceFusion Supabase 配置${NC}"
echo -e "${GREEN}========================================${NC}"

# 配置变量
PROJECT_ID="fczherphuixpdjuevzsh"
API_URL="https://fczherphuixpdjuevzsh.supabase.co"

echo -e "\n${YELLOW}项目信息:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  API URL: $API_URL"

# 检查 Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "\n${YELLOW}Supabase CLI 未安装，安装中...${NC}"
    npm install -g supabase
fi

echo -e "\n${YELLOW}步骤 1: 在 Supabase Dashboard 创建 Storage Buckets${NC}"
echo "========================================"
echo "请访问以下链接创建 Storage Buckets:"
echo ""
echo "https://supabase.com/dashboard/project/$PROJECT_ID/storage"
echo ""
echo "创建以下 buckets (都设置为 Public):"
echo "  1. facefusion - 用于存储上传的图片/视频"
echo "  2. facefusion-output - 用于存储处理结果"
echo ""
read -p "按 Enter 继续..."

echo -e "\n${YELLOW}步骤 2: 执行数据库 SQL${NC}"
echo "========================================"

# 读取 SQL 文件
SQL_FILE="supabase/facefusion_schema.sql"

if [ -f "$SQL_FILE" ]; then
    echo "执行 $SQL_FILE ..."

    # 使用 Supabase CLI 执行 SQL
    supabase db execute -f "$SQL_FILE" --project-id "$PROJECT_ID"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 数据库配置成功!${NC}"
    else
        echo -e "${RED}✗ 数据库配置失败，请手动执行 SQL${NC}"
    fi
else
    echo -e "${RED}SQL 文件不存在: $SQL_FILE${NC}"
fi

echo -e "\n${YELLOW}步骤 3: 配置环境变量${NC}"
echo "========================================"

# 创建 .env.local 配置示例
cat > .env.facefusion << EOF
# FaceFusion Supabase 配置
SUPABASE_URL=$API_URL
SUPABASE_SERVICE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# FaceFusion Storage
FACE_FUSION_BUCKET=facefusion
OUTPUT_BUCKET=facefusion-output
EOF

echo "已创建 .env.facefusion 配置模板"
echo "请将 SUPABASE_SERVICE_KEY 添加到你的环境变量中"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  配置完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "下一步:"
echo "  1. 重启后端服务"
echo "  2. 访问 /facefusion 路由测试"
echo "  3. 配置 GPU 环境运行 FaceFusion"
