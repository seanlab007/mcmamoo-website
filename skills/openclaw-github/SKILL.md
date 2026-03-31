---
name: openclaw-github
description: "查询 GitHub 仓库的 PR、Issue、CI 运行状态。当用户询问代码仓库状态、PR 合并情况、CI 构建结果时使用。"
metadata:
  maoai:
    emoji: "🐙"
    toolName: "openclaw_github"
    category: "engineering"
---

# GitHub 操作 Skill

通过 GitHub REST API 查询仓库信息（需配置 GITHUB_TOKEN 环境变量）。

## 触发条件

✅ 当用户询问：
- "最近有哪些 PR"
- "CI 跑过了吗"
- "有没有未处理的 Issue"
- "帮我创建一个 Issue"

## 支持的操作

| action | 说明 | 必要参数 |
|--------|------|----------|
| list_prs | 列出 PR | repo, state |
| get_pr | 查看 PR 详情 | repo, number |
| list_issues | 列出 Issue | repo, state |
| create_issue | 创建 Issue | repo, title |
| get_runs | 查看 CI 运行 | repo |
| list_repos | 列出用户仓库 | user |

## 使用示例

```
// 列出 open PR
openclaw_github("list_prs", { repo: "seanlab007/mcmamoo-website" })

// 查看 CI 状态
openclaw_github("get_runs", { repo: "seanlab007/mcmamoo-website" })

// 创建 Issue
openclaw_github("create_issue", {
  repo: "seanlab007/mcmamoo-website",
  title: "Bug: 登录页面样式错位",
  body: "在 iPhone 15 上登录按钮样式错位..."
})
```

## 配置
需要在环境变量中设置：
```
GITHUB_TOKEN=ghp_xxxx
```
