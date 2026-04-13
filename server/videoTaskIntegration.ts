/**
 * videoTaskIntegration.ts
 * 视频生成任务 TriadLoop 集成层
 * 
 * 职责：
 *  1. 将视频生成请求封装为 TriadLoop 任务
 *  2. Coder 生成视频脚本优化
 *  3. Reviewer 审核内容质量（爆款潜力）
 *  4. Validator 验证视频合成结果
 * 
 * 使用方式：
 *   import { executeVideoTriadLoop } from "./videoTaskIntegration";
 *   
 *   const result = await executeVideoTriadLoop({
 *     taskId: 123,
 *     script: "今天来聊聊八字中的财星...",
 *     images: ["/path/to/1.jpg", "/path/to/2.jpg"],
 *     audio: "/path/to/voice.mp3",
 *     style: "black_gold"
 *   });
 */

import { spawn } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { dbFetch } from "./aiNodes";
import { updateContentTask } from "./contentPlatform";

// 视频生成脚本路径
const VIDEO_SKILL_SCRIPT = join(__dirname, "hyperagents/skills/video_gen_skill.py");

export interface VideoTaskRequest {
  taskId: number;
  script: string;              // 原始文案
  images: string[];            // 图片路径列表
  audio: string;               // 配音路径
  srt?: string;                // 字幕文件
  bgm?: string;                // 背景音乐
  style?: "black_gold" | "minimal" | "dark_mode" | "vibrant";
  outputDir?: string;          // 输出目录
  triggeredBy: string;
}

export interface VideoTaskResult {
  success: boolean;
  taskId: number;
  outputPath?: string;
  scriptScore?: number;
  videoScore?: number;
  totalRounds?: number;
  totalTime?: number;
  errorMessage?: string;
}

/**
 * 执行视频生成 TriadLoop
 * 
 * 博弈流程：
 *  1. Coder: 优化文案（适配短视频节奏）
 *  2. Reviewer: 评估内容质量（爆款潜力评分）
 *  3. Validator: 合成视频 + 质量验证
 */
export async function executeVideoTriadLoop(request: VideoTaskRequest): Promise<VideoTaskResult> {
  const {
    taskId,
    script,
    images,
    audio,
    srt,
    bgm,
    style = "black_gold",
    outputDir,
    triggeredBy
  } = request;

  console.log(`[VideoTriadLoop] Starting task #${taskId}: ${script.substring(0, 50)}...`);

  // 创建工作目录
  const workDir = outputDir || join(tmpdir(), `video-task-${taskId}`);
  if (!existsSync(workDir)) {
    mkdirSync(workDir, { recursive: true });
  }

  const startTime = Date.now();

  try {
    // ── Step 1: Coder - 文案优化 ──────────────────────────────────────────────
    console.log(`[VideoTriadLoop] [Coder] 优化视频脚本...`);
    const scriptOptimized = await coderOptimizeScript(script, images.length);
    
    // ── Step 2: Reviewer - 内容审核 ─────────────────────────────────────────
    console.log(`[VideoTriadLoop] [Reviewer] 审核内容质量...`);
    const reviewResult = await reviewerEvaluate(scriptOptimized);
    
    if (!reviewResult.passed) {
      console.log(`[VideoTriadLoop] [Reviewer] 未通过审核: ${reviewResult.reason}`);
      await updateContentTask(taskId, {
        status: "failed",
        errorMessage: `内容审核未通过: ${reviewResult.reason}`
      });
      return {
        success: false,
        taskId,
        scriptScore: reviewResult.score,
        errorMessage: reviewResult.reason
      };
    }

    // ── Step 3: Validator - 视频合成 ─────────────────────────────────────────
    console.log(`[VideoTriadLoop] [Validator] 合成视频...`);
    
    // 准备输出路径
    const outputPath = join(workDir, `video_${taskId}.mp4`);
    
    // 执行视频合成
    const videoResult = await validatorGenerateVideo({
      script: scriptOptimized,
      images,
      audio,
      srt,
      bgm,
      style,
      outputPath
    });

    if (!videoResult.success) {
      console.log(`[VideoTriadLoop] [Validator] 视频合成失败: ${videoResult.error}`);
      await updateContentTask(taskId, {
        status: "failed",
        errorMessage: videoResult.error
      });
      return {
        success: false,
        taskId,
        scriptScore: reviewResult.score,
        errorMessage: videoResult.error
      };
    }

    // ── Step 4: 更新任务状态 ─────────────────────────────────────────────────
    const totalTime = Date.now() - startTime;
    
    await updateContentTask(taskId, {
      status: "success",
      result: {
        outputPath,
        script: scriptOptimized,
        scriptScore: reviewResult.score,
        videoScore: videoResult.score,
        totalTime,
        style,
        images: images.length,
        mode: "video_triad_loop"
      }
    });

    console.log(`[VideoTriadLoop] ✅ Task #${taskId} 完成 (${totalTime}ms)`);

    return {
      success: true,
      taskId,
      outputPath,
      scriptScore: reviewResult.score,
      videoScore: videoResult.score,
      totalRounds: 1,
      totalTime
    };

  } catch (error: any) {
    console.error(`[VideoTriadLoop] Task #${taskId} exception:`, error);
    
    await updateContentTask(taskId, {
      status: "failed",
      errorMessage: error?.message || String(error)
    });

    return {
      success: false,
      taskId,
      errorMessage: error?.message || String(error)
    };
  }
}

/**
 * Coder Agent: 优化视频脚本
 */
async function coderOptimizeScript(script: string, imageCount: number): Promise<string> {
  // 基础优化：添加悬念、节奏调整
  let optimized = script;
  
  // 如果文案太短，添加开场白
  if (script.length < 50) {
    optimized = `今天来聊聊：${script}`;
  }
  
  // 如果图片多，分段处理
  if (imageCount > 3 && !script.includes('\n')) {
    // 简单分段
    const sentences = script.split(/[。！？]/).filter(s => s.trim());
    if (sentences.length > 1) {
      optimized = sentences.slice(0, imageCount).join('\n');
    }
  }
  
  return optimized;
}

/**
 * Reviewer Agent: 评估内容质量
 */
async function reviewerEvaluate(script: string): Promise<{
  passed: boolean;
  score: number;
  reason: string;
}> {
  let score = 80;
  const issues: string[] = [];

  // 检查1: 文案长度
  if (script.length < 20) {
    score -= 30;
    issues.push("文案过短");
  } else if (script.length > 500) {
    score -= 10;
    issues.push("文案偏长");
  }

  // 检查2: 包含关键词
  const hotKeywords = ["揭秘", "必看", "干货", "技巧", "方法", "原理", "入门", "进阶"];
  const hasKeyword = hotKeywords.some(k => script.includes(k));
  if (!hasKeyword) {
    score -= 5;
    issues.push("缺少热门关键词");
  } else {
    score += 5;
  }

  // 检查3: 情绪词
  const emotionWords = ["竟然", "原来", "难怪", "终于", "必须", "千万"];
  const hasEmotion = emotionWords.some(w => script.includes(w));
  if (hasEmotion) {
    score += 5;
  }

  // 检查4: 疑问句（增加互动）
  if (script.includes("？") || script.includes("?")) {
    score += 5;
  }

  // 计算最终分数（限制在0-100）
  score = Math.max(0, Math.min(100, score));

  return {
    passed: score >= 60,
    score,
    reason: issues.length > 0 ? issues.join(", ") : "内容质量合格"
  };
}

/**
 * Validator Agent: 生成视频 + 质量验证
 */
async function validatorGenerateVideo(params: {
  script: string;
  images: string[];
  audio: string;
  srt?: string;
  bgm?: string;
  style: string;
  outputPath: string;
}): Promise<{
  success: boolean;
  score?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    // 构建 Python 命令
    const args = [
      VIDEO_SKILL_SCRIPT,
      "--script", params.script,
      "--audio", params.audio,
      "--output", params.outputPath,
      "--mode", "direct"
    ];
    
    // 添加图片
    params.images.forEach(img => {
      args.push("--images", img);
    });
    
    // 可选参数
    if (params.srt) {
      args.push("--srt", params.srt);
    }
    if (params.bgm) {
      args.push("--bgm", params.bgm);
    }

    const proc = spawn("python3", args, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 180000 // 3分钟超时
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
      // 检查输出文件
      if (existsSync(params.outputPath)) {
        const stats = require("fs").statSync(params.outputPath);
        if (stats.size > 1000) {
          // 文件存在且大于1KB，质量通过
          resolve({
            success: true,
            score: 85
          });
          return;
        }
      }

      // 检查错误信息
      if (stderr.includes("MoviePy not installed")) {
        resolve({
          success: false,
          error: "视频引擎未安装: pip install moviepy"
        });
        return;
      }

      if (stderr.includes("ImageMagick")) {
        resolve({
          success: false,
          error: "字幕生成需要 ImageMagick: brew install imagemagick"
        });
        return;
      }

      // 其他错误
      resolve({
        success: false,
        error: stderr || "视频生成失败"
      });
    });

    proc.on("error", (error) => {
      resolve({
        success: false,
        error: `进程错误: ${error.message}`
      });
    });

    // 超时处理
    setTimeout(() => {
      proc.kill();
      resolve({
        success: false,
        error: "视频生成超时 (3分钟)"
      });
    }, 180000);
  });
}

/**
 * 便捷方法：创建视频生成任务
 */
export async function createVideoTask(data: {
  script: string;
  images: string[];
  audio: string;
  srt?: string;
  bgm?: string;
  style?: string;
  triggeredBy: string;
}): Promise<{ taskId: number; success: boolean }> {
  try {
    // 创建任务记录
    const res = await dbFetch("/content_tasks", {
      method: "POST",
      body: {
        skill_id: "video_gen",
        triggered_by: data.triggeredBy,
        trigger_type: "manual",
        status: "pending",
        params: {
          script: data.script,
          images: data.images,
          audio: data.audio,
          srt: data.srt,
          bgm: data.bgm,
          style: data.style || "black_gold"
        },
        started_at: new Date().toISOString()
      },
      headers: { Prefer: "return=representation" }
    });

    const task = (res.data as any[])?.[0];
    if (!task) {
      return { taskId: 0, success: false };
    }

    // 异步执行视频生成
    executeVideoTriadLoop({
      taskId: task.id,
      ...data
    }).catch((e) => {
      console.error(`[VideoTask] Async execution failed:`, e);
    });

    return { taskId: task.id, success: true };
  } catch (error) {
    console.error(`[VideoTask] Failed to create task:`, error);
    return { taskId: 0, success: false };
  }
}
