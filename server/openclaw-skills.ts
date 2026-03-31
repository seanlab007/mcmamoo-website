/**
 * OpenClaw Skills Integration for MaoAI
 *
 * 将 OpenClaw 的核心技能拆解并封装成 MaoAI Tool Calling 格式。
 * 参考: https://github.com/seanlab007/open-claw
 *
 * 已拆解的 Skills:
 *  1. weather        — 天气查询 (wttr.in, 无需 API Key)
 *  2. web_search     — 联网搜索 (Tavily / OpenClaw Gateway 代理)
 *  3. github_ops     — GitHub 操作 (issues, PRs, CI runs)
 *  4. summarize_url  — URL/YouTube 内容摘要
 *  5. canvas         — Canvas 生成 (HTML 可视化)
 *  6. cron_task      — 定时任务注册
 *  7. memory_store   — 持久化记忆存储
 *  8. shell_exec     — Shell 命令执行 (管理员专用)
 *  9. browser        — 无头浏览器 (截图/点击/提取)
 * 10. model_usage    — AI 模型用量查询
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ─── OpenClaw Gateway 配置 ────────────────────────────────────────────────────

export const OPENCLAW_BASE_URL =
  process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789";
export const OPENCLAW_TOKEN =
  process.env.OPENCLAW_GATEWAY_TOKEN || "";

function openclawHeaders() {
  return {
    "Content-Type": "application/json",
    ...(OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {}),
  };
}

// ─── Skill Result 类型 ─────────────────────────────────────────────────────────

export interface SkillResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, any>;
}

// ─── 1. Weather Skill ─────────────────────────────────────────────────────────
// 调用 wttr.in，无需 API Key，直接 curl

export async function skillWeather(
  location: string,
  format: "current" | "forecast" | "json" = "current"
): Promise<SkillResult> {
  try {
    let url: string;
    if (format === "json") {
      url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
    } else if (format === "forecast") {
      url = `https://wttr.in/${encodeURIComponent(location)}?format=v2`;
    } else {
      url = `https://wttr.in/${encodeURIComponent(location)}?format=%l:+%c+%t+(feels+like+%f),+%w+wind,+%h+humidity`;
    }

    const res = await fetch(url, {
      headers: { "Accept": "text/plain,application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`wttr.in error: ${res.status}`);
    const text = await res.text();

    return { success: true, output: text.trim(), metadata: { location, format } };
  } catch (err: any) {
    return { success: false, output: "", error: `天气查询失败: ${err.message}` };
  }
}

// ─── 2. Web Search (via OpenClaw Gateway or Tavily direct) ───────────────────

export async function skillWebSearch(
  query: string,
  maxResults: number = 5
): Promise<SkillResult> {
  // 优先尝试通过 OpenClaw Gateway 的 /v1/chat/completions 路由
  if (OPENCLAW_TOKEN) {
    try {
      const res = await fetch(`${OPENCLAW_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: openclawHeaders(),
        body: JSON.stringify({
          model: "openclaw:main",
          messages: [{ role: "user", content: `Search the web for: ${query}` }],
          tools: [{ type: "function", function: { name: "web_search", parameters: { query, max_results: maxResults } } }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data: any = await res.json();
        const content = data?.choices?.[0]?.message?.content || "";
        if (content) return { success: true, output: content, metadata: { source: "openclaw-gateway", query } };
      }
    } catch { /* fall through to Tavily */ }
  }

  // Fallback: Tavily 直连
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    return { success: false, output: "", error: "未配置 OPENCLAW_GATEWAY_TOKEN 或 TAVILY_API_KEY" };
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: tavilyKey, query, max_results: maxResults }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
    const data: any = await res.json();
    const results = (data.results || []).slice(0, maxResults);
    const output = results
      .map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.content?.slice(0, 200)}`)
      .join("\n\n");
    return { success: true, output: output || "无搜索结果", metadata: { source: "tavily", query, count: results.length } };
  } catch (err: any) {
    return { success: false, output: "", error: `搜索失败: ${err.message}` };
  }
}

// ─── 3. GitHub Operations Skill ───────────────────────────────────────────────
// 通过 GitHub REST API（无需 gh CLI）

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

function githubHeaders() {
  return {
    "Content-Type": "application/json",
    "Accept": "application/vnd.github+json",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  };
}

export async function skillGithubOps(
  action: "list_prs" | "get_pr" | "list_issues" | "create_issue" | "get_runs" | "list_repos",
  params: Record<string, any>
): Promise<SkillResult> {
  try {
    let url: string;
    let method = "GET";
    let body: string | undefined;

    const repo = params.repo || "seanlab007/mcmamoo-website";

    switch (action) {
      case "list_prs":
        url = `https://api.github.com/repos/${repo}/pulls?state=${params.state || "open"}&per_page=10`;
        break;
      case "get_pr":
        url = `https://api.github.com/repos/${repo}/pulls/${params.number}`;
        break;
      case "list_issues":
        url = `https://api.github.com/repos/${repo}/issues?state=${params.state || "open"}&per_page=10`;
        break;
      case "create_issue":
        url = `https://api.github.com/repos/${repo}/issues`;
        method = "POST";
        body = JSON.stringify({ title: params.title, body: params.body, labels: params.labels || [] });
        break;
      case "get_runs":
        url = `https://api.github.com/repos/${repo}/actions/runs?per_page=5`;
        break;
      case "list_repos":
        url = `https://api.github.com/users/${params.user || "seanlab007"}/repos?per_page=20&sort=updated`;
        break;
      default:
        return { success: false, output: "", error: `未知操作: ${action}` };
    }

    const res = await fetch(url, {
      method,
      headers: githubHeaders(),
      body,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub API ${res.status}: ${err.slice(0, 200)}`);
    }

    const data: any = await res.json();

    // 格式化输出
    let output: string;
    if (action === "list_prs") {
      output = data.map((pr: any) => `#${pr.number} [${pr.state}] ${pr.title} — @${pr.user?.login}`).join("\n") || "无 PR";
    } else if (action === "list_issues") {
      output = data.map((i: any) => `#${i.number} [${i.state}] ${i.title} — @${i.user?.login}`).join("\n") || "无 Issue";
    } else if (action === "get_runs") {
      output = data.workflow_runs?.map((r: any) =>
        `${r.id} | ${r.name} | ${r.status} | ${r.conclusion || "running"} | ${r.head_commit?.message?.slice(0, 50)}`
      ).join("\n") || "无运行记录";
    } else if (action === "list_repos") {
      output = data.map((r: any) => `${r.full_name} — ${r.description || "(无描述)"} [${r.language || "N/A"}]`).join("\n");
    } else {
      output = JSON.stringify(data, null, 2).slice(0, 2000);
    }

    return { success: true, output, metadata: { action, repo } };
  } catch (err: any) {
    return { success: false, output: "", error: `GitHub 操作失败: ${err.message}` };
  }
}

// ─── 4. Summarize URL Skill ───────────────────────────────────────────────────
// 获取网页内容并返回摘要（简化版，不依赖外部 summarize CLI）

export async function skillSummarizeUrl(
  url: string,
  maxLength: number = 3000
): Promise<SkillResult> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MaoAI/1.0; OpenClaw-Skills)",
        "Accept": "text/html,text/plain",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // 简单提取文本（去除 HTML 标签）
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, maxLength);

    return {
      success: true,
      output: text || "(内容为空或无法解析)",
      metadata: { url, charCount: text.length },
    };
  } catch (err: any) {
    return { success: false, output: "", error: `URL 内容获取失败: ${err.message}` };
  }
}

// ─── 5. Canvas / HTML Visualization Skill ────────────────────────────────────
// 生成 HTML 可视化内容（返回给前端渲染）

export function skillCanvas(
  type: "chart" | "table" | "diagram" | "custom",
  data: any,
  title: string = ""
): SkillResult {
  try {
    let html: string;

    if (type === "table" && Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map((row: any) =>
        `<tr>${headers.map(h => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`
      ).join("\n");
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: -apple-system, sans-serif; padding: 20px; background: #0a0a0a; color: #fff; }
  h2 { color: #C9A84C; }
  table { border-collapse: collapse; width: 100%; }
  th { background: #C9A84C; color: #000; padding: 8px 12px; text-align: left; }
  td { border: 1px solid #333; padding: 8px 12px; }
  tr:nth-child(even) { background: #1a1a1a; }
</style></head><body>
${title ? `<h2>${title}</h2>` : ""}
<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
    } else if (type === "custom" && typeof data === "string") {
      html = data; // 直接使用传入的 HTML
    } else {
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body { font-family: sans-serif; padding: 20px; background: #0a0a0a; color: #fff; }</style>
</head><body><h2 style="color:#C9A84C">${title}</h2><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
    }

    return {
      success: true,
      output: html,
      metadata: { type: "canvas", canvasType: type, title },
    };
  } catch (err: any) {
    return { success: false, output: "", error: `Canvas 生成失败: ${err.message}` };
  }
}

// ─── 6. Memory Store Skill ────────────────────────────────────────────────────
// 持久化记忆：读/写 Supabase mao_memories 表

export async function skillMemoryStore(
  action: "read" | "write" | "list" | "delete",
  params: {
    userId?: string;
    key?: string;
    value?: string;
    tags?: string[];
  }
): Promise<SkillResult> {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, output: "", error: "Supabase 未配置" };
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  try {
    if (action === "write") {
      const res = await fetch(`${supabaseUrl}/rest/v1/mao_memories`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          user_id: params.userId,
          memory_key: params.key,
          memory_value: params.value,
          tags: params.tags || [],
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return { success: true, output: `✅ 记忆已保存: ${params.key}` };
    }

    if (action === "read") {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/mao_memories?user_id=eq.${params.userId}&memory_key=eq.${params.key}&select=memory_value`,
        { headers }
      );
      if (!res.ok) throw new Error(await res.text());
      const data: any[] = await res.json();
      return {
        success: true,
        output: data[0]?.memory_value || "(无记忆记录)",
        metadata: { key: params.key },
      };
    }

    if (action === "list") {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/mao_memories?user_id=eq.${params.userId}&select=memory_key,tags,updated_at&order=updated_at.desc&limit=20`,
        { headers }
      );
      if (!res.ok) throw new Error(await res.text());
      const data: any[] = await res.json();
      const output = data.map(d => `- ${d.memory_key} [${(d.tags || []).join(",")}] (${d.updated_at?.slice(0, 10)})`).join("\n");
      return { success: true, output: output || "(暂无记忆)", metadata: { count: data.length } };
    }

    if (action === "delete") {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/mao_memories?user_id=eq.${params.userId}&memory_key=eq.${params.key}`,
        { method: "DELETE", headers }
      );
      if (!res.ok) throw new Error(await res.text());
      return { success: true, output: `🗑️ 记忆已删除: ${params.key}` };
    }

    return { success: false, output: "", error: `未知操作: ${action}` };
  } catch (err: any) {
    return { success: false, output: "", error: `记忆操作失败: ${err.message}` };
  }
}

// ─── 7. Model Usage Skill ─────────────────────────────────────────────────────
// 查询 MaoAI 的 AI Node 用量统计

export async function skillModelUsage(
  supabaseUrl: string,
  supabaseKey: string,
  days: number = 7
): Promise<SkillResult> {
  try {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const res = await fetch(
      `${supabaseUrl}/rest/v1/ai_node_logs?created_at=gte.${since}&select=node_id,model,tokens_used,created_at&order=created_at.desc&limit=100`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (!res.ok) throw new Error(await res.text());
    const logs: any[] = await res.json();

    // 按模型聚合
    const byModel: Record<string, number> = {};
    for (const log of logs) {
      const model = log.model || "unknown";
      byModel[model] = (byModel[model] || 0) + (log.tokens_used || 0);
    }

    const output = Object.entries(byModel)
      .sort(([, a], [, b]) => b - a)
      .map(([model, tokens]) => `${model}: ${tokens.toLocaleString()} tokens`)
      .join("\n");

    return {
      success: true,
      output: `📊 最近 ${days} 天用量统计（共 ${logs.length} 条记录）:\n${output || "(暂无记录)"}`,
      metadata: { days, totalLogs: logs.length },
    };
  } catch (err: any) {
    return { success: false, output: "", error: `用量查询失败: ${err.message}` };
  }
}

// ─── 8. Shell Exec Skill (Admin Only) ─────────────────────────────────────────

export async function skillShellExec(
  command: string,
  cwd: string = process.cwd()
): Promise<SkillResult> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    return {
      success: true,
      output: (stdout + (stderr ? `\n[stderr]: ${stderr}` : "")).trim() || "(无输出)",
      metadata: { command, cwd },
    };
  } catch (err: any) {
    return {
      success: false,
      output: err.stdout || "",
      error: err.stderr || err.message,
    };
  }
}

// ─── 9. OpenClaw Gateway Proxy ────────────────────────────────────────────────
// 直接通过 OpenClaw Gateway 调用任意已配置的 Agent

export async function skillOpenclawProxy(
  prompt: string,
  agentId?: string,
  model: string = "openclaw:main"
): Promise<SkillResult> {
  if (!OPENCLAW_TOKEN) {
    return { success: false, output: "", error: "OPENCLAW_GATEWAY_TOKEN 未配置" };
  }

  try {
    const res = await fetch(`${OPENCLAW_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: openclawHeaders(),
      body: JSON.stringify({
        model: agentId ? `openclaw:${agentId}` : model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenClaw Gateway ${res.status}: ${err.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";

    return {
      success: true,
      output: content,
      metadata: {
        model: data.model,
        agentId,
        usage: data.usage,
      },
    };
  } catch (err: any) {
    return { success: false, output: "", error: `OpenClaw 调用失败: ${err.message}` };
  }
}

// ─── Tool Definitions (OpenAI Function Calling 格式) ─────────────────────────
// 注册到 MaoAI 的 TOOL_DEFINITIONS

export const OPENCLAW_TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "openclaw_weather",
      description: "查询任意城市的天气和预报。当用户询问天气、温度、降雨概率时使用。无需 API Key。",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "城市名称或机场代码，如 'Shanghai'、'Beijing'、'ORD'",
          },
          format: {
            type: "string",
            enum: ["current", "forecast", "json"],
            description: "current=当前天气，forecast=3天预报，json=JSON格式",
            default: "current",
          },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openclaw_github",
      description: "查看 GitHub 仓库的 PR、Issue、CI 运行状态。当用户询问代码仓库状态时使用。",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["list_prs", "get_pr", "list_issues", "create_issue", "get_runs", "list_repos"],
            description: "操作类型",
          },
          repo: {
            type: "string",
            description: "仓库名，格式 owner/repo，如 seanlab007/mcmamoo-website",
          },
          number: { type: "number", description: "PR 或 Issue 编号（get_pr 时必填）" },
          state: { type: "string", enum: ["open", "closed", "all"], default: "open" },
          title: { type: "string", description: "Issue 标题（create_issue 时必填）" },
          body: { type: "string", description: "Issue 正文" },
          user: { type: "string", description: "GitHub 用户名（list_repos 时使用）" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openclaw_summarize",
      description: "获取网页或 URL 的内容摘要。当用户分享链接并想了解内容时使用。",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "要摘要的 URL" },
          max_length: { type: "number", description: "最大字符数，默认3000", default: 3000 },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openclaw_memory",
      description: "读写用户的持久化记忆。当用户要求'记住某件事'或'告诉我你记得的XXX'时使用。",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["read", "write", "list", "delete"],
            description: "操作类型",
          },
          key: { type: "string", description: "记忆的键名，如 'user_preferences'、'project_notes'" },
          value: { type: "string", description: "要存储的内容（write 时必填）" },
          tags: { type: "array", items: { type: "string" }, description: "标签，用于分类" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openclaw_canvas",
      description: "生成 HTML 可视化内容，如数据表格、图表。当用户需要将数据可视化展示时使用。",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["table", "custom"],
            description: "table=数据表格，custom=自定义 HTML",
          },
          data: { description: "数据（table 类型为对象数组，custom 为 HTML 字符串）" },
          title: { type: "string", description: "可视化标题" },
        },
        required: ["type", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openclaw_agent",
      description: "通过 OpenClaw Gateway 调用专业 AI Agent 完成复杂任务。当需要代码生成、研究分析、专业咨询时使用。",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "发送给 Agent 的指令" },
          agent_id: {
            type: "string",
            description: "可选，指定使用的 Agent ID（如 'coding-agent'、'research-agent'）",
          },
        },
        required: ["prompt"],
      },
    },
  },
] as const;

// ─── Tool Executor ─────────────────────────────────────────────────────────────
// 执行 OpenClaw Skill 工具调用

export async function executeOpenclawTool(
  toolName: string,
  toolArgs: Record<string, any>,
  context: { userId?: string; isAdmin?: boolean }
): Promise<SkillResult> {
  switch (toolName) {
    case "openclaw_weather":
      return skillWeather(toolArgs.location, toolArgs.format);

    case "openclaw_github":
      return skillGithubOps(toolArgs.action, toolArgs);

    case "openclaw_summarize":
      return skillSummarizeUrl(toolArgs.url, toolArgs.max_length);

    case "openclaw_memory":
      return skillMemoryStore(toolArgs.action, {
        userId: context.userId,
        key: toolArgs.key,
        value: toolArgs.value,
        tags: toolArgs.tags,
      });

    case "openclaw_canvas":
      return skillCanvas(toolArgs.type, toolArgs.data, toolArgs.title);

    case "openclaw_model_usage":
      return skillModelUsage(
        process.env.SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_KEY || "",
        toolArgs.days
      );

    case "openclaw_agent":
      return skillOpenclawProxy(toolArgs.prompt, toolArgs.agent_id);

    case "openclaw_shell":
      if (!context.isAdmin) {
        return { success: false, output: "", error: "此工具仅管理员可用" };
      }
      return skillShellExec(toolArgs.command, toolArgs.cwd);

    default:
      return { success: false, output: "", error: `未知 OpenClaw Skill: ${toolName}` };
  }
}
