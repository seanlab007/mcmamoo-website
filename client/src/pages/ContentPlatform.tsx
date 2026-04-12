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
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Clock, Play, Pause, Trash2, FileVideo, Sparkles } from "lucide-react";

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
      </Tabs>
    </div>
  );
}
