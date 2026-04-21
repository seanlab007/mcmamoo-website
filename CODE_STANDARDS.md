# Mc&Mamoo Website 代码规范与协作指南

**版本：** v3.0  
**更新日期：** 2026-04-22  
**更新说明：** WorkBuddy 能力提升，移除核心文件保护限制，全面开放修改权限

---

为了保证代码库的整洁、稳定，防止多 Agent（如 WorkBuddy, OpenClaw）协作时出现代码冲突或核心板块被覆盖的问题，特制定本规范。

## 1. 技术栈

| 分类 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + TypeScript + Vite | 核心前端技术 |
| 样式方案 | Tailwind CSS + Shadcn/ui | UI 组件库 |
| 后端框架 | Node.js + Express + TypeScript | API 服务端 |
| 数据库 | Supabase (PostgreSQL) | 数据存储与认证 |
| 部署方案 | AWS CloudFront / Vercel / Railway | 前端 CDN + 后端部署 |

## 2. 工作流程规范

### 2.1 Agent 权限（已全面开放）

| 操作类型 | 权限 |
|----------|------|
| 新建功能页面 / 组件 | ✅ 允许 |
| 修改 App.tsx / Home.tsx / Navbar.tsx | ✅ 允许（全面开放） |
| 新建 API 路由 | ✅ 允许 |
| 修改 vite.config.ts / package.json | ✅ 允许 |
| 执行数据库迁移 | ⚠️ 需确认 |
| 推送到 main 分支 | ⚠️ 需确认 |
| 部署到生产环境 | ⚠️ 需确认 |

> **重要更新 (v3.0)：** WorkBuddy 现已获得管理员权限，可全面修改所有文件，包括之前受保护的核心文件（App.tsx、Home.tsx、Navbar.tsx 等）。修改时应遵循本规范的其他条款。

### 2.2 开发流程

```
接到任务 → 分析需求 → 评估影响 → 执行开发 → 本地测试 → 提交代码 → 汇报结果
```

### 2.3 PR 描述模板

```markdown
## 修改目的
<!-- 简要说明本次修改解决了什么问题，或新增了什么功能 -->

## 修改内容
| 文件 | 变更类型 | 说明 |
|------|----------|------|
| ...  | 新增/修改/删除 | ... |

## 测试结果
- [ ] 本地 pnpm dev 启动无报错
- [ ] 修改的页面/组件在浏览器中正常显示
- [ ] 移动端响应式布局正常
- [ ] 未破坏其他页面的功能

## 影响范围
<!-- 本次修改是否影响其他页面或组件 -->
```

## 3. 文件注释规范

### 3.1 文件头部注释模板

每次新建文件时，必须在文件顶部包含以下注释：

```typescript
/*
 * ============================================================
 * File: [文件名，如 Navbar.tsx]
 * Description: [一句话描述该文件的功能]
 * Author: [创建者，如 Sean / WorkBuddy / OpenClaw]
 * Date: [创建日期，如 2026-04-22]
 * ============================================================
 */
```

### 3.2 组件 / 函数 JSDoc 注释模板

所有导出的 React 组件、核心业务逻辑函数、API 路由，必须使用以下 JSDoc 风格注释：

```typescript
/**
 * [组件/函数名称]
 *
 * [详细描述该组件或函数的作用、业务逻辑]
 *
 * @param {Type} paramName - [参数说明]
 * @returns {Type} [返回值说明]
 *
 * @example
 * // 使用示例
 * <MyComponent prop1="value" />
 */
```

## 4. 目录结构规范

请严格遵守以下目录结构：

```text
mcmamoo-website/
├── client/                 # 前端 React 代码
│   ├── src/
│   │   ├── components/     # 可复用的 UI 组件
│   │   │   └── sections/   # 页面级大区块组件 (如 Hero, About)
│   │   ├── pages/          # 路由页面组件 (如 Home, Pricing)
│   │   ├── hooks/          # 自定义 React Hooks
│   │   ├── lib/            # 工具函数、i18n 配置、API 客户端
│   │   └── locales/        # 多语言翻译文件 (*.json)
├── server/                 # 后端 Node.js/Express 代码
│   ├── routers/            # API 路由定义
│   └── _core/              # 核心中间件、数据库连接
├── shared/                 # 前后端共享类型定义 (TypeScript Interfaces)
└── supabase/               # 数据库迁移文件、Edge Functions
```

## 5. TypeScript 规范

- **所有文件必须使用 TypeScript**，禁止使用 `any`（特殊情况需注释说明）
- Supabase 表结构必须同步更新 `shared/` 目录下的 TypeScript interface
- API 响应类型必须定义，前后端共享 `shared/types/` 中的接口
- 使用 `zod` 对用户输入进行 schema 校验，防止注入攻击

## 6. React 组件规范

- 组件文件名使用 **PascalCase**（如 `WalletCard.tsx`）
- Hook 文件名以 **use** 开头（如 `useWalletBalance.ts`）
- 工具函数放入 `client/src/lib/`，不在组件内定义业务逻辑函数
- 避免超过 **300 行**的超大组件，必要时拆分子组件
- 使用 `React.memo`、`useMemo`、`useCallback` 避免不必要的重渲染

## 7. Git 提交规范

### 7.1 分支策略

| 分支类型 | 用途 | 示例 |
|----------|------|------|
| main | 主分支 | - |
| feat/xxx | 功能分支 | feat/maoai-integration |
| fix/xxx | 修复分支 | fix/login-redirect |
| hotfix/xxx | 紧急修复 | hotfix/production-bug |
| chore/xxx | 杂项分支 | chore/deps-upgrade |

### 7.2 提交信息格式

```
<类型>(<范围>): <简短描述>

feat(wallet): 添加 MetaMask 一键连接功能
fix(auth): 修复 Supabase 登录后重定向失败问题
chore(deps): 升级 viem 到 2.x
refactor(api): 重构 transactions 路由，统一错误格式
docs(readme): 更新本地开发启动步骤
```

### 7.3 提交要求

- **禁止**包含 TODO/FIXME 的未完成代码直接推送到 main 分支
- 所有新功能开发必须在独立分支进行
- 推送到 main 分支前需本地构建通过：`pnpm run build`

## 8. API 设计规范

### 8.1 统一 API 响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}
```

### 8.2 API 路由规范

- 所有 API 端点必须进行身份验证
- 敏感操作必须实现二次确认机制
- 用户输入必须经过 zod schema 校验
- Rate Limiting：所有 API 端点配置访问频率限制

## 9. 安全规范

### 9.1 核心安全要求

- 所有 API 端点必须进行身份验证（Supabase Auth Token 或 Web3 签名验证）
- 敏感操作（转账、提现）必须实现二次确认机制
- 用户输入必须经过 zod schema 校验和 SQL 注入防护
- Rate Limiting：所有 API 端点配置访问频率限制
- CORS 配置：仅允许授权域名访问 API

### 9.2 数据库安全

- Supabase RLS (Row Level Security) 必须为所有表启用
- Service Role Key 仅在服务端使用，绝不暴露给前端
- 数据库迁移脚本必须经过审查后才能执行

## 10. 环境变量规范

以下环境变量必须在对应平台配置，**禁止硬编码到代码中**：

```bash
# 前端环境变量
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
VITE_API_BASE_URL=https://api.example.com

# 后端环境变量
DATABASE_URL=<supabase_postgres_connection_string>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
JWT_SECRET=<your_jwt_secret>
```

> ⚠️ 所有含 SECRET / KEY / TOKEN 的变量严禁提交到 GitHub  
> ✅ 在 `.gitignore` 中确保 `.env`, `.env.local`, `.env.production` 已被忽略

## 11. 本地开发

```bash
# 安装依赖（使用 pnpm）
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的 Supabase 配置

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 类型检查
pnpm run typecheck
```

---

**版本历史**

| 版本 | 日期 | 变更记录 |
|------|------|----------|
| v1.0 | 2026-03-27 | 初始版本 |
| v2.0 | 2026-03-30 | 整合 DarkMatterBank 规范 |
| v3.0 | 2026-04-22 | 移除核心文件保护限制，全面开放 WorkBuddy 权限 |
