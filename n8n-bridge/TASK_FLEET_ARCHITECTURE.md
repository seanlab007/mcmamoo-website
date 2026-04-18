# 🚀 Task Fleet Bridge — 多账号任务舰队系统

## 架构概述

### 问题
- **3台电脑** × **5个 WorkBuddy 账号** = 最多 15 个并发任务
- 任务跑着跑着**卡死**，不知道卡在哪
- 每个账号有独立的工作区，**无法互相感知**
- 罗盘上的任务是**硬编码的**，不是真实进度

### 解决方案

```
┌─────────────────────────────────────────────────┐
│              🧭 OKR 罗盘 (compass.html)           │
│         读取 fleet-state.json 渲染任务舰队        │
└──────────────┬──────────────────────────────────┘
               │ 读取 (每10秒轮询)
               ▼
┌─────────────────────────────────────────────────┐
│         fleet-state.json (共享状态文件)           │
│    ~/.maoai-sync/fleet-state.json              │
│                                                 │
│  {                                              │
│    accounts: {                                  │
│      "account-A": {                             │
│        machine: "MacBook Pro",                  │
│        workspace: "/Users/daiyan/WorkBuddy/xxx", │
│        tasks: [...],                            │
│        status: "healthy|stuck|danger|offline",  │
│        lastSync: "ISO timestamp"                │
│      }, ...                                     │
│    },                                           │
│    concurrency: { max: 3, current: 2 },         │
│    globalAlerts: [...]                          │
│  }                                              │
└──────────────┬──────────────────────────────────┘
               │ 写入 (每个账号各自上报)
       ┌───────┼───────┐
       ▼       ▼       ▼
  ┌────────┐ ┌────────┐ ┌────────┐
  │ 账号 A │ │ 账号 B │ │ 账号 C │
  │ :18789 │ │ :18790 │ │ :18791 │
  └────────┘ └────────┘ └────────┘
  (task-fleet-bridge.js 在每个账号运行)
```

## 数据模型

### AccountState（单个账号状态）
```typescript
interface AccountTask {
  id: string;            // 唯一 ID
  title: string;         // 任务标题
  status: 'running' | 'completed' | 'stuck' | 'pending' | 'cancelled';
  progress: number;      // 0-100
  step: string;          // 当前步骤描述
  startedAt?: string;    // ISO 时间
  updatedAt: string;     // 最后更新时间
  okrLinked?: {          // 关联到哪个 OKR 板块
    businessId: string;   // maoai, dmb, mintqx, ...
    objectiveIndex?: number;
    krIndex?: number;
  };
  agentTurns?: number;   // 已执行回合数（用于检测阻塞）
  errorCount?: number;   // 连续错误次数
}

interface AccountState {
  id: string;            // 账号标识
  name: string;          // 显示名称
  machine: string;       // 所在设备
  machineId: string;     // 设备唯一 ID
  workspace: string;     // 工作区路径
  status: 'online' | 'stuck' | 'danger' | 'offline' | 'idle';
  tasks: AccountTask[];
  activeTaskCount: number;
  completedToday: number;
  stuckSince?: string;   // 从何时开始阻塞
  lastHeartbeat: string;
  sessionInfo: {
    conversationId?: string;
    startTime: string;
    totalTurns: number;
  };
}
```

### FleetState（舰队总状态）
```typescript
interface FleetState {
  version: string;           // "1.0.0"
  lastUpdated: string;
  accounts: Record<string, AccountState>;
  machines: Record<string, {  // 设备维度聚合
    name: string;
    status: string;
    accountIds: string[];
    totalTasks: number;
    runningTasks: number;
    stuckTasks: number;
  }>;
  concurrency: {
    maxPerMachine: number;   // 每台设备最大并发数（默认 2）
    globalMax: number;       // 全局最大并发数（默认 5）
    currentGlobal: number;   // 当前全局并发数
  };
  globalAlerts: Array<{
    level: 'info' | 'warning' | 'error' | 'critical';
    accountId: string;
    message: string;
    timestamp: string;
    action?: string;         // 建议的操作
  }>;
  stats: {
    totalTasksEver: number;
    totalCompleted: number;
    totalStuck: number;
    avgCompletionTime: number; // 分钟
    fleetUptimeHours: number;
  };
}
```

## 进程控制机制

### 1. 并发控制
```
每台设备默认最多 2 个 running 任务同时运行
全局默认最多 5 个 running 任务
当达到上限时，新任务自动排队 (pending → queued)
队列按优先级排列: blocking > normal > low
```

### 2. 阻塞检测（三级）
```
Level 1 - ⚠️ Stuck:  任务 3 分钟无进度更新
Level 2 - 🔴 Danger: 任务 8 分钟无更新 + 错误计数 > 3
Level 3 - 💀 Zombie: 任务 15 分钟无更新 → 标记为僵尸进程
```

### 3. 自动恢复动作
```
Stuck  → 记录告警 + 继续观察（可能是在等用户输入）
Danger → 尝试发送 ping 探测 + 记录详细日志
Zombie → 标记为 cancelled + 释放并发槽位 + 发送告警
```

## 文件清单

| 文件 | 用途 |
|------|------|
| `n8n-bridge/task-fleet-bridge.js` | 核心：多账号任务采集器 + 并发控制器 |
| `n8n-compass/compass.html` | 改造：新增「🚀 任务舰队」面板 |
| `~/.maoai-sync/fleet-state.json` | 运行时状态文件（自动生成） |

## 使用方式

### 启动采集器（在每个 WorkBuddy 账号）
```bash
node task-fleet-bridge.js start --account-id acc-001 --name "主力开发" --machine macbook-pro --workspace /Users/daiyan/WorkBuddy/xxx
```

### 查看舰队状态
```bash
node task-fleet-bridge.js status
node task-fleet-bridge.js check    # 检查异常
```

### 停止
```bash
node task-fleet-bridge.js stop
```
