---
name: openclaw-memory
description: "持久化记忆存储。帮用户跨会话保存和检索重要信息、项目笔记、个人偏好。"
metadata:
  maoai:
    emoji: "🧠"
    toolName: "openclaw_memory"
    category: "specialized"
---

# 持久化记忆 Skill

将用户重要信息存储到 Supabase，实现跨会话持久记忆。

## 触发条件

✅ 当用户说：
- "记住..."
- "保存这个..."
- "告诉我你记得的..."
- "删除...这条记录"

## 操作类型

| action | 说明 |
|--------|------|
| write | 保存记忆 |
| read | 读取指定记忆 |
| list | 列出所有记忆 |
| delete | 删除记忆 |

## 记忆键名规范

```
user_preferences    — 用户偏好（主题、语言等）
project_[name]      — 项目相关备注
api_notes           — API 密钥备注（不存储实际密钥）
todo_[YYYY-MM-DD]   — 待办事项
meeting_[topic]     — 会议记录
```

## 使用示例

```
// 保存偏好
openclaw_memory("write", {
  key: "user_preferences",
  value: "深色主题，TypeScript，React，中文回复",
  tags: ["preferences", "ui"]
})

// 读取
openclaw_memory("read", { key: "user_preferences" })

// 列出所有
openclaw_memory("list")
```

## 数据库依赖
需要在 Supabase 中执行 `supabase/openclaw-skills-schema.sql` 创建 `mao_memories` 表。
