# 猫眼视频工具包 - 使用指南

## 快速开始

```bash
cd /Users/daiyan/Desktop/mcmamoo-website/video-toolkit

# 1. 安装依赖
pip3 install -r tools/requirements.txt

# 2. 配置云端 (Modal)
python3 -m modal setup

# 3. 测试
python3 tools/verify_setup.py
```

## 常用命令

### AI 配音
```bash
python3 tools/qwen3_tts.py --text "你好，这是猫眼内容平台" --tone warm --output audio/hello.mp3
```

### AI 图像
```bash
python3 tools/flux2.py --prompt "猫眼风格的科技感背景" --brand maoyan --cloud modal
```

### AI 音乐
```bash
python3 tools/music_gen.py --preset corporate-bg --duration 60 --output audio/bgm.mp3
```

### AI 视频
```bash
python3 tools/ltx2.py --prompt "科技感界面展示" --cloud modal
```

## 与主项目集成

此工具包可通过以下方式与 mcmamoo-website 集成：

1. **素材生成** - 使用 AI 工具生成视频素材
2. **Remotion 渲染** - 在 templates/ 中创建自定义模板
3. **Supabase 存储** - 上传生成的素材到 Supabase Storage

## 文档

更多文档请参考：
- [CLAUDE.md](./CLAUDE.md) - 完整工具包文档
- [tools/](tools/) - 各工具使用说明
