# Mc&Mamoo 异构同步协议 v1
# 路径: ~/.maoai-sync/protocol.md
# 三端共享: WorkBuddy | MaoAI | OpenClaw

## 架构概览

```
┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│   WorkBuddy  │◄───►│    MaoAI     │◄───►│   OpenClaw     │
│  (会话AI)     │     │ (Digital OS) │     │ (本地AI引擎)    │
│  :3000 会话端 │     │  :3000 API   │     │  :18789        │
└──────┬───────┘     └──────┬───────┘     └───────┬────────┘
       │                    │                     │
       └────────────────────┼─────────────────────┘
                            ▼
              ┌─────────────────────────┐
              │   Supabase (真理源)      │
              │   okr_compass_data 表   │
              │   sync_events 日志表    │
              └─────────────────────────┘

本地文件桥:
~/.maoai-sync/
├── state.json          # 最新快照（三端共用）
├── events.jsonl        # 变更事件日志（append-only）
├── protocol.md         # 本协议文件
└── lock.json           # 写锁（防并发冲突）
```

## 共享目录规范

| 文件 | 用途 | 写入方 | 读取方 |
|------|------|--------|--------|
| `state.json` | 全局状态快照（OKR数据、项目配置） | 任一端 | 全部 |
| `events.jsonl` | 变更事件流（append only） | 任一端 | 全部 |
| `lock.json` | 写互斥锁（TTL=30s） | 写入前获取 | - |
| `protocol.md` | 协议定义（本文件） | 仅初始化 | 全部 |

## 同步事件格式 (events.jsonl)

每行一个 JSON 对象：

```json
{
  "id": "evt_20260418_t182700_a1b2c3",
  "timestamp": "2026-04-18T18:27:00.000Z",
  "source": "workbuddy",
  "type": "okr_update | project_config | deployment_status | memory_sync",
  "payload": {
    "business": "maoai",
    "field": "overallProgress",
    "oldValue": 42,
    "newValue": 55,
    "changedBy": "manual"
  },
  "checksum": "sha256:abc123..."
}
```

### 事件类型一览

| type | 触发场景 | payload 示例 |
|------|---------|-------------|
| `okr_update` | KR 进度变更 | `{business, objectiveIndex, krIndex, progress}` |
| `project_config` | 技术栈/架构变更 | `{configKey, oldValue, newValue}` |
| `deployment_status` | 部署状态变化 | `{service, env, status, buildId}` |
| `memory_sync` | 跨 session 记忆同步 | `{memoryType, content, sourceSession}` |
| `compass_render` | 罗盘重新渲染触发 | `{trigger, dataHash}` |

## state.json 数据结构

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-04-18T18:27:00Z",
  "updatedBy": "workbuddy",
  
  "okr": {
    /* 与 compass.html 中 OKR_DATA 完全一致 */
    "meta": { "year": 2026, "currentQuarter": "Q1" },
    "businesses": [ ... ]
  },

  "projects": {
    "maoai": {
      "repo": "seanlab007/mcmamoo-website",
      "localPath": "/Users/daiyan/Desktop/mcmamoo-website/",
      "deployTarget": "railway",
      "railway": { "projectId": "ab3a987f", "serviceId": "93637cdf" },
      "lastCommit": "b2a2ecc",
      "buildStatus": "needs_upgrade"
    },
    "dark-matter-bank": {
      "repo": "seanlab007/dark-matter-bank",
      "localPath": "/Users/daiyan/Desktop/dark-matter-bank/",
      "phase": "1+2-completed",
      "lastPush": null
    }
  },

  "infrastructure": {
    "supabase": { "url": "", "status": "connected" },
    "n8n": { "local": ":5678", "cloud": null, "status": "trial-blocked" },
    "openclaw": { "port": 18789, "status": "running" }
  }
}
```

## 写入协议（防冲突）

### 1. 获取写锁

```bash
LOCK_FILE=~/.maoai-sync/lock.json
LOCK_TTL=30  # 秒

# 检查是否有有效锁
if [ -f "$LOCK_FILE" ]; then
  LOCK_TIME=$(cat "$LOCK_FILE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ts',0))")
  NOW=$(date +%s)
  AGE=$((NOW - LOCK_TIME))
  if [ $AGE -lt $LOCK_TTL ]; then
    echo "ERROR: Lock held by $(cat $LOCK_FILE | python3 -c 'print(json.load(sys.stdin).get(\"owner\",\"unknown\"))')"
    exit 1
  fi
fi

# 获取锁
echo "{\"owner\":\"$CLIENT_ID\",\"ts\":$(date +%s)}" > "$LOCK_FILE"
```

### 2. 写入 + 追加事件

```python
# Python 写入示例
import json, hashlib, time, uuid
from pathlib import Path

SYNC_DIR = Path.home() / ".maoai-sync"
STATE_FILE = SYNC_DIR / "state.json"
EVENTS_FILE = SYNC_DIR / "events.jsonl"

def write_state(new_state: dict, source: str, event_type: str):
    # 1. 读当前
    current = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}
    
    # 2. 合并（deep merge）
    merged = deep_merge(current, new_state)
    merged["lastUpdated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    merged["updatedBy"] = source
    
    # 3. 写 state
    STATE_FILE.write_text(json.dumps(merged, ensure_ascii=False, indent=2))
    
    # 4. 追加事件
    event = {
        "id": f"evt_{time.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}",
        "timestamp": merged["lastUpdated"],
        "source": source,
        "type": event_type,
        "payload": diff(current, new_state),
        "checksum": f"sha256:{hashlib.sha256(json.dumps(merged).encode()).hexdigest()[:16]}"
    }
    with open(EVENTS_FILE, "a") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")

def deep_merge(base, override):
    """递归合并字典"""
    result = base.copy()
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = deep_merge(result[k], v)
        else:
            result[k] = v
    return result
```

### 3. 释放锁

```bash
rm -f ~/.maoai-sync/lock.json
```

## 读取协议（无锁）

任何端点可随时读取：

```bash
# 读取最新状态
cat ~/.maoai-sync/state.json

# 读取最近 N 条事件
tail -20 ~/.maoai-sync/events.jsonl

# 读取某端点的事件
grep '"source":"workbudd"' ~/.maoai-sync/events.jsonl
```

## 各端点职责

### WorkBuddy (润之)
- **主写入方**: OKR 更新、记忆持久化、任务规划
- **读取**: 项目状态、部署信息、其他端点事件
- **触发**: Webhook → n8n → compass 渲染

### MaoAI (:3000)
- **读取**: state.json 加载到 `/api/sync/status` 接口
- **写入**: 部署状态变更、用户行为事件
- **提供**: Internal Dashboard 嵌入罗盘页面

### OpenClaw (:18789)
- **读取**: OKR 数据用于上下文增强
- **写入**: AI 推理结果、自动化执行记录
- **提供**: 异构计算能力（模型调度）

## 同步流程图

```
用户操作(更新KR进度)
       │
       ▼
  WorkBuddy 收到指令
       │
       ├──→ 获取写锁
       ├──→ 更新 state.json
       ├──→ 追加 events.jsonl
       ├──→ 释放写锁
       │
       ├──→ POST n8n Webhook (更新Supabase)
       │
       └──→ Git Commit + Push to GitHub
                │
                ▼
         Railway 自动部署 (Hobby plan后)
                │
                ▼
         MaoAI 生产环境 /api/sync/status ← 最新的 state.json
                │
                ▼
         OpenClaw 定期轮询 state.json → 更新AI上下文
```

## 初始化脚本

首次使用时运行一次：

```bash
#!/bin/bash
# init-maoai-sync.sh — 初始化异构同步目录
SYNC_DIR="$HOME/.maoai-sync"
mkdir -p "$SYNC_DIR"

# 创建空 state
echo '{
  "version": "1.0.0",
  "lastUpdated": null,
  "updatedBy": "init",
  "okr": {},
  "projects": {},
  "infrastructure": {}
}' > "$SYNC_DIR/state.json"

# 创建空事件日志
touch "$SYNC_DIR/events.jsonl"

# 复制协议
cp "$(dirname "$0")/protocol.md" "$SYNC_DIR/protocol.md"

echo "✅ 异构同步目录已初始化: $SYNC_DIR"
```
