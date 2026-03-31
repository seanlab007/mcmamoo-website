# MaoAI 通过 MCP 协议共享 Claude Code 工具能力

## 核心概念

Claude Code 的强大工具能力（Git、文件操作、数据库查询等）并非写死在代码里，而是通过 **MCP (Model Context Protocol)** 协议动态挂载的。MaoAI 也原生支持 MCP，这意味着你不需要做代码移植，只需让 MaoAI 连接同一套 MCP 服务器，就能获得完全一致的工具能力。

---

## 正确姿势：MCP 协议共享（推荐）

这是最干净、最安全的方案。你不需要碰 Claude Code 的源码，只需复用其工具生态。

### 1. 原理

- Claude Code 和 MaoAI 都支持 MCP 协议
- MCP 工具是独立的服务器进程，与客户端解耦
- 通过标准化协议，不同 AI Agent 可以共享同一套工具服务器

### 2. Claude Code 工具清单

根据分析，Claude Code 包含以下核心工具：

| 工具类别 | 工具名称 | 功能描述 |
|---------|---------|---------|
| **文件操作** | FileReadTool | 读取文件内容 |
| | FileWriteTool | 写入文件 |
| | FileEditTool | 编辑文件内容 |
| | GlobTool | 文件模式匹配 |
| | GrepTool | 文本搜索 |
| **命令执行** | BashTool | Bash 命令执行 |
| | PowerShellTool | PowerShell 命令执行 |
| **代码智能** | LSPTool | 语言服务器协议支持 |
| | AgentTool | Agent 子任务管理 |
| **网络操作** | WebSearchTool | 网络搜索 |
| | WebFetchTool | 网页内容获取 |
| **任务管理** | TaskCreateTool | 创建任务 |
| | TaskListTool | 列出任务 |
| | TaskGetTool | 获取任务详情 |
| | TaskUpdateTool | 更新任务 |
| | TaskStopTool | 停止任务 |
| | TodoWriteTool | 写入待办事项 |
| **团队协作** | TeamCreateTool | 创建团队 |
| | TeamDeleteTool | 删除团队 |
| | SendMessageTool | 发送消息 |
| **MCP 相关** | MCPTool | MCP 工具调用 |
| | ListMcpResourcesTool | 列出 MCP 资源 |
| | ReadMcpResourceTool | 读取 MCP 资源 |
| | McpAuthTool | MCP 认证 |
| **其他** | AskUserQuestionTool | 询问用户 |
| | BriefTool | 简报生成 |
| | ConfigTool | 配置管理 |
| | NotebookEditTool | 笔记本编辑 |
| | SkillTool | 技能工具 |
| | CronCreateTool/CronListTool/CronDeleteTool | 定时任务管理 |
| | RemoteTriggerTool | 远程触发 |
| | SyntheticOutputTool | 合成输出 |
| | ToolSearchTool | 工具搜索 |

### 3. MaoAI MCP 配置

在 MaoAI 的配置文件中添加以下 MCP 服务器连接：

```json
{
  "mcp_servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/daiyan/WorkBuddy"],
      "description": "文件系统操作"
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/Users/daiyan/WorkBuddy"],
      "description": "Git 操作"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "GitHub API 操作"
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
      "description": "PostgreSQL 数据库查询"
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/database.db"],
      "description": "SQLite 数据库操作"
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "description": "HTTP 请求和网页获取"
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      },
      "description": "Brave 搜索引擎"
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "description": "顺序思考工具"
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "description": "浏览器自动化"
    }
  }
}
```

### 4. MaoAI 官方 MCP 支持

根据 MaoAI 官方文档，支持通过以下方式连接 MCP 服务器：

#### 方式一：使用 run_mcp.py

```python
# run_mcp.py 示例
from maoai import MCPClient

client = MCPClient()

# 连接文件系统 MCP 服务器
client.connect_server(
    name="filesystem",
    command="npx",
    args=["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
)

# 连接 Git MCP 服务器
client.connect_server(
    name="git",
    command="uvx",
    args=["mcp-server-git", "--repository", "/path/to/repo"]
)

# 列出可用工具
tools = client.list_tools()
print(f"可用工具: {tools}")

# 调用工具
result = client.call_tool("git_status", {})
print(result)
```

#### 方式二：使用 MCPClients

```python
from maoai import MCPClients

# 初始化 MCP 客户端
mcp_clients = MCPClients()

# 从配置文件加载
mcp_clients.load_from_config("mcp_config.json")

# 动态注册工具到 Agent
agent = Agent(
    tools=mcp_clients.get_all_tools()
)

# Agent 现在可以使用所有 MCP 工具
response = agent.run("请查看当前 git 状态")
```

---

## 具体操作建议

### 步骤 1：确认工具源

查看 Claude Code 的配置，找到它使用的 MCP 服务器地址或镜像：

```bash
# 在 Claude Code 中运行
claude mcp list
```

### 步骤 2：配置 MaoAI

在 MaoAI 的配置中添加这些 MCP 服务器的连接信息。

### 步骤 3：验证调用

启动 MaoAI，检查工具列表是否包含了从 MCP 服务器动态注册的新工具：

```python
# 验证脚本
from maoai import MCPClients

client = MCPClients()
client.load_from_config("mcp_config.json")

tools = client.list_tools()
for tool in tools:
    print(f"- {tool.name}: {tool.description}")
```

---

## 风险路径：直接拆解源码（不推荐）

如果你想"拆"的是 Claude Code 泄露的 TypeScript 工具实现代码，这条路几乎不可行：

| 问题 | 说明 |
|-----|------|
| **语言壁垒** | Claude Code 是 Node.js/TypeScript 工程，MaoAI 是 Python 框架。直接移植代码需要重写所有类型定义和异步逻辑 |
| **架构差异** | Claude Code 的工具调用深度依赖其内部的 CLI 状态机和权限控制，强拆出来会破坏其安全性 |
| **维护噩梦** | 你会陷入两套不同技术栈的调试泥潭 |

---

## 一句话总结

> **别拆代码，共享 MCP 服务。** 让 MaoAI 连接 Claude Code 用的那套工具服务器，这才是现代 AI Agent 架构的正解。

---

## 附录：常用 MCP 服务器列表

| 服务器 | 安装命令 | 功能 |
|-------|---------|------|
| Filesystem | `npx -y @modelcontextprotocol/server-filesystem` | 文件操作 |
| Git | `uvx mcp-server-git` | Git 操作 |
| GitHub | `npx -y @modelcontextprotocol/server-github` | GitHub API |
| PostgreSQL | `npx -y @modelcontextprotocol/server-postgres` | PostgreSQL 查询 |
| SQLite | `npx -y @modelcontextprotocol/server-sqlite` | SQLite 操作 |
| Fetch | `uvx mcp-server-fetch` | HTTP 请求 |
| Brave Search | `npx -y @modelcontextprotocol/server-brave-search` | 搜索 |
| Puppeteer | `npx -y @modelcontextprotocol/server-puppeteer` | 浏览器自动化 |
| Sequential Thinking | `npx -y @modelcontextprotocol/server-sequential-thinking` | 思考链 |

---

## 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP 服务器列表](https://github.com/modelcontextprotocol/servers)
- [MaoAI MCP 文档](https://docs.maoai.cn/mcp)
- [Claude Code 仓库](https://github.com/instructkr/claude-code)
