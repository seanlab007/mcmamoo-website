import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { createHash } from "crypto";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// 简单的密码哈希（用于本地开发环境）
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// 管理员账号配置（本地开发环境使用）
const ADMIN_CREDENTIALS = {
  email: "sean_lab@me.com",
  // 默认密码: maoai_admin_2024
  passwordHash: "a3f5c8e9d2b1a7f4e6c3d8b9a2f5e7c1d4b6a8f3e9c2d5b7a1f4e6c8d3b9a2f5",
};

export function registerOAuthRoutes(app: Express) {
  // OAuth 回调
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // 从 state 参数解析目标跳转页面（由前端 getLoginUrl() 编码）
      let dest = "/";
      try {
        const stateData = JSON.parse(atob(state));
        dest = stateData.dest || "/";
      } catch {
        // state 解析失败，使用默认 /
      }

      // 重定向到目标页面
      res.setHeader("Content-Type", "text/html");
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>window.location.href = ${JSON.stringify(dest)};</script>
<noscript><p>登录成功，正在跳转……</p><a href="${dest}">点击继续</a></noscript>
</body></html>`);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // 管理员邮箱登录（本地开发环境）
  app.post("/api/auth/email-login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "邮箱和密码不能为空" });
      return;
    }

    try {
      // 验证管理员凭据
      if (email !== ADMIN_CREDENTIALS.email) {
        res.status(401).json({ error: "邮箱或密码错误" });
        return;
      }

      // 使用环境变量中的密码哈希或默认密码
      const expectedHash = process.env.ADMIN_PASSWORD_HASH || ADMIN_CREDENTIALS.passwordHash;
      const providedHash = hashPassword(password);

      if (providedHash !== expectedHash) {
        res.status(401).json({ error: "邮箱或密码错误" });
        return;
      }

      // 创建管理员 openId
      const adminOpenId = `admin_${email.replace(/[@.]/g, "_")}`;

      // 检查用户是否已存在
      const existingUser = await db.getUserByOpenId(adminOpenId);
      if (!existingUser) {
        // 新用户，尝试创建（如果失败可能是并发问题，忽略错误）
        try {
          await db.upsertUser({
            openId: adminOpenId,
            name: "管理员",
            email: email,
            loginMethod: "email",
            role: "admin",
            lastSignedIn: new Date(),
          });
        } catch (e) {
          // 用户可能已存在，忽略错误继续
          console.log("[Auth] User may already exist, continuing...");
        }
      }

      // 创建 session token
      const sessionToken = await sdk.createSessionToken(adminOpenId, {
        name: "管理员",
        expiresInMs: ONE_YEAR_MS,
      });

      // 设置 cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        role: "admin",
        redirectTo: "/admin/nodes",
        sessionToken,
      });
    } catch (error) {
      console.error("[Auth] Email login failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: "登录失败，请稍后重试: " + message });
    }
  });
}
