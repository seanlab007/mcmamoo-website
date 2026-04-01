import { useState, useEffect, useRef, useCallback } from "react";
import {
  Video, Download, Scissors, FileVideo, Settings, Loader2,
  Play, CheckCircle, AlertCircle, Clock, ChevronRight,
  Sparkles, Subtitles, Mic2, Zap, RefreshCw, Trash2, DownloadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import type { ReactNode } from "react";

// ─── API 配置 ─────────────────────────────────────────────────
// 本地后端: Vite 代理到 backend/maoyan-video-tools (FastAPI port 8080)
const API_BASE = "/api/v1/video";

// ─── 类型定义 ─────────────────────────────────────────────────

type Platform = "youtube" | "bilibili" | "douyin" | "local";
type JobStatus = "pending" | "running" | "completed" | "error";
type Tool = "moviepy" | "caption" | "translate" | "tts" | "short" | "full";

interface VideoJob {
  id: string;
  title: string;
  tool: Tool;
  platform: Platform;
  status: JobStatus;
  progress: number;
  message: string;
  result: any;
  createdAt: string;
}

interface ToolCard {
  id: Tool;
  label: string;
  desc: string;
  icon: ReactNode;
  color: string;
  tab: string;
}

// ─── 工具卡片数据 ──────────────────────────────────────────────

const TOOLS: ToolCard[] = [
  {
    id: "moviepy",
    label: "视频剪辑",
    desc: "剪切/拼接/加字幕/加水印/转竖屏",
    icon: <Scissors className="w-6 h-6" />,
    color: "text-blue-400",
    tab: "clip",
  },
  {
    id: "caption",
    label: "字幕生成",
    desc: "Whisper ASR 自动生成字幕",
    icon: <Subtitles className="w-6 h-6" />,
    color: "text-green-400",
    tab: "caption",
  },
  {
    id: "translate",
    label: "字幕翻译",
    desc: "多语言字幕翻译，支持中英日韩",
    icon: <Sparkles className="w-6 h-6" />,
    color: "text-yellow-400",
    tab: "translate",
  },
  {
    id: "tts",
    label: "AI 配音",
    desc: "Edge-TTS 中文神经网络配音",
    icon: <Mic2 className="w-6 h-6" />,
    color: "text-purple-400",
    tab: "tts",
  },
  {
    id: "short",
    label: "短视频生成",
    desc: "AI 分析内容 + 自动剪辑 Shorts",
    icon: <Zap className="w-6 h-6" />,
    color: "text-pink-400",
    tab: "short",
  },
  {
    id: "full",
    label: "完整流水线",
    desc: "下载 → 字幕 → 翻译 → 配音 → 合成",
    icon: <RefreshCw className="w-6 h-6" />,
    color: "text-orange-400",
    tab: "full",
  },
];

// ─── 辅助函数 ─────────────────────────────────────────────────

function formatTime(t: number) {
  return new Date(t).toLocaleTimeString("zh-CN");
}

function detectPlatform(url: string): Platform {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("bilibili.com")) return "bilibili";
  if (url.includes("douyin.com")) return "douyin";
  return "local";
}

function detectVideoId(url: string, platform: Platform): string {
  if (platform === "youtube") {
    const m = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    return m ? m[1].slice(0, 12) : url;
  }
  if (platform === "bilibili") {
    const m = url.match(/video\/(BV[\w]+)/);
    return m ? m[1] : url;
  }
  return url.slice(0, 20);
}

function getStatusBadge(status: JobStatus) {
  const map: Record<JobStatus, { label: string; cls: string; icon: ReactNode }> = {
    pending:   { label: "等待",  cls: "bg-gray-600 text-gray-200", icon: <Clock className="w-3 h-3" /> },
    running:   { label: "运行中", cls: "bg-blue-600 text-blue-200",  icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    completed: { label: "完成",  cls: "bg-green-600 text-green-200", icon: <CheckCircle className="w-3 h-3" /> },
    error:     { label: "错误",  cls: "bg-red-600 text-red-200",    icon: <AlertCircle className="w-3 h-3" /> },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

// ─── SSE 进度监听 ─────────────────────────────────────────────

function useJobStream(jobId: string, onUpdate: (job: VideoJob) => void) {
  useEffect(() => {
    if (!jobId) return;
    const es = new EventSource(`${API_BASE}/stream/${jobId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.current !== undefined) {
          onUpdate({ id: jobId, progress: data.current, message: data.message || "", status: data.status || "running", title: "", tool: "moviepy", platform: "local", result: data.result, createdAt: "" });
        }
        if (e.type === "done") {
          es.close();
        }
      } catch {}
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [jobId]);
}

// ─── 主组件 ───────────────────────────────────────────────────

export default function AutoClip() {
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("clip");
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [liveProgress, setLiveProgress] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 工具相关状态
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);
  const [watermark, setWatermark] = useState("");
  const [captionLang, setCaptionLang] = useState("auto");
  const [translateLang, setTranslateLang] = useState("zh-CN");
  const [ttsVoice, setTtsVoice] = useState("zh-CN-XiaoxiaoNeural");
  const [ttsText, setTtsText] = useState("");
  const [shortTopic, setShortTopic] = useState("");
  const [shortStyle, setShortStyle] = useState("viral");
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem("maoyan_openai_key") || "");

  // SSE 监听
  const updateJob = useCallback((partial: Partial<VideoJob>) => {
    if (!activeJobId) return;
    setJobs(prev => prev.map(j => j.id === activeJobId ? { ...j, ...partial } : j));
    if (partial.progress !== undefined) setLiveProgress(partial.progress);
    if (partial.message !== undefined) setLiveMessage(partial.message);
  }, [activeJobId]);

  useJobStream(activeJobId || "", updateJob);

  // ── 通用 API 调用 ─────────────────────────────────────────────
  const callAPI = async (endpoint: string, body: object) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "请求失败");
    }
    return res.json();
  };

  // ── 提交任务 ─────────────────────────────────────────────────
  const submitJob = async (tool: Tool, title: string, body: object) => {
    if (!url && tool !== "tts") { setError("请输入视频 URL"); return; }
    if (tool === "tts" && !ttsText) { setError("请输入配音文本"); return; }
    setError(""); setLoading(true);

    try {
      const data = await callAPI(`/${tool}`, body);
      const platform = detectPlatform(url);
      const newJob: VideoJob = {
        id: data.job_id,
        title: title || `${TOOLS.find(t => t.id === tool)?.label} - ${detectVideoId(url, platform)}`,
        tool,
        platform,
        status: "running",
        progress: 0,
        message: "任务已提交，等待处理...",
        result: null,
        createdAt: new Date().toLocaleString("zh-CN"),
      };
      setJobs(prev => [newJob, ...prev]);
      setActiveJobId(data.job_id);
      setLiveProgress(0);
      setLiveMessage(newJob.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 工具操作按钮 ─────────────────────────────────────────────
  const handleClip = () => submitJob("moviepy", `剪辑 ${clipStart}s-${clipEnd}s`, { video_path: url, start_time: clipStart, end_time: clipEnd, output_path: `clips/${Date.now()}.mp4`, watermark_text: watermark || undefined });

  const handleCaption = () => submitJob("caption", "字幕生成", { video_path: url, model_size: "base", language: captionLang, output_srt: `subtitles/${Date.now()}.srt` });

  const handleTranslate = () => submitJob("translate", "字幕翻译", { srt_path: `subtitles/${Date.now() - 1000}.srt`, target_lang: translateLang, output_srt: `subtitles/${Date.now()}.srt` });

  const handleTTS = () => {
    if (!ttsText.trim()) { setError("请输入配音文本"); return; }
    submitJob("tts", "AI 配音", { text: ttsText, voice: ttsVoice, output_path: `tts/${Date.now()}.mp3` });
  };

  const handleShort = () => {
    if (!shortTopic.trim()) { setError("请输入视频主题"); return; }
    submitJob("short", `短视频 - ${shortTopic}`, { video_path: url, topic: shortTopic, style: shortStyle, target_platform: "shorts", num_clips: 5, api_key: openaiKey || undefined });
  };

  const handleFullPipeline = () => {
    if (!url) { setError("请输入视频 URL"); return; }
    submitJob("full", "完整流水线", { video_url: url, target_lang: translateLang, tts_voice: ttsVoice, api_key: openaiKey || undefined });
  };

  const handleDownload = () => submitJob("download", "视频下载", { url, platform: "auto", output_dir: "downloads" });

  // ── 提交方式：URL 还是上传 ───────────────────────────────────
  const currentTool = TOOLS.find(t => t.tab === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Video className="w-8 h-8 text-purple-400" />
              猫眼 AutoClip
            </h1>
            <p className="text-gray-400 mt-1">本地 + 云端 双轨视频智能处理 · MoviePy · Whisper · Edge-TTS · ShortGPT</p>
          </div>
          <Button variant="outline" onClick={() => setJobs([])} className="border-slate-600 text-gray-300 hover:bg-slate-800">
            <Trash2 className="w-4 h-4 mr-2" /> 清空记录
          </Button>
        </div>

        {/* ── 错误提示 ── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button className="ml-auto text-sm underline" onClick={() => setError("")}>关闭</button>
          </div>
        )}

        {/* ── 工具选择 Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-slate-800/80 border border-slate-700 gap-1 flex-nowrap">
              {TOOLS.map(tool => (
                <TabsTrigger
                  key={tool.id}
                  value={tool.tab}
                  className={`data-[state=active]:bg-slate-700 data-[state=active]:text-white text-gray-400 text-sm whitespace-nowrap ${tool.color}`}
                >
                  <span className="mr-1">{tool.icon}</span>
                  {tool.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── 剪辑 ── */}
          <TabsContent value="clip" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><Scissors className="w-5 h-5 text-blue-400" />视频剪辑</CardTitle><CardDescription className="text-gray-400">剪切片段 · 加字幕水印 · 转竖屏</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="YouTube / B站 / 本地视频 URL" value={url} onChange={e => setUrl(e.target.value)} className="bg-slate-700 border-slate-600 text-white placeholder-gray-500" />
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-gray-300 text-xs">开始时间(s)</Label><Input type="number" value={clipStart} onChange={e => setClipStart(Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white" /></div>
                    <div><Label className="text-gray-300 text-xs">结束时间(s)</Label><Input type="number" value={clipEnd} onChange={e => setClipEnd(Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white" /></div>
                  </div>
                  <div><Label className="text-gray-300 text-xs">水印文字（可选）</Label><Input placeholder="如: 猫眼内容平台" value={watermark} onChange={e => setWatermark(e.target.value)} className="bg-slate-700 border-slate-600 text-white" /></div>
                  <div className="flex gap-2">
                    <Button onClick={handleClip} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700"><Download className="w-4 h-4 mr-2" />{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "开始剪辑"}</Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-slate-600 text-gray-300 hover:bg-slate-700"><FileVideo className="w-4 h-4 mr-2" />上传视频</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white">快速下载</CardTitle><CardDescription className="text-gray-400">支持 YouTube / B站 / 抖音</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="视频 URL" value={url} onChange={e => setUrl(e.target.value)} className="bg-slate-700 border-slate-600 text-white placeholder-gray-500" />
                  <div className="p-3 bg-slate-700/50 rounded-lg text-sm text-gray-400">
                    {detectPlatform(url) === "youtube" && <span className="text-red-400">▶ YouTube 视频</span>}
                    {detectPlatform(url) === "bilibili" && <span className="text-pink-400">▶ B站 视频</span>}
                    {detectPlatform(url) === "douyin" && <span className="text-gray-300">▶ 抖音 视频</span>}
                    {detectPlatform(url) === "local" && <span className="text-blue-400">📁 本地视频</span>}
                  </div>
                  <Button onClick={handleDownload} disabled={loading} className="w-full bg-green-600 hover:bg-green-700"><DownloadCloud className="w-4 h-4 mr-2" />{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "下载视频"}</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 字幕生成 ── */}
          <TabsContent value="caption" className="space-y-4">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Subtitles className="w-5 h-5 text-green-400" />字幕生成</CardTitle><CardDescription className="text-gray-400">Whisper ASR 自动识别 · 支持中英日韩等 100+ 语言</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="视频 URL" value={url} onChange={e => setUrl(e.target.value)} className="bg-slate-700 border-slate-600 text-white placeholder-gray-500" />
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-gray-300 text-xs">语言</Label>
                    <select value={captionLang} onChange={e => setCaptionLang(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2">
                      <option value="auto">自动检测</option>
                      <option value="zh">中文</option>
                      <option value="en">英文</option>
                      <option value="ja">日语</option>
                      <option value="ko">韩语</option>
                    </select>
                  </div>
                  <div><Label className="text-gray-300 text-xs">模型精度</Label>
                    <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2">
                      <option value="base">Base（推荐 · 速度/精度平衡）</option>
                      <option value="small">Small（更精准）</option>
                      <option value="medium">Medium（高精度）</option>
                      <option value="tiny">Tiny（最快）</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleCaption} disabled={loading} className="w-full bg-green-600 hover:bg-green-700"><Sparkles className="w-4 h-4 mr-2" />{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "生成字幕"}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 字幕翻译 ── */}
          <TabsContent value="translate" className="space-y-4">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400" />字幕翻译</CardTitle><CardDescription className="text-gray-400">多语言字幕翻译 · DeepL / Google / OpenAI</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="SRT 文件路径（需先生成字幕）" className="bg-slate-700 border-slate-600 text-white placeholder-gray-500" />
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-gray-300 text-xs">目标语言</Label>
                    <select value={translateLang} onChange={e => setTranslateLang(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2">
                      <option value="zh-CN">中文</option>
                      <option value="en">英文</option>
                      <option value="ja">日语</option>
                      <option value="ko">韩语</option>
                      <option value="es">西班牙语</option>
                      <option value="fr">法语</option>
                      <option value="de">德语</option>
                      <option value="pt">葡萄牙语</option>
                    </select>
                  </div>
                  <div><Label className="text-gray-300 text-xs">翻译引擎</Label>
                    <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2">
                      <option value="google">Google Translate（免费）</option>
                      <option value="deepl">DeepL（更自然）</option>
                      <option value="openai">OpenAI（高质量）</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleTranslate} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-700"><Sparkles className="w-4 h-4 mr-2" />{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "翻译字幕"}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── AI 配音 ── */}
          <TabsContent value="tts" className="space-y-4">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Mic2 className="w-5 h-5 text-purple-400" />AI 配音</CardTitle><CardDescription className="text-gray-400">Edge-TTS 神经网络中文配音 · 免费高速</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="text-gray-300 text-xs">配音文本（最多 500 字）</Label>
                  <textarea value={ttsText} onChange={e => setTtsText(e.target.value.slice(0, 500))} rows={5} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-3 mt-1 resize-none" placeholder="输入需要配音的文字..." />
                  <div className="text-xs text-gray-500 text-right">{ttsText.length}/500</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-gray-300 text-xs">配音音色</Label>
                    <select value={ttsVoice} onChange={e => setTtsVoice(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2">
                      <option value="zh-CN-XiaoxiaoNeural">晓晓（女·标准）</option>
                      <option value="zh-CN-YunxiNeural">云希（男·年轻）</option>
                      <option value="zh-CN-YunyangNeural">云扬（男·播音）</option>
                      <option value="zh-CN-Xiaoyi">小艺（女·活泼）</option>
                      <option value="en-US-JennyNeural">Jenny（英文女）</option>
                      <option value="ja-JP-NanamiNeural">七海（日语女）</option>
                    </select>
                  </div>
                  <div><Label className="text-gray-300 text-xs">语速</Label>
                    <Input type="number" step="0.1" min="0.5" max="2.0" defaultValue="1.0" className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </div>
                <Button onClick={handleTTS} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700"><Mic2 className="w-4 h-4 mr-2" />{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "生成配音"}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 短视频生成 ── */}
          <TabsContent value="short" className="space-y-4">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Zap className="w-5 h-5 text-pink-400" />ShortGPT 短视频生成</CardTitle><CardDescription className="text-gray-400">AI 分析内容 · 自动剪辑多段 Shorts · 支持 YouTube/TikTok 风格</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="视频 URL" value={url} onChange={e => setUrl(e.target.value)} className="bg-slate-700 border-slate-600 text-white placeholder-gray-500" />
                <Input placeholder="视频主题/内容描述（如：AI趋势分析、职场技巧）" value={shortTopic} onChange={e => setShortTopic(e.target.value)} className="bg-slate-700 border-slate-600 text-white placeholder-gray-500" />
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-gray-300 text-xs">风格</Label>
                    <select value={shortStyle} onChange={e => setShortStyle(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2">
                      <option value="viral">病毒传播（高悬念）</option>
                      <option value="educational">知识科普（清晰讲解）</option>
                      <option value="entertaining">娱乐趣味（轻松活泼）</option>
                      <option value="professional">专业商务（严谨可信）</option>
                    </select>
                  </div>
                  <div><Label className="text-gray-300 text-xs">生成片段数</Label>
                    <Input type="number" defaultValue={5} min={1} max={10} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </div>
                <div><Label className="text-gray-300 text-xs">OpenAI API Key（可选·用于高质量脚本）</Label>
                  <Input type="password" placeholder="sk-..." value={openaiKey} onChange={e => { setOpenaiKey(e.target.value); localStorage.setItem("maoyan_openai_key", e.target.value); }} className="bg-slate-700 border-slate-600 text-white mt-1" />
                </div>
                <Button onClick={handleShort} disabled={loading} className="w-full bg-pink-600 hover:bg-pink-700"><Zap className="w-4 h-4 mr-2" />{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "生成短视频"}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 完整流水线 ── */}
          <TabsContent value="full" className="space-y-4">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><RefreshCw className="w-5 h-5 text-orange-400" />完整流水线</CardTitle>
                <CardDescription className="text-gray-400">一键完成：下载 → 字幕识别 → 翻译 → 配音 → 合成最终视频</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="视频 URL（YouTube / B站）" value={url} onChange={e => setUrl(e.target.value)} className="bg-slate-700 border-slate-600 text-white placeholder-gray-500" />
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-gray-300 text-xs">配音语言</Label>
                    <select value={translateLang} onChange={e => setTranslateLang(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2">
                      <option value="zh-CN">中文配音</option>
                      <option value="en">英文配音</option>
                      <option value="ja">日语配音</option>
                      <option value="ko">韩语配音</option>
                    </select>
                  </div>
                  <div><Label className="text-gray-300 text-xs">配音音色</Label>
                    <select value={ttsVoice} onChange={e => setTtsVoice(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2">
                      <option value="zh-CN-XiaoxiaoNeural">晓晓（女）</option>
                      <option value="zh-CN-YunxiNeural">云希（男）</option>
                      <option value="zh-CN-YunyangNeural">云扬（男·播音）</option>
                      <option value="en-US-JennyNeural">Jenny（英文女）</option>
                    </select>
                  </div>
                </div>
                <div className="p-3 bg-orange-900/20 border border-orange-700/40 rounded-lg text-sm text-orange-300">
                  <strong>流水线步骤：</strong> 1.下载视频 → 2.Whisper字幕 → 3.DeepL翻译 → 4.Edge-TTS配音 → 5.合成最终视频
                </div>
                <Button onClick={handleFullPipeline} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"><RefreshCw className="w-4 h-4 mr-2" />{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "启动完整流水线"}</Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* ── 实时进度 ── */}
        {activeJobId && (
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  处理中...
                </CardTitle>
                <span className="text-xs text-gray-400">Job: {activeJobId}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={liveProgress} className="h-2 [&>div]:bg-purple-500" />
              <p className="text-xs text-gray-400 mt-2">{liveMessage || "初始化..."}</p>
            </CardContent>
          </Card>
        )}

        {/* ── 任务列表 ── */}
        {jobs.length > 0 && (
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                历史任务 ({jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jobs.map(job => (
                  <div key={job.id} className="flex items-center gap-3 p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition">
                    <span className={job.tool === "moviepy" ? "text-blue-400" : job.tool === "caption" ? "text-green-400" : job.tool === "short" ? "text-pink-400" : "text-purple-400"}>
                      {TOOLS.find(t => t.id === job.tool)?.icon || <Video className="w-4 h-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">{job.title}</div>
                      <div className="text-gray-500 text-xs">{job.createdAt}</div>
                    </div>
                    {getStatusBadge(job.status)}
                    {job.status === "completed" && job.result && (
                      <Button size="sm" variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
                        <Download className="w-3 h-3 mr-1" />下载
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 隐藏的文件上传 Input ── */}
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const formData = new FormData();
          formData.append("file", file);
          formData.append("start_time", clipStart.toString());
          formData.append("end_time", clipEnd.toString());
          if (watermark) formData.append("watermark_text", watermark);
          setLoading(true);
          try {
            const res = await fetch(`${API_BASE}/clip/upload`, { method: "POST", body: formData });
            const data = await res.json();
            const newJob: VideoJob = { id: data.job_id, title: file.name, tool: "moviepy", platform: "local", status: "running", progress: 0, message: "上传中...", result: null, createdAt: new Date().toLocaleString("zh-CN") };
            setJobs(prev => [newJob, ...prev]);
            setActiveJobId(data.job_id);
          } catch (e: any) { setError(e.message); }
          finally { setLoading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
        }} />

      </div>
    </div>
  );
}
