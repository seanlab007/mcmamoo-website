"""
MCP Tool Bus - 万用工具总线
═══════════════════════════════════════════════════════════════════════════════
基于 Model Context Protocol (MCP) 的标准化工具接口，支持动态接入外部工具。

核心能力：
- MCP 服务器管理：连接、断开、健康检查
- 工具发现：自动发现 MCP 服务器提供的工具
- 统一调用：标准化的工具调用接口
- 工具注册表：本地工具与 MCP 工具的融合

Author: MaoAI Core 2.0
Version: 3.0.0 "破壁者"
"""

import asyncio
import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Protocol, Union
import aiohttp


# ───────────────────────────────────────────────────────────────────────────────
# 数据模型
# ───────────────────────────────────────────────────────────────────────────────

class ToolStatus(Enum):
    """工具状态"""
    AVAILABLE = "available"
    BUSY = "busy"
    ERROR = "error"
    DISABLED = "disabled"


@dataclass
class MCPTool:
    """MCP 工具定义"""
    name: str
    description: str
    parameters: Dict[str, Any]  # JSON Schema
    server_id: str
    status: ToolStatus = ToolStatus.AVAILABLE
    
    # 统计
    call_count: int = 0
    success_count: int = 0
    avg_latency_ms: float = 0.0


@dataclass
class MCPServer:
    """MCP 服务器配置"""
    server_id: str
    name: str
    url: str
    transport: str = "sse"  # sse, stdio, websocket
    headers: Dict[str, str] = field(default_factory=dict)
    
    # 运行时状态
    connected: bool = False
    tools: List[MCPTool] = field(default_factory=list)
    last_ping: Optional[datetime] = None


@dataclass
class ToolCallResult:
    """工具调用结果"""
    success: bool
    data: Any = None
    error: Optional[str] = None
    latency_ms: int = 0
    tool_name: str = ""
    server_id: str = ""


# ───────────────────────────────────────────────────────────────────────────────
# MCP Tool Bus
# ───────────────────────────────────────────────────────────────────────────────

class MCPToolBus:
    """
    MCP 工具总线 - 万用工具接口
    
    使用方式：
        bus = MCPToolBus()
        
        # 添加 MCP 服务器
        await bus.add_server({
            "server_id": "slack",
            "name": "Slack MCP",
            "url": "http://localhost:3001/sse",
        })
        
        # 调用工具
        result = await bus.call_tool("slack", "send_message", {
            "channel": "#general",
            "text": "Hello from MaoAI"
        })
        
        # 列出所有可用工具
        tools = bus.list_all_tools()
    """
    
    def __init__(self):
        self.servers: Dict[str, MCPServer] = {}
        self.local_tools: Dict[str, Callable] = {}
        self.call_history: List[Dict] = []
    
    # ───────────────────────────────────────────────────────────────────────────
    # 服务器管理
    # ───────────────────────────────────────────────────────────────────────────
    
    async def add_server(self, config: Dict[str, Any]) -> bool:
        """添加 MCP 服务器"""
        server_id = config.get("server_id")
        if not server_id:
            return False
        
        server = MCPServer(
            server_id=server_id,
            name=config.get("name", server_id),
            url=config.get("url", ""),
            transport=config.get("transport", "sse"),
            headers=config.get("headers", {}),
        )
        
        self.servers[server_id] = server
        
        # 尝试连接并发现工具
        await self._connect_server(server)
        
        return True
    
    async def remove_server(self, server_id: str) -> bool:
        """移除 MCP 服务器"""
        if server_id not in self.servers:
            return False
        
        server = self.servers[server_id]
        server.connected = False
        del self.servers[server_id]
        
        return True
    
    async def _connect_server(self, server: MCPServer):
        """连接服务器并发现工具"""
        try:
            if server.transport == "sse":
                await self._discover_tools_sse(server)
            elif server.transport == "http":
                await self._discover_tools_http(server)
            
            server.connected = True
            server.last_ping = datetime.now()
            
        except Exception as e:
            server.connected = False
            print(f"Failed to connect MCP server {server.server_id}: {e}")
    
    async def _discover_tools_sse(self, server: MCPServer):
        """通过 SSE 发现工具"""
        # 发送初始化请求
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{server.url}/initialize",
                headers={"Content-Type": "application/json"},
                json={"jsonrpc": "2.0", "method": "initialize", "id": 1},
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    # 解析工具列表
                    if "result" in data and "tools" in data["result"]:
                        server.tools = [
                            MCPTool(
                                name=tool["name"],
                                description=tool.get("description", ""),
                                parameters=tool.get("parameters", {}),
                                server_id=server.server_id,
                            )
                            for tool in data["result"]["tools"]
                        ]
    
    async def _discover_tools_http(self, server: MCPServer):
        """通过 HTTP 发现工具"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{server.url}/tools",
                headers=server.headers,
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    server.tools = [
                        MCPTool(
                            name=tool["name"],
                            description=tool.get("description", ""),
                            parameters=tool.get("parameters", {}),
                            server_id=server.server_id,
                        )
                        for tool in data.get("tools", [])
                    ]
    
    async def health_check(self, server_id: str) -> bool:
        """检查服务器健康状态"""
        if server_id not in self.servers:
            return False
        
        server = self.servers[server_id]
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{server.url}/health",
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as response:
                    healthy = response.status == 200
                    server.connected = healthy
                    if healthy:
                        server.last_ping = datetime.now()
                    return healthy
        except:
            server.connected = False
            return False
    
    # ───────────────────────────────────────────────────────────────────────────
    # 本地工具注册
    # ───────────────────────────────────────────────────────────────────────────
    
    def register_local_tool(
        self,
        name: str,
        handler: Callable,
        description: str = "",
        parameters: Dict[str, Any] = None,
    ):
        """注册本地工具"""
        self.local_tools[name] = {
            "handler": handler,
            "description": description,
            "parameters": parameters or {},
        }
    
    def unregister_local_tool(self, name: str) -> bool:
        """注销本地工具"""
        if name in self.local_tools:
            del self.local_tools[name]
            return True
        return False
    
    # ───────────────────────────────────────────────────────────────────────────
    # 工具调用
    # ───────────────────────────────────────────────────────────────────────────
    
    async def call_tool(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        server_id: Optional[str] = None,
    ) -> ToolCallResult:
        """
        调用工具
        
        Args:
            tool_name: 工具名称
            parameters: 工具参数
            server_id: 指定服务器（可选）
        """
        import time
        start_time = time.time()
        
        # 查找工具
        tool, server = self._find_tool(tool_name, server_id)
        
        if not tool:
            return ToolCallResult(
                success=False,
                error=f"Tool not found: {tool_name}",
                tool_name=tool_name,
            )
        
        try:
            if server:
                # MCP 服务器工具
                result = await self._call_mcp_tool(tool, server, parameters)
            else:
                # 本地工具
                result = await self._call_local_tool(tool_name, parameters)
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            # 更新统计
            tool.call_count += 1
            if result.success:
                tool.success_count += 1
            tool.avg_latency_ms = (
                tool.avg_latency_ms * (tool.call_count - 1) + latency_ms
            ) / tool.call_count
            
            result.latency_ms = latency_ms
            result.tool_name = tool_name
            result.server_id = server.server_id if server else "local"
            
            # 记录历史
            self.call_history.append({
                "tool_name": tool_name,
                "server_id": server.server_id if server else "local",
                "success": result.success,
                "latency_ms": latency_ms,
                "timestamp": datetime.now().isoformat(),
            })
            
            return result
            
        except Exception as e:
            return ToolCallResult(
                success=False,
                error=str(e),
                latency_ms=int((time.time() - start_time) * 1000),
                tool_name=tool_name,
                server_id=server.server_id if server else "local",
            )
    
    def _find_tool(
        self,
        tool_name: str,
        server_id: Optional[str] = None,
    ) -> tuple:
        """查找工具"""
        if server_id:
            # 在指定服务器查找
            if server_id in self.servers:
                server = self.servers[server_id]
                for tool in server.tools:
                    if tool.name == tool_name:
                        return tool, server
        else:
            # 在所有服务器查找
            for server in self.servers.values():
                for tool in server.tools:
                    if tool.name == tool_name:
                        return tool, server
            
            # 检查本地工具
            if tool_name in self.local_tools:
                return None, None
        
        return None, None
    
    async def _call_mcp_tool(
        self,
        tool: MCPTool,
        server: MCPServer,
        parameters: Dict[str, Any],
    ) -> ToolCallResult:
        """调用 MCP 工具"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{server.url}/tools/call",
                headers={"Content-Type": "application/json", **server.headers},
                json={
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": tool.name,
                        "arguments": parameters,
                    },
                    "id": 1,
                },
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if "error" in data:
                        return ToolCallResult(
                            success=False,
                            error=data["error"].get("message", "Unknown error"),
                        )
                    
                    return ToolCallResult(
                        success=True,
                        data=data.get("result", {}),
                    )
                else:
                    return ToolCallResult(
                        success=False,
                        error=f"HTTP {response.status}",
                    )
    
    async def _call_local_tool(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
    ) -> ToolCallResult:
        """调用本地工具"""
        if tool_name not in self.local_tools:
            return ToolCallResult(success=False, error=f"Local tool not found: {tool_name}")
        
        tool_def = self.local_tools[tool_name]
        handler = tool_def["handler"]
        
        try:
            if asyncio.iscoroutinefunction(handler):
                result = await handler(**parameters)
            else:
                result = handler(**parameters)
            
            return ToolCallResult(success=True, data=result)
        except Exception as e:
            return ToolCallResult(success=False, error=str(e))
    
    # ───────────────────────────────────────────────────────────────────────────
    # 查询与发现
    # ───────────────────────────────────────────────────────────────────────────
    
    def list_all_tools(self) -> List[Dict]:
        """列出所有可用工具"""
        tools = []
        
        # MCP 服务器工具
        for server in self.servers.values():
            for tool in server.tools:
                tools.append({
                    "name": tool.name,
                    "description": tool.description,
                    "server_id": tool.server_id,
                    "source": "mcp",
                    "status": tool.status.value,
                    "call_count": tool.call_count,
                    "success_rate": tool.success_count / tool.call_count if tool.call_count > 0 else 1.0,
                })
        
        # 本地工具
        for name, tool_def in self.local_tools.items():
            tools.append({
                "name": name,
                "description": tool_def.get("description", ""),
                "server_id": "local",
                "source": "local",
                "status": "available",
            })
        
        return tools
    
    def find_tools(self, capability: str) -> List[Dict]:
        """根据能力描述查找工具"""
        all_tools = self.list_all_tools()
        
        matches = []
        for tool in all_tools:
            if capability.lower() in tool["name"].lower():
                matches.append(tool)
            elif capability.lower() in tool["description"].lower():
                matches.append(tool)
        
        return matches
    
    def get_tool_schema(self, tool_name: str) -> Optional[Dict]:
        """获取工具参数模式"""
        # 查找 MCP 工具
        for server in self.servers.values():
            for tool in server.tools:
                if tool.name == tool_name:
                    return {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.parameters,
                    }
        
        # 查找本地工具
        if tool_name in self.local_tools:
            tool_def = self.local_tools[tool_name]
            return {
                "name": tool_name,
                "description": tool_def.get("description", ""),
                "parameters": tool_def.get("parameters", {}),
            }
        
        return None
    
    # ───────────────────────────────────────────────────────────────────────────
    # 统计
    # ───────────────────────────────────────────────────────────────────────────
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        return {
            "mcp_servers": len(self.servers),
            "connected_servers": sum(1 for s in self.servers.values() if s.connected),
            "mcp_tools": sum(len(s.tools) for s in self.servers.values()),
            "local_tools": len(self.local_tools),
            "total_calls": len(self.call_history),
            "recent_calls": self.call_history[-10:],
        }


# ───────────────────────────────────────────────────────────────────────────────
# 快捷函数
# ───────────────────────────────────────────────────────────────────────────────

_bus: Optional[MCPToolBus] = None


def get_tool_bus() -> MCPToolBus:
    """获取全局 Tool Bus"""
    global _bus
    if _bus is None:
        _bus = MCPToolBus()
    return _bus


# ───────────────────────────────────────────────────────────────────────────────
# 测试
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test_tool_bus():
        """测试 Tool Bus"""
        bus = MCPToolBus()
        
        # 注册本地工具
        async def echo_tool(message: str) -> str:
            return f"Echo: {message}"
        
        bus.register_local_tool(
            name="echo",
            handler=echo_tool,
            description="Echo a message",
            parameters={
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                },
            },
        )
        
        # 调用本地工具
        result = await bus.call_tool("echo", {"message": "Hello MCP"})
        print(f"调用结果: {result}")
        
        # 列出工具
        tools = bus.list_all_tools()
        print(f"可用工具: {json.dumps(tools, indent=2)}")
        
        # 统计
        print(f"统计: {json.dumps(bus.get_stats(), indent=2)}")
    
    asyncio.run(test_tool_bus())
