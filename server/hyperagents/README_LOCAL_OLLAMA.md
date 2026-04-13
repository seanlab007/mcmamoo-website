# 本地旧版 Ollama 运行指南 (Mcmamoo HyperAgents)

本指南旨在帮助管理员在本地电脑（尤其是配置有限、运行旧版 Ollama 的环境）上一键复现“毛泽东思想 vs 马斯克思想”双 Agent 思想碰撞逻辑。

## 1. 环境准备
*   **Ollama**: 确保已安装并运行。
*   **Python**: 3.10+
*   **依赖库**: `pip install openai pandas numpy`

## 2. 模型配置 (针对旧版 Ollama)
由于旧版 Ollama 不支持 `nomic-embed-text`，我们统一使用极其轻量的 `all-minilm` 模型（约 45MB）。

1.  **拉取模型**:
    ```bash
    ollama pull all-minilm
    ```
2.  **启动服务**:
    ```bash
    ollama serve
    ```

## 3. 同步核心文件
请确保以下文件已从 GitHub 同步到您的本地目录：
*   `server/hyperagents/utils/code_rag.py`: 已优化切片逻辑（300字/切片），适配旧版上下文限制。
*   `server/hyperagents/agent/`: 包含所有 Agent 类及 Prompt。
*   `.code_rag_index.json`: **核心索引文件**。如果您在本地重新索引，请运行 `python server/hyperagents/utils/code_rag.py`。

## 4. 运行双 Agent 演示
我们已为您准备了演示脚本，只需配置好您的 API Key（DeepSeek/Groq/Gemini）：

1.  **修改 API 配置**:
    编辑 `server/hyperagents/agent/musk_agent.py` 和 `tactical_execution_agent.py`，填入您的 `api_key`。

2.  **执行演示**:
    ```bash
    python demo_dual_review_v2.py
    ```

## 5. 常见问题 (FAQ)
*   **500 错误**: 如果 Ollama 返回 500 错误，通常是由于输入文本过长。`code_rag.py` 已内置自动截断逻辑，请确保使用的是最新版本。
*   **索引不匹配**: 如果更换了 Embedding 模型，必须删除旧的 `.code_rag_index.json` 并重新运行索引脚本。

---
**云端开发，本地运行。让思想在任何设备上都能自由碰撞。**
