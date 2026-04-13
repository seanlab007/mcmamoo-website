# Mcmamoo HyperAgents 架构说明 (Architecture Overview)

> **架构核心：协议统领，三位一体。**
> 
> 本架构旨在实现毛泽东思想（战略）、马斯克思想（工程）与猫眼内容平台（工具）的深度协同。

---

## 1. 核心层：MAOAI_THINKING_PROTOCOL.md (The Protocol)

*   **地位**：所有 AI 任务的入口协议。
*   **职责**：
    *   **任务定性**：判断任务属于战略、工程还是工具类。
    *   **辩证预处理**：识别主要矛盾，确定内因外因。
    *   **路由分发**：将任务分发至对应的 Agent 或工具接口。

---

## 2. 决策与执行层 (Decision & Execution)

### 2.1 战略战术 Agent (Mao Strategic Agent)
*   **核心语料**：毛泽东军事思想（《论持久战》、《矛盾论》、《十大军事原则》等）。
*   **应用场景**：竞争态势分析、资源统筹、攻坚顺序、组织动员。
*   **输出**：战略方针、战术原则。

### 2.2 工程技术 Agent (Musk Engineering Agent)
*   **核心语料**：马斯克第一性原理、五步工作法、物理学底层逻辑。
*   **应用场景**：成本优化、技术瓶颈突破、垂直整合、自动化流程。
*   **输出**：工程路径、物理参数优化。

### 2.3 猫眼内容平台工具链 (Maoyan Toolchain)
*   **核心能力**：集成顶级 AI 接口（Flux, Midjourney, I2V, AI 视频剪辑）。
*   **应用场景**：视频生成、图形设计、排版、基础代码编写。
*   **输出**：高质量多媒体内容。

---

## 3. 协同工作流 (Workflow)

1.  **输入 (Input)**：用户请求或系统任务。
2.  **协议层 (Protocol Layer)**：调用 `MAOAI_THINKING_PROTOCOL.md` 进行定性分析。
3.  **分发 (Routing)**：
    *   **战略任务** -> 发送至 `TacticalExecutionAgent`。
    *   **工程任务** -> 发送至 `MuskAgent`。
    *   **工具任务** -> 发送至 `MaoyanToolchain` 接口。
4.  **整合 (Integration)**：复杂任务由多方协同，最终由协议层进行“实事求是”Review。
5.  **输出 (Output)**：交付最终成果。

---

## 4. 部署与同步 (Deployment & Sync)

*   **云端优先**：在云端（DeepSeek/OpenAI/Gemini）进行高维度逻辑验证。
*   **本地运行**：通过 `all-minilm` 模型在本地旧版 Ollama 环境下实现轻量化复现。
*   **GitHub 同步**：所有协议、代码和索引文件通过 GitHub 保持全平台一致性。

---
**本架构确保了 AI 在具备极致工程效率的同时，拥有深厚的战略底蕴。**
