# MaoAI「手脑合一」增强路线图

> **愿景**：Manus Max 的极致执行力 + 毛泽东思想的战略灵魂 = 通用智能指挥官

---

## 一、现状分析

### 现有架构（MaoAI Core）
```
第一层: 协议统领层 (Protocol Layer)
第二层: 三权分立博弈层 (Triad-Loop: Coder/Reviewer/Validator)
第三层: 猫眼工具执行层 (Maoyan Toolchain)
第四层: 工程裁决层 (Musk Engineering)
第五层: 战略统领层 (Mao Strategic)
```

### 现有能力
| 维度 | 当前状态 | 差距 |
|------|---------|------|
| 战略思维 | ✅ 五层分权架构 | 需强化长记忆和自主性 |
| 执行能力 | ⚠️ 本地文件操作 | 缺浏览器自动化、云端执行 |
| 记忆系统 | ⚠️ RAG片段检索 | 缺决策图谱、经验传承 |
| 多模态 | ❌ 纯文本 | 缺视觉战略感知 |
| 博弈深度 | ⚠️ 单一Reviewer | 缺红蓝对抗机制 |

---

## 二、增强架构：「中枢神经系统」

```
┌─────────────────────────────────────────────────────────────────┐
│                    战略之脑 (MaoAI Brain)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ 毛泽东思想  │  │ 决策日志    │  │ 战略哨兵               │  │
│  │ 定性/定策   │  │ 图谱        │  │ 主动监控/预警          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                           ↕                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MAOAI_THINKING_PROTOCOL                    │   │
│  │   (分发/博弈/反馈/红蓝对抗/流式协同)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           ↕ 战略指令集
┌─────────────────────────────────────────────────────────────────┐
│                    执行之手 (Manus Max)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ 浏览器      │  │ 云端实验室   │  │ 多模态感知              │  │
│  │ 自动化      │  │ Docker/VM    │  │ 视觉分析/图表解读        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ GitHub操作  │  │ API集成     │  │ 文件/数据库操作          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、分阶段实施计划

### Phase 0: 基础修复（立即执行）
**目标**：解决当前技术债务

| 任务 | 优先级 | 工作量 | 状态 |
|------|--------|--------|------|
| RAG Embedding 维度修复 | P0 | 2小时 | 待执行 |
| 拉取 all-minilm 模型 | P0 | 10分钟 | 待执行 |

**执行方案A（快速）：**
```bash
ollama pull all-minilm
# 修改 code_rag.py: self.model = "all-minilm"
```

---

### Phase 1: 「执行之手」强化（第1-2周）
**目标**：具备 Manus Max 级别的工具调用能力

#### 1.1 浏览器自动化引擎
```python
# core/modules/browser_agent.py
class BrowserAgent:
    """
    Manus Max 级别的浏览器自动化
    - Playwright/Puppeteer 控制
    - 自主导航、表单填写、数据抓取
    - 无头模式 + 可视化模式切换
    """
    async def execute(self, task: BrowserTask) -> ExecutionResult:
        pass
```

#### 1.2 云端实验室
```python
# core/modules/sandbox_engine.py
class SandboxEngine:
    """
    Docker/VM 隔离执行环境
    - 快速启动干净环境
    - 代码编写-测试-部署流水线
    - 资源隔离与计费
    """
    async def run_task(self, task: EngineeringTask) -> Result:
        pass
```

#### 1.3 工具注册表
```python
# core/tools/tool_registry.py
TOOL_REGISTRY = {
    "browser": BrowserAgent(),
    "docker": SandboxEngine(),
    "github": GitHubAPI(),
    "web_fetch": WebFetcher(),
    "code_execute": CodeRunner(),
    # ... 可扩展
}
```

**里程碑**：
- [ ] BrowserAgent 完成并测试
- [ ] SandboxEngine 完成并测试
- [ ] 工具注册表集成到 Triad-Loop

---

### Phase 2: 「长记忆」强化（第3-4周）
**目标**：从片段检索升级为决策图谱

#### 2.1 决策日志图谱 (Decision Ledger Graph)
```python
# core/memory/decision_ledger.py
class DecisionLedger:
    """
    决策日志图谱 - 记录战略演进史
    """
    def record(self, decision: Decision):
        """
        记录决策及其背景
        - 战略背景 (context)
        - 矛盾分析 (contradiction_analysis)
        - 决策内容 (decision_made)
        - 执行结果 (outcome)
        - 教训总结 (lessons_learned)
        """
        pass

    def query_similar_cases(self, current_problem: str) -> List[Case]:
        """
        基于语义相似性检索历史案例
        返回类似战役的完整上下文
        """
        pass
```

#### 2.2 图谱数据结构
```json
{
  "decision_id": "LOW_ECONOMY_PRICING_2024",
  "timestamp": "2024-03-15T10:30:00Z",
  "task": "低空经济动态定价算法",
  "context": {
    "market": "中国低空经济市场",
    "competitors": ["大疆", "亿航", "峰飞"],
    "internal_metrics": {"margin": 0.15, "utilization": 0.45}
  },
  "contradiction": "价格战 vs 利润率",
  "decision": "基于利用率的弹性定价模型",
  "outcome": {
    "margin_improved": "+8%",
    "utilization_improved": "+22%"
  },
  "lessons": [
    "弹性定价需考虑多维度因子",
    "博弈均衡点需要实时计算"
  ],
  "agents_involved": ["Coder", "Reviewer", "Validator"],
  "scores": {"final": 92.5, "coders": 88, "reviewer": 95, "validator": 94}
}
```

#### 2.3 经验传承引擎
```python
# core/memory/experience_inheritance.py
class ExperienceInheritance:
    """
    经验传承 - 让AI具备"历史感"
    """
    async def get_relevant_experience(self, new_task: Task) -> ExperienceContext:
        """
        1. 分析新任务的核心矛盾
        2. 在决策图谱中检索相似案例
        3. 提取成功经验和失败教训
        4. 生成"历史参考"上下文
        """
        pass
```

**里程碑**：
- [ ] DecisionLedger 数据结构定义
- [ ] 历史决策导入脚本
- [ ] 经验继承引擎集成

---

### Phase 3: 「流式博弈」强化（第5-6周）
**目标**：消除等待感，实现真正的"脑暴"

#### 3.1 异步流式协同架构
```
用户输入任务
       ↓
   战略定性 ←→ 决策图谱查询
       ↓
┌─────────────────────────────────────────┐
│         异步流式博弈循环                  │
│  ┌────────┐    ┌────────┐    ┌────────┐  │
│  │ Coder  │ ←→ │Reviewer│ ←→ │Validator│ │
│  │ (生成)  │    │ (审查)  │    │ (验证) │  │
│  └────────┘    └────────┘    └────────┘  │
│      ↑              ↑              ↑    │
│      └──────────────┼──────────────┘    │
│            实时流式反馈                   │
└─────────────────────────────────────────┘
       ↓
   博弈收敛 → 战略指令
```

#### 3.2 WebSocket 实时通信层
```python
# core/streaming/websocket_server.py
class MaoAIWebSocket:
    """
    WebSocket 服务端 - 实时推送博弈过程
    """
    async def broadcast_thought(self, agent: str, content: str):
        """
        实时推送每个Agent的思考过程
        """
        message = {
            "agent": agent,      # "Coder" | "Reviewer" | "Validator"
            "type": "thinking",  # "thinking" | "action" | "result"
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        await self.send_json(message)
```

#### 3.3 思维链可视化组件
```typescript
// frontend/components/ThoughtChain.tsx
interface ThoughtChainProps {
  agents: ['Coder', 'Reviewer', 'Validator'];
  onMessage: (msg: AgentMessage) => void;
}

// 实时显示：
// [Coder] 正在生成Patch...
// [Reviewer] 🔍 审查中: 逻辑检查...
// [Validator] ⚡ 环境预热...
// [Coder] 📝 收到反馈，重新生成...
```

**里程碑**：
- [ ] WebSocket 服务端实现
- [ ] 前端思维链可视化组件
- [ ] 端到端流式测试

---

### Phase 4: 「多模态战略感知」（第7-8周）
**目标**：从读文本升级为"看全局"

#### 4.1 视觉战略分析模块
```python
# core/multimodal/vision_strategist.py
class VisionStrategist:
    """
    多模态战略感知 - 看懂一切视觉信息
    """
    async def analyze_image(self, image: Image, context: str) -> StrategicAnalysis:
        """
        分析图片中的战略信息
        - 市场趋势图 → 识别不平衡点
        - 竞品UI → 发现矛盾点
        - 工程架构图 → 找出瓶颈
        """
        pass

    async def find_contradictions(self, visual_data: VisualData) -> List[Contradiction]:
        """
        基于《矛盾论》识别视觉中的不平衡
        """
        pass
```

#### 4.2 视觉分析能力矩阵
| 视觉类型 | 分析目标 | 矛盾识别 |
|---------|---------|---------|
| 折线图/柱状图 | 趋势、异常点 | 增长放缓/不均衡 |
| 热力图 | 用户行为分布 | 注意力浪费 |
| UI截图 | 功能入口深度 | 主次矛盾倒置 |
| 架构图 | 依赖关系 | 单点故障/瓶颈 |
| 地图 | 地理分布 | 覆盖盲区 |

#### 4.3 多模态模型集成
```python
# 支持的视觉分析模型
MULTIMODAL_MODELS = {
    "primary": "claude-3-5-sonnet",  # 自带视觉能力
    "fallback": "gpt-4o",           # 备选
    "local": "llava"                 # 本地轻量方案
}
```

**里程碑**：
- [ ] VisionStrategist 核心实现
- [ ] 与 Triad-Loop 集成
- [ ] 可视化矛盾识别功能

---

### Phase 5: 「战略哨兵」强化（第9-10周）
**目标**：从被动响应升级为主动出击

#### 5.1 哨兵监控系统
```python
# core/sentinel/strategic_sentinel.py
class StrategicSentinel:
    """
    战略哨兵 - 24小时主动监控
    """
    def __init__(self):
        self.monitors = {
            "github": GitHubMonitor(),      # 代码提交、PR、Issue
            "news": NewsMonitor(),          # 行业新闻、政策变动
            "metrics": MetricsMonitor(),    # 业务指标偏离
            "competitor": CompetitorMonitor() # 竞品动态
        }

    async def scan_all(self):
        """
        全维度扫描，发现异常立即上报
        """
        pass

    async def assess_strategic_significance(self, event: Event) -> AlertLevel:
        """
        评估事件的战略重要性
        """
        pass
```

#### 5.2 战略转折点识别
```python
# core/sentinel/pivot_detector.py
class PivotDetector:
    """
    识别"战略转折点"
    基于《矛盾论》：当外因发生剧变时，内因的主要矛盾也会转移
    """
    def detect_pivot(self, external_change: ExternalEvent) -> Optional[PivotAlert]:
        """
        检测是否触发战略转折点
        - 技术突破（外因）→ 竞争格局重塑
        - 政策变动（外因）→ 市场机会涌现
        - 竞品动作（外因）→ 需要快速响应
        """
        pass
```

#### 5.3 主动Review申请
```python
# 当哨兵发现战略转折点时
async def trigger_strategic_review(self, pivot: PivotAlert):
    """
    向统帅主动发起Review申请
    "报告统帅，敌情有变：OpenAI发布新模型，建议立即调整技术路线..."
    """
    await maoai.initiate_review(
        type="strategic_pivot",
        trigger=pivot,
        recommended_action=pivot.suggested_response
    )
```

**里程碑**：
- [ ] GitHub/News 监控集成
- [ ] 战略转折点算法
- [ ] 主动推送通知（Webhook/邮件）

---

### Phase 6: 「红蓝对抗」强化（第11-12周）
**目标**：从单一Reviewer升级为高强度对抗

#### 6.1 红蓝对抗架构
```
┌─────────────────────────────────────────────────────┐
│                 重大决策场景                          │
│                      ↓                              │
│        ┌───────────┴───────────┐                    │
│        ↓                       ↓                     │
│   ┌─────────┐            ┌─────────┐                 │
│   │ 红军    │            │ 蓝军    │                 │
│   │(证明可行)│            │(寻找风险)│                 │
│   └────┬────┘            └────┬────┘                 │
│        ↓                     ↓                       │
│   优势论证              毁灭性风险                    │
│   成功案例              最坏情景                      │
│   收益分析              崩塌路径                      │
│        ↓                     ↓                       │
│        └──────────┬──────────┘                        │
│                   ↓                                  │
│           ┌─────────────┐                            │
│           │ 战略裁决    │                            │
│           │ 综合对抗结果 │                            │
│           │ 最终决策    │                            │
│           └─────────────┘                            │
└─────────────────────────────────────────────────────┘
```

#### 6.2 红蓝Agent实现
```python
# core/adversarial/red_blue_agents.py
class RedAgent:  # 红军 - 证明可行性
    """
    任务：找出方案的所有成功要素
    - 历史成功案例
    - 技术可行性证据
    - 市场机会分析
    - 资源支持论证
    """
    async def prove_viability(self, proposal: Proposal) -> ViabilityReport:
        pass

class BlueAgent:  # 蓝军 - 寻找毁灭性风险
    """
    任务：找出方案的所有致命漏洞
    - 黑天鹅事件
    - 竞品反制措施
    - 技术不可行性
    - 监管风险
    """
    async def find_killers(self, proposal: Proposal) -> RiskReport:
        pass

class StrategicJudge:
    """
    战略裁决 - 综合红蓝对抗结果
    """
    async def deliberate(self, viability: ViabilityReport, risk: RiskReport) -> Decision:
        """
        - 计算胜率 = 可行性得分 - 风险系数
        - 识别核心矛盾点
        - 生成最终决策建议
        """
        pass
```

#### 6.3 对抗强度等级
| 等级 | 适用场景 | 对抗轮次 | 时间限制 |
|------|---------|---------|---------|
| L1 | 日常任务 | 1轮 | 5分钟 |
| L2 | 重要决策 | 3轮 | 15分钟 |
| L3 | 战略转折 | 5轮+ | 30分钟 |
| L4 | 生死抉择 | 无限 | 直到收敛 |

**里程碑**：
- [ ] RedAgent/BlueAgent 核心实现
- [ ] StrategicJudge 裁决算法
- [ ] 对抗可视化界面

---

## 四、技术栈汇总

### 核心依赖
| 组件 | 技术选型 | 用途 |
|------|---------|------|
| 浏览器自动化 | Playwright | 网页操作、数据抓取 |
| 沙箱执行 | Docker SDK | 隔离环境、代码执行 |
| WebSocket | FastAPI + websockets | 实时流式通信 |
| 图数据库 | Neo4j / SQLite | 决策图谱存储 |
| 多模态 | Claude-3.5 / GPT-4o | 视觉分析 |
| 监控 | GitHub API / NewsAPI | 战略哨兵 |

### 现有技术复用
| 现有组件 | 增强方向 |
|---------|---------|
| `triad_loop.py` | +红蓝对抗、+流式输出 |
| `code_rag.py` | +决策图谱、+经验传承 |
| `MAOAI_THINKING_PROTOCOL.md` | +Phase 6红蓝对抗章节 |

---

## 五、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| RAG维度不匹配 | 当前检索失效 | 立即修复all-minilm |
| 浏览器反爬 | 数据抓取受限 | 合法API优先，爬虫备选 |
| 哨兵过度打扰 | 用户疲劳 | 智能分级，重要才推 |
| 对抗无限循环 | 决策延迟 | 严格时间限制+收敛判定 |
| 成本失控 | API调用费用 | 本地模型优先，API备选 |

---

## 六、快速启动命令

```bash
# Phase 0: 立即修复
ollama pull all-minilm

# Phase 1: 克隆/安装依赖
pip install playwright
playwright install chromium

# Phase 2: 数据库初始化
python -c "from core.memory import DecisionLedger; DecisionLedger.init_db()"

# Phase 3: 启动WebSocket
python server/websocket_server.py

# Phase 4: 测试视觉分析
python -c "from core.multimodal import VisionStrategist; VisionStrategist.test()"

# Phase 5: 启动哨兵
python server/sentinel.py &

# Phase 6: 开启红蓝对抗
python -c "from core.adversarial import RedAgent, BlueAgent; RedAgent().vs(BlueAgent())"
```

---

**下一步行动**：
1. **立即**：修复RAG维度问题（Phase 0）
2. **本周**：实现Phase 1 浏览器自动化
3. **本月**：完成Phase 1-2

---

*本文档由 MaoAI 战略分析模块生成 | 2026-04-13*
