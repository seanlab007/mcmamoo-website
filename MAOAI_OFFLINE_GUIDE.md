# MaoAI 本地离线配置与使用指南

本指南旨在帮助用户在本地环境中完整部署 MaoAI，实现 100% 的数据隐私保护与离线 AI 交互。通过集成 **Ollama** 和 **本地文件存储**，MaoAI 可以在无互联网连接的情况下提供强大的战略分析与对话能力。

---

## 1. 环境准备

在开始配置之前，请确保您的本地机器已安装以下基础环境：

| 组件 | 推荐版本 | 说明 |
| :--- | :--- | :--- |
| **Node.js** | v18.x 或更高 | 用于运行前端与后端服务 |
| **Ollama** | 最新版本 | 本地大模型运行引擎 |
| **Git** | 最新版本 | 用于代码版本管理 |

---

## 2. 本地模型集成 (Ollama)

MaoAI 已预置了对 Ollama 的原生支持。

### 2.1 安装并启动 Ollama
1. 前往 [Ollama 官网](https://ollama.com/) 下载并安装。
2. 在终端运行以下命令下载推荐模型：
   ```bash
   ollama run llama3
   ```
   *注：您也可以根据硬件配置选择 `qwen2.5` 或 `deepseek-v3` 等模型。*

### 2.2 验证 API 访问
Ollama 默认在 `http://localhost:11434` 运行。MaoAI 通过 OpenAI 兼容接口与其通信：
*   **Endpoint**: `http://localhost:11434/v1`
*   **配置位置**: `client/src/features/maoai/constants.ts` 中的 `MAOAI_LOCAL_OLLAMA`。

---

## 3. 数据库离线化配置

MaoAI 采用**双模存储架构**，无需手动配置即可实现离线化。

### 3.1 自动切换逻辑
*   **云端模式**：当检测到环境变量 `SUPABASE_URL` 时，系统连接 Supabase 云数据库。
*   **离线模式**：若未配置 Supabase，系统会自动切换至本地文件存储。

### 3.2 本地存储文件
*   **文件路径**: 项目根目录下的 `.openclaw-local-db.json`。
*   **存储内容**: 包含所有对话历史、Agent 配置、节点信息及用户偏好。
*   **备份建议**: 定期备份该 JSON 文件即可迁移您的所有 AI 资产。

---

## 4. 启动 MaoAI

按照以下步骤在本地启动完整服务：

1.  **安装依赖**:
    ```bash
    npm install
    ```
2.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
3.  **访问界面**:
    打开浏览器访问 `http://localhost:5173/maoai`。

---

## 5. 进阶配置：添加自定义本地节点

如果您运行了多个本地模型（例如使用 LM Studio 或多个 Ollama 实例），可以通过以下步骤添加：

1.  进入 MaoAI 的 **“节点管理” (Node Management)** 页面。
2.  点击 **“添加节点”**。
3.  填写节点信息：
    *   **名称**: 如 "Local DeepSeek"
    *   **URL**: `http://localhost:1234/v1` (LM Studio 默认)
    *   **优先级**: 设置为最高以优先使用。
4.  保存后，MaoAI 的路由引擎将自动将请求分发至该本地节点。

---

## 6. 常见问题排查 (FAQ)

**Q: 为什么无法连接到本地模型？**
> **A**: 请检查 Ollama 是否已启动，并确保没有防火墙拦截 `11434` 端口。您可以尝试在浏览器访问 `http://localhost:11434`，若显示 "Ollama is running" 则表示正常。

**Q: 如何清理旧数据？**
> **A**: 直接删除根目录下的 `.openclaw-local-db.json` 文件，系统在下次启动时会重新初始化一个干净的数据库。

**Q: 离线模式下可以使用图像生成吗？**
> **A**: 图像生成目前主要依赖云端 API（如智谱 CogView）。若需离线图像生成，建议安装 **Stable Diffusion WebUI** 并通过自定义节点接入。

---

*© 2026 MaoAI Strategic Intelligence. 保留所有权利。*
