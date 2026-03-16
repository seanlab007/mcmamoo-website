# Claude Code Web — AI 聊天应用 TODO

## 数据库 & 后端
- [x] 设计 conversations / messages 数据库表
- [x] 推送数据库迁移
- [x] 后端：会话列表 CRUD（创建、获取、删除）
- [x] 后端：消息历史持久化
- [x] 后端：多模型 AI 流式代理路由（DeepSeek / 智谱 / Groq）
- [x] 后端：服务状态检测端点
- [x] 后端：系统提示预设管理

## 前端
- [x] 深色主题全局样式（index.css）
- [x] 主布局：左侧会话列表 + 右侧聊天区
- [x] 聊天消息组件（Markdown 渲染 + 代码高亮）
- [x] 流式输出打字机效果
- [x] 多模型切换下拉选择器
- [x] 系统提示预设选择器
- [x] 实时状态监控指示器
- [x] 会话管理（新建、切换、删除、清空）
- [x] 移动端响应式适配
- [x] 消息输入框（支持 Shift+Enter 换行）

## 集成 & 测试
- [x] 配置 DeepSeek API Key
- [x] 配置智谱 GLM API Key
- [x] 配置 Groq API Key
- [x] 端到端流式对话测试
- [x] Vitest 单元测试（9 tests passing）

## 部署
- [x] 保存检查点
- [ ] 发布永久网址
