import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// 注意：不要在模块顶层读取 process.env！
// dotenv.config() 在 index.ts 中调用，但 ES 模块导入会先执行，导致这里读到空值
// 改为在函数内动态读取

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL ?? "",
    anonKey: process.env.SUPABASE_ANON_KEY ?? "",
    serviceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
  };
}

function getApiKey(cfg: ReturnType<typeof getSupabaseConfig>) {
  return cfg.serviceKey || cfg.anonKey;
}

/**
 * 使用 Supabase REST API (PostgREST) 查询用户
 * 避免直接 PostgreSQL 连接（pooler 在 Railway 环境中不可用）
 */
async function getUserByOpenId(openId: string): Promise<Record<string, unknown> | null> {
  const cfg = getSupabaseConfig();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    console.error("[SupabaseREST] getUserByOpenId error:", resp.status, err);
    return null;
  }
  const rows = await resp.json() as Record<string, unknown>[];
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 查询邮箱对应的用户（处理 PENDING_FIRST_LOGIN 情况）
 */
async function getUserByEmail(email: string): Promise<Record<string, unknown> | null> {
  const cfg = getSupabaseConfig();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!resp.ok) return null;
  const rows = await resp.json() as Record<string, unknown>[];
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 更新用户的 openId（处理 PENDING_FIRST_LOGIN → 实际 openId）
 */
async function updateUserOpenId(id: number, openId: string, lastSignedIn: string): Promise<void> {
  const cfg = getSupabaseConfig();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ openId, lastSignedIn }),
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    console.error("[SupabaseREST] updateUserOpenId error:", resp.status, err);
  }
}

/**
 * 使用 Supabase REST API upsert 用户
 */
async function upsertUser(user: {
  openId: string;
  email: string;
  name: string;
  loginMethod: string;
  role: string;
  lastSignedIn: string;
}): Promise<void> {
  const cfg = getSupabaseConfig();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(user),
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    console.error("[SupabaseREST] upsertUser error:", resp.status, err);
    throw new Error(`Failed to upsert user: ${resp.status} ${err}`);
  }
}

  /**
   * Supabase 邮箱+密码登录路由
   * POST /api/auth/email-login
   * Body: { email: string, password: string }
   */
export function registerSupabaseAuthRoutes(app: Express) {
  // ── 密码重置 ──────────────────────────────────────────────────────
  // POST /api/auth/password-reset-request
  // Body: { email: string } → 发送密码重置邮件到用户邮箱
  app.post("/api/auth/password-reset-request", async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: "请输入邮箱地址" });
      return;
    }

    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.anonKey) {
      console.error("[SupabaseAuth] Missing env for password reset");
      res.status(500).json({ error: "服务未配置" });
      return;
    }

    try {
      // 调用 Supabase Auth 发送密码重置邮件
      const resetResp = await fetch(
        `${cfg.url}/auth/v1/recover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: cfg.anonKey,
          },
          body: JSON.stringify({ email }),
        }
      );

      const resetData = await resetResp.json() as Record<string, unknown>;

      if (!resetResp.ok) {
        console.error("[SupabaseAuth] Password reset request failed:", resetData);
        // 即使失败也返回成功（防止邮箱枚举攻击）
        res.json({
          success: true,
          message: "如果该邮箱已注册，您将收到一封重置邮件（请检查垃圾箱）",
        });
        return;
      }

      res.json({
        success: true,
        message: "重置链接已发送到您的邮箱，请检查收件箱和垃圾箱",
      });
    } catch (error) {
      console.error("[SupabaseAuth] Password reset error:", error);
      // 安全起见，不暴露具体错误
      res.json({
        success: true,
        message: "如果该邮箱已注册，您将收到一封重置邮件（请检查垃圾箱）",
      });
    }
  });

  // ── 邮箱登录 ───────────────────────────────────────────────────────
  // POST /api/auth/email-login
  // Body: { email: string, password: string }
  app.post("/api/auth/email-login", async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.anonKey) {
      console.error("[SupabaseAuth] Missing env: SUPABASE_URL or SUPABASE_ANON_KEY");
      res.status(500).json({ error: "Supabase not configured" });
      return;
    }

    try {
      // 1. 调用 Supabase Auth 验证邮箱密码
      const authResp = await fetch(
        `${cfg.url}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: cfg.anonKey,
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const authData = await authResp.json() as {
        access_token?: string;
        user?: { id: string; email: string };
        error?: string;
        error_description?: string;
      };

      if (!authData.access_token || !authData.user) {
        res.status(401).json({
          error: authData.error_description || authData.error || "Invalid credentials",
        });
        return;
      }

      // 2. 用 Supabase user.id 作为 openId
      const openId = `supabase:${authData.user.id}`;
      const userEmail = authData.user.email ?? email;
      const now = new Date().toISOString();
      const ownerEmail = process.env.OWNER_EMAIL ?? "benedictashford20@gmail.com";
      const isAdminEmail = userEmail === ownerEmail || userEmail === "sean_lab@me.com";

      // 3. 先查询 openId，再查询 email（处理 PENDING_FIRST_LOGIN 情况）
      let existingUser = await getUserByOpenId(openId);
      let role: "admin" | "user" = isAdminEmail ? "admin" : "user";

      if (!existingUser) {
        // 尝试通过 email 查找（可能是 PENDING_FIRST_LOGIN 状态）
        const userByEmail = await getUserByEmail(userEmail);

        if (userByEmail) {
          // 找到了邮箱对应的用户，更新 openId
          const userId = userByEmail.id as number;
          await updateUserOpenId(userId, openId, now);
          role = isAdminEmail ? "admin" : ((userByEmail.role as "admin" | "user") ?? "user");
          existingUser = { ...userByEmail, openId, role };
        } else {
          // 全新用户
          await upsertUser({
            openId,
            email: userEmail,
            name: userEmail.split("@")[0],
            loginMethod: "email",
            lastSignedIn: now,
            role,
          });
        }
      } else {
        role = isAdminEmail ? "admin" : ((existingUser.role as "admin" | "user") ?? "user");
        // 更新 lastSignedIn 与角色
        const key = getApiKey(cfg);
        await fetch(
          `${cfg.url}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}`,
          {
            method: "PATCH",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lastSignedIn: now, role }),
          }
        );
      }

      // 4. 创建 MaoAI session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userEmail.split("@")[0],
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // 5. 决定跳转目标：优先用请求传入的 redirectTo
      const finalRedirectTo = (req.body as { redirectTo?: string }).redirectTo
        ?? (role === "admin" ? "/admin/nodes" : "/maoai");

      // 5. 返回登录结果（同时返回 sessionToken 供跨域场景使用）
      res.json({
        success: true,
        role,
        redirectTo: finalRedirectTo,
        sessionToken,  // 供前端存入 localStorage，用于跨域 Authorization header
      });
    } catch (error) {
      console.error("[SupabaseAuth] Email login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
