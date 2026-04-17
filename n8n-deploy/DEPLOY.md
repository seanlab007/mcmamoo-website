# n8n × Railway PostgreSQL — 部署指南

## 目标架构

```
  [手机 App] ──┐
               ├──► n8n (Railway) ◄──► Railway PostgreSQL
  [本地 n8n] ──┤         │
               │         ▼
  [云端 API] ──┘    [Webhook → mcmamoo-website Backend (Cloudflare)]
```

**数据流向：**
- Railway PostgreSQL：n8n workflow 持久化数据
- Supabase REST API：n8n 读写 mcmamoo 业务数据（content_tasks、scheduled_skill_jobs 等）
- mcmamoo-backend：接收 n8n webhook 回调，回写任务状态

---

## 部署步骤

### 步骤 1：在 Railway 添加 n8n 服务

1. 打开 https://railway.app/project/fczherphuixpdjuevzsh（或你的 Railway 项目）
2. 点击 **New** → **Empty Service**，命名 `n8n-cloud`
3. 在服务页面 → **Dockerfile**，选择本目录的 `Dockerfile`
4. 在 **Variables** 中添加以下变量（从 `.env.railway` 复制）：

```
N8N_DATABASE_TYPE = postgresdb
N8N_DATABASE_POSTGRESDB_CONNECTION_LIMIT = 10
N8N_BASIC_AUTH_ACTIVE = true
N8N_BASIC_AUTH_USER = admin
N8N_BASIC_AUTH_PASSWORD = n8n_cloud_2026_secure
N8N_ENCRYPTION_KEY = 5679a314368ca9073eb60d9ccbd6b9f06ac796b8f03d4389758afc1a44c95bd6
WEBHOOK_URL = https://placeholder.up.railway.app
N8N_PROTOCOL = http
N8N_PORT = 5678
N8N_HOST = 0.0.0.0
N8N_SECURE_COOKIE = false
GENERIC_TIMEZONE = Asia/Shanghai
N8N_DIAGNOSTICS_ENABLED = false
LOG_LEVEL = info
CONTENT_WEBHOOK_SECRET = n8n_maoYan_callback_2026
SUPABASE_URL = https://fczherphuixpdjuevzsh.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 步骤 2：添加 Railway PostgreSQL 插件

1. 在 `n8n-cloud` 服务页面 → **Storage** → **Add PostgreSQL**
2. Railway 自动创建 PostgreSQL 数据库并注入 `DATABASE_URL` 环境变量
3. **无需手动填写 DATABASE_URL**（Railway 自动管理）

### 步骤 3：部署

1. 点击 **Deploy**，等待构建（n8nio/n8n:latest 约 500MB）
2. 部署成功后，Railway 生成域名，例如：
   `https://n8n-cloud-xxxx.up.railway.app`
3. 回到 **Variables**，更新：
   ```
   WEBHOOK_URL = https://n8n-cloud-xxxx.up.railway.app
   ```
4. 重启服务使 WEBHOOK_URL 生效

### 步骤 4：验证部署

访问 `https://n8n-cloud-xxxx.up.railway.app`，用 admin / n8n_cloud_2026_secure 登录。

健康检查：`https://n8n-cloud-xxxx.up.railway.app/healthz`

### 步骤 5：配置 mcmamoo-website Webhook 回调

在 `.env` 中已配置：
```
CONTENT_WEBHOOK_SECRET=n8n_maoYan_callback_2026
```

在 n8n workflow 中使用 HTTP Request 节点调用：
```
POST https://your-mcmamoo-backend.up.railway.app/api/content/webhook
Headers:
  Authorization: Bearer n8n_maoYan_callback_2026
  Content-Type: application/json
```

---

## 本地 n8n ↔ 云端 n8n 协同

| 环境 | URL | 用途 |
|------|-----|------|
| 本地 | http://localhost:5678/ | 开发调试 |
| 云端 | https://n8n-cloud-xxxx.up.railway.app | 生产执行 |

**工作流迁移**：本地调试好后，n8n 支持 JSON 导入/导出，直接在云端导入同样 workflow。

---

## 架构说明

- **Railway PostgreSQL**：仅存储 n8n workflow 本身（credentials、execution history）
- **Supabase REST API**：n8n 通过 HTTP 调用 Supabase CRUD 业务数据
- **contentPlatform webhook**：n8n 执行完成后回调 mcmamoo-backend，更新 content_tasks 状态

---

## 常见问题

**Q: n8n 启动报错 "ECONNREFUSED database"**
→ 确认 Railway PostgreSQL 插件已正确添加，且 `N8N_DATABASE_TYPE=postgresdb`

**Q: Webhook 测试失败**
→ 确认 `WEBHOOK_URL` 已更新为真实 Railway 域名

**Q: n8n 读取不到 Supabase 数据**
→ 确认 `SUPABASE_SERVICE_KEY` 正确（用 service_role 密钥，非 anon key）
