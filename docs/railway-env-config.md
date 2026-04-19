# Railway 环境变量配置指南

## 必需配置的环境变量

以下环境变量需要在 Railway 控制面板中配置，确保 API 服务正常运行。

### 1. Supabase 数据库配置

```
SUPABASE_URL=https://fczherphuixpdjuevzsh.supabase.co
SUPABASE_SERVICE_KEY=<your-service-role-key>
```

> **说明**: 这些是数据库连接的核心配置，缺失会导致数据持久化失败。

### 2. Google AI Studio (Gemma 模型)

```
GOOGLE_AI_STUDIO_API_KEY=<your-google-ai-studio-api-key>
```

> **说明**: 用于访问 Gemma 4 31B 等 Google 开源模型。获取方式：https://aistudio.google.com/apikey

### 3. 其他 AI 模型 API Keys

根据需要配置以下模型提供商的 API Key：

| 环境变量 | 用途 |
|---------|------|
| `DEEPSEEK_API_KEY` | DeepSeek 模型 |
| `ZHIPU_API_KEY` | 智谱 GLM 模型 |
| `OPENAI_API_KEY` | OpenAI GPT 模型 |
| `ANTHROPIC_API_KEY` | Claude 模型 |

### 4. 认证相关

```
JWT_SECRET=<your-jwt-secret>
VITE_APP_ID=<your-app-id>
OWNER_OPEN_ID=<owner-openid>
OAUTH_SERVER_URL=<oauth-server-url>
```

## 配置步骤

1. 登录 [Railway 控制台](https://railway.app/)
2. 选择 `mcmamoo-website` 项目
3. 点击服务实例
4. 切换到 **Variables** 标签
5. 点击 **Add Variable** 添加环境变量
6. 添加完成后，服务会自动重新部署

## 验证配置

部署完成后，访问以下端点验证：

```bash
# 健康检查
curl https://api.mcmamoo.com/api/ai/status

# 预期响应
{
  "status": "ok",
  "models": {
    "gemma-4-31b-it": { "name": "Gemma 4 31B", "configured": true, "badge": "google" },
    ...
  },
  "nodes": { "total": N, "online": M },
  "timestamp": "2025-...",
  "version": "v2.3-openclaw-skills"
}
```

## 安全注意事项

⚠️ **不要** 将 API Keys 提交到代码仓库
⚠️ **不要** 在客户端代码中使用 Service Role Key
⚠️ **定期轮换** 敏感 API Keys

