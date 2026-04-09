# Mc&Mamoo 项目架构决策记录 (mcmamoo_memory)

> Last Updated: 2026-04-03
> Author: AI Agent (阿砚)

---

## 项目概览

Mc&Mamoo Brand Management Inc.（猫眼咨询）的数字化产品矩阵，包含多个 AI/内容平台产品。

### 产品线

| 产品 | 描述 | 定位 |
|------|------|------|
| **MaoAI** | 多模型 AI 聊天平台 | AI 能力入口 |
| **猫眼内容平台** | 内容生产与调度平台 | 内容运营 |
| **AutoClip** | AI 视频智能剪辑 | 内容生产工具 |
| **Whale Pictures** | 图片素材库 | 内容素材 |

---

## 架构决策 (Architecture Decisions)

### AD-001: 平台拆分决策
**日期**: 2026-04-03
**状态**: 已执行

#### 背景
MaoAI 和猫眼内容平台（含 AutoClip）是两个独立收费的业务产品，需要：
- 本地开发环境分离（避免端口冲突）
- 独立部署能力
- 清晰的业务边界

#### 决策
```
拆分前:
  mcmamoo-website (单一仓库，端口 3000)
  ├── /maoai          ← MaoAI
  ├── /content         ← 猫眼内容平台
  └── /autoclip       ← AutoClip

拆分后:
  mcmamoo-website (MaoAI 专属，端口 3000)
  └── /maoai          ← MaoAI

  猫眼内容平台 (独立项目，端口 3001)
  ├── /               ← 内容平台首页
  └── /autoclip       ← AutoClip
```

#### 文件变更

**新建项目**: `/Users/mac/Desktop/猫眼内容平台/`
- 复制原 `猫眼内容工作平台/client/` 核心文件
- 删除 MaoAI 相关代码 (`features/maoai/`, `pages/MaoAI*.tsx`)
- 修改 `vite.config.ts` 端口为 3001
- 重写 `App.tsx` 只保留内容平台路由
- 重写 `Navbar.tsx` 添加 MaoAI 跳转按钮
- 重写 `ContentDashboard.tsx` 移除 MaoAI 引用

**修改项目**: `/Users/mac/Desktop/猫眼内容工作平台/` (mcmamoo-website)
- `App.tsx`: 移除内容平台路由，添加跳转占位符
- `Navbar.tsx`: 添加猫眼内容平台跳转按钮

#### 跳转逻辑
| 起点 | 终点 | 本地 | 云端 |
|------|------|------|------|
| MaoAI → 内容平台 | `/content` | `localhost:3001/content` | `mcmamoo.com/content` |
| 内容平台 → MaoAI | `/maoai` | `localhost:3000/maoai` | `mcmamoo.com/maoai` |

#### 启动命令
```bash
# MaoAI (端口 3000)
cd /Users/mac/Desktop/猫眼内容工作平台 && pnpm dev

# 猫眼内容平台 (端口 3001)
cd /Users/mac/Desktop/猫眼内容平台 && pnpm dev

# AutoClip 后端 (端口 8000)
cd /Users/mac/Desktop/AutoClip智能剪辑
export PYTHONPATH="${PWD}:${PYTHONPATH}"
nohup python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 > /tmp/autoclip_backend.log 2>&1 &
```

---

### AD-002: AutoClip 集成决策
**日期**: 2026-04-03
**状态**: 已执行

#### 决策
AutoClip 作为猫眼内容平台的功能模块，不独立部署。

#### 技术细节
- 前端: 集成在 `猫眼内容平台/client/src/features/autoclip/`
- 后端: Python FastAPI，端口 8000
- API 调用: 前端直连 `http://localhost:8000/api/v1`（vite proxy 在 middlewareMode 下不生效）

---

## 技术栈

### 前端
- React 18
- Tailwind CSS 4
- Wouter v3 (路由)
- TypeScript 5.9.3
- Vite 7.x

### 后端
- Node.js (Express/TypeScript)
- Supabase (数据库/认证)
- Python FastAPI (AutoClip)

### 部署
- AWS CloudFront CDN
- 域名: mcmamoo.com

---

## GitHub 仓库

| 项目 | 仓库 | 分支 |
|------|------|------|
| MaoAI + 官网 | `seanlab007/mcmamoo-website` | `main`, `refactor/maoai-feature-folder` |
| 猫眼内容平台 | `seanlab007/mcmamoo-website` | `feature/content-platform` (建议) |

---

## 环境变量

### MaoAI
```
ZHIPU_API_KEY=
DEEPSEEK_API_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
```

### 猫眼内容平台
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

### AutoClip
```
PYTHONPATH=/Users/mac/Desktop/AutoClip智能剪辑
```

---

## 注意事项

1. **认证系统**: 两个平台共享 Supabase 认证，用户数据互通
2. **管理员权限**: role=admin 用户可访问所有管理后台
3. **开发时**: 需要同时启动多个服务，注意端口区分
4. **云端部署**: 两个平台可以独立部署或合并部署

---

## 更新日志

| 日期 | 更新内容 |
|------|---------|
| 2026-04-03 | 平台拆分决策，添加 AD-001, AD-002 |
