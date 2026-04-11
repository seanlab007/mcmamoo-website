# WorkBuddy 工作规范

> 最后更新：2026-04-10

## 核心原则：桌面目录是唯一真相

**主工作目录**：`/Users/daiyan/Desktop/mcmamoo-website/`

WorkBuddy 只是操作终端，**直接编辑桌面目录里的文件**，绝不创建项目副本。

---

## 工作规范

### 1. 禁止创建副本（最重要）

- **直接操作** `/Users/daiyan/Desktop/mcmamoo-website/`，所有 `read_file`、`edit`、`execute_command` 都指向这里
- **绝不**在 WorkBuddy 的日期目录（如 `20260410xxxxx/`）里复制项目文件
- **绝不**在 WorkBuddy 工作区内按日期堆积副本
- WorkBuddy 工作区内只存放 `.workbuddy/memory/` 等自身配置文件

### 2. 端口规范

- 本地开发端口固定为 **3000**
- 访问地址：`http://localhost:3000`
- MaoAI 路由：`http://localhost:3000/maoai`
- 端口 3000 被占用时，先 `lsof -i :3000 | grep LISTEN` 找 PID，kill 掉再启动

### 3. 启动规范

```bash
cd /Users/daiyan/Desktop/mcmamoo-website
npm install      # 首次或 package.json 变动后
npm run dev      # 启动开发服务器（固定端口 3000）
```

### 4. 桌面目录说明

| 目录 | 状态 | 说明 |
|------|------|------|
| `/Desktop/mcmamoo-website/` | ✅ 使用中 | 唯一主工作目录 |
| `/Desktop/mcmamoo官网备份/` | 🔒 保留 | 历史备份，不要修改 |
| `/Desktop/MaoAI/` | ❌ 已删除 | 2026-04-10 清理 |
| WorkBuddy 内的任何项目副本 | ❌ 禁止 | 不要创建 |

---

## 项目结构速查

```
mcmamoo-website/
├── client/              # 前端（Vite + React + TypeScript）
│   └── src/
│       └── features/
│           └── maoai/   # MaoAI 子模块前端代码
├── server/              # 后端（Express + tRPC）
│   ├── _core/
│   │   └── index.ts    # 服务器入口（端口固定 3000）
│   ├── aiStream.ts      # AI 流式响应
│   ├── chat.ts          # 对话历史
│   └── ...
├── shared/              # 前后端共享类型
├── package.json
└── vite.config.ts
```

---

## 常见问题

**Q: 端口 3000 被占用怎么办？**
```bash
lsof -i :3000 | grep LISTEN
kill -9 <PID>
npm run dev
```

**Q: 新装依赖后启动报错？**
```bash
cd /Users/daiyan/Desktop/mcmamoo-website
rm -rf node_modules
npm install
npm run dev
```
