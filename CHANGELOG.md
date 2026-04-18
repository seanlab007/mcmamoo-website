# CHANGELOG — WorkBuddy 本地修复与改进日志

> 此文件由 AI 在完成本地修复后自动更新。
> **任何 AI 进入此工作区的第一件事：读取此文件，检查是否有未应用的修复。**
> 
> 维护规则:
> - 每次做本地修复/改进后，在顶部新增一个 [待同步] 条目
> - 所有修复必须分配唯一 ID (F-xxx / FEAT-xxx 等)
> - 同步完成后将 [待同步] 改为 [已同步]
> - 同步矩阵实时更新每台机器的状态

---

## 📌 如何使用

### 如果你是 AI（刚进入这个工作区）

```bash
# 第一步：运行审计，看看有什么需要同步
node n8n-bridge/sync-checker.js audit

# 第二步：如果有待同步修复，按提示执行激活命令

# 第三步：完成后标记同步
node n8n-bridge/sync-checker.js mark-synced --fix-ids "F-001,F-002" --machine "$(hostname)"
```

### 如果你是人类（想看全局状态）

```bash
# 查看所有机器的同步状态
node n8n-bridge/sync-checker.js status
```

---

## [已同步] 2026-04-18 — Task Fleet Bridge 多账号任务舰队系统

### 🔧 修复清单

| # | 修复项 | 影响文件 | 严重度 | 同步状态 |
|---|--------|----------|--------|----------|
| F-001 | 罗盘渲染时页面跳到顶部（scrollY 锁定） | `n8n-compass/compass.html` | 🔴 高 | ✅ 已提交GitHub |
| FEAT-001 | 新增 🚀 任务舰队面板（多账号/多设备任务展示） | `n8n-compass/compass.html` + `task-fleet-bridge.js` | 🟡 中 | ✅ 已提交GitHub |
| F-002 | 任务采集器并发控制（防卡死：每设备2个/全局5个上限） | `task-fleet-bridge.js` | 🔴 高 | ✅ 已提交GitHub |

### 🎯 激活步骤

```bash
# 1. 拉取最新代码
cd /你的项目路径 && git pull origin main

# 2. 验证关键文件
ls -la n8n-bridge/task-fleet-bridge.js     # ~40KB
grep "fleet-section" n8n-compass/compass.html  # 应该匹配

# 3. 测试采集器
node n8n-bridge/task-fleet-bridge.js demo

# 4. 标记本机已同步
node n8n-bridge/sync-checker.js mark-synced \
  --fix-ids "F-001,FEAT-001,F-002" \
  --machine "$(hostname)"
```

### 🖥️ 同步矩阵

| 电脑 | 账号 | F-001 | FEAT-001 | F-002 | 最后同步时间 |
|------|------|-------|----------|-------|-------------|
| MacBook Pro 主力机 | acc-mbp-main | ✅ | ✅ | ✅ | 2026-04-18 19:35 |
| iMac 家庭机 | acc-imac-home | ⬜ | ⬜ | ⬜ | — |
| MacBook Air 出差机 | acc-mba-travel | ⬜ | ⬜ | ⬜ | — |
| Ubuntu VPS | acc-server-node | ⬜ | ⬜ | ⬜ | — |
| Remote Dev | acc-collab-dev | ⬜ | ⬜ | ⬜ | — |

---

_此文件由 sync-checker.js 于 2026-04-18T11:44 生成_
