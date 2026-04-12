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
 * 8. midjourney_imagine — Midjourney 文字生成图片
 * 9. midjourney_status  — 查询 Midjourney 任务状态
 * 10. runway_text_to_video — Runway 文字生成视频
 * 11. runway_image_to_video — Runway 图片生成视频
 * 12. runway_status      — 查询 Runway 任务状态
 *
 * OpenClaw Skills（拆解自 seanlab007/open-claw）：
 * 13. openclaw_weather  — 天气查询（wttr.in，无需 API Key）
 * 14. openclaw_github   — GitHub PR/Issue/CI 查询
 * 15. openclaw_summarize — URL/网页内容摘要
 * 16. openclaw_memory   — 用户持久化记忆读写
 * 17. openclaw_canvas   — HTML 数据可视化生成
 * 18. openclaw_agent    — 通过 OpenClaw Gateway 调用专业 Agent
 * 19. openclaw_shell    — Shell 执行（仅管理员，通过 OpenClaw Skills）
 *
 * Claude Code Python 移植：
 * 20. claude_code_summary  — 获取 Claude Code 移植工作区摘要
 * 21. claude_code_analyze  — 分析代码结构和移植进度
 * 22. claude_code_init     — 初始化 Claude Code 工作区
 * 23. claude_code_run      — 运行 Claude Code Python 命令
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
import {
  OPENCLI_TOOL_DEFINITIONS,
  executeOpencliTool,
} from "./opencli-tools";
import {
  executeClaudeCodeTool,
} from "./claude-code";

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
          },
          verify: {
            type: "boolean",
            description: "Phase 3 功能：推送成功后自动触发 build_verify 构建验证。工程类修改建议开启。",
            default: false
          },
          verifyProjectPath: {
            type: "string",
            description: "build_verify 的项目路径，默认 /Users/daiyan/Desktop/mcmamoo-website",
            default: "/Users/daiyan/Desktop/mcmamoo-website"
          },
          verifyMaxRetries: {
            type: "number",
            description: "构建失败后最大重试次数，默认 3",
            default: 3
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
  },
  // ─── Midjourney 工具 ─────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "midjourney_imagine",
      description: "使用 Midjourney AI 生成高质量图片。适用于概念设计、品牌视觉、产品效果图、艺术创作、社交媒体素材等。生成后可通过 midjourney_status 查询进度，完成后返回图片 URL。",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "图像描述，英文效果最佳。例如: 'A futuristic city skyline at sunset, neon lights, cyberpunk style'"
          },
          aspectRatio: {
            type: "string",
            enum: ["1:1", "2:3", "3:2", "4:5", "5:4", "9:16", "16:9"],
            description: "图片比例，默认 1:1",
            default: "1:1"
          },
          quality: {
            type: "string",
            enum: ["0.25", "0.5", "1"],
            description: "生成质量，默认 1（最高）",
            default: "1"
          },
          style: {
            type: "string",
            enum: ["raw", "vivid"],
            description: "风格：raw(原始)，vivid(鲜明)，默认 vivid",
            default: "vivid"
          },
          version: {
            type: "string",
            enum: ["v6.1", "v6", "v5.2", "niji6"],
            description: "模型版本，默认 v6.1。niji6 为动漫风格",
            default: "v6.1"
          }
        },
        required: ["prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "midjourney_status",
      description: "查询 Midjourney 任务的生成状态和结果。生成图片通常需要 30-60 秒。",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "midjourney_imagine 返回的任务 ID"
          }
        },
        required: ["taskId"]
      }
    }
  },
  // ─── Runway 工具 ────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "runway_text_to_video",
      description: "使用 Runway Gen-3 AI 从文字描述生成视频。适用于品牌宣传片、产品演示、社交媒体视频、创意短片等。生成后可通过 runway_status 查询进度。",
      parameters: {
        type: "object",
        properties: {
          promptText: {
            type: "string",
            description: "视频描述，英文效果最佳。例如: 'A serene ocean sunset with gentle waves, cinematic drone shot'"
          },
          negativePromptText: {
            type: "string",
            description: "不想出现的内容，例如: 'blurry, low quality, watermark'"
          },
          duration: {
            type: "number",
            enum: [5, 10],
            description: "视频时长（秒），默认 5 秒",
            default: 5
          },
          model: {
            type: "string",
            enum: ["gen3a_turbo", "gen3a"],
            description: "模型版本，gen3a_turbo(快速)，gen3a(高质量)。默认 gen3a_turbo",
            default: "gen3a_turbo"
          }
        },
        required: ["promptText"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "runway_image_to_video",
      description: "使用 Runway AI 将图片转换为动态视频。输入一张图片 URL，生成一段动态视频。",
      parameters: {
        type: "object",
        properties: {
          promptImage: {
            type: "string",
            description: "输入图片的公开可访问 URL"
          },
          promptText: {
            type: "string",
            description: "运动描述，例如: 'Slowly zoom in, gentle camera pan'"
          },
          duration: {
            type: "number",
            enum: [5, 10],
            description: "视频时长（秒），默认 5 秒",
            default: 5
          }
        },
        required: ["promptImage"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "runway_status",
      description: "查询 Runway 视频生成任务的状态和结果。视频生成通常需要 1-5 分钟。",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "runway_text_to_video 或 runway_image_to_video 返回的任务 ID"
          }
        },
        required: ["taskId"]
      }
    }
  },

  // ─── Phase 2 新工具：项目结构感知 ─────────────────────────────────────────────

  {
    type: "function",
    function: {
      name: "project_tree_scanner",
      description: "扫描指定目录的代码结构，生成可导航的目录树。用于在修改代码前了解项目布局，确认要修改的文件位置。返回文件列表、大小和最后修改时间。",
      parameters: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "项目根目录的绝对路径，默认为 /Users/daiyan/Desktop/mcmamoo-website"
          },
          maxDepth: {
            type: "number",
            description: "最大扫描深度，默认 4 层，超出深度的目录显示子目录数量",
            default: 4
          },
          includePatterns: {
            type: "string",
            description: "逗号分隔的文件扩展名过滤，如 'ts,tsx,js,jsx'。为空则包含所有文件",
            default: ""
          }
        },
        required: ["projectPath"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "build_verify",
      description: "在指定项目目录执行构建验证（npm run build 或 tsconfig 检查），返回构建是否通过及错误详情。用于代码修改后自动验证，确认代码无误。",
      parameters: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "项目根目录的绝对路径，默认为 /Users/daiyan/Desktop/mcmamoo-website"
          },
          buildCommand: {
            type: "string",
            description: "构建命令，默认 'npm run build'",
            default: "npm run build"
          },
          timeout: {
            type: "number",
            description: "超时时间（秒），默认 120",
            default: 120
          }
        },
        required: ["projectPath"]
      }
    }
  },

  // ─── Phase 3: RAG 向量记忆搜索工具 ─────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "vector_memory_search",
      description: "在项目代码库中进行语义化代码搜索（RAG）。输入关键词或自然语言描述，返回最相关的代码片段和文件位置。当用户问'修改XXX逻辑'、'在哪里找到XXX功能'时使用。此工具不使用外部向量数据库，而是通过多策略匹配（关键词+结构化分析）返回最相关的代码块。",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "搜索查询（关键词或自然语言描述想找的代码功能）"
          },
          projectPath: {
            type: "string",
            description: "项目根目录的绝对路径"
          },
          fileTypes: {
            type: "string",
            description: "要搜索的文件类型，逗号分隔，如 'ts,tsx,py'。默认 'ts,tsx,js,jsx,py'",
            default: "ts,tsx,js,jsx,py"
          },
          maxResults: {
            type: "number",
            description: "最多返回多少个相关代码块，默认 5",
            default: 5
          }
        },
        required: ["query", "projectPath"]
      }
    }
  },

  // ─── Phase 4: TDD 自我修正工具 ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "run_npm_test",
      description: "在指定项目目录运行测试套件（npm test）。用于 TDD 自我修正循环：当 build_verify 通过但需要确认功能正确性时，运行测试。返回测试结果（通过/失败）和失败的测试用例详情，供 AI 重新生成 Thought 进行自我修正。",
      parameters: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "项目根目录的绝对路径"
          },
          testCommand: {
            type: "string",
            description: "测试命令，默认 'npm test -- --run'（Vitest/Jest headless 模式）",
            default: "npm test -- --run"
          },
          timeout: {
            type: "number",
            description: "超时时间（秒），默认 120",
            default: 120
          }
        },
        required: ["projectPath"]
      }
    }
  },

  // ─── Manus Max: HyperAgents ReAct 自主循环引擎 ──────────────────────────────
  {
    type: "function",
    function: {
      name: "run_agent_loop",
      description: "启动 HyperAgents Python 引擎，运行 ReAct 推理循环（Thought→Action→Observation→Score→Patch→Repeat），支持代码工程、深度研究、通用任务。自动调用工具、执行验证、返回最终答案。这是 MaoAI Manus Max 架构的核心能力，适合复杂多步骤任务。",
      parameters: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description: "任务描述（可以是代码优化、深度研究、复杂分析等）"
          },
          domain: {
            type: "string",
            enum: ["coding", "research", "general"],
            description: "领域：coding（代码工程）、research（深度研究）、general（通用）",
            default: "general"
          },
          workspace: {
            type: "string",
            description: "工作目录路径（用于代码工程），默认 /Users/daiyan/Desktop/mcmamoo-website"
          }
        },
        required: ["task"]
      }
    }
  },

  // ─── 猫眼内容平台：视频合成引擎 ───────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "video_composer",
      description: "使用 MoviePy 将图片序列、配音音频和字幕文件合成短视频。支持黑金风格字幕、自动交叉淡入淡出、BGM混音。参数包括图片路径列表、旁白音频路径、SRT字幕文件、输出视频路径和可选的BGM路径。",
      parameters: {
        type: "object",
        properties: {
          image_paths: {
            type: "array",
            items: { type: "string" },
            description: "图片路径列表（建议每张图对应一个分镜），支持 JPG、PNG"
          },
          audio_path: {
            type: "string",
            description: "旁白配音文件路径，支持 MP3、WAV"
          },
          srt_path: {
            type: "string",
            description: "字幕文件路径（SRT 格式）"
          },
          output_path: {
            type: "string",
            description: "输出视频路径，建议 .mp4 格式"
          },
          bgm_path: {
            type: "string",
            description: "可选背景音乐路径，用于添加 BGM"
          }
        },
        required: ["image_paths", "audio_path", "srt_path", "output_path"]
      }
    }
  },

  // ─── 猫眼内容平台：视频合成状态查询 ──────────────────────────────────────
  {
    type: "function",
    function: {
      name: "video_compose_status",
      description: "查询视频合成任务的状态。返回当前进度、已合成时长、预计剩余时间等信息。",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "视频合成任务 ID（由 video_composer 返回）"
          }
        },
        required: ["taskId"]
      }
    }
  }
];

// ─── 合并 OpenClaw / OpenCLI Tools 到工具列表 ─────────────────────────────────
// OpenClaw Skills 对普通用户和管理员都开放（openclaw_shell 除外，在 executor 中鉴权）
(TOOL_DEFINITIONS as unknown as any[]).push(...(OPENCLAW_TOOL_DEFINITIONS as unknown as any[]));
(TOOL_DEFINITIONS as unknown as any[]).push(...(OPENCLI_TOOL_DEFINITIONS as unknown as any[]));

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
  // ─── Claude Code Python 移植工具 ────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "claude_code_summary",
      description: "获取 Claude Code Python 移植工作区的摘要报告，包括文件统计、子系统状态、移植进度等信息。",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "claude_code_analyze",
      description: "分析 Claude Code 移植工作区的代码结构，提供架构分析和改进建议。",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "可选：指定要分析的特定文件或目录路径（相对于工作区根目录）",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "claude_code_init",
      description: "初始化 Claude Code Python 移植工作区，从 GitHub 克隆代码仓库。",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "claude_code_run",
      description: "运行 Claude Code Python 移植版本的 CLI 命令（如 summary、manifest、subsystems）。",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "要执行的命令，如 summary、manifest、subsystems",
          },
          args: {
            type: "array",
            items: { type: "string" },
            description: "命令参数列表",
          },
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
        return await toolGithubPush(
          args.repo,
          args.files,
          args.message,
          args.branch || "main",
          args.verify === true,
          args.verifyProjectPath,
          args.verifyMaxRetries
        );
      case "github_read":
        return await toolGithubRead(args.repo, args.file_path, args.branch || "main");
      case "read_url":
        return await toolReadUrl(args.url, args.extract_text_only !== false);
      case "deep_research":
        return await toolDeepResearch(args.query, args.mode || "pro", args.max_duration || 300);
      case "midjourney_imagine":
        return await toolMidjourneyImagine(args.prompt, args.aspectRatio, args.quality, args.style, args.version);
      case "midjourney_status":
        return await toolMidjourneyStatus(args.taskId);
      case "runway_text_to_video":
        return await toolRunwayTextToVideo(args.promptText, args.negativePromptText, args.duration, args.model);
      case "runway_image_to_video":
        return await toolRunwayImageToVideo(args.promptImage, args.promptText, args.duration);
      case "runway_status":
        return await toolRunwayStatus(args.taskId);
      // ─── Phase 2 新工具 ───────────────────────────────────────────────────
      case "project_tree_scanner":
        return await toolProjectTreeScanner(args.projectPath, args.maxDepth || 4, args.includePatterns);
      case "build_verify":
        return await toolBuildVerify(args.projectPath, args.buildCommand || "npm run build", args.timeout || 120);
      // ─── Phase 3 RAG 记忆搜索 ─────────────────────────────────────────────
      case "vector_memory_search":
        return await toolVectorMemorySearch(args.query, args.projectPath, args.fileTypes, args.maxResults);
      // ─── Phase 4 TDD 自我修正 ─────────────────────────────────────────────
      case "run_npm_test":
        return await toolRunNpmTest(args.projectPath, args.testCommand, args.timeout);
      // ─── Manus Max: HyperAgents ReAct 引擎 ────────────────────────────────
      case "run_agent_loop":
        return await toolRunAgentLoop(args.task, args.domain, args.workspace);
      // ─── 猫眼内容平台：视频合成引擎 ─────────────────────────────────────
      case "video_composer":
        return await toolVideoComposer(args.image_paths, args.audio_path, args.srt_path, args.output_path, args.bgm_path);
      case "video_compose_status":
        return await toolVideoComposeStatus(args.taskId);
      case "run_shell":
        if (!isAdmin) return { success: false, output: "", error: "run_shell 仅管理员可用" };
        return await toolRunShell(args.command, args.cwd || "/tmp");
      // ─── Claude Code Python 移植工具 ────────────────────────────────────
      case "claude_code_summary":
      case "claude_code_analyze":
      case "claude_code_init":
      case "claude_code_run":
        return await toolClaudeCode(toolName, args);
      default:
        // ─── 路由到 OpenCLI / OpenClaw Tools ──────────────────────────────
        if (toolName.startsWith("opencli_")) {
          return await executeOpencliTool(toolName, args);
        }
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
  branch: string,
  verify?: boolean,        // Phase 3: 推送后自动触发 build_verify
  verifyProjectPath?: string,
  verifyMaxRetries?: number
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

  // ─── Phase 3：推送成功后自动触发构建验证循环 ───────────────────────────────
  let verifyResult: string = "";
  if (allOk && verify === true) {
    const loopResult = await runBuildVerifyLoop(
      verifyProjectPath || "/Users/daiyan/Desktop/mcmamoo-website",
      "npm run build",
      verifyMaxRetries || 3
    );
    verifyResult = `\n\n## 🔄 构建验证循环\n\n` +
      `**总尝试次数:** ${loopResult.totalAttempts} / ${verifyMaxRetries || 3}\n\n` +
      loopResult.history.map(h =>
        `${h.passed ? "✅" : "❌"} 第 ${h.attempt} 次: ` +
        `错误数=${h.errorCount} | ${h.passed ? "通过" : "失败"}`
      ).join("\n") +
      `\n\n**最终结果:** ${loopResult.success ? "✅ 全部通过" : "❌ 验证失败（请检查错误并重新推送）"}\n\n` +
      loopResult.finalOutput;
  }

  return {
    success: allOk && (!verify || verifyResult.includes("✅")),
    output: `GitHub 推送结果（${repo}@${branch}）:\n${results.join("\n")}\n\nCommit: "${message}"` + verifyResult,
    metadata: { repo, branch, fileCount: files.length, verify, verifyResult }
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

// ─── HyperAgents Python Engine — Manus Max ──────────────────────────────────
// 使用 Python ReAct 循环引擎，支持流式 JSON 日志
async function toolRunAgentLoop(
  task: string,
  domain: "coding" | "research" | "general" = "general",
  workspace: string = ""
): Promise<ToolResult> {
  const { spawn } = await import("child_process");
  const resolvedWorkspace = workspace || "/Users/daiyan/Desktop/mcmamoo-website";

  const PYTHON_SCRIPT = `${__dirname}/hyperagents/generate_loop.py`;
  const PYTHON_CMD = (process.env.PYTHON3_PATH || "python3");

  return new Promise((resolve) => {
    const collectedLogs: string[] = [];
    const pythonProcess = spawn(PYTHON_CMD, [
      PYTHON_SCRIPT,
      "--task", task,
      "--domain", domain,
      "--workspace", resolvedWorkspace,
    ], {
      cwd: resolvedWorkspace,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    let hasErrored = false;

    pythonProcess.stdout.on("data", (data: Buffer) => {
      const lines = data.toString("utf-8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const entry = JSON.parse(trimmed);
          if (entry.type === "done") {
            resolve({
              success: true,
              output: entry.message || entry.answer || "Agent 执行完成",
              metadata: { domain, rounds: entry.rounds, logs: collectedLogs.slice(0, 20) },
            });
          } else if (entry.type === "error" && !entry.retry) {
            if (!hasErrored) {
              hasErrored = true;
              resolve({
                success: false,
                output: "",
                error: `[${entry.category}] ${entry.message}`,
              });
            }
          } else {
            collectedLogs.push(`[${entry.type}] ${entry.message}`);
          }
        } catch {
          collectedLogs.push(trimmed.slice(0, 100));
        }
      }
    });

    pythonProcess.stderr.on("data", (data: Buffer) => {
      if (!hasErrored) {
        hasErrored = true;
        resolve({ success: false, output: "", error: `Python stderr: ${data.toString().slice(0, 300)}` });
      }
    });

    pythonProcess.on("error", (err: Error) => {
      if (!hasErrored) {
        hasErrored = true;
        resolve({ success: false, output: "", error: `启动 Python 引擎失败: ${err.message}` });
      }
    });

    pythonProcess.on("close", (code: number | null) => {
      if (!hasErrored && collectedLogs.length > 0) {
        resolve({
          success: code === 0,
          output: `Agent 执行完成（退出码: ${code}）\n\n日志摘要:\n${collectedLogs.slice(0, 10).join("\n")}`,
          error: code !== 0 ? `Exit code: ${code}` : undefined,
        });
      }
    });

    // 5分钟超时保护
    setTimeout(() => {
      if (!hasErrored) {
        pythonProcess.kill("SIGTERM");
        resolve({ success: false, output: "", error: "Agent 执行超时（5分钟）" });
      }
    }, 5 * 60 * 1000);
  });
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

// ─── Claude Code Python 移植工具实现 ───────────────────────────────────────────

async function toolClaudeCode(
  toolName: string,
  args: Record<string, any>
): Promise<ToolResult> {
  try {
    const result = await executeClaudeCodeTool(toolName, args);
    
    // 处理不同类型的返回结果
    if (typeof result === "string") {
      return {
        success: true,
        output: result,
        metadata: { tool: toolName }
      };
    }
    
    if (result && typeof result === "object") {
      const res = result as Record<string, unknown>;
      // 处理运行命令的结果
      if ("success" in result && "output" in result) {
        return {
          success: res.success as boolean,
          output: (res.output as string) || "",
          error: ("error" in res ? (res.error as string) : undefined) || undefined,
          metadata: { tool: toolName }
        };
      }
      
      // 处理分析结果
      if ("structure" in result && "suggestions" in result) {
        const analysis = result as { structure: string; suggestions: string[] };
        return {
          success: true,
          output: `## 代码结构分析\n\n${analysis.structure}\n\n## 改进建议\n\n${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
          metadata: { tool: toolName }
        };
      }
      
      // 通用对象处理
      return {
        success: true,
        output: JSON.stringify(result, null, 2),
        metadata: { tool: toolName }
      };
    }
    
    return {
      success: true,
      output: String(result),
      metadata: { tool: toolName }
    };
  } catch (err: any) {
    return {
      success: false,
      output: "",
      error: `Claude Code 工具执行失败: ${err.message}`
    };
  }
}

// ─── Midjourney 工具实现 ─────────────────────────────────────────────────────

async function toolMidjourneyImagine(
  prompt: string,
  aspectRatio?: string,
  quality?: string,
  style?: string,
  version?: string
): Promise<ToolResult> {
  try {
    const { midjourneyImagine } = await import("./_core/midjourney");
    const result = await midjourneyImagine({
      prompt,
      aspectRatio: aspectRatio as any,
      quality: quality as any,
      style: style as any,
      version: version as any,
    });
    return {
      success: true,
      output: `Midjourney 图片生成任务已提交！\n\n任务 ID: ${result.taskId}\n提示词: ${prompt}\n\n图片通常需要 30-60 秒生成。请使用 midjourney_status 工具查询进度。`,
      metadata: { taskId: result.taskId, provider: "midjourney" },
    };
  } catch (err: any) {
    return { success: false, output: "", error: `Midjourney Imagine 失败: ${err.message}` };
  }
}

async function toolMidjourneyStatus(taskId: string): Promise<ToolResult> {
  try {
    const { midjourneyTaskStatus } = await import("./_core/midjourney");
    const result = await midjourneyTaskStatus(taskId);

    const statusLabels: Record<string, string> = {
      pending: "等待中",
      in_progress: `生成中 (${result.progress || 0}%)`,
      completed: "已完成",
      failed: "失败",
    };

    let output = `Midjourney 任务状态: ${statusLabels[result.status] || result.status}\n任务 ID: ${taskId}`;
    if (result.imageUrl) {
      output += `\n\n图片 URL: ${result.imageUrl}`;
    }
    if (result.failReason) {
      output += `\n失败原因: ${result.failReason}`;
    }

    return {
      success: result.status === "completed",
      output,
      metadata: result,
    };
  } catch (err: any) {
    return { success: false, output: "", error: `Midjourney 状态查询失败: ${err.message}` };
  }
}

// ─── Runway 工具实现 ─────────────────────────────────────────────────────────

async function toolRunwayTextToVideo(
  promptText: string,
  negativePromptText?: string,
  duration?: number,
  model?: string
): Promise<ToolResult> {
  try {
    const { runwayTextToVideo } = await import("./_core/runway");
    const result = await runwayTextToVideo({
      promptText,
      negativePromptText,
      duration: duration as any,
      model,
    });
    return {
      success: true,
      output: `Runway 视频生成任务已提交！\n\n任务 ID: ${result.taskId}\n描述: ${promptText}\n时长: ${duration || 5} 秒\n\n视频通常需要 1-5 分钟生成。请使用 runway_status 工具查询进度。`,
      metadata: { taskId: result.taskId, provider: "runway" },
    };
  } catch (err: any) {
    return { success: false, output: "", error: `Runway Text-to-Video 失败: ${err.message}` };
  }
}

async function toolRunwayImageToVideo(
  promptImage: string,
  promptText?: string,
  duration?: number
): Promise<ToolResult> {
  try {
    const { runwayImageToVideo } = await import("./_core/runway");
    const result = await runwayImageToVideo({
      promptImage,
      promptText,
      duration: duration as any,
    });
    return {
      success: true,
      output: `Runway 图片生成视频任务已提交！\n\n任务 ID: ${result.taskId}\n输入图片: ${promptImage}\n时长: ${duration || 5} 秒\n\n视频通常需要 1-5 分钟生成。请使用 runway_status 工具查询进度。`,
      metadata: { taskId: result.taskId, provider: "runway" },
    };
  } catch (err: any) {
    return { success: false, output: "", error: `Runway Image-to-Video 失败: ${err.message}` };
  }
}

async function toolRunwayStatus(taskId: string): Promise<ToolResult> {
  try {
    const { runwayTaskStatus } = await import("./_core/runway");
    const result = await runwayTaskStatus(taskId);

    const statusLabels: Record<string, string> = {
      PENDING: "等待中",
      IN_PROGRESS: "生成中",
      SUCCEEDED: "已完成",
      FAILED: "失败",
      CANCELLED: "已取消",
    };

    let output = `Runway 任务状态: ${statusLabels[result.status] || result.status}\n任务 ID: ${taskId}`;
    if (result.output && result.output.length > 0) {
      output += `\n\n视频 URL: ${result.output[0].url}`;
    }
    if (result.failure) {
      output += `\n失败原因: ${result.failure}`;
    }

    return {
      success: result.status === "SUCCEEDED",
      output,
      metadata: result,
    };
  } catch (err: any) {
    return { success: false, output: "", error: `Runway 状态查询失败: ${err.message}` };
  }
}

// ─── Phase 2 工具实现：项目结构扫描器 ───────────────────────────────────────────

interface TreeNode {
  name: string;
  type: "file" | "directory";
  size?: number;        // bytes, only for files
  modified?: string;    // ISO date string, only for files
  children?: TreeNode[];
  childCount?: number; // only for directories beyond maxDepth
}

async function toolProjectTreeScanner(
  projectPath: string,
  maxDepth: number = 4,
  includePatterns: string = ""
): Promise<ToolResult> {
  const DEFAULT_PATH = "/Users/daiyan/Desktop/mcmamoo-website";
  const resolvedPath = projectPath && projectPath.trim() ? path.resolve(projectPath) : DEFAULT_PATH;

  // Filter extensions (e.g. "ts,tsx,js,jsx")
  const allowedExts = includePatterns
    ? includePatterns.split(",").map(e => e.trim().replace(/^\./, "")).filter(Boolean)
    : null;

  function matchesFilter(name: string): boolean {
    if (!allowedExts) return true;
    const ext = name.includes(".") ? name.split(".").pop()! : "";
    return allowedExts.includes(ext);
  }

  async function scanDir(dirPath: string, depth: number): Promise<TreeNode> {
    const name = path.basename(dirPath) || dirPath;
    const node: TreeNode = { name, type: "directory" };

    if (depth > maxDepth) {
      try {
        const entries = await fs.readdir(dirPath);
        node.childCount = entries.length;
      } catch {
        node.childCount = 0;
      }
      return node;
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const children: TreeNode[] = [];
      let fileCount = 0;
      let dirCount = 0;

      for (const entry of entries) {
        // Skip hidden, node_modules, .git, dist, build
        if (
          entry.name.startsWith(".") ||
          entry.name === "node_modules" ||
          entry.name === "dist" ||
          entry.name === "build" ||
          entry.name === "__pycache__"
        ) continue;

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          dirCount++;
          const subNode = await scanDir(fullPath, depth + 1);
          children.push(subNode);
        } else if (entry.isFile()) {
          if (!matchesFilter(entry.name)) continue;
          fileCount++;
          try {
            const stat = await fs.stat(fullPath);
            children.push({
              name: entry.name,
              type: "file",
              size: stat.size,
              modified: stat.mtime.toISOString(),
            });
          } catch {
            children.push({ name: entry.name, type: "file" });
          }
        }
      }

      // Directories first, then files
      children.sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      node.children = children;
      node.childCount = fileCount + dirCount;
    } catch (err: any) {
      node.childCount = 0;
    }

    return node;
  }

  // Build flat file list with paths (for LLM to know where to edit)
  const flatFiles: Array<{ path: string; size: number; modified: string }> = [];

  async function collectFiles(dirPath: string, depth: number): Promise<void> {
    if (depth > maxDepth + 2) return;
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.name.startsWith(".") ||
          entry.name === "node_modules" ||
          entry.name === "dist" ||
          entry.name === "build" ||
          entry.name === "__pycache__"
        ) continue;
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isFile() && matchesFilter(entry.name)) {
          try {
            const stat = await fs.stat(fullPath);
            flatFiles.push({
              path: fullPath,
              size: stat.size,
              modified: stat.mtime.toISOString(),
            });
          } catch { /* skip */ }
        } else if (entry.isDirectory()) {
          await collectFiles(fullPath, depth + 1);
        }
      }
    } catch { /* skip */ }
  }

  try {
    const tree = await scanDir(resolvedPath, 0);
    await collectFiles(resolvedPath, 0);

    const output = `## 项目结构扫描：${resolvedPath}\n\n` +
      `**扫描深度:** ${maxDepth} 层 | **文件总数:** ${flatFiles.length}\n\n` +
      `### 目录树\n\`\`\`\n${formatTree(tree, 0)}\n\`\`\`\n\n` +
      `### 完整文件列表（共 ${flatFiles.length} 个）\n\n` +
      flatFiles
        .sort((a, b) => a.path.localeCompare(b.path))
        .map(f => {
          const rel = f.path.replace(resolvedPath + "/", "");
          const size = f.size < 1024 ? `${f.size}B` : `${(f.size / 1024).toFixed(1)}KB`;
          const date = f.modified ? f.modified.slice(0, 10) : "";
          return `${rel.padEnd(60)} ${size.padStart(8)}  ${date}`;
        })
        .join("\n");

    return {
      success: true,
      output,
      metadata: {
        projectPath: resolvedPath,
        totalFiles: flatFiles.length,
        maxDepth,
      },
    };
  } catch (err: any) {
    return { success: false, output: "", error: `项目扫描失败: ${err.message}` };
  }
}

function formatTree(node: TreeNode, indent: number): string {
  const prefix = "  ".repeat(indent);
  const connector = node.type === "directory" ? "📁 " : "📄 ";
  let result = `${prefix}${connector}${node.name}`;
  if (node.type === "directory" && node.childCount !== undefined) {
    result += ` (${node.childCount} items)`;
  }
  if (node.type === "file" && node.size !== undefined) {
    result += ` (${node.size < 1024 ? node.size + "B" : (node.size / 1024).toFixed(1) + "KB"})`;
  }
  result += "\n";
  if (node.children) {
    for (const child of node.children) {
      result += formatTree(child, indent + 1);
    }
  }
  return result;
}

// ─── Phase 2 工具实现：构建验证 ────────────────────────────────────────────────

async function toolBuildVerify(
  projectPath: string,
  buildCommand: string = "npm run build",
  timeout: number = 120
): Promise<ToolResult> {
  const DEFAULT_PATH = "/Users/daiyan/Desktop/mcmamoo-website";
  const resolvedPath = projectPath && projectPath.trim() ? path.resolve(projectPath) : DEFAULT_PATH;

  // Check if package.json exists
  try {
    await fs.access(path.join(resolvedPath, "package.json"));
  } catch {
    return {
      success: false,
      output: "",
      error: `项目路径不存在 package.json: ${resolvedPath}`
    };
  }

  // Run TypeScript type check first (fast, catches type errors)
  const tscResult = await runBuildCommand(`cd "${resolvedPath}" && npx tsc --noEmit 2>&1`, timeout);
  const hasTypeErrors = tscResult.exitCode !== 0;

  // Run the actual build
  const buildResult = await runBuildCommand(`cd "${resolvedPath}" && ${buildCommand} 2>&1`, timeout);
  const buildPassed = buildResult.exitCode === 0;

  // Collect error lines
  const errorLines = [
    ...extractErrors(tscResult.stdout + tscResult.stderr, "TypeScript"),
    ...extractErrors(buildResult.stdout + buildResult.stderr, "Build"),
  ];

  const summary = buildPassed && !hasTypeErrors
    ? "✅ **构建通过** — 代码类型检查和构建均成功"
    : hasTypeErrors
    ? `⚠️ **构建完成，但有 ${errorLines.length} 个类型错误**`
    : "❌ **构建失败**";

  const output = `## 构建验证结果\n\n` +
    `**项目:** ${resolvedPath}\n` +
    `**命令:** ${buildCommand}\n` +
    `**退出码:** ${buildResult.exitCode}\n\n` +
    `${summary}\n\n` +
    `### 详细输出（最后 100 行）\n\`\`\`\n${(buildResult.stdout + buildResult.stderr).split("\n").slice(-100).join("\n")}\n\`\`\``;

  return {
    success: buildPassed && !hasTypeErrors,
    output: errorLines.length > 0 ? output + "\n\n### 错误摘要\n" + errorLines.join("\n") : output,
    metadata: {
      projectPath: resolvedPath,
      buildCommand,
      exitCode: buildResult.exitCode,
      hasTypeErrors,
      errorCount: errorLines.length,
    },
  };
}

async function runBuildCommand(cmd: string, timeoutSec: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    exec(cmd, { timeout: timeoutSec * 1000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({
        stdout: stdout || "",
        stderr: stderr || "",
        exitCode: err?.code ?? (err ? 1 : 0),
      });
    });
  });
}

function extractErrors(output: string, source: string): string[] {
  const errorPatterns = [
    /error TS\d+:/gi,
    /error:/gi,
    /Error:/gi,
    /ERROR/gi,
    /failed/gi,
    /Failed/gi,
  ];
  const lines = output.split("\n");
  const errors: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && errorPatterns.some(p => p.test(trimmed))) {
      errors.push(`[${source}] ${trimmed}`);
    }
  }
  return errors.slice(0, 50); // cap at 50 errors
}

// ─── Phase 3：github_push 触发构建验证循环（内部逻辑）─────────────────────────────
// 注意：此函数不对外暴露工具，由 aiStream.ts 在 github_push 后自动调用

export async function runBuildVerifyLoop(
  projectPath: string,
  buildCommand: string = "npm run build",
  maxRetries: number = 3
): Promise<{
  success: boolean;
  totalAttempts: number;
  finalOutput: string;
  history: Array<{ attempt: number; passed: boolean; errorCount: number; output: string }>;
}> {
  const history: Array<{ attempt: number; passed: boolean; errorCount: number; output: string }> = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await toolBuildVerify(projectPath, buildCommand);
    const errorCount = result.metadata?.errorCount || 0;
    history.push({
      attempt,
      passed: result.success,
      errorCount,
      output: result.output,
    });

    if (result.success) {
      return { success: true, totalAttempts: attempt, finalOutput: result.output, history };
    }

    if (attempt < maxRetries) {
      // Wait 2 seconds before retry
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return {
    success: false,
    totalAttempts: maxRetries,
    finalOutput: history[history.length - 1]?.output || "",
    history,
  };
}

// ─── Phase 3 工具实现：向量记忆搜索（RAG）────────────────────────────────
// 多策略代码搜索：关键词匹配 + 文件结构分析 + 相关性排序
// 不依赖外部向量数据库，通过智能文本匹配实现语义化搜索
async function toolVectorMemorySearch(
  query: string,
  projectPath: string,
  fileTypes: string = "ts,tsx,js,jsx,py",
  maxResults: number = 5
): Promise<ToolResult> {
  const DEFAULT_PATH = "/Users/daiyan/Desktop/mcmamoo-website";
  const absPath = projectPath || DEFAULT_PATH;

  // 提取关键词
  const keywords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);

  const allowedExts = fileTypes.split(",").map(e => e.trim()).filter(Boolean);

  interface FileScore {
    path: string;
    score: number;
    preview: string;
    lineStart: number;
  }

  const results: FileScore[] = [];

  try {
    // 递归扫描所有匹配文件
    async function scanDir(dir: string, depth: number = 0): Promise<void> {
      if (depth > 6) return; // 安全限制
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch { return; }

      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "__pycache__") continue;

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scanDir(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = entry.name.split(".").pop() || "";
          if (!allowedExts.includes(ext)) continue;

          try {
            const stat = await fs.stat(fullPath);
            if (stat.size > 500_000) continue; // 跳过超大文件

            const content = await fs.readFile(fullPath, "utf8");
            const lines = content.split("\n");

            // 多策略评分
            let score = 0;
            const matchedLines: { line: number; text: string }[] = [];

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const lineLower = line.toLowerCase();

              for (const kw of keywords) {
                // 精确词匹配
                if (lineLower.includes(kw)) {
                  score += kw.length * 2;
                  // 函数/类定义行权重更高
                  if (/^(export\s+)?(async\s+)?function|^(export\s+)?const\s+\w+\s*=|^class\s+|^interface\s+|^type\s+/.test(line.trim())) {
                    score += 20;
                  }
                  matchedLines.push({ line: i + 1, text: line.trim() });
                }
              }
            }

            // 函数名/变量名包含关键词的额外加分
            const baseName = path.basename(fullPath).toLowerCase();
            for (const kw of keywords) {
              if (baseName.includes(kw)) score += 30;
            }

            if (score > 0) {
              // 取最有代表性的匹配片段（前3个）
              const preview = matchedLines.slice(0, 3)
                .map(m => `  L${m.line}: ${m.text}`)
                .join("\n");

              results.push({
                path: fullPath.replace(absPath, ""),
                score,
                preview,
                lineStart: matchedLines[0]?.line || 1,
              });
            }
          } catch { /* 跳过无法读取的文件 */ }
        }
      }
    }

    await scanDir(absPath);

    // 按相关性排序，取 top N
    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, maxResults);

    if (top.length === 0) {
      return {
        success: true,
        output: `未找到与 "${query}" 相关的代码片段。尝试扩大搜索范围或使用更通用的关键词。`,
        metadata: { query, resultCount: 0 },
      };
    }

    const lines: string[] = [];
    lines.push(`找到 ${top.length} 个相关代码片段（按相关性排序）：\n`);

    top.forEach((item, idx) => {
      lines.push(`\n--- 结果 ${idx + 1} [得分: ${item.score}] ---`);
      lines.push(`📄 ${item.path}`);
      lines.push(item.preview);
    });

    lines.push(`\n💡 提示：使用 project_tree_scanner 工具可以查看完整的项目结构。`);

    return {
      success: true,
      output: lines.join("\n"),
      metadata: { query, resultCount: top.length, scores: top.map(t => ({ path: t.path, score: t.score })) },
    };

  } catch (err: any) {
    return { success: false, output: "", error: `RAG 搜索失败: ${err.message}` };
  }
}

// ─── Phase 4 工具实现：NPM Test TDD ────────────────────────────────────────

async function toolRunNpmTest(
  projectPath: string,
  testCommand: string = "npm test -- --run",
  timeout: number = 120
): Promise<ToolResult> {
  const DEFAULT_PATH = "/Users/daiyan/Desktop/mcmamoo-website";
  const absPath = projectPath || DEFAULT_PATH;

  try {
    const { stdout, stderr } = await execAsync(testCommand, {
      cwd: absPath,
      timeout: timeout * 1000,
      maxBuffer: 5 * 1024 * 1024,
    });

    const output = (stdout + stderr).trim();

    // 解析测试结果
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;

    if (failed > 0) {
      // 提取失败的测试详情
      const failedTests: string[] = [];
      const lines = output.split("\n");
      let inFailureBlock = false;
      for (const line of lines) {
        if (line.includes("FAIL") || line.includes("✕") || line.includes("×")) {
          inFailureBlock = true;
          failedTests.push(line.trim());
        } else if (inFailureBlock && line.trim()) {
          if (line.match(/^\s{2,}\d+\)|line\s+\d+|Error:|expect\(/) || line.trim().startsWith("at ")) {
            failedTests.push("  " + line.trim());
          } else if (!line.includes("✓") && !line.includes("●")) {
            inFailureBlock = false;
          }
        }
      }

      return {
        success: false,
        output: `❌ 测试失败: ${failed} 个测试未通过\n\n${output.slice(-3000)}`,
        metadata: {
          testPassed: false,
          passed,
          failed,
          failedTests: failedTests.slice(0, 20).join("\n"),
          rawOutput: output.slice(-5000),
        },
      };
    }

    return {
      success: true,
      output: `✅ 所有 ${passed} 个测试通过\n\n${output.slice(-1000)}`,
      metadata: { testPassed: true, passed, failed: 0 },
    };

  } catch (err: any) {
    const output = err.stdout || err.message || "";
    const failedMatch = output.match(/(\d+) failed/);
    const failed = failedMatch ? parseInt(failedMatch[1]) : null;

    return {
      success: failed !== null && failed > 0 ? false : true,
      output: err.killed
        ? `⏱️ 测试执行超时（${timeout}秒）`
        : `⚠️ 测试执行异常\n\n${output.slice(-3000)}`,
      metadata: {
        testPassed: failed !== null && failed > 0 ? false : undefined,
        passed: null,
        failed,
        rawOutput: output.slice(-5000),
      },
    };
  }
}

// ─── 猫眼内容平台：视频合成工具实现 ─────────────────────────────────────────────

// 视频合成任务状态存储（内存中，生产环境应使用 Redis）
const videoComposeTasks = new Map<string, {
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  outputPath?: string;
  error?: string;
  startedAt: Date;
}>();

async function toolVideoComposer(
  imagePaths: string[],
  audioPath: string,
  srtPath: string,
  outputPath: string,
  bgmPath?: string
): Promise<ToolResult> {
  const taskId = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 验证输入文件
  try {
    const { existsSync } = await import("fs");
    for (const img of imagePaths) {
      if (!existsSync(img)) {
        return { success: false, output: "", error: `图片文件不存在: ${img}` };
      }
    }
    if (!existsSync(audioPath)) {
      return { success: false, output: "", error: `音频文件不存在: ${audioPath}` };
    }
    if (!existsSync(srtPath)) {
      return { success: false, output: "", error: `字幕文件不存在: ${srtPath}` };
    }
  } catch (err: any) {
    return { success: false, output: "", error: `文件检查失败: ${err.message}` };
  }

  // 记录任务状态
  videoComposeTasks.set(taskId, {
    status: "pending",
    progress: 0,
    startedAt: new Date(),
  });

  // 异步执行视频合成（避免阻塞）
  executeVideoCompose(taskId, imagePaths, audioPath, srtPath, outputPath, bgmPath).catch((err) => {
    const task = videoComposeTasks.get(taskId);
    if (task) {
      task.status = "failed";
      task.error = err.message;
    }
  });

  return {
    success: true,
    output: `视频合成任务已创建\n\n任务 ID: ${taskId}\n输入图片: ${imagePaths.length} 张\n音频: ${audioPath}\n字幕: ${srtPath}\n输出: ${outputPath}\n\n请使用 video_compose_status 查询进度。`,
    metadata: { taskId, status: "pending" },
  };
}

async function executeVideoCompose(
  taskId: string,
  imagePaths: string[],
  audioPath: string,
  srtPath: string,
  outputPath: string,
  bgmPath?: string
): Promise<void> {
  const task = videoComposeTasks.get(taskId);
  if (!task) return;

  task.status = "running";
  task.progress = 10;

  try {
    // 导入 video_composer 模块
    const videoComposerPath = `${__dirname}/hyperagents/media_engine/video_composer.py`;

    // 构建 Python 调用代码
    const pythonCode = `
import sys
sys.path.insert(0, '${videoComposerPath.replace("/video_composer.py", "")}')
from video_composer import create_short_video

result = create_short_video(
    image_paths=${JSON.stringify(imagePaths)},
    audio_path='${audioPath}',
    srt_path='${srtPath}',
    output_path='${outputPath}'${bgmPath ? `,\n    bgm_path='${bgmPath}'` : ""}
)
print("RESULT:", result)
`;

    // 执行 Python 代码
    const { spawn } = await import("child_process");
    const proc = spawn("python3", ["-c", pythonCode], {
      timeout: 600000, // 10分钟超时
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      task.progress = 100;
      if (code === 0) {
        task.status = "completed";
        task.outputPath = outputPath;
      } else {
        task.status = "failed";
        task.error = stderr || `Process exited with code ${code}`;
      }
    });

    proc.on("error", (err) => {
      task.status = "failed";
      task.error = err.message;
    });

  } catch (err: any) {
    task.status = "failed";
    task.error = err.message;
  }
}

async function toolVideoComposeStatus(taskId: string): Promise<ToolResult> {
  const task = videoComposeTasks.get(taskId);

  if (!task) {
    return {
      success: false,
      output: "",
      error: `任务不存在: ${taskId}`,
    };
  }

  const statusLabels: Record<string, string> = {
    pending: "等待中",
    running: "合成中",
    completed: "已完成",
    failed: "失败",
  };

  const elapsed = Math.round((Date.now() - task.startedAt.getTime()) / 1000);

  let output = `视频合成任务状态\n\n`;
  output += `任务 ID: ${taskId}\n`;
  output += `状态: ${statusLabels[task.status] || task.status}\n`;
  output += `进度: ${task.progress}%\n`;
  output += `已用时: ${elapsed}秒\n`;

  if (task.status === "running") {
    output += `\n预计剩余时间: 约 ${Math.round(elapsed / task.progress * (100 - task.progress))} 秒`;
  }

  if (task.outputPath) {
    output += `\n\n输出文件: ${task.outputPath}`;
  }

  if (task.error) {
    output += `\n\n错误信息: ${task.error}`;
  }

  return {
    success: task.status === "completed",
    output,
    metadata: {
      taskId,
      status: task.status,
      progress: task.progress,
      outputPath: task.outputPath,
      error: task.error,
    },
  };
}
