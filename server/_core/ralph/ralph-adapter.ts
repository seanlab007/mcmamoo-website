/**
 * ralph-adapter.ts
 * Ralph × MaoAI Core 2.0 整合适配层
 * 
 * Ralph 本质：AI 自主迭代工作流框架（非高并发调度引擎）
 * 核心价值：任务粒度控制 + 质量门禁 + 知识沉淀
 * 
 * 整合策略：
 *  - Ralph 控制"任务级别"（User Story 编排）
 *  - Triad Loop 控制"实现级别"（Coder/Reviewer/Validator 博弈）
 */

import { EventEmitter } from "events";
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { spawn } from "child_process";
import { executeTriadLoop, TriadTaskResult } from "../triadLoopIntegration";
import { dbFetch } from "../aiNodes";

// ============================================================================
// Types - Ralph × Triad 融合接口
// ============================================================================

export interface RalphPrdConfig {
  project: string;
  branchName: string;
  description: string;
  userStories: RalphUserStory[];
  metadata: RalphMetadata;
}

export interface RalphUserStory {
  id: string;                    // US-001
  title: string;                 // "Implement login API"
  description: string;            // As a user, I want to login...
  acceptanceCriteria: string[];   // Quality gates for this story
  priority: number;              // 1 = highest
  passes: boolean;
  assignee?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  
  // Ralph × Triad 融合字段
  triadConfig?: TriadConfig;
  progress?: string;              // Current progress notes
  iterations?: RalphIteration[];  // History of iterations
}

export interface TriadConfig {
  coder: string;                 // "claude-sonnet-4"
  reviewer: string;              // "gpt-4o"
  validator: "docker" | "local" | "none";
  maxIterations?: number;        // Default 5
  scoreThreshold?: number;       // Default 80
  language?: string;              // "python" | "typescript" | "auto"
}

export interface RalphIteration {
  iterationNumber: number;
  startedAt: string;
  completedAt?: string;
  status: "pending" | "running" | "passed" | "failed" | "escalated";
  triadResult?: TriadTaskResult;
  learnings?: string[];
  issues?: string[];
  score?: number;
}

export interface RalphMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: string;
  baseBranch: string;
  targetBranch: string;
}

export interface RalphProgress {
  learnings: ProgressEntry[];
  patterns: PatternEntry[];
  gotchas: GotchaEntry[];
}

export interface ProgressEntry {
  timestamp: string;
  taskId: string;
  threadUrl?: string;
  content: string;
  tags?: string[];
}

export interface PatternEntry {
  pattern: string;
  discoveredIn: string;           // US-XXX
  description: string;
  applicability: string;
}

export interface GotchaEntry {
  gotcha: string;
  discoveredIn: string;
  workaround?: string;
}

// ============================================================================
// Ralph Adapter - 核心适配器类
// ============================================================================

export class RalphAdapter extends EventEmitter {
  private prdPath: string;
  private progressPath: string;
  private agentsPath: string;
  private workspace: string;
  private currentStory: RalphUserStory | null = null;
  
  constructor(workspace: string = process.cwd()) {
    super();
    this.workspace = workspace;
    this.prdPath = join(workspace, "ralph-prd.json");
    this.progressPath = join(workspace, "progress.txt");
    this.agentsPath = join(workspace, "AGENTS.md");
  }
  
  // ==========================================================================
  // PRD.json 管理
  // ==========================================================================
  
  /**
   * 加载或初始化 PRD 文件
   */
  async loadPrd(): Promise<RalphPrdConfig> {
    if (existsSync(this.prdPath)) {
      try {
        const content = readFileSync(this.prdPath, "utf-8");
        return JSON.parse(content);
      } catch (e) {
        console.error("[Ralph] Failed to parse prd.json:", e);
        throw new Error("Invalid prd.json format");
      }
    }
    throw new Error(`prd.json not found at ${this.prdPath}`);
  }
  
  /**
   * 保存 PRD 文件
   */
  async savePrd(prd: RalphPrdConfig): Promise<void> {
    prd.metadata.updatedAt = new Date().toISOString();
    writeFileSync(this.prdPath, JSON.stringify(prd, null, 2), "utf-8");
    this.emit("prd:updated", prd);
  }
  
  /**
   * 创建新的 PRD
   */
  async initPrd(config: {
    project: string;
    description: string;
    createdBy: string;
    baseBranch?: string;
    targetBranch?: string;
  }): Promise<RalphPrdConfig> {
    const prd: RalphPrdConfig = {
      project: config.project,
      branchName: config.targetBranch || `ralph/${config.project.toLowerCase().replace(/\s+/g, "-")}`,
      description: config.description,
      userStories: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: config.createdBy,
        version: "1.0.0",
        baseBranch: config.baseBranch || "main",
        targetBranch: config.targetBranch || `ralph/${config.project.toLowerCase().replace(/\s+/g, "-")}`,
      },
    };
    
    await this.savePrd(prd);
    await this.ensureProgressExists();
    return prd;
  }
  
  /**
   * 添加 User Story
   */
  async addUserStory(story: Omit<RalphUserStory, "id" | "passes" | "createdAt" | "updatedAt">): Promise<string> {
    const prd = await this.loadPrd();
    
    const storyId = `US-${String(prd.userStories.length + 1).padStart(3, "0")}`;
    const newStory: RalphUserStory = {
      ...story,
      id: storyId,
      passes: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    prd.userStories.push(newStory);
    prd.userStories.sort((a, b) => b.priority - a.priority); // 按优先级排序
    await this.savePrd(prd);
    
    this.emit("story:added", newStory);
    return storyId;
  }
  
  /**
   * 获取下一个待处理的高优先级 Story
   */
  async getNextStory(): Promise<RalphUserStory | null> {
    const prd = await this.loadPrd();
    const pendingStories = prd.userStories.filter((s) => !s.passes);
    
    if (pendingStories.length === 0) {
      return null;
    }
    
    // 返回最高优先级（已排序）
    return pendingStories[0];
  }
  
  /**
   * 更新 Story 状态
   */
  async updateStory(storyId: string, updates: Partial<RalphUserStory>): Promise<void> {
    const prd = await this.loadPrd();
    const storyIndex = prd.userStories.findIndex((s) => s.id === storyId);
    
    if (storyIndex === -1) {
      throw new Error(`Story not found: ${storyId}`);
    }
    
    prd.userStories[storyIndex] = {
      ...prd.userStories[storyIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await this.savePrd(prd);
    this.emit("story:updated", prd.userStories[storyIndex]);
  }
  
  // ==========================================================================
  // Progress.txt 管理（跨会话记忆）
  // ==========================================================================
  
  /**
   * 确保 progress.txt 存在
   */
  private async ensureProgressExists(): Promise<void> {
    if (!existsSync(this.progressPath)) {
      const header = `# Ralph Progress Log - ${this.workspace}\n\n`;
      writeFileSync(this.progressPath, header, "utf-8");
    }
  }
  
  /**
   * 追加学习记录到 progress.txt
   */
  async appendLearning(entry: {
    taskId: string;
    threadUrl?: string;
    content: string;
    tags?: string[];
  }): Promise<void> {
    await this.ensureProgressExists();
    
    const timestamp = new Date().toISOString();
    let content = `\n## ${timestamp} - ${entry.taskId}\n`;
    
    if (entry.threadUrl) {
      content += `Thread: ${entry.threadUrl}\n`;
    }
    
    content += entry.content;
    
    if (entry.tags && entry.tags.length > 0) {
      content += `\nTags: ${entry.tags.join(", ")}`;
    }
    
    appendFileSync(this.progressPath, content + "\n", "utf-8");
    this.emit("progress:appended", entry);
  }
  
  /**
   * 记录 Triad 博弈结果到 progress.txt
   */
  async recordTriadOutcome(
    storyId: string,
    result: TriadTaskResult,
    patterns: { discovered?: string[]; gotchas?: string[] }
  ): Promise<void> {
    const learning = `
### Triad Outcome
- Status: ${result.status}
- Score: ${result.finalScore}/100
- Rounds: ${result.totalRounds}
- Time: ${result.totalTime}s

### Patterns Discovered:
${(patterns.discovered || []).map((p) => `- ${p}`).join("\n") || "  None"}

### Gotchas:
${(patterns.gotchas || []).map((g) => `- ${g}`).join("\n") || "  None"}
`;
    
    await this.appendLearning({
      taskId: storyId,
      content: learning,
      tags: ["triad", result.status],
    });
  }
  
  /**
   * 读取 progress.txt 内容
   */
  readProgress(): string {
    if (!existsSync(this.progressPath)) {
      return "";
    }
    return readFileSync(this.progressPath, "utf-8");
  }
  
  // ==========================================================================
  // Ralph Loop 执行引擎（串行迭代）
  // ==========================================================================
  
  /**
   * 执行单个 User Story（通过 Triad Loop）
   * 
   * Ralph 的每次迭代都是串行执行：
   * 1. 读取 prd.json → 找最高优先级未完成任务
   * 2. 加载 progress.txt → 获取 Codebase Patterns
   * 3. Spawn Triad Loop → 执行单个 User Story
   * 4. 运行质量检查 → typecheck, lint, test
   * 5. 更新 prd.json → passes: true/false
   * 6. 追加 progress.txt → 记录 Learnings
   */
  async executeStory(storyId: string): Promise<RalphIteration> {
    const prd = await this.loadPrd();
    const story = prd.userStories.find((s) => s.id === storyId);
    
    if (!story) {
      throw new Error(`Story not found: ${storyId}`);
    }
    
    this.currentStory = story;
    const iterationNumber = (story.iterations?.length || 0) + 1;
    
    const iteration: RalphIteration = {
      iterationNumber,
      startedAt: new Date().toISOString(),
      status: "running",
    };
    
    this.emit("iteration:started", { storyId, iterationNumber });
    
    try {
      // 使用 Triad Loop 执行
      const triadConfig = story.triadConfig || {
        coder: "claude-sonnet-4",
        reviewer: "gpt-4o",
        validator: "local" as const,
        maxIterations: 5,
        scoreThreshold: 80,
      };
      
      const triadResult = await executeTriadLoop({
        taskId: 0, // 内部生成
        task: `[${storyId}] ${story.title}: ${story.description}`,
        language: triadConfig.language || "auto",
        mode: "generate",
        context: {
          acceptanceCriteria: story.acceptanceCriteria,
          progress: this.readProgress(),
        },
      });
      
      iteration.triadResult = triadResult;
      iteration.score = triadResult.finalScore;
      iteration.completedAt = new Date().toISOString();
      
      // 判断是否通过质量门禁
      const threshold = triadConfig.scoreThreshold || 80;
      const passed = triadResult.status === "approved" && (triadResult.finalScore || 0) >= threshold;
      
      iteration.status = passed ? "passed" : "failed";
      
      // 记录到 progress.txt
      await this.recordTriadOutcome(storyId, triadResult, {
        discovered: [],
        gotchas: [],
      });
      
      // 更新 Story 状态
      if (passed) {
        await this.updateStory(storyId, {
          passes: true,
          iterations: [...(story.iterations || []), iteration],
        });
      } else {
        await this.updateStory(storyId, {
          iterations: [...(story.iterations || []), iteration],
          progress: `Iteration ${iterationNumber} failed with score ${iteration.score}. Needs revision.`,
        });
      }
      
      this.emit("iteration:completed", { storyId, iteration, passed });
      return iteration;
      
    } catch (error: any) {
      iteration.status = "failed";
      iteration.issues = [error.message];
      iteration.completedAt = new Date().toISOString();
      
      await this.updateStory(storyId, {
        iterations: [...(story.iterations || []), iteration],
        progress: `Iteration ${iterationNumber} error: ${error.message}`,
      });
      
      this.emit("iteration:failed", { storyId, iteration, error });
      return iteration;
    }
  }
  
  /**
   * 执行完整的 Ralph Loop
   * 
   * Ralph Loop = 串行执行所有未完成的 User Stories
   */
  async runLoop(maxIterationsPerStory: number = 5): Promise<{
    completed: number;
    failed: number;
    stories: RalphUserStory[];
  }> {
    const prd = await this.loadPrd();
    let completed = 0;
    let failed = 0;
    
    this.emit("loop:started", prd);
    
    while (true) {
      const story = await this.getNextStory();
      
      if (!story) {
        console.log("[Ralph] All stories completed!");
        break;
      }
      
      console.log(`[Ralph] Processing ${story.id}: ${story.title}`);
      
      // 检查单 Story 最大迭代次数
      const currentIterations = (story.iterations?.length || 0);
      if (currentIterations >= maxIterationsPerStory) {
        console.warn(`[Ralph] ${story.id} exceeded max iterations (${maxIterationsPerStory}), skipping...`);
        failed++;
        continue;
      }
      
      const iteration = await this.executeStory(story.id);
      
      if (iteration.status === "passed") {
        completed++;
      } else if (iteration.status === "failed") {
        failed++;
      }
    }
    
    const finalPrd = await this.loadPrd();
    
    this.emit("loop:completed", { completed, failed, stories: finalPrd.userStories });
    
    return { completed, failed, stories: finalPrd.userStories };
  }
  
  // ==========================================================================
  // Git 状态机集成
  // ==========================================================================
  
  /**
   * 检查当前 Git 状态
   */
  async getGitStatus(): Promise<{
    branch: string;
    isDirty: boolean;
    uncommittedFiles: string[];
  }> {
    return new Promise((resolve) => {
      const proc = spawn("git", ["status", "--porcelain"], {
        cwd: this.workspace,
      });
      
      let output = "";
      proc.stdout?.on("data", (data) => { output += data.toString(); });
      proc.on("close", () => {
        const files = output.trim().split("\n").filter((l) => l.trim());
        resolve({
          branch: "unknown", // 需要单独获取
          isDirty: files.length > 0,
          uncommittedFiles: files,
        });
      });
    });
  }
  
  /**
   * 创建 Ralph 分支
   */
  async createBranch(branchName?: string): Promise<string> {
    const prd = await this.loadPrd();
    const name = branchName || prd.metadata.targetBranch;
    
    return new Promise((resolve, reject) => {
      const proc = spawn("git", ["checkout", "-b", name], {
        cwd: this.workspace,
      });
      
      proc.on("close", (code) => {
        if (code === 0) {
          this.emit("branch:created", name);
          resolve(name);
        } else {
          reject(new Error(`Failed to create branch: ${code}`));
        }
      });
    });
  }
  
  /**
   * 提交 Story 完成
   */
  async commitStory(storyId: string, message?: string): Promise<void> {
    const prd = await this.loadPrd();
    const story = prd.userStories.find((s) => s.id === storyId);
    
    if (!story) {
      throw new Error(`Story not found: ${storyId}`);
    }
    
    const msg = message || `feat(${storyId}): ${story.title}`;
    
    return new Promise((resolve, reject) => {
      const addProc = spawn("git", ["add", "-A"], { cwd: this.workspace });
      addProc.on("close", () => {
        const commitProc = spawn("git", ["commit", "-m", msg], {
          cwd: this.workspace,
        });
        commitProc.on("close", (code) => {
          if (code === 0) {
            this.emit("story:committed", { storyId, message: msg });
            resolve();
          } else {
            reject(new Error(`Failed to commit: ${code}`));
          }
        });
      });
    });
  }
  
  // ==========================================================================
  // 辅助方法
  // ==========================================================================
  
  /**
   * 计算项目进度
   */
  async getProgress(): Promise<{
    total: number;
    completed: number;
    percentage: number;
    currentStory: RalphUserStory | null;
  }> {
    const prd = await this.loadPrd();
    const total = prd.userStories.length;
    const completed = prd.userStories.filter((s) => s.passes).length;
    
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      currentStory: await this.getNextStory(),
    };
  }
  
  /**
   * 导出为 CLI 格式（兼容 ralph.sh）
   */
  toRalphScript(): string {
    return `#!/bin/bash
# Ralph × MaoAI Core 2.0 执行脚本
# 由 ralph-adapter.ts 生成

RALPH_PRD="${this.prdPath}"
RALPH_PROGRESS="${this.progressPath}"

echo "[Ralph] Starting execution loop..."
echo "[Ralph] PRD: $RALPH_PRD"
echo "[Ralph] Progress: $RALPH_PROGRESS"

# 读取最高优先级未完成 Story 并执行
# （实际执行由 TypeScript RalphAdapter.runLoop() 处理）
`;
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

export function createRalphAdapter(workspace?: string): RalphAdapter {
  return new RalphAdapter(workspace);
}

// ============================================================================
// 默认导出
// ============================================================================

export default RalphAdapter;
