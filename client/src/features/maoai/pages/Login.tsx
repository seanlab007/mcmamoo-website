import { useState } from "react";
import { Shield, Sparkles, User, ArrowRight, Bot, Cpu, Network, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLoginUrl } from "@/const";
import { MAOAI_ROUTES, MAOAI_BACKEND_URL } from "../constants";

const BACKEND_URL = MAOAI_BACKEND_URL;

/**
 * MaoAI 独立登录页
 * - 普通用户：Manus OAuth 登录
 * - 管理员：Supabase 邮箱+密码直接登录
 */
export default function MaoAILogin() {
  const { t } = useTranslation();
  const login = t("maoai.login", { returnObjects: true }) as any;
  const [hoveredCard, setHoveredCard] = useState<"user" | "admin" | null>(null);

  // Admin email login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleUserLogin = () => {
    sessionStorage.setItem("maoai_login_dest", MAOAI_ROUTES.CHAT);
    window.location.href = getLoginUrl();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/email-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
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
        // 将 sessionToken 存入 localStorage，用于跨域 tRPC 请求的 Authorization header
        if (data.sessionToken) {
          localStorage.setItem('maoai_session_token', data.sessionToken);
        }
        window.location.href = data.redirectTo ?? MAOAI_ROUTES.CHAT;
      } else {
        setLoginError(data.error ?? login.invalidCredentials);
      }
    } catch {
      setLoginError(login.networkError);
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
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <a href="/" className="flex items-center gap-3 group">
          <div className="size-9 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center group-hover:bg-[#C9A84C]/25 transition-colors">
            <Sparkles className="size-5 text-[#C9A84C]" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">MaoAI</span>
            <span className="text-[#C9A84C]/60 text-xs block leading-none">{login.headerSubtitle}</span>
          </div>
        </a>
        <a href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">
          {login.backToSite}
        </a>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-full px-4 py-1.5 mb-6">
            <Network className="size-3.5 text-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium">{login.systemBadge}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            {login.title}
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            {login.description}
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
              <h2 className="text-xl font-bold text-white mb-2">{login.userTitle}</h2>
              <p className="text-white/50 text-sm mb-6 flex-1">
                {login.userDescription}
              </p>
              <ul className="space-y-2 mb-8">
                {login.userFeatures.map((f: string) => (
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
                {login.userButton}
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Admin card - email+password form */}
          <div
            className={`relative rounded-2xl border p-8 transition-all duration-300 ${
              hoveredCard === "admin"
                ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                : "border-white/10 bg-white/3"
            }`}
            onMouseEnter={() => setHoveredCard("admin")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex flex-col h-full">
              <div className="size-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                <Shield className="size-7 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{login.adminTitle}</h2>
              <p className="text-white/50 text-sm mb-5">
                {login.adminDescription}
              </p>

              {/* Login form */}
              <form onSubmit={handleAdminLogin} className="flex flex-col gap-3 flex-1">
                <div>
                  <Input
                    type="email"
                    placeholder={login.adminEmailPlaceholder}
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-blue-500/60 focus:ring-blue-500/20"
                  />
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={login.passwordPlaceholder}
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-blue-500/60 focus:ring-blue-500/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? login.hidePassword : login.showPassword}
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

                <div className="mt-auto pt-2">
                  <ul className="space-y-1.5 mb-4">
                    {login.adminFeatures.map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-white/35">
                        <Cpu className="size-3 text-blue-400/50 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60 bg-transparent font-semibold"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        {login.adminLoading}
                      </>
                    ) : (
                      <>
                        {login.adminButton}
                        <Shield className="size-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Admin badge */}
            <div className="absolute top-4 right-4 bg-blue-500/20 border border-blue-500/30 rounded-full px-2.5 py-0.5">
              <span className="text-blue-400 text-xs font-medium">{login.adminBadge}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mt-12 text-center">
          {login.stats.map((stat: { value: string; label: string }) => (
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
