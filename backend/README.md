# Maoyan Video Tools - 猫眼内容平台视频工具整合包

整合四大开源工具，统一 API，本地/云端双轨运行。

```
moviepy ★14k   → 基础视频剪辑（剪切/拼接/字幕烧入/水印）
VideoLingo ★16k → 全自动字幕组（ASR→断句→翻译→配音→合成）
ShortGPT  ★7k  → AI短视频自动化（脚本→配音→素材→剪辑→渲染）
VideoCaptioner ★13k → AI字幕助手（语音转字幕/优化/翻译）
```

## 架构

```
                    ┌─────────────────────────────┐
                    │   FastAPI (port 8080)         │
                    │   /api/v1/video/*             │
                    └──────────────┬────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────▼────────┐  ┌────────▼────────┐  ┌──────▼──────────┐
     │  MoviePy         │  │ VideoCaptioner  │  │ VideoLingo      │
     │  基础剪辑        │  │  字幕生成/翻译  │  │  配音翻译       │
     └────────┬────────┘  └────────────────┘  └─────────────────┘
              │                                          │
     ┌────────▼──────────────────────────────────────────▼─┐
     │                    ShortGPT                          │
     │              AI短视频自动化框架                       │
     └──────────────────────────────────────────────────────┘
```

## 本地运行

```bash
cd maoyan-video-tools
pip install -r requirements.txt

# 环境变量
export OPENAI_API_KEY=sk-...
export DASHSCOPE_API_KEY=sk-...      # 阿里云通义（可选）
export WORKSPACE_DIR=/data/workspace # 工作目录
export RUN_MODE=local               # local | cloud

python -m maoyan_video_tools.api
# 或
uvicorn maoyan_video_tools.api:app --port 8080 --reload
```

## Docker 部署

```bash
docker build -t maoyan-video-tools .
docker run -d -p 8080:8080 \
  -e OPENAI_API_KEY=sk-... \
  -e DASHSCOPE_API_KEY=sk-... \
  -e WORKSPACE_DIR=/data/workspace \
  -v /data/workspace:/data/workspace \
  maoyan-video-tools
```

## API 端点

| 方法 | 端点 | 功能 | 工具 |
|------|------|------|------|
| POST | `/api/v1/video/clip` | 剪切视频片段 | MoviePy |
| POST | `/api/v1/video/batch-clip` | 批量剪切 | MoviePy |
| POST | `/api/v1/video/concat` | 拼接视频 | MoviePy |
| POST | `/api/v1/video/subtitle` | 语音转字幕 | VideoCaptioner |
| POST | `/api/v1/video/subtitle/optimize` | 字幕优化 | VideoCaptioner |
| POST | `/api/v1/video/translate` | 字幕翻译 | VideoCaptioner |
| POST | `/api/v1/video/subtitle-burn` | 字幕烧入 | MoviePy |
| POST | `/api/v1/video/watermark` | 加水印 | MoviePy |
| POST | `/api/v1/video/dub` | 配音翻译 | VideoLingo |
| POST | `/api/v1/video/short` | 生成短视频 | ShortGPT |
| POST | `/api/v1/video/short/topic` | 主题生成短视频 | ShortGPT |
| POST | `/api/v1/video/auto` | 一键全流程 | All |
| GET | `/api/v1/video/info` | 视频元信息 | MoviePy |
| GET | `/api/v1/tools` | 工具列表 | - |
| GET | `/health` | 健康检查 | - |

## Python SDK 用法

```python
from maoyan_video_tools import MaoyanVideoEngine

engine = MaoyanVideoEngine(
    workspace_dir="./workspace",
    openai_api_key="sk-...",
    mode="local",
)

# 1. 剪切视频
engine.clip_video("/video.mp4", 10, 30, "/output/clip.mp4")

# 2. 字幕生成 + 翻译 + 烧入（全流程）
engine.full_subtitle_pipeline("/video.mp4", target_language="en")

# 3. 配音翻译
engine.dub_video("/video.mp4", target_language="ja")

# 4. 短视频生成
engine.generate_short_from_topic("AI如何改变商业世界", duration=60)

# 5. 一键全流程
engine.auto_process("/video.mp4", target_language="zh", workflow="subtitle_and_burn")
```

## 与 mcmamoo-website 整合

将 FastAPI 服务部署后，在 `AutoClip.tsx` 中替换 Supabase Edge Function 调用：

```typescript
// 替换 Supabase Edge Function
const response = await fetch('http://localhost:8080/api/v1/video/subtitle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ video_path: url, language: 'auto' }),
});
```

或通过 Railway/Render 部署云端服务，替换 BASE_URL 即可。

## 安装四大工具

```bash
# moviepy (必需)
pip install moviepy

# VideoCaptioner
pip install videocaptioner

# ShortGPT
pip install shortgpt

# VideoLingo 完整环境
git clone https://github.com/Huanshere/VideoLingo
cd VideoLingo
pip install -r requirements.txt
python install.py
```
