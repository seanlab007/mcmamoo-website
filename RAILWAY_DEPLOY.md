# Railway 部署指南

## AutoClip 后端服务部署

### 步骤 1: 创建 Railway 项目

1. 访问 https://railway.app 并登录
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择仓库: `seanlab007/mcmamoo-autoclip`
4. Railway 会自动检测 Dockerfile

### 步骤 2: 添加数据库

在 Railway 项目中添加:

1. **PostgreSQL** (用于存储数据)
   - 点击 "Add Plugin" → "PostgreSQL"
   - Railway 会自动设置 `DATABASE_URL` 环境变量

2. **Redis** (用于任务队列)
   - 点击 "Add Plugin" → "Redis"
   - Railway 会自动设置 `REDIS_URL` 环境变量

### 步骤 3: 添加环境变量

在 Railway Dashboard 的 Variables 标签添加:

```
# 必需的环境变量
API_DASHSCOPE_API_KEY=你的通义千问API密钥
# 获取地址: https://dashscope.console.aliyun.com/

# 可选配置
DEBUG=false
LOG_LEVEL=INFO
ENVIRONMENT=production
```

### 步骤 4: 获取通义千问 API Key

1. 访问 https://dashscope.console.aliyun.com/
2. 注册/登录阿里云账号
3. 创建 API Key
4. 将 API Key 添加到 Railway 环境变量

### 步骤 5: 部署

1. 点击 "Deploy" 开始部署
2. 等待部署完成
3. 点击生成的域名查看 API 文档

### 步骤 6: 配置前端

部署完成后:

1. 复制 AutoClip API URL (例如: `https://your-app.railway.app`)
2. 在 mcmamoo-website 的 Cloudflare Pages 设置中添加:
   - 变量名: `VITE_AUTOCLIP_API_URL`
   - 值: 你的 AutoClip API URL

### API 文档

部署完成后访问: `https://your-app.railway.app/docs`

---

## 故障排除

### 视频下载失败
- 确保 `yt-dlp` 已正确安装
- 检查视频URL是否支持

### AI 分析失败
- 确认 `API_DASHSCOPE_API_KEY` 正确
- 检查 API 配额是否用完

### 数据库连接失败
- 确认 PostgreSQL 插件已添加
- 检查 `DATABASE_URL` 环境变量
