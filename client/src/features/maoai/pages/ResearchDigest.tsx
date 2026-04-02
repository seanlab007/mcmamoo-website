/**
 * ResearchDigest 页面
 * ─────────────────────────────────────────────────────────────────────────────
 * 展示 HBR 管理学简报 + 学术期刊最新论文
 * 支持 AI 自动提炼核心理念、按相关度筛选与猫眼相关研究
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BookOpen,
  FlaskConical,
  Cat,
  RefreshCw,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Brain,
} from "lucide-react";
import { MAOAI_BACKEND_URL } from "../constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DigestItem {
  id: string;
  source: "hbr" | "arxiv" | "pubmed";
  category: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  relevanceScore: number;
  keywords: string[];
}

// ─── Card Component ───────────────────────────────────────────────────────────

function DigestCard({ item, showRelevance = false }: { item: DigestItem; showRelevance?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const sourceColor = {
    hbr: "bg-red-500/20 text-red-300 border-red-500/30",
    arxiv: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    pubmed: "bg-green-500/20 text-green-300 border-green-500/30",
  }[item.source];

  const sourceLabel = { hbr: "HBR", arxiv: "arXiv", pubmed: "PubMed" }[item.source];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${sourceColor} font-medium`}>
              {sourceLabel}
            </span>
            <span className="text-xs text-white/40">{item.category}</span>
            {showRelevance && item.relevanceScore > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                相关度 {item.relevanceScore}%
              </span>
            )}
          </div>

          <h3 className="text-sm font-medium text-white/90 leading-snug mb-2">{item.title}</h3>

          {item.summary && (
            <div>
              <p className={`text-xs text-white/60 leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
                {item.summary}
              </p>
              {item.summary.length > 180 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-blue-400 mt-1 hover:text-blue-300"
                >
                  {expanded ? (
                    <><ChevronUp size={12} /> 收起</>
                  ) : (
                    <><ChevronDown size={12} /> 展开</>
                  )}
                </button>
              )}
            </div>
          )}

          {item.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.keywords.slice(0, 5).map((kw) => (
                <span key={kw} className="text-xs px-1.5 py-0.5 bg-white/10 text-white/50 rounded">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-white/30 hover:text-blue-400 transition-colors mt-0.5"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

// ─── AI Summarize Button ──────────────────────────────────────────────────────

function AISummarizeButton({
  mode,
  label,
}: {
  mode: "hbr" | "science" | "maoyan" | "all";
  label: string;
}) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const { data: formattedData } = trpc.researchDigest.getFormattedForAI.useQuery(
    { mode },
    { enabled: false }
  );

  const utils = trpc.useUtils();

  const handleSummarize = async () => {
    setLoading(true);
    setVisible(true);
    setSummary("");

    try {
      // 1. 先获取格式化文本
      const result = await utils.researchDigest.getFormattedForAI.fetch({ mode });
      const digestText = result.text;

      // 2. 调用 MaoAI 聊天 API 做提炼
      const token = localStorage.getItem("maoai_session_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const prompt = mode === "hbr"
        ? `以下是哈佛商业评论(HBR)最新文章列表。请用中文提炼出：\n1. 最重要的3-5个管理学核心理念\n2. 对互联网/娱乐/内容科技公司的启示\n3. 每个理念配一句可操作的行动建议\n\n---\n${digestText}`
        : mode === "science"
        ? `以下是最新学术论文列表（数学/物理/化学/生物/计算机/AI领域）。请用中文提炼：\n1. 最值得关注的3-5项重大突破\n2. 每项突破的核心技术创新点\n3. 对商业应用的潜在价值\n\n---\n${digestText}`
        : mode === "maoyan"
        ? `以下是与猫眼业务相关的最新学术研究和管理学文章。请用中文分析：\n1. 哪些研究对猫眼的票务/推荐/数据业务最有价值\n2. 每项研究的技术核心与可借鉴之处\n3. 建议猫眼团队优先关注的研究方向\n\n---\n${digestText}`
        : `以下是最新的管理学和学术研究内容。请用中文做综合提炼：\n1. 本周最重要的3个管理学洞察\n2. 最值得关注的3项科技/学术突破\n3. 与猫眼业务最相关的发现\n\n---\n${digestText}`;

      const response = await fetch(`${MAOAI_BACKEND_URL}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "deepseek-chat",
          stream: true,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) setSummary((prev) => prev + delta);
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      setSummary("提炼失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-300 text-sm transition-all disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {label}
      </button>

      {visible && (
        <div className="mt-3 p-4 bg-purple-900/20 border border-purple-500/20 rounded-xl text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
          {summary || (loading ? <span className="animate-pulse">AI 正在提炼中...</span> : "")}
          {!loading && summary && (
            <button
              onClick={() => setVisible(false)}
              className="block mt-3 text-xs text-white/40 hover:text-white/60"
            >
              收起
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResearchDigestPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"hbr" | "science" | "maoyan">("hbr");
  const [forceRefresh, setForceRefresh] = useState(false);

  const { data, isLoading, refetch, isFetching } = trpc.researchDigest.getDigest.useQuery(
    { forceRefresh, includeHbr: true, includeScience: true },
    { staleTime: 30 * 60 * 1000 }
  );

  const handleRefresh = () => {
    setForceRefresh(true);
    refetch().finally(() => setForceRefresh(false));
  };

  const tabs = [
    { id: "hbr" as const, label: "HBR 管理学", icon: BookOpen, count: data?.hbrItems.length },
    { id: "science" as const, label: "科学期刊", icon: FlaskConical, count: data?.scienceItems.length },
    { id: "maoyan" as const, label: "猫眼相关", icon: Cat, count: data?.maoyanRelevantItems.length },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f1117] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Brain className="text-purple-400" size={22} />
          <div>
            <h1 className="text-base font-semibold">研究简报</h1>
            <p className="text-xs text-white/40">
              HBR 管理学 + 学术期刊 · 定期更新
              {data?.fetchedAt && (
                <span className="ml-2">
                  上次更新：{new Date(data.fetchedAt).toLocaleString("zh-CN")}
                  {data.fromCache && <span className="ml-1 text-yellow-400/60">(缓存)</span>}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          刷新
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-white/50 hover:text-white/70"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs px-1.5 py-0.5 bg-white/10 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center h-40 gap-3 text-white/50">
            <Loader2 size={20} className="animate-spin" />
            <span>正在抓取最新内容...</span>
          </div>
        ) : (
          <div className="max-w-3xl space-y-4">
            {/* AI Summarize */}
            <div className="flex items-center gap-3 mb-4">
              <AISummarizeButton
                mode={activeTab}
                label={
                  activeTab === "hbr"
                    ? "AI 提炼管理学核心理念"
                    : activeTab === "science"
                    ? "AI 分析重大科技突破"
                    : "AI 分析猫眼相关研究"
                }
              />
            </div>

            {/* Items */}
            {activeTab === "hbr" &&
              (data?.hbrItems.length === 0 ? (
                <div className="text-center text-white/40 py-12">暂无 HBR 内容，点击刷新重新抓取</div>
              ) : (
                data?.hbrItems.map((item) => <DigestCard key={item.id} item={item} />)
              ))}

            {activeTab === "science" &&
              (data?.scienceItems.length === 0 ? (
                <div className="text-center text-white/40 py-12">暂无学术论文内容</div>
              ) : (
                data?.scienceItems.map((item) => <DigestCard key={item.id} item={item} />)
              ))}

            {activeTab === "maoyan" &&
              (data?.maoyanRelevantItems.length === 0 ? (
                <div className="text-center text-white/40 py-12">
                  暂无与猫眼相关的内容（相关度 &gt; 15%）
                </div>
              ) : (
                data?.maoyanRelevantItems.map((item) => (
                  <DigestCard key={item.id} item={item} showRelevance />
                ))
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
