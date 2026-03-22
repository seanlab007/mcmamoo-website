import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, Wifi, WifiOff, Loader2, Pencil, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const NODE_TYPES = [
  { value: "claude_api", label: "Claude API (付费)", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "openai_compat", label: "OpenAI 兼容", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "openmanus", label: "OpenManus", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "openclaw", label: "OpenClaw", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "workbuddy", label: "WorkBuddy", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { value: "custom", label: "自定义", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
];

function NodeTypeTag({ type }: { type: string }) {
  const t = NODE_TYPES.find(n => n.value === type);
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${t?.color || "bg-gray-500/20 text-gray-400"}`}>{t?.label || type}</span>;
}

interface NodeFormData {
  name: string; type: string; baseUrl: string; apiKey: string;
  modelId: string; isPaid: boolean; isLocal: boolean; priority: number; description: string;
}

const defaultForm: NodeFormData = {
  name: "", type: "openai_compat", baseUrl: "", apiKey: "",
  modelId: "", isPaid: false, isLocal: false, priority: 100, description: "",
};

export default function AdminNodes() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editNode, setEditNode] = useState<any>(null);
  const [form, setForm] = useState<NodeFormData>(defaultForm);
  const [pinging, setPinging] = useState<Record<number, boolean>>({});

  const { data: nodes, isLoading } = trpc.nodes.list.useQuery();
  const createNode = trpc.nodes.create.useMutation({ onSuccess: () => { utils.nodes.list.invalidate(); setOpen(false); toast.success("节点已添加"); } });
  const updateNode = trpc.nodes.update.useMutation({ onSuccess: () => { utils.nodes.list.invalidate(); setOpen(false); toast.success("节点已更新"); } });
  const deleteNode = trpc.nodes.delete.useMutation({ onSuccess: () => { utils.nodes.list.invalidate(); toast.success("节点已删除"); } });
  const pingNode = trpc.nodes.ping.useMutation({
    onSuccess: (data, vars) => {
      setPinging(p => ({ ...p, [vars.id]: false }));
      if (data.online) toast.success(`节点在线，延迟 ${data.latency}ms`);
      else toast.error("节点离线或无响应");
      utils.nodes.list.invalidate();
    },
    onError: (_, vars) => { setPinging(p => ({ ...p, [vars.id]: false })); toast.error("Ping 失败"); },
  });

  if (user?.role !== "admin") return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">无权访问此页面</div>
  );

  const handleOpen = (node?: any) => {
    if (node) {
      setEditNode(node);
      setForm({ name: node.name, type: node.type, baseUrl: node.baseUrl, apiKey: node.apiKey || "", modelId: node.modelId || "", isPaid: node.isPaid, isLocal: node.isLocal, priority: node.priority, description: node.description || "" });
    } else {
      setEditNode(null);
      setForm(defaultForm);
    }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.baseUrl) { toast.error("请填写节点名称和地址"); return; }
    if (editNode) updateNode.mutate({ id: editNode.id, ...form, type: form.type as any });
    else createNode.mutate({ ...form, type: form.type as any });
  };

  const handlePing = (id: number) => {
    setPinging(p => ({ ...p, [id]: true }));
    pingNode.mutate({ id });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <Link href="/maoai" className="text-muted-foreground hover:text-foreground text-sm">← 返回聊天</Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-base font-semibold">AI 节点管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/routing"><Button variant="outline" size="sm">路由策略</Button></Link>
          <Link href="/admin/logs"><Button variant="outline" size="sm">调用日志</Button></Link>
          <Button size="sm" onClick={() => handleOpen()}>
            <Plus className="size-3.5 mr-1.5" />添加节点
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : nodes && nodes.length > 0 ? (
          <div className="grid gap-4 max-w-5xl">
            {nodes.map(node => (
              <Card key={node.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 size-2.5 rounded-full shrink-0 ${node.isOnline ? "bg-green-500" : "bg-red-500/60"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{node.name}</span>
                          <NodeTypeTag type={node.type} />
                          {node.isPaid && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">付费</span>}
                          {node.isLocal && <span className="text-xs px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">本地</span>}
                          {!node.isActive && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">已禁用</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-xs">{node.baseUrl}</span>
                          {node.modelId && <span className="text-xs text-muted-foreground">· {node.modelId}</span>}
                        </div>
                        {node.description && <p className="text-xs text-muted-foreground mt-1">{node.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>优先级: {node.priority}</span>
                          {node.lastPingAt && <span>最近检测: {new Date(node.lastPingAt).toLocaleString()}</span>}
                          {node.lastPingMs && <span>延迟: {node.lastPingMs}ms</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => handlePing(node.id)} disabled={pinging[node.id]}>
                        {pinging[node.id] ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpen(node)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => deleteNode.mutate({ id: node.id })}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <WifiOff className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">暂无 AI 节点</p>
              <p className="text-sm text-muted-foreground mt-1">添加 Claude API、OpenManus、OpenClaw 等节点</p>
            </div>
            <Button onClick={() => handleOpen()}>
              <Plus className="size-4 mr-2" />添加第一个节点
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editNode ? "编辑节点" : "添加 AI 节点"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>节点名称 *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：Claude API" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>节点类型 *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NODE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>接口地址 *</Label>
              <Input value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} placeholder="https://api.example.com/v1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>API Key</Label>
                <Input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="sk-..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>模型 ID</Label>
                <Input value={form.modelId} onChange={e => setForm(f => ({ ...f, modelId: e.target.value }))} placeholder="claude-3-5-sonnet" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.isPaid} onCheckedChange={v => setForm(f => ({ ...f, isPaid: v }))} />
                <Label>付费节点</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isLocal} onCheckedChange={v => setForm(f => ({ ...f, isLocal: v }))} />
                <Label>本地节点</Label>
              </div>
              <div className="flex flex-col gap-1">
                <Label>优先级</Label>
                <Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>备注说明</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="节点用途、配置说明等" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} disabled={createNode.isPending || updateNode.isPending}>
                {(createNode.isPending || updateNode.isPending) && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                {editNode ? "保存修改" : "添加节点"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
