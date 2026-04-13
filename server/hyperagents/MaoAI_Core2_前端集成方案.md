# MaoAI Core 2.0 前端集成方案

## 现状分析

### 前端 (client/src/features/maoai/)

| 文件 | 当前状态 | 需改造 |
|------|---------|--------|
| `constants.ts` | 只有基础云端模型 (DeepSeek, GLM, Claude) | ✅ 新增 Core 2.0 战略模式 |
| `pages/Chat.tsx` | 基础 Agent 模式选择 + ReAct 日志 | ✅ 新增三权分立可视化 |
| `components/AgentModeSelector.tsx` | 从 `/api/chat/agents` 拉取 | ✅ 新增 MaoAI Core 入口 |
| `components/Phase5Status.tsx` | 存在（AtomicModeToggle） | ✅ 检查是否能复用 |

### 后端 (server/)

| 文件 | 当前状态 | 需改造 |
|------|---------|--------|
| `chat.ts` | 基础对话路由 | ✅ 新增 Core 2.0 路由 |
| `agents.ts` | Agent 分类定义 | ✅ 新增 MaoAI Core Agent |

---

## 实施计划

### Phase 1: 前端状态映射 (`constants.ts`)

```typescript
// 新增 MaoAI Core 2.0 模式
export const MAOAI_CORE2_MODES = [
  {
    id: "maoai-core2",
    name: "MaoAI Core 2.0 (手脑合一)",
    badge: "CORE2",
    description: "战略之脑 + 执行之手",
    icon: "🧠",
    color: "text-[#C9A84C]",
    features: ["红蓝对抗", "三权分立", "长记忆", "战略哨兵"],
  },
  {
    id: "maoai-strategic",
    name: "战略模式",
    badge: "STRATEGIC",
    description: "毛泽东思想 + 马斯克第一性原理",
    icon: "⚔️",
    color: "text-red-400",
    features: ["矛盾分析", "第一性原理", "战略推导"],
  },
] as const;

// 战略之脑配置
export const MAOAI_STRATEGIC_BRAIN = {
  thinking: {
    maozedong: "毛泽东思想战略分析",
    musk: "马斯克第一性原理推理",
  },
  rag: {
    local: "nomic-embed-text (384维)",
    cloud: "向量库检索",
  },
};

// 执行之手配置
export const MAOAI_EXECUTION_HAND = {
  browser: {
    name: "BrowserAgent",
    description: "网页自动化抓取",
    status: "idle" | "scraping" | "done",
  },
  sandbox: {
    name: "SandboxEngine",
    description: "代码隔离执行",
    status: "idle" | "running" | "done",
  },
};
```

### Phase 2: 三权分立可视化 (`Chat.tsx`)

```typescript
// 新增 TriadLoopView 组件
function TriadLoopView({
  phase, // "coder" | "reviewer" | "validator"
  status, // "thinking" | "approved" | "rejected"
  score,
  reasoning,
}: TriadLoopState) {
  const phaseColors = {
    coder: "bg-blue-500/20 border-blue-400",
    reviewer: "bg-purple-500/20 border-purple-400",
    validator: "bg-emerald-500/20 border-emerald-400",
  };

  return (
    <div className={`border rounded-lg p-3 ${phaseColors[phase]}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {phase === "coder" ? "⚙️" : phase === "reviewer" ? "🔍" : "✅"}
        </span>
        <span className="font-bold uppercase">{phase}</span>
        {status === "thinking" && <Loader2 className="animate-spin" />}
        {status === "approved" && <span className="text-emerald-400">✓</span>}
        {status === "rejected" && <span className="text-red-400">✗</span>}
        {score && <span className="ml-auto text-sm">{score}/100</span>}
      </div>
      {reasoning && (
        <p className="mt-2 text-xs text-white/60">{reasoning}</p>
      )}
    </div>
  );
}
```

### Phase 3: 红蓝对抗可视化

```typescript
// 新增 RedBlueBattleView 组件
function RedBlueBattleView({ battle }: { battle: RedBlueState }) {
  return (
    <div className="border border-[#C9A84C]/30 rounded-lg p-4">
      <div className="text-center mb-3">
        <span className="text-red-400 font-bold">红军</span>
        <span className="mx-4 text-white/30">vs</span>
        <span className="text-blue-400 font-bold">蓝军</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 红军 */}
        <div className="bg-red-500/10 rounded p-2">
          <div className="text-red-400 text-xs mb-1">红军 (证明可行)</div>
          <div className="text-white/70 text-xs">得分: {battle.redScore}/100</div>
          {battle.redArguments.map((arg, i) => (
            <div key={i} className="text-[10px] text-white/50 mt-1">+ {arg}</div>
          ))}
        </div>

        {/* 蓝军 */}
        <div className="bg-blue-500/10 rounded p-2">
          <div className="text-blue-400 text-xs mb-1">蓝军 (寻找风险)</div>
          <div className="text-white/70 text-xs">风险度: {battle.blueScore}/100</div>
          {battle.blueArguments.map((arg, i) => (
            <div key={i} className="text-[10px] text-white/50 mt-1">- {arg}</div>
          ))}
        </div>
      </div>

      {/* 裁决 */}
      <div className={`mt-3 text-center text-sm font-bold ${
        battle.verdict === "approved" ? "text-emerald-400" :
        battle.verdict === "rejected" ? "text-red-400" : "text-amber-400"
      }`}>
        裁决: {battle.verdict.toUpperCase()} (胜率 {battle.winProbability}%)
      </div>
    </div>
  );
}
```

### Phase 4: 执行之手状态指示器

```typescript
// 新增 ExecutionHandStatus 组件
function ExecutionHandStatus({ hand }: { hand: ExecutionHandState }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-black/40 border border-[#C9A84C]/20">
      {/* Browser Agent */}
      <div className="flex items-center gap-2">
        <Globe className={`w-4 h-4 ${
          hand.browser.status === "scraping" ? "text-blue-400 animate-pulse" :
          hand.browser.status === "done" ? "text-emerald-400" : "text-white/30"
        }`} />
        <span className="text-xs text-white/60">
          {hand.browser.status === "scraping" ? `抓取: ${hand.browser.url}` :
           hand.browser.status === "done" ? "抓取完成" : "浏览器空闲"}
        </span>
      </div>

      {/* Sandbox */}
      <div className="flex items-center gap-2">
        <Terminal className={`w-4 h-4 ${
          hand.sandbox.status === "running" ? "text-emerald-400 animate-pulse" :
          hand.sandbox.status === "done" ? "text-blue-400" : "text-white/30"
        }`} />
        <span className="text-xs text-white/60">
          {hand.sandbox.status === "running" ? "执行中..." :
           hand.sandbox.status === "done" ? "执行完成" : "沙盒空闲"}
        </span>
      </div>
    </div>
  );
}
```

### Phase 5: RAG 状态灯

```typescript
// 新增 RagStatusIndicator 组件
function RagStatusIndicator({ rag }: { rag: RagState }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-black/30 border border-white/10">
      <span className={`w-2 h-2 rounded-full ${
        rag.connected
          ? rag.source === "local"
            ? "bg-emerald-400"  // 本地 Ollama
            : "bg-blue-400"     // 云端向量库
          : "bg-red-400"        // 离线
      }`} />
      <span className="text-[10px] text-white/50">
        RAG: {rag.connected
          ? rag.source === "local" ? "本地 (384维)" : "云端"
          : "离线"}
      </span>
    </div>
  );
}
```

---

## 后端路由扩展

### 新增 `server/maoai-core2.ts`

```typescript
/**
 * MaoAI Core 2.0 API
 *
 * POST /api/maoai/chat          战略模式对话
 * POST /api/maoai/triad-loop    三权分立博弈
 * POST /api/maoai/red-blue      红蓝对抗
 * GET  /api/maoai/status        系统状态
 * WS   /api/maoai/stream        流式消息 (stream_broker)
 */

import { Router } from "express";
import { TriadLoop } from "./hyperagents/core/agent/triad_loop";
import { RedBlueAdversarial } from "./hyperagents/core/adversarial/red_blue_agents";
import { DecisionLedger } from "./hyperagents/core/memory/decision_ledger";
import { StrategicSentinel } from "./hyperagents/core/sentinel/strategic_sentinel";

export const core2Router = Router();

// 初始化核心模块
const triadLoop = new TriadLoop();
const redBlue = new RedBlueAdversarial();
const decisionLedger = new DecisionLedger();

// POST /api/maoai/triad-loop
core2Router.post("/triad-loop", async (req, res) => {
  const { task, context } = req.body;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      for await (const event of triadLoop.execute(task, context)) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    }
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  stream.pipe(res);
});

// POST /api/maoai/red-blue
core2Router.post("/red-blue", async (req, res) => {
  const result = await redBlue.engage(req.body.proposal);
  res.json(result);
});

// GET /api/maoai/status
core2Router.get("/status", async (req, res) => {
  res.json({
    triadLoop: true,
    redBlue: true,
    decisionLedger: true,
    strategicSentinel: await StrategicSentinel.isActive(),
    rag: {
      connected: true,
      source: "local",
      dimension: 384,
    },
  });
});
```

---

## 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `client/src/features/maoai/constants.ts` | 新增 Core 2.0 配置 |
| 修改 | `client/src/features/maoai/pages/Chat.tsx` | 新增可视化组件 |
| 新增 | `client/src/features/maoai/components/TriadLoopView.tsx` | 三权分立可视化 |
| 新增 | `client/src/features/maoai/components/RedBlueBattleView.tsx` | 红蓝对抗可视化 |
| 新增 | `client/src/features/maoai/components/ExecutionHandStatus.tsx` | 执行之手状态 |
| 新增 | `client/src/features/maoai/components/RagStatusIndicator.tsx` | RAG 状态灯 |
| 新增 | `server/maoai-core2.ts` | Core 2.0 后端路由 |
| 修改 | `server/index.ts` | 注册 core2Router |

---

## 预期效果

```
┌─────────────────────────────────────────────────────────┐
│  MaoAI Core 2.0 (手脑合一) 🧠                           │
├─────────────────────────────────────────────────────────┤
│  [战略模式] [执行模式] [红蓝对抗]                        │
├─────────────────────────────────────────────────────────┤
│  🟢 RAG: 本地 (384维) │ 🔵 Browser: 空闲 │ ⚪ Sandbox  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ ⚙️ Coder │ │ 🔍Review │ │ ✅Valid  │  ← 三权分立     │
│  │  思考中  │ │  82分   │ │  等待中  │                  │
│  └─────────┘ └─────────┘ └─────────┘                   │
├─────────────────────────────────────────────────────────┤
│  🔴红军(75) vs 🔵蓝军(80)   裁决: ❌ REJECTED (35%)    │
│  + 技术成熟    - 壁垒不够   建议: 强化核心竞争力          │
└─────────────────────────────────────────────────────────┘
```
