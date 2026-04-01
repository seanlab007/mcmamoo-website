import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";

function getApiKey() {
  return SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
}

/**
 * 使用 Supabase REST API (PostgREST) 查询用户
 * 避免直接 PostgreSQL 连接（pooler 在 Railway 环境中不可用）
 */
async function getUserByOpenId(openId: string): Promise<Record<string, unknown> | null> {
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}&limit=1`,
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
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`,
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
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${id}`,
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
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/users`,
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

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      res.status(500).json({ error: "Supabase not configured" });
      return;
    }

    try {
      // 1. 调用 Supabase Auth 验证邮箱密码
      const authResp = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
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
        const key = getApiKey();
        await fetch(
          `${SUPABASE_URL}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}`,
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
