# Rowboat Docker 配置
# 
# 启动: docker compose -f docker-compose.rowboat.yml up -d
# 停止: docker compose -f docker-compose.rowboat.yml down

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: maoai-qdrant
    ports:
      - "6333:6333"  # REST API
      - "6334:6334"  # gRPC API
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: unless-stopped

  # 可选: Rowboat API 独立服务
  # rowboat-api:
  #   build: .
  #   ports:
  #     - "4000:4000"
  #   environment:
  #     - QDRANT_URL=http://qdrant:6333
  #   depends_on:
  #     - qdrant

volumes:
  qdrant_data:
