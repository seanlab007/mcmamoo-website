# 项目工作规范（长期记忆）

> **📍 文件位置：** `/Users/mac/Desktop/mcmamoo-website/MEMORY.md`
> **⚠️ 重要：** 所有 AI 助手必须先读取此文件，再执行任何操作！

---

## 🔒 本地项目路径规范（绝对锁定）

| 项目 | 唯一正确路径 | 端口 |
|------|-------------|------|
| **MaoAI** | `/Users/mac/Desktop/mcmamoo-website` | 3000 |
| **猫眼内容平台** | `/Users/mac/Desktop/猫眼内容平台` | 3001 |

**⚠️ 严禁操作：**
- 禁止在 `/Users/mac/WorkBuddy/` 任何子目录中创建或修改这两个项目
- 禁止自动复制项目文件到 WorkBuddy 目录
- 禁止修改桌面以外的同名项目文件

---

## 🚀 启动命令规范

**MaoAI：**
```bash
cd /Users/mac/Desktop/mcmamoo-website && pnpm dev
```

**猫眼内容平台：**
```bash
cd /Users/mac/Desktop/猫眼内容平台 && pnpm dev
```

---

## ✅ 测试验证流程（每次修改后必须执行）

1. **确认工作目录**：`pwd` 必须是桌面路径
2. **停止旧进程**：`pkill -f "mcmamoo-website"` 或对应项目
3. **重启服务**：使用上述规范命令
4. **API测试**：`curl -s http://localhost:3000/api/health`
5. **页面验证**：浏览器访问对应端口

---

## 👤 管理员登录信息（MaoAI）

- **邮箱**：`sean_lab@me.com`
- **密码**：`Ma@7002005`
- **登录地址**：`http://localhost:3000/maoai/login`

---

## 🏗️ 部署架构说明（重要）

### 当前架构
| 环境 | 前端托管 | API服务器 | 状态 |
|------|---------|-----------|------|
| **本地** | Vite Dev Server (3000) | 同一进程 | ✅ 完整功能 |
| **云端** | Cloudflare Pages (静态) | ❌ 无 | ⚠️ 仅静态页面 |

### 关键问题
- **Cloudflare Pages 是静态托管**，不支持 Node.js API 路由
- MaoAI 的 `/api/*` 端点需要部署到支持服务器端运行的平台
- 当前云端部署只包含前端构建产物 (`dist/public`)

### 后续工作建议
1. **API 服务器分离**：将 MaoAI API 部署到 Railway/Render/AWS Lambda
2. **前端配置 API 基础 URL**：云端前端调用独立的 API 服务器
3. **或迁移到全栈平台**：如 Railway、Render、Fly.io 等支持 Node.js 的平台

---

## 📝 分支合并规范

### 当前活跃分支
- `main` - 生产分支（触发 Cloudflare Pages 自动部署）
- `refactor/maoai-feature-folder` - MaoAI 功能开发分支

### 合并流程
1. 在 `refactor/maoai-feature-folder` 分支开发新功能
2. 测试通过后合并到 `main`：
   ```bash
   git checkout main
   git merge refactor/maoai-feature-folder
   git push origin main
   ```
3. GitHub Actions 自动部署到 Cloudflare Pages

### 冲突解决原则
- `client/src/App.tsx` - 采用 refactor 分支（架构拆分后的干净版本）
- `server/*` - 采用 refactor 分支（API 路由修复）
- `.env.example` - 可删除（使用 .env 本地配置）

---

## 🧠 AI 助手操作规范

### 每次会话开始时必须执行：
1. **读取本文件** (`/Users/mac/Desktop/mcmamoo-website/MEMORY.md`)
2. **确认工作目录** 是桌面路径，不是 WorkBuddy
3. **检查 Git 状态**，确保在正确的分支上

### 禁止行为：
- 禁止在 WorkBuddy 目录创建项目文件
- 禁止修改非桌面的同名项目
- 禁止自动复制文件到 WorkBuddy

---

*更新日期：2026-04-10*
