FROM n8nio/n8n:latest

# 时区
ENV GENERIC_TIMEZONE=Asia/Shanghai

# 保持容器运行（n8n 官方镜像 CMD 已启动服务）
WORKDIR /home/node

# Railway 健康检查（可选，配合 railway.json healthcheckPath）
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5678/healthz || exit 1
