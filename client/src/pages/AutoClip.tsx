/**
 * AutoClip 页面
 * 自动剪辑工具 - 整合到主站
 * 
 * 功能：
 * - 视频自动剪辑
 * - 视频合成预览
 */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Scissors, FileVideo } from "lucide-react";

export default function AutoClip() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scissors className="w-8 h-8" />
            自动剪辑
          </h1>
          <p className="text-muted-foreground mt-1">AI 驱动的智能视频剪辑工具</p>
        </div>
      </div>

      {/* 主功能区 */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">上传视频</TabsTrigger>
          <TabsTrigger value="compose">视频合成</TabsTrigger>
          <TabsTrigger value="history">剪辑历史</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>上传视频素材</CardTitle>
              <CardDescription>支持 MP4、MOV、AVI 格式，单文件最大 500MB</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">拖拽视频文件到此处</p>
                <p className="text-sm text-muted-foreground mb-4">或点击下方按钮选择文件</p>
                <Input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  id="video-upload"
                  onChange={handleVideoUpload}
                />
                <Label htmlFor="video-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>选择视频文件</span>
                  </Button>
                </Label>
                {videoFile && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="font-medium">{videoFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              {videoFile && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium">剪辑选项</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>开始时间</Label>
                      <Input type="text" placeholder="00:00:00" className="mt-1" />
                    </div>
                    <div>
                      <Label>结束时间</Label>
                      <Input type="text" placeholder="00:00:30" className="mt-1" />
                    </div>
                  </div>
                  <Button className="w-full" disabled={processing}>
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4 mr-2" />
                        开始剪辑
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>视频合成</CardTitle>
              <CardDescription>将图片、音频、字幕合成为短视频</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <FileVideo className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">添加图片序列</p>
                  <p className="text-xs text-muted-foreground">支持 JPG、PNG</p>
                </div>
                <div className="border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <FileVideo className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">添加配音音频</p>
                  <p className="text-xs text-muted-foreground">支持 MP3、WAV</p>
                </div>
                <div className="border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <FileVideo className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">添加字幕文件</p>
                  <p className="text-xs text-muted-foreground">支持 SRT 格式</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  使用 MaoAI 聊天界面输入「帮我合成视频」体验 AI 驱动的自动合成
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>剪辑历史</CardTitle>
              <CardDescription>查看之前的剪辑记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileVideo className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无剪辑记录</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
