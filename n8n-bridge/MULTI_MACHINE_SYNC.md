# 🖥️ WorkBuddy 多机打通方案 — 阻塞检测 & 跨机状态同步

> 版本: v1.0 | 创建: 2026-04-18 | 状态: 已实现 MVP

## 问题

```
电脑 A (MacBook Pro) ──→ WorkBuddy 执行任务 → 遇阻塞 → 卡死
                                              ↓
                              你不知道，浪费时间

电脑 B (另一台机器)         ──→ 闲着，完全不知道 A 的状态
```

**核心痛点**：
1. **看不到阻塞** — 任务卡住时没有告警
2. **多机不感知** — B 不知道 A 在干什么
3. **没有恢复机制** — 卡死后只能手动重启

---

## 架构设计

```
┌─────────────────────────────────────────────────────┐
│                  ~/.maoai-sync/                      │
│  ┌──────────┐  ┌────────────┐  ┌────────────────┐  │
│  │state.json│  │health.json │  │events.jsonl    │  │
│  │OKR 状态  │  │机器健康状态 │  │变更事件日志    │  │
│  └──────────┘  └────────────┘  └────────────────┘  │
│          ↑ 写入            ↑ 写入      ↑ 追加写入   │
│          │                │           │             │
├──────────┴────────────────┴───────────┴─────────────┤
│              共享目录（多机通过 Git/Sync 同步）        │
└─────────────────────────────────────────────────────┘
         ↑                    ↑
   电脑 A (主力机)       电脑 B (辅助机)
   ┌─────────────┐     ┌─────────────┐
   │ WorkBuddy   │     │ WorkBuddy   │
   │ health-monitor│  │ health-monitor│
   │ ↓ 每30s心跳  │     │ ↓ 每30s心跳  │
   │ health.json  │ ←→ │ health.json  │
   └──────┬──────┘     └──────┬──────┘
          │                   │
          └───────┬───────────┘
                  ↓
          ┌──────────────┐
          │  OKR 罗盘页面  │  ← 实时读取 health.json 渲染
          │  🏥 健康面板   │
          └──────────────┘
```

---

## 文件清单

| 文件 | 作用 |
|------|------|
| `n8n-bridge/workbuddy-health-monitor.js` | **核心**：Node.js 健康监控器（心跳/阻塞检测/跨机感知）|
| `n8n-compass/compass.html`（更新）| 新增 🏥 系统健康面板，展示各台设备状态 |

---

## 快速上手

### 第一步：两台电脑都安装 Health Monitor

每台机器上执行：

```bash
# 复制到本地可执行路径
mkdir -p ~/.workbuddy/tools
cp n8n-bridge/workbuddy-health-monitor.js ~/.workbuddy/tools/

# 启动监控（电脑 A）
node ~/.workbuddy/tools/workbuddy-health-monitor.js start

# 启动监控（电脑 B）— 修改 machineId 和 machineName
# 编辑 CONFIG 部分：
#   machineId: "pc-secondary"
#   machineName: "备用电脑"
node ~/.workbuddy/tools/workbuddy-health-monitor.js start
```

### 第二步：配置每台机器的身份

打开 `workbuddy-health-monitor.js`，修改 `CONFIG`：

```javascript
// === 电脑 A（MacBook Pro）===
const CONFIG = {
  machineId: "macbook-pro",           // 唯一标识
  machineName: "MacBook Pro 主力机",  // 显示名称
  stuckThreshold: 120,                // 2分钟无响应 = 可能阻塞
  dangerThreshold: 300,               // 5分钟 = 确认卡死
  heartbeatInterval: 30_000,          // 30秒一次心跳
};

// === 电脑 B（备用机）===
const CONFIG = {
  machineId: "pc-secondary",
  machineName: "Windows 辅助机",
  // ... 其他同上
};
```

### 第三步：查看状态

```bash
# 查看所有设备状态
node ~/.workbuddy/tools/workbuddy-health-monitor.js status

# 只检查其他机器是否有异常
node ~/.workbuddy/tools/workbuddy-health-monitor.js check

# 停止监控
node ~/.workbuddy/tools/workbuddy-health-monitor.js stop
```

---

## 阻塞检测逻辑

```
时间线:
  t=0s     心跳 #1 ✅  healthy
  t=30s    心跳 #2 ✅  healthy
  t=60s    心跳 #3 ✅  healthy
  ...
  t=120s   ⚠️ 超过 stuckThreshold(120s) → 标记为 stuck（可能阻塞）
  ...
  t=300s   🔴 超过 dangerThreshold(300s) → 标记为 danger（确认卡死）
```

**触发条件**：
- 上次心跳时间距今 > 2 分钟 → `stuck`（警告）
- 上次心跳时间距今 > 5 分钟 → `danger`（严重）

**自动动作**：
1. 写入 `health.json` 更新状态
2. 追加告警到 `health.log`
3. 如果 n8n 运行中，POST `/webhook/health-beat` 推送告警
4. 罗盘健康面板实时显示红色闪烁

---

## 多机同步方案（3 种选择）

### 方案 A：共享文件系统（推荐，最简单）

**前提**：两台电脑能访问同一份 `~/.maoai-sync/` 目录。

实现方式：
- **iCloud / Dropbox / OneDrive** 同步文件夹
- 或者 **NAS 共享目录**
- 或者 **Git 自动 pull/push**

```bash
# 例如用 iCloud:
ln -s ~/Library/Mobile\ Documents/com~apple~CloudDocs/maoai-sync ~/.maoai-sync
```

**优点**：零配置，自动同步  
**缺点**：依赖云服务延迟（几秒到几分钟）

### 方案 B：n8n Webhook 中转（推荐，有 n8n 后）

数据流：
```
电脑A → POST /health-beat → n8n → 写 Supabase → 罗盘从 Supabase 读
电脑B → POST /health-beat ↗
```

**优点**：实时、支持远程访问  
**缺点**：需要 n8n 云端部署

### 方案 C：局域网 WebSocket 直连（最快）

两台电脑在同一个 WiFi 下，直接 P2P 通信。

**优点**：毫秒级延迟  
**缺点**：需要额外写 WS 服务端

---

## 罗盘健康面板说明

罗盘底部新增的 **🏥 系统健康** 区域会显示：

```
🏥 系统健康 — 多机状态监控                          2 台设备
┌──────────────────────────┐  ┌──────────────────────────┐
│ ✅ MacBook Pro (主力机)  │  │ ⚠️ Windows 辅助机        │
│ [HEALTHY]                │  │ [STUCK]                  │
│                          │  │                          │
│ OKR 罗盘数据更新          │  │ DMB Phase 代码推送        │
│ 正在更新 3 板块进度       │  │ 无响应超过 3 分钟         │
│                          │  │                          │
│ 🕐 刚刚  ⏱️45min  🌐...  │  │ 🕐 3分钟前  ⏱️120min ... │
└──────────────────────────┘  └──────────────────────────┘
```

**颜色含义**：
- 🟢 绿色 (`healthy`) — 正常工作
- 🟡 黄色 (`stuck`) — 超过 2 分钟无响应（可能阻塞）
- 🔴 红色 (`danger`, 闪烁) — 超过 5 分钟无响应（确认卡死）
- ⚪ 灰色 (`offline`) — 设备离线

---

## 与 WorkBuddy 任务集成

Health Monitor 可以与 `workbuddy-bridge.js` 联动：

```javascript
// 在任务开始时
const monitor = require('./workbuddy-health-monitor');
monitor.updateCurrentTask({
  id: 'wb_007',
  title: '修复 Railway 部署',
  progress: 30,
  step: '正在检查 merge conflicts',
  status: 'running'
});

// 任务完成时
monitor.completeTask('wb_007');

// 遇到阻塞时（主动上报！）
monitor.reportHealth({
  id: 'wb_007',
  title: '修复 Railway 部署',
  progress: 85,
  step: '⛔ 阻塞：等待用户绑卡升级 Railway',
  status: 'stuck'
});
```

---

## 下一步规划

| 优先级 | 功能 | 状态 |
|--------|------|------|
| P0 | 本地健康监控 + 阻塞检测 | ✅ 已完成 |
| P0 | 罗盘健康面板渲染 | ✅ 已完成 |
| P1 | n8n Webhook 告警推送 | 待 n8n 部署后激活 |
| P1 | 局域网多机自动发现 | 可选 |
| P2 | Telegram/微信推送告警消息 | 规划中 |
| P2 | 自动重启策略（检测到 danger 时自动 recovery）| 规划中 |
