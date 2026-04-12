/**
 * contentPlatform.ts
 * MaoAI × 猫眼自动内容平台协调层
 *
 * 职责：
 *  1. 用户订阅查询 / 创建 / 升降级（user_subscriptions）
 *  2. Skill 权限校验（required_plan × 用户 plan）
 *  3. 内容任务记录（content_tasks）
 *  4. 定时调度任务 CRUD（scheduled_skill_jobs）
 *  5. 调度器（node-cron）运行时挂载
 */

import { Router, Request, Response } from "express";
import { dbFetch } from "./aiNodes";
import { sdk } from "./_core/sdk";
import cron, { type ScheduledTask } from "node-cron";
import { executeTriadLoop, type TriadTaskResult } from "./triadLoopIntegration";

const contentPlatformRouter = Router();

// ─── Plan 等级数值（越大权限越高）─────────────────────────────────────────────
const PLAN_RANK: Record<string, number> = {
  free:       0,
  content:    1,
  strategic:  2,
  admin:      99,
};

function planRank(plan: string): number {
  return PLAN_RANK[plan] ?? 0;
}

// ─── 订阅默认配额 ─────────────────────────────────────────────────────────────
const PLAN_DEFAULTS: Record<string, { contentQuota: number }> = {
  free:      { contentQuota: 5  },
  content:   { contentQuota: 50 },
  strategic: { contentQuota: -1 }, // -1 = 不限
};

// ─── DB Helpers ───────────────────────────────────────────────────────────────

export async function getUserSubscription(openId: string) {
  const res = await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(openId)}&select=*&limit=1`);
  const rows = res.data as any[] | null;
  return rows?.[0] ?? null;
}

export async function upsertUserSubscription(openId: string, userId: number, plan: string) {
  const defaults = PLAN_DEFAULTS[plan] ?? PLAN_DEFAULTS.free;
  const nextMonth = new Date();
  nextMonth.setDate(1);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setHours(0, 0, 0, 0);

  const existing = await getUserSubscription(openId);
  if (existing) {
    // 升降级：重置 quota
    await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(openId)}`, {
      method: "PATCH",
      body: {
        plan,
        content_quota: defaults.contentQuota,
        content_used: 0,
        quota_reset_at: nextMonth.toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  } else {
    await dbFetch("/user_subscriptions", {
      method: "POST",
      body: {
        user_id: userId,
        open_id: openId,
        plan,
        content_quota: defaults.contentQuota,
        content_used: 0,
        quota_reset_at: nextMonth.toISOString(),
      },
    });
  }
}

// 检查并重置过期配额
async function maybeResetQuota(sub: any): Promise<any> {
  if (!sub) return sub;
  const now = new Date();
  const resetAt = new Date(sub.quota_reset_at);
  if (now >= resetAt) {
    await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(sub.open_id)}`, {
      method: "PATCH",
      body: {
        content_used: 0,
        quota_reset_at: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      },
    });
    sub.content_used = 0;
  }
  return sub;
}

// ─── 平台级 plan 映射 ─────────────────────────────────────────────────────────
// platform-specific required_plan 值 → { minPlan, platformKey }
const PLATFORM_PLANS: Record<string, { minPlan: string; platformKey: string; label: string }> = {
  xiaohongshu: { minPlan: "content",   platformKey: "xiaohongshu", label: "小红书" },
  douyin:      { minPlan: "strategic", platformKey: "douyin",      label: "抖音" },
  weibo:       { minPlan: "content",   platformKey: "weibo",       label: "微博" },
  wechat:      { minPlan: "strategic", platformKey: "wechat",      label: "微信公众号" },
};

// ─── Skill 权限校验 ────────────────────────────────────────────────────────────
/**
 * 校验用户是否有权限调用该 skill。
 * 支持：
 *   - 标准等级校验（free / content / strategic / admin）
 *   - 平台专属校验（xiaohongshu / douyin / weibo / wechat）
 *     → 要求用户套餐达到对应 minPlan，且订阅的 content_platforms 包含目标平台
 * @returns { allowed: true } 或 { allowed: false, reason: string }
 */
export async function checkSkillPermission(
  openId: string,
  userRole: string,
  skillRequiredPlan: string
): Promise<{ allowed: boolean; reason?: string }> {
  // admin 绕过所有限制
  if (userRole === "admin") return { allowed: true };

  // 获取订阅信息（若没有则视为 free）
  let sub = await getUserSubscription(openId);
  sub = await maybeResetQuota(sub);
  const userPlan = sub?.plan ?? "free";

  // ── 平台专属校验 ───────────────────────────────────────────────────────────
  const platformDef = PLATFORM_PLANS[skillRequiredPlan];
  if (platformDef) {
    // 先检查套餐等级
    if (planRank(userPlan) < planRank(platformDef.minPlan)) {
      const planLabels: Record<string, string> = {
        content:   "内容会员（Content Pro）",
        strategic: "战略会员（Strategic）",
      };
      return {
        allowed: false,
        reason: `${platformDef.label}内容发布需要「${planLabels[platformDef.minPlan] ?? platformDef.minPlan}」及以上订阅，你当前为「${userPlan}」套餐。`,
      };
    }
    // 检查平台是否在用户订阅的平台列表中
    const allowedPlatforms: string[] = sub?.content_platforms ?? [];
    if (allowedPlatforms.length > 0 && !allowedPlatforms.includes(platformDef.platformKey)) {
      return {
        allowed: false,
        reason: `你的套餐不包含「${platformDef.label}」发布权限，请升级至包含该平台的套餐。`,
      };
    }
    // 平台通过 → 走到配额校验
    if (sub && sub.content_quota !== -1) {
      if (sub.content_used >= sub.content_quota) {
        return {
          allowed: false,
          reason: `本月内容生产次数已用完（${sub.content_used}/${sub.content_quota}），请升级套餐或等待下月重置。`,
        };
      }
      await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(openId)}`, {
        method: "PATCH",
        body: { content_used: sub.content_used + 1 },
      });
    }
    return { allowed: true };
  }

  // ── 标准等级校验 ───────────────────────────────────────────────────────────
  if (planRank(userPlan) < planRank(skillRequiredPlan)) {
    const planLabels: Record<string, string> = {
      content:   "内容会员（Content Pro）",
      strategic: "战略会员（Strategic）",
      admin:     "管理员",
    };
    return {
      allowed: false,
      reason: `此功能需要「${planLabels[skillRequiredPlan] ?? skillRequiredPlan}」及以上订阅，你当前为「${userPlan}」套餐。`,
    };
  }

  // 配额校验（仅 content 级别，strategic = -1 不限）
  if (skillRequiredPlan === "content" && sub && sub.content_quota !== -1) {
    if (sub.content_used >= sub.content_quota) {
      return {
        allowed: false,
        reason: `本月内容生产次数已用完（${sub.content_used}/${sub.content_quota}），请升级套餐或等待下月重置。`,
      };
    }
    // 扣减配额
    await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(openId)}`, {
      method: "PATCH",
      body: { content_used: sub.content_used + 1 },
    });
  }

  return { allowed: true };
}

// ─── Content Task Helpers ────────────────────────────────────────────────────

export async function createContentTask(data: {
  skillId: string;
  nodeId?: number;
  triggeredBy: string;
  triggerType?: "manual" | "scheduled" | "api";
  params?: Record<string, unknown>;
}) {
  const res = await dbFetch("/content_tasks", {
    method: "POST",
    body: {
      skill_id: data.skillId,
      node_id: data.nodeId ?? null,
      triggered_by: data.triggeredBy,
      trigger_type: data.triggerType ?? "manual",
      status: "pending",
      params: data.params ?? {},
      started_at: new Date().toISOString(),
    },
    headers: { Prefer: "return=representation" },
  });
  const rows = res.data as any[] | null;
  return rows?.[0] ?? null;
}

export async function updateContentTask(
  taskId: number,
  update: { status: string; result?: Record<string, unknown>; errorMessage?: string }
) {
  await dbFetch(`/content_tasks?id=eq.${taskId}`, {
    method: "PATCH",
    body: {
      status: update.status,
      result: update.result ?? {},
      error_message: update.errorMessage ?? null,
      finished_at: new Date().toISOString(),
    },
  });
}

// ─── Admin Auth Helper ────────────────────────────────────────────────────────
async function requireAdmin(req: Request): Promise<{ id: number; role: string; email: string; openId: string } | null> {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (user && user.role === "admin") return user;
    return null;
  } catch {
    return null;
  }
}

async function requireAuth(req: Request): Promise<{ id: number; role: string; openId: string } | null> {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    return user ?? null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REST API Routes
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /api/content/subscription ─────────────────────────────────────────────
// 获取当前用户订阅信息
contentPlatformRouter.get("/subscription", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "未登录" });

  let sub = await getUserSubscription(user.openId);
  sub = await maybeResetQuota(sub);

  if (!sub) {
    // 未订阅用户返回 free 默认信息
    return res.json({
      plan: "free",
      contentQuota: PLAN_DEFAULTS.free.contentQuota,
      contentUsed: 0,
      isAdmin: user.role === "admin",
    });
  }

  return res.json({
    plan: sub.plan,
    contentQuota: sub.content_quota,
    contentUsed: sub.content_used,
    expiresAt: sub.expires_at,
    quotaResetAt: sub.quota_reset_at,
    isAdmin: user.role === "admin",
  });
});

// ── GET /api/content/tasks ─────────────────────────────────────────────────────
// 用户查看自己的内容任务；管理员可查全部
contentPlatformRouter.get("/tasks", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "未登录" });

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  let query = `/content_tasks?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
  if (user.role !== "admin") {
    // 普通用户只看自己的
    query += `&triggered_by=eq.${encodeURIComponent(user.openId)}`;
  }

  const res2 = await dbFetch(query);
  return res.json({ tasks: res2.data ?? [], total: (res2.data as any[])?.length ?? 0 });
});

// ── POST /api/content/tasks ────────────────────────────────────────────────────
// 手动触发内容生产任务（用户调用，经权限校验）
contentPlatformRouter.post("/tasks", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "未登录" });

  const { skillId, params } = req.body;
  if (!skillId) return res.status(400).json({ error: "skillId 不能为空" });

  // 查询 skill 所需权限
  const skillRes = await dbFetch(`/node_skills?skillId=eq.${encodeURIComponent(skillId)}&isActive=eq.true&select=*&limit=1`);
  const skill = (skillRes.data as any[])?.[0];
  if (!skill) return res.status(404).json({ error: "Skill 不存在或未激活" });

  // 权限校验
  const perm = await checkSkillPermission(user.openId, user.role, skill.required_plan ?? "free");
  if (!perm.allowed) return res.status(403).json({ error: perm.reason });

  // 创建任务记录
  const task = await createContentTask({
    skillId,
    nodeId: skill.nodeId,
    triggeredBy: user.openId,
    triggerType: "manual",
    params: params ?? {},
  });

  // 实际 invoke 转发到节点（异步，不等结果）
  if (task) {
    invokeSkillAsync(task.id, skill, params ?? {}).catch((e) => {
      console.error("[ContentTask] Async invoke failed:", e);
    });
  }

  return res.json({ success: true, taskId: task?.id ?? null, message: "任务已提交，正在执行..." });
});

// ── GET /api/content/admin/jobs ────────────────────────────────────────────────
// 管理员：获取定时调度任务列表
contentPlatformRouter.get("/admin/jobs", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "需要管理员权限" });

  const res2 = await dbFetch("/scheduled_skill_jobs?select=*&order=created_at.desc");
  return res.json({ jobs: res2.data ?? [] });
});

// ── POST /api/content/admin/jobs ───────────────────────────────────────────────
// 管理员：创建定时调度任务
contentPlatformRouter.post("/admin/jobs", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "需要管理员权限" });

  const { name, skillId, nodeId, cronExpr, params } = req.body;
  if (!name || !skillId || !cronExpr) {
    return res.status(400).json({ error: "name / skillId / cronExpr 不能为空" });
  }
  if (!cron.validate(cronExpr)) {
    return res.status(400).json({ error: `无效的 cron 表达式: ${cronExpr}` });
  }

  const res2 = await dbFetch("/scheduled_skill_jobs", {
    method: "POST",
    body: {
      name,
      skill_id: skillId,
      node_id: nodeId ?? null,
      cron_expr: cronExpr,
      params: params ?? {},
      is_active: true,
      created_by: admin.openId,
    },
    headers: { Prefer: "return=representation" },
  });

  const job = (res2.data as any[])?.[0];
  // 立即注册到调度器
  if (job) registerCronJob(job);

  return res.json({ success: true, job });
});

// ── PATCH /api/content/admin/jobs/:id ─────────────────────────────────────────
// 管理员：更新/暂停/恢复定时任务
contentPlatformRouter.patch("/admin/jobs/:id", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "需要管理员权限" });

  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.cronExpr !== undefined) {
    if (!cron.validate(req.body.cronExpr)) {
      return res.status(400).json({ error: `无效的 cron 表达式: ${req.body.cronExpr}` });
    }
    updates.cron_expr = req.body.cronExpr;
  }
  if (req.body.isActive !== undefined) updates.is_active = req.body.isActive;
  if (req.body.params !== undefined) updates.params = req.body.params;

  await dbFetch(`/scheduled_skill_jobs?id=eq.${id}`, { method: "PATCH", body: updates });

  // 重新载入调度器
  await reloadCronJob(parseInt(id));
  return res.json({ success: true });
});

// ── DELETE /api/content/admin/jobs/:id ────────────────────────────────────────
contentPlatformRouter.delete("/admin/jobs/:id", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "需要管理员权限" });

  const { id } = req.params;
  await dbFetch(`/scheduled_skill_jobs?id=eq.${id}`, { method: "DELETE" });
  stopCronJob(parseInt(id));
  return res.json({ success: true });
});

// ── POST /api/content/admin/jobs/:id/run ──────────────────────────────────────
// 管理员：立即手动触发一次定时任务
contentPlatformRouter.post("/admin/jobs/:id/run", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "需要管理员权限" });

  const { id } = req.params;
  const jobRes = await dbFetch(`/scheduled_skill_jobs?id=eq.${id}&select=*&limit=1`);
  const job = (jobRes.data as any[])?.[0];
  if (!job) return res.status(404).json({ error: "任务不存在" });

  // 异步执行
  runScheduledJob(job).catch((e) => console.error("[Scheduler] Manual run error:", e));
  return res.json({ success: true, message: "已触发执行" });
});

// ── GET /api/content/admin/subscriptions ──────────────────────────────────────
// 管理员：查看所有用户订阅
contentPlatformRouter.get("/admin/subscriptions", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "需要管理员权限" });

  const res2 = await dbFetch("/user_subscriptions?select=*&order=created_at.desc");
  return res.json({ subscriptions: res2.data ?? [] });
});

// ── POST /api/content/admin/subscriptions ─────────────────────────────────────
// 管理员：给用户开通/变更套餐
contentPlatformRouter.post("/admin/subscriptions", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "需要管理员权限" });

  const { openId, userId, plan } = req.body;
  if (!openId || !userId || !plan) {
    return res.status(400).json({ error: "openId / userId / plan 不能为空" });
  }
  if (!PLAN_DEFAULTS[plan]) {
    return res.status(400).json({ error: `无效 plan: ${plan}，可选值: free | content | strategic` });
  }

  await upsertUserSubscription(openId, userId, plan);
  return res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Scheduler Engine（node-cron）
// ═══════════════════════════════════════════════════════════════════════════════

// 内存中的 cron task 实例（jobId → ScheduledTask）
const activeCronJobs = new Map<number, ScheduledTask>();

async function invokeSkillAsync(
  taskId: number,
  skill: { skillId?: string; nodeId?: number; invokeMode?: string; inputSchema?: any; useTriadLoop?: boolean },
  params: Record<string, unknown>
) {
  // ── TriadLoop 模式：内容生成任务走三权分立博弈 ──────────────────────────────
  if (skill.useTriadLoop || skill.invokeMode === "triad_loop") {
    console.log(`[ContentTask] Task #${taskId} using TriadLoop mode`);

    const taskDesc = params.task || params.description ||
      `Execute skill: ${skill.skillId} with params: ${JSON.stringify(params).substring(0, 200)}`;

    try {
      const result = await executeTriadLoop({
        taskId,
        task: taskDesc,
        language: (params.language as string) || "python",
        mode: (params.mode as "fix" | "generate") || "generate",
        context: { skillId: skill.skillId, params, taskId },
      });

      if (result.success) {
        await updateContentTask(taskId, {
          status: "success",
          result: {
            triadResult: result,
            mode: "triad_loop",
          },
        });
      } else {
        await updateContentTask(taskId, {
          status: "failed",
          errorMessage: result.errorMessage || "TriadLoop execution failed",
        });
      }
    } catch (err: any) {
      await updateContentTask(taskId, {
        status: "failed",
        errorMessage: err?.message ?? String(err),
      });
    }
    return;
  }

  // ── 标准模式：转发到节点执行 ──────────────────────────────────────────────────
  try {
    // 获取节点信息
    const nodeRes = await dbFetch(`/ai_nodes?id=eq.${skill.nodeId}&select=baseUrl,token&limit=1`);
    const node = (nodeRes.data as any[])?.[0];
    if (!node) throw new Error(`Node ${skill.nodeId} not found`);

    const invokeRes = await fetch(`${node.baseUrl}/skill/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${node.token}`,
      },
      body: JSON.stringify({ skillId: skill.skillId, params, requestId: `task-${taskId}` }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!invokeRes.ok) {
      const errText = await invokeRes.text();
      await updateContentTask(taskId, { status: "failed", errorMessage: errText });
      return;
    }

    const result = await invokeRes.json();
    await updateContentTask(taskId, { status: "success", result });
  } catch (err: any) {
    await updateContentTask(taskId, { status: "failed", errorMessage: err?.message ?? String(err) });
  }
}

async function runScheduledJob(job: any) {
  console.log(`[Scheduler] Running job #${job.id} "${job.name}" (skill: ${job.skill_id})`);

  const task = await createContentTask({
    skillId: job.skill_id,
    nodeId: job.node_id ?? undefined,
    triggeredBy: "scheduler",
    triggerType: "scheduled",
    params: job.params ?? {},
  });

  if (!task) return;

  // 查 skill 详情
  const skillRes = await dbFetch(`/node_skills?skillId=eq.${encodeURIComponent(job.skill_id)}&isActive=eq.true&select=*&limit=1`);
  const skill = (skillRes.data as any[])?.[0];
  if (!skill) {
    await updateContentTask(task.id, { status: "failed", errorMessage: "Skill 不存在或未激活" });
    return;
  }

  // 更新上次运行时间
  await dbFetch(`/scheduled_skill_jobs?id=eq.${job.id}`, {
    method: "PATCH",
    body: { last_run_at: new Date().toISOString() },
  });

  await invokeSkillAsync(task.id, skill, job.params ?? {});
}

function registerCronJob(job: any) {
  if (!job.is_active || !cron.validate(job.cron_expr)) return;

  // 停掉旧的（如果有）
  stopCronJob(job.id);

  const task = cron.schedule(job.cron_expr, () => {
    runScheduledJob(job).catch((e) => console.error(`[Scheduler] Job #${job.id} error:`, e));
  }, { timezone: "Asia/Shanghai" });

  activeCronJobs.set(job.id, task);
  console.log(`[Scheduler] Registered job #${job.id} "${job.name}" → ${job.cron_expr}`);
}

function stopCronJob(jobId: number) {
  const existing = activeCronJobs.get(jobId);
  if (existing) {
    existing.stop();
    activeCronJobs.delete(jobId);
  }
}

async function reloadCronJob(jobId: number) {
  const res = await dbFetch(`/scheduled_skill_jobs?id=eq.${jobId}&select=*&limit=1`);
  const job = (res.data as any[])?.[0];
  stopCronJob(jobId);
  if (job && job.is_active) registerCronJob(job);
}

/**
 * 启动时从数据库加载所有激活的定时任务
 * 在 server/index.ts 中调用
 */
export async function initScheduler() {
  try {
    const res = await dbFetch("/scheduled_skill_jobs?is_active=eq.true&select=*");
    const jobs = (res.data as any[]) ?? [];
    jobs.forEach(registerCronJob);
    console.log(`[Scheduler] Loaded ${jobs.length} active job(s)`);
  } catch (err) {
    console.warn("[Scheduler] Failed to load jobs from DB:", err);
  }
}

// ─── Webhook 端点 ─────────────────────────────────────────────────────────────
// POST /api/content/webhook
// marketing-claw（或任何外部执行节点）在任务完成后调用此接口回写状态。
// 安全：需要 CONTENT_WEBHOOK_SECRET 环境变量做 Bearer 鉴权。
//
// 请求体示例：
// {
//   "taskId": 123,                        // content_tasks.id
//   "requestId": "task-123",              // 可选，用于兜底匹配
//   "status": "success" | "failed",
//   "result": { ... },                    // 执行结果（成功时）
//   "errorMessage": "...",                // 错误信息（失败时）
//   "publishedUrls": ["https://..."],     // 已发布链接（可选）
//   "platform": "xiaohongshu"            // 发布平台（可选）
// }
contentPlatformRouter.post("/webhook", async (req: Request, res: Response) => {
  // ── 鉴权 ──────────────────────────────────────────────────────────────────
  const secret = process.env.CONTENT_WEBHOOK_SECRET;
  if (secret) {
    const auth = req.headers["authorization"] ?? req.headers["x-webhook-secret"] ?? "";
    const token = String(auth).replace(/^Bearer\s+/i, "").trim();
    if (token !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const { taskId, requestId, status, result, errorMessage, publishedUrls, platform } = req.body ?? {};

  if (!taskId && !requestId) {
    return res.status(400).json({ error: "taskId or requestId required" });
  }
  if (!["success", "failed", "running"].includes(status)) {
    return res.status(400).json({ error: "status must be success | failed | running" });
  }

  try {
    let resolvedTaskId = taskId;

    // 若没有 taskId，尝试通过 requestId 反查（格式 "task-{id}"）
    if (!resolvedTaskId && requestId) {
      const match = String(requestId).match(/^task-(\d+)$/);
      if (match) resolvedTaskId = parseInt(match[1], 10);
    }

    if (!resolvedTaskId) {
      return res.status(400).json({ error: "Could not resolve taskId" });
    }

    // 构建 patch payload
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "success") {
      patch.result = result ?? null;
      patch.finished_at = new Date().toISOString();
    }
    if (status === "failed") {
      patch.error_message = errorMessage ?? "Unknown error";
      patch.finished_at = new Date().toISOString();
    }
    if (status === "running") {
      patch.started_at = new Date().toISOString();
    }
    // 追加发布链接到 result
    if (publishedUrls && Array.isArray(publishedUrls) && publishedUrls.length > 0) {
      patch.result = { ...(typeof result === "object" && result ? result : {}), publishedUrls, platform };
    }

    await dbFetch(`/content_tasks?id=eq.${resolvedTaskId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });

    console.log(`[Webhook] Task ${resolvedTaskId} → ${status}${platform ? ` (${platform})` : ""}`);
    return res.json({ success: true, taskId: resolvedTaskId });
  } catch (err: any) {
    console.error("[Webhook] Error:", err?.message ?? err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ─── 查询任务状态（SSE 轮询辅助）────────────────────────────────────────────
// GET /api/content/tasks/:id/status — 供前端轮询单个任务最新状态
contentPlatformRouter.get("/tasks/:id/status", async (req: Request, res: Response) => {
  try {
    let user: any = null;
    let isAdmin = false;
    try {
      user = await sdk.authenticateRequest(req);
      isAdmin = (user as any)?.role === "admin";
    } catch { /* 未登录 */ }

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) return res.status(400).json({ error: "Invalid task ID" });

    const filter = isAdmin
      ? `/content_tasks?id=eq.${taskId}&select=id,status,result,error_message,started_at,finished_at`
      : `/content_tasks?id=eq.${taskId}&user_open_id=eq.${(user as any).openId}&select=id,status,result,error_message,started_at,finished_at`;

    const r = await dbFetch(filter);
    const task = (r.data as any[])?.[0];
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json(task);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

export { contentPlatformRouter };
