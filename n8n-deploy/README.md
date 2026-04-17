# n8n-deploy

> n8n 云端服务（Railway）配置文件

## 目录结构

```
n8n-deploy/
├── Dockerfile              # Railway Docker 构建
├── railway.json           # Railway 服务配置
├── .env.railway.template # 环境变量模板（填入真实值后上传）
├── test-supabase-connection.sh  # Supabase 直连测试脚本
├── DEPLOY.md              # 详细部署步骤
└── workflows/             # n8n workflow 导入模板
    └── maoYan-webhook-callback.json
```

## 快速开始

1. 获取 Supabase PostgreSQL 密码（见 DEPLOY.md 步骤 1）
2. 生成加密密钥：
   ```bash
   openssl rand -hex 32
   ```
3. 将 `.env.railway.template` 复制为 `.env.railway`，填入真实值
4. 在 Railway 添加服务，上传配置
5. 部署完成后更新 `WEBHOOK_URL`

## Supabase 直连测试

```bash
chmod +x test-supabase-connection.sh
./test-supabase-connection.sh YOUR_SUPABASE_DB_PASSWORD
```

## 本地 n8n（已运行）

http://localhost:5678/（版本 2.16.1）
- 工作流可本地调试后导入云端
- SQLite 数据可迁移到 Supabase PostgreSQL
