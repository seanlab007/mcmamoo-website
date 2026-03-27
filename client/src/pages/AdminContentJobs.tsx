/**
 * AdminContentJobs — 管理员内容调度控制台
 *
 * 功能：
 *  - 查看 / 创建 / 暂停 / 删除定时内容任务（cron）
 *  - 立即手动触发一次任务
 *  - 查看全局内容任务历史
 *  - 管理用户订阅套餐
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  BarChart3, Plus, Play, Pause, Trash2, RefreshCw,
  Loader2, CheckCircle2, XCircle, Clock, Cat,
  ChevronLeft, Users, Zap, Crown, AlertCircle,
  Calendar, Shield,
} from "lucide-react";

// ─── 类型 ─────────────────────────────────────────────────────────────────────

interface ScheduledJob {
  id: number;
  name: string;
  skill_id: string;
  node_id: number | null;
  cron_expr: string;
  params: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: string | null;
  created_at: string;
}

interface ContentTask {
  id: number;
  skill_id: string;
  triggered_by: string | null;
  trigger_type: "manual" | "scheduled" | "api";
  status: "pending" | "running" | "success" | "failed";
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
}

interface UserSubscription {
  id: number;
  user_id: number;
  open_id: string;
  plan: string;
  content_quota: number;
  content_used: number;
  expires_at: string | null;
  quota_reset_at: string;
  created_at: string;
}

type AdminTab = "jobs" | "tasks" | "subscriptions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: ContentTask["status"]) {
  const cfg = {
    success: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-300", label: "成功" },
    failed:  { bg: "bg-red-500/10",   border: "border-red-500/30",   text: "text-red-300",   label: "失败" },
    running: { bg: "bg-blue-500/10",  border: "border-blue-500/30",  text: "text-blue-300",  label: "运行中" },
    pending: { bg: "bg-white/5",      border: "border-white/10",     text: "text-white/40",  label: "等待" },
  }[status] ?? { bg: "bg-white/5", border: "border-white/10", text: "text-white/40", label: status };

  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-['DM_Mono'] ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function planBadge(plan: string) {
  const cfg: Record<string, { color: string; label: string }> = {
    free:      { color: "#6B7280", label: "免费版" },
    content:   { color: "#C9A84C", label: "内容会员" },
    strategic: { color: "#8B5CF6", label: "战略会员" },
  };
  const c = cfg[plan] ?? cfg.free;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full border font-['DM_Mono']"
      style={{ background: `${c.color}18`, borderColor: `${c.color}40`, color: c.color }}
    >
      {c.label}
    </span>
  );
}

const PLAN_OPTIONS = [
  { value: "free",      label: "免费版 (5次/月)"       },
  { value: "content",   label: "内容会员 (50次/月)"    },
  { value: "strategic", label: "战略会员 (不限次数)"   },
];

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default function AdminContentJobs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("jobs");

  // Jobs state
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [showNewJob, setShowNewJob] = useState(false);
  const [newJob, setNewJob] = useState({ name: "", skillId: "", cronExpr: "0 9 * * *", params: "" });
  const [savingJob, setSavingJob] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState<number | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Subscriptions state
  const [subs, setSubs] = useState<UserSubscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [editSub, setEditSub] = useState<{ openId: string; userId: number; plan: string } | null>(null);
  const [savingSub, setSavingSub] = useState(false);

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const showFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const r = await fetch("/api/content/admin/jobs", { credentials: "include" });
      if (r.ok) setJobs((await r.json()).jobs ?? []);
    } finally { setLoadingJobs(false); }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const r = await fetch("/api/content/tasks?limit=50", { credentials: "include" });
      if (r.ok) setTasks((await r.json()).tasks ?? []);
    } finally { setLoadingTasks(false); }
  }, []);

  const fetchSubs = useCallback(async () => {
    try {
      setLoadingSubs(true);
      const r = await fetch("/api/content/admin/subscriptions", { credentials: "include" });
      if (r.ok) setSubs((await r.json()).subscriptions ?? []);
    } finally { setLoadingSubs(false); }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchJobs();
  }, [user, fetchJobs]);

  useEffect(() => {
    if (tab === "tasks") fetchTasks();
    if (tab === "subscriptions") fetchSubs();
  }, [tab, fetchTasks, fetchSubs]);

  // ── Job Actions ────────────────────────────────────────────────────────────

  const createJob = async () => {
    if (!newJob.name || !newJob.skillId || !newJob.cronExpr) return;
    try {
      setSavingJob(true);
      let params = {};
      try { params = JSON.parse(newJob.params || "{}"); } catch { /* ignore */ }
      const r = await fetch("/api/content/admin/jobs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newJob.name, skillId: newJob.skillId, cronExpr: newJob.cronExpr, params }),
      });
      const d = await r.json();
      if (r.ok) {
        showFeedback("定时任务已创建", true);
        setShowNewJob(false);
        setNewJob({ name: "", skillId: "", cronExpr: "0 9 * * *", params: "" });
        fetchJobs();
      } else {
        showFeedback(d.error ?? "创建失败", false);
      }
    } finally { setSavingJob(false); }
  };

  const toggleJob = async (job: ScheduledJob) => {
    await fetch(`/api/content/admin/jobs/${job.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !job.is_active }),
    });
    fetchJobs();
  };

  const deleteJob = async (id: number) => {
    if (!confirm("确认删除此定时任务？")) return;
    await fetch(`/api/content/admin/jobs/${id}`, { method: "DELETE", credentials: "include" });
    fetchJobs();
    showFeedback("已删除", true);
  };

  const runJobNow = async (id: number) => {
    try {
      setTriggeringJob(id);
      const r = await fetch(`/api/content/admin/jobs/${id}/run`, { method: "POST", credentials: "include" });
      const d = await r.json();
      showFeedback(d.message ?? (r.ok ? "已触发" : "触发失败"), r.ok);
    } finally { setTriggeringJob(null); }
  };

  // ── Subscription Actions ───────────────────────────────────────────────────

  const updateSub = async () => {
    if (!editSub) return;
    try {
      setSavingSub(true);
      const r = await fetch("/api/content/admin/subscriptions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSub),
      });
      const d = await r.json();
      if (r.ok) {
        showFeedback("套餐已更新", true);
        setEditSub(null);
        fetchSubs();
      } else {
        showFeedback(d.error ?? "更新失败", false);
      }
    } finally { setSavingSub(false); }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!user || (user as any).role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400/50 mx-auto mb-4" />
          <p className="text-white/60">需要管理员权限</p>
        </div>
      </div>
    );
  }

  const TABS: { key: AdminTab; label: string; icon: React.FC<any> }[] = [
    { key: "jobs",          label: "定时任务",   icon: Calendar },
    { key: "tasks",         label: "任务历史",   icon: BarChart3 },
    { key: "subscriptions", label: "用户订阅",   icon: Users    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/mao-ai">
              <button className="text-white/30 hover:text-white/60 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span className="font-['Noto_Serif_SC'] text-white font-semibold">内容调度控制台</span>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-['DM_Mono']">ADMIN</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/content">
              <button className="flex items-center gap-1 text-white/40 hover:text-white/70 text-sm transition-colors">
                <Cat className="w-3.5 h-3.5" /> 用户视图
              </button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pb-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors ${
                tab === key
                  ? "border-[#C9A84C] text-[#C9A84C]"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Feedback */}
        {feedback && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium ${
            feedback.ok ? "bg-green-500/20 border border-green-500/40 text-green-300" : "bg-red-500/20 border border-red-500/40 text-red-300"
          }`}>
            {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {feedback.msg}
          </div>
        )}

        {/* ── Tab: 定时任务 ── */}
        {tab === "jobs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-['Noto_Serif_SC'] text-white font-semibold">定时内容任务</h2>
              <div className="flex items-center gap-2">
                <button onClick={fetchJobs} className="text-white/30 hover:text-white/60 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loadingJobs ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setShowNewJob(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C] text-black text-xs font-semibold rounded-lg hover:bg-[#D4B55A] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 新建任务
                </button>
              </div>
            </div>

            {/* New Job Form */}
            {showNewJob && (
              <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-5 space-y-4">
                <h3 className="text-[#C9A84C] text-sm font-semibold">新建定时任务</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">任务名称</label>
                    <input
                      value={newJob.name}
                      onChange={e => setNewJob(p => ({ ...p, name: e.target.value }))}
                      placeholder="例：每日小红书内容生产"
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#C9A84C]/40 placeholder-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Skill ID</label>
                    <input
                      value={newJob.skillId}
                      onChange={e => setNewJob(p => ({ ...p, skillId: e.target.value }))}
                      placeholder="例：content-writer"
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#C9A84C]/40 placeholder-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Cron 表达式</label>
                    <input
                      value={newJob.cronExpr}
                      onChange={e => setNewJob(p => ({ ...p, cronExpr: e.target.value }))}
                      placeholder="0 9 * * *"
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#C9A84C]/40 font-['DM_Mono'] placeholder-white/20"
                    />
                    <p className="text-white/20 text-xs mt-1">常用：<code className="text-white/40">0 9 * * *</code> 每天9点 · <code className="text-white/40">0 9 * * 1</code> 每周一9点</p>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">参数 (JSON，可选)</label>
                    <input
                      value={newJob.params}
                      onChange={e => setNewJob(p => ({ ...p, params: e.target.value }))}
                      placeholder='{"platform": "xiaohongshu"}'
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#C9A84C]/40 font-['DM_Mono'] placeholder-white/20"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={createJob}
                    disabled={savingJob || !newJob.name || !newJob.skillId || !newJob.cronExpr}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#D4B55A] transition-colors disabled:opacity-50"
                  >
                    {savingJob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    创建
                  </button>
                  <button
                    onClick={() => setShowNewJob(false)}
                    className="px-4 py-2 text-white/40 hover:text-white/70 text-sm transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* Jobs List */}
            {loadingJobs ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
            ) : jobs.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
                <Calendar className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">还没有定时任务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div key={job.id} className={`bg-white/5 border rounded-xl p-4 flex items-center gap-4 transition-all ${
                    job.is_active ? "border-white/10" : "border-white/5 opacity-60"
                  }`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${job.is_active ? "bg-green-400" : "bg-white/20"}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">{job.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 font-['DM_Mono']">
                          {job.skill_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                        <code className="font-['DM_Mono'] text-white/50">{job.cron_expr}</code>
                        {job.last_run_at && (
                          <span>上次：{new Date(job.last_run_at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => runJobNow(job.id)}
                        disabled={triggeringJob === job.id}
                        title="立即运行"
                        className="p-1.5 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all disabled:opacity-50"
                      >
                        {triggeringJob === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => toggleJob(job)}
                        title={job.is_active ? "暂停" : "恢复"}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 transition-all"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteJob(job.id)}
                        title="删除"
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400/60 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: 任务历史 ── */}
        {tab === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-['Noto_Serif_SC'] text-white font-semibold">全局内容任务历史</h2>
              <button onClick={fetchTasks} className="text-white/30 hover:text-white/60 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loadingTasks ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingTasks ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
            ) : tasks.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
                <BarChart3 className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">暂无任务记录</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4 text-sm">
                    <div className="w-16 text-right text-white/20 font-['DM_Mono'] text-xs flex-shrink-0">#{task.id}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium">{task.skill_id}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-['DM_Mono'] ${
                          task.trigger_type === "scheduled"
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                            : "bg-white/5 border-white/10 text-white/30"
                        }`}>
                          {task.trigger_type === "scheduled" ? "定时" : "手动"}
                        </span>
                        {task.triggered_by && (
                          <span className="text-white/20 text-xs font-['DM_Mono'] truncate max-w-[100px]">{task.triggered_by}</span>
                        )}
                      </div>
                      {task.error_message && (
                        <p className="text-red-400/60 text-xs mt-0.5 truncate">{task.error_message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {statusBadge(task.status)}
                      <span className="text-white/20 text-xs">
                        {new Date(task.created_at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: 用户订阅 ── */}
        {tab === "subscriptions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-['Noto_Serif_SC'] text-white font-semibold">用户订阅管理</h2>
              <button onClick={fetchSubs} className="text-white/30 hover:text-white/60 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loadingSubs ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Edit Subscription Dialog */}
            {editSub && (
              <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-5 space-y-4">
                <h3 className="text-[#C9A84C] text-sm font-semibold">修改用户套餐</h3>
                <p className="text-white/40 text-xs font-['DM_Mono']">{editSub.openId}</p>
                <select
                  value={editSub.plan}
                  onChange={e => setEditSub(p => p ? { ...p, plan: e.target.value } : null)}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#C9A84C]/40"
                >
                  {PLAN_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#0A0A0A]">{opt.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    onClick={updateSub}
                    disabled={savingSub}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#D4B55A] disabled:opacity-50"
                  >
                    {savingSub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    保存
                  </button>
                  <button onClick={() => setEditSub(null)} className="px-4 py-2 text-white/40 hover:text-white/70 text-sm">
                    取消
                  </button>
                </div>
              </div>
            )}

            {loadingSubs ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
            ) : subs.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
                <Users className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">还没有用户订阅记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subs.map((sub) => (
                  <div key={sub.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium font-['DM_Mono'] truncate max-w-[160px]">{sub.open_id}</span>
                        {planBadge(sub.plan)}
                      </div>
                      <div className="text-white/30 text-xs mt-1 flex items-center gap-3">
                        <span>
                          配额：{sub.content_quota === -1 ? "不限" : `${sub.content_used}/${sub.content_quota}`}
                        </span>
                        <span>重置：{new Date(sub.quota_reset_at).toLocaleDateString("zh-CN")}</span>
                        {sub.expires_at && (
                          <span>到期：{new Date(sub.expires_at).toLocaleDateString("zh-CN")}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditSub({ openId: sub.open_id, userId: sub.user_id, plan: sub.plan })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 text-white/50 hover:text-white/80 text-xs rounded-lg transition-colors"
                    >
                      修改套餐
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
