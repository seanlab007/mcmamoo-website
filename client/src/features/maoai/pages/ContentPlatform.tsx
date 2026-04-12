import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, 
  FileText, 
  Settings,
  ArrowRight,
  LayoutDashboard,
  Sparkles,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MOCK_TASKS = [
  { id: 1, skill_id: "xiaohongshu", status: "success", trigger_type: "manual", created_at: new Date().toISOString() },
  { id: 2, skill_id: "autoclip", status: "running", trigger_type: "cron", created_at: new Date().toISOString() },
  { id: 3, skill_id: "douyin", status: "failed", trigger_type: "manual", created_at: new Date().toISOString(), error_message: "API Timeout" },
];

export default function ContentPlatform() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tasks] = useState(MOCK_TASKS);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">成功</Badge>;
      case "running": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50 animate-pulse">执行中</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">失败</Badge>;
      default: return <Badge variant="outline">等待</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#d4af37]" />
            猫眼内容平台 <span className="text-[#d4af37] text-sm font-normal border border-[#d4af37]/30 px-2 py-0.5 rounded">MaoAI Engine</span>
          </h1>
          <p className="text-muted-foreground mt-1">智能内容生产与自动化分发中枢</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10">
            <Settings className="w-4 h-4 mr-2" />
            配置中心
          </Button>
          <Button className="bg-[#d4af37] text-black hover:bg-[#b8962e]">
            <Plus className="w-4 h-4 mr-2" />
            新建任务
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#1a1a1a] border border-white/5 p-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            总览
          </TabsTrigger>
          <TabsTrigger value="autoclip" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            <Video className="w-4 h-4 mr-2" />
            自动剪辑
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            <FileText className="w-4 h-4 mr-2" />
            任务历史
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#141414] border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">本月生成内容</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#d4af37]">128 / 500</div>
                <p className="text-xs text-muted-foreground mt-1">剩余配额 74%</p>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">活跃 Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#d4af37]">4</div>
                <p className="text-xs text-muted-foreground mt-1">TriadLoop 运行正常</p>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">分发平台</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#d4af37]">小红书, 抖音, 微博</div>
                <p className="text-xs text-muted-foreground mt-1">3 个平台已授权</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#141414] border-white/5">
              <CardHeader>
                <CardTitle className="text-[#d4af37]">快速开始</CardTitle>
                <CardDescription>选择一个智能 Skill 开始生产</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {[
                  { id: "xhs", name: "小红书爆款", icon: "📕", desc: "文案+配图生成" },
                  { id: "dy", name: "抖音短视频", icon: "🎬", desc: "脚本+自动剪辑" },
                  { id: "wb", name: "微博热点", icon: "📱", desc: "实时热点追踪" },
                  { id: "ac", name: "自动剪辑", icon: "✂️", desc: "素材一键成片" },
                ].map((item) => (
                  <div 
                    key={item.id}
                    className="group p-4 rounded-xl bg-[#1a1a1a] border border-white/5 hover:border-[#d4af37]/50 transition-all cursor-pointer"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="font-medium group-hover:text-[#d4af37] transition-colors">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-[#d4af37]">最近任务</CardTitle>
                  <CardDescription>实时监控生成进度</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-[#d4af37]">查看全部</Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[240px]">
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${task.status === "success" ? "bg-green-500" : task.status === "running" ? "bg-blue-500 animate-pulse" : "bg-red-500"}`} />
                          <div>
                            <div className="text-sm font-medium">{task.skill_id}</div>
                            <div className="text-xs text-muted-foreground">{new Date(task.created_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="autoclip">
          <Card className="bg-[#141414] border-white/5 min-h-[400px] flex flex-col items-center justify-center text-center p-12">
            <Video className="w-16 h-16 text-[#d4af37] mb-6 opacity-50" />
            <h3 className="text-xl font-bold mb-2">智能自动剪辑引擎</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              集成 MoviePy 与 FFmpeg，支持一句话生成短视频。您可以上传素材或让 AI 自动搜索素材。
            </p>
            <div className="flex gap-4">
              <Button className="bg-[#d4af37] text-black hover:bg-[#b8962e]">
                开始剪辑
              </Button>
              <Button variant="outline" className="border-white/10">
                查看教程
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="bg-[#141414] border-white/5">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">任务历史</CardTitle>
              <CardDescription>所有已完成和进行中的内容任务</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] border border-white/5 hover:bg-[#222] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                        {task.skill_id === "autoclip" ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-medium">任务 #{task.id} - {task.skill_id}</div>
                        <div className="text-xs text-muted-foreground">触发方式: {task.trigger_type} | 时间: {new Date(task.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(task.status)}
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
