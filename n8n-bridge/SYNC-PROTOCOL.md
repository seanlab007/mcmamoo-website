# 🔄 Cross-Device Sync Protocol（跨设备修复同步协议）

> **版本**: v1.0.0 | **创建日期**: 2026-04-18  
> **问题背景**: 3台电脑 × 5个WorkBuddy账号，本地修复经常不同步，AI进来了不知道要更新什么

---

## 📌 核心问题

```
┌─────────────┐  做了修复    ┌─────────────┐
│  MacBook Pro │ ──────────► │  本地文件    │  ❌ 没记录！其他电脑不知道
│  (主力机)    │             │  已修改      │
└─────────────┘             └──────┬──────┘
                                  │ 其他AI进来
                    ┌─────────────▼─────────────┐
                    │  不知道有修复 → 跳过       │  💀 卡死/重复造轮子
                    │  或者下载了但不激活        │  💀 文件有了但没用上
                    └──────────────────────────┘
```

## ✅ 解决方案：三层同步机制

### Layer 1: `CHANGELOG.md` — 全局变更日志（Git 追踪）

**每个工作区根目录必须有一个**，记录所有本地修复和改进。

```markdown
# CHANGELOG — WorkBuddy 本地修复与改进日志

> 此文件由 AI 在完成本地修复后自动更新。
> **任何 AI 进入此工作区的第一件事：读取此文件，检查是否有未应用的修复。**

---

## [待同步] 2026-04-18 — 任务舰队系统 + 罗盘防跳转

### 🔧 修复清单

| # | 修复项 | 影响文件 | 严重度 | 同步状态 |
|---|--------|----------|--------|----------|
| F-001 | 罗盘渲染时页面跳到顶部 | `n8n-compass/compass.html` | 🔴 高 | ✅ 已提交GitHub |
| F-002 | 新增任务舰队面板 | `n8n-compass/compass.html` + `task-fleet-bridge.js` | 🟡 中 | ✅ 已提交GitHub |
| F-003 | 并发控制防止卡死 | `task-fleet-bridge.js` | 🔴 高 | ✅ 已提交GitHub |

### 🎯 如何激活（每个账号都要做）

```bash
# Step 1: 拉取最新代码
cd /你的项目路径 && git pull origin main

# Step 2: 验证文件存在
ls -la n8n-bridge/task-fleet-bridge.js   # 应该存在 (~40KB)
ls -la n8n-compass/compass.html           # 应该包含 "fleet-section"

# Step 3: 测试采集器
node n8n-bridge/task-fleet-bridge.js demo  # 应该生成 fleet-state.json

# Step 4: 标记本机已同步（重要！）
node n8n-bridge/sync-checker.js mark-synced --fix-ids F-001,F-002,F-003 --machine "$(hostname)"
```

### 🖥️ 同步矩阵

| 电脑 | 账号 | F-001 | F-002 | F-003 | 最后同步时间 |
|------|------|-------|-------|-------|-------------|
| MacBook Pro | acc-mbp-main | ✅ | ✅ | ✅ | 2026-04-18 19:35 |
| iMac | acc-imac-home | ⬜ 待同步 | ⬜ 待同步 | ⬜ 待同步 | — |
| MacBook Air | acc-mba-travel | ⬜ 待同步 | ⬜ 待同步 | ⬜ 待同步 | — |
| VPS | acc-server-node | ⬜ 待同步 | ⬜ 待同步 | ⬜ 待同步 | — |
| Remote Dev | acc-collab-dev | ⬜ 待同步 | ⬜ 待同步 | ⬜ 待同步 | — |

---
```

### Layer 2: `.sync-status.json` — 本机同步状态（每台电脑各自维护）

**不提交到 Git**（在 `.gitignore` 中），每台电脑记录自己哪些修复已应用。

```json
{
  "version": "1.0.0",
  "machineId": "mbp-pro",
  "machineName": "MacBook Pro",
  "hostname": "Daiyans-MacBook-Pro.local",
  "lastSyncTime": "2026-04-18T19:35:00Z",
  "syncedFixes": [
    {
      "fixId": "F-001",
      "appliedAt": "2026-04-18T19:30:00Z",
      "appliedBy": "WorkBuddy-AI-session-20260417234313"
    },
    {
      "fixId": "F-002", 
      "appliedAt": "2026-04-18T19:32:00Z",
      "appliedBy": "WorkBuddy-AI-session-20260417234313"
    },
    {
      "fixId": "F-003",
      "appliedAt": "2026-04-18T19:35:00Z",
      "appliedBy": "WorkBuddy-AI-session-20260417234313"
    }
  ],
  "pendingFixes": []
}
```

### Layer 3: `sync-checker.js` — 自动检测工具

**任何 AI 进来后运行一次，自动告诉你**：
1. 这个工作区有哪些修复没应用？
2. 本机和远程版本差多少？
3. 一键生成同步命令。

---

## 🤖 AI 入场协议（强制执行）

**当任何一个 AI（任何 session、任何账号）进入工作区时，必须按顺序执行：**

```
Step 1: 读取 CHANGELOG.md → 了解所有已发布的修复
Step 2: 运行 node sync-checker.js audit → 检查本机状态
Step 3: 如果有待同步修复:
   a) git pull 拉取最新代码
   b) 按照 CHANGELOG 中的「如何激活」步骤执行
   c) 运行 node sync-checker.js mark-synced 标记完成
Step 4: 开始正常工作
```

## 📝 修复 ID 编码规范

| 前缀 | 含含义 | 示例 |
|------|--------|------|
| `F-` | Fix / Bug 修复 | `F-001` 罗盘防跳转 |
| `FEAT-` | Feature / 新功能 | `FEAT-001` 任务舰队面板 |
| `PERF-` | Performance / 性能优化 | `PERF-001` 并发控制 |
| `SEC-` | Security / 安全修复 | `SEC-001` API Key 加密 |
| `CONF-` | Config / 配置变更 | `CONF-001` 环境变量模板更新 |

严重度标签：
- 🔴 **高** — 必须立即同步，否则会卡死/数据丢失
- 🟡 **中** — 应该尽快同步，影响功能完整性
- 🟢 **低** — 可以延后，锦上添花的改进

---

## 🗂️ 文件结构

```
mcmamoo-website/
├── CHANGELOG.md                  ← Git追踪, 全局变更日志(必读)
├── .gitignore                    ← 包含 .sync-status.json
├── .sync-status.json             ← 不追踪, 本机同步状态(自动生成)
│
├── n8n-bridge/
│   ├── sync-checker.js           ← 同步检测工具(新增)
│   ├── task-fleet-bridge.js      ← 任务采集器
│   └── TASK_FLEET_ARCHITECTURE.md
│
└── n8n-compass/
    └── compass.html              ← 罗盘(含任务舰队+同步状态面板)
```

---

## 🔄 数据流

```
  AI 完成修复 (MacBook Pro)
    │
    ▼
  1. 更新 CHANGELOG.md (git commit)
    │
    ▼
  2. git push → GitHub
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
iMac 进来                          MacBook Air 进来
  │                                      │
  ▼                                      ▼
读 CHANGELOG.md                     读 CHANGELOG.md
  │                                      │
  ▼                                      ▼
运行 sync-checker.js audit          运行 sync-checker.js audit
  │         │                            │         │
  │    发现 F-001~003 未同步         发现全部未同步
  │         │                            │         │
  ▼         ▼                            ▼         ▼
git pull   执行激活步骤             git pull   执行激活步骤
  │         │                            │         │
  ▼         ▼                            ▼         ▼
mark-synced ✓                       mark-synced ✓
```

---

_最后更新: 2026-04-18 by 润之_
