import { useState } from "react";
import { 
  Video, 
  Download, 
  Scissors, 
  FileVideo, 
  Settings, 
  Loader2,
  Play,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  id: string;
  title: string;
  platform: "youtube" | "bilibili" | "local";
  status: "pending" | "downloading" | "processing" | "completed" | "error";
  progress: number;
  createdAt: string;
}

export default function AutoClip() {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "AI趋势分析报告",
      platform: "youtube",
      status: "completed",
      progress: 100,
      createdAt: "2026-03-26 10:30"
    },
    {
      id: "2",
      title: "品牌营销策略分享",
      platform: "bilibili",
      status: "processing",
      progress: 65,
      createdAt: "2026-03-26 14:20"
    }
  ]);

  const handleDownload = async () => {
    if (!url) return;
    setIsProcessing(true);
    
    // 模拟下载过程
    setTimeout(() => {
      const newProject: Project = {
        id: Date.now().toString(),
        title: url.split("/").pop() || "新项目",
        platform: url.includes("youtube") ? "youtube" : url.includes("bilibili") ? "bilibili" : "local",
        status: "downloading",
        progress: 0,
        createdAt: new Date().toLocaleString("zh-CN")
      };
      setProjects([newProject, ...projects]);
      setUrl("");
      setIsProcessing(false);
    }, 1500);
  };

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "processing":
      case "downloading":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: Project["status"]) => {
    switch (status) {
      case "pending": return "等待中";
      case "downloading": return "下载中";
      case "processing": return "处理中";
      case "completed": return "已完成";
      case "error": return "出错";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Video className="w-10 h-10 text-purple-400" />
            AutoClip
          </h1>
          <p className="text-gray-400">AI驱动的视频智能切片与高光提取系统</p>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="projects" className="data-[state=active]:bg-purple-600">
              <FileVideo className="w-4 h-4 mr-2" />
              项目列表
            </TabsTrigger>
            <TabsTrigger value="download" className="data-[state=active]:bg-purple-600">
              <Download className="w-4 h-4 mr-2" />
              下载视频
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 mr-2" />
              设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(project.status)}
                        <div>
                          <h3 className="text-white font-medium">{project.title}</h3>
                          <p className="text-gray-400 text-sm">
                            {project.platform === "youtube" && "YouTube"}
                            {project.platform === "bilibili" && "Bilibili"}
                            {project.platform === "local" && "本地文件"}
                            {" · "}
                            {project.createdAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">{getStatusText(project.status)}</span>
                        {project.status === "completed" && (
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Play className="w-4 h-4 mr-1" />
                            查看
                          </Button>
                        )}
                        {project.status === "processing" && (
                          <div className="w-32 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="download">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">下载视频</CardTitle>
                <CardDescription className="text-gray-400">
                  输入YouTube或B站视频链接，系统将自动下载并分析
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="border-slate-600 hover:bg-slate-700 hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    YouTube
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-slate-600 hover:bg-slate-700 hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Bilibili
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-slate-600 hover:bg-slate-700 hover:text-white"
                  >
                    <FileVideo className="w-4 h-4 mr-2" />
                    本地文件
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url" className="text-gray-300">视频链接</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Button 
                      onClick={handleDownload}
                      disabled={isProcessing || !url}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "下载"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">API 配置</CardTitle>
                <CardDescription className="text-gray-400">
                  配置AI服务和其他API设置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dashscope" className="text-gray-300">DashScope API Key</Label>
                  <Input 
                    id="dashscope"
                    type="password"
                    placeholder="sk-..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-gray-300">AI 模型</Label>
                  <select className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-2">
                    <option value="qwen-plus">Qwen Plus</option>
                    <option value="qwen-turbo">Qwen Turbo</option>
                    <option value="qwen-max">Qwen Max</option>
                  </select>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  保存配置
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}