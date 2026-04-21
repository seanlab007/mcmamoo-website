# MaoAI 腾讯云部署指南

## 快速部署步骤

### 1. 购买腾讯云轻量服务器

登录腾讯云控制台：https://console.cloud.tencent.com/lighthouse

**推荐配置**（B端服务）：
| 配置 | 价格 | 适用场景 |
|------|------|---------|
| 2核4G6M | ¥50/月 | 起步，100-500用户 |
| 4核8G10M | ¥100/月 | 中等规模，500-2000用户 |
| 8核16G14M | ¥200/月 | 大规模，2000+用户 |

**镜像选择**：Ubuntu 22.04 LTS

**地域选择**：
- 国内用户为主：广州/上海/北京
- 海外用户为主：香港/新加坡

### 2. 配置安全组

开放以下端口：
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 3000 (应用端口，可选)

### 3. 连接服务器并部署

```bash
# SSH 连接到服务器
ssh root@你的服务器IP

# 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/seanlab007/mcmamoo-website/main/scripts/deploy-tencent.sh | bash
```

### 4. 配置环境变量

```bash
cd /opt/maoai
nano .env
```

填入以下环境变量：

```bash
# 数据库（使用 Supabase 云端）
DATABASE_URL=postgresql://postgres:xxx@xxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# AI API Keys
DEEPSEEK_API_KEY=sk-xxx
ZHIPU_API_KEY=xxx
GROQ_API_KEY=xxx
GEMINI_API_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_AI_STUDIO_API_KEY=xxx
RUNPOD_API_KEY=xxx

# 安全密钥
JWT_SECRET=your-jwt-secret-min-32-chars
SESSION_SECRET=your-session-secret
WORKBUDDY_API_KEY=xxx
GITHUB_TOKEN=ghp_xxx
```

### 5. 启动服务

```bash
cd /opt/maoai
docker-compose -f docker-compose.prod.yml up -d
```

### 6. 验证部署

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 测试访问
curl http://localhost/api/health
```

## 域名和 HTTPS 配置

### 方式一：腾讯云 SSL 证书（推荐）

1. 在腾讯云申请免费 SSL 证书
2. 下载 Nginx 格式证书
3. 上传到服务器 `/opt/maoai/nginx/ssl/`
4. 修改 `nginx/nginx.conf` 启用 HTTPS

### 方式二：Let's Encrypt 自动证书

```bash
# 安装 certbot
docker run -it --rm \
  -v "/opt/maoai/nginx/ssl:/etc/letsencrypt" \
  -v "/opt/maoai/nginx/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d your-domain.com
```

## 常用运维命令

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f nginx

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 更新代码并重新部署
cd /opt/maoai && git pull
docker-compose -f docker-compose.prod.yml up -d --build

# 备份数据
docker exec maoai-app tar czf /tmp/backup.tar.gz /app/dist
docker cp maoai-app:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz

# 监控资源使用
docker stats
```

## 性能优化

### 1. 启用 CDN（推荐）

使用腾讯云 CDN 加速静态资源：
- 登录 https://console.cloud.tencent.com/cdn
- 添加域名，源站指向服务器 IP
- 配置 HTTPS 和缓存规则

### 2. 数据库优化

如果使用 Supabase 免费套餐遇到限制：
- 升级到 Supabase Pro ($25/月)
- 或在腾讯云安装 PostgreSQL

### 3. 监控告警

安装腾讯云监控 Agent：
```bash
wget -qO- https://monitoring-prod-1258344699.cos.ap-guangzhou.myqcloud.com/monitor_linux_installer.sh | bash
```

## 故障排查

### 服务无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 3000

# 检查环境变量
docker-compose -f docker-compose.prod.yml config

# 查看详细日志
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 数据库连接失败

- 检查 Supabase 连接字符串
- 确认 Supabase 项目状态
- 检查服务器出站网络

### 内存不足

```bash
# 查看内存使用
free -h

# 增加 Swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

## 成本估算

| 项目 | 月费用 | 说明 |
|------|--------|------|
| 轻量服务器 2核4G6M | ¥50 | 起步配置 |
| 轻量服务器 4核8G10M | ¥100 | 推荐配置 |
| Supabase 免费版 | ¥0 | 500MB 数据库 |
| Supabase Pro | ¥175 | 8GB 数据库 |
| 腾讯云 CDN | ¥0-50 | 按流量计费 |
| **总计** | **¥50-325** | 根据规模选择 |

## 联系方式

部署遇到问题？
- 查看日志：`docker-compose -f docker-compose.prod.yml logs -f`
- GitHub Issues：https://github.com/seanlab007/mcmamoo-website/issues
