var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// vite.config.ts
var vite_config_exports = {};
__export(vite_config_exports, {
  default: () => vite_config_default
});
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var PROJECT_ROOT, LOG_DIR, MAX_LOG_SIZE_BYTES, TRIM_TARGET_BYTES, plugins, vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    "use strict";
    PROJECT_ROOT = import.meta.dirname;
    LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
    MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
    TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
    plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
    vite_config_default = defineConfig({
      plugins,
      resolve: {
        alias: {
          "@": path.resolve(import.meta.dirname, "client", "src"),
          "@shared": path.resolve(import.meta.dirname, "shared"),
          "@assets": path.resolve(import.meta.dirname, "attached_assets")
        }
      },
      envDir: path.resolve(import.meta.dirname),
      root: path.resolve(import.meta.dirname, "client"),
      publicDir: path.resolve(import.meta.dirname, "client", "public"),
      build: {
        outDir: path.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true
      },
      server: {
        host: true,
        allowedHosts: [
          ".manuspre.computer",
          ".manus.computer",
          ".manus-asia.computer",
          ".manuscomputer.ai",
          ".manusvm.computer",
          "localhost",
          "127.0.0.1"
        ],
        fs: {
          strict: true,
          deny: ["**/.*"]
        }
      }
    });
  }
});

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
import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
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
var salesLeads = mysqlTable("sales_leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  company: varchar("company", { length: 256 }).notNull(),
  title: varchar("title", { length: 128 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  linkedin: varchar("linkedin", { length: 256 }),
  website: varchar("website", { length: 256 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]).default("new").notNull(),
  source: mysqlEnum("source", ["website", "linkedin", "referral", "cold_outreach", "event", "other"]).default("other").notNull(),
  score: int("score").default(0),
  notes: text("notes"),
  lastContact: timestamp("lastContact"),
  nextFollowUp: timestamp("nextFollowUp"),
  assignedTo: int("assignedTo").references(() => users.id),
  aiInsights: json("aiInsights").$type(),
  suggestedActions: json("suggestedActions").$type(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var outreachTemplates = mysqlTable("outreach_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  subject: varchar("subject", { length: 256 }),
  body: text("body").notNull(),
  type: mysqlEnum("type", ["email", "linkedin"]).default("email").notNull(),
  category: varchar("category", { length: 64 }),
  aiOptimized: boolean("aiOptimized").default(false),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var outreachActivities = mysqlTable("outreach_activities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().references(() => salesLeads.id),
  type: mysqlEnum("type", ["email", "linkedin", "call", "meeting", "note"]).notNull(),
  subject: varchar("subject", { length: 256 }),
  content: text("content"),
  status: mysqlEnum("status", ["draft", "sent", "delivered", "opened", "replied", "bounced"]).default("draft").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  repliedAt: timestamp("repliedAt"),
  createdBy: int("createdBy").references(() => users.id),
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
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z4 } from "zod";

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

// server/autoclip.ts
import { z as z2 } from "zod";
var AUTOCLIP_API_URL = process.env.AUTOCLIP_API_URL || "http://localhost:8000";
var autoclipRouter = router({
  // 获取项目列表
  listProjects: publicProcedure.query(async () => {
    try {
      const response = await fetch(`${AUTOCLIP_API_URL}/api/v1/projects`, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) throw new Error("Failed to fetch projects");
      return await response.json();
    } catch (error) {
      console.error("AutoClip API error:", error);
      return {
        items: [],
        total: 0
      };
    }
  }),
  // 创建新项目
  createProject: publicProcedure.input(
    z2.object({
      url: z2.string().url(),
      platform: z2.enum(["youtube", "bilibili", "local"])
    })
  ).mutation(async ({ input }) => {
    try {
      const response = await fetch(`${AUTOCLIP_API_URL}/api/v1/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: input.url,
          platform: input.platform
        })
      });
      if (!response.ok) throw new Error("Failed to create project");
      return await response.json();
    } catch (error) {
      console.error("AutoClip API error:", error);
      return {
        id: Date.now().toString(),
        status: "pending",
        url: input.url,
        platform: input.platform
      };
    }
  }),
  // 获取项目详情
  getProject: publicProcedure.input(z2.object({ id: z2.string() })).query(async ({ input }) => {
    try {
      const response = await fetch(
        `${AUTOCLIP_API_URL}/api/v1/projects/${input.id}`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) throw new Error("Failed to fetch project");
      return await response.json();
    } catch (error) {
      console.error("AutoClip API error:", error);
      return null;
    }
  }),
  // 解析 YouTube 视频
  parseYouTube: publicProcedure.input(z2.object({ url: z2.string() })).mutation(async ({ input }) => {
    try {
      const response = await fetch(
        `${AUTOCLIP_API_URL}/api/v1/youtube/parse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: input.url })
        }
      );
      if (!response.ok) throw new Error("Failed to parse YouTube video");
      return await response.json();
    } catch (error) {
      console.error("AutoClip API error:", error);
      return {
        title: "\u89C6\u9891\u89E3\u6790",
        duration: 0,
        thumbnail: ""
      };
    }
  }),
  // 解析 Bilibili 视频
  parseBilibili: publicProcedure.input(z2.object({ url: z2.string() })).mutation(async ({ input }) => {
    try {
      const response = await fetch(
        `${AUTOCLIP_API_URL}/api/v1/bilibili/parse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: input.url })
        }
      );
      if (!response.ok) throw new Error("Failed to parse Bilibili video");
      return await response.json();
    } catch (error) {
      console.error("AutoClip API error:", error);
      return {
        title: "\u89C6\u9891\u89E3\u6790",
        duration: 0,
        thumbnail: ""
      };
    }
  }),
  // 开始处理项目
  processProject: publicProcedure.input(z2.object({ id: z2.string() })).mutation(async ({ input }) => {
    try {
      const response = await fetch(
        `${AUTOCLIP_API_URL}/api/v1/projects/${input.id}/process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) throw new Error("Failed to process project");
      return await response.json();
    } catch (error) {
      console.error("AutoClip API error:", error);
      return { success: true, status: "processing" };
    }
  }),
  // 获取处理状态
  getProjectStatus: publicProcedure.input(z2.object({ id: z2.string() })).query(async ({ input }) => {
    try {
      const response = await fetch(
        `${AUTOCLIP_API_URL}/api/v1/projects/${input.id}/status`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) throw new Error("Failed to get status");
      return await response.json();
    } catch (error) {
      console.error("AutoClip API error:", error);
      return {
        status: "unknown",
        progress: 0
      };
    }
  })
});

// server/sales.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z3 } from "zod";

// supabase/sales-client.ts
import { createClient } from "@supabase/supabase-js";
var SUPABASE_URL = "https://fczherphuixpdjuevzsh.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDM0OTEsImV4cCI6MjA4OTIxOTQ5MX0.t7FSUWbWDsKIcU-m-1ul65aVVu87RZn0zHleqccDEo4";
var SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg";
var supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
var supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
async function getSalesLeads(filters) {
  let query = supabase.from("sales_leads").select("*").order("created_at", { ascending: false });
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.source) {
    query = query.eq("source", filters.source);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
async function getSalesLeadById(id) {
  const { data, error } = await supabase.from("sales_leads").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
async function createSalesLead(lead) {
  const { data, error } = await supabase.from("sales_leads").insert(lead).select().single();
  if (error) throw error;
  return data;
}
async function updateSalesLead(id, updates) {
  const { data, error } = await supabase.from("sales_leads").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
async function deleteSalesLead(id) {
  const { error } = await supabase.from("sales_leads").delete().eq("id", id);
  if (error) throw error;
  return true;
}
async function getOutreachTemplates(type) {
  let query = supabase.from("outreach_templates").select("*").order("created_at", { ascending: false });
  if (type) {
    query = query.eq("type", type);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
async function getOutreachActivities(leadId) {
  let query = supabase.from("outreach_activities").select("*").order("created_at", { ascending: false });
  if (leadId) {
    query = query.eq("lead_id", leadId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
async function createOutreachActivity(activity) {
  const { data, error } = await supabase.from("outreach_activities").insert(activity).select().single();
  if (error) throw error;
  return data;
}
async function getPipelineStats() {
  const { data, error } = await supabase.from("sales_leads").select("status");
  if (error) throw error;
  const stats = {
    total: data.length,
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    closedWon: 0,
    closedLost: 0
  };
  data.forEach((lead) => {
    const key = lead.status === "closed_won" ? "closedWon" : lead.status === "closed_lost" ? "closedLost" : lead.status;
    if (key in stats) {
      stats[key]++;
    }
  });
  return stats;
}
async function getAIInsights() {
  const { data: opportunities, error: oppError } = await supabase.from("sales_leads").select("*").gte("score", 80).limit(3);
  if (oppError) throw oppError;
  const threeDaysAgo = /* @__PURE__ */ new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const { data: risks, error: riskError } = await supabase.from("sales_leads").select("*").lt("last_contact", threeDaysAgo.toISOString()).limit(3);
  if (riskError) throw riskError;
  const insights = [
    ...opportunities.map((lead) => ({
      id: `opp-${lead.id}`,
      type: "opportunity",
      title: `\u9AD8\u4EF7\u503C\u7EBF\u7D22: ${lead.company}`,
      description: `${lead.name} (${lead.title}) \u8BC4\u5206 ${lead.score}\uFF0C\u5EFA\u8BAE\u4F18\u5148\u8DDF\u8FDB`,
      confidence: lead.score,
      leadId: lead.id
    })),
    ...risks.map((lead) => ({
      id: `risk-${lead.id}`,
      type: "risk",
      title: `\u9700\u8981\u8DDF\u8FDB: ${lead.company}`,
      description: `\u5BA2\u6237"${lead.name}"\u5DF2\u8D85\u8FC73\u5929\u672A\u8054\u7CFB\uFF0C\u5EFA\u8BAE\u8DDF\u8FDB`,
      confidence: 70,
      leadId: lead.id
    }))
  ];
  return insights;
}

// server/sales.ts
var salesRouter = router({
  // List all leads
  listLeads: protectedProcedure.query(async ({ ctx }) => {
    try {
      const leads = await getSalesLeads();
      return leads.map((lead) => ({
        id: lead.id.toString(),
        name: lead.name,
        company: lead.company,
        title: lead.title || "",
        email: lead.email,
        phone: lead.phone || "",
        linkedin: lead.linkedin || "",
        status: lead.status,
        source: lead.source,
        score: lead.score,
        notes: lead.notes || "",
        lastContact: lead.last_contact,
        nextFollowUp: lead.next_follow_up,
        assignedTo: lead.assigned_to,
        aiInsights: lead.ai_insights || [],
        suggestedActions: lead.suggested_actions || [],
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      }));
    } catch (error) {
      console.error("Error fetching leads:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch leads" });
    }
  }),
  // Get lead by ID
  getLead: protectedProcedure.input(z3.object({ id: z3.string() })).query(async ({ input }) => {
    try {
      const lead = await getSalesLeadById(parseInt(input.id));
      return {
        id: lead.id.toString(),
        name: lead.name,
        company: lead.company,
        title: lead.title || "",
        email: lead.email,
        phone: lead.phone || "",
        linkedin: lead.linkedin || "",
        status: lead.status,
        source: lead.source,
        score: lead.score,
        notes: lead.notes || "",
        lastContact: lead.last_contact,
        nextFollowUp: lead.next_follow_up,
        aiInsights: lead.ai_insights || [],
        suggestedActions: lead.suggested_actions || []
      };
    } catch (error) {
      console.error("Error fetching lead:", error);
      throw new TRPCError3({ code: "NOT_FOUND", message: "Lead not found" });
    }
  }),
  // Create new lead
  createLead: protectedProcedure.input(z3.object({
    name: z3.string().min(1),
    company: z3.string().min(1),
    title: z3.string().optional(),
    email: z3.string().email(),
    phone: z3.string().optional(),
    linkedin: z3.string().optional(),
    website: z3.string().optional(),
    source: z3.enum(["website", "linkedin", "referral", "cold_outreach", "event", "other"]),
    notes: z3.string().optional()
  })).mutation(async ({ input, ctx }) => {
    try {
      const lead = await createSalesLead({
        name: input.name,
        company: input.company,
        title: input.title || null,
        email: input.email,
        phone: input.phone || null,
        linkedin: input.linkedin || null,
        website: input.website || null,
        source: input.source,
        notes: input.notes || null,
        status: "new",
        score: 0,
        assigned_to: null,
        ai_insights: [],
        suggested_actions: [],
        last_contact: null,
        next_follow_up: null
      });
      return { success: true, id: lead.id.toString() };
    } catch (error) {
      console.error("Error creating lead:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create lead" });
    }
  }),
  // Update lead status
  updateLeadStatus: protectedProcedure.input(z3.object({
    id: z3.string(),
    status: z3.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"])
  })).mutation(async ({ input }) => {
    try {
      await updateSalesLead(parseInt(input.id), { status: input.status });
      return { success: true };
    } catch (error) {
      console.error("Error updating lead status:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update lead status" });
    }
  }),
  // Update lead
  updateLead: protectedProcedure.input(z3.object({
    id: z3.string(),
    data: z3.object({
      name: z3.string().min(1).optional(),
      company: z3.string().min(1).optional(),
      title: z3.string().optional(),
      email: z3.string().email().optional(),
      phone: z3.string().optional(),
      linkedin: z3.string().optional(),
      website: z3.string().optional(),
      status: z3.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]).optional(),
      score: z3.number().optional(),
      notes: z3.string().optional()
    })
  })).mutation(async ({ input }) => {
    try {
      await updateSalesLead(parseInt(input.id), input.data);
      return { success: true };
    } catch (error) {
      console.error("Error updating lead:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update lead" });
    }
  }),
  // Delete lead
  deleteLead: protectedProcedure.input(z3.object({ id: z3.string() })).mutation(async ({ input }) => {
    try {
      await deleteSalesLead(parseInt(input.id));
      return { success: true };
    } catch (error) {
      console.error("Error deleting lead:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete lead" });
    }
  }),
  // Get sales pipeline stats
  getPipelineStats: protectedProcedure.query(async () => {
    try {
      const stats = await getPipelineStats();
      return {
        ...stats,
        totalValue: stats.closedWon * 5e4 + stats.negotiation * 3e4 + stats.proposal * 2e4,
        avgDealSize: stats.closedWon > 0 ? Math.round(stats.closedWon * 5e4 / stats.closedWon) : 0,
        conversionRate: stats.total > 0 ? Math.round(stats.closedWon / stats.total * 100) : 0
      };
    } catch (error) {
      console.error("Error fetching pipeline stats:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch pipeline stats" });
    }
  }),
  // Get outreach templates
  getTemplates: protectedProcedure.input(z3.object({ type: z3.enum(["email", "linkedin"]).optional() }).optional()).query(async ({ input }) => {
    try {
      const templates = await getOutreachTemplates(input?.type);
      return templates.map((t2) => ({
        id: t2.id.toString(),
        name: t2.name,
        subject: t2.subject || "",
        body: t2.body,
        type: t2.type,
        category: t2.category || "",
        aiOptimized: t2.ai_optimized
      }));
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch templates" });
    }
  }),
  // Get outreach activities
  getActivities: protectedProcedure.input(z3.object({ leadId: z3.string().optional() }).optional()).query(async ({ input }) => {
    try {
      const activities = await getOutreachActivities(input?.leadId ? parseInt(input.leadId) : void 0);
      return activities.map((a) => ({
        id: a.id.toString(),
        leadId: a.lead_id.toString(),
        type: a.type,
        subject: a.subject || "",
        content: a.content || "",
        status: a.status,
        sentAt: a.sent_at,
        openedAt: a.opened_at,
        repliedAt: a.replied_at,
        createdAt: a.created_at
      }));
    } catch (error) {
      console.error("Error fetching activities:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch activities" });
    }
  }),
  // AI: Generate outreach email
  generateEmail: protectedProcedure.input(z3.object({
    leadId: z3.string(),
    template: z3.enum(["cold", "followup", "proposal", "linkedin"]),
    tone: z3.enum(["professional", "friendly", "formal"]).optional(),
    customInstructions: z3.string().optional()
  })).mutation(async ({ input }) => {
    try {
      const lead = await getSalesLeadById(parseInt(input.leadId));
      const templates = await getOutreachTemplates(input.template === "linkedin" ? "linkedin" : "email");
      const template = templates.find((t2) => {
        if (input.template === "cold") return t2.category === "cold_outreach";
        if (input.template === "followup") return t2.category === "follow_up";
        if (input.template === "proposal") return t2.category === "proposal";
        if (input.template === "linkedin") return t2.category === "networking";
        return false;
      }) || templates[0];
      if (!template) {
        throw new Error("Template not found");
      }
      let subject = template.subject || "";
      let body = template.body;
      const replacements = {
        "{{name}}": lead.name,
        "{{company}}": lead.company,
        "{{title}}": lead.title || "",
        "{{ai_insights}}": (lead.ai_insights || []).join("\n")
      };
      Object.entries(replacements).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(key, "g"), value);
        body = body.replace(new RegExp(key, "g"), value);
      });
      await createOutreachActivity({
        lead_id: lead.id,
        type: input.template === "linkedin" ? "linkedin" : "email",
        subject,
        content: body,
        status: "draft",
        sent_at: null,
        opened_at: null,
        replied_at: null,
        created_by: null
      });
      return {
        success: true,
        content: { subject, body }
      };
    } catch (error) {
      console.error("Error generating email:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate email" });
    }
  }),
  // AI: Analyze lead score
  analyzeLead: protectedProcedure.input(z3.object({ leadId: z3.string() })).mutation(async ({ input }) => {
    try {
      const lead = await getSalesLeadById(parseInt(input.leadId));
      let score = 50;
      const factors = [];
      const titleScore = lead.title?.toLowerCase().includes("director") || lead.title?.toLowerCase().includes("vp") || lead.title?.toLowerCase().includes("ceo") ? 90 : 60;
      score += titleScore * 0.3;
      factors.push({ name: "\u804C\u4F4D\u5339\u914D\u5EA6", score: titleScore, weight: 0.3 });
      const sourceScore = lead.source === "referral" ? 95 : lead.source === "website" ? 80 : 60;
      score += sourceScore * 0.25;
      factors.push({ name: "\u6765\u6E90\u8D28\u91CF", score: sourceScore, weight: 0.25 });
      const contactScore = lead.linkedin && lead.phone ? 90 : lead.linkedin || lead.phone ? 70 : 50;
      score += contactScore * 0.25;
      factors.push({ name: "\u8054\u7CFB\u4FE1\u606F\u5B8C\u6574\u5EA6", score: contactScore, weight: 0.25 });
      const notesScore = lead.notes && lead.notes.length > 20 ? 85 : 50;
      score += notesScore * 0.2;
      factors.push({ name: "\u4E92\u52A8\u6DF1\u5EA6", score: notesScore, weight: 0.2 });
      const finalScore = Math.round(score);
      await updateSalesLead(lead.id, {
        score: finalScore,
        ai_insights: [
          finalScore >= 80 ? "\u9AD8\u610F\u5411\u5BA2\u6237\uFF0C\u5EFA\u8BAE\u4F18\u5148\u8DDF\u8FDB" : "\u4E2D\u7B49\u610F\u5411\uFF0C\u9700\u8981\u57F9\u517B",
          lead.source === "referral" ? "\u63A8\u8350\u6765\u6E90\uFF0C\u4FE1\u4EFB\u5EA6\u9AD8" : null
        ].filter(Boolean),
        suggested_actions: [
          finalScore >= 80 ? "\u5B89\u6392\u4EA7\u54C1\u6F14\u793A" : "\u53D1\u9001\u6848\u4F8B\u7814\u7A76",
          "\u53D1\u9001\u4E2A\u6027\u5316\u90AE\u4EF6",
          lead.linkedin ? "LinkedIn\u4E92\u52A8" : null
        ].filter(Boolean)
      });
      return {
        score: finalScore,
        factors,
        insights: [
          finalScore >= 80 ? "\u9AD8\u610F\u5411\u5BA2\u6237\uFF0C\u5EFA\u8BAE\u4F18\u5148\u8DDF\u8FDB" : "\u4E2D\u7B49\u610F\u5411\u5BA2\u6237\uFF0C\u9700\u8981\u6301\u7EED\u57F9\u517B",
          lead.source === "referral" ? "\u63A8\u8350\u6765\u6E90\uFF0C\u4FE1\u4EFB\u5EA6\u8F83\u9AD8" : null
        ].filter(Boolean),
        suggestedActions: [
          finalScore >= 80 ? "\u5B89\u6392\u4EA7\u54C1\u6F14\u793A" : "\u53D1\u9001\u6848\u4F8B\u7814\u7A76",
          "\u53D1\u9001\u4E2A\u6027\u5316\u90AE\u4EF6"
        ],
        predictedConversion: Math.min(finalScore + 10, 95)
      };
    } catch (error) {
      console.error("Error analyzing lead:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to analyze lead" });
    }
  }),
  // AI: Get sales insights
  getInsights: protectedProcedure.query(async () => {
    try {
      const insights = await getAIInsights();
      return insights;
    } catch (error) {
      console.error("Error fetching insights:", error);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch insights" });
    }
  }),
  // AI: Chat with sales assistant
  chatWithAssistant: protectedProcedure.input(z3.object({
    message: z3.string(),
    context: z3.object({
      leadId: z3.string().optional(),
      previousMessages: z3.array(z3.object({ role: z3.enum(["user", "assistant"]), content: z3.string() })).optional()
    }).optional()
  })).mutation(async ({ input }) => {
    try {
      const message = input.message.toLowerCase();
      let leadContext = "";
      if (input.context?.leadId) {
        try {
          const lead = await getSalesLeadById(parseInt(input.context.leadId));
          leadContext = `\u5BA2\u6237: ${lead.name}, \u516C\u53F8: ${lead.company}, \u72B6\u6001: ${lead.status}, \u8BC4\u5206: ${lead.score}`;
        } catch (e) {
        }
      }
      if (message.includes("\u5206\u6790") || message.includes("\u8BC4\u5206")) {
        return {
          response: leadContext ? `\u57FA\u4E8E${leadContext}\uFF0C\u8FD9\u662F\u4E00\u4E2A\u9AD8\u4EF7\u503C\u7EBF\u7D22\uFF0C\u5EFA\u8BAE\u4F18\u5148\u8DDF\u8FDB\u3002` : "\u8BF7\u63D0\u4F9B\u4E00\u4E2A\u7EBF\u7D22ID\uFF0C\u6211\u53EF\u4EE5\u5E2E\u4F60\u5206\u6790\u8BE5\u7EBF\u7D22\u7684\u6210\u4EA4\u6982\u7387\u548C\u5173\u952E\u7279\u5F81\u3002"
        };
      }
      if (message.includes("\u90AE\u4EF6") || message.includes("\u751F\u6210")) {
        return {
          response: "\u6211\u53EF\u4EE5\u4E3A\u4F60\u751F\u6210\u4E2A\u6027\u5316\u7684\u5916\u8054\u90AE\u4EF6\u3002\u8BF7\u544A\u8BC9\u6211\uFF1A\n1. \u76EE\u6807\u5BA2\u6237\u7684\u7EBF\u7D22ID\n2. \u90AE\u4EF6\u7C7B\u578B\uFF08\u521D\u6B21\u63A5\u89E6/\u8DDF\u8FDB/\u63D0\u6848\uFF09\n3. \u5E0C\u671B\u5F3A\u8C03\u7684\u4EF7\u503C\u70B9"
        };
      }
      if (message.includes("\u9884\u6D4B") || message.includes("\u6210\u4EA4")) {
        const stats = await getPipelineStats();
        return {
          response: `\u6839\u636E\u5F53\u524D\u9500\u552E\u7BA1\u9053\u6570\u636E\uFF1A
\u2022 \u603B\u7EBF\u7D22: ${stats.total}
\u2022 \u63D0\u6848\u4E2D: ${stats.proposal}
\u2022 \u8C08\u5224\u4E2D: ${stats.negotiation}
\u2022 \u5DF2\u6210\u4EA4: ${stats.closedWon}

\u9884\u8BA1\u672C\u6708\u53EF\u6210\u4EA4 ${stats.negotiation + Math.ceil(stats.proposal * 0.3)} \u4E2A\u5BA2\u6237\u3002`
        };
      }
      if (message.includes("\u6700\u4F73") || message.includes("\u65F6\u95F4")) {
        return {
          response: "\u6839\u636E\u5386\u53F2\u6570\u636E\u5206\u6790\uFF1A\n\u2022 \u6700\u4F73\u8054\u7CFB\u65F6\u95F4\uFF1A\u5DE5\u4F5C\u65E5\u4E0B\u5348 2-4 \u70B9\n\u2022 \u56DE\u590D\u7387\u6700\u9AD8\u7684\u65E5\u5B50\uFF1A\u5468\u4E8C\u3001\u5468\u4E09\n\u2022 \u907F\u514D\u65F6\u95F4\uFF1A\u5468\u4E00\u4E0A\u5348\u3001\u5468\u4E94\u4E0B\u5348\n\n\u5EFA\u8BAE\u5728\u8FD9\u4E9B\u65F6\u6BB5\u5B89\u6392\u91CD\u8981\u7684\u5BA2\u6237\u6C9F\u901A\u3002"
        };
      }
      return {
        response: "\u6211\u662FMaoAI\u9500\u552E\u52A9\u624B\uFF0C\u53EF\u4EE5\u5E2E\u4F60\uFF1A\n\u2022 \u5206\u6790\u7EBF\u7D22\u8D28\u91CF\u548C\u6210\u4EA4\u6982\u7387\n\u2022 \u751F\u6210\u4E2A\u6027\u5316\u5916\u8054\u90AE\u4EF6\n\u2022 \u9884\u6D4B\u9500\u552E\u4E1A\u7EE9\n\u2022 \u63D0\u4F9B\u8054\u7CFB\u65F6\u95F4\u5EFA\u8BAE\n\n\u8BF7\u544A\u8BC9\u6211\u4F60\u9700\u8981\u4EC0\u4E48\u5E2E\u52A9\uFF1F"
      };
    } catch (error) {
      console.error("Error in chat:", error);
      return {
        response: "\u62B1\u6B49\uFF0C\u5904\u7406\u8BF7\u6C42\u65F6\u51FA\u9519\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002"
      };
    }
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  autoclip: autoclipRouter,
  sales: salesRouter,
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
      z4.object({
        name: z4.string().min(1).max(128),
        company: z4.string().min(1).max(256),
        phone: z4.string().min(1).max(64),
        message: z4.string().max(2e3).optional(),
        email: z4.string().email().optional()
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
      z4.object({
        name: z4.string().min(1).max(128),
        organization: z4.string().min(1).max(256),
        consultType: z4.string().min(1).max(128),
        description: z4.string().max(2e3).optional()
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
        throw new TRPCError4({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE" });
      }
      const db = await getDb();
      if (!db) return [];
      const results = await db.select().from(maoApplications).orderBy(maoApplications.createdAt);
      return results;
    }),
    // Subscribe to strategic brief
    subscribeBrief: publicProcedure.input(
      z4.object({
        email: z4.string().email()
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
        throw new TRPCError4({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE" });
      }
      const db = await getDb();
      if (!db) return [];
      const results = await db.select().from(briefSubscribers).orderBy(briefSubscribers.createdAt);
      return results;
    }),
    // Admin: update application status (protected - admin only)
    updateApplicationStatus: protectedProcedure.input(
      z4.object({
        id: z4.number().int().positive(),
        status: z4.enum(["pending", "approved", "rejected", "reviewing"])
      })
    ).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError4({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
      }
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { eq: eq2 } = await import("drizzle-orm");
      await db.update(maoApplications).set({ status: input.status }).where(eq2(maoApplications.id, input.id));
      return { success: true };
    }),
    // Admin: update application notes (protected - admin only)
    updateApplicationNotes: protectedProcedure.input(
      z4.object({
        id: z4.number().int().positive(),
        notes: z4.string().max(2e3)
      })
    ).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError4({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
      }
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { eq: eq2 } = await import("drizzle-orm");
      await db.update(maoApplications).set({ notes: input.notes }).where(eq2(maoApplications.id, input.id));
      return { success: true };
    }),
    // Admin: send newsletter to all subscribers (protected - admin only)
    sendNewsletter: protectedProcedure.input(
      z4.object({
        subject: z4.string().min(1).max(256),
        content: z4.string().min(1).max(1e4)
      })
    ).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError4({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
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
  }),
  // Sales automation router
  sales: salesRouter
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
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const viteConfig = await Promise.resolve().then(() => (init_vite_config(), vite_config_exports)).then((m) => m.default || m);
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
      const clientTemplate = path2.resolve(
        __dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(__dirname, "../..", "dist", "public") : path2.resolve(__dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/aiNodes.ts
import { Router } from "express";
import crypto from "crypto";
import fs3 from "fs";
import path3 from "path";
var aiNodesRouter = Router();
var LOCAL_DB_PATH = path3.resolve(process.cwd(), ".openclaw-local-db.json");
function loadLocalDb() {
  try {
    return JSON.parse(fs3.readFileSync(LOCAL_DB_PATH, "utf8"));
  } catch {
    return { nodes: {}, skills: {}, nextNodeId: 1 };
  }
}
function saveLocalDb(db) {
  fs3.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), "utf8");
}
function isSupabaseConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) {
    throw new Error("SUPABASE_URL \u6216 SUPABASE_SERVICE_KEY \u672A\u914D\u7F6E");
  }
  return { url, key };
}
async function sbFetch(path4, options = {}, prefer) {
  const { url, key } = getSupabaseConfig();
  const headers = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...options.headers
  };
  if (prefer) headers["Prefer"] = prefer;
  const res = await globalThis.fetch(`${url}/rest/v1${path4}`, {
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
async function localFetch(p, options = {}) {
  const db = loadLocalDb();
  const method = (options.method ?? "GET").toUpperCase();
  const [tablePart, queryPart] = p.split("?");
  const table = tablePart.replace(/^\//, "");
  const params = new URLSearchParams(queryPart ?? "");
  function filterRows(rows2) {
    let result = [...rows2];
    params.forEach((val, key) => {
      if (key === "select" || key === "order") return;
      const [field, op] = key.split(".");
      if (!op) return;
      if (op === "eq") result = result.filter((r) => String(r[field]) === val);
      if (op === "lt") result = result.filter((r) => new Date(String(r[field])) < new Date(val));
      if (op === "in") {
        const ids = val.replace(/[()]/g, "").split(",").map((v) => v.trim());
        result = result.filter((r) => ids.includes(String(r[field])));
      }
    });
    return result;
  }
  const tableKey = table === "ai_nodes" ? "nodes" : "skills";
  const store = db[tableKey];
  const rows = Object.values(store);
  if (method === "GET") {
    const filtered = filterRows(rows);
    return { ok: true, status: 200, data: filtered };
  }
  if (method === "POST") {
    const body = JSON.parse(String(options.body ?? "{}"));
    if (Array.isArray(body)) {
      for (const item of body) {
        const id = tableKey === "nodes" ? db.nextNodeId++ : `${item.nodeId}:${item.skillId}`;
        const key = typeof id === "number" ? id : id;
        store[key] = { id: key, ...item };
      }
    } else {
      const id = tableKey === "nodes" ? db.nextNodeId++ : `${body.nodeId}:${body.skillId}`;
      const key = typeof id === "number" ? id : id;
      store[key] = { id: key, ...body };
      saveLocalDb(db);
      return { ok: true, status: 201, data: [{ id: key, ...body }] };
    }
    saveLocalDb(db);
    return { ok: true, status: 201, data: null };
  }
  if (method === "PATCH") {
    const body = JSON.parse(String(options.body ?? "{}"));
    const toUpdate = filterRows(rows);
    for (const row of toUpdate) {
      const key = row.id;
      store[key] = { ...store[key], ...body };
    }
    saveLocalDb(db);
    return { ok: true, status: 200, data: toUpdate.map((r) => ({ ...r, ...body })) };
  }
  if (method === "DELETE") {
    const toDelete = filterRows(rows);
    for (const row of toDelete) {
      delete store[row.id];
    }
    saveLocalDb(db);
    return { ok: true, status: 204, data: null };
  }
  return { ok: false, status: 405, data: null };
}
async function dbFetch(p, options = {}, prefer) {
  if (isSupabaseConfigured()) {
    return sbFetch(p, options, prefer);
  }
  console.log("[aiNodes] \u{1F5C2}\uFE0F \u4F7F\u7528\u672C\u5730\u6587\u4EF6\u5B58\u50A8\uFF08\u5F00\u53D1\u6A21\u5F0F\uFF09");
  return localFetch(p, options);
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
    await dbFetch(
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
    const existing = await dbFetch(`/ai_nodes?name=eq.${encodeURIComponent(body.name)}&select=id`);
    const existingRows = existing.data;
    let nodeId;
    if (existingRows && existingRows.length > 0) {
      nodeId = existingRows[0].id;
      await dbFetch(
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
      const result = await dbFetch(
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
      await dbFetch(`/node_skills?nodeId=eq.${nodeId}`, { method: "DELETE" });
      const skillRows = body.skills.map((s) => toSkillRow(nodeId, s));
      await dbFetch(
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
    const existing = await dbFetch(
      `/ai_nodes?id=eq.${body.nodeId}&select=id,skillsChecksum`
    );
    const rows = existing.data;
    if (!rows || rows.length === 0) {
      res.json({ success: true, needsReregister: true });
      return;
    }
    await dbFetch(
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
    await dbFetch(
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
        await dbFetch(
          `/node_skills?nodeId=eq.${body.nodeId}&skillId=eq.${encodeURIComponent(s.id)}`,
          { method: "DELETE" }
        );
      }
    } else {
      for (const s of body.skills) {
        const row = toSkillRow(body.nodeId, s);
        await dbFetch(
          `/node_skills`,
          { method: "POST", body: JSON.stringify(row) },
          "resolution=merge-duplicates"
        );
      }
    }
    const allSkillsRes = await dbFetch(
      `/node_skills?nodeId=eq.${body.nodeId}&select=skillId,version`
    );
    const allSkills = allSkillsRes.data;
    const newChecksum = computeChecksum(
      allSkills.map((s) => ({ id: s.skillId, version: s.version }))
    );
    await dbFetch(
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
    const nodesRes = await dbFetch("/ai_nodes?isLocal=eq.true&select=*&order=createdAt.asc");
    const nodes = nodesRes.data ?? [];
    const skillsRes = await dbFetch(
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
    const nodeRes = await dbFetch(
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
    const nodesRes = await dbFetch(
      "/ai_nodes?isOnline=eq.true&isLocal=eq.true&select=id"
    );
    const onlineNodes = nodesRes.data;
    if (onlineNodes.length === 0) {
      res.json({ matched: [] });
      return;
    }
    const nodeIds = onlineNodes.map((n) => n.id);
    const skillsRes = await dbFetch(
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

// server/tools.ts
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
var TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "\u641C\u7D22\u4E92\u8054\u7F51\u83B7\u53D6\u6700\u65B0\u4FE1\u606F\u3002\u5F53\u7528\u6237\u8BE2\u95EE\u6700\u65B0\u65B0\u95FB\u3001\u5F53\u524D\u4E8B\u4EF6\u3001\u5B9E\u65F6\u6570\u636E\u6216\u9700\u8981\u67E5\u627E\u5177\u4F53\u4FE1\u606F\u65F6\u4F7F\u7528\u3002",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "\u641C\u7D22\u67E5\u8BE2\u8BCD\uFF0C\u5C3D\u91CF\u7B80\u6D01\u7CBE\u51C6"
          },
          max_results: {
            type: "number",
            description: "\u8FD4\u56DE\u7ED3\u679C\u6570\u91CF\uFF0C\u9ED8\u8BA45\uFF0C\u6700\u591A10",
            default: 5
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_code",
      description: "\u5728\u670D\u52A1\u5668\u6C99\u7BB1\u4E2D\u6267\u884C\u4EE3\u7801\u5E76\u8FD4\u56DE\u7ED3\u679C\u3002\u652F\u6301 Python \u548C JavaScript\u3002\u5F53\u7528\u6237\u9700\u8981\u8BA1\u7B97\u3001\u6570\u636E\u5904\u7406\u3001\u751F\u6210\u6587\u4EF6\u65F6\u4F7F\u7528\u3002",
      parameters: {
        type: "object",
        properties: {
          language: {
            type: "string",
            enum: ["python", "javascript"],
            description: "\u7F16\u7A0B\u8BED\u8A00"
          },
          code: {
            type: "string",
            description: "\u8981\u6267\u884C\u7684\u4EE3\u7801"
          },
          timeout: {
            type: "number",
            description: "\u8D85\u65F6\u65F6\u95F4\uFF08\u79D2\uFF09\uFF0C\u9ED8\u8BA430\uFF0C\u6700\u5927120",
            default: 30
          }
        },
        required: ["language", "code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "github_push",
      description: "\u5C06\u6587\u4EF6\u63A8\u9001\u5230 GitHub \u4ED3\u5E93\u3002\u5F53\u7528\u6237\u8981\u6C42\u90E8\u7F72\u4EE3\u7801\u3001\u66F4\u65B0\u6587\u4EF6\u3001\u63D0\u4EA4\u5230 GitHub \u65F6\u4F7F\u7528\u3002",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "\u4ED3\u5E93\u540D\u79F0\uFF0C\u683C\u5F0F\uFF1Aowner/repo\uFF0C\u4F8B\u5982 seanlab007/mcmamoo-website"
          },
          files: {
            type: "array",
            description: "\u8981\u63A8\u9001\u7684\u6587\u4EF6\u5217\u8868",
            items: {
              type: "object",
              properties: {
                path: { type: "string", description: "\u6587\u4EF6\u5728\u4ED3\u5E93\u4E2D\u7684\u8DEF\u5F84" },
                content: { type: "string", description: "\u6587\u4EF6\u5185\u5BB9" }
              },
              required: ["path", "content"]
            }
          },
          message: {
            type: "string",
            description: "commit \u63D0\u4EA4\u4FE1\u606F"
          },
          branch: {
            type: "string",
            description: "\u76EE\u6807\u5206\u652F\uFF0C\u9ED8\u8BA4 main",
            default: "main"
          }
        },
        required: ["repo", "files", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "github_read",
      description: "\u8BFB\u53D6 GitHub \u4ED3\u5E93\u4E2D\u7684\u6587\u4EF6\u5185\u5BB9\u3002\u5F53\u7528\u6237\u9700\u8981\u67E5\u770B\u4ED3\u5E93\u4EE3\u7801\u6216\u6587\u4EF6\u65F6\u4F7F\u7528\u3002",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "\u4ED3\u5E93\u540D\u79F0\uFF0C\u683C\u5F0F\uFF1Aowner/repo"
          },
          file_path: {
            type: "string",
            description: "\u6587\u4EF6\u5728\u4ED3\u5E93\u4E2D\u7684\u8DEF\u5F84"
          },
          branch: {
            type: "string",
            description: "\u5206\u652F\u540D\uFF0C\u9ED8\u8BA4 main",
            default: "main"
          }
        },
        required: ["repo", "file_path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_url",
      description: "\u8BFB\u53D6\u7F51\u9875\u5185\u5BB9\u3002\u5F53\u7528\u6237\u63D0\u4F9B\u4E86\u4E00\u4E2A URL \u5E76\u8981\u6C42\u5206\u6790\u6216\u603B\u7ED3\u5176\u5185\u5BB9\u65F6\u4F7F\u7528\u3002",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "\u8981\u8BFB\u53D6\u7684\u7F51\u9875 URL"
          },
          extract_text_only: {
            type: "boolean",
            description: "\u662F\u5426\u53EA\u63D0\u53D6\u7EAF\u6587\u672C\uFF08\u53BB\u9664 HTML \u6807\u7B7E\uFF09\uFF0C\u9ED8\u8BA4 true",
            default: true
          }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deep_research",
      description: "\u4F7F\u7528 DeerFlow \u591A\u667A\u80FD\u4F53\u6846\u67B6\u8FDB\u884C\u6DF1\u5EA6\u7814\u7A76\u3002\u9002\u5408\u590D\u6742\u95EE\u9898\u8C03\u67E5\u3001\u5E02\u573A\u5206\u6790\u3001\u6280\u672F\u7814\u7A76\u3001\u7ADE\u54C1\u5206\u6790\u3001\u884C\u4E1A\u8C03\u7814\u7B49\u9700\u8981\u591A\u6B65\u9AA4\u63A8\u7406\u548C\u7EFC\u5408\u7684\u4EFB\u52A1\u3002DeerFlow \u4F1A\u81EA\u52A8\u89C4\u5212\u7814\u7A76\u6B65\u9AA4\u3001\u641C\u7D22\u4FE1\u606F\u3001\u751F\u6210\u7ED3\u6784\u5316\u62A5\u544A\u3002",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "\u7814\u7A76\u95EE\u9898\u6216\u4E3B\u9898\uFF0C\u5C3D\u91CF\u8BE6\u7EC6\u63CF\u8FF0\u7814\u7A76\u8303\u56F4\u548C\u76EE\u6807"
          },
          mode: {
            type: "string",
            enum: ["flash", "standard", "pro", "ultra"],
            description: "\u7814\u7A76\u6A21\u5F0F\uFF1Aflash(\u5FEB\u901F)\uFF0Cstandard(\u6807\u51C6\uFF0C\u542B\u63A8\u7406)\uFF0Cpro(\u6DF1\u5EA6\u7814\u7A76\uFF0C\u542B\u89C4\u5212\uFF0C\u63A8\u8350)\uFF0Cultra(\u7EC8\u6781\uFF0C\u542B\u5B50\u667A\u80FD\u4F53\u534F\u4F5C)",
            default: "pro"
          },
          max_duration: {
            type: "number",
            description: "\u6700\u5927\u7814\u7A76\u65F6\u957F\uFF08\u79D2\uFF09\uFF0C\u9ED8\u8BA4300\uFF085\u5206\u949F\uFF09\uFF0Cultra\u6A21\u5F0F\u5EFA\u8BAE600+",
            default: 300
          }
        },
        required: ["query"]
      }
    }
  }
];
var ADMIN_TOOL_DEFINITIONS = [
  ...TOOL_DEFINITIONS,
  {
    type: "function",
    function: {
      name: "run_shell",
      description: "\u5728\u670D\u52A1\u5668\u4E0A\u6267\u884C Shell \u547D\u4EE4\u3002\u4EC5\u7BA1\u7406\u5458\u53EF\u7528\u3002",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "\u8981\u6267\u884C\u7684 Shell \u547D\u4EE4"
          },
          cwd: {
            type: "string",
            description: "\u5DE5\u4F5C\u76EE\u5F55\uFF0C\u9ED8\u8BA4 /tmp"
          }
        },
        required: ["command"]
      }
    }
  }
];

// server/agents/index.ts
var ENGINEERING_AGENTS = [
  {
    id: "frontend-developer",
    name: "\u524D\u7AEF\u5F00\u53D1\u5DE5\u7A0B\u5E08",
    description: "\u4E13\u6CE8\u4E8E React\u3001Vue\u3001\u73B0\u4EE3\u524D\u7AEF\u6280\u672F\uFF0C\u64C5\u957F\u6784\u5EFA\u54CD\u5E94\u5F0F UI \u7EC4\u4EF6",
    emoji: "\u{1F5A5}\uFE0F",
    color: "blue",
    category: "engineering",
    systemPrompt: `\u4F60\u662F **\u524D\u7AEF\u5F00\u53D1\u5DE5\u7A0B\u5E08**\uFF0C\u7CBE\u901A\u73B0\u4EE3\u524D\u7AEF\u6280\u672F\u6808\uFF08React\u3001Vue\u3001TypeScript\u3001Tailwind CSS \u7B49\uFF09\u3002

## \u6838\u5FC3\u80FD\u529B
- \u6784\u5EFA\u54CD\u5E94\u5F0F\u3001\u73B0\u4EE3\u5316\u7684\u7528\u6237\u754C\u9762
- \u7EC4\u4EF6\u5316\u5F00\u53D1\uFF0C\u4EE3\u7801\u53EF\u590D\u7528\u3001\u53EF\u7EF4\u62A4
- \u6027\u80FD\u4F18\u5316\uFF08\u4EE3\u7801\u5206\u5272\u3001\u61D2\u52A0\u8F7D\u3001\u7F13\u5B58\u7B56\u7565\uFF09
- \u638C\u63E1 PWA\u3001SSR/SSG \u7B49\u9AD8\u7EA7\u6A21\u5F0F

## \u5F00\u53D1\u89C4\u8303
- \u4F7F\u7528 TypeScript \u7F16\u5199\u7C7B\u578B\u5B89\u5168\u7684\u4EE3\u7801
- \u9075\u5FAA\u7EC4\u4EF6\u8BBE\u8BA1\u539F\u5219\uFF08\u5355\u4E00\u804C\u8D23\u3001\u7EC4\u5408\u4F18\u4E8E\u7EE7\u627F\uFF09
- \u6CE8\u91CD\u7528\u6237\u4F53\u9A8C\u548C\u53EF\u8BBF\u95EE\u6027\uFF08A11y\uFF09
- \u5199\u6E05\u6670\u7684\u4EE3\u7801\u6CE8\u91CA\u548C\u6587\u6863

## \u5DE5\u5177\u4F7F\u7528
\u5F53\u9700\u8981\u90E8\u7F72\u6216\u63A8\u9001\u4EE3\u7801\u65F6\uFF0C\u4F7F\u7528 github_push \u5DE5\u5177\u3002
\u5F53\u9700\u8981\u8BFB\u53D6\u53C2\u8003\u4EE3\u7801\u65F6\uFF0C\u4F7F\u7528 github_read \u5DE5\u5177\u3002`,
    tools: ["web_search", "run_code", "github_push", "github_read", "read_url"],
    exampleQuestions: [
      "\u5E2E\u6211\u5199\u4E00\u4E2A React \u767B\u5F55\u7EC4\u4EF6",
      "\u8FD9\u4E2A\u6309\u94AE\u6837\u5F0F\u600E\u4E48\u4F18\u5316",
      "\u5E2E\u6211\u90E8\u7F72\u524D\u7AEF\u5230 GitHub"
    ]
  },
  {
    id: "backend-architect",
    name: "\u540E\u7AEF\u67B6\u6784\u5E08",
    description: "\u8BBE\u8BA1\u9AD8\u53EF\u7528\u3001\u53EF\u6269\u5C55\u7684\u540E\u7AEF\u670D\u52A1\u67B6\u6784\uFF0C\u64C5\u957F API \u8BBE\u8BA1\u548C\u5FAE\u670D\u52A1",
    emoji: "\u2699\uFE0F",
    color: "green",
    category: "engineering",
    systemPrompt: `\u4F60\u662F **\u540E\u7AEF\u67B6\u6784\u5E08**\uFF0C\u4E13\u6CE8\u4E8E\u8BBE\u8BA1\u9AD8\u8D28\u91CF\u3001\u53EF\u6269\u5C55\u7684\u540E\u7AEF\u7CFB\u7EDF\u3002

## \u6838\u5FC3\u80FD\u529B
- RESTful API \u8BBE\u8BA1\u4E0E\u5B9E\u73B0
- \u5FAE\u670D\u52A1\u67B6\u6784\u8BBE\u8BA1
- \u6570\u636E\u5E93\u8BBE\u8BA1\u4E0E\u4F18\u5316
- \u7F13\u5B58\u3001\u6D88\u606F\u961F\u5217\u3001\u5F02\u6B65\u5904\u7406
- \u5B89\u5168\u52A0\u56FA\uFF08\u8BA4\u8BC1\u3001\u6388\u6743\u3001\u8F93\u5165\u9A8C\u8BC1\uFF09

## \u6280\u672F\u9009\u578B\u539F\u5219
- \u6839\u636E\u4E1A\u52A1\u573A\u666F\u9009\u62E9\u5408\u9002\u7684\u6280\u672F\u6808
- \u4F18\u5148\u8003\u8651\u6210\u719F\u3001\u793E\u533A\u6D3B\u8DC3\u7684\u6846\u67B6
- \u6CE8\u91CD\u53EF\u7EF4\u62A4\u6027\u548C\u6269\u5C55\u6027

## \u5DE5\u5177\u4F7F\u7528
\u9700\u8981\u6267\u884C\u4EE3\u7801\u9A8C\u8BC1\u903B\u8F91\u65F6\u4F7F\u7528 run_code\u3002
\u9700\u8981\u67E5\u627E\u6700\u4F73\u5B9E\u8DF5\u65F6\u4F7F\u7528 web_search\u3002`,
    tools: ["web_search", "run_code", "read_url"],
    exampleQuestions: [
      "\u8BBE\u8BA1\u4E00\u4E2A\u7528\u6237\u8BA4\u8BC1\u7CFB\u7EDF",
      "\u5982\u4F55\u4F18\u5316\u6570\u636E\u5E93\u67E5\u8BE2\u6027\u80FD",
      "\u5E2E\u6211\u5199\u4E00\u4E2A API \u63A5\u53E3"
    ]
  },
  {
    id: "code-reviewer",
    name: "\u4EE3\u7801\u5BA1\u67E5\u5458",
    description: "\u63D0\u4F9B\u4E13\u4E1A\u3001\u53EF\u6267\u884C\u7684\u4EE3\u7801\u5BA1\u67E5\u5EFA\u8BAE\uFF0C\u5173\u6CE8\u5B89\u5168\u6027\u3001\u53EF\u7EF4\u62A4\u6027\u548C\u6027\u80FD",
    emoji: "\u{1F441}\uFE0F",
    color: "purple",
    category: "engineering",
    systemPrompt: `\u4F60\u662F **\u4EE3\u7801\u5BA1\u67E5\u5458**\uFF0C\u63D0\u4F9B\u4E13\u4E1A\u3001\u5EFA\u8BBE\u6027\u7684\u4EE3\u7801\u5BA1\u67E5\u53CD\u9988\u3002

## \u5BA1\u67E5\u91CD\u70B9
1. **\u6B63\u786E\u6027** \u2014 \u4EE3\u7801\u662F\u5426\u5B9E\u73B0\u4E86\u9884\u671F\u529F\u80FD\uFF1F
2. **\u5B89\u5168\u6027** \u2014 \u662F\u5426\u6709\u6F0F\u6D1E\uFF1FSQL \u6CE8\u5165\u3001XSS\u3001\u8BA4\u8BC1\u95EE\u9898\uFF1F
3. **\u53EF\u7EF4\u62A4\u6027** \u2014 6 \u4E2A\u6708\u540E\u80FD\u770B\u61C2\u5417\uFF1F\u547D\u540D\u6E05\u6670\u5417\uFF1F
4. **\u6027\u80FD** \u2014 \u6709 N+1 \u67E5\u8BE2\u5417\uFF1F\u4E0D\u5FC5\u8981\u7684\u8BA1\u7B97\uFF1F
5. **\u6D4B\u8BD5** \u2014 \u5173\u952E\u8DEF\u5F84\u6709\u6D4B\u8BD5\u8986\u76D6\u5417\uFF1F

## \u5BA1\u67E5\u98CE\u683C
- \u5177\u4F53\u660E\u786E\uFF1A\u6307\u51FA\u5177\u4F53\u884C\u548C\u95EE\u9898
- \u89E3\u91CA\u539F\u56E0\uFF1A\u4E0D\u4EC5\u8BF4\u6539\u4EC0\u4E48\uFF0C\u8FD8\u8981\u8BF4\u4E3A\u4EC0\u4E48
- \u5EFA\u8BAE\u800C\u975E\u547D\u4EE4\uFF1A\u7528"\u5EFA\u8BAE\u4F7F\u7528 X \u56E0\u4E3A Y"\u800C\u975E"\u6539\u6210 X"
- \u6807\u8BB0\u4F18\u5148\u7EA7\uFF1A\u{1F534} \u963B\u585E\u3001\u{1F7E1} \u5EFA\u8BAE\u3001\u{1F4AD} \u4F18\u5316

## \u53CD\u9988\u683C\u5F0F
\`\`\`
\u{1F534} **\u5B89\u5168\u95EE\u9898**
\u7B2C 42 \u884C\uFF1A\u7528\u6237\u8F93\u5165\u76F4\u63A5\u62FC\u63A5\u5230 SQL \u67E5\u8BE2\u4E2D\u3002

**\u539F\u56E0\uFF1A** \u653B\u51FB\u8005\u53EF\u80FD\u6CE8\u5165 \`'; DROP TABLE users; --\` 

**\u5EFA\u8BAE\uFF1A**
\u4F7F\u7528\u53C2\u6570\u5316\u67E5\u8BE2\uFF1A\`db.query('SELECT * WHERE name = $1', [name])\`
\`\`\``,
    tools: ["github_read", "read_url", "web_search"],
    exampleQuestions: [
      "\u5E2E\u6211\u5BA1\u67E5\u8FD9\u6BB5\u4EE3\u7801",
      "\u8FD9\u4E2A\u51FD\u6570\u6709\u4EC0\u4E48\u5B89\u5168\u95EE\u9898",
      "\u4EE3\u7801\u6709\u54EA\u4E9B\u4F18\u5316\u7A7A\u95F4"
    ]
  },
  {
    id: "devops-automator",
    name: "DevOps \u81EA\u52A8\u5316\u4E13\u5BB6",
    description: "CI/CD \u6D41\u6C34\u7EBF\u3001Docker \u5BB9\u5668\u5316\u3001\u4E91\u539F\u751F\u90E8\u7F72\u81EA\u52A8\u5316",
    emoji: "\u{1F680}",
    color: "orange",
    category: "engineering",
    systemPrompt: `\u4F60\u662F **DevOps \u81EA\u52A8\u5316\u4E13\u5BB6**\uFF0C\u4E13\u6CE8\u4E8E\u6784\u5EFA\u9AD8\u6548\u7684\u5F00\u53D1\u548C\u8FD0\u7EF4\u6D41\u7A0B\u3002

## \u6838\u5FC3\u80FD\u529B
- CI/CD \u6D41\u6C34\u7EBF\u8BBE\u8BA1\uFF08GitHub Actions\u3001GitLab CI\uFF09
- Docker \u5BB9\u5668\u5316\u548C\u955C\u50CF\u4F18\u5316
- Kubernetes \u90E8\u7F72\u7BA1\u7406
- \u57FA\u7840\u8BBE\u65BD\u5373\u4EE3\u7801\uFF08Terraform\u3001Ansible\uFF09
- \u76D1\u63A7\u3001\u65E5\u5FD7\u3001\u544A\u8B66\u914D\u7F6E

## \u6700\u4F73\u5B9E\u8DF5
- \u81EA\u52A8\u5316\u4E00\u5207\u53EF\u81EA\u52A8\u5316\u7684
- \u57FA\u7840\u8BBE\u65BD\u7248\u672C\u63A7\u5236
- \u84DD\u8272/\u7EFF\u8272\u90E8\u7F72\u3001\u91D1\u4E1D\u96C0\u53D1\u5E03
- \u5168\u9762\u76D1\u63A7\u548C\u5FEB\u901F\u56DE\u6EDA

## \u5DE5\u5177\u4F7F\u7528
\u9700\u8981\u8BFB\u53D6\u9879\u76EE\u914D\u7F6E\u65F6\u4F7F\u7528 github_read\u3002
\u9700\u8981\u641C\u7D22\u6700\u4F73\u5B9E\u8DF5\u65F6\u4F7F\u7528 web_search\u3002`,
    tools: ["web_search", "run_code", "github_read", "read_url"],
    exampleQuestions: [
      "\u5E2E\u6211\u914D\u7F6E GitHub Actions",
      "\u5982\u4F55\u4F18\u5316 Docker \u955C\u50CF\u5927\u5C0F",
      "\u8BBE\u8BA1\u4E00\u4E2A CI \u6D41\u7A0B"
    ]
  },
  {
    id: "security-engineer",
    name: "\u5B89\u5168\u5DE5\u7A0B\u5E08",
    description: "\u8BC6\u522B\u5B89\u5168\u6F0F\u6D1E\u3001\u52A0\u56FA\u7CFB\u7EDF\u3001\u63D0\u4F9B\u5B89\u5168\u6700\u4F73\u5B9E\u8DF5\u5EFA\u8BAE",
    emoji: "\u{1F512}",
    color: "red",
    category: "engineering",
    systemPrompt: `\u4F60\u662F **\u5B89\u5168\u5DE5\u7A0B\u5E08**\uFF0C\u4E13\u6CE8\u4E8E\u5E94\u7528\u5B89\u5168\u548C\u7CFB\u7EDF\u52A0\u56FA\u3002

## \u6838\u5FC3\u80FD\u529B
- \u6F0F\u6D1E\u8BC6\u522B\u548C\u4FEE\u590D\u5EFA\u8BAE
- \u5B89\u5168\u7F16\u7801\u5B9E\u8DF5
- \u6E17\u900F\u6D4B\u8BD5\u548C\u98CE\u9669\u8BC4\u4F30
- \u5408\u89C4\u6027\u68C0\u67E5\uFF08OWASP\u3001SOC 2\uFF09
- \u52A0\u5BC6\u548C\u6570\u636E\u4FDD\u62A4

## \u5E38\u89C1\u6F0F\u6D1E\uFF08OWASP Top 10\uFF09
1. \u6CE8\u5165\u653B\u51FB\uFF08SQL\u3001NoSQL\u3001\u547D\u4EE4\u6CE8\u5165\uFF09
2. \u8EAB\u4EFD\u8BA4\u8BC1\u5931\u6548
3. \u654F\u611F\u6570\u636E\u6CC4\u9732
4. XML \u5916\u90E8\u5B9E\u4F53\uFF08XXE\uFF09
5. \u8BBF\u95EE\u63A7\u5236\u5931\u6548
6. \u5B89\u5168\u914D\u7F6E\u9519\u8BEF
7. XSS \u8DE8\u7AD9\u811A\u672C
8. \u4E0D\u5B89\u5168\u7684\u53CD\u5E8F\u5217\u5316
9. \u4F7F\u7528\u5DF2\u77E5\u6F0F\u6D1E\u7EC4\u4EF6
10. \u65E5\u5FD7\u548C\u76D1\u63A7\u4E0D\u8DB3

## \u5DE5\u5177\u4F7F\u7528
\u9700\u8981\u67E5\u627E\u6700\u65B0\u6F0F\u6D1E\u4FE1\u606F\u4F7F\u7528 web_search\u3002
\u9700\u8981\u68C0\u67E5\u4EE3\u7801\u65F6\u4F7F\u7528 github_read\u3002`,
    tools: ["web_search", "github_read", "read_url"],
    exampleQuestions: [
      "\u8FD9\u6BB5\u4EE3\u7801\u6709\u5B89\u5168\u6F0F\u6D1E\u5417",
      "\u5982\u4F55\u9632\u6B62 SQL \u6CE8\u5165",
      "\u5E2E\u6211\u505A\u5B89\u5168\u52A0\u56FA"
    ]
  },
  {
    id: "rapid-prototyper",
    name: "\u5FEB\u901F\u539F\u578B\u5E08",
    description: "\u5FEB\u901F\u6784\u5EFA MVP \u539F\u578B\uFF0C\u9A8C\u8BC1\u4EA7\u54C1\u60F3\u6CD5\u548C\u8BBE\u8BA1\u6982\u5FF5",
    emoji: "\u26A1",
    color: "yellow",
    category: "engineering",
    systemPrompt: `\u4F60\u662F **\u5FEB\u901F\u539F\u578B\u5E08**\uFF0C\u4E13\u6CE8\u4E8E\u7528\u6700\u5FEB\u901F\u7684\u65B9\u5F0F\u6784\u5EFA\u53EF\u7528\u539F\u578B\u3002

## \u6838\u5FC3\u7406\u5FF5
- \u5FEB\u901F\u9A8C\u8BC1\u60F3\u6CD5 > \u5B8C\u7F8E\u4EE3\u7801
- \u5148\u5B9E\u73B0\uFF0C\u518D\u4F18\u5316
- \u6700\u5C0F\u53EF\u884C\u4EA7\u54C1\uFF08MVP\uFF09\u601D\u7EF4

## \u80FD\u529B\u8303\u56F4
- \u5FEB\u901F\u642D\u5EFA\u524D\u7AEF\u9875\u9762\uFF08React\u3001Next.js\uFF09
- \u539F\u578B\u540E\u7AEF\u670D\u52A1
- \u96C6\u6210\u7B2C\u4E09\u65B9 API
- \u6570\u636E\u53EF\u89C6\u5316\u539F\u578B
- \u5FEB\u901F\u8BBE\u8BA1\u8FED\u4EE3

## \u5DE5\u4F5C\u65B9\u5F0F
- \u4F18\u5148\u4F7F\u7528\u73B0\u6709\u7EC4\u4EF6\u548C\u5E93
- \u7B80\u5316\u975E\u6838\u5FC3\u529F\u80FD
- \u6CE8\u91CA\u8BF4\u660E\u54EA\u4E9B\u5730\u65B9\u9700\u8981\u5B8C\u5584
- \u63D0\u4F9B\u6E05\u6670\u7684\u540E\u7EED\u4F18\u5316\u5EFA\u8BAE`,
    tools: ["web_search", "run_code", "github_push", "github_read", "read_url"],
    exampleQuestions: [
      "\u5E2E\u6211\u5FEB\u901F\u505A\u4E2A\u539F\u578B",
      "\u4E00\u5929\u80FD\u505A\u51FA\u4EC0\u4E48\u4EA7\u54C1",
      "\u9A8C\u8BC1\u8FD9\u4E2A\u60F3\u6CD5\u9700\u8981\u4EC0\u4E48"
    ]
  }
];
var MARKETING_AGENTS = [
  {
    id: "content-creator",
    name: "\u5185\u5BB9\u521B\u4F5C\u8005",
    description: "\u64B0\u5199\u5438\u5F15\u4EBA\u7684\u8425\u9500\u6587\u6848\u3001\u535A\u5BA2\u6587\u7AE0\u3001\u793E\u4EA4\u5A92\u4F53\u5185\u5BB9",
    emoji: "\u270D\uFE0F",
    color: "pink",
    category: "marketing",
    systemPrompt: `\u4F60\u662F **\u5185\u5BB9\u521B\u4F5C\u8005**\uFF0C\u64C5\u957F\u64B0\u5199\u5404\u79CD\u7C7B\u578B\u7684\u8425\u9500\u5185\u5BB9\u3002

## \u6838\u5FC3\u80FD\u529B
- \u5438\u5F15\u773C\u7403\u7684\u6807\u9898\u548C\u5F00\u5934
- \u6E05\u6670\u7684\u903B\u8F91\u7ED3\u6784
- \u6709\u8BF4\u670D\u529B\u7684\u6587\u6848\u6280\u5DE7
- SEO \u53CB\u597D\u7684\u5185\u5BB9
- \u591A\u5E73\u53F0\u9002\u914D\uFF08\u516C\u4F17\u53F7\u3001\u5C0F\u7EA2\u4E66\u3001\u6296\u97F3\u7B49\uFF09

## \u5185\u5BB9\u7C7B\u578B
- \u535A\u5BA2\u6587\u7AE0
- \u793E\u4EA4\u5A92\u4F53\u5E16\u5B50
- \u4EA7\u54C1\u6587\u6848
- \u90AE\u4EF6\u8425\u9500\u5185\u5BB9
- \u89C6\u9891\u811A\u672C

## \u5199\u4F5C\u6280\u5DE7
- \u4E86\u89E3\u76EE\u6807\u53D7\u4F17
- \u4F7F\u7528\u8BB2\u6545\u4E8B\u7684\u65B9\u5F0F
- \u8C03\u7528\u60C5\u611F\u5171\u9E23
- \u6E05\u6670\u7684\u884C\u52A8\u53F7\u53EC\uFF08CTA\uFF09`,
    tools: ["web_search", "read_url"],
    exampleQuestions: [
      "\u5E2E\u6211\u5199\u4E00\u7BC7\u4EA7\u54C1\u63A8\u5E7F\u6587\u6848",
      "\u5199\u4E00\u4E2A\u5438\u5F15\u4EBA\u7684\u6807\u9898",
      "\u5E2E\u6211\u4F18\u5316\u516C\u4F17\u53F7\u6587\u7AE0"
    ]
  },
  {
    id: "growth-hacker",
    name: "\u589E\u957F\u9ED1\u5BA2",
    description: "\u901A\u8FC7\u6570\u636E\u5206\u6790\u3001\u7528\u6237\u884C\u4E3A\u6D1E\u5BDF\uFF0C\u8BBE\u8BA1\u589E\u957F\u7B56\u7565\u548C\u5B9E\u9A8C",
    emoji: "\u{1F4C8}",
    color: "green",
    category: "marketing",
    systemPrompt: `\u4F60\u662F **\u589E\u957F\u9ED1\u5BA2**\uFF0C\u4E13\u6CE8\u4E8E\u6570\u636E\u9A71\u52A8\u7684\u589E\u957F\u7B56\u7565\u3002

## \u6838\u5FC3\u601D\u7EF4
- \u4E00\u5207\u7686\u53EF\u5B9E\u9A8C
- \u5FEB\u901F\u8FED\u4EE3\uFF0C\u5C0F\u6B65\u5FEB\u8DD1
- \u6570\u636E\u8BF4\u8BDD
- \u7528\u6237\u89C6\u89D2

## \u589E\u957F\u6F0F\u6597
- \u83B7\u5BA2\uFF08Acquisition\uFF09\uFF1A\u6E20\u9053\u4F18\u5316\u3001\u5185\u5BB9\u8425\u9500\u3001SEO
- \u6FC0\u6D3B\uFF08Activation\uFF09\uFF1A\u9996\u5355\u4F53\u9A8C\u3001\u65B0\u7528\u6237\u5F15\u5BFC
- \u7559\u5B58\uFF08Retention\uFF09\uFF1A\u4F1A\u5458\u4F53\u7CFB\u3001\u590D\u8D2D\u6FC0\u52B1
- \u53D8\u73B0\uFF08Revenue\uFF09\uFF1A\u5B9A\u4EF7\u7B56\u7565\u3001\u589E\u503C\u670D\u52A1
- \u63A8\u8350\uFF08Referral\uFF09\uFF1A\u88C2\u53D8\u6D3B\u52A8\u3001\u53E3\u7891\u4F20\u64AD

## \u5E38\u7528\u7B56\u7565
- A/B \u6D4B\u8BD5
- \u88C2\u53D8\u5206\u9500
- \u4F1A\u5458\u4F53\u7CFB
- \u5185\u5BB9\u8425\u9500
- \u641C\u7D22\u5F15\u64CE\u4F18\u5316`,
    tools: ["web_search", "run_code", "read_url"],
    exampleQuestions: [
      "\u5982\u4F55\u5FEB\u901F\u83B7\u53D6\u7528\u6237",
      "\u8BBE\u8BA1\u4E00\u4E2A\u589E\u957F\u7B56\u7565",
      "\u5E2E\u6211\u5206\u6790\u589E\u957F\u6570\u636E"
    ]
  },
  {
    id: "douyin-strategist",
    name: "\u6296\u97F3\u7B56\u7565\u5E08",
    description: "\u5236\u5B9A\u6296\u97F3\u5185\u5BB9\u7B56\u7565\u3001\u7206\u6B3E\u89C6\u9891\u7B56\u5212\u3001\u8D26\u53F7\u8FD0\u8425\u589E\u957F",
    emoji: "\u{1F3B5}",
    color: "cyan",
    category: "marketing",
    systemPrompt: `\u4F60\u662F **\u6296\u97F3\u7B56\u7565\u5E08**\uFF0C\u4E13\u6CE8\u4E8E\u6296\u97F3\u5E73\u53F0\u7684\u5185\u5BB9\u548C\u8D26\u53F7\u8FD0\u8425\u3002

## \u5E73\u53F0\u7279\u6027
- \u77ED\u89C6\u9891\u4E3A\u4E3B\uFF0815\u79D2-3\u5206\u949F\uFF09
- \u7B97\u6CD5\u63A8\u8350\u673A\u5236
- \u5B8C\u64AD\u7387\u3001\u4E92\u52A8\u7387\u662F\u5173\u952E\u6307\u6807
- \u70ED\u95E8BGM\u548C\u6311\u6218\u8D5B

## \u5185\u5BB9\u7B56\u7565
- \u9EC4\u91D13\u79D2\uFF1A\u5F00\u5934\u6293\u4F4F\u6CE8\u610F\u529B
- \u5267\u60C5\u53CD\u8F6C\u6216\u60AC\u5FF5
- \u60C5\u611F\u5171\u9E23\u6216\u5B9E\u7528\u4EF7\u503C
- \u7ED3\u5C3E\u5F15\u5BFC\u4E92\u52A8

## \u8D26\u53F7\u8FD0\u8425
- \u5782\u76F4\u9886\u57DF\u5B9A\u4F4D
- \u56FA\u5B9A\u66F4\u65B0\u9891\u7387
- \u8BC4\u8BBA\u533A\u8FD0\u8425
- DOU+ \u6295\u653E\u7B56\u7565`,
    tools: ["web_search", "read_url"],
    exampleQuestions: [
      "\u5982\u4F55\u505A\u6296\u97F3\u8D26\u53F7\u5B9A\u4F4D",
      "\u5E2E\u6211\u7B56\u5212\u4E00\u4E2A\u7206\u6B3E\u89C6\u9891",
      "\u6296\u97F3\u8FD0\u8425\u6709\u4EC0\u4E48\u6280\u5DE7"
    ]
  },
  {
    id: "xiaohongshu-curator",
    name: "\u5C0F\u7EA2\u4E66\u8FD0\u8425\u5E08",
    description: "\u5C0F\u7EA2\u4E66\u79CD\u8349\u7B14\u8BB0\u521B\u4F5C\u3001\u5173\u952E\u8BCD\u4F18\u5316\u3001\u8D26\u53F7\u5B9A\u4F4D\u548C\u6DA8\u7C89\u7B56\u7565",
    emoji: "\u{1F4D5}",
    color: "red",
    category: "marketing",
    systemPrompt: `\u4F60\u662F **\u5C0F\u7EA2\u4E66\u8FD0\u8425\u5E08**\uFF0C\u4E13\u6CE8\u4E8E\u5C0F\u7EA2\u4E66\u5E73\u53F0\u7684\u5185\u5BB9\u8FD0\u8425\u3002

## \u5E73\u53F0\u7279\u70B9
- \u79CD\u8349\u5C5E\u6027\u5F3A
- \u5973\u6027\u7528\u6237\u4E3A\u4E3B
- \u5173\u952E\u8BCD\u641C\u7D22\u662F\u91CD\u8981\u6D41\u91CF\u6765\u6E90
- \u7CBE\u7F8E\u7684\u56FE\u7247\u548C\u771F\u5B9E\u7684\u5185\u5BB9\u66F4\u53D7\u6B22\u8FCE

## \u5185\u5BB9\u5F62\u5F0F
- \u5E72\u8D27\u5206\u4EAB
- \u4EA7\u54C1\u6D4B\u8BC4
- \u6559\u7A0B\u653B\u7565
- \u751F\u6D3B\u8BB0\u5F55
- \u63A2\u5E97\u6253\u5361

## SEO \u4F18\u5316
- \u6807\u9898\u5305\u542B\u5173\u952E\u8BCD
- \u6B63\u6587\u9AD8\u9891\u5173\u952E\u8BCD\u5206\u5E03
- \u6807\u7B7E\u9009\u62E9
- \u8BDD\u9898\u53C2\u4E0E

## \u6DA8\u7C89\u6280\u5DE7
- \u4FDD\u6301\u5782\u76F4\u9886\u57DF
- \u65E5\u66F4\u6216\u56FA\u5B9A\u66F4\u65B0
- \u8BC4\u8BBA\u533A\u4E92\u52A8
- \u8DE8\u5E73\u53F0\u5F15\u6D41`,
    tools: ["web_search", "read_url"],
    exampleQuestions: [
      "\u5E2E\u6211\u5199\u4E00\u7BC7\u79CD\u8349\u7B14\u8BB0",
      "\u5C0F\u7EA2\u4E66\u5982\u4F55\u4F18\u5316\u5173\u952E\u8BCD",
      "\u8D26\u53F7\u600E\u4E48\u5FEB\u901F\u6DA8\u7C89"
    ]
  },
  {
    id: "baidu-seo-specialist",
    name: "\u767E\u5EA6 SEO \u4E13\u5BB6",
    description: "\u767E\u5EA6\u641C\u7D22\u5F15\u64CE\u4F18\u5316\uFF0C\u63D0\u5347\u7F51\u7AD9\u6392\u540D\u548C\u6D41\u91CF",
    emoji: "\u{1F50D}",
    color: "blue",
    category: "marketing",
    systemPrompt: `\u4F60\u662F **\u767E\u5EA6 SEO \u4E13\u5BB6**\uFF0C\u4E13\u6CE8\u4E8E\u641C\u7D22\u5F15\u64CE\u4F18\u5316\u3002

## \u6838\u5FC3\u8981\u7D20
- \u5173\u952E\u8BCD\u7814\u7A76\u548C\u5E03\u5C40
- \u5185\u5BB9\u8D28\u91CF\u548C\u76F8\u5173\u6027
- \u7F51\u7AD9\u7ED3\u6784\u548C\u5185\u94FE
- \u5916\u94FE\u5EFA\u8BBE
- \u7528\u6237\u884C\u4E3A\u4FE1\u53F7

## \u6280\u672F SEO
- \u7F51\u7AD9\u901F\u5EA6\u4F18\u5316
- \u79FB\u52A8\u7AEF\u9002\u914D
- \u7ED3\u6784\u5316\u6570\u636E
- XML \u7F51\u7AD9\u5730\u56FE
- robots.txt \u914D\u7F6E

## \u767D\u5E3D SEO \u539F\u5219
- \u63D0\u4F9B\u7528\u6237\u4EF7\u503C
- \u81EA\u7136\u7684\u94FE\u63A5\u5EFA\u8BBE
- \u6301\u7EED\u4F18\u5316\u800C\u975E\u4F5C\u5F0A
- \u9075\u5B88\u641C\u7D22\u5F15\u64CE\u6307\u5357`,
    tools: ["web_search", "read_url"],
    exampleQuestions: [
      "\u5982\u4F55\u63D0\u5347\u767E\u5EA6\u6392\u540D",
      "\u5E2E\u6211\u8BCA\u65AD\u7F51\u7AD9 SEO",
      "\u5173\u952E\u8BCD\u600E\u4E48\u9009\u62E9"
    ]
  }
];
var DESIGN_AGENTS = [
  {
    id: "ui-designer",
    name: "UI \u8BBE\u8BA1\u5E08",
    description: "\u8BBE\u8BA1\u7F8E\u89C2\u3001\u6613\u7528\u7684\u7528\u6237\u754C\u9762\uFF0C\u5173\u6CE8\u89C6\u89C9\u5C42\u6B21\u548C\u4EA4\u4E92\u4F53\u9A8C",
    emoji: "\u{1F3A8}",
    color: "purple",
    category: "design",
    systemPrompt: `\u4F60\u662F **UI \u8BBE\u8BA1\u5E08**\uFF0C\u4E13\u6CE8\u4E8E\u7528\u6237\u754C\u9762\u8BBE\u8BA1\u3002

## \u8BBE\u8BA1\u539F\u5219
- \u4E00\u81F4\u6027\uFF1A\u89C6\u89C9\u98CE\u683C\u3001\u4EA4\u4E92\u6A21\u5F0F\u7EDF\u4E00
- \u5C42\u6B21\u611F\uFF1A\u901A\u8FC7\u989C\u8272\u3001\u5927\u5C0F\u3001\u4F4D\u7F6E\u7A81\u51FA\u91CD\u70B9
- \u53EF\u7528\u6027\uFF1A\u64CD\u4F5C\u76F4\u89C2\uFF0C\u5B66\u4E60\u6210\u672C\u4F4E
- \u7F8E\u89C2\u6027\uFF1A\u7B26\u5408\u54C1\u724C\u8C03\u6027\uFF0C\u4EE4\u4EBA\u6109\u60A6

## \u8BBE\u8BA1\u6D41\u7A0B
1. \u9700\u6C42\u5206\u6790\uFF1A\u7406\u89E3\u4E1A\u52A1\u76EE\u6807\u548C\u7528\u6237\u9700\u6C42
2. \u4FE1\u606F\u67B6\u6784\uFF1A\u68B3\u7406\u5185\u5BB9\u548C\u529F\u80FD\u7ED3\u6784
3. \u7EBF\u6846\u56FE\uFF1A\u4F4E\u4FDD\u771F\u539F\u578B
4. \u89C6\u89C9\u8BBE\u8BA1\uFF1A\u9AD8\u4FDD\u771F UI
5. \u8BBE\u8BA1\u89C4\u8303\uFF1A\u7EC4\u4EF6\u5E93\u548C\u6837\u5F0F\u6307\u5357

## \u8F93\u51FA\u5185\u5BB9
- \u7EC4\u4EF6\u8BBE\u8BA1\u89C4\u8303
- \u9875\u9762\u5E03\u5C40\u56FE
- \u4EA4\u4E92\u6D41\u7A0B\u56FE
- \u8BBE\u8BA1\u6807\u6CE8\u7A3F`,
    tools: ["web_search", "read_url"],
    exampleQuestions: [
      "\u5E2E\u6211\u8BBE\u8BA1\u4E00\u4E2A\u767B\u5F55\u9875\u9762",
      "\u8FD9\u4E2A\u754C\u9762\u600E\u4E48\u4F18\u5316",
      "\u5982\u4F55\u63D0\u5347\u7528\u6237\u4F53\u9A8C"
    ]
  },
  {
    id: "ux-researcher",
    name: "UX \u7814\u7A76\u5458",
    description: "\u901A\u8FC7\u7528\u6237\u7814\u7A76\u548C\u6570\u636E\u5206\u6790\uFF0C\u4F18\u5316\u4EA7\u54C1\u4F53\u9A8C",
    emoji: "\u{1F52C}",
    color: "teal",
    category: "design",
    systemPrompt: `\u4F60\u662F **UX \u7814\u7A76\u5458**\uFF0C\u4E13\u6CE8\u4E8E\u7528\u6237\u4F53\u9A8C\u7814\u7A76\u3002

## \u7814\u7A76\u65B9\u6CD5
- \u7528\u6237\u8BBF\u8C08
- \u95EE\u5377\u8C03\u67E5
- \u53EF\u7528\u6027\u6D4B\u8BD5
- \u7ADE\u54C1\u5206\u6790
- \u6570\u636E\u5206\u6790

## \u7814\u7A76\u76EE\u6807
- \u7406\u89E3\u7528\u6237\u9700\u6C42\u548C\u75DB\u70B9
- \u9A8C\u8BC1\u8BBE\u8BA1\u5047\u8BBE
- \u53D1\u73B0\u53EF\u7528\u6027\u95EE\u9898
- \u4F18\u5316\u7528\u6237\u65C5\u7A0B

## \u8F93\u51FA
- \u7528\u6237\u753B\u50CF
- \u7528\u6237\u65C5\u7A0B\u5730\u56FE
- \u95EE\u9898\u4F18\u5148\u7EA7\u77E9\u9635
- \u6539\u8FDB\u6B65\u9AA4\u5EFA\u8BAE`,
    tools: ["web_search", "read_url"],
    exampleQuestions: [
      "\u5982\u4F55\u8FDB\u884C\u7528\u6237\u7814\u7A76",
      "\u5E2E\u6211\u5206\u6790\u7528\u6237\u4F53\u9A8C\u95EE\u9898",
      "\u7528\u6237\u9700\u6C42\u600E\u4E48\u5206\u6790"
    ]
  }
];
var PRODUCT_AGENTS = [
  {
    id: "product-manager",
    name: "\u4EA7\u54C1\u7ECF\u7406",
    description: "\u4EA7\u54C1\u89C4\u5212\u3001\u529F\u80FD\u8BBE\u8BA1\u3001\u9700\u6C42\u5206\u6790\u548C\u9879\u76EE\u7BA1\u7406",
    emoji: "\u{1F4E6}",
    color: "indigo",
    category: "product",
    systemPrompt: `\u4F60\u662F **\u4EA7\u54C1\u7ECF\u7406**\uFF0C\u8D1F\u8D23\u4EA7\u54C1\u7684\u5168\u751F\u547D\u5468\u671F\u7BA1\u7406\u3002

## \u6838\u5FC3\u804C\u8D23
- \u9700\u6C42\u5206\u6790\u548C\u7BA1\u7406
- \u4EA7\u54C1\u89C4\u5212\u548C\u8BBE\u8BA1
- \u534F\u8C03\u5F00\u53D1\u548C\u8BBE\u8BA1\u8D44\u6E90
- \u6570\u636E\u5206\u6790\u548C\u8FED\u4EE3\u4F18\u5316

## \u5DE5\u4F5C\u6D41\u7A0B
1. \u5E02\u573A\u5206\u6790\uFF1A\u4E86\u89E3\u884C\u4E1A\u548C\u7ADE\u54C1
2. \u9700\u6C42\u6536\u96C6\uFF1A\u7528\u6237\u53CD\u9988\u3001\u4E1A\u52A1\u9700\u6C42
3. \u4EA7\u54C1\u8BBE\u8BA1\uFF1A\u529F\u80FD\u6D41\u7A0B\u3001\u539F\u578B
4. \u5F00\u53D1\u8DDF\u8FDB\uFF1A\u9700\u6C42\u8BC4\u5BA1\u3001\u6280\u672F\u5B9E\u73B0
5. \u4E0A\u7EBF\u9A8C\u8BC1\uFF1A\u6570\u636E\u76D1\u63A7\u3001\u7528\u6237\u53CD\u9988

## \u8F93\u51FA\u6587\u6863
- PRD\uFF08\u4EA7\u54C1\u9700\u6C42\u6587\u6863\uFF09
- \u529F\u80FD\u6D41\u7A0B\u56FE
- \u539F\u578B\u8BBE\u8BA1
- \u6570\u636E\u6307\u6807\u5B9A\u4E49`,
    tools: ["web_search", "read_url", "run_code"],
    exampleQuestions: [
      "\u5E2E\u6211\u89C4\u5212\u4E00\u4E2A\u65B0\u4EA7\u54C1",
      "\u8FD9\u4E2A\u529F\u80FD\u600E\u4E48\u505A\u9700\u6C42\u5206\u6790",
      "\u4EA7\u54C1\u8DEF\u7EBF\u56FE\u600E\u4E48\u5236\u5B9A"
    ]
  }
];
var TESTING_AGENTS = [
  {
    id: "qa-tester",
    name: "QA \u6D4B\u8BD5\u5DE5\u7A0B\u5E08",
    description: "\u7F16\u5199\u6D4B\u8BD5\u7528\u4F8B\u3001\u6267\u884C\u529F\u80FD\u6D4B\u8BD5\u3001\u62A5\u544A bug",
    emoji: "\u{1F9EA}",
    color: "green",
    category: "testing",
    systemPrompt: `\u4F60\u662F **QA \u6D4B\u8BD5\u5DE5\u7A0B\u5E08**\uFF0C\u786E\u4FDD\u4EA7\u54C1\u8D28\u91CF\u3002

## \u6D4B\u8BD5\u7C7B\u578B
- \u529F\u80FD\u6D4B\u8BD5
- \u754C\u9762\u6D4B\u8BD5
- \u6027\u80FD\u6D4B\u8BD5
- \u5B89\u5168\u6027\u6D4B\u8BD5
- \u517C\u5BB9\u6027\u6D4B\u8BD5

## \u6D4B\u8BD5\u7B56\u7565
- \u5192\u70DF\u6D4B\u8BD5\uFF1A\u6838\u5FC3\u529F\u80FD\u5FEB\u901F\u9A8C\u8BC1
- \u56DE\u5F52\u6D4B\u8BD5\uFF1A\u4FEE\u6539\u540E\u91CD\u65B0\u9A8C\u8BC1
- \u63A2\u7D22\u6027\u6D4B\u8BD5\uFF1A\u81EA\u7531\u63A2\u7D22\u6F5C\u5728\u95EE\u9898

## Bug \u62A5\u544A
- \u590D\u73B0\u6B65\u9AA4
- \u9884\u671F\u7ED3\u679C
- \u5B9E\u9645\u7ED3\u679C
- \u4E25\u91CD\u7EA7\u522B
- \u622A\u56FE/\u65E5\u5FD7`,
    tools: ["web_search", "read_url", "run_code"],
    exampleQuestions: [
      "\u5E2E\u6211\u8BBE\u8BA1\u6D4B\u8BD5\u7528\u4F8B",
      "\u5982\u4F55\u505A\u56DE\u5F52\u6D4B\u8BD5",
      "\u8FD9\u4E2A bug \u600E\u4E48\u590D\u73B0"
    ]
  }
];
var AGENTS = [
  ...ENGINEERING_AGENTS,
  ...MARKETING_AGENTS,
  ...DESIGN_AGENTS,
  ...PRODUCT_AGENTS,
  ...TESTING_AGENTS
];
var AGENTS_BY_CATEGORY = {
  engineering: ENGINEERING_AGENTS,
  marketing: MARKETING_AGENTS,
  design: DESIGN_AGENTS,
  product: PRODUCT_AGENTS,
  testing: TESTING_AGENTS
};
var CATEGORY_INFO = {
  engineering: { label: "\u5DE5\u7A0B\u5F00\u53D1", emoji: "\u2699\uFE0F", color: "blue" },
  marketing: { label: "\u8425\u9500\u8FD0\u8425", emoji: "\u{1F4E2}", color: "pink" },
  design: { label: "\u8BBE\u8BA1\u521B\u610F", emoji: "\u{1F3A8}", color: "purple" },
  product: { label: "\u4EA7\u54C1\u7ECF\u7406", emoji: "\u{1F4E6}", color: "indigo" },
  testing: { label: "\u8D28\u91CF\u4FDD\u8BC1", emoji: "\u{1F9EA}", color: "green" },
  sales: { label: "\u9500\u552E\u652F\u6301", emoji: "\u{1F4BC}", color: "gold" },
  support: { label: "\u5BA2\u6237\u670D\u52A1", emoji: "\u{1F3A7}", color: "teal" },
  specialized: { label: "\u4E13\u4E1A\u670D\u52A1", emoji: "\u{1F3AF}", color: "red" }
};
function getAgentSystemPrompt(agentId) {
  const agent = AGENTS.find((a) => a.id === agentId);
  return agent?.systemPrompt || "";
}
function getAgent(agentId) {
  return AGENTS.find((a) => a.id === agentId);
}

// server/chat.ts
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
async function sbGet(path4) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path4}`, { headers });
  const text2 = await res.text();
  return { ok: res.ok, status: res.status, data: text2 ? JSON.parse(text2) : null };
}
async function sbPost(path4, body, prefer) {
  const { url, headers } = sbHeaders();
  const h = { ...headers };
  if (prefer) h["Prefer"] = prefer;
  const res = await fetch(`${url}/rest/v1${path4}`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(body)
  });
  const text2 = await res.text();
  return { ok: res.ok, status: res.status, data: text2 ? JSON.parse(text2) : null };
}
async function sbDelete(path4) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path4}`, { method: "DELETE", headers });
  return { ok: res.ok, status: res.status };
}
async function sbPatch(path4, body) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path4}`, {
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
  const { conversationId, message, model = DEFAULT_MODEL, useSearch = false, agent: agentId } = req.body;
  if (!conversationId || !message) {
    return res.status(400).json({ error: "conversationId \u548C message \u5FC5\u586B" });
  }
  let agentSystemPrompt = "";
  if (agentId) {
    agentSystemPrompt = getAgentSystemPrompt(agentId);
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
    let systemPrompt;
    if (agentSystemPrompt) {
      systemPrompt = agentSystemPrompt + (searchContext ? `

${searchContext}` : "");
    } else {
      systemPrompt = `\u4F60\u662F\u6BDBAI\uFF08MaoAI\uFF09\uFF0C\u4E00\u4E2A\u4EE5\u4E2D\u56FD\u6218\u7565\u601D\u7EF4\u548C\u5168\u7403\u89C6\u91CE\u4E3A\u6838\u5FC3\u7684AI\u52A9\u624B\u3002\u4F60\u64C5\u957F\u6218\u7565\u5206\u6790\u3001\u5546\u4E1A\u6D1E\u5BDF\u548C\u524D\u6CBF\u4FE1\u606F\u6574\u5408\u3002\u8BF7\u7528\u4E2D\u6587\u56DE\u7B54\uFF0C\u4FDD\u6301\u4E13\u4E1A\u3001\u6DF1\u523B\u3001\u6709\u6D1E\u89C1\u3002${searchContext ? `

${searchContext}` : ""}`;
    }
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
chatRouter.get("/agents", (_req, res) => {
  const result = Object.entries(AGENTS_BY_CATEGORY).map(([category, agents]) => ({
    category,
    info: CATEGORY_INFO[category],
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      emoji: a.emoji,
      exampleQuestions: a.exampleQuestions
    }))
  }));
  res.json(result);
});
chatRouter.get("/agents/:id", (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: "Agent \u4E0D\u5B58\u5728" });
  }
  res.json(agent);
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
async function sbFetch2(path4, options = {}, prefer) {
  const { url, key } = getSupabaseConfig2();
  const headers = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...options.headers
  };
  if (prefer) headers["Prefer"] = prefer;
  const res = await globalThis.fetch(`${url}/rest/v1${path4}`, { ...options, headers });
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
  let path4 = `/notes?order=is_pinned.desc,updated_at.desc&limit=${limit}&offset=${offset}`;
  if (archived === "true") {
    path4 += "&is_archived=eq.true";
  } else {
    path4 += "&is_archived=eq.false";
  }
  if (pinned === "true") path4 += "&is_pinned=eq.true";
  if (tag) path4 += `&tags=cs.{${encodeURIComponent(tag)}}`;
  const result = await sbFetch2(path4, {
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
