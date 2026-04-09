# MaoAI 架构说明

## 📁 项目结构

```
mcmamoo-website/
├── client/                 # 前端 React 应用
│   ├── src/
│   │   ├── features/
│   │   │   ├── maoai/     # MaoAI 功能模块
│   │   │   └── autoclip/  # AutoClip 功能模块（即将迁移）
│   │   └── pages/         # 页面组件
├── server/                 # 后端 API 服务
│   ├── _core/             # 核心服务（Vite、OAuth、SDK）
│   ├── aiStream.ts        # AI 流式响应处理
│   ├── video.ts           # 视频生成模块
│   └── db.ts              # 数据库访问层
├── shared/                 # 共享类型和常量
└── dist/                   # 构建输出
```

---

## 🚀 部署架构

### 本地开发
```
┌─────────────────────────────────────┐
│  Localhost:3000                     │
│  ┌──────────────┐  ┌──────────────┐ │
│  │  Vite 前端   │  │  Express API │ │
│  │  (React)     │  │  (Node.js)   │ │
│  └──────────────┘  └──────────────┘ │
│           │                │        │
│           └──────┬─────────┘        │
│                  │                  │
│            同一进程运行               │
└─────────────────────────────────────┘
```

### 云端部署（当前）
```
┌─────────────────────────────────────┐
│  Cloudflare Pages                   │
│  ┌──────────────┐                   │
│  │  静态前端    │  ← API 不可用    │
│  │  (dist/)     │                   │
│  └──────────────┘                   │
└─────────────────────────────────────┘
```

**⚠️ 已知问题**：Cloudflare Pages 是静态托管，不支持服务器端 API 路由。

---

## 🔧 最近的修复

### 2026-04-10
1. **Vite 中间件修复** (`server/_core/vite.ts`)
   - 问题：Vite 中间件捕获所有请求，包括 `/api/*`
   - 修复：添加 `if (url.startsWith("/api/")) return next()` 跳过 API 路由

2. **管理员登录接口** (`server/_core/oauth.ts`)
   - 新增：`POST /api/auth/email-login`
   - 支持邮箱：`sean_lab@me.com`
   - 密码哈希：SHA256 验证

3. **健康检查端点** (`server/_core/index.ts`)
   - 新增：`GET /api/health`

---

## 📋 后续工作建议

### 方案 A：API 服务器分离（推荐）
```
前端 (Cloudflare Pages) ──→ API 服务器 (Railway/Render)
                              │
                              ↓
                         Supabase 数据库
```

### 方案 B：迁移到全栈平台
- Railway、Render、Fly.io 等支持 Node.js 的平台
- 前端 + API 在同一平台运行

---

## 🔄 分支管理

| 分支 | 用途 | 部署 |
|------|------|------|
| `main` | 生产分支 | Cloudflare Pages |
| `refactor/maoai-feature-folder` | MaoAI 开发 | 手动测试 |

### 合并流程
1. 在 feature 分支开发
2. 本地测试通过
3. 合并到 `main`
4. GitHub Actions 自动部署

---

## 🧪 测试命令

```bash
# 本地启动
cd /Users/mac/Desktop/mcmamoo-website && pnpm dev

# API 测试
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ai/status
curl -X POST http://localhost:3000/api/auth/email-login \
  -H "Content-Type: application/json" \
  -d '{"email":"sean_lab@me.com","password":"Ma@7002005"}'
```
