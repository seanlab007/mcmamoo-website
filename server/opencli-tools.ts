import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execFileAsync = promisify(execFile);

const DEFAULT_OPENCLI_ROOT = process.env.OPENCLI_ROOT || "/Users/mac/Desktop/opencli";
const DEFAULT_OPENCLI_ENTRY = process.env.OPENCLI_ENTRY || path.join(DEFAULT_OPENCLI_ROOT, "dist", "main.js");
const DEFAULT_TIMEOUT_MS = Math.min(Number(process.env.OPENCLI_TIMEOUT_MS || 30000), 120000);
const DEFAULT_OPENCLI_DAEMON_PORT = Math.max(Number(process.env.OPENCLI_DAEMON_PORT || 19825), 1);
const DEFAULT_OPENCLI_MCP_URL = process.env.OPENCLI_MCP_URL || `http://127.0.0.1:${DEFAULT_OPENCLI_DAEMON_PORT}/mcp`;
const DEFAULT_OPENCLI_MCP_PROTOCOL_VERSION = process.env.OPENCLI_MCP_PROTOCOL_VERSION || "2025-03-26";
const OPENCLI_MCP_ENABLED = process.env.OPENCLI_MCP_ENABLED !== "0";
const MAX_OUTPUT_CHARS = 12000;

let mcpInitializationPromise: Promise<void> | null = null;
let mcpRequestSequence = 0;

export interface OpencliResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, any>;
}

interface OpencliManifestItem {
  command: string;
  site?: string;
  name?: string;
  description?: string;
  strategy?: string;
  browser?: boolean;
  domain?: string;
  args?: Array<{
    name: string;
    type?: string;
    required?: boolean;
    help?: string;
    default?: string | number | boolean | null;
  }>;
}

function truncate(text: string, maxChars: number = MAX_OUTPUT_CHARS): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n...(已截断，共 ${text.length} 字符)`;
}

function getOpencliRoot(): string {
  return process.env.OPENCLI_ROOT || DEFAULT_OPENCLI_ROOT;
}

function getOpencliEntry(): string {
  return process.env.OPENCLI_ENTRY || DEFAULT_OPENCLI_ENTRY;
}

async function assertOpencliReady(): Promise<{ root: string; entry: string }> {
  const root = getOpencliRoot();
  const entry = getOpencliEntry();

  try {
    await fs.access(entry);
    return { root, entry };
  } catch {
    throw new Error(
      `未找到 OpenCLI 可执行入口: ${entry}。请先在 ${root} 执行 npm install && npm run build，或通过 OPENCLI_ENTRY 指向已构建的 dist/main.js。`
    );
  }
}

function normalizeArgs(args?: string[]): string[] {
  if (!Array.isArray(args)) return [];
  return args
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 40);
}

function normalizeTarget(target: string): string[] {
  const tokens = String(target || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10);

  if (tokens.length === 0) {
    throw new Error("target 不能为空，例如 '36kr hot'、'boss jobs'、'wikipedia search'");
  }

  return tokens;
}

async function runOpencli(args: string[]): Promise<{ stdout: string; stderr: string; entry: string; root: string }> {
  const { root, entry } = await assertOpencliReady();
  const result = await execFileAsync(process.execPath, [entry, ...args], {
    cwd: root,
    timeout: DEFAULT_TIMEOUT_MS,
    maxBuffer: 1024 * 1024 * 4,
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      NO_COLOR: "1",
    },
  });

  return {
    stdout: result.stdout?.trim() || "",
    stderr: result.stderr?.trim() || "",
    entry,
    root,
  };
}

async function loadManifest(): Promise<OpencliManifestItem[]> {
  const { root } = await assertOpencliReady();
  const manifestPath = path.join(root, "dist", "cli-manifest.json");
  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw) as OpencliManifestItem[];
  return Array.isArray(manifest) ? manifest : [];
}

function formatManifestItems(items: OpencliManifestItem[]): string {
  return items
    .map((item, index) => {
      const argsSummary = (item.args || [])
        .slice(0, 5)
        .map((arg) => `${arg.required ? "*" : ""}${arg.name}${arg.type ? `:${arg.type}` : ""}`)
        .join(", ");

      return [
        `${index + 1}. ${item.command}`,
        item.description ? `   ${item.description}` : null,
        `   strategy=${item.strategy || "unknown"} | browser=${item.browser ? "yes" : "no"}${item.domain ? ` | domain=${item.domain}` : ""}`,
        argsSummary ? `   args: ${argsSummary}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function createMcpRequest(method: string, params?: Record<string, any>, includeId: boolean = true) {
  const payload: Record<string, any> = {
    jsonrpc: "2.0",
    method,
  };

  if (params && Object.keys(params).length > 0) {
    payload.params = params;
  }

  if (includeId) {
    payload.id = `maoai-opencli-${Date.now()}-${++mcpRequestSequence}`;
  }

  return payload;
}

async function postToOpencliMcp(payload: Record<string, any>, expectJson: boolean = true): Promise<any> {
  if (!OPENCLI_MCP_ENABLED) {
    throw new Error("OPENCLI_MCP_ENABLED=0，已禁用 OpenCLI MCP 传输");
  }

  const response = await fetch(DEFAULT_OPENCLI_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-OpenCLI": "maoai-mcp-client",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS + 2000),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`OpenCLI MCP HTTP ${response.status}: ${rawText || response.statusText}`);
  }

  if (!expectJson || !rawText.trim()) {
    return null;
  }

  const json = JSON.parse(rawText);
  if (json?.error) {
    throw new Error(json.error.message || JSON.stringify(json.error));
  }

  return json?.result;
}

async function ensureMcpInitialized(): Promise<void> {
  if (!OPENCLI_MCP_ENABLED) return;
  if (mcpInitializationPromise) return mcpInitializationPromise;

  mcpInitializationPromise = (async () => {
    await postToOpencliMcp(
      createMcpRequest("initialize", {
        protocolVersion: DEFAULT_OPENCLI_MCP_PROTOCOL_VERSION,
        clientInfo: {
          name: "maoai-opencli-client",
          version: "1.0.0",
        },
        capabilities: {},
      })
    );

    await postToOpencliMcp(
      createMcpRequest("notifications/initialized", {}, false),
      false
    );
  })().catch((error) => {
    mcpInitializationPromise = null;
    throw error;
  });

  return mcpInitializationPromise;
}

function extractMcpToolResult(payload: any): OpencliResult {
  const structured = payload?.structuredContent;
  const contentText = Array.isArray(payload?.content)
    ? payload.content
        .filter((block: any) => block?.type === "text" && typeof block?.text === "string")
        .map((block: any) => block.text)
        .join("\n\n")
    : "";

  if (structured && typeof structured === "object") {
    return {
      success: Boolean(structured.success ?? !payload?.isError),
      output: String(structured.output ?? contentText ?? ""),
      error: structured.error ? String(structured.error) : undefined,
      metadata: {
        ...(structured.metadata || {}),
        transport: "mcp",
        mcpUrl: DEFAULT_OPENCLI_MCP_URL,
      },
    };
  }

  return {
    success: !payload?.isError,
    output: contentText || "",
    metadata: {
      transport: "mcp",
      mcpUrl: DEFAULT_OPENCLI_MCP_URL,
    },
  };
}

async function callOpencliToolViaMcp(toolName: string, toolArgs: Record<string, any>): Promise<OpencliResult> {
  await ensureMcpInitialized();
  const result = await postToOpencliMcp(
    createMcpRequest("tools/call", {
      name: toolName,
      arguments: toolArgs,
    })
  );
  return extractMcpToolResult(result);
}

async function callOpencliToolWithFallback(
  toolName: string,
  toolArgs: Record<string, any>,
  localExecutor: () => Promise<OpencliResult>
): Promise<OpencliResult> {
  let mcpError: Error | null = null;

  if (OPENCLI_MCP_ENABLED) {
    try {
      return await callOpencliToolViaMcp(toolName, toolArgs);
    } catch (error) {
      mcpError = error instanceof Error ? error : new Error(String(error));
    }
  }

  const fallbackResult = await localExecutor();
  fallbackResult.metadata = {
    ...(fallbackResult.metadata || {}),
    transport: "local-cli",
    ...(mcpError ? { mcpFallbackReason: mcpError.message, mcpUrl: DEFAULT_OPENCLI_MCP_URL } : {}),
  };

  if (!fallbackResult.success && mcpError) {
    fallbackResult.error = `MCP 调用失败：${mcpError.message}；本地 CLI 回退也失败：${fallbackResult.error || "未知错误"}`;
  }

  return fallbackResult;
}

async function toolOpencliCatalogLocal(params: {
  keyword?: string;
  site?: string;
  limit?: number;
}): Promise<OpencliResult> {
  try {
    const keyword = String(params.keyword || "").trim().toLowerCase();
    const site = String(params.site || "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(params.limit || 20), 1), 100);

    const manifest = await loadManifest();
    const filtered = manifest.filter((item) => {
      const command = item.command?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";
      const itemSite = item.site?.toLowerCase() || "";

      if (site && itemSite !== site) return false;
      if (!keyword) return true;
      return command.includes(keyword) || description.includes(keyword) || itemSite.includes(keyword);
    });

    const selected = filtered.slice(0, limit);
    const output = selected.length
      ? formatManifestItems(selected)
      : "未找到匹配的 OpenCLI 命令。";

    return {
      success: true,
      output,
      metadata: {
        totalMatches: filtered.length,
        returned: selected.length,
        site: site || undefined,
        keyword: keyword || undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function toolOpencliRunLocal(params: {
  target: string;
  args?: string[];
  format?: "json" | "yaml" | "md" | "csv" | "table" | "plain";
}): Promise<OpencliResult> {
  try {
    const targetTokens = normalizeTarget(params.target);
    const passthroughArgs = normalizeArgs(params.args);
    const format = params.format || "json";

    const cliArgs = [...targetTokens, ...passthroughArgs];
    if (!cliArgs.includes("-f") && !cliArgs.includes("--format")) {
      cliArgs.push("-f", format);
    }

    const { stdout, stderr, entry, root } = await runOpencli(cliArgs);
    const rawOutput = stdout || stderr || "(无输出)";

    let output = rawOutput;
    let parsed: unknown;
    if (format === "json" && rawOutput) {
      try {
        parsed = JSON.parse(rawOutput);
        output = truncate(JSON.stringify(parsed, null, 2));
      } catch {
        output = truncate(rawOutput);
      }
    } else {
      output = truncate(rawOutput);
    }

    return {
      success: true,
      output,
      metadata: {
        target: params.target,
        args: passthroughArgs,
        format,
        opencliRoot: root,
        opencliEntry: entry,
        parsedJson: parsed ? true : false,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      output: truncate(error?.stdout || ""),
      error: truncate(error?.stderr || error?.message || String(error)),
      metadata: {
        target: params.target,
        args: params.args || [],
        format: params.format || "json",
      },
    };
  }
}

export async function toolOpencliCatalog(params: {
  keyword?: string;
  site?: string;
  limit?: number;
}): Promise<OpencliResult> {
  return callOpencliToolWithFallback("opencli_catalog", params, () => toolOpencliCatalogLocal(params));
}

export async function toolOpencliRun(params: {
  target?: string;
  args?: string[];
  format?: "json" | "yaml" | "md" | "csv" | "table" | "plain";
}): Promise<OpencliResult> {
  return callOpencliToolWithFallback("opencli_run", params, () => toolOpencliRunLocal(params));
}

export const OPENCLI_TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "opencli_catalog",
      description: "检索本机 OpenCLI 已安装的站点命令清单。优先通过 MCP 调用 daemon，失败时自动回退到本地 CLI。",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "可选，按站点名、命令名或描述关键词筛选，例如 'boss'、'zhihu'、'search'。",
          },
          site: {
            type: "string",
            description: "可选，限定具体站点，例如 'boss'、'zhihu'、'weixin'。",
          },
          limit: {
            type: "number",
            description: "返回数量上限，默认 20，最大 100。",
            default: 20,
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "opencli_run",
      description: "调用本机 OpenCLI 执行具体站点命令。优先通过 MCP 调用 daemon，失败时自动回退到本地 CLI。target 填完整子命令，例如 '36kr hot'、'boss jobs'、'wikipedia search'。",
      parameters: {
        type: "object",
        properties: {
          target: {
            type: "string",
            description: "完整子命令，例如 '36kr hot'、'wikipedia search'、'zhihu hot'。",
          },
          args: {
            type: "array",
            items: {
              type: "string",
            },
            description: "额外 CLI 参数数组，例如 ['--limit', '5']、['--query', 'OpenAI']。",
          },
          format: {
            type: "string",
            enum: ["json", "yaml", "md", "csv", "table", "plain"],
            description: "输出格式，默认 json。",
            default: "json",
          },
        },
        required: ["target"],
      },
    },
  },
] as const;

export async function executeOpencliTool(
  toolName: string,
  toolArgs: Record<string, any>
): Promise<OpencliResult> {
  switch (toolName) {
    case "opencli_catalog":
      return toolOpencliCatalog(toolArgs);
    case "opencli_run":
      return toolOpencliRun(toolArgs);
    default:
      return {
        success: false,
        output: "",
        error: `未知 OpenCLI 工具: ${toolName}`,
      };
  }
}
