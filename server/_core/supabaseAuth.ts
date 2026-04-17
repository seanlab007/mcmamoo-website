import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

<<<<<<< HEAD
// ⚠️ 注意：不要在模块顶层读取 process.env！
// tsx 执行时 ES 模块 import 会先于 dotenv.config() 执行，导致环境变量为空
// 所有需要环境变量的地方都通过 getSupabaseConfig() 函数动态获取

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL ?? "",
    anonKey: process.env.SUPABASE_ANON_KEY ?? "",
    serviceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
  };
}

function getApiKey(cfg: ReturnType<typeof getSupabaseConfig>) {
  return cfg.serviceKey || cfg.anonKey;
=======
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";

function getApiKey() {
  return SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
>>>>>>> origin/fix/navbar-dropdown-interaction
}

/**
 * 使用 Supabase REST API (PostgREST) 查询用户
 * 避免直接 PostgreSQL 连接（pooler 在 Railway 环境中不可用）
 */
async function getUserByOpenId(openId: string): Promise<Record<string, unknown> | null> {
<<<<<<< HEAD
  const cfg = getSupabaseConfig();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}&limit=1`,
=======
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}&limit=1`,
>>>>>>> origin/fix/navbar-dropdown-interaction
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
<<<<<<< HEAD
  const cfg = getSupabaseConfig();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`,
=======
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`,
>>>>>>> origin/fix/navbar-dropdown-interaction
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
<<<<<<< HEAD
  const cfg = getSupabaseConfig();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users?id=eq.${id}`,
=======
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${id}`,
>>>>>>> origin/fix/navbar-dropdown-interaction
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
<<<<<<< HEAD
  const cfg = getSupabaseConfig();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users`,
=======
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/users`,
>>>>>>> origin/fix/navbar-dropdown-interaction
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
  app.post("/api/auth/email-login", async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

<<<<<<< HEAD
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.anonKey) {
      console.error("[SupabaseAuth] Missing env: SUPABASE_URL or SUPABASE_ANON_KEY");
=======
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
>>>>>>> origin/fix/navbar-dropdown-interaction
      res.status(500).json({ error: "Supabase not configured" });
      return;
    }

    try {
      // 1. 调用 Supabase Auth 验证邮箱密码
      const authResp = await fetch(
<<<<<<< HEAD
        `${cfg.url}/auth/v1/token?grant_type=password`,
=======
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
>>>>>>> origin/fix/navbar-dropdown-interaction
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
<<<<<<< HEAD
            apikey: cfg.anonKey,
=======
            apikey: SUPABASE_ANON_KEY,
>>>>>>> origin/fix/navbar-dropdown-interaction
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

      // 3. 先查询 openId，再查询 email（处理 PENDING_FIRST_LOGIN 情况）
      let existingUser = await getUserByOpenId(openId);
      let role: "admin" | "user" = "user";

      if (!existingUser) {
        // 尝试通过 email 查找（可能是 PENDING_FIRST_LOGIN 状态）
        const userByEmail = await getUserByEmail(userEmail);

        if (userByEmail) {
          // 找到了邮箱对应的用户，更新 openId
          const userId = userByEmail.id as number;
          await updateUserOpenId(userId, openId, now);
          role = (userByEmail.role as "admin" | "user") ?? "user";
          existingUser = { ...userByEmail, openId };
        } else {
          // 全新用户
          const ownerEmail = process.env.OWNER_EMAIL ?? "benedictashford20@gmail.com";
          if (userEmail === ownerEmail) {
            role = "admin";
          }
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
        role = (existingUser.role as "admin" | "user") ?? "user";
        // 更新 lastSignedIn
<<<<<<< HEAD
        const key = getApiKey(cfg);
        await fetch(
          `${cfg.url}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}`,
=======
        const key = getApiKey();
        await fetch(
          `${SUPABASE_URL}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}`,
>>>>>>> origin/fix/navbar-dropdown-interaction
          {
            method: "PATCH",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lastSignedIn: now }),
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

      // 5. 返回登录结果（同时返回 sessionToken 供跨域场景使用）
      res.json({
        success: true,
        role,
        redirectTo: role === "admin" ? "/admin/nodes" : "/maoai",
        sessionToken,  // 供前端存入 localStorage，用于跨域 Authorization header
      });
    } catch (error) {
      console.error("[SupabaseAuth] Email login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
