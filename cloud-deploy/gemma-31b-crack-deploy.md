# Gemma-31B-CRACK 云端部署指南 v2.0

> 专为 MaoAI 集成优化的高性能、低延迟部署方案

## 目录

1. [架构概览](#架构概览)
2. [快速开始](#快速开始)
3. [RunPod 部署详解](#runpod-部署详解)
4. [安全配置](#安全配置)
5. [MaoAI 集成](#maoai-集成)
6. [性能调优](#性能调优)
7. [成本分析](#成本分析)
8. [故障排查](#故障排查)

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        MaoAI 前端                            │
│                    (maoyan.vip / zhengyuanzhiyin.com)       │
└─────────────────────────┬───────────────────────────────────┘
                          │ API 调用
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Nginx 反向代理                         │
│                 (访问控制 + 日志记录 + SSL)                  │
│                   localhost:11435                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Ollama 引擎                           │
│                  (GGUF 推理 + 流式输出)                      │
│                   localhost:11434                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    GPU: RTX 4090 / A100                     │
│               (Gemma-31B-CRACK Q4_K_M)                      │
│                      18GB 模型                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 快速开始

### 方式一：RunPod 一键部署（推荐）

```bash
# 1. 设置 API Key
export RUNPOD_API_KEY="your_api_key"

# 2. 克隆部署脚本
cd ~/Desktop/mcmamoo-website/cloud-deploy

# 3. 运行部署脚本
chmod +x runpod-deploy.sh
./runpod-deploy.sh

# 4. 合并配置到 MaoAI
cat .env.ollama-cloud >> ../.env.local
```

### 方式二：Docker 手动部署

```bash
# 1. 上传 GGUF 模型到 ./models/
scp ./gemma-4-31b-jang-crack-Q4_K_M.gguf user@server:/opt/ollama/models/

# 2. 配置并启动
cd cloud-deploy
docker compose up -d

# 3. 验证
curl http://localhost:11435/api/tags
```

---

## RunPod 部署详解

### Step 1: 注册与充值

1. 访问 [runpod.io](https://runpod.io)
2. 注册账号并完成实名认证
3. 充值建议：首次充值 $50 测试

### Step 2: 获取 API Key

```
Dashboard → Settings → API Keys → Create Key
```

### Step 3: GPU 选择

| GPU | 显存 | 价格/h | 适合场景 | Token/s |
|-----|------|--------|----------|---------|
| RTX 4090 | 24GB | $0.50 | 个人/开发 | 15-25 |
| A100-40 | 40GB | $1.10 | 小规模生产 | 30-45 |
| A100-80 | 80GB | $2.00 | 追求精度 | 40-60 |

### Step 4: 端口暴露

> **关键：RunPod 默认不开放 11434 端口！**

在 RunPod 控制台执行以下操作：

1. 进入实例详情页
2. 点击 **Expose Ports**
3. 添加端口：
   - Container Port: `11434`
   - Public Port: `11434`

### Step 5: 安全配置

#### 方案 A：Ollama 原生限制

```bash
# 在实例中设置环境变量
export OLLAMA_ORIGINS="https://maoyan.vip,https://zhengyuanzhiyin.com"
```

#### 方案 B：Nginx 反向代理（本项目已包含）

```bash
# 启动带代理的版本
docker compose --profile with-proxy up -d
```

---

## 安全配置

### IP 白名单

编辑 `nginx.conf` 中的 `valid_referers`：

```nginx
valid_referers ~*^https://(maoyan\.vip|zhengyuanzhiyin\.com)$;
if ($invalid_referer) {
    return 403;
}
```

### API Key 认证（可选）

```bash
# 生成随机 Key
openssl rand -hex 32

# 添加到 Nginx 配置
proxy_set_header X-API-Key "your-secret-key";
```

### MaoAI 配置

```bash
# .env.local
OLLAMA_BASE_URL=https://your-runpod-instance.runpod.io
OLLAMA_API_KEY=your-secret-key
```

---

## MaoAI 集成

### 自动发现机制

MaoAI 会自动发现 Ollama 节点。只需配置：

```bash
# .env.local
OLLAMA_BASE_URL=http://YOUR_INSTANCE_IP:11434
```

### 手动注册节点

如果自动发现失败，手动添加：

1. 进入 MaoAI 管理后台
2. 导航到 AI 节点管理
3. 添加节点：
   - 名称: `Ollama / gemma-31b-crack`
   - 类型: `openai_compat`
   - Base URL: `http://YOUR_INSTANCE_IP:11434`
   - 模型: `gemma-31b-crack`
   - 本地: ✅

### 流式响应配置

确保开启 Streaming 以提升用户体验：

```bash
# .env.local
OLLAMA_STREAM=true
```

---

## 性能调优

### Modelfile 参数

```dockerfile
FROM ./gemma-4-31b-jang-crack-Q4_K_M.gguf

# GPU 层数（60 层全加载）
PARAMETER num_gpu 60

# 上下文长度（根据显存调整）
PARAMETER num_ctx 8192

# 采样参数
PARAMETER temperature 0.7
PARAMETER top_p 0.9
```

### 显存计算

| 模型版本 | 模型大小 | KV Cache | 总需求 |
|---------|---------|----------|--------|
| Q4_K_M | ~18GB | 4GB | 22GB |
| Q8_0 | ~35GB | 4GB | 39GB |
| Q2_K | ~11GB | 4GB | 15GB |

### 上下文长度建议

| GPU | 显存 | 最大上下文 |
|-----|------|-----------|
| RTX 4090 | 24GB | 8192 |
| A100-40 | 40GB | 16384 |
| A100-80 | 80GB | 32768 |

---

## 成本分析

### 月度成本估算

| GPU | 小时价 | 8h/天 | 24h/天 |
|-----|--------|--------|--------|
| RTX 4090 | $0.50 | $120 | $360 |
| A100-40 | $1.10 | $264 | $792 |
| A100-80 | $2.00 | $480 | $1440 |

### 成本优化建议

1. **按需启动**：使用 RunPod Serverless，按使用量计费
2. **休眠策略**：非高峰期自动休眠实例
3. **共享模型**：多用户共用同一实例

---

## 故障排查

### Ollama 无法启动

```bash
# 查看日志
docker logs gemma-ollama

# 常见错误：显存不足
# 解决：使用更小的量化版本，或增加 GPU
```

### 模型加载失败

```bash
# 验证 GGUF 文件
ls -lh /models/*.gguf

# 重新创建模型
ollama create gemma-31b-crack -f /models/Modelfile --force
```

### 网络连接超时

```bash
# 检查端口是否暴露
curl http://localhost:11434/api/tags

# 检查防火墙
runpod firewall allow $INSTANCE_ID --port 11434
```

---

## 附录：文件清单

```
cloud-deploy/
├── README.md                    # 本文档
├── gemma-31b-crack-deploy.md   # 详细部署指南
├── docker-compose.yml           # Docker 编排配置
├── nginx.conf                   # Nginx 反向代理配置
├── Modelfile.template           # Ollama 模型配置模板
└── runpod-deploy.sh             # RunPod 一键部署脚本
```

---

> 最后更新: 2026-04-14
> 版本: v2.0
