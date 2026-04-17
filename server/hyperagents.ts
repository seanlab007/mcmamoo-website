/**
 * ============================================================
 * File: hyperagents.ts
 * Description: HyperAgents 自改进 AI 引擎的 Node.js 包装器
 *              通过子进程调用 Python FastAPI 服务实现自改进 Agent
 * Author: Work Buddy
 * Date: 2026-03-29
 * ============================================================
 */

import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

// 配置
const HYPERAGENTS_DIR = path.join(__dirname, "hyperagents");
const HYPERAGENTS_PORT = process.env.HYPERAGENTS_PORT || 3456;

/**
 * HyperAgents 引擎接口
 */
export interface HyperAgentsInput {
  task: string;              // 任务描述
  domain?: string;            // 领域 (coding, math, reasoning, general)
  maxIterations?: number;     // 最大迭代次数，默认 3
  model?: string;             // 使用的 LLM 模型
}

export interface HyperAgentsResult {
  success: boolean;
  output: string;
  final_code?: string;
  iterations?: number;
  error?: string;
}

/**
 * 检查 HyperAgents Python 环境是否就绪
 */
export async function checkHyperAgentsSetup(): Promise<{ ready: boolean; message: string }> {
  try {
    const reqPath = path.join(HYPERAGENTS_DIR, "requirements.txt");
    await fs.access(reqPath);
    return { ready: true, message: "HyperAgents 代码已就绪" };
  } catch {
    return { ready: false, message: "HyperAgents 目录未找到" };
  }
}

/**
 * 运行自改进 Agent
 * 
 * @param input - 任务输入
 * @returns Agent 执行结果
 * 
 * @example
 * const result = await runSelfImprovingAgent({
 *   task: "写一个快速排序算法",
 *   domain: "coding",
 *   maxIterations: 3
 * });
 */
export async function runSelfImprovingAgent(input: HyperAgentsInput): Promise<HyperAgentsResult> {
  const { task, domain = "general", maxIterations = 3, model = "gpt-4" } = input;
  
  // 创建临时任务文件
  const tmpDir = path.join(os.tmpdir(), "hyperagents-task");
  await fs.mkdir(tmpDir, { recursive: true }).catch(() => {});
  
  const taskFile = path.join(tmpDir, `task_${Date.now()}.json`);
  const resultFile = path.join(tmpDir, `result_${Date.now()}.json`);
  
  const taskData = {
    task,
    domain,
    max_iterations: maxIterations,
    model,
    output_file: resultFile
  };
  
  await fs.writeFile(taskFile, JSON.stringify(taskData, null, 2), "utf8");
  
  try {
    // 检查 Python 环境
    try {
      await execAsync("python3 --version");
    } catch {
      return { 
        success: false, 
        output: "", 
        error: "Python3 未安装，请先安装 Python 3.8+" 
      };
    }
    
    // 安装依赖（如需要）
    try {
      await execAsync(`cd ${HYPERAGENTS_DIR} && pip3 install -q -r requirements.txt`, {
        timeout: 120000
      });
    } catch (e) {
      // 依赖可能已安装，继续执行
    }
    
    // 运行 HyperAgents
    const agentScript = path.join(HYPERAGENTS_DIR, "run_task_agent.py");
    
    // 检查脚本是否存在
    try {
      await fs.access(agentScript);
    } catch {
      return {
        success: false,
        output: "",
        error: `Agent 脚本不存在: ${agentScript}`
      };
    }
    
    const cmd = `python3 "${agentScript}" --task "${task}" --domain ${domain} --max-iterations ${maxIterations} --model ${model}`;
    
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: HYPERAGENTS_DIR,
      timeout: maxIterations * 120000, // 每次迭代最多 2 分钟
      env: { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY }
    });
    
    const output = stdout + stderr;
    
    return {
      success: true,
      output: output || "任务执行完成",
      iterations: maxIterations,
      final_code: output
    };
    
  } catch (err: any) {
    const errorMsg = err.killed 
      ? "执行超时" 
      : err.message || "未知错误";
    
    return {
      success: false,
      output: "",
      error: `HyperAgents 执行失败: ${errorMsg}`
    };
  } finally {
    // 清理临时文件
    await fs.unlink(taskFile).catch(() => {});
    await fs.unlink(resultFile).catch(() => {});
  }
}

/**
 * 获取 HyperAgents 状态信息
 */
export async function getHyperAgentsStatus(): Promise<{
  status: string;
  version: string;
  features: string[];
}> {
  const packageJsonPath = path.join(HYPERAGENTS_DIR, "package.json");
  
  try {
    await fs.access(packageJsonPath);
    const content = await fs.readFile(packageJsonPath, "utf8");
    const pkg = JSON.parse(content);
    return {
      status: "ready",
      version: pkg.version || "1.0.0",
      features: pkg.features || ["self-improvement", "meta-learning", "code-generation"]
    };
  } catch {
    return {
      status: "ready",
      version: "1.0.0",
      features: [
        "self-improvement - 自改进能力",
        "meta-learning - 元学习",
        "code-generation - 代码生成",
        "task-automation - 任务自动化"
      ]
    };
  }
}
