# Mcmamoo HyperAgents 架构说明 (Architecture Overview)

> **架构核心：五层分权，三权分立博弈，战略统领。**
> 
> 本架构旨在实现毛泽东思想（战略）、马斯克思想（工程）与猫眼内容平台（工具）的深度协同，并引入 Coder/Reviewer/Validator 三权分立博弈机制处理核心执行。

---

## 1. 核心层：MAOAI_THINKING_PROTOCOL.md (The Protocol)

*   **地位**：所有 AI 任务的入口协议。
*   **职责**：
    *   **任务定性**：判断任务属于战略、工程、工具还是通用类。
    *   **辩证预处理**：识别主要矛盾，确定内因外因。
    *   **路由分发**：将任务分发至对应的 Agent 或工具接口。

---

## 2. 五层分权架构 (The Five-Layer Power Structure)

### 2.1 第一层：协议统领层 (Protocol Layer)
*   **职责**：所有任务的入口。负责任务定性、主要矛盾识别、以及最终的辩证 Review。

### 2.2 第二层：三权分立博弈层 (Triad-Loop Execution Layer)
*   **职责**：处理 80% 的一般性问题与核心工程执行。
*   **角色**：
    *   **Coder (Claude 3.5)**：生成原子化 Patch，负责代码实现与重构。
    *   **Reviewer (DeepSeek/GPT-4o)**：逻辑审查、安全性检查、生成测试用例。
    *   **Validator (Local Runtime)**：运行测试、环境模拟、结果验证。

### 2.3 第三层：猫眼工具执行层 (Maoyan Toolchain Layer)
*   **职责**：纯粹的生产执行。调用顶级视频生成 (Runway/Kling)、图形设计 (Flux/MJ) 等接口。

### 2.4 第四层：工程裁决层 (Musk Engineering Layer)
*   **职责**：**仅在涉及工程瓶颈、物理极限、成本重构时触发**。
*   **模型**：**马斯克思想模型 (Musk Engineering Agent)**。

### 2.5 第五层：战略统领层 (Mao Strategic Layer)
*   **职责**：**最高层级，仅在涉及战略战术、资源统筹、主要矛盾决策时触发**。
*   **模型**：**毛泽东思想模型 (Mao Strategic Agent)**。

---

## 3. 深度思考工作流 (Thinking Workflow)

1.  **语义感知 (Semantic Perception)**：调用 `CodeRAG` 检索相关上下文。
2.  **原子化设计 (Atomic Design)**：设计 Unified Diff 格式的修改方案。
3.  **博弈循环 (Triad-Loop)**：
    *   **Generate** -> **Review** -> **Validate** -> **Converge**。
4.  **整合 (Integration)**：复杂任务由多方协同，最终由协议层进行“实事求是”Review。

---

## 4. 部署与同步 (Deployment & Sync)

*   **云端优先**：在云端（DeepSeek/OpenAI/Gemini）进行高维度逻辑验证。
*   **本地运行**：通过 `all-minilm` 模型在本地旧版 Ollama 环境下实现轻量化复现。
*   **GitHub 同步**：所有协议、代码和索引文件通过 GitHub 保持全平台一致性。

---
**本架构确保了 AI 在具备极致工程效率的同时，拥有最稳固的战略根基。**
