/**
 * MaoAI Tool Calling Engine
 * 工具注册系统和执行引擎
 *
 * 支持的工具：
 * 1. web_search       — 联网搜索（Tavily API，有免费额度）
 * 2. run_code         — 执行 Python/JS 代码（Railway 服务器沙箱）
 * 3. github_push      — 推送文件到 GitHub 仓库
 * 4. github_read      — 读取 GitHub 仓库文件
 * 5. read_url         — 读取网页内容
 * 6. run_shell        — 执行 Shell 命令（仅管理员）
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

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
  }
];

// Admin-only tools (not exposed to regular users)
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
  }
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
      case "run_shell":
        if (!isAdmin) return { success: false, output: "", error: "run_shell 仅管理员可用" };
        return await toolRunShell(args.command, args.cwd || "/tmp");
      default:
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
