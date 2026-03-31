/**
 * MaoAI Tool Calling Engine
 * 工具注册系统和执行引擎
 *
 * 原生工具：
 * 1. web_search       — 联网搜索（Tavily API，有免费额度）
 * 2. run_code         — 执行 Python/JS 代码（Railway 服务器沙箱）
 * 3. github_push      — 推送文件到 GitHub 仓库
 * 4. github_read      — 读取 GitHub 仓库文件
 * 5. read_url         — 读取网页内容
 * 6. deep_research    — 深度研究（DeerFlow 多智能体框架，需部署 DeerFlow）
 * 7. run_shell        — 执行 Shell 命令（仅管理员）
 *
 * OpenClaw Skills（拆解自 seanlab007/open-claw）：
 * 8.  openclaw_weather  — 天气查询（wttr.in，无需 API Key）
 * 9.  openclaw_github   — GitHub PR/Issue/CI 查询
 * 10. openclaw_summarize — URL/网页内容摘要
 * 11. openclaw_memory   — 用户持久化记忆读写
 * 12. openclaw_canvas   — HTML 数据可视化生成
 * 13. openclaw_agent    — 通过 OpenClaw Gateway 调用专业 Agent
 * 14. openclaw_shell    — Shell 执行（仅管理员，通过 OpenClaw Skills）
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  OPENCLAW_TOOL_DEFINITIONS,
  executeOpenclawTool,
} from "./openclaw-skills";

const execAsync = promisify(exec);

// ─── Tool Definitions (OpenAI function_call format) ───────────────────────────

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "搜索互联网获取最新信息。当用户询问最新新闻、当前事件、实时数据或需要查找具体信息时使用。",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "搜索查询词，尽量简洁精准"
          },
          max_results: {
            type: "number",
            description: "返回结果数量，默认5，最多10",
            default: 5
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_code",
      description: "在服务器沙箱中执行代码并返回结果。支持 Python 和 JavaScript。当用户需要计算、数据处理、生成文件时使用。",
      parameters: {
        type: "object",
        properties: {
          language: {
            type: "string",
            enum: ["python", "javascript"],
            description: "编程语言"
          },
          code: {
            type: "string",
            description: "要执行的代码"
          },
          timeout: {
            type: "number",
            description: "超时时间（秒），默认30，最大120",
            default: 30
          }
        },
        required: ["language", "code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "github_push",
      description: "将文件推送到 GitHub 仓库。当用户要求部署代码、更新文件、提交到 GitHub 时使用。",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "仓库名称，格式：owner/repo，例如 seanlab007/mcmamoo-website"
          },
          files: {
            type: "array",
            description: "要推送的文件列表",
            items: {
              type: "object",
              properties: {
                path: { type: "string", description: "文件在仓库中的路径" },
                content: { type: "string", description: "文件内容" }
              },
              required: ["path", "content"]
            }
          },
          message: {
            type: "string",
            description: "commit 提交信息"
          },
          branch: {
            type: "string",
            description: "目标分支，默认 main",
            default: "main"
          }
        },
        required: ["repo", "files", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "github_read",
      description: "读取 GitHub 仓库中的文件内容。当用户需要查看仓库代码或文件时使用。",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "仓库名称，格式：owner/repo"
          },
          file_path: {
            type: "string",
            description: "文件在仓库中的路径"
          },
          branch: {
            type: "string",
            description: "分支名，默认 main",
            default: "main"
          }
        },
        required: ["repo", "file_path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_url",
      description: "读取网页内容。当用户提供了一个 URL 并要求分析或总结其内容时使用。",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "要读取的网页 URL"
          },
          extract_text_only: {
            type: "boolean",
            description: "是否只提取纯文本（去除 HTML 标签），默认 true",
            default: true
          }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deep_research",
      description: "使用 DeerFlow 多智能体框架进行深度研究。适合复杂问题调查、市场分析、技术研究、竞品分析、行业调研等需要多步骤推理和综合的任务。DeerFlow 会自动规划研究步骤、搜索信息、生成结构化报告。",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "研究问题或主题，尽量详细描述研究范围和目标"
          },
          mode: {
            type: "string",
            enum: ["flash", "standard", "pro", "ultra"],
            description: "研究模式：flash(快速)，standard(标准，含推理)，pro(深度研究，含规划，推荐)，ultra(终极，含子智能体协作)",
            default: "pro"
          },
          max_duration: {
            type: "number",
            description: "最大研究时长（秒），默认300（5分钟），ultra模式建议600+",
            default: 300
          }
        },
        required: ["query"]
      }
    }
  }
];

// ─── 合并 OpenClaw Skills 到工具列表 ──────────────────────────────────────────
// OpenClaw Skills 对普通用户和管理员都开放（openclaw_shell 除外，在 executor 中鉴权）
(TOOL_DEFINITIONS as any[]).push(...(OPENCLAW_TOOL_DEFINITIONS as any[]));

// Admin-only tools (不暴露给普通用户)
export const ADMIN_TOOL_DEFINITIONS = [
  ...TOOL_DEFINITIONS,
  {
    type: "function",
    function: {
      name: "run_shell",
      description: "在服务器上执行 Shell 命令。仅管理员可用。",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "要执行的 Shell 命令"
          },
          cwd: {
            type: "string",
            description: "工作目录，默认 /tmp"
          }
        },
        required: ["command"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "openclaw_shell",
      description: "通过 OpenClaw Skills 执行 Shell 命令（管理员专用）。",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell 命令" },
          cwd: { type: "string", description: "工作目录" },
        },
        required: ["command"],
      },
    },
  },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * 执行工具调用
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  isAdmin: boolean = false
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "web_search":
        return await toolWebSearch(args.query, args.max_results || 5);
      case "run_code":
        return await toolRunCode(args.language, args.code, args.timeout || 30);
      case "github_push":
        return await toolGithubPush(args.repo, args.files, args.message, args.branch || "main");
      case "github_read":
        return await toolGithubRead(args.repo, args.file_path, args.branch || "main");
      case "read_url":
        return await toolReadUrl(args.url, args.extract_text_only !== false);
      case "deep_research":
        return await toolDeepResearch(args.query, args.mode || "pro", args.max_duration || 300);
      case "run_shell":
        if (!isAdmin) return { success: false, output: "", error: "run_shell 仅管理员可用" };
        return await toolRunShell(args.command, args.cwd || "/tmp");
      default:
        // ─── 路由到 OpenClaw Skills ───────────────────────────────────────
        if (toolName.startsWith("openclaw_")) {
          return await executeOpenclawTool(toolName, args, { isAdmin });
        }
        return { success: false, output: "", error: `未知工具: ${toolName}` };
    }
  } catch (err: any) {
    return { success: false, output: "", error: `工具执行异常: ${err.message}` };
  }
}

// ─── Tool Implementations ─────────────────────────────────────────────────────

async function toolWebSearch(query: string, maxResults: number): Promise<ToolResult> {
  const tavilyKey = process.env.TAVILY_API_KEY;

  // Fallback: use DuckDuckGo Instant Answer API (no key needed)
  if (!tavilyKey) {
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const resp = await fetch(ddgUrl, { headers: { "User-Agent": "MaoAI/1.0" } });
      const data = await resp.json() as any;
      const parts: string[] = [];
      if (data.AbstractText) parts.push(`摘要: ${data.AbstractText}`);
      if (data.RelatedTopics?.length) {
        parts.push("相关主题:");
        data.RelatedTopics.slice(0, maxResults).forEach((t: any) => {
          if (t.Text) parts.push(`• ${t.Text}${t.FirstURL ? ` (${t.FirstURL})` : ""}`);
        });
      }
      if (parts.length === 0) parts.push("未找到直接答案，建议配置 TAVILY_API_KEY 获取更好的搜索结果。");
      return { success: true, output: parts.join("\n"), metadata: { source: "duckduckgo", query } };
    } catch (e: any) {
      return { success: false, output: "", error: `搜索失败: ${e.message}` };
    }
  }

  // Tavily API
  try {
    const resp = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        max_results: maxResults,
        search_depth: "advanced",
        include_answer: true
      })
    });
    const data = await resp.json() as any;
    const parts: string[] = [];
    if (data.answer) parts.push(`直接答案: ${data.answer}\n`);
    parts.push("搜索结果:");
    (data.results || []).forEach((r: any, i: number) => {
      parts.push(`${i + 1}. **${r.title}**`);
      parts.push(`   ${r.content?.slice(0, 300)}...`);
      parts.push(`   来源: ${r.url}`);
    });
    return { success: true, output: parts.join("\n"), metadata: { source: "tavily", query, count: data.results?.length } };
  } catch (e: any) {
    return { success: false, output: "", error: `Tavily 搜索失败: ${e.message}` };
  }
}

async function toolRunCode(language: string, code: string, timeout: number): Promise<ToolResult> {
  const safeTimeout = Math.min(timeout, 120);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "maoai-code-"));

  try {
    let filePath: string;
    let cmd: string;

    if (language === "python") {
      filePath = path.join(tmpDir, "script.py");
      await fs.writeFile(filePath, code, "utf8");
      cmd = `timeout ${safeTimeout} python3 "${filePath}" 2>&1`;
    } else if (language === "javascript") {
      filePath = path.join(tmpDir, "script.js");
      await fs.writeFile(filePath, code, "utf8");
      cmd = `timeout ${safeTimeout} node "${filePath}" 2>&1`;
    } else {
      return { success: false, output: "", error: `不支持的语言: ${language}` };
    }

    const { stdout, stderr } = await execAsync(cmd, { timeout: (safeTimeout + 5) * 1000 });
    const output = (stdout + stderr).trim();
    return {
      success: true,
      output: output || "(代码执行完成，无输出)",
      metadata: { language, lines: code.split("\n").length }
    };
  } catch (err: any) {
    const msg = err.killed ? `执行超时（${safeTimeout}秒）` : err.stdout || err.message;
    return { success: false, output: err.stdout || "", error: msg };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function toolGithubPush(
  repo: string,
  files: Array<{ path: string; content: string }>,
  message: string,
  branch: string
): Promise<ToolResult> {
  // Try multiple GitHub tokens from environment
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT;

  if (!token) {
    return {
      success: false,
      output: "",
      error: "未配置 GitHub Token。请在服务器环境变量中设置 GITHUB_TOKEN。"
    };
  }

  const results: string[] = [];
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };

  for (const file of files) {
    try {
      // Get current file SHA (needed for updates)
      let sha: string | undefined;
      const getResp = await fetch(
        `https://api.github.com/repos/${repo}/contents/${file.path}?ref=${branch}`,
        { headers }
      );
      if (getResp.ok) {
        const existing = await getResp.json() as any;
        sha = existing.sha;
      }

      // Create or update file
      const body: any = {
        message,
        content: Buffer.from(file.content, "utf8").toString("base64"),
        branch
      };
      if (sha) body.sha = sha;

      const putResp = await fetch(
        `https://api.github.com/repos/${repo}/contents/${file.path}`,
        { method: "PUT", headers, body: JSON.stringify(body) }
      );

      if (putResp.ok) {
        results.push(`✓ ${file.path}`);
      } else {
        const err = await putResp.json() as any;
        results.push(`✗ ${file.path}: ${err.message}`);
      }
    } catch (e: any) {
      results.push(`✗ ${file.path}: ${e.message}`);
    }
  }

  const allOk = results.every(r => r.startsWith("✓"));
  return {
    success: allOk,
    output: `GitHub 推送结果（${repo}@${branch}）:\n${results.join("\n")}\n\nCommit: "${message}"`,
    metadata: { repo, branch, fileCount: files.length }
  };
}

async function toolGithubRead(repo: string, filePath: string, branch: string): Promise<ToolResult> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const resp = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`,
      { headers }
    );
    if (!resp.ok) {
      const err = await resp.json() as any;
      return { success: false, output: "", error: `GitHub API 错误: ${err.message}` };
    }
    const data = await resp.json() as any;
    const content = Buffer.from(data.content, "base64").toString("utf8");
    return {
      success: true,
      output: `文件: ${filePath}（${data.size} bytes，SHA: ${data.sha.slice(0, 8)}）\n\n${content}`,
      metadata: { repo, branch, path: filePath, size: data.size }
    };
  } catch (e: any) {
    return { success: false, output: "", error: e.message };
  }
}

async function toolReadUrl(url: string, extractTextOnly: boolean): Promise<ToolResult> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MaoAI/1.0)",
        "Accept": "text/html,application/xhtml+xml,*/*"
      },
      signal: AbortSignal.timeout(15000)
    });
    if (!resp.ok) return { success: false, output: "", error: `HTTP ${resp.status}` };

    const html = await resp.text();
    if (!extractTextOnly) {
      return { success: true, output: html.slice(0, 50000), metadata: { url, length: html.length } };
    }

    // Simple HTML to text extraction
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s{3,}/g, "\n\n")
      .trim()
      .slice(0, 30000);

    return { success: true, output: text, metadata: { url, originalLength: html.length, extractedLength: text.length } };
  } catch (e: any) {
    return { success: false, output: "", error: `读取失败: ${e.message}` };
  }
}

// ─── DeerFlow Deep Research Helper ─────────────────────────────────────────

interface DeerFlowConfig {
  baseUrl: string;
  timeout: number;
}

function getDeerFlowConfig(): DeerFlowConfig {
  return {
    baseUrl: process.env.DEERFLOW_URL || process.env.DEERFLOW_BASE_URL || "http://localhost:2026",
    timeout: 300, // 5 minutes default
  };
}

/**
 * Call DeerFlow's LangGraph API to perform deep research.
 * Creates a new thread, sends the query, streams the response,
 * and returns the final AI text result.
 */
async function toolDeepResearch(
  query: string,
  mode: string = "pro",
  maxDuration: number = 300
): Promise<ToolResult> {
  const config = getDeerFlowConfig();
  const langgraphUrl = `${config.baseUrl}/api/langgraph`;
  const gatewayUrl = config.baseUrl;

  const startTime = Date.now();

  try {
    // 1. Health check
    const healthResp = await fetch(`${gatewayUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!healthResp.ok) {
      return {
        success: false,
        output: "",
        error: `DeerFlow 服务不可达 (${gatewayUrl})，HTTP ${healthResp.status}。请确认 DeerFlow 已启动（cd deer-flow && make dev）`
      };
    }

    // 2. Create thread
    const threadResp = await fetch(`${langgraphUrl}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!threadResp.ok) {
      const errText = await threadResp.text();
      return { success: false, output: "", error: `创建 DeerFlow 线程失败: ${errText}` };
    }
    const threadData = await threadResp.json() as any;
    const threadId: string = threadData.thread_id;

    // 3. Build context based on mode
    const modeConfig: Record<string, { thinking: boolean; plan: boolean; subagent: boolean }> = {
      flash:    { thinking: false, plan: false, subagent: false },
      standard: { thinking: true,  plan: false, subagent: false },
      pro:      { thinking: true,  plan: true,  subagent: false },
      ultra:    { thinking: true,  plan: true,  subagent: true  },
    };
    const mc = modeConfig[mode] || modeConfig.pro;

    // 4. Stream the run
    const escapedQuery = JSON.stringify(query);
    const body = JSON.stringify({
      assistant_id: "lead_agent",
      input: {
        messages: [
          {
            type: "human",
            content: [{ type: "text", text: JSON.parse(escapedQuery) }],
          },
        ],
      },
      stream_mode: ["values", "messages-tuple"],
      stream_subgraphs: true,
      config: {
        recursion_limit: 1000,
      },
      context: {
        thinking_enabled: mc.thinking,
        is_plan_mode: mc.plan,
        subagent_enabled: mc.subagent,
        thread_id: threadId,
      },
    });

    const runResp = await fetch(`${langgraphUrl}/threads/${threadId}/runs/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout((maxDuration + 30) * 1000),
    });

    if (!runResp.ok) {
      const errText = await runResp.text();
      return { success: false, output: "", error: `DeerFlow 运行失败: ${errText}` };
    }

    // 5. Parse SSE stream - collect the last "values" event for the final response
    const reader = runResp.body?.getReader();
    if (!reader) {
      return { success: false, output: "", error: "无法读取 DeerFlow 响应流" };
    }

    const decoder = new TextDecoder();
    let rawSSE = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Keep only the last 50KB to avoid memory issues
      if (buffer.length > 50000) {
        buffer = buffer.slice(-50000);
      }
      rawSSE += decoder.decode(value, { stream: true });
      if (rawSSE.length > 100000) {
        rawSSE = rawSSE.slice(-100000);
      }
    }

    // 6. Extract the final AI response from the last "values" event
    // Parse SSE events from the buffer
    const events: Array<{ type: string; data: string }> = [];
    let currentEvent: string | null = null;
    let currentDataLines: string[] = [];

    for (const line of rawSSE.split("\n")) {
      if (line.startsWith("event:")) {
        if (currentEvent && currentDataLines.length > 0) {
          events.push({ type: currentEvent, data: currentDataLines.join("\n") });
        }
        currentEvent = line.slice(6).trim();
        currentDataLines = [];
      } else if (line.startsWith("data:")) {
        currentDataLines.push(line.slice(5).trim());
      } else if (line === "" && currentEvent) {
        if (currentDataLines.length > 0) {
          events.push({ type: currentEvent, data: currentDataLines.join("\n") });
        }
        currentEvent = null;
        currentDataLines = [];
      }
    }
    if (currentEvent && currentDataLines.length > 0) {
      events.push({ type: currentEvent, data: currentDataLines.join("\n") });
    }

    // Find last "values" event with messages
    let resultMessages: any[] | null = null;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === "values") {
        try {
          const data = JSON.parse(events[i].data);
          if (data.messages) {
            resultMessages = data.messages;
            break;
          }
        } catch { /* skip */ }
      }
    }

    if (!resultMessages || resultMessages.length === 0) {
      // Check for error events
      for (const evt of events) {
        if (evt.type === "error") {
          return { success: false, output: "", error: `DeerFlow 错误: ${evt.data}` };
        }
      }
      return { success: false, output: "", error: "DeerFlow 未返回有效响应" };
    }

    // Extract the final AI text (last AI message)
    let responseText = "";
    for (let i = resultMessages.length - 1; i >= 0; i--) {
      const msg = resultMessages[i];
      if (msg.type === "ai") {
        const content = msg.content;
        if (typeof content === "string" && content) {
          responseText = content;
        } else if (Array.isArray(content)) {
          const parts = content
            .filter((b: any) => (typeof b === "string" && b) || (b.type === "text" && b.text))
            .map((b: any) => typeof b === "string" ? b : b.text)
            .join("");
          if (parts) { responseText = parts; }
        }
        if (responseText) break;
      }
      if (msg.type === "tool" && msg.name === "ask_clarification") {
        responseText = msg.content || "";
        if (responseText) break;
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!responseText) {
      return { success: false, output: "", error: "DeerFlow 未返回文本内容" };
    }

    // Truncate for tool result context (max 8000 chars to fit in conversation)
    const truncated = responseText.length > 8000;
    const output = truncated
      ? responseText.slice(0, 8000) + "\n\n...(内容已截断，完整研究由 DeerFlow 完成)"
      : responseText;

    return {
      success: true,
      output,
      metadata: {
        source: "deerflow",
        mode,
        threadId,
        query,
        elapsedSeconds: elapsed,
        messageCount: resultMessages.length,
        truncated,
      },
    };
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return { success: false, output: "", error: `DeerFlow 研究超时（${maxDuration}秒）` };
    }
    return { success: false, output: "", error: `DeerFlow 调用失败: ${err.message}` };
  }
}

async function toolRunShell(command: string, cwd: string): Promise<ToolResult> {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd, timeout: 60000 });
    return {
      success: true,
      output: (stdout + stderr).trim() || "(命令执行完成，无输出)",
      metadata: { command, cwd }
    };
  } catch (err: any) {
    return {
      success: false,
      output: err.stdout || "",
      error: err.stderr || err.message
    };
  }
}
