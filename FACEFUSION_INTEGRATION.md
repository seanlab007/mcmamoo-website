# FaceFusion 整合方案

## 概述

FaceFusion 是行业领先的 AI 面部操作平台，支持：
- **面部换脸 (Face Swap)** - 将源图片的脸部替换到目标图片/视频
- **脸部增强 (Face Enhance)** - 提升脸部清晰度和质量
- **唇形同步 (Lip Sync)** - 让嘴唇动作匹配音频
- **表情恢复 (Expression Restore)** - 恢复被遮挡或模糊的表情

## 源码来源

**原始仓库**: https://github.com/facefusion/facefusion
**Star**: 27.9k+
**协议**: MIT License

## 整合架构

```
mcmamoo-website/
├── facefusion/                    # FaceFusion 源码
│   ├── facefusion/               # 核心模块
│   ├── tests/                    # 测试
│   ├── facefusion.py            # 入口脚本
│   ├── install.py               # 安装脚本
│   └── requirements.txt         # Python 依赖
│
├── backend/
│   └── facefusion_api.py        # FastAPI 路由
│
└── client/src/
    └── features/
        └── facefusion/         # 前端组件
            ├── components/     # UI 组件
            ├── pages/         # 页面
            ├── services/      # API 服务
            ├── store/         # Zustand 状态管理
            ├── types/         # TypeScript 类型
            └── styles/        # CSS 样式
```

## 功能模块

### 1. 前端组件 (`client/src/features/facefusion/`)

| 文件 | 说明 |
|------|------|
| `components/FaceFusionMain.tsx` | 主交互界面 |
| `pages/FaceFusionPage.tsx` | 页面容器 |
| `services/api.ts` | API 调用封装 |
| `store/index.ts` | Zustand 状态管理 |
| `types/index.ts` | TypeScript 类型定义 |
| `styles/facefusion.css` | 组件样式 |

### 2. 后端 API (`backend/facefusion_api.py`)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/facefusion/status` | GET | 获取系统状态 |
| `/api/facefusion/submit` | POST | 提交处理任务 |
| `/api/facefusion/status/{taskId}` | GET | 查询任务状态 |
| `/api/facefusion/cancel/{taskId}` | POST | 取消任务 |
| `/api/facefusion/tasks` | GET | 获取任务列表 |
| `/api/facefusion/tasks/{taskId}` | DELETE | 删除任务 |
| `/api/facefusion/upload/image` | POST | 上传图片 |
| `/api/facefusion/upload/video` | POST | 上传视频 |

## 部署方案

### 方式一：Docker 部署

```bash
# 构建镜像
docker build -f Dockerfile.facefusion -t mcmamoo/facefusion .

# 运行容器
docker run --gpus all -p 7860:7860 mcmamoo/facefusion
```

### 方式二：GPU 服务器部署

```bash
cd facefusion
pip install -r requirements.txt
python facefusion.py --ui-layouts headless --execution-providers cuda
```

## 待完成事项

1. [ ] 集成真实的 FaceFusion Python SDK
2. [ ] 配置 GPU 运行环境
3. [ ] 添加 WebSocket 实时进度推送
4. [ ] 实现模型自动下载功能

## 参考资源

- [FaceFusion 官方文档](https://docs.facefusion.io/)
- [GitHub 仓库](https://github.com/facefusion/facefusion)
