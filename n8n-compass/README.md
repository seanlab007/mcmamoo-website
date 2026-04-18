# 🧭 OKR 罗盘 — n8n 部署指南

## 概述

| 项 | 说明 |
|---|------|
| **用途** | 全年工作进度可视化，7 大业务板块 OKR 拆解与对齐 |
| **触发方式** | Webhook（手动推送进度）+ Schedule（每 6h 自动汇总） |
| **输出** | 完整 HTML 仪表盘（可在 n8n 内预览或导出） |
| **数据存储** | Supabase PostgreSQL `okr_compass_data` 表 |

## 文件清单

```
n8n-compass/
├── compass.html              # 罗盘 HTML 页面（独立可用）
├── okr-compass-workflow.json # n8n Workflow 导入文件
└── README.md                 # 本文件
```

## 快速上手

### 第 1 步：导入 Workflow 到 n8n

1. 打开本地 n8n：http://localhost:5678
2. 左上角 **+** → **Import from File**
3. 选择 `okr-compass-workflow.json`
4. 导入后你会看到 14 个节点组成的完整 workflow

### 第 2 步：配置 Supabase 连接

Workflow 需要连接 Supabase PostgreSQL：

1. 在 n8n 中进入 **Credentials → Add Credential**
2. 选择 **PostgreSQL**
3. 填写：
   - **Host**: `db.[your-project-ref].supabase.co`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: `[你的数据库密码]`
4. 在 `📡 从Supabase拉取OKR数据` 节点上选择这个 credential

### 第 3 步：创建 Supabase 数据表

在 Supabase SQL Editor 中执行：

```sql
-- OKR 罗盘数据存储表
CREATE TABLE IF NOT EXISTS okr_compass_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 插入默认数据
INSERT INTO okr_compass_data (data, last_updated, updated_by)
VALUES (
  '{
    "meta": { "year": 2026, "currentQuarter": "Q1" },
    "businesses": [
      {
        "id": "maoai", "name": "MaoAI", "overallProgress": 42,
        "objectives": [
          {
            "title": "O1: Railway 部署上线",
            "keyResults": [
              {"text": "修复全部 merge conflict", "progress": 100},
              {"text": "Railway Trial 升级绑卡", "progress": 0},
              {"text": "生产环境稳定运行 7 天", "progress": 0}
            ]
          },
          {
            "title": "O2: Pro 订阅 $19.9/月",
            "keyResults": [
              {"text": "支付网关接入", "progress": 20},
              {"text": "Pro 功能差异化", "progress": 55},
              {"text": "首批 100 个付费用户", "progress": 0}
            ]
          }
        ]
      }
    ]
  }'::jsonb,
  NOW(),
  'init'
) ON CONFLICT (id) DO NOTHING;

-- RLS: 允许 n8n service role 写入
ALTER TABLE okr_compass_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow n8n full access" ON okr_compass_data
  FOR ALL USING (true) WITH CHECK (true);
```

## Webhook API 参考

导入 workflow 后，n8n 会自动生成 Webhook URL，格式类似：

```
https://[你的n8n域名]/webhook/okr-compass
```

### 接口 1：更新单个 KR 进度

```bash
curl -X POST https://你的n8n/webhook/okr-compass \
  -H "Content-Type: application/json" \
  -d '{
    "business": "maoai",
    "objectiveIndex": 0,
    "krIndex": 1,
    "progress": 80
  }'
```

> `objectiveIndex` 和 `krIndex` 都从 **0** 开始计数。

### 接口 2：批量更新多个 KR

```bash
curl -X POST https://你的n8n/webhook/okr-compass \
  -H "Content-Type: application/json" \
  -d '{
    "action": "batch",
    "updates": [
      { "business": "maoai", "objectiveIndex": 0, "krIndex": 1, "progress": 80 },
      { "business": "maoai", "overallProgress": 55 },
      { "business": "dmb", "overallProgress": 40 }
    ]
  }'
```

### 接口 3：完全替换所有数据

```bash
curl -X POST https://你的n8n/webhook/okr-compass \
  -H "Content-Type: application/json" \
  -d '{
    "action": "replace",
    "data": { ...完整OKR_DATA对象... }
  }'
```

## Workflow 节点说明

```
┌───────────────────── 触发层 ─────────────────────┐
│ 🔗 Webhook: 更新OKR     ← POST /webhook/okr-compass │
│ ⏰ 定时触发(每6h)       ← 每6小时自动汇总           │
└──────────┬─────────────────────┬───────────────────┘
           ▼                     ▼
┌───────────────────── 数据处理层 ───────────────────┐
│ 📥 获取请求数据  → 📋 解析体                       │
│         ↓                                         │
│   ┌─ 🔀 完全替换？→ 💾 替换保存                    │
│   └─ 否 ↓                                        │
│   ┌─ 🔀 批量更新？                                 │
│     ├─ 是 → ⚙️ 处理批量                            │
│     └─ 否 → ⚙️ 处理单条(自动重算overall)           │
│             ↓                                     │
│        💾 保存到Supabase → ✅ 返回响应             │
│                                                     │
│  (定时分支)                                         │
│  📡 拉取Supabase → 🎨 渲染HTML → 📄 读模板        │
│                              ↓                      │
│                        🔧 组装最终HTML → 📦 输出   │
└────────────────────────────────────────────────────┘
```

## 业务板块 ID 对照表

| ID | 名称 | 标签颜色 |
|----|------|---------|
| `maoai` | MaoAI | 🔵 Core |
| `dmb` | Dark Matter Bank | 🟣 Finance |
| `mintqx` | mintQX | 🟢 Growth |
| `usdd` | USDD Stablecoin | 🟡 Revenue |
| `daiizen` | daiizen | 🩷 Growth |
| `maoyan` | maoyan.vip | 🔴 Revenue |
| `content` | 猫眼内容平台 | 🔵 Infra |

## 自定义修改

### 修改业务板块
编辑 `compass.html` 中 `OKR_DATA.businesses` 数组即可。每个板块结构：

```javascript
{
  id: "唯一标识",
  name: "显示名称",
  emoji: "图标emoji",
  badge: { text: "标签", cls: "badge-core" }, // core/growth/infra/revenue
  desc: "描述文字",
  overallProgress: 0-100,
  objectives: [
    {
      title: "目标名称",
      keyResults: [
        { text: "关键结果描述", progress: 0-100 },
      ]
    }
  ]
}
```

### 修改阶段进度条
编辑 `meta.phases` 数组，每个 phase 的 `status` 可以是 `done` / `current` / `future`。

### 修改配色
CSS 变量在 `<style>:root` 中定义，直接改色值即可全局生效。

## 下一步建议

- [ ] 将 n8n 部署到 Railway（当前 Trial 限制解除后）
- [ ] 接入飞书/钉钉机器人通知（KR 达标时推送）
- [ ] 添加历史趋势图（每周快照对比）
- [ ] 对接 GitHub Issues 自动同步开发任务进度
