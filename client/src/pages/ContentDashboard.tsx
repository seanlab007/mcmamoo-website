/**
 * ContentDashboard — 用户内容平台仪表盘
 *
 * 功能：
 *  - 展示当前订阅套餐 & 配额使用情况
 *  - 浏览并手动触发内容生产任务
 *  - 查看历史内容任务列表及状态
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Zap, Crown, Cat, Loader2, RefreshCw, Play,
  CheckCircle2, XCircle, Clock, AlertCircle,
  BarChart3, FileText, ChevronRight, Lock,
} from "lucide-react";

// ─── 类型 ─────────────────────────────────────────────────────────────────────

interface Subscription {
  plan: "free" | "content" | "strategic";
  contentQuota: number;
  contentUsed: number;
  expiresAt?: string | null;
  quotaResetAt?: string;
  isAdmin: boolean;
}

interface ContentTask {
  id: number;
  skill_id: string;
  trigger_type: "manual" | "scheduled" | "api";
  status: "pending" | "running" | "success" | "failed";
  params: Record<string, unknown>;
  result: Record<string, unknown>;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

interface AvailableSkill {
  id: number;
  skillId: string;
  name: string;
  description: string | null;
  category: string;
  required_plan: string;
}

// ─── 常量 ─────────────────────────────────────────────────────────────────────

const PLAN_META = {
  free:      { label: "免费版", color: "#6B7280", icon: Cat,    badge: "FREE"     },
  content:   { label: "内容会员", color: "#C9A84C", icon: Zap,    badge: "PRO"      },
  strategic: { label: "战略会员", color: "#8B5CF6", icon: Crown,  badge: "STRATEGIC" },
};

const PLAN_REQUIRED_LABEL: Record<string, string> = {
  free:      "免费可用",
  content:   "内容会员",
  strategic: "战略会员",
  admin:     "管理员专属",
};

function statusIcon(status: ContentTask["status"]) {
  switch (status) {
    case "success": return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case "failed":  return <XCircle      className="w-4 h-4 text-red-400"   />;
    case "running": return <Loader2      className="w-4 h-4 text-blue-400 animate-spin" />;
    default:        return <Clock        className="w-4 h-4 text-white/40"  />;
  }
}

function statusLabel(status: ContentTask["status"]) {
  const map = { pending: "等待中", running: "执行中", success: "已完成", failed: "失败" };
  return map[status] ?? status;
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default function ContentDashboard() {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [skills, setSkills] = useState<AvailableSkill[]>([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [triggeringSkill, setTriggeringSkill] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Fetch 订阅信息 ─────────────────────────────────────────────────────────
  const fetchSub = useCallback(async () => {
    try {
      setLoadingSub(true);
      const r = await fetch("/api/content/subscription", { credentials: "include" });
      if (r.ok) setSub(await r.json());
    } finally {
      setLoadingSub(false);
    }
  }, []);

  // ── Fetch 任务列表 ─────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const r = await fetch("/api/content/tasks?limit=20", { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setTasks(d.tasks ?? []);
      }
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // ── Fetch 可用 Skills ──────────────────────────────────────────────────────
  const fetchSkills = useCallback(async () => {
    try {
      const r = await fetch("/api/ai/skill/list", { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setSkills(d.skills ?? []);
      }
    } catch { /* 非关键，静默失败 */ }
  }, []);

  useEffect(() => {
    if (user) { fetchSub(); fetchTasks(); fetchSkills(); }
  }, [user, fetchSub, fetchTasks, fetchSkills]);

  // ── 触发内容任务 ───────────────────────────────────────────────────────────
  const triggerSkill = async (skillId: string) => {
    try {
      setTriggeringSkill(skillId);
      const r = await fetch("/api/content/tasks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      const d = await r.json();
      if (r.ok) {
        setFeedback({ msg: d.message ?? "任务已提交", ok: true });
        setTimeout(() => setFeedback(null), 3000);
        setTimeout(fetchTasks, 1500);
        fetchSub();
      } else {
        setFeedback({ msg: d.error ?? "请求失败", ok: false });
        setTimeout(() => setFeedback(null), 4000);
      }
    } finally {
      setTriggeringSkill(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Cat className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
          <p className="text-white/60 mb-4">请先登录</p>
          <Link href="/mao-ai">
            <button className="px-6 py-2 bg-[#C9A84C] text-black font-semibold rounded-lg text-sm hover:bg-[#D4B55A] transition-colors">
              前往 MaoAI
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const planKey = (sub?.plan ?? "free") as keyof typeof PLAN_META;
  const planInfo = PLAN_META[planKey] ?? PLAN_META.free;
  const PlanIcon = planInfo.icon;
  const quotaPercent = sub && sub.contentQuota > 0
    ? Math.min(100, Math.round((sub.contentUsed / sub.contentQuota) * 100))
    : 0;
  const isUnlimited = sub?.contentQuota === -1;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0D0D0D]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cat className="w-6 h-6 text-[#C9A84C]" />
<<<<<<< HEAD
<<<<<<< HEAD
            <span className="font-['Noto_Serif_SC'] text-white font-semibold text-lg">猫眼内容平台</span>
=======
            <span className="font-['Noto_Serif_SC'] text-white font-semibold text-lg">猫眼增长引擎 (Mc&Mamoo Growth Engine)内容平台</span>
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
            <span className="font-['Noto_Serif_SC'] text-white font-semibold text-lg">猫眼增长引擎 (Mc&Mamoo Growth Engine)内容平台</span>
>>>>>>> origin/deploy/trigger-build-1774631965
          </div>
          <div className="flex items-center gap-3">
            {sub?.isAdmin && (
              <Link href="/admin/content-jobs">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded-lg hover:bg-purple-500/20 transition-colors">
                  <BarChart3 className="w-3.5 h-3.5" />
                  调度控制台
                </button>
              </Link>
            )}
            <Link href="/mao-ai">
              <button className="flex items-center gap-1 text-white/40 hover:text-white/70 text-sm transition-colors">
                MaoAI <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Feedback Toast */}
        {feedback && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all ${
            feedback.ok ? "bg-green-500/20 border border-green-500/40 text-green-300" : "bg-red-500/20 border border-red-500/40 text-red-300"
          }`}>
            {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {feedback.msg}
          </div>
        )}

        {/* 订阅信息卡 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 套餐卡 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
            {loadingSub ? (
              <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <PlanIcon className="w-5 h-5" style={{ color: planInfo.color }} />
                  <span className="text-xs font-['DM_Mono'] tracking-widest uppercase" style={{ color: planInfo.color }}>
                    {planInfo.badge}
                  </span>
                </div>
                <div className="text-white font-semibold text-lg">{planInfo.label}</div>
                {sub?.expiresAt && (
                  <div className="text-white/40 text-xs">
                    到期：{new Date(sub.expiresAt).toLocaleDateString("zh-CN")}
                  </div>
                )}
                <Link href="/mao-ai-pricing">
                  <button className="mt-auto text-xs text-[#C9A84C] hover:text-[#D4B55A] transition-colors flex items-center gap-1">
                    升级套餐 <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* 配额卡 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
            <div className="text-white/50 text-xs uppercase tracking-widest font-['DM_Mono']">本月内容配额</div>
            {loadingSub ? (
              <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            ) : isUnlimited ? (
              <div className="text-2xl font-bold text-[#C9A84C]">不限制</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  {sub?.contentUsed ?? 0}
                  <span className="text-white/30 text-base font-normal"> / {sub?.contentQuota ?? 5}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${quotaPercent}%`,
                      background: quotaPercent >= 90 ? "#EF4444" : "#C9A84C",
                    }}
                  />
                </div>
                {sub?.quotaResetAt && (
                  <div className="text-white/30 text-xs">
                    {new Date(sub.quotaResetAt).toLocaleDateString("zh-CN")} 重置
                  </div>
                )}
              </>
            )}
          </div>

          {/* 快速统计卡 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
            <div className="text-white/50 text-xs uppercase tracking-widest font-['DM_Mono']">任务统计</div>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <div className="text-xl font-bold text-green-400">
                  {tasks.filter(t => t.status === "success").length}
                </div>
                <div className="text-white/40 text-xs mt-0.5">已完成</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-400">
                  {tasks.filter(t => t.status === "failed").length}
                </div>
                <div className="text-white/40 text-xs mt-0.5">失败</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-400">
                  {tasks.filter(t => t.status === "running").length}
                </div>
                <div className="text-white/40 text-xs mt-0.5">执行中</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white/60">
                  {tasks.length}
                </div>
                <div className="text-white/40 text-xs mt-0.5">合计</div>
              </div>
            </div>
          </div>
        </div>

        {/* 可用 Skills */}
        {skills.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Noto_Serif_SC'] text-white font-semibold text-base">可用功能</h2>
              <span className="text-white/30 text-xs">{skills.length} 个技能</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {skills.map((skill) => {
                const requiredPlan = skill.required_plan ?? "free";
                const planRank = { free: 0, content: 1, strategic: 2, admin: 99 };
                const userPlanRank = planRank[sub?.plan ?? "free"] ?? 0;
                const reqRank = planRank[requiredPlan as keyof typeof planRank] ?? 0;
                const canUse = sub?.isAdmin || userPlanRank >= reqRank;
                const isTriggering = triggeringSkill === skill.skillId;

                return (
                  <div
                    key={skill.skillId}
                    className={`bg-white/5 border rounded-xl p-4 flex flex-col gap-3 transition-all ${
                      canUse
                        ? "border-white/10 hover:border-[#C9A84C]/30"
                        : "border-white/5 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-white text-sm font-medium leading-tight">{skill.name}</div>
                        <div className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-2">
                          {skill.description ?? "内容生产技能"}
                        </div>
                      </div>
                      {!canUse && <Lock className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border font-['DM_Mono']"
                        style={{
                          background: canUse ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.05)",
                          borderColor: canUse ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.1)",
                          color: canUse ? "#C9A84C" : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {PLAN_REQUIRED_LABEL[requiredPlan] ?? requiredPlan}
                      </span>

                      {canUse ? (
                        <button
                          onClick={() => triggerSkill(skill.skillId)}
                          disabled={isTriggering}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs rounded-lg hover:bg-[#C9A84C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isTriggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          触发
                        </button>
                      ) : (
                        <Link href="/mao-ai-pricing">
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 text-xs rounded-lg hover:bg-white/10 transition-all">
                            升级解锁
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 任务历史 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Noto_Serif_SC'] text-white font-semibold text-base">内容任务历史</h2>
            <button
              onClick={fetchTasks}
              disabled={loadingTasks}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTasks ? "animate-spin" : ""}`} />
              刷新
            </button>
          </div>

          {loadingTasks ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-white/20" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
              <FileText className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">还没有内容任务</p>
              <p className="text-white/20 text-xs mt-1">在 MaoAI 中发送内容相关指令，或在上方触发技能</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4"
                >
                  <div className="flex-shrink-0">{statusIcon(task.status)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{task.skill_id}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border font-['DM_Mono'] ${
                        task.trigger_type === "scheduled"
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                          : "bg-white/5 border-white/10 text-white/30"
                      }`}>
                        {task.trigger_type === "scheduled" ? "定时" : task.trigger_type === "api" ? "API" : "手动"}
                      </span>
                    </div>
                    {task.error_message && (
                      <p className="text-red-400/70 text-xs mt-0.5 truncate">{task.error_message}</p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className={`text-xs font-medium ${
                      task.status === "success" ? "text-green-400" :
                      task.status === "failed"  ? "text-red-400"   :
                      task.status === "running" ? "text-blue-400"  : "text-white/30"
                    }`}>{statusLabel(task.status)}</div>
                    <div className="text-white/20 text-xs mt-0.5">
                      {new Date(task.created_at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
