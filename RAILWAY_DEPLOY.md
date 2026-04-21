# Railway 云端部署指南

## 快速部署步骤

### 1. 访问 Railway 控制台
打开 https://railway.app/new

### 2. 导入项目
- 选择 "Deploy from GitHub repo"
- 选择 `seanlab007/mcmamoo-website` 仓库
- 选择 `main` 分支

### 3. 配置环境变量
在 Railway Dashboard → Variables 中设置以下变量：

#### 数据库
```
DATABASE_URL=postgresql://postgres:xxx@xxx.railway.app:5432/railway
```

#### Supabase
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

#### AI API Keys
```
DEEPSEEK_API_KEY=sk-your-deepseek-key
ZHIPU_API_KEY=your-zhipu-key
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_STUDIO_API_KEY=your-google-ai-studio-key
RUNPOD_API_KEY=your-runpod-key
```

#### 安全密钥
```
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
WORKBUDDY_API_KEY=your-workbuddy-key
```

#### GitHub Token (用于 github_push 工具)
```
GITHUB_TOKEN=ghp_xxx
```

### 4. 部署
点击 "Deploy" 按钮，Railway 会自动：
1. 构建 Docker 镜像
2. 部署到云端
3. 分配域名（如 `mcmamoo-website-production.up.railway.app`）

### 5. 验证部署
```bash
curl https://your-app.up.railway.app/api/health
```

## 注意事项

### Ollama 本地模型
**云端无法运行 Ollama 本地模型**（需要本地 GPU/CPU）。云端部署时：
- 使用云端 AI API（DeepSeek、Zhipu、Groq、Gemini 等）
- 嵌入模型使用云端替代方案（如 OpenAI text-embedding-3-small）

### 数据库
Railway 提供 PostgreSQL 插件，可在 Dashboard 中一键添加。

### 自动部署
每次推送到 `main` 分支，Railway 会自动重新部署。

## 故障排除

### 构建失败
检查 Dockerfile 和 railway.toml 配置

### 启动失败
查看 Railway Dashboard → Deployments → Logs

### 环境变量问题
确保所有必需的环境变量都已设置

## 成本
- Railway 免费额度：$5/月
- 超出后按使用量计费
- 或升级到 Hobby 计划 ($5/月固定)
