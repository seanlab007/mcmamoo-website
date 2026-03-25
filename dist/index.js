// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var maoApplications = mysqlTable("mao_applications", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  organization: varchar("organization", { length: 256 }).notNull(),
  consultType: varchar("consult_type", { length: 128 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewing", "approved", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var briefSubscribers = mysqlTable("brief_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
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
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/email.ts
import nodemailer from "nodemailer";
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  if (!user || !pass) {
    throw new Error("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in Secrets.");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}
async function sendEmail(opts) {
  try {
    const transporter = getTransporter();
    const fromName = process.env.SMTP_FROM_NAME || "\u732B\u773C\u54A8\u8BE2";
    const fromEmail = process.env.SMTP_USER || "";
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text
    });
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}
async function sendBulkEmails(recipients, subject, html, text2) {
  let success = 0;
  let failed = 0;
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((email) => sendEmail({ to: email, subject, html, text: text2 }))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) success++;
      else failed++;
    }
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  return { success, failed };
}
function generateContactConfirmationHtml(name, company) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\u611F\u8C22\u60A8\u7684\u54A8\u8BE2\u7533\u8BF7 \u2014 \u732B\u773C\u54A8\u8BE2</title>
  <style>
    body { margin: 0; padding: 0; background: #0A0A0A; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #111111; }
    .header { background: #0A0A0A; padding: 32px 40px; border-bottom: 2px solid #C9A84C; }
    .logo-text { color: #C9A84C; font-size: 22px; font-weight: 700; letter-spacing: 0.1em; }
    .logo-sub { color: #ffffff55; font-size: 11px; letter-spacing: 0.2em; margin-top: 4px; }
    .body { padding: 40px; }
    .greeting { color: #ffffff; font-size: 20px; font-weight: 700; margin-bottom: 20px; }
    .content { color: #cccccc; font-size: 15px; line-height: 1.8; }
    .highlight { color: #C9A84C; font-weight: 600; }
    .box { background: #0A0A0A; border: 1px solid #C9A84C33; padding: 24px 28px; margin: 24px 0; }
    .box-label { color: #C9A84C; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px; }
    .box-value { color: #ffffff; font-size: 15px; }
    .divider { border: none; border-top: 1px solid #ffffff11; margin: 32px 0; }
    .cta { display: inline-block; background: #C9A84C; color: #000; padding: 14px 32px; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-decoration: none; margin-top: 8px; }
    .footer { background: #0A0A0A; padding: 24px 40px; border-top: 1px solid #ffffff11; }
    .footer-text { color: #ffffff33; font-size: 12px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">\u732B\u773C\u54A8\u8BE2</div>
      <div class="logo-sub">MC&MAMOO BRAND MANAGEMENT</div>
    </div>
    <div class="body">
      <div class="greeting">\u5C0A\u656C\u7684 ${name}\uFF0C</div>
      <div class="content">
        <p>\u611F\u8C22\u60A8\u5411\u732B\u773C\u54A8\u8BE2\u63D0\u4EA4\u54C1\u724C\u6218\u7565\u54A8\u8BE2\u7533\u8BF7\u3002\u6211\u4EEC\u5DF2\u6536\u5230\u60A8\u7684\u4FE1\u606F\uFF0C\u6211\u4EEC\u7684\u9996\u5E2D\u6218\u7565\u4E13\u5BB6\u56E2\u961F\u5C06\u5728 <span class="highlight">1-2\u4E2A\u5DE5\u4F5C\u65E5\u5185</span> \u4E0E\u60A8\u8054\u7CFB\u3002</p>
        <div class="box">
          <div class="box-label">\u60A8\u7684\u7533\u8BF7\u4FE1\u606F</div>
          <div class="box-value">\u59D3\u540D\uFF1A${name}</div>
          <div class="box-value" style="margin-top:6px">\u516C\u53F8\uFF1A${company}</div>
        </div>
        <p>\u5728\u7B49\u5F85\u671F\u95F4\uFF0C\u60A8\u53EF\u4EE5\u8BBF\u95EE\u6211\u4EEC\u7684\u5B98\u7F51\u4E86\u89E3\u66F4\u591A\u6807\u6746\u6848\u4F8B\uFF0C\u6216\u5173\u6CE8\u6211\u4EEC\u7684\u6700\u65B0\u6218\u7565\u6D1E\u5BDF\u3002</p>
      </div>
      <hr class="divider" />
      <a href="https://www.mcmamoo.com" class="cta">\u67E5\u770B\u6807\u6746\u6848\u4F8B \u2192</a>
    </div>
    <div class="footer">
      <div class="footer-text">
        \u732B\u773C\u54A8\u8BE2 Mc&Mamoo Brand Management Inc.<br/>
        \u4E0A\u6D77 \xB7 \u54C1\u724C\u663E\u8D35 \xB7 \u5229\u6DA6\u500D\u589E \xB7 \u5168\u57DF\u589E\u957F<br/>
        \u8054\u7CFB\u7535\u8BDD\uFF1A+86 137 6459 7723
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
function generateContactAdminHtml(name, company, phone, message) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>\u65B0\u54A8\u8BE2\u7533\u8BF7 \u2014 \u732B\u773C\u54A8\u8BE2\u540E\u53F0</title>
  <style>
    body { margin: 0; padding: 0; background: #0A0A0A; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #111111; }
    .header { background: #0A0A0A; padding: 24px 32px; border-bottom: 2px solid #C9A84C; }
    .title { color: #C9A84C; font-size: 18px; font-weight: 700; }
    .body { padding: 32px; }
    .field { margin-bottom: 16px; }
    .label { color: #ffffff55; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px; }
    .value { color: #ffffff; font-size: 15px; }
    .msg { color: #cccccc; font-size: 14px; line-height: 1.7; background: #0A0A0A; padding: 16px; border-left: 2px solid #C9A84C; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><div class="title">\u{1F514} \u65B0\u54A8\u8BE2\u7533\u8BF7</div></div>
    <div class="body">
      <div class="field"><div class="label">\u59D3\u540D</div><div class="value">${name}</div></div>
      <div class="field"><div class="label">\u516C\u53F8</div><div class="value">${company}</div></div>
      <div class="field"><div class="label">\u8054\u7CFB\u7535\u8BDD</div><div class="value">${phone}</div></div>
      <div class="field"><div class="label">\u54A8\u8BE2\u9700\u6C42</div><div class="msg">${message || "\uFF08\u672A\u586B\u5199\uFF09"}</div></div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
function generateNewsletterHtml(subject, content) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background: #0A0A0A; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #111111; }
    .header { background: #0A0A0A; padding: 32px 40px; border-bottom: 1px solid #C9A84C33; }
    .logo-text { color: #C9A84C; font-size: 20px; font-weight: 700; letter-spacing: 0.1em; }
    .logo-sub { color: #ffffff55; font-size: 11px; letter-spacing: 0.2em; margin-top: 4px; }
    .body { padding: 40px; }
    .subject { color: #C9A84C; font-size: 22px; font-weight: 700; margin-bottom: 24px; line-height: 1.4; }
    .content { color: #cccccc; font-size: 15px; line-height: 1.8; white-space: pre-wrap; }
    .divider { border: none; border-top: 1px solid #ffffff11; margin: 32px 0; }
    .cta { display: inline-block; background: #C9A84C; color: #000; padding: 12px 28px; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-decoration: none; margin-top: 8px; }
    .footer { background: #0A0A0A; padding: 24px 40px; border-top: 1px solid #ffffff11; }
    .footer-text { color: #ffffff33; font-size: 12px; line-height: 1.6; }
    .footer-link { color: #C9A84C55; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">\u732B\u773C\u54A8\u8BE2</div>
      <div class="logo-sub">MC&MAMOO BRAND MANAGEMENT</div>
    </div>
    <div class="body">
      <div class="subject">${subject}</div>
      <div class="content">${content.replace(/\n/g, "<br/>")}</div>
      <hr class="divider" />
      <a href="https://www.mcmamoo.com" class="cta">\u8BBF\u95EE\u5B98\u7F51 \u2192</a>
    </div>
    <div class="footer">
      <div class="footer-text">
        \u60A8\u6536\u5230\u6B64\u90AE\u4EF6\u662F\u56E0\u4E3A\u60A8\u8BA2\u9605\u4E86\u732B\u773C\u54A8\u8BE2\u6218\u7565\u7B80\u62A5\u3002<br/>
        \u5982\u9700\u9000\u8BA2\uFF0C\u8BF7\u56DE\u590D\u6B64\u90AE\u4EF6\u5E76\u6CE8\u660E"\u9000\u8BA2"\u3002<br/>
        \xA9 2025 \u732B\u773C\u54A8\u8BE2 Mc&Mamoo Brand Management Inc. \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Contact form submission with email notification
  contact: router({
    submit: publicProcedure.input(
      z2.object({
        name: z2.string().min(1).max(128),
        company: z2.string().min(1).max(256),
        phone: z2.string().min(1).max(64),
        message: z2.string().max(2e3).optional(),
        email: z2.string().email().optional()
      })
    ).mutation(async ({ input }) => {
      const adminEmail = process.env.SMTP_USER || "";
      if (input.email) {
        const confirmHtml = generateContactConfirmationHtml(input.name, input.company);
        await sendEmail({
          to: input.email,
          subject: `\u611F\u8C22\u60A8\u7684\u54A8\u8BE2\u7533\u8BF7 \u2014 \u732B\u773C\u54A8\u8BE2`,
          html: confirmHtml,
          text: `\u5C0A\u656C\u7684 ${input.name}\uFF0C\u611F\u8C22\u60A8\u5411\u732B\u773C\u54A8\u8BE2\u63D0\u4EA4\u54A8\u8BE2\u7533\u8BF7\u3002\u6211\u4EEC\u5C06\u5728 1-2 \u4E2A\u5DE5\u4F5C\u65E5\u5185\u4E0E\u60A8\u8054\u7CFB\u3002`
        });
      }
      if (adminEmail) {
        const adminHtml = generateContactAdminHtml(
          input.name,
          input.company,
          input.phone,
          input.message ?? ""
        );
        await sendEmail({
          to: adminEmail,
          subject: `\u732B\u773C\u54A8\u8BE2\u65B0\u54A8\u8BE2\u7533\u8BF7\uFF1A${input.name} / ${input.company}`,
          html: adminHtml
        });
      }
      await notifyOwner({
        title: `\u65B0\u54A8\u8BE2\u7533\u8BF7\uFF1A${input.company}`,
        content: `\u59D3\u540D\uFF1A${input.name}
\u516C\u53F8\uFF1A${input.company}
\u7535\u8BDD\uFF1A${input.phone}
\u9700\u6C42\uFF1A${input.message ?? "\uFF08\u65E0\uFF09"}`
      });
      return { success: true };
    })
  }),
  // Mao Think Tank consultation application
  mao: router({
    submitApplication: publicProcedure.input(
      z2.object({
        name: z2.string().min(1).max(128),
        organization: z2.string().min(1).max(256),
        consultType: z2.string().min(1).max(128),
        description: z2.string().max(2e3).optional()
      })
    ).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }
      await db.insert(maoApplications).values({
        name: input.name,
        organization: input.organization,
        consultType: input.consultType,
        description: input.description ?? null,
        status: "pending"
      });
      await notifyOwner({
        title: `\u65B0\u6BDB\u667A\u5E93\u54A8\u8BE2\u7533\u8BF7\uFF1A${input.organization}`,
        content: `\u7533\u8BF7\u4EBA\uFF1A${input.name}
\u673A\u6784\uFF1A${input.organization}
\u54A8\u8BE2\u65B9\u5411\uFF1A${input.consultType}
\u8BF4\u660E\uFF1A${input.description ?? "\uFF08\u65E0\uFF09"}`
      });
      return { success: true };
    }),
    // Admin: list all applications (protected - admin only)
    listApplications: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE" });
      }
      const db = await getDb();
      if (!db) return [];
      const results = await db.select().from(maoApplications).orderBy(maoApplications.createdAt);
      return results;
    }),
    // Subscribe to strategic brief
    subscribeBrief: publicProcedure.input(
      z2.object({
        email: z2.string().email()
      })
    ).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(briefSubscribers).values({
        email: input.email
      }).onDuplicateKeyUpdate({ set: { email: input.email } });
      await notifyOwner({
        title: "\u65B0\u6218\u7565\u7B80\u62A5\u8BA2\u9605",
        content: `\u90AE\u7BB1\uFF1A${input.email} \u5DF2\u8BA2\u9605\u6BDB\u667A\u5E93\u6218\u7565\u7B80\u62A5`
      });
      return { success: true };
    }),
    // Admin: list all subscribers (protected - admin only)
    listSubscribers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE" });
      }
      const db = await getDb();
      if (!db) return [];
      const results = await db.select().from(briefSubscribers).orderBy(briefSubscribers.createdAt);
      return results;
    }),
    // Admin: update application status (protected - admin only)
    updateApplicationStatus: protectedProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        status: z2.enum(["pending", "approved", "rejected", "reviewing"])
      })
    ).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
      }
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { eq: eq2 } = await import("drizzle-orm");
      await db.update(maoApplications).set({ status: input.status }).where(eq2(maoApplications.id, input.id));
      return { success: true };
    }),
    // Admin: update application notes (protected - admin only)
    updateApplicationNotes: protectedProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        notes: z2.string().max(2e3)
      })
    ).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
      }
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { eq: eq2 } = await import("drizzle-orm");
      await db.update(maoApplications).set({ notes: input.notes }).where(eq2(maoApplications.id, input.id));
      return { success: true };
    }),
    // Admin: send newsletter to all subscribers (protected - admin only)
    sendNewsletter: protectedProcedure.input(
      z2.object({
        subject: z2.string().min(1).max(256),
        content: z2.string().min(1).max(1e4)
      })
    ).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
      }
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const subscribers = await db.select().from(briefSubscribers);
      if (subscribers.length === 0) {
        return { success: true, sent: 0, failed: 0, message: "\u6682\u65E0\u8BA2\u9605\u8005" };
      }
      const emails = subscribers.map((s) => s.email);
      const html = generateNewsletterHtml(input.subject, input.content);
      const { success, failed } = await sendBulkEmails(emails, input.subject, html, input.content);
      return { success: true, sent: success, failed, message: `\u5DF2\u53D1\u9001 ${success} \u5C01\uFF0C\u5931\u8D25 ${failed} \u5C01` };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const viteConfig = await import("../../vite.config").then((m) => m.default || m);
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        __dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path.resolve(__dirname, "../..", "dist", "public") : path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/aiNodes.ts
import { Router } from "express";
import crypto from "crypto";
var aiNodesRouter = Router();
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) {
    throw new Error("SUPABASE_URL \u6216 SUPABASE_SERVICE_KEY \u672A\u914D\u7F6E");
  }
  return { url, key };
}
async function sbFetch(path2, options = {}, prefer) {
  const { url, key } = getSupabaseConfig();
  const headers = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...options.headers
  };
  if (prefer) headers["Prefer"] = prefer;
  const res = await globalThis.fetch(`${url}/rest/v1${path2}`, {
    ...options,
    headers
  });
  let data;
  const text2 = await res.text();
  try {
    data = text2 ? JSON.parse(text2) : null;
  } catch {
    data = text2;
  }
  return { ok: res.ok, status: res.status, data };
}
function verifyNodeToken(token) {
  const expected = process.env.NODE_REGISTRATION_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || "";
  if (!expected) {
    console.warn("[aiNodes] NODE_REGISTRATION_TOKEN \u672A\u914D\u7F6E\uFF0C\u8DF3\u8FC7 token \u9A8C\u8BC1\uFF08\u4EC5\u5F00\u53D1\u6A21\u5F0F\uFF09");
    return true;
  }
  return token === expected;
}
function computeChecksum(skills) {
  const sorted = [...skills].sort((a, b) => a.id.localeCompare(b.id));
  const raw = sorted.map((s) => `${s.id}:${s.version ?? "1.0.0"}`).join("|");
  return "sha256:" + crypto.createHash("sha256").update(raw).digest("hex").slice(0, 8);
}
function toSkillRow(nodeId, s) {
  return {
    nodeId,
    skillId: s.id,
    name: s.name,
    version: s.version ?? "1.0.0",
    description: s.description ?? null,
    triggers: s.triggers ?? [],
    category: s.category ?? "custom",
    isActive: s.isActive !== false
  };
}
async function markOfflineNodes() {
  try {
    const cutoff = new Date(Date.now() - 9e4).toISOString();
    await sbFetch(
      `/ai_nodes?isOnline=eq.true&lastHeartbeatAt=lt.${encodeURIComponent(cutoff)}`,
      { method: "PATCH", body: JSON.stringify({ isOnline: false }) }
    );
  } catch {
  }
}
setInterval(markOfflineNodes, 3e4);
aiNodesRouter.post("/node/register", async (req, res) => {
  const body = req.body;
  if (!verifyNodeToken(body.token)) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }
  if (!body.name || !body.baseUrl) {
    res.status(400).json({ success: false, error: "name and baseUrl are required" });
    return;
  }
  try {
    const skillsChecksum = body.skills ? computeChecksum(body.skills) : null;
    const existing = await sbFetch(`/ai_nodes?name=eq.${encodeURIComponent(body.name)}&select=id`);
    const existingRows = existing.data;
    let nodeId;
    if (existingRows && existingRows.length > 0) {
      nodeId = existingRows[0].id;
      await sbFetch(
        `/ai_nodes?id=eq.${nodeId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            baseUrl: body.baseUrl,
            type: body.type ?? "openclaw",
            modelId: body.modelId ?? "",
            isOnline: true,
            isLocal: true,
            isActive: true,
            skillsChecksum,
            token: body.token,
            lastHeartbeatAt: (/* @__PURE__ */ new Date()).toISOString(),
            lastPingAt: (/* @__PURE__ */ new Date()).toISOString()
          })
        },
        "return=representation"
      );
    } else {
      const result = await sbFetch(
        `/ai_nodes`,
        {
          method: "POST",
          body: JSON.stringify({
            name: body.name,
            baseUrl: body.baseUrl,
            type: body.type ?? "openclaw",
            modelId: body.modelId ?? "",
            isOnline: true,
            isLocal: true,
            isActive: true,
            skillsChecksum,
            token: body.token,
            lastHeartbeatAt: (/* @__PURE__ */ new Date()).toISOString(),
            lastPingAt: (/* @__PURE__ */ new Date()).toISOString()
          })
        },
        "return=representation"
      );
      const rows = result.data;
      if (!rows || rows.length === 0) {
        res.status(500).json({ success: false, error: "\u8282\u70B9\u521B\u5EFA\u5931\u8D25\uFF0C\u672A\u8FD4\u56DE id" });
        return;
      }
      nodeId = rows[0].id;
    }
    if (body.skills && body.skills.length > 0 && nodeId) {
      await sbFetch(`/node_skills?nodeId=eq.${nodeId}`, { method: "DELETE" });
      const skillRows = body.skills.map((s) => toSkillRow(nodeId, s));
      await sbFetch(
        `/node_skills`,
        { method: "POST", body: JSON.stringify(skillRows) },
        "return=minimal"
      );
    }
    console.log(`[aiNodes] \u8282\u70B9\u6CE8\u518C\u6210\u529F: ${body.name} (id=${nodeId}), \u6280\u80FD\u6570: ${body.skills?.length ?? 0}`);
    res.json({
      success: true,
      nodeId,
      message: `\u8282\u70B9 ${body.name} \u6CE8\u518C\u6210\u529F`
    });
  } catch (error) {
    console.error("[aiNodes] register error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});
aiNodesRouter.post("/node/heartbeat", async (req, res) => {
  const body = req.body;
  if (!verifyNodeToken(body.token)) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }
  try {
    const existing = await sbFetch(
      `/ai_nodes?id=eq.${body.nodeId}&select=id,skillsChecksum`
    );
    const rows = existing.data;
    if (!rows || rows.length === 0) {
      res.json({ success: true, needsReregister: true });
      return;
    }
    await sbFetch(
      `/ai_nodes?id=eq.${body.nodeId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          isOnline: true,
          lastHeartbeatAt: (/* @__PURE__ */ new Date()).toISOString(),
          lastPingAt: (/* @__PURE__ */ new Date()).toISOString()
        })
      }
    );
    const needsSkillSync = body.skillsChecksum !== void 0 && rows[0].skillsChecksum !== body.skillsChecksum;
    res.json({ success: true, needsSkillSync });
  } catch (error) {
    console.error("[aiNodes] heartbeat error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});
aiNodesRouter.post("/node/deregister", async (req, res) => {
  const body = req.body;
  if (!verifyNodeToken(body.token)) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }
  try {
    await sbFetch(
      `/ai_nodes?id=eq.${body.nodeId}`,
      { method: "PATCH", body: JSON.stringify({ isOnline: false }) }
    );
    console.log(`[aiNodes] \u8282\u70B9\u5DF2\u6CE8\u9500: id=${body.nodeId}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});
aiNodesRouter.post("/node/skills/sync", async (req, res) => {
  const body = req.body;
  if (!verifyNodeToken(body.token)) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }
  if (!body.skills || body.skills.length === 0) {
    res.status(400).json({ success: false, error: "skills array is required" });
    return;
  }
  try {
    if (body.action === "delete") {
      for (const s of body.skills) {
        await sbFetch(
          `/node_skills?nodeId=eq.${body.nodeId}&skillId=eq.${encodeURIComponent(s.id)}`,
          { method: "DELETE" }
        );
      }
    } else {
      for (const s of body.skills) {
        const row = toSkillRow(body.nodeId, s);
        await sbFetch(
          `/node_skills`,
          { method: "POST", body: JSON.stringify(row) },
          "resolution=merge-duplicates"
        );
      }
    }
    const allSkillsRes = await sbFetch(
      `/node_skills?nodeId=eq.${body.nodeId}&select=skillId,version`
    );
    const allSkills = allSkillsRes.data;
    const newChecksum = computeChecksum(
      allSkills.map((s) => ({ id: s.skillId, version: s.version }))
    );
    await sbFetch(
      `/ai_nodes?id=eq.${body.nodeId}`,
      { method: "PATCH", body: JSON.stringify({ skillsChecksum: newChecksum }) }
    );
    res.json({ success: true, checksum: newChecksum, count: allSkills.length });
  } catch (error) {
    console.error("[aiNodes] skills/sync error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});
aiNodesRouter.get("/node/list", async (_req, res) => {
  try {
    const nodesRes = await sbFetch("/ai_nodes?isLocal=eq.true&select=*&order=createdAt.asc");
    const nodes = nodesRes.data ?? [];
    const skillsRes = await sbFetch(
      `/node_skills?nodeId=in.(${nodes.map((n) => n.id).join(",") || "0"})`
    );
    const allSkills = skillsRes.data;
    const result = nodes.map((node) => ({
      ...node,
      token: void 0,
      // 不暴露 token
      skills: allSkills.filter((s) => s.nodeId === node.id)
    }));
    res.json({ nodes: result });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});
aiNodesRouter.post("/skill/invoke", async (req, res) => {
  const { nodeId, skillId, params, requestId, timeout: timeoutMs = 3e4 } = req.body;
  try {
    const nodeRes = await sbFetch(
      `/ai_nodes?id=eq.${nodeId}&isOnline=eq.true&select=*`
    );
    const nodes = nodeRes.data;
    if (!nodes || nodes.length === 0) {
      res.status(404).json({ success: false, error: "\u8282\u70B9\u4E0D\u5728\u7EBF\u6216\u4E0D\u5B58\u5728" });
      return;
    }
    const node = nodes[0];
    const invokeUrl = `${node.baseUrl}/skill/invoke`;
    const fetchPromise = globalThis.fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${node.token}`
      },
      body: JSON.stringify({ skillId, params, requestId, timeout: timeoutMs })
    });
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("\u6280\u80FD\u8C03\u7528\u8D85\u65F6")), timeoutMs)
    );
    const fetchResponse = await Promise.race([fetchPromise, timeoutPromise]);
    const data = await fetchResponse.json();
    res.status(fetchResponse.status).json(data);
  } catch (error) {
    console.error("[aiNodes] skill/invoke error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});
aiNodesRouter.post("/skill/match", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }
  try {
    const nodesRes = await sbFetch(
      "/ai_nodes?isOnline=eq.true&isLocal=eq.true&select=id"
    );
    const onlineNodes = nodesRes.data;
    if (onlineNodes.length === 0) {
      res.json({ matched: [] });
      return;
    }
    const nodeIds = onlineNodes.map((n) => n.id);
    const skillsRes = await sbFetch(
      `/node_skills?nodeId=in.(${nodeIds.join(",")})&isActive=eq.true&select=*`
    );
    const skills = skillsRes.data;
    const msgLower = message.toLowerCase();
    const matched = skills.filter((skill) => {
      const triggers = skill.triggers ?? [];
      return triggers.some((t2) => msgLower.includes(t2.toLowerCase()));
    });
    res.json({ matched });
  } catch (error) {
    console.error("[aiNodes] skill/match error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// server/chat.ts
import { Router as Router2 } from "express";
var chatRouter = Router2();
function sbHeaders() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  return {
    url,
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  };
}
async function sbGet(path2) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path2}`, { headers });
  const text2 = await res.text();
  return { ok: res.ok, status: res.status, data: text2 ? JSON.parse(text2) : null };
}
async function sbPost(path2, body, prefer) {
  const { url, headers } = sbHeaders();
  const h = { ...headers };
  if (prefer) h["Prefer"] = prefer;
  const res = await fetch(`${url}/rest/v1${path2}`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(body)
  });
  const text2 = await res.text();
  return { ok: res.ok, status: res.status, data: text2 ? JSON.parse(text2) : null };
}
async function sbDelete(path2) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path2}`, { method: "DELETE", headers });
  return { ok: res.ok, status: res.status };
}
async function sbPatch(path2, body) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path2}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body)
  });
  const text2 = await res.text();
  return { ok: res.ok, status: res.status, data: text2 ? JSON.parse(text2) : null };
}
async function webSearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "";
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: true
      })
    });
    if (!res.ok) return "";
    const json2 = await res.json();
    const answer = json2.answer || "";
    const results = (json2.results || []).slice(0, 3).map((r) => `[${r.title}](${r.url})
${r.content?.slice(0, 300)}`).join("\n\n");
    return `\u3010\u8054\u7F51\u641C\u7D22\u7ED3\u679C\u3011
${answer ? `\u6458\u8981\uFF1A${answer}

` : ""}${results}`;
  } catch {
    return "";
  }
}
function needsSearch(text2) {
  const patterns = [
    /今天|今日|现在|最新|最近|当前|实时/,
    /\d{4}年|\d+月\d+日/,
    /新闻|资讯|行情|价格|股价/,
    /搜索|查一下|找一下|帮我查/,
    /latest|current|today|recent|news/i
  ];
  return patterns.some((p) => p.test(text2));
}
var MODEL_MAP = {
  // ── DeepSeek ──────────────────────────────────────────────────────────────
  "deepseek-chat": { provider: "deepseek", apiModel: "deepseek-chat", label: "DeepSeek Chat", maxTokens: 4096 },
  "deepseek-reasoner": { provider: "deepseek", apiModel: "deepseek-reasoner", label: "DeepSeek Reasoner", maxTokens: 8192 },
  // ── Groq（极速）────────────────────────────────────────────────────────────
  "llama-3.3-70b": { provider: "groq", apiModel: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)", maxTokens: 4096 },
  "llama-3.1-8b": { provider: "groq", apiModel: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Groq)", maxTokens: 4096 },
  "gemma2-9b": { provider: "groq", apiModel: "gemma2-9b-it", label: "Gemma2 9B (Groq)", maxTokens: 4096 },
  // ── 智谱 GLM ───────────────────────────────────────────────────────────────
  "glm-4-flash": { provider: "zhipu", apiModel: "glm-4-flash", label: "GLM-4 Flash", maxTokens: 4096 },
  "glm-4-plus": { provider: "zhipu", apiModel: "glm-4-plus", label: "GLM-4 Plus", maxTokens: 4096 },
  "glm-4-air": { provider: "zhipu", apiModel: "glm-4-air", label: "GLM-4 Air", maxTokens: 4096 },
  "glm-z1-flash": { provider: "zhipu", apiModel: "glm-z1-flash", label: "GLM-Z1 Flash", maxTokens: 4096 }
};
var DEFAULT_MODEL = "deepseek-chat";
var ZHIPU_BASE = "https://open.bigmodel.cn/api/paas/v4";
var DEEPSEEK_BASE = "https://api.deepseek.com/v1";
var GROQ_BASE = "https://api.groq.com/openai/v1";
function getProviderConfig(provider) {
  switch (provider) {
    case "deepseek":
      return { base: DEEPSEEK_BASE, key: process.env.DEEPSEEK_API_KEY || "" };
    case "groq":
      return { base: GROQ_BASE, key: process.env.GROQ_API_KEY || "" };
    case "zhipu":
    default:
      return { base: ZHIPU_BASE, key: process.env.ZHIPU_API_KEY || "" };
  }
}
function zhipuHeaders() {
  const key = process.env.ZHIPU_API_KEY || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`
  };
}
chatRouter.get("/models", (_req, res) => {
  const list = Object.entries(MODEL_MAP).map(([id, cfg]) => ({
    id,
    label: cfg.label,
    provider: cfg.provider
  }));
  res.json(list);
});
function getUserId(req) {
  const auth = req.headers["x-user-id"];
  if (auth && typeof auth === "string") return auth;
  const cookie = req.cookies?.["mao-session"];
  if (cookie) return `session:${cookie.slice(0, 32)}`;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "anon";
  return `anon:${ip}`;
}
chatRouter.post("/conversations", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title = "\u65B0\u5BF9\u8BDD", model = "glm-4-flash" } = req.body || {};
    const r = await sbPost(
      "/conversations?select=id,title,model,created_at,updated_at",
      { user_id: userId, title, model },
      "return=representation"
    );
    if (!r.ok) return res.status(500).json({ error: "\u521B\u5EFA\u5BF9\u8BDD\u5931\u8D25" });
    const conv = Array.isArray(r.data) ? r.data[0] : r.data;
    res.json(conv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
chatRouter.get("/conversations", async (req, res) => {
  try {
    const userId = getUserId(req);
    const r = await sbGet(
      `/conversations?user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc&limit=50&select=id,title,model,created_at,updated_at`
    );
    if (!r.ok) return res.status(500).json({ error: "\u83B7\u53D6\u5BF9\u8BDD\u5217\u8868\u5931\u8D25" });
    res.json(r.data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
chatRouter.delete("/conversations/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    await sbDelete(`/conversations?id=eq.${req.params.id}&user_id=eq.${encodeURIComponent(userId)}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
chatRouter.patch("/conversations/:id/title", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "title \u5FC5\u586B" });
    await sbPatch(
      `/conversations?id=eq.${req.params.id}&user_id=eq.${encodeURIComponent(userId)}`,
      { title }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
chatRouter.get("/conversations/:id/messages", async (req, res) => {
  try {
    const r = await sbGet(
      `/messages?conversation_id=eq.${req.params.id}&order=created_at.asc&select=id,role,content,metadata,created_at`
    );
    if (!r.ok) return res.status(500).json({ error: "\u83B7\u53D6\u6D88\u606F\u5931\u8D25" });
    res.json(r.data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
chatRouter.post("/send", async (req, res) => {
  const { conversationId, message, model = DEFAULT_MODEL, useSearch = false } = req.body;
  if (!conversationId || !message) {
    return res.status(400).json({ error: "conversationId \u548C message \u5FC5\u586B" });
  }
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();
  const sendEvent = (event, data) => {
    res.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
  };
  try {
    const historyR = await sbGet(
      `/messages?conversation_id=eq.${conversationId}&order=created_at.asc&limit=20&select=role,content`
    );
    const history = historyR.data || [];
    let searchContext = "";
    if (useSearch || needsSearch(message)) {
      sendEvent("status", { text: "\u6B63\u5728\u8054\u7F51\u641C\u7D22..." });
      searchContext = await webSearch(message);
    }
    await sbPost("/messages", {
      conversation_id: conversationId,
      role: "user",
      content: message,
      metadata: {}
    });
    const systemPrompt = `\u4F60\u662F\u6BDBAI\uFF08MaoAI\uFF09\uFF0C\u4E00\u4E2A\u4EE5\u4E2D\u56FD\u6218\u7565\u601D\u7EF4\u548C\u5168\u7403\u89C6\u91CE\u4E3A\u6838\u5FC3\u7684AI\u52A9\u624B\u3002\u4F60\u64C5\u957F\u6218\u7565\u5206\u6790\u3001\u5546\u4E1A\u6D1E\u5BDF\u548C\u524D\u6CBF\u4FE1\u606F\u6574\u5408\u3002\u8BF7\u7528\u4E2D\u6587\u56DE\u7B54\uFF0C\u4FDD\u6301\u4E13\u4E1A\u3001\u6DF1\u523B\u3001\u6709\u6D1E\u89C1\u3002${searchContext ? `

${searchContext}` : ""}`;
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-18),
      { role: "user", content: message }
    ];
    const modelCfg = MODEL_MAP[model] || MODEL_MAP[DEFAULT_MODEL];
    const { base, key } = getProviderConfig(modelCfg.provider);
    if (!key) {
      sendEvent("error", { text: `${modelCfg.provider.toUpperCase()} API Key \u672A\u914D\u7F6E` });
      return res.end();
    }
    sendEvent("model", { provider: modelCfg.provider, label: modelCfg.label });
    const llmRes = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: modelCfg.apiModel,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: modelCfg.maxTokens
      })
    });
    if (!llmRes.ok || !llmRes.body) {
      const errText = await llmRes.text();
      sendEvent("error", { text: `\u6A21\u578B\u8C03\u7528\u5931\u8D25 [${modelCfg.provider}]: ${errText}` });
      return res.end();
    }
    let fullContent = "";
    const reader = llmRes.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;
        try {
          const json2 = JSON.parse(payload);
          const delta = json2.choices?.[0]?.delta?.content || "";
          if (delta) {
            fullContent += delta;
            sendEvent("delta", { text: delta });
          }
        } catch {
        }
      }
    }
    if (fullContent) {
      await sbPost("/messages", {
        conversation_id: conversationId,
        role: "assistant",
        content: fullContent,
        metadata: searchContext ? { searched: true } : {}
      });
    }
    if (history.length === 0 && fullContent) {
      const titleText = message.slice(0, 30).trim();
      await sbPatch(
        `/conversations?id=eq.${conversationId}`,
        { title: titleText || "\u65B0\u5BF9\u8BDD" }
      );
      sendEvent("title", { text: titleText || "\u65B0\u5BF9\u8BDD" });
    }
    sendEvent("done", { text: "" });
    res.end();
  } catch (e) {
    sendEvent("error", { text: e.message });
    res.end();
  }
});
chatRouter.post("/image-gen", async (req, res) => {
  const { prompt, conversationId } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt \u5FC5\u586B" });
  const apiKey = process.env.ZHIPU_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "ZHIPU_API_KEY \u672A\u914D\u7F6E" });
  try {
    const r = await fetch(`${ZHIPU_BASE}/images/generations`, {
      method: "POST",
      headers: zhipuHeaders(),
      body: JSON.stringify({
        model: "cogview-3-flash",
        prompt
      })
    });
    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: `\u56FE\u7247\u751F\u6210\u5931\u8D25: ${err}` });
    }
    const json2 = await r.json();
    const imageUrl = json2.data?.[0]?.url || "";
    if (conversationId && imageUrl) {
      await sbPost("/messages", {
        conversation_id: conversationId,
        role: "assistant",
        content: `![\u751F\u6210\u56FE\u7247](${imageUrl})`,
        metadata: { type: "image", imageUrl, prompt }
      });
    }
    res.json({ url: imageUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// server/notes.ts
import { Router as Router3 } from "express";
var notesRouter = Router3();
function getSupabaseConfig2() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) throw new Error("SUPABASE_URL \u6216 SUPABASE_SERVICE_KEY \u672A\u914D\u7F6E");
  return { url, key };
}
async function sbFetch2(path2, options = {}, prefer) {
  const { url, key } = getSupabaseConfig2();
  const headers = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...options.headers
  };
  if (prefer) headers["Prefer"] = prefer;
  const res = await globalThis.fetch(`${url}/rest/v1${path2}`, { ...options, headers });
  let data;
  const text2 = await res.text();
  try {
    data = text2 ? JSON.parse(text2) : null;
  } catch {
    data = text2;
  }
  return { ok: res.ok, status: res.status, data };
}
var ADMIN_TOKEN = process.env.NODE_REGISTRATION_TOKEN || "maoai-node-reg-2026-secret-workbuddy";
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : req.query.token;
  if (token === ADMIN_TOKEN) return next();
  const sessionCookie = req.cookies?.session || req.headers["x-session"] || "";
  if (sessionCookie) return next();
  return res.status(401).json({ error: "\u672A\u6388\u6743\uFF0C\u8BF7\u63D0\u4F9B\u7BA1\u7406\u5458 token" });
}
var tableInitialized = false;
async function ensureTable() {
  if (tableInitialized) return;
  const check = await sbFetch2("/notes?limit=1");
  if (check.status !== 404) {
    tableInitialized = true;
    return;
  }
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("[notes] notes \u8868\u4E0D\u5B58\u5728\uFF0C\u4E14\u672A\u914D\u7F6E SUPABASE_ACCESS_TOKEN\uFF0C\u8DF3\u8FC7\u81EA\u52A8\u5EFA\u8868");
    return;
  }
  const { url } = getSupabaseConfig2();
  const projectRef = url.replace("https://", "").split(".")[0];
  const sql = `
    CREATE TABLE IF NOT EXISTS notes (
      id          BIGSERIAL PRIMARY KEY,
      title       TEXT NOT NULL DEFAULT '',
      content     TEXT NOT NULL DEFAULT '',
      tags        TEXT[] NOT NULL DEFAULT '{}',
      is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      color       TEXT DEFAULT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING GIN (tags);
    CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (updated_at DESC);
    CREATE INDEX IF NOT EXISTS notes_is_pinned_idx ON notes (is_pinned);
    CREATE INDEX IF NOT EXISTS notes_is_archived_idx ON notes (is_archived);
    CREATE OR REPLACE FUNCTION update_notes_updated_at()
    RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS notes_updated_at_trigger ON notes;
    CREATE TRIGGER notes_updated_at_trigger BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_notes_updated_at();
  `;
  const r = await globalThis.fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ query: sql })
  });
  if (r.ok) {
    console.log("[notes] notes \u8868\u521B\u5EFA\u6210\u529F");
    tableInitialized = true;
  } else {
    const t2 = await r.text();
    console.error("[notes] \u5EFA\u8868\u5931\u8D25:", t2.slice(0, 200));
  }
}
notesRouter.post("/init", requireAdmin, async (req, res) => {
  tableInitialized = false;
  await ensureTable();
  const check = await sbFetch2("/notes?limit=1");
  if (check.status === 200 || check.status === 206) {
    return res.json({ success: true, message: "notes \u8868\u5DF2\u5C31\u7EEA" });
  }
  return res.status(500).json({ error: "\u5EFA\u8868\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u5728 Supabase SQL \u7F16\u8F91\u5668\u6267\u884C\u5EFA\u8868\u8BED\u53E5" });
});
notesRouter.get("/", requireAdmin, async (req, res) => {
  await ensureTable();
  const { q, tag, archived, pinned, limit = "50", offset = "0" } = req.query;
  let path2 = `/notes?order=is_pinned.desc,updated_at.desc&limit=${limit}&offset=${offset}`;
  if (archived === "true") {
    path2 += "&is_archived=eq.true";
  } else {
    path2 += "&is_archived=eq.false";
  }
  if (pinned === "true") path2 += "&is_pinned=eq.true";
  if (tag) path2 += `&tags=cs.{${encodeURIComponent(tag)}}`;
  const result = await sbFetch2(path2, {
    headers: { "Range-Unit": "items", Range: `${offset}-${parseInt(offset) + parseInt(limit) - 1}` }
  }, "count=exact");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  let data = result.data;
  if (q && Array.isArray(data)) {
    const keyword = q.toLowerCase();
    data = data.filter(
      (n) => n.title?.toLowerCase().includes(keyword) || n.content?.toLowerCase().includes(keyword) || n.tags?.some((t2) => t2.toLowerCase().includes(keyword))
    );
  }
  return res.json({ notes: data || [], total: Array.isArray(data) ? data.length : 0 });
});
notesRouter.post("/", requireAdmin, async (req, res) => {
  await ensureTable();
  const { title = "", content = "", tags = [], color = null } = req.body;
  const result = await sbFetch2("/notes", {
    method: "POST",
    body: JSON.stringify({ title, content, tags, color })
  }, "return=representation");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data;
  return res.status(201).json(rows?.[0] || {});
});
notesRouter.get("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const result = await sbFetch2(`/notes?id=eq.${id}&limit=1`);
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data;
  if (!rows?.length) return res.status(404).json({ error: "\u7B14\u8BB0\u4E0D\u5B58\u5728" });
  return res.json(rows[0]);
});
notesRouter.patch("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, content, tags, color, is_pinned, is_archived } = req.body;
  const patch = {};
  if (title !== void 0) patch.title = title;
  if (content !== void 0) patch.content = content;
  if (tags !== void 0) patch.tags = tags;
  if (color !== void 0) patch.color = color;
  if (is_pinned !== void 0) patch.is_pinned = is_pinned;
  if (is_archived !== void 0) patch.is_archived = is_archived;
  const result = await sbFetch2(`/notes?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  }, "return=representation");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data;
  return res.json(rows?.[0] || {});
});
notesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const result = await sbFetch2(`/notes?id=eq.${id}`, { method: "DELETE" }, "return=minimal");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  return res.status(204).send();
});
notesRouter.get("/tags/all", requireAdmin, async (req, res) => {
  await ensureTable();
  const result = await sbFetch2("/notes?select=tags&is_archived=eq.false&limit=1000");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data;
  const tagSet = /* @__PURE__ */ new Set();
  rows?.forEach((n) => n.tags?.forEach((t2) => tagSet.add(t2)));
  return res.json({ tags: Array.from(tagSet).sort() });
});
notesRouter.patch("/:id/pin", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const current = await sbFetch2(`/notes?id=eq.${id}&select=is_pinned&limit=1`);
  if (!current.ok) return res.status(current.status).json({ error: current.data });
  const rows = current.data;
  if (!rows?.length) return res.status(404).json({ error: "\u7B14\u8BB0\u4E0D\u5B58\u5728" });
  const newPinned = !rows[0].is_pinned;
  const result = await sbFetch2(`/notes?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_pinned: newPinned })
  }, "return=representation");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const updated = result.data;
  return res.json(updated?.[0] || {});
});
notesRouter.patch("/:id/archive", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const current = await sbFetch2(`/notes?id=eq.${id}&select=is_archived&limit=1`);
  if (!current.ok) return res.status(current.status).json({ error: current.data });
  const rows = current.data;
  if (!rows?.length) return res.status(404).json({ error: "\u7B14\u8BB0\u4E0D\u5B58\u5728" });
  const newArchived = !rows[0].is_archived;
  const result = await sbFetch2(`/notes?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_archived: newArchived })
  }, "return=representation");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const updated = result.data;
  return res.json(updated?.[0] || {});
});

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use("/api/ai", aiNodesRouter);
  app.use("/api/notes", notesRouter);
  app.use("/api/chat", chatRouter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
