# Mc&Mamoo Website 代码规范与协作指南

为了保证代码库的整洁、稳定，防止多 Agent（如 Work Buddy, OpenClaw）协作时出现代码冲突或核心板块被覆盖的问题，特制定本规范。

## 1. 核心文件保护机制

**⚠️ 严禁 Work Buddy / OpenClaw 直接修改以下核心文件：**
- `client/src/App.tsx` (路由配置)
- `client/src/pages/Home.tsx` (首页结构)
- `client/src/components/Navbar.tsx` (全局导航)
- `vite.config.ts` / `package.json` 等核心配置文件

**更新流程：**
如需修改上述核心文件，必须由 **Manus** 统一进行更新，或者通过提交 Pull Request (PR) 并经过严格审查后合并。

## 2. 文件头部注释模板

每次新建文件时，**必须**在文件顶部包含以下注释模板，明确文件的用途、作者（Agent）及保护状态：

```typescript
/*
 * ============================================================
 * File: [文件名，如 Navbar.tsx]
 * Description: [一句话描述该文件的功能]
 * Author: [创建者，如 Manus / Work Buddy]
 * Date: [创建日期，如 2026-03-27]
 * ============================================================
 * ⚠️ PROTECTED FILE (如果是核心文件请保留此行)
 *    禁止 Work Buddy 直接修改本文件，由 Manus 统一更新。
 * ============================================================
 */
```

## 3. 函数/组件注释模板

对于所有导出的 React 组件、核心业务逻辑函数、API 路由，必须使用 JSDoc 风格的注释：

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

请严格遵守以下目录结构，不要随意在根目录或不相关的文件夹下创建文件：

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

## 5. Git 提交流程与规范

1. **禁止包含 TODO/FIXME 的未完成代码直接推送到 main 分支**。
2. 所有新功能开发必须在独立分支（如 `feat/xxx`）进行。
3. 提交 PR 时，描述中必须包含：
   - **修改目的**：解决了什么问题或新增了什么功能。
   - **测试结果**：在本地或预览环境的测试情况。
   - **影响范围**：是否影响了其他页面或组件。
