# MaoAI Thinking Protocol: Triad-Loop Architecture
# 猫眼智能思考协议：三权分立博弈架构

## 1. 核心哲学 (Core Philosophy)
禁止“盲目执行”和“单向思考”。所有复杂工程任务必须通过 **Coder (执行者)**、**Reviewer (审查者)**、**Validator (验证者)** 三方博弈完成。

## 2. 三权分立角色定义 (Role Definitions)
| 角色 | 核心职责 | 推荐模型 | 核心工具 |
| :--- | :--- | :--- | :--- |
| **Coder** | 生成原子化 Patch，负责代码实现与重构。 | Claude 3.5 Sonnet | `patch_utils.py`, `code_rag.py` |
| **Reviewer** | 逻辑审查、安全性检查、生成测试用例。 | GPT-4o / DeepSeek-V3 | 静态分析、逻辑推理 |
| **Validator** | 运行测试、环境模拟、结果验证。 | Local Runtime / Docker | `pytest`, `npm test`, `ffmpeg` |

## 3. 深度思考工作流 (Thinking Workflow)
### Phase 1: 语义感知 (Semantic Perception)
- **动作**：调用 `CodeRAG` 检索相关上下文。
- **禁令**：禁止在未阅读相关依赖文件的情况下开始编写代码。
- **输出**：当前任务的代码依赖图 (Dependency Graph)。

### Phase 2: 原子化设计 (Atomic Design)
- **动作**：设计 Unified Diff 格式的修改方案。
- **原则**：外科手术式修改，严禁重写整个文件。
- **工具**：使用 `sed`/`grep`/`patch` 逻辑确保修改的精准度。

### Phase 3: 博弈循环 (Triad-Loop)
1. **Generate**: Coder 输出第一个 Patch。
2. **Review**: Reviewer 给出 0-100 的评分。若低于 80 分，打回重写。
3. **Validate**: Validator 运行测试。若报错，将 Traceback 反馈给 Coder。
4. **Converge**: 计算 Patch 相似度。若连续两轮相似度 > 95% 且未通过，判定为逻辑死循环，触发“架构重置”。

## 4. 避坑指南 (Anti-Pattern Prevention)
- **排除干扰**：自动跳过 `node_modules`, `dist`, `build`, `.next` 等非源码目录。
- **本地优先**：优先调用本地 Ollama (nomic-embed-text) 进行向量化，确保隐私与速度。
- **实时反馈**：所有执行过程必须输出 `[STEP X/Y]` 实时日志，严禁长时间静默。

## 5. 审美标准 (Aesthetic Standard)
- **UI 风格**：严格遵循“黑金 (Dark Gold)”审美 (#d4af37)。
- **交互**：所有 AI 生成内容必须带上 `[MaoAI-Think]` 标签，展示推理过程。

## 6. Phase 6: 异构模型博弈 (Heterogeneous Model Debate) — 新增

### 三权分立角色更新
| 角色 | 核心职责 | 推荐模型 | 备选模型 |
| :--- | :--- | :--- | :--- |
| **Coder** | 代码生成 + Agentic 工具链 | **Claude Code Local** (工具链模式) | Claude API (纯文本) |
| **Reviewer** | 逻辑审查 + 测试用例生成 | **GLM-4-Plus** (智谱) | GPT-4o / DeepSeek-V3 |
| **Validator** | 测试验证 | Pytest / Sandbox | **GLM-4 沙箱模拟** (降级) |

### 核心理念
- **Claude 写，GLM 审**：两套独立推理体系相互制衡，消除单一模型盲点
- **OpenAI-compatible 协议**：GLM-4 零配置接入（智谱 API 兼容 OpenAI v1）
- **自动模型路由**：根据模型名前缀自动选 Provider（glm/claude/openai）
- **降级保护**：任一模型不可用时自动 fallback，不中断博弈循环

### 快速启用异构博弈

**Python 直接调用：**
```python
from server.hyperagents.agent.triad_loop import create_triad_loop

triad = create_triad_loop(
    workspace="/path/to/project",
    coder_model="claude-3-5-sonnet",
    reviewer_model="glm-4-plus",       # GLM-4 作 Reviewer
    heterogeneous_mode=True,            # 一键异构博弈
)
result = triad.run(task="修复登录模块的类型错误")
```

**CLI 调用：**
```bash
python3 -m server.hyperagents.agent.triad_loop \
  --task "优化数据库查询性能" \
  --heterogeneous \
  --reviewer-provider glm \
  --glm-model glm-4-plus \
  --claude-local
```

**TS 层调用（triadLoopIntegration.ts）：**
```typescript
await executeTriadLoop({
  taskId: 42,
  task: "重构认证中间件",
  heterogeneous: true,
  reviewerProvider: "glm",
  glmModel: "glm-4-plus",
  claudeLocal: false,  // 暂无本地 Anthropic Key 时设 false
});
```

### 环境变量
```env
ZHIPU_API_KEY=xxx              # 智谱 GLM-4（已配置）
GLM_MODEL=glm-4-plus           # GLM 默认模型
ANTHROPIC_API_KEY=sk-ant-xxx   # Claude API（可选）
CLAUDE_CODE_MODE=auto          # auto | local | api
```
