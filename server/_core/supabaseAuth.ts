import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

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
      const userEmail = authData.user.email;

      // 3. 检查是否是 owner（第一个管理员）
      const existingUser = await db.getUserByOpenId(openId);
      let role: "admin" | "user" = "user";

      if (!existingUser) {
        // 新用户：检查邮箱是否是 owner 邮箱
        const ownerEmail = process.env.OWNER_EMAIL ?? "benedictashford20@gmail.com";
        if (userEmail === ownerEmail) {
          role = "admin";
        }
        // upsert 到 MaoAI users 表
        await db.upsertUser({
          openId,
          email: userEmail,
          name: userEmail.split("@")[0],
          loginMethod: "email",
          lastSignedIn: new Date(),
          role,
        });
      } else {
        role = existingUser.role as "admin" | "user";
      }

      // 4. 创建 MaoAI session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userEmail.split("@")[0],
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // 5. 返回登录结果
      res.json({
        success: true,
        role,
        redirectTo: role === "admin" ? "/admin/nodes" : "/maoai",
      });
    } catch (error) {
      console.error("[SupabaseAuth] Email login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
