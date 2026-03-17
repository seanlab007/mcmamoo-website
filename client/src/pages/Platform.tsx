/**
 * 猫眼内容自动化平台 — MaoYan Content Platform
 * 深色奢华主题，专为 LA CELLE PARIS 1802 多平台营销文案生成设计
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Sparkles, Wand2, Library, Zap, Globe, Loader2,
  BarChart3, Star, Search, BookOpen, Hash, Clock,
  CheckCircle2, AlertCircle, Eye, Edit3, ArrowLeft,
  Copy, Check, Download, RefreshCw, Trash2, Calendar, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ─── 常量 ─────────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "小红书", label: "小红书", icon: "📕" },
  { id: "Instagram", label: "Instagram", icon: "📸" },
  { id: "X (Twitter)", label: "X / Twitter", icon: "🐦" },
  { id: "微信朋友圈", label: "微信朋友圈", icon: "💬" },
  { id: "TikTok", label: "TikTok", icon: "🎵" },
  { id: "微博", label: "微博", icon: "🌐" },
];

const CONTENT_TYPES: Record<string, string[]> = {
  "小红书": ["图文笔记", "种草长文", "测评报告", "视频脚本", "合集推荐"],
  "Instagram": ["Caption", "Story Script", "Reel Script", "Carousel Copy"],
  "X (Twitter)": ["Thread", "Single Tweet", "Quote Tweet"],
  "微信朋友圈": ["种草文", "产品推荐", "生活方式分享"],
  "TikTok": ["视频脚本", "话题挑战文案", "直播话术"],
  "微博": ["长微博", "短评", "话题文案"],
};

const STYLES = [
  "情绪共鸣", "场景化描写", "对比测评", "故事叙述",
  "Luxury Storytelling", "Behind the Scenes", "Historical Facts",
  "高端礼品推荐", "法式生活美学", "仪式感种草",
];

const LANGUAGES = [
  { id: "zh", label: "中文", flag: "🇨🇳" },
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  published: "bg-green-500/20 text-green-400 border-green-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿", approved: "已审核", published: "已发布",
};

type Tab = "generate" | "library" | "batch" | "schedule";

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export default function Platform() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<Tab>("generate");

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-white">仅限管理员访问</h2>
          <p className="text-zinc-400 text-sm">猫眼内容平台需要管理员权限</p>
          <Link href="/">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />返回首页
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* 顶部导航 */}
      <div className="border-b border-zinc-800/60 bg-[#0d0d14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div className="w-px h-4 bg-zinc-700" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm tracking-wide">猫眼内容平台</span>
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs px-1.5 py-0">BETA</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900/60 rounded-lg p-1 border border-zinc-800">
            {([
              { id: "generate" as Tab, icon: Wand2, label: "文案生成" },
              { id: "library" as Tab, icon: Library, label: "文案库" },
              { id: "batch" as Tab, icon: Zap, label: "批量生成" },
              { id: "schedule" as Tab, icon: Calendar, label: "发布日历" },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tab === id
                    ? "bg-amber-500 text-black shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Globe className="w-3.5 h-3.5" />
            <a href="https://la-celle1802.com" target="_blank" rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors">la-celle1802.com</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === "generate" && <GenerateTab />}
        {tab === "library" && <LibraryTab />}
        {tab === "batch" && <BatchTab />}
        {tab === "schedule" && <ScheduleTab />}
      </div>
    </div>
  );
}

// ─── 文案生成 Tab ─────────────────────────────────────────────────────────────
function GenerateTab() {
  const [platform, setPlatform] = useState("小红书");
  const [contentType, setContentType] = useState("图文笔记");
  const [style, setStyle] = useState("情绪共鸣");
  const [language, setLanguage] = useState<"zh" | "en" | "fr">("zh");
  const [keywords, setKeywords] = useState("法式奈尊, 皇室香水, 1802, 历史传承");
  const [brand, setBrand] = useState("LA CELLE PARIS 1802");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.platform.generateCopy.useMutation({
    onSuccess: (data) => {
      setResult(data.content);
      if (data.saved) toast.success("文案已自动保存到文案库");
    },
    onError: (err) => toast.error(`生成失败: ${err.message}`),
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      brand, platform, contentType, style, language,
      keywords: keywords.split(/[,，、]/).map(k => k.trim()).filter(Boolean),
      save: true,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brand}_${platform}_${contentType}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左侧配置 */}
      <div className="space-y-5">
        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />品牌信息
          </h3>
          <Input value={brand} onChange={e => setBrand(e.target.value)}
            className="bg-zinc-800/60 border-zinc-700 text-white text-sm h-9"
            placeholder="输入品牌名称..." />
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />发布平台
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map(p => (
              <button key={p.id}
                onClick={() => { setPlatform(p.id); setContentType(CONTENT_TYPES[p.id]?.[0] || ""); }}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${
                  platform === p.id
                    ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                    : "border-zinc-700/60 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                }`}>
                <span className="text-lg">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-purple-400" />内容设置
          </h3>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">内容类型</label>
            <div className="flex flex-wrap gap-2">
              {(CONTENT_TYPES[platform] || []).map(ct => (
                <button key={ct} onClick={() => setContentType(ct)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    contentType === ct
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                  }`}>{ct}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">写作风格</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.slice(0, 6).map(s => (
                <button key={s} onClick={() => setStyle(s)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    style === s
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Hash className="w-4 h-4 text-green-400" />关键词 & 语言
          </h3>
          <Textarea value={keywords} onChange={e => setKeywords(e.target.value)}
            className="bg-zinc-800/60 border-zinc-700 text-white text-sm resize-none h-16"
            placeholder="法式奈尊, 皇室香水, 历史传承..." />
          <div className="flex gap-2">
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => setLanguage(l.id as "zh" | "en" | "fr")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  language === l.id
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                }`}>
                <span>{l.flag}</span>{l.label}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={generateMutation.isPending}
          className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold text-sm shadow-lg shadow-amber-500/20">
          {generateMutation.isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI 正在创作...</>
            : <><Wand2 className="w-4 h-4 mr-2" />生成文案</>}
        </Button>
      </div>

      {/* 右侧结果 */}
      <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-zinc-300">生成结果</span>
            {result && <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />已生成
            </Badge>}
          </div>
          {result && (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={handleCopy}
                className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDownload}
                className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800">
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleGenerate}
                className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative w-12 h-12">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
              </div>
              <p className="text-zinc-300 text-sm font-medium">AI 正在为您创作...</p>
              <p className="text-zinc-500 text-xs">正在生成 {platform} · {contentType}</p>
            </div>
          ) : result ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-200 leading-relaxed">{result}</pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-amber-500/60" />
              </div>
              <p className="text-zinc-400 text-sm font-medium">配置参数后点击生成</p>
              <p className="text-zinc-600 text-xs">支持小红书、Instagram、X、微信等平台</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 文案库 Tab ───────────────────────────────────────────────────────────────
function LibraryTab() {
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: copies = [], isLoading } = trpc.platform.listCopies.useQuery({ limit: 200 });
  const deleteMutation = trpc.platform.deleteCopy.useMutation({
    onSuccess: () => { utils.platform.listCopies.invalidate(); toast.success("已删除"); },
  });
  const statusMutation = trpc.platform.updateCopyStatus.useMutation({
    onSuccess: () => { utils.platform.listCopies.invalidate(); toast.success("状态已更新"); },
  });

  const filtered = copies.filter(c => {
    const matchSearch = !search || c.content.includes(search) || c.brand.includes(search) || c.platform.includes(search);
    const matchPlatform = filterPlatform === "all" || c.platform === filterPlatform;
    return matchSearch && matchPlatform;
  });

  const handleExportAll = () => {
    const md = filtered.map(c =>
      `## ${c.brand} × ${c.platform} — ${c.contentType}\n> 风格：${c.style}\n\n${c.content}\n\n---`
    ).join("\n\n");
    const blob = new Blob([`# 猫眼文案库 — LA CELLE PARIS 1802\n\n${md}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "maoyan_copies.md"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文案..."
            className="pl-9 bg-zinc-900/60 border-zinc-800 text-white text-sm h-9" />
        </div>
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
          className="bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 h-9 outline-none">
          <option value="all">全部平台</option>
          {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500">{filtered.length} 篇文案</span>
          <Button size="sm" variant="outline" onClick={handleExportAll}
            className="h-9 border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />导出全部
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <BookOpen className="w-10 h-10 text-zinc-700" />
          <p className="text-zinc-500 text-sm">文案库为空，先去生成一些文案吧</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(copy => (
            <div key={copy.id} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white truncate">{copy.brand}</span>
                    <span className="text-zinc-600">×</span>
                    <span className="text-xs text-zinc-400">{copy.platform}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs text-zinc-500">{copy.contentType}</span>
                    <Badge className={`text-xs px-1.5 py-0 border ${STATUS_COLORS[copy.status || "draft"]}`}>
                      {STATUS_LABELS[copy.status || "draft"]}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{copy.content.slice(0, 100)}...</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === copy.id ? null : copy.id)}
                    className="h-7 w-7 p-0 text-zinc-500 hover:text-white hover:bg-zinc-800">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <select value={copy.status || "draft"}
                    onChange={e => statusMutation.mutate({ id: copy.id, status: e.target.value as "draft" | "approved" | "published" })}
                    className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs rounded px-1.5 h-7 outline-none">
                    <option value="draft">草稿</option>
                    <option value="approved">已审核</option>
                    <option value="published">已发布</option>
                  </select>
                  <Button size="sm" variant="ghost"
                    onClick={() => { navigator.clipboard.writeText(copy.content); toast.success("已复制"); }}
                    className="h-7 w-7 p-0 text-zinc-500 hover:text-white hover:bg-zinc-800">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ id: copy.id })}
                    className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {expandedId === copy.id && (
                <div className="px-4 pb-4 border-t border-zinc-800/60 pt-3">
                  <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-300 leading-relaxed max-h-64 overflow-y-auto">{copy.content}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 批量生成 Tab ─────────────────────────────────────────────────────────────
function BatchTab() {
  const utils = trpc.useUtils();
  const [results, setResults] = useState<Array<{ platform: string; contentType: string; success: boolean }>>([]);

  const batchMutation = trpc.platform.batchGenerate.useMutation({
    onSuccess: (data) => {
      setResults(data.results as any);
      utils.platform.listCopies.invalidate();
      toast.success(`批量生成完成！成功 ${data.success}/${data.total} 篇`);
    },
    onError: (err) => toast.error(`批量生成失败: ${err.message}`),
  });

  const BATCH_TASKS = [
    { platform: "小红书", contentType: "图文笔记", style: "情绪共鸣", lang: "🇨🇳 中文" },
    { platform: "小红书", contentType: "种草长文", style: "场景化描写", lang: "🇨🇳 中文" },
    { platform: "Instagram", contentType: "Caption", style: "Luxury Storytelling", lang: "🇬🇧 英文" },
    { platform: "Instagram", contentType: "Story Script", style: "Behind the Scenes", lang: "🇬🇧 英文" },
    { platform: "X (Twitter)", contentType: "Thread", style: "Historical Facts", lang: "🇬🇧 英文" },
    { platform: "微信朋友圈", contentType: "种草文", style: "高端礼品推荐", lang: "🇨🇳 中文" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">一键批量生成推广文案</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              自动为 <strong className="text-amber-400">LA CELLE PARIS 1802</strong> 生成 6 篇多平台推广文案，
              覆盖小红书、Instagram、X、微信朋友圈，中英双语。
              网站链接 <strong className="text-amber-400">la-celle1802.com</strong> 将自然嵌入每篇文案。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />生成任务预览
        </h3>
        <div className="grid gap-2">
          {BATCH_TASKS.map((task, i) => {
            const result = results[i];
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-lg">
                <span className="text-zinc-600 text-xs w-5 text-right">{i + 1}</span>
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-300 font-medium">{task.platform}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs text-zinc-400">{task.contentType}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs text-zinc-500">{task.style}</span>
                  <span className="text-xs text-zinc-600">{task.lang}</span>
                </div>
                {result ? (
                  result.success
                    ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                ) : batchMutation.isPending
                  ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  : <Clock className="w-4 h-4 text-zinc-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      <Button
        onClick={() => batchMutation.mutate({ platforms: PLATFORMS.map(p => p.id) })}
        disabled={batchMutation.isPending}
        className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-xl shadow-amber-500/20">
        {batchMutation.isPending
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />正在批量生成 6 篇文案...</>
          : <><Zap className="w-4 h-4 mr-2" />一键批量生成 6 篇推广文案</>}
      </Button>

      {results.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-green-300 text-sm font-medium">
              批量生成完成！成功 {results.filter(r => r.success).length}/{results.length} 篇
            </p>
            <p className="text-green-500/70 text-xs mt-0.5">所有文案已保存到文案库，可在「文案库」标签查看和管理</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 发布日历 Tab ──────────────────────────────────────────────────────────────
function ScheduleTab() {
  const utils = trpc.useUtils();
  const { data: copies } = trpc.platform.listCopies.useQuery({});
  const { data: scheduled, isLoading } = trpc.platform.getScheduled.useQuery();
  const scheduleMutation = trpc.platform.scheduleCopy.useMutation({
    onSuccess: () => {
      toast.success("已加入发布日历");
      utils.platform.listCopies.invalidate();
      utils.platform.getScheduled.invalidate();
    },
    onError: (err) => toast.error("设置失败: " + err.message),
  });

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedCopyId, setSelectedCopyId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

  const scheduledByDay: Record<string, typeof scheduled> = {};
  (scheduled || []).forEach(c => {
    if (c.scheduledAt) {
      const d = new Date(c.scheduledAt).toISOString().slice(0, 10);
      if (!scheduledByDay[d]) scheduledByDay[d] = [];
      scheduledByDay[d]!.push(c);
    }
  });

  const handleSchedule = () => {
    if (!selectedCopyId || !scheduleDate) return toast.error("请选择文案和日期");
    const dt = new Date(`${scheduleDate}T${scheduleTime}:00`);
    scheduleMutation.mutate({ id: selectedCopyId, scheduledAt: dt.getTime() });
    setSelectedCopyId(null);
    setScheduleDate("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：日历 */}
      <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />发布日历
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center text-sm"
            >&lt;</button>
            <span className="text-sm text-zinc-300 w-20 text-center">{viewYear}年 {monthNames[viewMonth]}</span>
            <button
              onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center text-sm"
            >&gt;</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["日","一","二","三","四","五","六"].map(d => (
            <div key={d} className="text-center text-xs text-zinc-600 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayItems = scheduledByDay[dateStr] || [];
            const isToday = dateStr === today.toISOString().slice(0, 10);
            return (
              <div key={day} onClick={() => setScheduleDate(dateStr)}
                className={`min-h-[52px] rounded-lg p-1.5 cursor-pointer transition-all border ${
                  scheduleDate === dateStr ? "border-amber-500/60 bg-amber-500/10" :
                  isToday ? "border-blue-500/40 bg-blue-500/5" :
                  dayItems.length > 0 ? "border-green-500/30 bg-green-500/5" :
                  "border-zinc-800/40 hover:border-zinc-700 hover:bg-zinc-800/30"
                }`}>
                <div className={`text-xs font-medium mb-1 ${
                  isToday ? "text-blue-400" : scheduleDate === dateStr ? "text-amber-400" : "text-zinc-400"
                }`}>{day}</div>
                {dayItems.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="text-[9px] text-green-400 bg-green-500/10 rounded px-1 truncate mb-0.5">
                    {new Date(item.scheduledAt!).toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' })} {item.platform}
                  </div>
                ))}
                {dayItems.length > 2 && <div className="text-[9px] text-zinc-500">+{dayItems.length - 2}更多</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧：调度设置 + 待发布列表 */}
      <div className="space-y-4">
        {/* 调度设置卡片 */}
        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400" />设置发布时间
          </h3>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">选择文案</label>
            <select value={selectedCopyId || ""} onChange={e => setSelectedCopyId(Number(e.target.value) || null)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 h-9 outline-none">
              <option value="">— 选择文案 —</option>
              {(copies || []).map(c => (
                <option key={c.id} value={c.id}>{c.platform} · {c.contentType} [{c.status}]</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">发布日期</label>
            <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs h-9" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">发布时间</label>
            <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs h-9" />
          </div>
          <Button onClick={handleSchedule}
            disabled={scheduleMutation.isPending || !selectedCopyId || !scheduleDate}
            className="w-full h-9 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs">
            {scheduleMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <><Calendar className="w-3.5 h-3.5 mr-1.5" />加入发布日历</>}
          </Button>
        </div>

        {/* 待发布列表 */}
        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />待发布队列
            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs px-1.5 py-0">
              {(scheduled || []).length}
            </Badge>
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            </div>
          ) : (scheduled || []).length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-xs">暂无已调度文案</p>
              <p className="text-zinc-600 text-xs mt-1">点击左侧日历选择日期后设置</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(scheduled || []).map(c => (
                <div key={c.id} className="flex items-start gap-2 p-2.5 bg-zinc-800/40 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-zinc-300 font-medium">{c.platform}</span>
                      <span className="text-zinc-600 text-xs">·</span>
                      <span className="text-xs text-zinc-500">{c.contentType}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-400">
                        {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString('zh', {
                          month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => scheduleMutation.mutate({ id: c.id, scheduledAt: null })}
                    className="text-zinc-600 hover:text-red-400 transition-colors mt-0.5"
                    title="取消调度"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
