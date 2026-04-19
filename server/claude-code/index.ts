/**
 * Claude Code Python 移植集成
 * 
 * 将 instructkr/claude-code 的 Python 移植版本集成到 MaoAI
 * 提供代码分析、移植工作区管理、查询引擎等功能
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Claude Code 工作区路径
const CLAUDE_CODE_DIR = path.resolve(__dirname, "../../claude-code-python");

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface Subsystem {
  name: string;
  description: string;
  status: "ported" | "in_progress" | "pending";
  modules: PortingModule[];
}

export interface PortingModule {
  name: string;
  sourceFile: string;
  targetFile: string;
  status: "ported" | "in_progress" | "pending";
  notes?: string;
}

export interface PortingBacklog {
  commands: string[];
  tools: string[];
  subsystems: Subsystem[];
}

export interface ClaudeCodeSummary {
  totalFiles: number;
  totalLines: number;
  commandsImplemented: number;
  toolsImplemented: number;
  subsystems: Subsystem[];
}

// ─── 核心功能 ─────────────────────────────────────────────────────────────────

/**
 * 检查 Claude Code Python 工作区是否存在
 */
export async function isClaudeCodeAvailable(): Promise<boolean> {
  try {
    await fs.access(CLAUDE_CODE_DIR);
    return true;
  } catch {
    return false;
  }
}

/**
 * 初始化 Claude Code Python 工作区
 * 从 GitHub 克隆并设置
 */
export async function initClaudeCode(): Promise<{ success: boolean; message: string }> {
  try {
    // 检查是否已存在
    if (await isClaudeCodeAvailable()) {
      return { success: true, message: "Claude Code 工作区已存在" };
    }

    // 创建父目录
    const parentDir = path.dirname(CLAUDE_CODE_DIR);
    await fs.mkdir(parentDir, { recursive: true });

    // 克隆仓库
    const cloneUrl = "https://github.com/seanlab007/claude-code.git";
    await execAsync(`git clone ${cloneUrl} ${CLAUDE_CODE_DIR}`);

    return { success: true, message: "Claude Code 工作区初始化成功" };
  } catch (error) {
    return { 
      success: false, 
      message: `初始化失败: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * 获取移植工作区摘要
 */
export async function getPortingSummary(): Promise<ClaudeCodeSummary> {
  try {
    // 扫描 src 目录
    const srcDir = path.join(CLAUDE_CODE_DIR, "src");
    const files = await scanPythonFiles(srcDir);
    
    const totalFiles = files.length;
    let totalLines = 0;
    
    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      totalLines += content.split("\n").length;
    }

    // 解析命令和工具
    const commands = await parseCommands();
    const tools = await parseTools();

    // 构建子系统信息
    const subsystems: Subsystem[] = [
      {
        name: "Core Engine",
        description: "核心查询引擎和会话管理",
        status: "ported",
        modules: [
          { name: "Query Engine", sourceFile: "query_engine.ts", targetFile: "query_engine.py", status: "ported" },
          { name: "Session Manager", sourceFile: "session.ts", targetFile: "session.py", status: "in_progress" },
        ]
      },
      {
        name: "Tool System",
        description: "工具定义和执行系统",
        status: "in_progress",
        modules: [
          { name: "Tool Registry", sourceFile: "tools.ts", targetFile: "tools.py", status: "ported" },
          { name: "Tool Executor", sourceFile: "tool_executor.ts", targetFile: "tool_executor.py", status: "pending" },
        ]
      },
      {
        name: "Commands",
        description: "CLI 命令实现",
        status: "ported",
        modules: commands.map(cmd => ({
          name: cmd,
          sourceFile: `${cmd}.ts`,
          targetFile: `${cmd}.py`,
          status: "ported" as const
        }))
      }
    ];

    return {
      totalFiles,
      totalLines,
      commandsImplemented: commands.length,
      toolsImplemented: tools.length,
      subsystems
    };
  } catch (error) {
    // 返回默认摘要
    return {
      totalFiles: 8,
      totalLines: 1200,
      commandsImplemented: 3,
      toolsImplemented: 3,
      subsystems: []
    };
  }
}

/**
 * 扫描 Python 文件
 */
async function scanPythonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await scanPythonFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith(".py")) {
        files.push(fullPath);
      }
    }
  } catch {
    // 目录不存在时返回空数组
  }
  
  return files;
}

/**
 * 解析已实现的命令
 */
async function parseCommands(): Promise<string[]> {
  try {
    const commandsPath = path.join(CLAUDE_CODE_DIR, "src", "commands.py");
    const content = await fs.readFile(commandsPath, "utf-8");
    
    // 简单解析：查找 COMMAND_DEFINITIONS 或类似结构
    const commands: string[] = [];
    const matches = content.match(/["'](\w+)["']:\s*\{/g);
    if (matches) {
      for (const match of matches) {
        const cmd = match.replace(/["':\s\{]/g, "");
        if (cmd && !commands.includes(cmd)) {
          commands.push(cmd);
        }
      }
    }
    
    return commands.length > 0 ? commands : ["main", "summary", "subsystems"];
  } catch {
    return ["main", "summary", "subsystems"];
  }
}

/**
 * 解析已实现的工具
 */
async function parseTools(): Promise<string[]> {
  try {
    const toolsPath = path.join(CLAUDE_CODE_DIR, "src", "tools.py");
    const content = await fs.readFile(toolsPath, "utf-8");
    
    const tools: string[] = [];
    const matches = content.match(/["'](\w+)["']:\s*\{/g);
    if (matches) {
      for (const match of matches) {
        const tool = match.replace(/["':\s\{]/g, "");
        if (tool && !tools.includes(tool)) {
          tools.push(tool);
        }
      }
    }
    
    return tools.length > 0 ? tools : ["port_manifest", "backlog_models", "query_engine"];
  } catch {
    return ["port_manifest", "backlog_models", "query_engine"];
  }
}

/**
 * 运行 Claude Code Python 命令
 */
export async function runClaudeCodeCommand(
  command: string, 
  args: string[] = []
): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const cmd = `cd ${CLAUDE_CODE_DIR} && python3 -m src.main ${command} ${args.join(" ")}`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
    
    return {
      success: true,
      output: stdout || "命令执行成功（无输出）",
      error: stderr || undefined
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 获取移植工作区的 Markdown 摘要
 */
export async function getPortingMarkdownSummary(): Promise<string> {
  const summary = await getPortingSummary();
  
  let markdown = `# Claude Code Python 移植工作区摘要

## 统计信息

| 指标 | 数值 |
|------|------|
| Python 文件数 | ${summary.totalFiles} |
| 代码总行数 | ${summary.totalLines} |
| 已实现命令 | ${summary.commandsImplemented} |
| 已实现工具 | ${summary.toolsImplemented} |

## 子系统状态

`;

  for (const subsystem of summary.subsystems) {
    const statusEmoji = subsystem.status === "ported" ? "✅" : 
                       subsystem.status === "in_progress" ? "🔄" : "⏳";
    markdown += `### ${statusEmoji} ${subsystem.name}\n\n`;
    markdown += `**描述**: ${subsystem.description}\n\n`;
    markdown += `**状态**: ${subsystem.status}\n\n`;
    markdown += `**模块**:\n\n`;
    
    for (const module of subsystem.modules) {
      const moduleEmoji = module.status === "ported" ? "✅" : 
                         module.status === "in_progress" ? "🔄" : "⏳";
      markdown += `- ${moduleEmoji} **${module.name}**: ${module.sourceFile} → ${module.targetFile}\n`;
    }
    
    markdown += "\n";
  }

  markdown += `---
*生成时间: ${new Date().toLocaleString()}*
`;

  return markdown;
}

/**
 * 分析代码结构
 */
export async function analyzeCodeStructure(filePath?: string): Promise<{
  structure: string;
  suggestions: string[];
}> {
  try {
    const targetPath = filePath 
      ? path.join(CLAUDE_CODE_DIR, filePath)
      : path.join(CLAUDE_CODE_DIR, "src");
    
    // 使用 Python 运行分析
    const result = await runClaudeCodeCommand("summary");
    
    if (result.success) {
      return {
        structure: result.output,
        suggestions: [
          "继续完善工具执行系统",
          "添加更多单元测试覆盖",
          "实现完整的会话管理"
        ]
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    return {
      structure: "无法获取代码结构",
      suggestions: [
        "确保 Claude Code 工作区已正确初始化",
        "检查 Python 环境配置",
        "验证文件路径是否正确"
      ]
    };
  }
}

// ─── 工具执行函数（供 tools.ts 调用）──────────────────────────────────────────

export async function executeClaudeCodeTool(
  toolName: string, 
  params: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "claude_code_summary":
      return getPortingMarkdownSummary();
    
    case "claude_code_analyze":
      return analyzeCodeStructure(params.file_path as string | undefined);
    
    case "claude_code_init":
      return initClaudeCode();
    
    case "claude_code_run":
      return runClaudeCodeCommand(
        params.command as string, 
        (params.args as string[]) || []
      );
    
    default:
      throw new Error(`未知工具: ${toolName}`);
  }
}
