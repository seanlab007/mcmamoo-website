# MaoAI-MPO 生产部署指南

## 架构概述

MaoAI-MPO 将 MaoAI 3.0 Phase 7 实战验证闭环与 Multi-Processor Orchestrator (MPO) 深度集成，实现基于 MPO 的分布式任务调度和资源管理。

### 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                       MaoAI-MPO 生产架构                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐      ┌─────────────┐       ┌─────────────┐        │
│  │   Frontend  │─────▶│   API Layer │──────▶│ MPO Adapter │         │
│  │  (React)    │◀─────│ (tRPC/WS)   │◀──────│             │         │
│  └─────────────┘      └─────────────┘       └──────┬──────┘         │
│                                                     │                 │
│                                           ┌────────▼────────┐        │
│                                           │  MPO Orchestrator │       │
│                                           │                  │        │
│                                           │  ┌──────────┐  ┌──────────┐ │
│                                           │  │ Worker 1 │  │ Worker 2 │ │
│                                           │  └──────────┘  └──────────┘ │
│                                           │    ...      ...      ...    │
│                                           └────────────────────────────┘ │
│                                                                      │
│  ┌─────────────┐      ┌─────────────┐       ┌─────────────┐        │
│  │   Core 2.0  │◀─────│  Triad Loop  │◀─────│  MaoAI      │        │
│  │  Modules    │─────▶│   (V3)       │─────▶│  HyperAgents │        │
│  └─────────────┘      └─────────────┘       └─────────────┘        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                    Persistence Layer                       │        │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │        │
│  │  │  Decision   │ │   Stream    │ │   Browser   │  │        │
│  │  │   Ledger    │ │   Broker    │ │    Agent    │  │        │
│  │  └─────────────┘ └─────────────┘ └─────────────┘  │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. MaoAI-MPO Adapter (`maoai_mpo_adapter.py`)
**功能**: 统一执行接口，智能模式选择，结果转换，错误处理
**核心方法**:
- `execute()`: 主执行接口，自动选择串行或并行模式
- `get_stats()`: 获取执行统计信息
- `reset_stats()`: 重置统计信息

### 2. MaoAI Parallel Orchestrator (`mpo_core.py`)
**功能**: 并行任务调度，Worker管理，结果聚合
**核心特性**:
- 动态Worker池管理
- 任务优先级调度
- 健康检查和自动恢复
- 负载均衡策略

### 3. Triad Loop v3 (`triad_loop_v3.py`)
**功能**: 三权分立博弈循环，已集成MPO支持
**新增功能**:
- `run_parallel()`: MPO并行执行方法
- 自动文件发现和目标分析
- 策略逃逸和动态降级

### 4. 监控仪表板 (`mpo_monitor.html`)
**功能**: 实时监控并行执行状态和性能指标
**监控指标**: 成功率、平均耗时、并发数、资源利用率

## 部署步骤

### 步骤 1: 环境准备

#### 1.1 系统要求
```bash
# 操作系统
- Ubuntu 20.04+ / macOS 12+
- 8GB RAM (推荐16GB)
- 4核CPU (推荐8核)

# 软件依赖
- Python 3.8+
- Node.js 18+
- Docker (可选，用于沙箱测试）
```

#### 1.2 安装依赖
```bash
# Python依赖

pip install -r requirements.txt

# Node.js依赖

npm install
```

#### 1.3 环境变量配置
```bash
# .env 文件配置
ANTHROPIC_API_KEY=your_anthropic_api_key  # Claude API
OPENAI_API_KEY=your_openai_api_key        # GPT-4o API  
ZHIPU_API_KEY=your_zhipu_api_key          # 智谱API (可选)
GLM_MODEL=glm-4-plus                     # GLM模型配置

# 如果是生产环境
NODE_ENV=production
LOG_LEVEL=info
MAX_CONCURRENT_WORKERS=10
WORKER_TIMEOUT=300
```

### 步骤 2: 配置MPO

#### 2.1 MPO配置文件
```python
# config/mpo_config.py

MPO_CONFIG = {
    "enable_parallel": True,
    "max_workers": 10,
    "min_tasks_for_parallel": 3,
    "worker_max_iterations": 3,
    "worker_score_threshold": 0.7,
    "worker_timeout": 300,
    "enable_auto_sharding": True,
    "max_files_per_worker": 3,
    "enable_fallback": True,
    "fallback_max_retries": 2,
    "enable_monitoring": True,
    "monitoring_interval": 5,
    
    # 模型配置

    "models": {
        "coder": {
            "default": "claude-3-5-sonnet",
            "fallback": "gpt-4o",
            "local_enabled": True
        },
        "reviewer": {
            "default": "gpt-4o",
            "glm_enabled": True,
            "glm_model": "glm-4-plus"
        }
    }
}
```

#### 2.2 初始化脚本
```bash
#!/bin/bash
# scripts/init_mpo.sh

echo "初始化 MaoAI-MPO 系统..."

# 1. 创建必要目录
mkdir -p logs/mpo
mkdir -p data/ledger
mkdir -p data/screenshots

# 2. 检查环境变量
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "错误: ANTHROPIC_API_KEY 未设置"
    exit 1
fi

# 3. 数据库初始化
python scripts/init_ledger.py

# 4. 测试MPO基础功能
python tests/test_mpo_basic.py

echo "初始化完成"
```

### 步骤 3: 集成到MaoAI系统

#### 3.1 API路由集成
```typescript
// server/api/trpc/mpo.ts

import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { MaoAIMPOrchestrator } from "../../hyperagents/core/maoai_mpo_adapter";

const mpoAdapter = new MaoAIMPOrchestrator();

export const mpoRouter = router({
  execute: publicProcedure
    .input(
      z.object({
        task: z.string(),
        context: z.object({}).optional(),
        mode: z.enum(["fix", "generate"]).optional(),
        targetFiles: z.array(z.string()).optional()
      })
    )
    .mutation(async ({ input }) => {
      const result = await mpoAdapter.execute(
        input.task,
        input.context,
        input.mode,
        input.targetFiles
      );
      return result;
    }),
    
  getStats: publicProcedure
    .query(async () => {
      const stats = await mpoAdapter.getStats();
      return stats;
    }),
    
  getStatus: publicProcedure
    .query(async () => {
      return {
        status: "active",
        version: "3.0.0",
        timestamp: new Date().toISOString(),
        workers: mpoAdapter.config.max_workers,
        mode: mpoAdapter.config.enable_parallel ? "parallel" : "serial"
      };
    })
});
```

#### 3.2 前端界面
```typescript
// client/src/features/mpo/components/MPODashboard.tsx

export const MPODashboard = () => {
  const [stats, setStats] = useState<MPOStats>(initialStats);
  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([]);

  // 获取统计信息

  const fetchStats = async () => {
    try {
      const result = await trpc.mpo.getStats.query();
      setStats(result);
    } catch (error) {
      console.error("获取统计信息失败:", error);
    }
  };

  // 执行任务

  const executeTask = async (task: string, mode: 'fix' | 'generate' = 'fix') => {
    try {
      const result = await trpc.mpo.execute.mutate({
        task,
        mode,
        context: { is_frontend: true }
      });
      
      // 更新历史记录

      setExecutionHistory(prev => [{
        id: Date.now().toString(),
        task,
        timestamp: new Date().toISOString(),
        result,
        completed: true
      }, ...prev.slice(0, 9)]);
      
      return result;
    } catch (error) {
      console.error("执行任务失败:", error);
      throw error;
    }
  };

  // 定时更新

  useEffect(() => {
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mpo-dashboard">
      <h2>MPO 并行执行监控</h2>
      
      {/* 性能指标 */}
      <div className="stats-grid">
        <StatCard title="总任务数" value={stats.total_tasks} />
        <StatCard title="成功率" value={`${(stats.success_rate * 100).toFixed(1)}%`} />
        <StatCard title="平均耗时" value={`${stats.average_duration.toFixed(2)}s`} />
        <StatCard title="并发数" value={stats.parallel_tasks} />
      </div>
      
      {/* 任务执行 */}
      <TaskExecutor onSubmit={executeTask} />
      
      {/* 执行历史 */}
      <ExecutionHistory history={executionHistory} />
      
      {/* 实时监控 */}
      <LiveMonitor stats={stats} />
    </div>
  );
};
```

### 步骤 4: 监控与告警

#### 4.1 监控脚本
```python
#!/usr/bin/env python3
# scripts/mpo_monitor.py

import asyncio
import time
import json
from datetime import datetime
from pathlib import Path
import sys

# 添加项目根目录

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

async def monitor_mpo_system():
    """监控MPO系统状态"""
    
    from server.hyperagents.core.maoai_mpo_adapter import MaoAIMPOrchestrator
    
    # 创建适配器实例

    adapter = MaoAIMPOrchestrator()
    
    while True:
        try:
            # 获取统计信息

            stats = await adapter.get_stats()
            
            # 检查健康状态

            health = await check_health_status(stats)
            
            # 记录日志

            await log_metrics(stats, health)
            
            # 告警检查

            await check_alerts(stats)
            
            # 等待下一个监控周期

            await asyncio.sleep(30)
            
        except Exception as e:
            print(f"监控异常: {e}")
            await asyncio.sleep(10)

async def check_health_status(stats):
    """检查系统健康状态"""
    
    health = {
        "healthy": True,
        "issues": []
    }
    
    # 检查成功率

    if stats.get("success_rate", 1.0) < 0.5:
        health["healthy"] = False
        health["issues"].append("成功率低于50%")
    
    # 检查失败率

    if stats.get("failed_tasks", 0) > 10:
        health["healthy"] = False
        health["issues"].append(f"失败任务数: {stats['failed_tasks']}")
    
    # 检查并行率

    if stats.get("parallel_tasks", 0) == 0:
        health["issues"].append("并行功能未启用")
    
    return health

async def log_metrics(stats, health):
    """记录监控指标"""
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "stats": stats,
        "health": health,
        "timestamp_epoch": time.time()
    }
    
    log_file = Path("logs/mpo/monitor.log")
    log_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(log_file, "a") as f:
        f.write(json.dumps(log_entry) + "\n")

async def check_alerts(stats):
    """检查告警条件"""
    
    # 告警条件配置

    ALERT_RULES = {
        "success_rate": {"threshold": 0.5, "message": "成功率低于50%"},
        "failed_tasks": {"threshold": 20, "message": "失败任务数超过20"},
        "average_duration": {"threshold": 600, "message": "平均耗时超过10分钟"}
    }
    
    alerts = []
    for metric, rule in ALERT_RULES.items():
        if stats.get(metric, 0) < rule.get("threshold", 0):
            alerts.append({
                "metric": metric,
                "value": stats.get(metric, 0),
                "threshold": rule["threshold"],
                "message": rule["message"],
                "timestamp": time.time()
            })
    
    # 触发告警

    if alerts:
        await trigger_alerts(alerts)

if __name__ == "__main__":
    asyncio.run(monitor_mpo_system())
```

#### 4.2 告警配置
```bash
# config/alerts.yaml

alerts:
  # 成功率告警

  success_rate:
    enabled: true
    threshold: 0.5
    channels:
      - type: webhook
        url: https://hooks.slack.com/services/YOUR_WEBHOOK
      - type: email
        recipients:
          - admin@example.com
    interval: 300  # 告警间隔（秒）
  
  # 并发数告警

  concurrent_workers:
    enabled: true
    threshold: 20
    channels:
      - type: webhook
        url: https://hooks.slack.com/services/YOUR_WEBHOOK
    interval: 60
  
  # 超时告警

  timeout_tasks:
    enabled: true
    threshold: 10
    channels:
      - type: email
        recipients:
          - devops@example.com
          - manager@example.com
    interval: 900
```

### 步骤 5: 性能优化

#### 5.1 数据库优化
```sql
-- database/optimize_sqlite.sql

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_tasks_status ON decision_ledger(status);
CREATE INDEX IF NOT EXISTS idx_tasks_timestamp ON decision_ledger(timestamp);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON decision_ledger(agent);

-- 优化表结构
VACUUM;
ANALYZE;

-- 设置WAL模式（提高并发性能）
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
```

#### 5.2 缓存配置
```python
# config/cache_config.py

CACHE_CONFIG = {
    "file_content": {
        "enabled": True,
        "max_size": 1000,
        "ttl": 300  # 5分钟
    },
    "api_responses": {
        "enabled": True,
        "max_size": 500,
        "ttl": 60  # 1分钟
    },
    "knowledge_graph": {
        "enabled": True,
        "max_size": 100,
        "ttl": 3600  # 1小时
    }
}
```

### 步骤 6: 灾备与恢复

#### 6.1 备份脚本
```bash
#!/bin/bash
# scripts/backup_mpo.sh

BACKUP_DIR="backups/mpo/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# 1. 备份数据库

cp data/decision_ledger.db $BACKUP_DIR/

# 2. 备份日志
tar -czf $BACKUP_DIR/logs.tar.gz logs/mpo/

# 3. 备份配置文件
cp -r config/* $BACKUP_DIR/config/

# 4. 压缩备份
tar -czf "backups/mpo_latest.tar.gz" -C backups/mpo/ "$(basename $BACKUP_DIR)"

# 5. 保留最近7天备份
find backups/mpo -type d -mtime +7 | xargs rm -rf

echo "备份完成: $BACKUP_DIR"
```

#### 6.2 恢复脚本
```bash
#!/bin/bash
# scripts/restore_mpo.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "用法: $0 <备份文件>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "恢复 MPO 系统..."

# 1. 停止相关服务

systemctl stop maoai-mpo || true

# 2. 解压备份

BACKUP_DIR="backups/mpo/$(date +%Y%m%d_%H%M%S)_restore"
mkdir -p $BACKUP_DIR
tar -xzf "$BACKUP_FILE" -C "$BACKUP_DIR"

# 3. 恢复数据

cp $BACKUP_DIR/*/decision_ledger.db data/
cp $BACKUP_DIR/*/logs.tar.gz .
tar -xzf logs.tar.gz

# 4. 启动服务

systemctl start maoai-mpo

echo "恢复完成"
```

## 运维指令

### 启动服务
```bash
# 开发模式

npm run dev

# 生产模式

npm run build
npm start

# 仅启动MPO服务

npm run mpo:start

# 后台运行

nohup npm start > mpo.log 2>&1 &
```

### 状态检查
```bash
# 检查MPO运行状态

ps aux | grep mpo

# 检查日志

tail -f logs/mpo/monitor.log

# 检查性能指标

curl http://localhost:3000/api/mpo/stats

# 检查系统健康

curl http://localhost:3000/api/mpo/health
```

### 故障排查
```bash
# 查看错误日志

grep -r "ERROR" logs/mpo/
grep -r "Exception" logs/mpo/

# 性能分析

python scripts/mpo_profiler.py

# 网络检查

curl http://localhost:3000/api/health

# 数据库检查

sqlite3 data/decision_ledger.db ".schema"
sqlite3 data/decision_ledger.db "SELECT COUNT(*) FROM decision_ledger;"
```

### 维护命令
```bash
# 清理日志

scripts/clean_logs.sh

# 数据库维护

scripts/maintain_db.sh

# 更新配置

scripts/reload_config.sh

# 性能调优

scripts/optimize_perf.sh
```

## 性能指标

### 核心指标

| 指标 | 目标值 | 告警阈值 | 监控频率 |
|------|--------|----------|----------|
| 成功率 | > 90% | < 70% | 实时 |
| 平均耗时 | < 30s | > 60s | 1分钟 |
| 并发数 | 5-10 | > 20 | 30秒 |
| 内存使用 | < 70% | > 90% | 10秒 |
| CPU使用 | < 50% | > 80% | 10秒 |

### 业务指标

| 指标 | 目标值 | 监控周期 |
|------|--------|----------|
| 平均任务处理时间 | < 60s | 5分钟 |
| 最大并发任务数 | 10 | 实时 |
| 失败任务重试率 | < 10% | 1分钟 |
| 资源利用率 | 60-80% | 30秒 |
| 系统可用性 | > 99.9% | 实时 |

## 故障处理流程

### 1. 紧急故障
```
症状: 服务完全不可用
处理:
  1. 立即重启服务: systemctl restart maoai-mpo
  2. 检查日志: tail -f /var/log/maoai/mpo.log
  3. 检查端口: netstat -tlnp | grep 3000
  4. 检查进程: ps aux | grep mpo
```

### 2. 性能下降
```
症状: 成功率下降，响应时间增加
处理:
  1. 查看监控仪表板
  2. 检查资源使用情况
  3. 查看任务队列状态
  4. 调整并发配置
```

### 3. 数据不一致
```
症状: 决策账本记录缺失或错误
处理:
  1. 备份当前数据
  2. 从备份恢复
  3. 检查数据库完整性
  4. 修复数据表
```

## 附录

### 常用命令速查表

| 命令 | 功能 | 说明 |
|------|------|------|
| `npm run mpo:status` | 查看 MPO 状态 | 显示运行状态和统计信息 |
| `npm run mpo:stats` | 查看统计信息 | 显示任务执行统计 |
| `npm run mpo:clean` | 清理临时文件 | 清理缓存和临时数据 |
| `npm run mpo:monitor` | 启动监控 | 实时监控系统状态 |
| `npm run mpo:backup` | 数据备份 | 备份决策账本和配置 |

### 故障代码表

| 代码 | 含义 | 处理建议 |
|------|------|----------|
| MPO-001 | 数据库连接失败 | 检查数据库文件权限和路径 |
| MPO-002 | API 调用失败 | 检查网络连接和 API 密钥 |
| MPO-003 | Worker 超时 | 检查任务复杂度和超时设置 |
| MPO-004 | 内存溢出 | 增加内存或优化代码 |
| MPO-005 | 并发超限 | 调整并发数配置 |

### 升级指南

1. **版本检查**
```bash
# 查看当前版本
npm list @tencent-ai/agent-sdk
```

2. **备份数据**
```bash
./scripts/backup_mpo.sh
```

3. **更新依赖**
```bash
npm update
```

4. **迁移数据**
```bash
./scripts/migrate_mpo.sh v3.0
```

5. **验证升级**
```bash
npm test
npm run mpo:health
```

---

**文档版本**: 1.0.0  
**最后更新**: 2026-04-15  
**维护者**: Daiyan (代砚)  
**支持邮箱**: devops@mcmamoo.com  

**更新日志**:
- 2026-04-15: 初始版本发布