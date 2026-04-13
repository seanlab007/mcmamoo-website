# Gemma-4-31B-CRACK 云端部署指南

## 支持的云端平台

| 平台 | 特点 | 推荐配置 |
|------|------|----------|
| **RunPod** | GPU 实例，按小时计费 | RTX 4090 (24GB) / A100 (80GB) |
| **Modal** | Serverless，按使用计费 | 需要预置镜像 |
| **Vultr** | 高性价比 | A100 40GB |
| **Lambda Labs** | 深度学习专用 | A100 80GB |
| **AWS EC2** | 企业级，稳定 | p4d.24xlarge (8x A100) |

---

## 方案一：RunPod 部署（推荐）

### 1. 创建 RunPod 账号
访问 https://runpod.io 注册并获取 API Key

### 2. 部署命令

```bash
# 安装 runpod-cli
pip install runpod

# 设置 API Key
export RUNPOD_API_KEY="your_api_key_here"

# 启动 GPU 实例（选择 PyTorch 2.1 + CUDA 12.1 镜像）
runpod run \
  --name gemma-31b \
  --gpu A100 \
  --disk 100 \
  --env OLLAMA_MODELS=/models \
  runpod/pytorch:2.1.0-cuda12.1-cudnn8-devel \
  --bash -c "
    curl -fsSL https://ollama.ai/install.sh | sh &&
    ollama serve &
    sleep 5 &&
    ollama pull gemma-4-31b-crack-q4km
  "
```

### 3. 使用 Ollama API

```bash
# 测试连接
curl http://<your-instance-ip>:11434/api/tags

# 运行推理
curl http://<your-instance-ip>:11434/api/generate -d '{
  "model": "gemma-4-31b-crack-q4km",
  "prompt": "用矛盾分析法解释第一性原理"
}'
```

---

## 方案二：Docker Compose 本地测试

如果本地有 GPU（Linux + NVIDIA），可以用这个配置：

```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    container_name: maoai-ollama
    volumes:
      - ollama_data:/root/.ollama
      - ./models:/models
    ports:
      - "11434:11434"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    environment:
      - OLLAMA_HOST=0.0.0.0

  # MaoAI API 代理
  maoai-proxy:
    image: nginx:alpine
    container_name: maoai-proxy
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - ollama
```

---

## 方案三：Modal Serverless（按需计费）

```python
# modal_gemma.py
import modal

app = modal.App("gemma-31b-crack")

@app.cls(gpu="A100", timeout=3600)
class GemmaModel:
    @modal.build()
    def setup(self):
        import subprocess
        subprocess.run(["ollama", "pull", "gemma-4-31b-crack-q4km"], check=True)
    
    @modal.enter()
    def start(self):
        import subprocess
        self.process = subprocess.Popen(["ollama", "serve"])
    
    @modal.exit()
    def cleanup(self):
        self.process.terminate()
    
    @modal.method()
    def generate(self, prompt: str) -> str:
        import subprocess
        result = subprocess.run(
            ["ollama", "run", "gemma-4-31b-crack-q4km", prompt],
            capture_output=True, text=True
        )
        return result.stdout

# 使用
if __name__ == "__main__":
    model = GemmaModel()
    print(model.generate.remote("解释矛盾分析法"))
```

---

## 接入 MaoAI

### 1. 环境变量配置

在 `.env.local` 中添加：

```env
# Ollama 云端地址
OLLAMA_BASE_URL=http://<your-cloud-ip>:11434

# 或使用 Ngrok 穿透本地
OLLAMA_BASE_URL=http://localhost:11434
```

### 2. 修改 aiStream.ts

MaoAI 已内置 Ollama 自动发现，配置环境变量后：

```bash
export OLLAMA_BASE_URL=http://your-runpod-ip:11434
npm run dev
```

系统会自动同步 Gemma-31B 模型到节点列表。

---

## 模型下载（如果需要手动）

```bash
# 安装 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 拉取 Gemma-31B-CRACK
# 注意：先检查 HuggingFace 是否有 GGUF 版本
ollama pull gemma:31b

# 或者从自定义路径加载
ollama create gemma-31b-crack -f ./Modelfile
```

---

## 成本估算

| 配置 | 小时成本 | 24小时 | 月估算 |
|------|---------|--------|--------|
| RTX 4090 (24GB) | $0.50 | $12 | ~$360 |
| A100 40GB | $1.10 | $26 | ~$790 |
| A100 80GB | $2.00 | $48 | ~$1440 |

**省钱技巧**：用完即停，按需启动。
