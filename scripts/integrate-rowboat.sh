#!/bin/bash
#==============================================================================
# Rowboat 整合到 MaoAI - 自动执行脚本
# 使用方式: bash scripts/integrate-rowboat.sh
#==============================================================================

set -e

TARGET_DIR="/Users/daiyan/Desktop/mcmamoo-website"
ROWBOAT_DIR="$TARGET_DIR/rowboat-source"
FORK_URL="git@github.com:seanlab007/rowboat.git"

echo "🚀 Rowboat 整合脚本启动..."
echo "=========================================="

# 1. 检查网络连接
echo "📡 检查 GitHub 连接..."
if ! curl -s --connect-timeout 5 https://api.github.com > /dev/null 2>&1; then
    echo "❌ 无法连接到 GitHub，请检查网络后重试"
    exit 1
fi
echo "✅ GitHub 连接正常"

# 2. Fork 检查
echo "📦 检查 Rowboat Fork..."
if ! gh repo view seanlab007/rowboat > /dev/null 2>&1; then
    echo "📌 创建 Fork..."
    gh repo fork rowboatlabs/rowboat
    echo "⏳ 等待 Fork 完成（15秒）..."
    sleep 15
else
    echo "✅ Fork 已存在"
fi

# 3. 克隆 Rowboat
echo "📥 克隆 Rowboat 仓库..."
if [ -d "$ROWBOAT_DIR" ]; then
    echo "   Rowboat 源目录已存在，更新中..."
    cd "$ROWBOAT_DIR"
    git pull origin main
else
    echo "   执行 git clone..."
    git clone "$FORK_URL" "$ROWBOAT_DIR"
    cd "$ROWBOAT_DIR"
fi

# 4. 分析 Rowboat 结构
echo "📊 分析 Rowboat 项目结构..."
echo "   packages/:"
ls -la "$ROWBOAT_DIR/packages/" 2>/dev/null || echo "   (未找到)"
echo "   apps/:"
ls -la "$ROWBOAT_DIR/apps/" 2>/dev/null || echo "   (未找到)"

# 5. 复制核心代码
echo "📋 复制 Rowboat 核心代码..."

# 核心库
if [ -d "$ROWBOAT_DIR/packages/core" ]; then
    cp -r "$ROWBOAT_DIR/packages/core/"* "$TARGET_DIR/packages/rowboat-core/"
    echo "   ✅ packages/rowboat-core/"
fi

# 6. 创建索引文件
cat > "$TARGET_DIR/packages/rowboat-core/src/index.ts" << 'EOF'
// Rowboat Core - 整合原始代码
export * from './packages/core';
EOF

# 7. 打印完成信息
echo ""
echo "=========================================="
echo "✅ Rowboat 源码整合完成！"
echo "=========================================="
echo ""
echo "📋 下一步操作："
echo "   1. 安装依赖: cd $TARGET_DIR && pnpm install"
echo "   2. 启动 Qdrant: docker compose -f docker-compose.rowboat.yml up -d"
echo "   3. 启动开发服务器: pnpm dev"
echo ""
echo "📖 详细方案文档: docs/ROWBOAT_INTEGRATION_REPORT.md"
echo ""
