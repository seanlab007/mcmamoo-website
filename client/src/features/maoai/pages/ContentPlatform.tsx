import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CONTENT_PLATFORM_URL = "http://localhost:3001/content";

export default function ContentPlatform() {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">猫眼内容平台</h1>
          <p className="text-muted-foreground mt-1">智能内容生产与自动化分发中枢</p>
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

      {/* Error State */}
      {hasError && (
        <Alert className="mb-6 bg-red-500/10 border-red-500/30">
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
      <div className="mt-6 text-xs text-muted-foreground text-center">
        <p>内容平台运行于 <code className="bg-black/50 px-2 py-1 rounded">{CONTENT_PLATFORM_URL}</code></p>
        <p className="mt-2">如需修改服务地址，请编辑 <code className="bg-black/50 px-2 py-1 rounded">CONTENT_PLATFORM_URL</code> 常量</p>
      </div>
    </div>
  );
}
