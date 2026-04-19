/**
 * CLI Proxy Compressor — CLI 输出代理压缩器
 *
 * 灵感来源：RTK - Rust Token Killer (rtk-ai/rtk)
 * RTK 是一个高性能 CLI 代理，可以减少 60-90% 的 LLM token 消耗。
 *
 * 在 MaoAI 中，我们不需要完整的 Rust CLI 代理，
 * 而是在服务端对 run_shell / run_code 等工具的输出进行
 * 过滤和压缩，模拟 RTK 的核心行为：
 *
 *   1. 环境变量过滤：去除不必要的 env 输出
 *   2. 进度条过滤：去除 progress bar 输出
 *   3. 版本信息压缩：只保留关键版本号
 *   4. 依赖列表压缩：只保留相关依赖
 *   5. 日志级别过滤：只保留 WARN/ERROR
 *   6. 文件树压缩：只显示关键层级
 */

import { OutputCompactor } from "./outputCompactor";

export interface CliCompressOptions {
  /** 日志级别过滤：只保留此级别及以上 */
  minLogLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR" | "NONE";
  /** 是否过滤环境变量输出 */
  filterEnvVars?: boolean;
  /** 是否过滤进度条 */
  filterProgressBars?: boolean;
  /** 是否压缩版本信息 */
  compressVersions?: boolean;
  /** 是否压缩依赖列表 */
  compressDeps?: boolean;
  /** 是否压缩文件树 */
  compressFileTree?: boolean;
  /** 最大输出字符数 */
  maxOutputChars?: number;
}

// 进度条模式（npm、pip、cargo、wget 等）
const PROGRESS_BAR_PATTERNS = [
  /\r[=#\-.*]+\s*\d+%/g,                        // 通用进度条
  /⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏/g,                          // spinner
  /\r\s*\d+\/\d+\s/g,                            // 计数器
  /^\s*[╭╰│├─]+.*$/gm,                          // 树形进度
];

// 日志级别
const LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL", "TRACE"];
const LOG_LEVEL_ORDER: Record<string, number> = {
  TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5,
};

// 版本信息模式
const VERSION_OUTPUT = /^(npm|node|python|pip|go|cargo|rustc|java|ruby|gem)\s+v?[\d.]+/gm;

// env 输出模式
const ENV_VAR_OUTPUT = /^(PATH|HOME|USER|SHELL|LANG|TERM|PWD|EDITOR|NVM_|PYENV_|CONDA_)=/gm;

// 文件树模式
const FILE_TREE_LINE = /^[│├└─\s]+\S/m;

export class CliProxyCompressor {
  private options: Required<CliCompressOptions>;
  private outputCompactor: OutputCompactor;

  constructor(options: CliCompressOptions = {}) {
    this.options = {
      minLogLevel: options.minLogLevel ?? "INFO",
      filterEnvVars: options.filterEnvVars ?? true,
      filterProgressBars: options.filterProgressBars ?? true,
      compressVersions: options.compressVersions ?? true,
      compressDeps: options.compressDeps ?? true,
      compressFileTree: options.compressFileTree ?? true,
      maxOutputChars: options.maxOutputChars ?? 6000,
    };

    this.outputCompactor = new OutputCompactor({
      maxOutputChars: this.options.maxOutputChars,
      simplifyPaths: true,
      foldDuplicates: true,
      compactStackTraces: true,
      normalizeTimestamps: true,
    });
  }

  /**
   * 压缩 CLI 工具输出
   * 先应用 CLI 特定过滤，再通过 OutputCompactor 做通用压缩
   */
  compress(output: string, toolName?: string): string {
    if (!output || typeof output !== "string") return output || "";
    if (output.length < 100) return output; // 短输出不压缩

    let result = output;

    // 1. 过滤进度条
    if (this.options.filterProgressBars) {
      result = this.filterProgressBars(result);
    }

    // 2. 日志级别过滤
    result = this.filterByLogLevel(result);

    // 3. 过滤环境变量输出
    if (this.options.filterEnvVars) {
      result = this.filterEnvVars(result);
    }

    // 4. 压缩版本信息
    if (this.options.compressVersions) {
      result = this.compressVersionInfo(result);
    }

    // 5. 压缩依赖列表
    if (this.options.compressDeps) {
      result = this.compressDependencyList(result);
    }

    // 6. 压缩文件树
    if (this.options.compressFileTree) {
      result = this.compressFileTreeOutput(result);
    }

    // 7. 通用输出压缩
    const compacted = this.outputCompactor.compact(result, toolName);
    return compacted.text;
  }

  /**
   * 获取压缩统计信息
   */
  compressWithStats(output: string, toolName?: string): {
    text: string;
    originalChars: number;
    compressedChars: number;
    savedTokens: number;
    ratio: number;
  } {
    const originalChars = output.length;
    const text = this.compress(output, toolName);
    const compressedChars = text.length;
    const savedTokens = Math.floor((originalChars - compressedChars) / 4);
    const ratio = originalChars > 0 ? compressedChars / originalChars : 1;

    return { text, originalChars, compressedChars, savedTokens, ratio };
  }

  /**
   * 过滤进度条输出
   */
  private filterProgressBars(text: string): string {
    let result = text;
    for (const pattern of PROGRESS_BAR_PATTERNS) {
      result = result.replace(pattern, "");
    }
    // 清理 \r 开头的行（通常是进度条覆写）
    result = result.replace(/^\r.+/gm, "");
    return result;
  }

  /**
   * 按日志级别过滤
   */
  private filterByLogLevel(text: string): string {
    const minLevel = LOG_LEVEL_ORDER[this.options.minLogLevel] ?? 2;
    const lines = text.split("\n");

    return lines.filter((line) => {
      // 检查是否包含日志级别标记
      for (const level of LOG_LEVELS) {
        const levelOrder = LOG_LEVEL_ORDER[level] ?? 0;
        // 匹配常见日志格式：[LEVEL]、LEVEL:、|LEVEL|
        const regex = new RegExp(`\\[?${level}\\]?[\\s:]`, "i");
        if (regex.test(line)) {
          return levelOrder >= minLevel;
        }
      }
      // 没有日志级别的行保留
      return true;
    }).join("\n");
  }

  /**
   * 过滤环境变量输出
   */
  private filterEnvVars(text: string): string {
    // 如果输出看起来是 env/printenv 命令的结果
    const lines = text.split("\n");
    const envLines = lines.filter((line) => /^[A-Z_]+=.+/.test(line));

    // 如果超过 10 行是环境变量，只保留关键的
    if (envLines.length > 10) {
      const importantEnvPrefixes = ["PATH", "NODE", "PYTHON", "JAVA", "GO", "RUST", "DOCKER", "KUBE", "AWS", "API_KEY"];
      const filtered = lines.filter((line) => {
        if (!/^[A-Z_]+=.+/.test(line)) return true;
        return importantEnvPrefixes.some((prefix) => line.startsWith(prefix));
      });
      if (envLines.length > filtered.filter((l) => /^[A-Z_]+=.+/.test(l)).length) {
        const removedCount = envLines.length - filtered.filter((l) => /^[A-Z_]+=.+/.test(l)).length;
        return filtered.join("\n") + `\n[... 省略 ${removedCount} 个环境变量 ...]`;
      }
    }

    return text;
  }

  /**
   * 压缩版本信息
   */
  private compressVersionInfo(text: string): string {
    // 收集所有版本信息
    const versions: string[] = [];
    const cleaned = text.replace(VERSION_OUTPUT, (match) => {
      versions.push(match.trim());
      return "";
    });

    if (versions.length === 0) return text;

    // 添加压缩后的版本信息
    const versionSummary = versions.join(", ");
    return `[版本: ${versionSummary}]\n` + cleaned.replace(/^\s*\n/gm, "");
  }

  /**
   * 压缩依赖列表
   */
  private compressDependencyList(text: string): string {
    // 检测 npm list / pip list / cargo tree 等输出
    const depPatterns = [
      /(?:├|└|─)\s+[@\w\-/]+@[\d.]+/g,  // npm list
      /^\s*\w+\s+[\d.]+$/gm,              // pip list
    ];

    let result = text;
    for (const pattern of depPatterns) {
      const matches = result.match(pattern);
      if (matches && matches.length > 15) {
        // 只保留前 10 个和最后 5 个
        const kept = [...matches.slice(0, 10), `  [... 省略 ${matches.length - 15} 个依赖 ...]`, ...matches.slice(-5)];
        // 逐个替换
        let matchIdx = 0;
        result = result.replace(pattern, () => {
          if (matchIdx < kept.length) return kept[matchIdx++];
          return "";
        });
      }
    }

    return result;
  }

  /**
   * 压缩文件树输出
   */
  private compressFileTreeOutput(text: string): string {
    const lines = text.split("\n");
    const treeLines: number[] = [];

    lines.forEach((line, idx) => {
      if (FILE_TREE_LINE.test(line) || /^[├└]/.test(line)) {
        treeLines.push(idx);
      }
    });

    // 如果文件树行数 > 20，只保留前 10 行和最后 5 行
    if (treeLines.length > 20) {
      const keepStart = treeLines.slice(0, 10);
      const keepEnd = treeLines.slice(-5);
      const keepSet = new Set([...keepStart, ...keepEnd]);

      const result: string[] = [];
      let inOmit = false;
      for (let i = 0; i < lines.length; i++) {
        if (treeLines.includes(i)) {
          if (keepSet.has(i)) {
            result.push(lines[i]);
            inOmit = false;
          } else if (!inOmit) {
            result.push(`  [... 省略 ${treeLines.length - 15} 个文件/目录 ...]`);
            inOmit = true;
          }
        } else {
          result.push(lines[i]);
        }
      }
      return result.join("\n");
    }

    return text;
  }
}
