---
name: video-toolkit
description: 猫眼内容平台视频工具包 - AI配音、图像生成、音乐创作、Remotion渲染。支持AI视频生成、图片转视频、配音合成、背景音乐等能力。
metadata:
  platform: mcmamoo
  emoji: "🎬"
  requires:
    bins: ["node", "python3", "ffmpeg", "npm"]
    env: ["MODAL_TOKEN_ID", "MODAL_TOKEN_SECRET", "ELEVENLABS_API_KEY"]
---

# 猫眼视频工具包 (MaoYan Video Toolkit)

基于 claude-code-video-toolkit 的 AI 视频创作工作流，专为猫眼内容平台优化。

## 工具路径

```bash
TOOLKIT=/Users/daiyan/Desktop/mcmamoo-website/video-toolkit
cd $TOOLKIT
```

## 核心工具

### AI 配音合成
```bash
# Qwen3-TTS (推荐，免费)
python3 tools/qwen3_tts.py --text "文本内容" --tone warm --output voice.mp3 --progress json

# ElevenLabs (高品质)
python3 tools/voiceover.py --script script.md --output voiceover.mp3
```

### AI 图像生成 (FLUX.2)
```bash
# 文生图
python3 tools/flux2.py --prompt "prompt内容" --cloud modal --progress json

# 预设模板
python3 tools/flux2.py --preset title-bg --brand maoyan --cloud modal
```

### AI 音乐生成
```bash
# ACE-Step (免费)
python3 tools/music_gen.py --preset corporate-bg --duration 60 --output bg.mp3

# 自定义
python3 tools/music_gen.py --prompt "dramatic cinematic" --duration 30 --bpm 90
```

### AI 视频生成 (LTX-2)
```bash
# 文生视频
python3 tools/ltx2.py --prompt "描述" --cloud modal --progress json

# 图生视频
python3 tools/ltx2.py --input image.jpg --prompt "camera movement" --cloud modal
```

### 虚拟人合成 (SadTalker)
```bash
python3 tools/sadtalker.py --image portrait.png --audio voiceover.mp3 --output talking.mp4 --cloud modal
```

## Remotion 渲染

### 预览
```bash
cd templates/sprint-review
npm install
npm run studio
```

### 渲染
```bash
cd templates/sprint-review
npm run render
```

## 项目结构

```
video-toolkit/
├── tools/              # Python CLI 工具
│   ├── voiceover.py    # 配音合成
│   ├── qwen3_tts.py    # Qwen3-TTS
│   ├── flux2.py        # FLUX 图像生成
│   ├── ltx2.py         # LTX 视频生成
│   ├── music_gen.py    # 音乐生成
│   ├── sadtalker.py    # 虚拟人
│   └── ...
├── lib/
│   ├── components/     # Remotion 组件
│   ├── transitions/    # 转场效果
│   └── theme/         # 主题系统
├── templates/         # 视频模板
│   ├── sprint-review/ # 冲刺评审模板
│   └── product-demo/  # 产品演示模板
├── brands/            # 品牌配置
└── projects/          # 项目目录
```

## 集成状态

- [x] Qwen3-TTS 配音
- [x] FLUX.2 图像生成
- [x] ACE-Step 音乐生成
- [x] LTX-2 视频生成
- [x] SadTalker 虚拟人
- [x] Remotion 渲染
- [ ] ElevenLabs 集成
- [ ] 云端部署配置

## 环境变量

```env
# Modal (推荐)
MODAL_TOKEN_ID=your_token_id
MODAL_TOKEN_SECRET=your_token_secret

# ElevenLabs (可选)
ELEVENLABS_API_KEY=your_api_key

# 存储
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret
```
