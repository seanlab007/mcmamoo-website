/**
 * AdminSkills — 技能管理后台
 *
 * 功能：
 *   - 查看所有节点的技能列表
 *   - 搜索/筛选技能
 *   - 启用/禁用技能
 *   - 查看匹配测试器
 *   - 手动同步技能（触发 skill-bridge）
 *   - 查看技能缓存状态
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  Zap,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  Trash2,
  Play,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Activity,
  Database,
} from "lucide-react";
import { Link } from "wouter";

// ─── Types ─────────────────────────────────────────────────────────────────

interface SkillItem {
  id: number;
  nodeId: number;
  skillId: string;
  name: string;
  version: string;
  description: string | null;
  triggers: string[];
  category: string;
  isActive: boolean;
  invokeMode: string | null;
  systemPrompt: string | null;
  inputSchema: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface NodeWithSkills {
  id: number;
  name: string;
  type: string;
  baseUrl: string;
  modelId: string | null;
  isOnline: boolean;
  isLocal: boolean;
  isActive: boolean;
  skillsChecksum: string | null;
  lastHeartbeatAt: string | null;
  skills: SkillItem[];
}

interface SkillStatus {
  success: boolean;
  cachedSkills: number;
  onlineNodes: number;
  topModes: [string, number][];
  loadedAt: string;
}

interface MatchTestResult {
  success: boolean;
  matched: Array<{
    skillId: string;
    name: string;
    invokeMode: string;
    matchScore: number;
    matchStrategy: string;
  }>;
}

// ─── API helpers ────────────────────────────────────────────────────────────────

const API_BASE = "/api/ai";

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSkills() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [matchTest, setMatchTest] = useState("");
  const [matchResult, setMatchResult] = useState<MatchTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  // Data
  const [nodes, setNodes] = useState<NodeWithSkills[]>([]);
  const [status, setStatus] = useState<SkillStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  // Expanded node IDs
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [nodesRes, statusRes] = await Promise.all([
        api<{ nodes: NodeWithSkills[] }>("/node/list"),
        api<SkillStatus>("/skill/status", { method: "GET" }).catch(() => null),
      ]);
      setNodes(nodesRes.nodes || []);
      setStatus(statusRes);
    } catch (err: any) {
      toast.error("加载失败: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") fetchData();
  }, [user, fetchData]);

  // Toggle skill active state
  const handleToggle = async (nodeId: number, skillId: string, isEnabled: boolean) => {
    const key = `${nodeId}:${skillId}`;
    setToggling((t) => ({ ...t, [key]: true }));
    try {
      // Use dbFetch PATCH on node_skills
      const res = await fetch(`${API_BASE}/skill/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, skillId, isEnabled }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        toast.success(isEnabled ? "技能已启用" : "技能已禁用");
        // Update local state optimistically
        setNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  skills: node.skills.map((s) =>
                    s.skillId === skillId ? { ...s, isActive: isEnabled } : s
                  ),
                }
              : node
          )
        );
      }
    } catch (err: any) {
      toast.error("操作失败: " + err.message);
    } finally {
      setToggling((t) => ({ ...t, [key]: false }));
    }
  };

  // Match test
  const handleMatchTest = async () => {
    if (!matchTest.trim()) return;
    setTesting(true);
    setMatchResult(null);
    try {
      const res = await fetch(`${API_BASE}/skill/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: matchTest }),
      });
      const data = await res.json();
      setMatchResult(data);
    } catch (err: any) {
      toast.error("匹配测试失败: " + err.message);
    } finally {
      setTesting(false);
    }
  };

  // Trigger skill-bridge sync
  const handleSync = async () => {
    try {
      toast.info("正在执行 skill-bridge 同步...");
      const res = await fetch("/api/skill-bridge", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`同步完成: ${data.count || "已完成"} 个技能`);
        fetchData();
      } else {
        toast.error("同步失败: " + (data.error || "未知错误"));
      }
    } catch {
      toast.error("同步请求失败（skill-bridge 端点可能未配置）");
    }
  };

  // All skills flattened with node info
  const allSkills = nodes.flatMap((node) =>
    (node.skills || []).map((s) => ({ ...s, nodeName: node.name, nodeType: node.type, nodeOnline: node.isOnline }))
  );

  // Filter
  const filtered = allSkills.filter((s) => {
    if (activeOnly && !s.isActive) return false;
    if (modeFilter !== "all" && s.invokeMode !== modeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.skillId.toLowerCase().includes(q) ||
        s.triggers?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Stats
  const totalSkills = allSkills.length;
  const activeSkills = allSkills.filter((s) => s.isActive).length;
  const promptSkills = allSkills.filter((s) => s.invokeMode === "prompt").length;
  const invokeSkills = allSkills.filter((s) => s.invokeMode === "invoke").length;
  const offlineNodes = nodes.filter((n) => !n.isOnline).length;

  // Permission guard
  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        无权访问
      </div>
    );
  }

  const STRATEGY_LABELS: Record<string, { label: string; color: string }> = {
    trigger: { label: "关键词触发", color: "bg-yellow-500/20 text-yellow-400" },
    name: { label: "名称匹配", color: "bg-blue-500/20 text-blue-400" },
    "name-fuzzy": { label: "名称模糊", color: "bg-blue-500/15 text-blue-300" },
    description: { label: "描述相关", color: "bg-green-500/20 text-green-400" },
    "category-hint": { label: "分类提示", color: "bg-purple-500/20 text-purple-400" },
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <Link href="/admin/nodes" className="text-muted-foreground hover:text-foreground text-sm">
            ← 返回节点管理
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-base font-semibold">技能管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/routing">
            <Button variant="outline" size="sm">
              路由策略
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchData}>
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          </Button>
          <Button size="sm" variant="outline" onClick={handleSync}>
            <Database className="size-3.5 mr-1.5" />
            同步
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ── Stats Bar ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold">{totalSkills}</div>
                <div className="text-xs text-muted-foreground">总技能数</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{activeSkills}</div>
                <div className="text-xs text-muted-foreground">已启用</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{promptSkills}</div>
                <div className="text-xs text-muted-foreground">Prompt 模式</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{invokeSkills}</div>
                <div className="text-xs text-muted-foreground">Invoke 模式</div>
              </CardContent>
            </Card>
          </div>

          {/* ── Match Tester ───────────────────────────────────────── */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Play className="size-4 text-yellow-400" />
                匹配测试器
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="输入用户消息，测试匹配效果..."
                  value={matchTest}
                  onChange={(e) => setMatchTest(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMatchTest()}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleMatchTest} disabled={testing || !matchTest.trim()}>
                  {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                </Button>
              </div>
              {matchResult && (
                <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-2">
                  {matchResult.matched.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Zap className="size-4 text-green-400" />
                        <span className="font-medium">
                          命中: {matchResult.matched[0].name}
                        </span>
                        <Badge variant="outline" className={STRATEGY_LABELS[matchResult.matched[0].matchStrategy]?.color}>
                          {STRATEGY_LABELS[matchResult.matched[0].matchStrategy]?.label || matchResult.matched[0].matchStrategy}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>分数: <strong>{matchResult.matched[0].matchScore}</strong></span>
                        <span>模式: {matchResult.matched[0].invokeMode}</span>
                        <span>ID: {matchResult.matched[0].skillId}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>未匹配到任何技能（阈值 &ge; 2 分）</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Cache Status ─────────────────────────────────────────── */}
          {status && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
              <Activity className="size-3.5" />
              <span>缓存: {status.cachedSkills} 技能 / {status.onlineNodes} 节点</span>
              <span>更新: {status.loadedAt ? new Date(status.loadedAt).toLocaleTimeString() : "未加载"}</span>
            </div>
          )}

          {/* ── Offline Nodes Warning ─────────────────────────────── */}
          {offlineNodes > 0 && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-300">
              ⚠ {offlineNodes} 个节点离线（心跳超时 90s），这些节点的技能不可用于聊天匹配。
            </div>
          )}

          {/* ── Filters ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索技能名称、描述、触发词..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-muted-foreground" />
              <Button
                variant={modeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setModeFilter("all")}
              >
                全部
              </Button>
              <Button
                variant={modeFilter === "prompt" ? "default" : "outline"}
                size="sm"
                onClick={() => setModeFilter("prompt")}
              >
                Prompt
              </Button>
              <Button
                variant={modeFilter === "invoke" ? "default" : "outline"}
                size="sm"
                onClick={() => setModeFilter("invoke")}
              >
                Invoke
              </Button>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Eye className="size-3.5 text-muted-foreground" />
              <Switch checked={activeOnly} onCheckedChange={setActiveOnly} />
            </div>
          </div>

          {/* ── Skills List by Node ─────────────────────────────────── */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                <Zap className="size-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{search ? "未找到匹配的技能" : "暂无技能数据"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search ? "尝试其他搜索词" : "运行 skill-bridge 同步技能后自动显示"}
                </p>
              </div>
              {!search && (
                <Button onClick={handleSync}>
                  <Database className="size-4 mr-2" />
                  运行同步
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {nodes.map((node) => {
                const isExpanded = expanded.has(node.id);
                const nodeSkills = (node.skills || []).filter((s) => {
                  if (activeOnly && !s.isActive) return false;
                  if (modeFilter !== "all" && s.invokeMode !== modeFilter) return false;
                  if (search) {
                    const q = search.toLowerCase();
                    return (
                      s.name.toLowerCase().includes(q) ||
                      s.description?.toLowerCase().includes(q) ||
                      s.skillId.toLowerCase().includes(q) ||
                      s.triggers?.some((t) => t.toLowerCase().includes(q))
                    );
                  }
                  return true;
                });

                return (
                  <Card key={node.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      {/* Node header */}
                      <button
                        className="w-full flex items-center justify-between text-left"
                        onClick={() =>
                          setExpanded((prev) => {
                            const next = new Set(prev);
                            if (next.has(node.id)) next.delete(node.id);
                            else next.add(node.id);
                          })
                        }
                      >
                        <div className="flex items-center gap-3">
                          <ChevronRight
                            className={`size-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                          <div
                            className={`size-2.5 rounded-full shrink-0 ${
                              node.isOnline ? "bg-green-500" : "bg-red-500/60"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{node.name}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {node.type || "custom"}
                              </span>
                              {node.isOnline ? (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                  在线
                                </span>
                              ) : (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                  离线
                                </span>
                              )}
                              {node.skillsChecksum && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {node.skillsChecksum}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {nodeSkills.length} 技能
                              {node.lastHeartbeatAt && (
                                <span className="ml-2">
                                  · 心跳 {new Date(node.lastHeartbeatAt).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{nodeSkills.length}</span>
                          <ArrowUpDown className="size-3" />
                        </div>
                      </button>

                      {/* Expanded skill list */}
                      {isExpanded && nodeSkills.length > 0 && (
                        <div className="mt-3 border-t border-border/50 pt-3 space-y-1">
                          {nodeSkills.map((skill) => (
                            <div
                              key={skill.skillId}
                              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${
                                skill.isActive
                                  ? "bg-background/50 hover:bg-muted/30"
                                  : "bg-muted/20 opacity-60"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-medium ${!skill.isActive ? "line-through text-muted-foreground" : ""}`}>
                                    {skill.name}
                                  </span>
                                  {skill.invokeMode === "prompt" ? (
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px] px-1.5">
                                      prompt
                                    </Badge>
                                  ) : skill.invokeMode === "invoke" ? (
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] px-1.5">
                                      invoke
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5">
                                      {(skill.invokeMode as string) || "—"}
                                    </Badge>
                                  )}
                                </div>
                                {skill.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {skill.description}
                                  </p>
                                )}
                                {skill.triggers?.length > 0 && (
                                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                    {skill.triggers.slice(0, 5).map((t) => (
                                      <span
                                        key={t}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400/80 border border-yellow-500/20"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                    {skill.triggers.length > 5 && (
                                      <span className="text-[10px] text-muted-foreground">
                                        +{skill.triggers.length - 5}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-muted-foreground font-mono max-w-[80px] truncate">
                                  {skill.version}
                                </span>
                                <Switch
                                  checked={skill.isActive}
                                  disabled={toggling[`${node.id}:${skill.skillId}`]}
                                  onCheckedChange={(v) =>
                                    handleToggle(node.id, skill.skillId, v)
                                  }
                                  className="scale-[0.7]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expanded: no skills */}
                      {isExpanded && nodeSkills.length === 0 && (
                        <div className="mt-3 border-t border-border/50 pt-3">
                          <p className="text-xs text-muted-foreground">
                            该节点暂无技能数据
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Results count */}
          {filtered.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pb-4">
              显示 {filtered.length} / {totalSkills} 个技能
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
