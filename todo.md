# MaoAI — 统一 AI 控制中心 TODO

## ✅ 已完成（基础聊天）
- [x] 设计 conversations / messages 数据库表
- [x] 推送数据库迁移
- [x] 后端：会话列表 CRUD（创建、获取、删除）
- [x] 后端：消息历史持久化
- [x] 后端：多模型 AI 流式代理路由（DeepSeek / 智谱 / Groq）
- [x] 后端：服务状态检测端点
- [x] 后端：系统提示预设管理
- [x] 深色主题全局样式（index.css）
- [x] 主布局：左侧会话列表 + 右侧聊天区
- [x] 聊天消息组件（Markdown 渲染 + 代码高亮）
- [x] 流式输出打字机效果
- [x] 多模型切换下拉选择器
- [x] 系统提示预设选择器
- [x] 实时状态监控指示器
- [x] 会话管理（新建、切换、删除、清空）
- [x] 配置 DeepSeek / 智谱 / Groq API Key
- [x] Vitest 单元测试（10 tests passing）

## ✅ 已完成（MaoAI 升级）
- [x] 品牌名称改为 MaoAI（侧边栏、登录页、欢迎页）
- [x] 更新登录页文案（统一 AI 控制中心 · 多节点智能路由）
- [x] 管理员入口（侧边栏盾牌图标，仅 admin 角色可见）
- [x] 新增 ai_nodes 表（节点注册：名称、类型、URL、状态、API Key）
- [x] 新增 routing_rules 表（路由策略：模式、负载均衡、节点列表）
- [x] 新增 node_logs 表（调用日志：节点、耗时、状态、token 用量）
- [x] 推送数据库迁移
- [x] 节点 CRUD tRPC 路由（nodes.list/create/update/delete/ping）
- [x] 路由规则 tRPC 路由（routing.list/create/update/delete/setDefault）
- [x] 调用日志 tRPC 路由（logs.list/byNode/stats）
- [x] 智能路由引擎（selectNode：付费/免费/手动/优先级/轮询/最低延迟）
- [x] 故障转移机制（节点失败自动切换内置模型）
- [x] 节点自动注册 API（POST /api/ai/node/register）
- [x] 调用日志自动记录（延迟、状态、token 用量）
- [x] 管理员控制台 - 节点管理页面（/admin/nodes）
- [x] 管理员控制台 - 路由策略页面（/admin/routing）
- [x] 管理员控制台 - 调用日志页面（/admin/logs）
- [x] 注册管理员路由到 App.tsx
- [x] NODE_REGISTRATION_TOKEN 配置
- [x] 节点接入文档（NODE_INTEGRATION.md）

## 🔧 待完成（配置与接入）
- [ ] 将账户升级为管理员（数据库执行：UPDATE users SET role='admin' WHERE ...）
- [ ] 添加 Claude API 节点（需要 Anthropic API Key）
- [ ] 配置 OpenManus 云端节点 URL
- [ ] 配置 OpenClaw 本地节点 URL
- [ ] 配置 WorkBuddy 节点 URL
- [ ] 绑定自定义域名 mcmamoo.com（在 Settings > Domains 中配置）

## 🚀 后续迭代
- [ ] 节点定时心跳检测（自动更新在线状态）
- [ ] 任务队列（多节点并行处理长任务）
- [ ] Token 用量统计图表（管理员仪表盘）
- [ ] 节点在线率趋势图
- [ ] MaoAI 猫咪 Logo SVG 设计

## 猫眼自动化内容平台升级（la-celle1802.com 推广）

- [ ] 将猫眼平台集成为 /platform 路由页面（重写 Platform.tsx）
- [ ] UI 美观优化：深色奢华主题、金色点缀、玻璃拟态卡片
- [ ] 后端：AI 文案生成 tRPC 路由（platform.generateCopy）
- [ ] 后端：文案库 CRUD（platform.saveCopy/listCopies/deleteCopy）
- [ ] 批量生成 la-celle1802.com 推广文案（小红书/Instagram/X/微信）
- [ ] 文案库管理页面（保存、分类、导出 Markdown）
- [ ] 内容日历（排期管理）
- [ ] 多平台分发逻辑（一键生成多平台版本）
- [ ] 推送更新到 GitHub mcmamoo-website

## Cloudflare Pages 部署 & X.com 自动发布

- [ ] 配置 Cloudflare Pages 自动部署（连接 GitHub 仓库）
- [ ] 添加 wrangler.toml 和构建配置文件
- [ ] 集成 X.com (Twitter) API v2 发布接口（后端路由）
- [ ] 在文案库添加「发布到 X」按钮（前端 UI）
- [ ] 存储 X OAuth Token 到数据库
