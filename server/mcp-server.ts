/**
 * MaoAI MCP Server — HTTP SSE Transport
 *
 * 让 MaoAI 作为 MCP 服务器，通过 HTTP SSE 协议向外部 AI Agent 暴露工具。
 *
 * 端点:
 *   POST /api/mcp           — 接收 JSON-RPC 请求并返回响应
 *   GET  /api/mcp/sse       — SSE 长连接（实时通知 / 流式返回）
 *   GET  /api/mcp/manifest  — 返回工具清单（JSON）
 *
 * 支持的 MCP 方法:
 *   initialize              — 协议握手
 *   notifications/initialized
 *   tools/list              — 列出所有可用工具
 *   tools/call              — 调用工具
 *   resources/list          — 资源列表（暂时为空）
 *   prompts/list            — Prompt 模板列表（暂时为空）
 *
 * 协议版本: MCP 2025-03-26
 */

import { Router, Request, Response } from "express";
import { TOOL_DEFINITIONS, ADMIN_TOOL_DEFINITIONS, executeTool } from "./tools";

export const mcpServerRouter = Router();

const MCP_PROTOCOL_VERSION = "2025-03-26";
const SERVER_INFO = {
  name: "maoai-mcp-server",
  version: "1.0.0",
  description: "MaoAI 多模型 AI 平台 - MCP 工具服务器",
};

// ─── SSE 客户端管理 ─────────────────────────────────────────────────────────────

const sseClients = new Map<string, Response>();

function sendSseEvent(clientId: string, event: string, data: unknown) {
  const res = sseClients.get(clientId);
  if (!res) return;
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    sseClients.delete(clientId);
  }
}

// ─── JSON-RPC 工具 ──────────────────────────────────────────────────────────────

function jsonRpcSuccess(id: string | number | null, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: string | number | null, code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

// ─── 工具定义转换 ─────────────────────────────────────────────────────────────────
// 将 OpenAI function_call 格式转为 MCP 工具格式

function toMcpTools(defs: readonly any[]) {
  return defs.map((def) => {
    const fn = def.function || def;
    return {
      name: fn.name,
      description: fn.description || "",
      inputSchema: fn.parameters || { type: "object", properties: {} },
    };
  });
}

// ─── 请求处理 ──────────────────────────────────────────────────────────────────

async function handleMcpRequest(
  method: string,
  params: Record<string, any>,
  id: string | number | null,
  isAdmin: boolean
): Promise<unknown> {
  switch (method) {
    case "initialize": {
      return {
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: SERVER_INFO,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false },
          prompts: { listChanged: false },
        },
      };
    }

    case "notifications/initialized":
      return null;

    case "tools/list": {
      const baseDefs = TOOL_DEFINITIONS as readonly any[];
      const adminDefs = isAdmin ? (ADMIN_TOOL_DEFINITIONS as readonly any[]) : [];
      const allDefs = [...baseDefs, ...adminDefs];
      return {
        tools: toMcpTools(allDefs),
      };
    }

    case "tools/call": {
      const toolName = String(params?.name || "");
      const toolArgs = (params?.arguments as Record<string, any>) || {};

      if (!toolName) {
        throw { code: -32602, message: "params.name is required" };
      }

      const result = await executeTool(toolName, toolArgs, isAdmin);

      // 将工具返回值格式化为 MCP content blocks
      let text: string;
      if (typeof result === "string") {
        text = result;
      } else if (result && typeof result === "object" && "output" in result) {
        const r = result as any;
        text = r.output || "";
        if (!r.success && r.error) {
          text = `Error: ${r.error}${text ? `\n\n${text}` : ""}`;
        }
      } else {
        text = JSON.stringify(result, null, 2);
      }

      const isError = result && typeof result === "object" && "success" in result
        ? !(result as any).success
        : false;

      return {
        content: [{ type: "text", text }],
        isError,
        structuredContent: result,
      };
    }

    case "resources/list":
      return { resources: [] };

    case "prompts/list":
      return { prompts: [] };

    default:
      throw { code: -32601, message: `Method not found: ${method}` };
  }
}

// ─── SSE 端点 ─────────────────────────────────────────────────────────────────

mcpServerRouter.get("/sse", (req: Request, res: Response) => {
  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-MCP-Protocol-Version", MCP_PROTOCOL_VERSION);
  res.flushHeaders();

  sseClients.set(clientId, res);

  // 发送连接成功事件
  sendSseEvent(clientId, "connected", {
    clientId,
    serverInfo: SERVER_INFO,
    protocolVersion: MCP_PROTOCOL_VERSION,
  });

  // 心跳
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(clientId);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
});

// ─── 主端点 (JSON-RPC over HTTP) ─────────────────────────────────────────────

mcpServerRouter.post("/", async (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-MCP-Protocol-Version", MCP_PROTOCOL_VERSION);

  const body = req.body as any;

  // 批量请求支持
  const requests = Array.isArray(body) ? body : [body];
  const responses: unknown[] = [];

  // 简单 admin 检测（生产环境应通过认证中间件）
  const isAdmin = req.headers["x-maoai-admin"] === process.env.MCP_ADMIN_SECRET;

  for (const request of requests) {
    const { jsonrpc, method, params, id } = request || {};

    if (jsonrpc !== "2.0") {
      responses.push(jsonRpcError(id ?? null, -32600, "Invalid Request: jsonrpc must be '2.0'"));
      continue;
    }

    if (!method) {
      responses.push(jsonRpcError(id ?? null, -32600, "Invalid Request: method is required"));
      continue;
    }

    try {
      const result = await handleMcpRequest(method, params || {}, id ?? null, isAdmin);

      // notifications 不需要响应（无 id）
      if (id !== undefined && id !== null) {
        responses.push(jsonRpcSuccess(id, result));
      }
    } catch (err: any) {
      if (err?.code && err?.message) {
        responses.push(jsonRpcError(id ?? null, err.code, err.message, err.data));
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        responses.push(jsonRpcError(id ?? null, -32603, `Internal error: ${msg}`));
      }
    }
  }

  if (responses.length === 0) {
    // 全是 notification，返回 204
    res.status(204).end();
  } else if (responses.length === 1 && !Array.isArray(body)) {
    res.json(responses[0]);
  } else {
    res.json(responses);
  }
});

// ─── OPTIONS 预检 ─────────────────────────────────────────────────────────────

mcpServerRouter.options("/", (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-MaoAI-Admin");
  res.status(204).end();
});

// ─── 工具清单（便于调试）────────────────────────────────────────────────────────

mcpServerRouter.get("/manifest", (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const isAdmin = req.headers["x-maoai-admin"] === process.env.MCP_ADMIN_SECRET;
  const baseDefs = TOOL_DEFINITIONS as readonly any[];
  const adminDefs = isAdmin ? (ADMIN_TOOL_DEFINITIONS as readonly any[]) : [];
  res.json({
    serverInfo: SERVER_INFO,
    protocolVersion: MCP_PROTOCOL_VERSION,
    toolCount: baseDefs.length + adminDefs.length,
    tools: toMcpTools([...baseDefs, ...adminDefs]),
    endpoints: {
      jsonrpc: "POST /api/mcp",
      sse: "GET /api/mcp/sse",
      manifest: "GET /api/mcp/manifest",
    },
  });
});
