import { useState } from "react";
import { Shield, Sparkles, User, ArrowRight, Bot, Cpu, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

/**
 * MaoAI 独立登录页
 * - 普通用户：直接登录使用 AI 聊天
 * - 管理员：登录后跳转到管理员控制台
 */
export default function MaoAILogin() {
  const [hoveredCard, setHoveredCard] = useState<"user" | "admin" | null>(null);

  const handleUserLogin = () => {
    // Store intended destination before redirect
    sessionStorage.setItem("maoai_login_dest", "/maoai");
    window.location.href = getLoginUrl();
  };

  const handleAdminLogin = () => {
    sessionStorage.setItem("maoai_login_dest", "/admin/nodes");
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow effects */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <a href="/" className="flex items-center gap-3 group">
          <div className="size-9 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center group-hover:bg-[#C9A84C]/25 transition-colors">
            <Sparkles className="size-5 text-[#C9A84C]" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">MaoAI</span>
            <span className="text-[#C9A84C]/60 text-xs block leading-none">统一控制中心</span>
          </div>
        </a>
        <a href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">
          返回官网 →
        </a>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-full px-4 py-1.5 mb-6">
            <Network className="size-3.5 text-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium">多节点 AI 智能路由系统</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            选择登录方式
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            普通用户直接开始 AI 对话，管理员可配置节点和路由策略
          </p>
        </div>

        {/* Login cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* User card */}
          <div
            className={`relative rounded-2xl border p-8 cursor-pointer transition-all duration-300 ${
              hoveredCard === "user"
                ? "border-[#C9A84C]/50 bg-[#C9A84C]/5 shadow-lg shadow-[#C9A84C]/10"
                : "border-white/10 bg-white/3 hover:border-white/20"
            }`}
            onMouseEnter={() => setHoveredCard("user")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={handleUserLogin}
          >
            <div className="flex flex-col h-full">
              <div className="size-14 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-6">
                <User className="size-7 text-[#C9A84C]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">普通用户</h2>
              <p className="text-white/50 text-sm mb-6 flex-1">
                登录后直接使用 AI 聊天功能，支持 DeepSeek、智谱 GLM、Groq 等多模型切换
              </p>
              {/* Features */}
              <ul className="space-y-2 mb-8">
                {["AI 多模型对话", "会话历史保存", "代码高亮渲染", "系统提示预设"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/40">
                    <Bot className="size-3.5 text-[#C9A84C]/60 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-[#C9A84C] hover:bg-[#B8973B] text-black font-semibold"
                size="lg"
              >
                用户登录
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Admin card */}
          <div
            className={`relative rounded-2xl border p-8 cursor-pointer transition-all duration-300 ${
              hoveredCard === "admin"
                ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                : "border-white/10 bg-white/3 hover:border-white/20"
            }`}
            onMouseEnter={() => setHoveredCard("admin")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={handleAdminLogin}
          >
            <div className="flex flex-col h-full">
              <div className="size-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <Shield className="size-7 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">管理员</h2>
              <p className="text-white/50 text-sm mb-6 flex-1">
                登录后进入控制台，管理 AI 节点、配置路由策略、查看调用日志和系统监控
              </p>
              {/* Features */}
              <ul className="space-y-2 mb-8">
                {["AI 节点管理", "智能路由配置", "调用日志监控", "多机分工协作"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/40">
                    <Cpu className="size-3.5 text-blue-400/60 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60 bg-transparent font-semibold"
                size="lg"
              >
                管理员登录
                <Shield className="size-4 ml-2" />
              </Button>
            </div>
            {/* Admin badge */}
            <div className="absolute top-4 right-4 bg-blue-500/20 border border-blue-500/30 rounded-full px-2.5 py-0.5">
              <span className="text-blue-400 text-xs font-medium">仅限授权</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mt-12 text-center">
          {[
            { value: "5+", label: "AI 模型" },
            { value: "24/7", label: "多机协作" },
            { value: "∞", label: "会话历史" },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-[#C9A84C]">{stat.value}</div>
              <div className="text-white/30 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-white/20 text-xs">
        MaoAI · Powered by Mc&amp;Mamoo · mcmamoo.com
      </footer>
    </div>
  );
}
