import React, { useState } from "react";
import { AlertCircle, RefreshCw, ShieldAlert, Zap, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CONTENT_PLATFORM_URL = "http://localhost:3001/content";

export default function ContentPlatform() {
  const [activeTab, setActiveTab] = useState("platform");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">内容与战略中枢</h1>
          <p className="text-muted-foreground mt-1">猫眼内容平台 × 毛战略决策部</p>
        </div>
        <Button 
          onClick={handleRefresh}
          variant="outline" 
          className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#1a1a1a] border border-white/5 p-1 grid w-full grid-cols-2">
          <TabsTrigger value="platform" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            <Zap className="w-4 h-4 mr-2" />
            猫眼内容平台
          </TabsTrigger>
          <TabsTrigger value="strategy" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            <ShieldAlert className="w-4 h-4 mr-2" />
            毛战略决策部
          </TabsTrigger>
        </TabsList>

        {/* 猫眼内容平台 Tab */}
        <TabsContent value="platform" className="space-y-6">
          {/* Error State */}
          {hasError && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                无法连接到内容平台服务 ({CONTENT_PLATFORM_URL})。
                请确保本地服务已启动：<code className="text-xs bg-black/50 px-2 py-1 rounded ml-2">npm run dev:content</code>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-[600px] bg-[#141414] border border-white/5 rounded-lg">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">加载内容平台中...</p>
              </div>
            </div>
          )}

          {/* Iframe Container */}
          <div className={`bg-[#141414] border border-white/5 rounded-lg overflow-hidden ${isLoading ? "hidden" : ""}`}>
            <iframe
              key={iframeKey}
              src={CONTENT_PLATFORM_URL}
              title="猫眼内容平台"
              className="w-full h-[800px] border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
            />
          </div>

          {/* Footer Info */}
          <div className="text-xs text-muted-foreground text-center">
            <p>内容平台运行于 <code className="bg-black/50 px-2 py-1 rounded">{CONTENT_PLATFORM_URL}</code></p>
          </div>
        </TabsContent>

        {/* 毛战略决策部 Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="bg-gradient-to-r from-[#141414] to-[#1a1a1a] border-[#d4af37]/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-[#d4af37]" />
                  <div>
                    <CardTitle className="text-[#d4af37] text-2xl">毛战略决策部</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      基于《毛泽东选集》五卷的战略思想训练与决策推演引擎
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Strategic Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 矛盾分析模块 */}
              <Card className="bg-[#141414] border-white/5 hover:border-[#d4af37]/50 transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-[#d4af37] group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-sm">矛盾分析</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    识别主要矛盾与次要矛盾，找出突破口
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-[#1a1a1a] rounded border border-white/5">
                      <p className="text-xs text-muted-foreground">输入您的商业问题或市场困境</p>
                    </div>
                    <Button className="w-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/30">
                      开始分析
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 持久战推演模块 */}
              <Card className="bg-[#141414] border-white/5 hover:border-[#d4af37]/50 transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-[#d4af37] group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-sm">持久战推演</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    制定长期战略，应对消耗战与阵地战
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-[#1a1a1a] rounded border border-white/5">
                      <p className="text-xs text-muted-foreground">定义竞争对手与市场环境</p>
                    </div>
                    <Button className="w-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/30">
                      推演方案
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 统一战线模块 */}
              <Card className="bg-[#141414] border-white/5 hover:border-[#d4af37]/50 transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-[#d4af37] group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-sm">统一战线</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    建立联盟，整合资源，形成合力
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-[#1a1a1a] rounded border border-white/5">
                      <p className="text-xs text-muted-foreground">分析利益相关方与合作机会</p>
                    </div>
                    <Button className="w-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/30">
                      构建联盟
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Knowledge Base Status */}
            <Card className="bg-[#141414] border-white/5">
              <CardHeader>
                <CardTitle className="text-sm">知识库状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-white/5">
                    <div>
                      <p className="text-sm font-medium">《毛泽东选集》五卷</p>
                      <p className="text-xs text-muted-foreground">本地 RAG 索引状态</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#d4af37]">待配置</p>
                      <p className="text-xs text-muted-foreground">0 / 150万 字</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10">
                    配置知识库
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Strategic Thinking Framework */}
            <Card className="bg-[#141414] border-white/5">
              <CardHeader>
                <CardTitle className="text-sm">战略思维框架</CardTitle>
                <CardDescription className="text-xs">
                  基于毛泽东战略思想的核心方法论
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "矛盾论", desc: "分析问题的根本矛盾" },
                    { label: "实践论", desc: "通过实践验证理论" },
                    { label: "调查研究", desc: "深入实地获取一手信息" },
                    { label: "群众路线", desc: "充分发动和依靠群众" },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#1a1a1a] rounded border border-white/5 hover:border-[#d4af37]/30 transition-colors">
                      <p className="text-sm font-medium text-[#d4af37]">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
