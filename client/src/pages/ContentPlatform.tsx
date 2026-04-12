/**
 * ContentPlatform 页面
 * 猫眼内容平台主界面 - 整合到主站
 * 
 * 功能：
 * - 内容生成任务管理
 * - 定时调度配置
 * - 订阅配额展示
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Plus, Clock, Play, Pause, Trash2, FileVideo, Sparkles, Send, BookOpen, Target, TrendingUp, Lightbulb, ChevronRight, Shield, Zap, Users, FileSearch } from "lucide-react";

interface Task {
  id: number;
  skill_id: string;
  status: "pending" | "running" | "success" | "failed";
  trigger_type: "manual" | "scheduled" | "api";
  created_at: string;
  finished_at?: string;
  result?: any;
  error_message?: string;
}

interface Subscription {
  plan: string;
  contentQuota: number;
  contentUsed: number;
  isAdmin: boolean;
}

export default function ContentPlatform() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, tasksRes] = await Promise.all([
        fetch("/api/content/subscription", { credentials: "include" }),
        fetch("/api/content/tasks?limit=20", { credentials: "include" }),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "success" | "destructive"> = {
      pending: "secondary",
      running: "default",
      success: "success",
      failed: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "等待中",
      running: "执行中",
      success: "成功",
      failed: "失败",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500",
      content: "bg-blue-500",
      strategic: "bg-purple-500",
      admin: "bg-red-500",
    };
    const labels: Record<string, string> = {
      free: "免费版",
      content: "内容会员",
      strategic: "战略会员",
      admin: "管理员",
    };
    return (
      <span className={`${colors[plan] || "bg-gray-500"} text-white px-2 py-1 rounded text-xs`}>
        {labels[plan] || plan}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileVideo className="w-8 h-8" />
            猫眼内容平台
          </h1>
          <p className="text-muted-foreground mt-1">AI 驱动的自动化内容生产平台</p>
        </div>
        {subscription && getPlanBadge(subscription.plan)}
      </div>

      {/* 配额卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">本月配额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription?.contentUsed || 0} / {subscription?.contentQuota === -1 ? "∞" : subscription?.contentQuota || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {subscription?.contentQuota === -1 ? "不限额度" : "已使用 / 总额度"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">今日任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length}
            </div>
            <p className="text-xs text-muted-foreground">累计生成内容</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.length > 0
                ? Math.round((tasks.filter(t => t.status === "success").length / tasks.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">任务完成率</p>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">任务列表</TabsTrigger>
          <TabsTrigger value="create">创建任务</TabsTrigger>
          <TabsTrigger value="schedule">定时调度</TabsTrigger>
          <TabsTrigger value="strategic">
            <Shield className="w-4 h-4 mr-1" />
            战略参谋部
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>最近任务</CardTitle>
              <CardDescription>查看和管理最近的内容生成任务</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileVideo className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暂无任务</p>
                  <p className="text-sm">点击上方「创建任务」开始生成内容</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">任务 #{task.id}</span>
                            {getStatusBadge(task.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Skill: {task.skill_id} | 触发: {task.trigger_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(task.created_at).toLocaleString("zh-CN")}
                          </p>
                          {task.error_message && (
                            <p className="text-xs text-destructive mt-1">{task.error_message}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {task.status === "pending" && (
                            <Button variant="ghost" size="icon">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>创建内容任务</CardTitle>
              <CardDescription>选择内容类型并配置参数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: "xiaohongshu", name: "小红书文案", icon: "📕", plan: "content" },
                  { id: "douyin", name: "抖音短视频脚本", icon: "🎬", plan: "strategic" },
                  { id: "weibo", name: "微博推文", icon: "📱", plan: "content" },
                  { id: "autoclip", name: "自动剪辑", icon: "✂️", plan: "content" },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => {
                      // TODO: 打开创建弹窗
                    }}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.plan} 可用</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>定时调度</CardTitle>
              <CardDescription>配置自动执行的内容生成任务</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription?.isAdmin ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">管理员可在后台管理定时任务</p>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    创建定时任务
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>定时调度功能仅对管理员开放</p>
                  <p className="text-sm">请联系管理员配置自动内容生成</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategic">
          <StrategicCommandCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}


// ─── 战略参谋部组件 ───────────────────────────────────────────
function StrategicCommandCenter() {
  const [query, setQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const analyze = async () => {
    if (!query.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setActivePhase(null);
    setSelectedTemplate(null);
    try {
      const res = await fetch("/api/maoai/strategic/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query, mode: "full" }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.action_plan?.phases?.length > 0) setActivePhase(0);
      } else {
        setResult(getMockResult(query));
      }
    } catch {
      setResult(getMockResult(query));
    } finally {
      setAnalyzing(false);
    }
  };

  const phases = result?.action_plan?.phases || [];
  const principles = result?.principles || [];
  const templates = result?.l3_templates || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-yellow-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">战略参谋部</h2>
          <p className="text-xs text-muted-foreground">毛泽东战略思想 × MaoAI 智能决策引擎</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { layer: "L1", name: "语义感知", desc: "毛选向量检索", icon: FileSearch, color: "from-blue-600 to-cyan-500" },
          { layer: "L2", name: "逻辑提取", desc: "TriadLoop博弈", icon: Zap, color: "from-purple-600 to-pink-500" },
          { layer: "L3", name: "思维映射", desc: "战略模板生成", icon: Target, color: "from-amber-600 to-orange-500" },
        ].map((l) => (
          <div key={l.layer} className={`bg-gradient-to-br ${l.color} rounded-lg p-3 text-white`}>
            <div className="flex items-center gap-2 mb-1">
              <l.icon className="w-4 h-4" />
              <span className="text-xs opacity-80">{l.layer}</span>
              <span className="font-bold text-sm">{l.name}</span>
            </div>
            <p className="text-xs opacity-70">{l.desc}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            战略问题输入
          </CardTitle>
          <CardDescription>描述您的商业/战略挑战，AI 将从《毛选》中检索相关思想并生成行动纲领</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full h-24 bg-muted/30 border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="例如：猫眼内容平台如何突破大厂封锁？"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze(); }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Ctrl/Cmd + Enter 快捷分析</p>
            <Button onClick={analyze} disabled={analyzing || !query.trim()}
              className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600">
              {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 分析中...</> : <><Send className="w-4 h-4 mr-2" /> 启动战略分析</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {result.strategic_types_covered && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-500" />战略类型覆盖</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(result.strategic_types_covered || []).map((t: string) => (
                    <Badge key={t} variant="outline" className="border-amber-500/50 text-amber-600">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileSearch className="w-4 h-4 text-blue-500" />L1 相关文献</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {(result.l1_chunks || []).map((c: any, i: number) => (
                  <div key={i} className="p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-bold text-amber-600">第{c.volume}卷</span>
                      <Badge variant="outline" className="text-xs">{c.strategic_type}</Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{c.chapter}</p>
                    <p className="text-xs text-muted-foreground mb-1">{c.context}</p>
                    <p className="text-xs text-muted-foreground">力量对比: <span className="text-amber-600 font-medium">{c.force_balance}</span></p>
                  </div>
                ))}
                {(!result.l1_chunks || result.l1_chunks.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">请先构建毛选索引</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500" />L2 TriadLoop 博弈结果</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {principles.length > 0 ? principles.map((p: string, i: number) => {
                  const nameMatch = p.match(/\*\*([^*]+)\*\*/);
                  const confMatch = p.match(/置信度\s*(\d+%)/);
                  return (
                    <div key={i} className="p-3 border rounded-lg hover:border-purple-500/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold">{nameMatch?.[1] || `原则 ${i + 1}`}</span>
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">validated</Badge>
                      </div>
                      {confMatch && <p className="text-xs text-amber-600 mb-1">置信度 {confMatch[1]}</p>}
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {p.split("\n").filter((l: string) => l.startsWith("-")).slice(0, 2).join(" ")}
                      </p>
                    </div>
                  );
                }) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">TriadLoop 博弈结果将在后端实现后显示</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" />L3 行动纲领</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {phases.length > 0 ? phases.map((phase: any, i: number) => (
                  <div key={i}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${activePhase === i ? "border-amber-500 bg-amber-500/5" : "hover:border-amber-500/30"}`}
                    onClick={() => setActivePhase(activePhase === i ? null : i)}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{phase.phase}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activePhase === i ? "rotate-90" : ""}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">{phase.timeline}</p>
                    {activePhase === i && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-amber-600">{phase.objective}</p>
                        {(phase.actions || []).map((a: string, j: number) => (
                          <p key={j} className="text-xs text-muted-foreground flex gap-1"><span className="text-amber-500 mt-0.5">·</span>{a}</p>
                        ))}
                        {phase.deliverable && <p className="text-xs text-muted-foreground italic mt-2">交付物: {phase.deliverable}</p>}
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-6 text-muted-foreground"><Target className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-xs">行动纲领</p></div>
                )}
              </CardContent>
            </Card>
          </div>

          {Object.keys(templates).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" />L3 战略模板 (可注入 System Prompt)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(templates).map(([name, data]: [string, any]) => (
                    <div key={name}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate === name ? "border-amber-500 bg-amber-500/5" : "hover:border-amber-500/30"}`}
                      onClick={() => setSelectedTemplate(selectedTemplate === name ? null : name)}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold">{name}</h4>
                        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600">{data.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground italic mb-2">"{data.motto}"</p>
                      {selectedTemplate === name && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">角色: {data.role}</p>
                          {(data.steps || []).map((s: string, i: number) => <p key={i} className="text-xs text-muted-foreground">{s}</p>)}
                          <p className="text-xs text-amber-600 mt-2">涉及原则: {(data.principles_used || []).join(", ")}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.action_plan?.key_insight && (
            <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" />核心洞见</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{result.action_plan.key_insight}</p></CardContent>
            </Card>
          )}

          {result.system_prompt_injection && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-amber-500" />System Prompt 注入片段</CardTitle>
                <CardDescription>一键复制到 MaoAI System Prompt</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto max-h-60 whitespace-pre-wrap">{result.system_prompt_injection}</pre>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!result && (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">战略参谋部待机中</p>
          <p className="text-sm mt-1">输入您的战略问题，AI 将调用毛泽东战略思想进行分析</p>
          <div className="flex justify-center gap-4 mt-6 text-xs">
            {[{ icon: Users, text: "群众路线" }, { icon: TrendingUp, text: "持久战" }, { icon: Target, text: "矛盾论" }, { icon: Lightbulb, text: "实事求是" }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1 opacity-60"><Icon className="w-3 h-3" /><span>{text}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function getMockResult(query: string) {
  return {
    query, strategic_types_covered: ["矛盾论", "持久战", "群众路线"],
    l1_chunks: [
      { volume: 1, chapter: "中国社会各阶级的分析", strategic_type: "矛盾论", context: "1925年，阶级矛盾尖锐", force_balance: "敌强我弱" },
      { volume: 1, chapter: "星星之火，可以燎原", strategic_type: "群众路线", context: "1930年，农村革命根据地", force_balance: "敌强我弱" },
      { volume: 2, chapter: "论持久战", strategic_type: "持久战", context: "1938年，抗日战争", force_balance: "敌强我弱" },
    ],
    principles: [
      "**矛盾分析法** (置信度 90%)\n- 原文: \"任何事物都是矛盾的统一体...\"\n- 解读: 识别主要矛盾和次要矛盾\n- 状态: validated",
      "**持久战三阶段模型** (置信度 85%)\n- 原文: \"抗日战争必须经过三个阶段...\"\n- 解读: 防御→相持→反攻\n- 状态: validated",
      "**群众路线** (置信度 88%)\n- 原文: \"一切为了群众，一切依靠群众...\"\n- 解读: 深入群众、发动群众\n- 状态: final",
    ],
    l3_templates: {
      "矛盾分析模板": { role: "战略矛盾分析师", motto: "抓住了主要矛盾，一切问题就迎刃而解", source: "《矛盾论》", steps: ["1. 识别主要矛盾", "2. 识别次要矛盾", "3. 制定突破方案"], principles_used: ["矛盾分析法"] },
      "持久战模板": { role: "持久战略规划师", motto: "最后的胜利，往往就在再坚持一下的努力之中", source: "《论持久战》", steps: ["第一阶段: 战略防御", "第二阶段: 战略相持", "第三阶段: 战略反攻"], principles_used: ["持久战", "群众路线"] },
    },
    action_plan: {
      phases: [
        { phase: "第一阶段：调查研究", timeline: "第1-2周", objective: `深入了解"${query}"的真实情况`, actions: ["实地调研，获取一手信息", "运用矛盾分析法识别核心问题", "分析各方力量对比"], deliverable: "《战略分析报告》" },
        { phase: "第二阶段：战略布局", timeline: "第1-3个月", objective: "建立竞争壁垒，积蓄力量", actions: ["建立核心用户群（群众路线）", "寻找战略盟友（统一战线）", "聚焦资源于核心方向"], deliverable: "《战略布局方案》" },
        { phase: "第三阶段：战略相持", timeline: "第2-6个月", objective: "逐步扩大优势，消耗竞争对手", actions: ["积小胜为大胜", "持续深化群众路线", "扩大统一战线"], deliverable: "《月度进展报告》" },
        { phase: "第四阶段：战略反攻", timeline: "时机成熟时", objective: "集中优势，一举突破", actions: ["核心指标达到竞争对手60-70%时发起攻势", "集中全部资源于决定性方向", "快速迭代，巩固战果"], deliverable: "《战役总结》" },
      ],
      key_insight: `核心启示：面对"${query}"的复杂局面，需要分阶段推进。第一阶段以调查研究为主，运用矛盾分析法识别主要矛盾；第二阶段建立群众基础和统一战线；第三阶段通过持久消耗逐步扩大优势；最后在条件成熟时发起战略反攻。历史经验证明，毛泽东的"农村包围城市"战略在商业竞争中同样具有重要参考价值。`,
    },
    system_prompt_injection: `## MaoAI 战略思维框架\n\n### 当前分析目标\n${query}\n\n### 已验证的战略原则\n**矛盾分析法** (置信度 90%)\n- 解读: 识别主要矛盾和次要矛盾，抓住问题关键\n\n**持久战三阶段模型** (置信度 85%)\n- 解读: 防御→相持→反攻，逐步消耗对方\n\n**群众路线** (置信度 88%)\n- 解读: 一切为了群众，一切依靠群众\n\n### 战略模板\n【矛盾分析模板】角色: 战略矛盾分析师\n\"抓住了主要矛盾，一切问题就迎刃而解\"\n步骤: 识别主要矛盾 → 识别次要矛盾 → 制定突破方案\n`,
  };
}

