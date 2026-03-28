# GitHub Branch Protection Rules

本文档说明如何为 `main` 分支启用保护规则。

## 手动配置步骤

### 1. 访问仓库设置
- 进入 GitHub 仓库：https://github.com/seanlab007/mcmamoo-website
- 点击 **Settings** 标签
- 在左侧菜单中选择 **Branches**

### 2. 添加分支保护规则
- 点击 **Add rule** 按钮
- 在 **Branch name pattern** 中输入 `main`

### 3. 配置保护规则

#### 基础设置
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from code owners

- ✅ **Require status checks to pass before merging**
  - 选择以下检查项：
    - `code-quality / Code Quality & Linting`
    - `code-quality / Build & Compile`
    - `code-quality / Security Scan`

- ✅ **Require branches to be up to date before merging**

- ✅ **Require code reviews before merging**
  - Require approvals: **1**

- ✅ **Require conversation resolution before merging**

#### 高级设置
- ✅ **Require signed commits**
- ✅ **Restrict who can push to matching branches**
  - 允许的用户/团队：`seanlab007`（仓库所有者）

### 4. 保存规则
- 点击 **Create** 或 **Save changes** 按钮

## 使用 GitHub CLI 配置（可选）

如果您有 GitHub CLI 安装，可以使用以下命令自动配置：

```bash
# 需要 GitHub CLI v2.0+
gh repo rule create --branch main \
  --require-approvals 1 \
  --require-status-checks code-quality/code-quality-and-linting \
  --require-status-checks code-quality/build-compile \
  --require-status-checks code-quality/security-scan \
  --require-conversation-resolution \
  --require-code-owner-review
```

## 规则说明

| 规则 | 说明 |
|------|------|
| Require a pull request | 所有更改必须通过 PR 合并 |
| Require approvals | 至少需要 1 个代码审查批准 |
| Dismiss stale reviews | 新提交后自动清除旧的批准 |
| Require code owners | 需要代码所有者的批准 |
| Require status checks | 必须通过所有 CI/CD 检查 |
| Require signed commits | 所有提交必须使用 GPG 签名 |
| Restrict push access | 限制谁可以直接推送到主分支 |

## 受保护文件列表

以下文件受到额外保护，修改需要特殊审查：

- `client/src/App.tsx` - 主应用入口
- `client/src/pages/Home.tsx` - 首页
- `server/_core/index.ts` - 服务器核心
- `.github/workflows/code-quality.yml` - CI/CD 工作流

## PR 提交指南

提交 PR 时，请确保：

1. ✅ 没有 `TODO` 或 `FIXME` 注释
2. ✅ 代码通过 TypeScript 类型检查
3. ✅ 代码格式符合项目规范
4. ✅ 所有测试通过
5. ✅ 安全扫描无高风险问题
6. ✅ PR 描述清晰说明修改内容

## 常见问题

### Q: 为什么我的 PR 无法合并？
A: 检查以下几点：
- 是否有 TODO/FIXME 注释？
- 是否通过了所有 CI/CD 检查？
- 是否获得了至少 1 个批准？
- 是否修改了受保护文件？

### Q: 如何修改受保护文件？
A: 受保护文件只能由授权的维护者修改。如需修改，请：
1. 创建详细的 PR 说明修改原因
2. 获得代码所有者的批准
3. 通过所有 CI/CD 检查

### Q: 如何绕过分支保护？
A: 不建议绕过分支保护规则。如有特殊需求，请联系项目维护者。
