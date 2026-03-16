import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2, GitBranch } from "lucide-react";
import { Link } from "wouter";

const MODE_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  paid: { label: "付费优先", desc: "优先使用 Claude API 等付费节点", color: "text-yellow-400" },
  free: { label: "免费优先", desc: "优先使用 DeepSeek、Groq 等免费节点", color: "text-green-400" },
  auto: { label: "自动路由", desc: "根据节点可用性自动选择", color: "text-blue-400" },
  manual: { label: "手动指定", desc: "按指定节点 ID 顺序路由", color: "text-purple-400" },
};

const LB_LABELS: Record<string, string> = {
  priority: "优先级优先",
  round_robin: "轮询",
  least_latency: "最低延迟",
};

interface RuleForm {
  name: string; mode: string; nodeIds: string;
  failover: boolean; loadBalance: string; isDefault: boolean;
}

const defaultForm: RuleForm = { name: "", mode: "auto", nodeIds: "", failover: true, loadBalance: "priority", isDefault: false };

export default function AdminRouting() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editRule, setEditRule] = useState<any>(null);
  const [form, setForm] = useState<RuleForm>(defaultForm);

  const { data: rules, isLoading } = trpc.routing.list.useQuery();
  const { data: nodes } = trpc.nodes.list.useQuery();
  const createRule = trpc.routing.create.useMutation({ onSuccess: () => { utils.routing.list.invalidate(); setOpen(false); toast.success("策略已创建"); } });
  const updateRule = trpc.routing.update.useMutation({ onSuccess: () => { utils.routing.list.invalidate(); setOpen(false); toast.success("策略已更新"); } });
  const deleteRule = trpc.routing.delete.useMutation({ onSuccess: () => { utils.routing.list.invalidate(); toast.success("策略已删除"); } });

  if (user?.role !== "admin") return <div className="flex h-screen items-center justify-center text-muted-foreground">无权访问</div>;

  const handleOpen = (rule?: any) => {
    if (rule) { setEditRule(rule); setForm({ name: rule.name, mode: rule.mode, nodeIds: rule.nodeIds || "", failover: rule.failover, loadBalance: rule.loadBalance, isDefault: rule.isDefault }); }
    else { setEditRule(null); setForm(defaultForm); }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) { toast.error("请填写策略名称"); return; }
    if (editRule) updateRule.mutate({ id: editRule.id, ...form, mode: form.mode as any, loadBalance: form.loadBalance as any });
    else createRule.mutate({ ...form, mode: form.mode as any, loadBalance: form.loadBalance as any });
  };

  const nodeMap = Object.fromEntries((nodes || []).map(n => [String(n.id), n.name]));

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">← 返回聊天</Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/admin/nodes" className="text-muted-foreground hover:text-foreground text-sm">节点管理</Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-base font-semibold">路由策略</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/logs"><Button variant="outline" size="sm">调用日志</Button></Link>
          <Button size="sm" onClick={() => handleOpen()}>
            <Plus className="size-3.5 mr-1.5" />新建策略
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
            <strong>路由策略说明：</strong>当用户发起 AI 请求时，系统按策略优先级选择可用节点。付费模式优先使用 Claude API，免费模式优先使用本地/免费节点，支持自动故障转移。
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : rules && rules.length > 0 ? (
            <div className="flex flex-col gap-3">
              {rules.map(rule => {
                const mode = MODE_LABELS[rule.mode] || { label: rule.mode, desc: "", color: "text-gray-400" };
                const nodeNames = rule.nodeIds ? rule.nodeIds.split(",").map((id: string) => nodeMap[id.trim()] || `节点#${id}`).join(" → ") : "（自动）";
                return (
                  <Card key={rule.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{rule.name}</span>
                            <span className={`text-xs font-medium ${mode.color}`}>{mode.label}</span>
                            {rule.isDefault && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">默认策略</span>}
                            {!rule.isActive && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">已禁用</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{mode.desc}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>负载均衡: {LB_LABELS[rule.loadBalance]}</span>
                            <span>故障转移: {rule.failover ? "✓ 开启" : "✗ 关闭"}</span>
                            {rule.nodeIds && <span className="truncate max-w-xs">节点顺序: {nodeNames}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpen(rule)}><Pencil className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => deleteRule.mutate({ id: rule.id })}><Trash2 className="size-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                <GitBranch className="size-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">暂无路由策略</p>
                <p className="text-sm text-muted-foreground mt-1">创建策略来控制 AI 请求的路由方式</p>
              </div>
              <Button onClick={() => handleOpen()}><Plus className="size-4 mr-2" />创建默认策略</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editRule ? "编辑路由策略" : "新建路由策略"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>策略名称 *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：免费模式路由" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>路由模式</Label>
                <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>负载均衡</Label>
                <Select value={form.loadBalance} onValueChange={v => setForm(f => ({ ...f, loadBalance: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LB_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>节点 ID 顺序（逗号分隔，留空则自动）</Label>
              <Input value={form.nodeIds} onChange={e => setForm(f => ({ ...f, nodeIds: e.target.value }))} placeholder="1,2,3" />
              {nodes && nodes.length > 0 && (
                <p className="text-xs text-muted-foreground">可用节点: {nodes.map(n => `${n.id}:${n.name}`).join(", ")}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.failover} onCheckedChange={v => setForm(f => ({ ...f, failover: v }))} />
                <Label>故障转移</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isDefault} onCheckedChange={v => setForm(f => ({ ...f, isDefault: v }))} />
                <Label>设为默认</Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} disabled={createRule.isPending || updateRule.isPending}>
                {(createRule.isPending || updateRule.isPending) && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                {editRule ? "保存" : "创建"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
