"""
MaoAI MCP 集成示例代码
展示如何将 Claude Code 的工具能力通过 MCP 协议共享给 MaoAI
"""

import asyncio
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class MCPTool:
    """MCP 工具定义"""
    name: str
    description: str
    parameters: Dict[str, Any]
    server: str


class MCPClient:
    """
    MaoAI MCP 客户端
    用于连接和管理 MCP 服务器
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.servers: Dict[str, Dict] = {}
        self.tools: Dict[str, MCPTool] = {}
        self.config_path = config_path
        
        if config_path:
            self.load_from_config(config_path)
    
    def load_from_config(self, path: str):
        """从配置文件加载 MCP 服务器配置"""
        with open(path, 'r') as f:
            config = json.load(f)
        
        for name, server_config in config.get('mcp_servers', {}).items():
            self.servers[name] = server_config
            print(f"✓ 已加载 MCP 服务器: {name}")
    
    def connect_server(self, name: str, command: str, args: List[str], 
                       env: Optional[Dict] = None, description: str = ""):
        """手动连接 MCP 服务器"""
        self.servers[name] = {
            "command": command,
            "args": args,
            "env": env or {},
            "description": description
        }
        print(f"✓ 已连接 MCP 服务器: {name}")
    
    def list_servers(self) -> List[str]:
        """列出所有已配置的 MCP 服务器"""
        return list(self.servers.keys())
    
    def get_server_info(self, name: str) -> Optional[Dict]:
        """获取指定服务器的配置信息"""
        return self.servers.get(name)
    
    async def discover_tools(self, server_name: str) -> List[MCPTool]:
        """
        从 MCP 服务器发现可用工具
        实际实现需要调用 MCP 协议的工具发现接口
        """
        # 这里是一个示例实现
        # 实际使用时需要调用 MCP 服务器的 tools/list 接口
        
        server_tools_map = {
            "filesystem": [
                MCPTool("read_file", "读取文件内容", {"path": "string"}, "filesystem"),
                MCPTool("write_file", "写入文件", {"path": "string", "content": "string"}, "filesystem"),
                MCPTool("list_directory", "列出目录", {"path": "string"}, "filesystem"),
                MCPTool("search_files", "搜索文件", {"pattern": "string"}, "filesystem"),
            ],
            "git": [
                MCPTool("git_status", "获取 Git 状态", {}, "git"),
                MCPTool("git_log", "查看提交历史", {"limit": "integer"}, "git"),
                MCPTool("git_diff", "查看代码差异", {}, "git"),
                MCPTool("git_commit", "提交代码", {"message": "string"}, "git"),
            ],
            "github": [
                MCPTool("create_issue", "创建 Issue", {"title": "string", "body": "string"}, "github"),
                MCPTool("list_issues", "列出 Issue", {"state": "string"}, "github"),
                MCPTool("create_pr", "创建 PR", {"title": "string", "head": "string", "base": "string"}, "github"),
            ],
            "brave-search": [
                MCPTool("web_search", "网络搜索", {"query": "string", "count": "integer"}, "brave-search"),
            ],
            "fetch": [
                MCPTool("fetch_url", "获取网页内容", {"url": "string"}, "fetch"),
            ],
        }
        
        return server_tools_map.get(server_name, [])
    
    async def register_all_tools(self):
        """注册所有服务器的工具"""
        for server_name in self.servers:
            tools = await self.discover_tools(server_name)
            for tool in tools:
                full_name = f"{server_name}/{tool.name}"
                self.tools[full_name] = tool
                print(f"  - 已注册工具: {full_name}")
        
        print(f"\n总计注册 {len(self.tools)} 个工具")
    
    def list_tools(self) -> List[str]:
        """列出所有可用工具"""
        return list(self.tools.keys())
    
    def get_tool(self, name: str) -> Optional[MCPTool]:
        """获取指定工具的详细信息"""
        return self.tools.get(name)
    
    async def call_tool(self, tool_name: str, params: Dict[str, Any]) -> Any:
        """
        调用指定工具
        实际实现需要通过 MCP 协议调用服务器
        """
        tool = self.tools.get(tool_name)
        if not tool:
            raise ValueError(f"未知工具: {tool_name}")
        
        server = self.servers.get(tool.server)
        if not server:
            raise ValueError(f"工具 {tool_name} 对应的服务器未配置")
        
        # 这里应该实现实际的 MCP 调用逻辑
        # 通过 stdio 或 SSE 与 MCP 服务器通信
        
        print(f"调用工具: {tool_name}")
        print(f"参数: {params}")
        
        # 模拟返回结果
        return {
            "tool": tool_name,
            "params": params,
            "result": "success",
            "data": f"Tool {tool_name} executed successfully"
        }


class MaoAIAgent:
    """
    MaoAI Agent 示例
    展示如何集成 MCP 工具
    """
    
    def __init__(self, mcp_client: MCPClient):
        self.mcp_client = mcp_client
        self.available_tools: List[str] = []
    
    async def initialize(self):
        """初始化 Agent，注册所有 MCP 工具"""
        await self.mcp_client.register_all_tools()
        self.available_tools = self.mcp_client.list_tools()
        print(f"\nAgent 初始化完成，可用工具数: {len(self.available_tools)}")
    
    async def execute_task(self, task_description: str) -> str:
        """
        执行任务
        根据任务描述选择合适的 MCP 工具
        """
        print(f"\n执行任务: {task_description}")
        
        # 这里应该实现任务解析和工具选择逻辑
        # 简单示例：根据关键词选择工具
        
        if "git" in task_description.lower():
            result = await self.mcp_client.call_tool("git/git_status", {})
            return f"Git 状态: {result}"
        
        elif "文件" in task_description or "file" in task_description.lower():
            result = await self.mcp_client.call_tool("filesystem/list_directory", 
                                                      {"path": "."})
            return f"目录列表: {result}"
        
        elif "搜索" in task_description or "search" in task_description.lower():
            result = await self.mcp_client.call_tool("brave-search/web_search", 
                                                      {"query": task_description, "count": 5})
            return f"搜索结果: {result}"
        
        else:
            return f"可用工具: {', '.join(self.available_tools[:10])}..."


# 使用示例
async def main():
    """主函数 - 演示 MCP 集成"""
    
    print("=" * 60)
    print("MaoAI MCP 集成演示")
    print("=" * 60)
    
    # 1. 创建 MCP 客户端
    client = MCPClient(config_path="mcp-config.json")
    
    # 2. 或者手动添加服务器
    client.connect_server(
        name="filesystem",
        command="npx",
        args=["-y", "@modelcontextprotocol/server-filesystem", "/Users/daiyan/WorkBuddy"],
        description="文件系统操作"
    )
    
    client.connect_server(
        name="git",
        command="uvx",
        args=["mcp-server-git", "--repository", "/Users/daiyan/WorkBuddy"],
        description="Git 操作"
    )
    
    # 3. 创建 Agent 并初始化
    agent = MaoAIAgent(client)
    await agent.initialize()
    
    # 4. 显示所有可用工具
    print("\n" + "=" * 60)
    print("可用 MCP 工具列表")
    print("=" * 60)
    
    for i, tool_name in enumerate(agent.available_tools, 1):
        tool = client.get_tool(tool_name)
        if tool:
            print(f"{i}. {tool_name}")
            print(f"   描述: {tool.description}")
            print(f"   参数: {tool.parameters}")
            print()
    
    # 5. 执行示例任务
    print("=" * 60)
    print("执行示例任务")
    print("=" * 60)
    
    tasks = [
        "查看当前 Git 状态",
        "列出当前目录文件",
        "搜索 Python MCP 服务器",
    ]
    
    for task in tasks:
        result = await agent.execute_task(task)
        print(f"\n任务: {task}")
        print(f"结果: {result}")
        print("-" * 40)


if __name__ == "__main__":
    asyncio.run(main())
