/**
 * triadLoopIntegration.ts
 * TriadLoop 三权分立博弈循环集成层
 *
 * 职责：
 *  1. 将 contentPlatform 的任务请求转换为 TriadLoop 执行任务
 *  2. 管理 TriadLoop 的初始化和调用
 *  3. 处理结果回写和状态同步
 */

import { spawn } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { dbFetch } from "./aiNodes";
import { updateContentTask } from "./contentPlatform";

const TRIAD_SCRIPT = join(__dirname, "hyperagents/agent/triad_loop.py");

export interface TriadTaskRequest {
  taskId: number;
  task: string;
  language?: string;
  mode?: "fix" | "generate";
  workspace?: string;
  context?: Record<string, any>;
}

export interface TriadTaskResult {
  success: boolean;
  status: "approved" | "rejected" | "error";
  finalCode?: string;
  finalScore?: number;
  totalRounds?: number;
  totalTime?: number;
  feedback?: string;
  errorMessage?: string;
}

/**
 * 执行 TriadLoop 任务
 */
export async function executeTriadLoop(request: TriadTaskRequest): Promise<TriadTaskResult> {
  const { taskId, task, language = "python", mode = "fix", workspace, context = {} } = request;

  console.log(`[TriadLoop] Starting task #${taskId}: ${task.substring(0, 50)}...`);

  // 创建临时工作目录
  const tempDir = mkdtempSync(join(tmpdir(), "triad-"));

  try {
    // 准备上下文文件
    const contextFile = join(tempDir, "context.json");
    writeFileSync(contextFile, JSON.stringify(context, null, 2));

    // 构建命令参数
    const args = [
      TRIAD_SCRIPT,
      "--task", task,
      "--workspace", workspace || tempDir,
      "--language", language,
      "--mode", mode,
      "--max-iterations", "5",
      "--score-threshold", "0.8",
      // Phase 5 功能
      "--no-rag",          // RAG 可选启用
      "--no-atomic",       // 原子化模式可选
    ];

    // 执行 Python 脚本
    const result = await executePython(args);

    // 解析结果
    if (result.success) {
      console.log(`[TriadLoop] Task #${taskId} completed successfully`);

      // 更新任务状态
      await updateContentTask(taskId, {
        status: "success",
        result: {
          finalCode: result.finalCode,
          finalScore: result.finalScore,
          totalRounds: result.totalRounds,
          totalTime: result.totalTime,
          mode: "triad_loop",
        },
      });

      return {
        success: true,
        status: result.status,
        finalCode: result.finalCode,
        finalScore: result.finalScore,
        totalRounds: result.totalRounds,
        totalTime: result.totalTime,
        feedback: result.feedback,
      };
    } else {
      console.error(`[TriadLoop] Task #${taskId} failed:`, result.errorMessage);

      await updateContentTask(taskId, {
        status: "failed",
        errorMessage: result.errorMessage || "TriadLoop execution failed",
      });

      return {
        success: false,
        status: "error",
        errorMessage: result.errorMessage,
      };
    }
  } catch (error: any) {
    console.error(`[TriadLoop] Task #${taskId} exception:`, error);

    await updateContentTask(taskId, {
      status: "failed",
      errorMessage: error?.message || String(error),
    });

    return {
      success: false,
      status: "error",
      errorMessage: error?.message || String(error),
    };
  } finally {
    // 清理临时目录
    try {
      // 注意：这里应该递归删除整个目录，但简化起见只清理已知文件
      unlinkSync(join(tempDir, "context.json"));
    } catch {
      // 忽略清理错误
    }
  }
}

/**
 * 执行 Python 脚本并返回结果
 */
function executePython(args: string[]): Promise<{
  success: boolean;
  status: "approved" | "rejected" | "error";
  finalCode?: string;
  finalScore?: number;
  totalRounds?: number;
  totalTime?: number;
  feedback?: string;
  errorMessage?: string;
}> {
  return new Promise((resolve) => {
    const proc = spawn("python3", args, {
      cwd: tmpdir(),
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 300000, // 5分钟超时
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
      // 尝试从 stdout 解析 JSON 结果
      try {
        // 找到最后一个 JSON 对象
        const jsonMatches = stdout.match(/\{[\s\S]*?\}/g);
        if (jsonMatches) {
          const lastJson = jsonMatches[jsonMatches.length - 1];
          const result = JSON.parse(lastJson);

          // 检查是否三权分立全部通过
          const approved = stdout.includes("✓ 全部通过") || stdout.includes("三权分立全部通过");

          resolve({
            success: approved || code === 0,
            status: approved ? "approved" : "rejected",
            finalCode: result.final_code || result.finalCode,
            finalScore: result.final_score || result.finalScore || 0,
            totalRounds: result.total_rounds || result.totalRounds,
            totalTime: result.total_time || result.totalTime,
            feedback: result.feedback,
          });
        } else {
          resolve({
            success: false,
            status: "error",
            errorMessage: stderr || `Process exited with code ${code}`,
          });
        }
      } catch {
        resolve({
          success: false,
          status: "error",
          errorMessage: stderr || `Parse error, code: ${code}`,
        });
      }
    });

    proc.on("error", (error) => {
      resolve({
        success: false,
        status: "error",
        errorMessage: error.message,
      });
    });

    // 设置超时
    setTimeout(() => {
      proc.kill();
      resolve({
        success: false,
        status: "error",
        errorMessage: "TriadLoop execution timeout (5 minutes)",
      });
    }, 300000);
  });
}

/**
 * 便捷方法：通过 Skill ID 触发 TriadLoop 任务
 */
export async function triggerTriadLoopBySkill(
  skillId: string,
  userId: string,
  params: Record<string, any>
): Promise<{ taskId: number; success: boolean } | null> {
  try {
    // 查询 skill 详情
    const skillRes = await dbFetch(
      `/node_skills?skillId=eq.${encodeURIComponent(skillId)}&isActive=eq.true&select=*&limit=1`
    );
    const skill = (skillRes.data as any[])?.[0];

    if (!skill) {
      console.error(`[TriadLoop] Skill not found: ${skillId}`);
      return null;
    }

    // 构建任务描述
    const taskDesc = params.task || params.description || `Execute skill: ${skillId}`;

    // 创建任务记录
    const taskRes = await dbFetch("/content_tasks", {
      method: "POST",
      body: {
        skill_id: skillId,
        node_id: skill.nodeId || null,
        triggered_by: userId,
        trigger_type: "manual",
        status: "pending",
        params: params,
        started_at: new Date().toISOString(),
      },
      headers: { Prefer: "return=representation" },
    });

    const task = (taskRes.data as any[])?.[0];
    if (!task) return null;

    // 异步执行 TriadLoop
    executeTriadLoop({
      taskId: task.id,
      task: taskDesc,
      language: params.language || "python",
      mode: params.mode || "fix",
      context: {
        skillId,
        userId,
        ...params,
      },
    }).catch((e) => {
      console.error(`[TriadLoop] Async execution failed for task #${task.id}:`, e);
    });

    return { taskId: task.id, success: true };
  } catch (error) {
    console.error(`[TriadLoop] Failed to trigger skill ${skillId}:`, error);
    return null;
  }
}
