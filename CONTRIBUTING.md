# CONTRIBUTING.md - 贡献指南

**版本：** v2.0  
**更新日期：** 2026-04-22

---

## 欢迎贡献！

感谢您对本项目的兴趣。本文档将帮助您了解如何为本项目做出贡献。

## 开发环境设置

### 前置要求

- Node.js 18+
- pnpm 8+
- Git

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/seanlab007/mcmamoo-website.git
cd mcmamoo-website

# 安装依赖
pnpm install

# 复制环境变量文件
cp .env.example .env.local
# 编辑 .env.local 填入必要的配置

# 启动开发服务器
pnpm run dev
```

## 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 主分支，稳定版本 |
| `feat/*` | 新功能开发 |
| `fix/*` | Bug 修复 |
| `hotfix/*` | 紧急修复 |
| `chore/*` | 杂项（依赖升级等） |

## 开发流程

### 1. 创建分支

```bash
# 从 main 创建新分支
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

### 2. 开发与测试

```bash
# 开发模式
pnpm run dev

# 类型检查
pnpm run typecheck

# 构建测试
pnpm run build
```

### 3. 提交代码

```bash
# 添加修改的文件
git add .

# 提交（使用语义化提交信息）
git commit -m "feat(component): 添加新功能描述"
```

**提交类型：**

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 杂项（依赖、构建等） |

### 4. 推送到远程

```bash
git push origin feat/your-feature-name
```

### 5. 创建 Pull Request

在 GitHub 上创建 PR，描述中请包含：

```markdown
## 修改目的
<!-- 简要说明本次修改解决了什么问题 -->

## 修改内容
| 文件 | 变更类型 | 说明 |
|------|----------|------|
| ...  | ... | ... |

## 测试结果
- [ ] 本地构建通过
- [ ] 功能测试通过
- [ ] 移动端适配正常

## 影响范围
<!-- 本次修改是否影响其他功能 -->
```

## 代码规范

请参考 [CODE_STANDARDS.md](./CODE_STANDARDS.md) 了解详细的代码规范要求。

### 关键要求

1. **TypeScript**：所有代码必须使用 TypeScript，禁止使用 `any`
2. **注释**：组件和函数必须使用 JSDoc 风格的注释
3. **测试**：修改后进行本地测试，确保不破坏现有功能

## 常见问题

### 构建失败

```bash
# 清除缓存并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

### 类型错误

```bash
pnpm run typecheck
```

## 许可证

本项目采用 MIT 许可证。
