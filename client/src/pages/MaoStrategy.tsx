import React, { useState, useCallback } from "react";
import axios from "axios";
import { ShieldAlert, Zap, Users, Target, BookOpen, Brain, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MaoStrategy() {
  const [activeTab, setActiveTab] = useState("overview");
  const [problemDescription, setProblemDescription] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeContradiction = useCallback(async () => {
    if (!problemDescription.trim()) {
      setError("请输入您的战略问题。");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await axios.post("/api/strategy/contradiction", {
        problemDescription,
      });
      setAnalysisResult(response.data);
    } catch (err) {
      console.error("矛盾分析失败:", err);
      setError("矛盾分析失败，请检查后端服务或稍后再试。");
    } finally {
      setIsLoading(false);
    }
  }, [problemDescription]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-10 h-10 text-[#d4af37]" />
            毛战略决策部
          </h1>
          <p className="text-muted-foreground mt-2">
            基于《毛泽东选集》五卷的战略思想训练与决策推演引擎
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#1a1a1a] border border-white/5 p-1 grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            <Brain className="w-4 h-4 mr-2" />
            总览
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            <Target className="w-4 h-4 mr-2" />
            战略分析
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            <BookOpen className="w-4 h-4 mr-2" />
            知识库
          </TabsTrigger>
        </TabsList>

        {/* 总览 Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* 核心战略模块 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 矛盾分析模块 */}
            <Card className="bg-[#141414] border-white/5 hover:border-[#d4af37]/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-6 h-6 text-[#d4af37] group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg">矛盾分析</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  识别主要矛盾与次要矛盾，找出战略突破口
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-[#1a1a1a] rounded border border-white/5">
                    <p className="text-xs text-muted-foreground mb-2">输入您的商业问题或市场困境</p>
                    <textarea 
                      className="w-full h-20 bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-[#d4af37]/50"
                      placeholder="例如：猫眼内容平台如何在大厂垄断下突围？"
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full bg-[#d4af37] text-black hover:bg-[#b8962e] font-medium"
                    onClick={handleAnalyzeContradiction}
                    disabled={isLoading}
                  >
                    {isLoading ? "分析中..." : "开始分析"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 持久战推演模块 */}
            <Card className="bg-[#141414] border-white/5 hover:border-[#d4af37]/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-6 h-6 text-[#d4af37] group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg">持久战推演</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  制定长期战略，应对消耗战与阵地战
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-[#1a1a1a] rounded border border-white/5">
                    <p className="text-xs text-muted-foreground mb-2">定义竞争对手与市场环境</p>
                    <textarea 
                      className="w-full h-20 bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-[#d4af37]/50"
                      placeholder="例如：对手优势、我们的资源、市场变化趋势"
                    />
                  </div>
                  <Button className="w-full bg-[#d4af37] text-black hover:bg-[#b8962e] font-medium">
                    推演方案
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 统一战线模块 */}
            <Card className="bg-[#141414] border-white/5 hover:border-[#d4af37]/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-6 h-6 text-[#d4af37] group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg">统一战线</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  建立联盟，整合资源，形成合力
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-[#1a1a1a] rounded border border-white/5">
                    <p className="text-xs text-muted-foreground mb-2">分析利益相关方与合作机会</p>
                    <textarea 
                      className="w-full h-20 bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-[#d4af37]/50"
                      placeholder="例如：潜在合作伙伴、共同利益、联盟结构"
                    />
                  </div>
                  <Button className="w-full bg-[#d4af37] text-black hover:bg-[#b8962e] font-medium">
                    构建联盟
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 战略思维框架 */}
          <Card className="bg-[#141414] border-white/5">
            <CardHeader>
              <CardTitle className="text-[#d4af37] flex items-center gap-2">
                <Brain className="w-5 h-5" />
                战略思维框架
              </CardTitle>
              <CardDescription>
                毛泽东战略思想的四大核心方法论
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    label: "矛盾论", 
                    desc: "分析问题的根本矛盾",
                    principle: "主要矛盾决定事物发展方向"
                  },
                  { 
                    label: "实践论", 
                    desc: "通过实践验证理论",
                    principle: "实践是检验真理的唯一标准"
                  },
                  { 
                    label: "调查研究", 
                    desc: "深入实地获取一手信息",
                    principle: "没有调查就没有发言权"
                  },
                  { 
                    label: "群众路线", 
                    desc: "充分发动和依靠群众",
                    principle: "一切为了群众，一切依靠群众"
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-[#1a1a1a] rounded border border-white/5 hover:border-[#d4af37]/30 transition-colors">
                    <p className="text-sm font-bold text-[#d4af37] mb-2">{item.label}</p>
                    <p className="text-xs text-muted-foreground mb-3">{item.desc}</p>
                    <p className="text-xs italic text-[#d4af37]/70 border-l-2 border-[#d4af37]/30 pl-2">
                      "{item.principle}"
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 战略分析 Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card className="bg-[#141414] border-white/5">
            <CardHeader>
              <CardTitle className="text-[#d4af37] flex items-center gap-2">
                <Target className="w-5 h-5" />
                战略分析工作台
              </CardTitle>
              <CardDescription>
                输入您的战略问题，AI 将基于毛泽东战略思想进行深度分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 问题输入 */}
                <div>
                  <label className="block text-sm font-medium mb-2">战略问题</label>
                  <textarea 
                    className="w-full h-32 bg-[#1a1a1a] border border-white/10 rounded px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:border-[#d4af37]/50"
                    placeholder="输入您的战略问题或商业困境..."
                  />
                </div>

                {/* 分析维度 */}
                <div>
                  <label className="block text-sm font-medium mb-3">分析维度</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["矛盾分析", "力量对比", "长期规划", "资源整合"].map((dim) => (
                      <button 
                        key={dim}
                        className="p-3 bg-[#1a1a1a] border border-white/5 rounded hover:border-[#d4af37]/50 transition-colors text-sm"
                      >
                        {dim}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 提交按钮 */}
                <Button className="w-full bg-[#d4af37] text-black hover:bg-[#b8962e] font-medium py-6 text-base">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  开始战略分析
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 分析结果 */}
          <Card className="bg-[#141414] border-white/5">
            <CardHeader>
              <CardTitle className="text-[#d4af37] flex items-center gap-2">
                <Brain className="w-5 h-5" />
                分析结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse opacity-50" />
                  <p>正在进行深度矛盾分析，请稍候...</p>
                </div>
              )}
              {error && (
                <div className="text-center py-12 text-red-500">
                  <p>{error}</p>
                </div>
              )}
              {analysisResult && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#d4af37] mb-2">主要矛盾</h3>
                    <p className="text-base text-white">{analysisResult.mainContradiction}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#d4af37] mb-2">矛盾主要方面</h3>
                    <p className="text-base text-white">{analysisResult.principalAspect}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#d4af37] mb-2">矛盾次要方面</h3>
                    <p className="text-base text-white">{analysisResult.secondaryAspect}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#d4af37] mb-2">转化路径与策略建议</h3>
                    <div className="space-y-2 text-base text-white">
                      {analysisResult.transformationPath.map((item: string, index: number) => (
                        <p key={index}>• {item}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#d4af37] mb-2">相关《毛选》原文引用</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {analysisResult.maoQuotes.map((quote: any, index: number) => (
                        <p key={index} className="italic border-l-2 border-[#d4af37]/30 pl-2">
                          "{quote.text}" — 《毛泽东选集》第{quote.volume}卷《{quote.chapter}》
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!isLoading && !error && !analysisResult && (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>等待您的战略问题输入...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 知识库 Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card className="bg-[#141414] border-white/5">
            <CardHeader>
              <CardTitle className="text-[#d4af37] flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                《毛泽东选集》知识库
              </CardTitle>
              <CardDescription>
                本地 RAG 索引状态与管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 知识库概览 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "第一卷", pages: "待配置", status: "inactive" },
                    { label: "第二卷", pages: "待配置", status: "inactive" },
                    { label: "第三卷", pages: "待配置", status: "inactive" },
                    { label: "第四卷", pages: "待配置", status: "inactive" },
                    { label: "第五卷", pages: "待配置", status: "inactive" },
                    { label: "总计", pages: "0 / 150万 字", status: "inactive" },
                  ].map((vol, idx) => (
                    <div key={idx} className="p-4 bg-[#1a1a1a] rounded border border-white/5">
                      <p className="text-sm font-medium text-[#d4af37]">{vol.label}</p>
                      <p className="text-xs text-muted-foreground mt-2">{vol.pages}</p>
                      <div className="mt-3 h-1 bg-[#0a0a0a] rounded overflow-hidden">
                        <div className="h-full bg-[#d4af37]/30 w-0" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 配置按钮 */}
                <Button className="w-full bg-[#d4af37] text-black hover:bg-[#b8962e] font-medium py-6">
                  <BookOpen className="w-5 h-5 mr-2" />
                  配置《毛泽东选集》知识库
                </Button>

                {/* 说明 */}
                <div className="p-4 bg-[#1a1a1a] rounded border border-white/5">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-[#d4af37]">提示：</span> 将《毛泽东选集》五卷的文本文件上传至本地，系统将自动进行向量化索引。索引完成后，您可以在战略分析中获得基于原文的精准推演。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
