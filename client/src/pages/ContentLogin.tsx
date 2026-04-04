/**
 * ContentLogin — 猫眼增长引擎 内容平台专属登录页
 *
 * 独立于 MaoAI 的内容平台登录入口。
 * 邮箱+密码直接登录（走 /api/auth/email-login），
 * 登录后跳转回 /content。
 */
import { useState } from "react";
import { Sparkles, Zap, ArrowRight, Loader2, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// 用相对路径，走 Vite proxy 同源请求，避免跨域 CORS
const BACKEND_URL = "";

export default function ContentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const loginDest = "/content";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/email-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, redirectTo: loginDest }),
        credentials: "include",
      });

      const data = await resp.json() as {
        success?: boolean;
        role?: string;
        redirectTo?: string;
        sessionToken?: string;
        error?: string;
      };

      if (data.success) {
        if (data.sessionToken) {
          localStorage.setItem("maoai_session_token", data.sessionToken);
        }
        window.location.href = loginDest;
      } else {
        setLoginError(data.error ?? "邮箱或密码错误");
      }
    } catch {
      setLoginError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
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
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <a href="/" className="flex items-center gap-3 group">
          <div className="size-9 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center group-hover:bg-[#C9A84C]/25 transition-colors">
            <Zap className="size-5 text-[#C9A84C]" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">猫眼增长引擎</span>
            <span className="text-[#C9A84C]/60 text-xs block leading-none">Mc&Mamoo Growth Engine</span>
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
            <Sparkles className="size-3.5 text-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium">内容生产平台</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            内容平台
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            AI 驱动的内容自动化生产平台，登录后即可管理订阅、触发内容任务、查看生产历史
          </p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="size-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-4">
                <Zap className="size-8 text-[#C9A84C]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">欢迎回来</h2>
              <p className="text-white/40 text-sm">
                输入账号密码，登录内容平台
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4 mb-6">
              <Input
                type="email"
                placeholder="邮箱地址"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[#C9A84C]/60 focus:ring-[#C9A84C]/20"
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="密码"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-[#C9A84C]/60 focus:ring-[#C9A84C]/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {loginError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C9A84C] hover:bg-[#B8973B] text-black font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    登录中…
                  </>
                ) : (
                  <>
                    登录内容平台
                    <ArrowRight className="size-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Feature highlights */}
            <ul className="space-y-2.5 border-t border-white/5 pt-5">
              {[
                { icon: Zap, text: "AI 内容自动生产（小红书 / 抖音 / 微博 / 微信）" },
                { icon: User, text: "专属订阅套餐管理（免费版 / 内容会员 / 战略会员）" },
                { icon: Sparkles, text: "多平台内容定时发布与配额管理" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-white/40">
                  <Icon className="size-4 text-[#C9A84C]/50 flex-shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mt-12 text-center">
          {[
            { value: "4+", label: "内容平台" },
            { value: "AI", label: "智能生产" },
            { value: "∞", label: "内容历史" },
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
        猫眼增长引擎 · Powered by Mc&amp;Mamoo · mcmamoo.com
      </footer>
    </div>
  );
}
