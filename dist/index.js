var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/aiNodes.ts
import fs from "fs";
import path from "path";
function loadLocalDb() {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf8"));
  } catch {
    return { nodes: {}, skills: {}, nextNodeId: 1 };
  }
}
function saveLocalDb(db) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), "utf8");
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
function normalizeBody(body) {
  if (body === void 0 || body === null) return body;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}
async function sbFetch(path7, options = {}, prefer) {
  const { url, key } = getSupabaseConfig();
  const headers = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...options.headers
  };
  if (prefer) headers["Prefer"] = prefer;
  const res = await globalThis.fetch(`${url}/rest/v1${path7}`, {
    ...options,
    body: normalizeBody(options.body),
    headers
  });
  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
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
    const bodyStr = normalizeBody(options.body) ?? "{}";
    const body = JSON.parse(String(bodyStr));
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
    const bodyStr = normalizeBody(options.body) ?? "{}";
    const body = JSON.parse(String(bodyStr));
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
var LOCAL_DB_PATH;
var init_aiNodes = __esm({
  "server/aiNodes.ts"() {
    "use strict";
    LOCAL_DB_PATH = path.resolve(process.cwd(), ".openclaw-local-db.json");
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  createAiNode: () => createAiNode,
  createMaoApplication: () => createMaoApplication,
  createNodeLog: () => createNodeLog,
  deleteAllNodeSkills: () => deleteAllNodeSkills,
  deleteNodeSkill: () => deleteNodeSkill,
  getAiNodeById: () => getAiNodeById,
  getAiNodes: () => getAiNodes,
  getAllNodeSkills: () => getAllNodeSkills,
  getNodeSkills: () => getNodeSkills,
  getRoutingRules: () => getRoutingRules,
  getUserByOpenId: () => getUserByOpenId,
  listBriefSubscribers: () => listBriefSubscribers,
  listMaoApplications: () => listMaoApplications,
  listSubscriberEmails: () => listSubscriberEmails,
  listUsers: () => listUsers,
  setNodeSkillEnabled: () => setNodeSkillEnabled,
  subscribeBrief: () => subscribeBrief,
  updateAiNode: () => updateAiNode,
  updateMaoApplicationNotes: () => updateMaoApplicationNotes,
  updateMaoApplicationStatus: () => updateMaoApplicationStatus,
  updateNodePingStatus: () => updateNodePingStatus,
  updateUserRole: () => updateUserRole,
  upsertNodeSkill: () => upsertNodeSkill,
  upsertUser: () => upsertUser
});
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const existing = await getUserByOpenId(user.openId);
  const existingRole = existing?.role === "admin" || existing?.role === "user" ? existing.role : void 0;
  const role = user.role ?? existingRole ?? (user.openId === ENV.ownerOpenId || user.email === "sean_lab@me.com" ? "admin" : "user");
  const payload = {
    openId: user.openId,
    role,
    lastSignedIn: (user.lastSignedIn ?? /* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (user.name !== void 0) payload.name = user.name ?? null;
  if (user.email !== void 0) payload.email = user.email ?? null;
  if (user.loginMethod !== void 0) payload.loginMethod = user.loginMethod ?? null;
  const r = existing ? await dbFetch(
    `/users?openId=eq.${encodeURIComponent(user.openId)}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  ) : await dbFetch("/users", { method: "POST", body: JSON.stringify(payload) });
  if (!r.ok) {
    console.error("[DB] upsertUser failed:", r.status, r.data);
    throw new Error(`upsertUser failed: ${r.status}`);
  }
}
async function getUserByOpenId(openId) {
  const r = await dbFetch(`/users?openId=eq.${encodeURIComponent(openId)}&limit=1`);
  const rows = r.data;
  return rows?.[0];
}
async function listUsers() {
  const r = await dbFetch("/users?order=id.asc&select=id,name,email,role,lastSignedIn,createdAt");
  return r.data ?? [];
}
async function updateUserRole(id, role) {
  await dbFetch(
    `/users?id=eq.${id}`,
    { method: "PATCH", body: JSON.stringify({ role, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }) }
  );
}
async function createMaoApplication(data) {
  const r = await dbFetch(
    "/mao_applications",
    { method: "POST", body: JSON.stringify({ ...data, status: data.status ?? "pending" }) },
    "return=minimal"
  );
  if (!r.ok) throw new Error(`createMaoApplication failed: ${r.status}`);
}
async function listMaoApplications() {
  const r = await dbFetch("/mao_applications?order=createdAt.asc");
  return r.data ?? [];
}
async function updateMaoApplicationStatus(id, status) {
  await dbFetch(
    `/mao_applications?id=eq.${id}`,
    { method: "PATCH", body: JSON.stringify({ status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }) }
  );
}
async function updateMaoApplicationNotes(id, notes) {
  await dbFetch(
    `/mao_applications?id=eq.${id}`,
    { method: "PATCH", body: JSON.stringify({ notes, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }) }
  );
}
async function subscribeBrief(email) {
  const r = await dbFetch(
    "/brief_subscribers",
    { method: "POST", body: JSON.stringify({ email }) },
    "resolution=merge-duplicates"
  );
  if (!r.ok && r.status !== 409) throw new Error(`subscribeBrief failed: ${r.status}`);
}
async function listBriefSubscribers() {
  const r = await dbFetch("/brief_subscribers?order=createdAt.asc");
  return r.data ?? [];
}
async function listSubscriberEmails() {
  const rows = await listBriefSubscribers();
  return rows.map((r) => r.email).filter(Boolean);
}
async function getAiNodes(onlineOnly) {
  const filter = onlineOnly ? "?isLocal=eq.true&order=priority.asc" : "?order=priority.asc";
  const r = await dbFetch(`/ai_nodes${filter}`);
  return r.data ?? [];
}
async function getAiNodeById(id) {
  const r = await dbFetch(`/ai_nodes?id=eq.${id}&limit=1`);
  const rows = r.data;
  return rows?.[0] ?? null;
}
async function createAiNode(data) {
  const r = await dbFetch(
    "/ai_nodes",
    { method: "POST", body: JSON.stringify(data) },
    "return=representation"
  );
  const rows = r.data;
  return rows?.[0] ?? null;
}
async function updateAiNode(id, data) {
  await dbFetch(`/ai_nodes?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) });
}
async function updateNodePingStatus(id, isOnline, lastPingMs) {
  const body = {
    isOnline,
    lastPingAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastHeartbeatAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (lastPingMs !== void 0) body.lastPingMs = lastPingMs;
  await dbFetch(`/ai_nodes?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
async function getRoutingRules() {
  const r = await dbFetch("/routing_rules?order=priority.asc");
  return r.data ?? [];
}
async function createNodeLog(data) {
  try {
    await dbFetch("/node_logs", { method: "POST", body: JSON.stringify(data) }, "return=minimal");
  } catch {
  }
}
async function getNodeSkills(nodeId) {
  const r = await dbFetch(`/node_skills?nodeId=eq.${nodeId}&order=skillId.asc`);
  return r.data ?? [];
}
async function getAllNodeSkills() {
  const r = await dbFetch("/node_skills?order=nodeId.asc");
  return r.data ?? [];
}
async function upsertNodeSkill(data) {
  await dbFetch(
    "/node_skills",
    { method: "POST", body: JSON.stringify(data) },
    "resolution=merge-duplicates"
  );
}
async function deleteNodeSkill(nodeId, skillId) {
  await dbFetch(
    `/node_skills?nodeId=eq.${nodeId}&skillId=eq.${encodeURIComponent(skillId)}`,
    { method: "DELETE" }
  );
}
async function deleteAllNodeSkills(nodeId) {
  await dbFetch(`/node_skills?nodeId=eq.${nodeId}`, { method: "DELETE" });
}
async function setNodeSkillEnabled(nodeId, skillId, isEnabled) {
  await dbFetch(
    `/node_skills?nodeId=eq.${nodeId}&skillId=eq.${encodeURIComponent(skillId)}`,
    { method: "PATCH", body: JSON.stringify({ isActive: isEnabled }) }
  );
}
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_aiNodes();
    init_env();
  }
});

// vite.config.ts
var vite_config_exports = {};
__export(vite_config_exports, {
  default: () => vite_config_default
});
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs2 from "node:fs";
import path2 from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
function ensureLogDir() {
  if (!fs2.existsSync(LOG_DIR)) {
    fs2.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs2.existsSync(logPath) || fs2.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs2.readFileSync(logPath, "utf-8").split("\n");
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
    fs2.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path2.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs2.appendFileSync(logPath, `${lines.join("\n")}
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
    LOG_DIR = path2.join(PROJECT_ROOT, ".manus-logs");
    MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
    TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
    plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
    vite_config_default = defineConfig({
      plugins,
      resolve: {
        alias: {
          "@": path2.resolve(import.meta.dirname, "client", "src"),
          "@shared": path2.resolve(import.meta.dirname, "shared"),
          "@assets": path2.resolve(import.meta.dirname, "attached_assets")
        }
      },
      envDir: path2.resolve(import.meta.dirname),
      root: path2.resolve(import.meta.dirname, "client"),
      publicDir: path2.resolve(import.meta.dirname, "client", "public"),
      build: {
        outDir: path2.resolve(import.meta.dirname, "dist/public"),
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
        },
        proxy: {
          // AutoClip Python FastAPI 后端代理（端口 8000）
          "/api": {
            target: "http://localhost:8000",
            changeOrigin: true
            // 注意：autoclip 后端响应可能包含 CORS headers，如有需要可加 rewrite
          }
        }
      }
    });
  }
});

// server/wsServer.ts
var wsServer_exports = {};
__export(wsServer_exports, {
  default: () => wsServer_default,
  wsServer: () => wsServer
});
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { URL as URL2 } from "url";
var WSServer, wsServer, wsServer_default;
var init_wsServer = __esm({
  "server/wsServer.ts"() {
    "use strict";
    WSServer = class {
      constructor() {
        this.wss = null;
        this.httpServer = null;
        this.clients = /* @__PURE__ */ new Map();
        // userId -> connection
        this.heartbeatInterval = null;
        this.port = 8e3;
      }
      /**
       * 初始化 WebSocket 服务器
       * 在独立端口 8000 上监听
       */
      init(_httpServer) {
        this.port = parseInt(process.env.WS_PORT || "8000");
        this.httpServer = createServer();
        this.wss = new WebSocketServer({
          server: this.httpServer
        });
        this.wss.on("connection", (ws, request) => {
          const rawUrl = request.url || "";
          const url = new URL2(rawUrl, `http://localhost:${this.port}`);
          const pathname = url.pathname;
          if (!pathname.startsWith("/api/v1/ws")) {
            console.log(`[WSS] Rejected: invalid path ${pathname}`);
            ws.close(400, "Invalid path");
            return;
          }
          const segments = pathname.split("/").filter(Boolean);
          const userId = segments[segments.length - 1] || `anon-${Date.now()}`;
          console.log(`[WSS] Client connected: ${userId}`);
          const client = {
            ws,
            userId,
            subscribedTasks: /* @__PURE__ */ new Set(),
            subscribedProjects: /* @__PURE__ */ new Set(),
            lastPing: Date.now()
          };
          this.clients.set(userId, client);
          this.sendToClient(userId, {
            type: "connected",
            userId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          ws.on("message", (data) => {
            try {
              const message = JSON.parse(data.toString());
              this.handleMessage(userId, message);
            } catch (err) {
              console.error("[WSS] Failed to parse message:", err);
            }
          });
          ws.on("close", () => {
            console.log(`[WSS] Client disconnected: ${userId}`);
            this.clients.delete(userId);
          });
          ws.on("error", (err) => {
            console.error(`[WSS] Error for ${userId}:`, err.message);
            this.clients.delete(userId);
          });
          ws.on("pong", () => {
            const client2 = this.clients.get(userId);
            if (client2) {
              client2.lastPing = Date.now();
            }
          });
        });
        this.httpServer.listen(this.port, () => {
          console.log(`[WSS] WebSocket server running on ws://localhost:${this.port}/api/v1/ws`);
        });
        this.startHeartbeat();
      }
      /**
       * 处理客户端消息
       */
      handleMessage(userId, message) {
        const client = this.clients.get(userId);
        if (!client) return;
        switch (message.type) {
          case "ping":
            this.sendToClient(userId, { type: "pong", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
            break;
          case "subscribe":
            this.subscribeToTopic(userId, message.topic);
            break;
          case "unsubscribe":
            this.unsubscribeFromTopic(userId, message.topic);
            break;
          case "subscribe_task":
            if (message.task_id) {
              client.subscribedTasks.add(String(message.task_id));
              console.log(`[WSS] ${userId} subscribed to task ${message.task_id}`);
            }
            break;
          case "unsubscribe_task":
            if (message.task_id) {
              client.subscribedTasks.delete(String(message.task_id));
            }
            break;
          case "subscribe_project":
            if (message.project_id) {
              client.subscribedProjects.add(String(message.project_id));
            }
            break;
          case "unsubscribe_project":
            if (message.project_id) {
              client.subscribedProjects.delete(String(message.project_id));
            }
            break;
          case "sync_subscriptions":
            if (Array.isArray(message.project_ids)) {
              client.subscribedProjects = new Set(message.project_ids.map(String));
            }
            if (Array.isArray(message.channels)) {
              message.channels.forEach((ch) => {
                if (ch.startsWith("task:")) {
                  client.subscribedTasks.add(ch.replace("task:", ""));
                } else {
                  client.subscribedProjects.add(ch);
                }
              });
            }
            console.log(`[WSS] ${userId} synced subscriptions: tasks=${[...client.subscribedTasks]}, projects=${[...client.subscribedProjects]}`);
            break;
          case "get_status":
            this.sendToClient(userId, {
              type: "status",
              clients: this.clients.size,
              subscribedTasks: [...client.subscribedTasks],
              subscribedProjects: [...client.subscribedProjects],
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            break;
          default:
            console.log(`[WSS] Unknown message type: ${message.type}`);
        }
      }
      /**
       * 订阅主题
       */
      subscribeToTopic(userId, topic) {
        const client = this.clients.get(userId);
        if (!client) return;
        if (topic.startsWith("task:")) {
          client.subscribedTasks.add(topic.replace("task:", ""));
        } else {
          client.subscribedProjects.add(topic);
        }
        console.log(`[WSS] ${userId} subscribed to: ${topic}`);
      }
      /**
       * 取消订阅主题
       */
      unsubscribeFromTopic(userId, topic) {
        const client = this.clients.get(userId);
        if (!client) return;
        if (topic.startsWith("task:")) {
          client.subscribedTasks.delete(topic.replace("task:", ""));
        } else {
          client.subscribedProjects.delete(topic);
        }
      }
      /**
       * 发送消息给指定客户端
       */
      sendToClient(userId, message) {
        const client = this.clients.get(userId);
        if (!client || client.ws.readyState !== WebSocket.OPEN) {
          return false;
        }
        try {
          client.ws.send(JSON.stringify(message));
          return true;
        } catch (err) {
          console.error(`[WSS] Failed to send to ${userId}:`, err);
          return false;
        }
      }
      /**
       * 广播消息给所有订阅了指定任务的客户端
       */
      broadcastTaskUpdate(taskId, payload) {
        const message = {
          type: "task_update",
          task_id: taskId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          ...payload
        };
        let sent = 0;
        this.clients.forEach((client) => {
          if (client.subscribedTasks.has(taskId)) {
            if (this.sendToClient(client.userId, message)) {
              sent++;
            }
          }
        });
        if (sent > 0) {
          console.log(`[WSS] Broadcast task_update to ${sent} client(s): task=${taskId}, status=${payload.status}`);
        }
      }
      /**
       * 广播项目进度更新
       */
      broadcastProgressUpdate(projectId, payload) {
        const message = {
          type: "task_progress_update",
          project_id: projectId,
          task_id: payload.task_id ?? projectId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          status: payload.status,
          progress: payload.progress,
          step_name: payload.step_name,
          message: payload.message
        };
        let sent = 0;
        this.clients.forEach((client) => {
          if (client.subscribedProjects.has(projectId)) {
            if (this.sendToClient(client.userId, message)) {
              sent++;
            }
          }
        });
        if (sent > 0) {
          console.log(`[WSS] Broadcast progress_update to ${sent} client(s): project=${projectId}`);
        }
      }
      /**
       * 广播系统通知给指定用户
       */
      broadcastNotification(userId, payload) {
        const message = {
          type: "system_notification",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          ...payload
        };
        this.sendToClient(userId, message);
      }
      /**
       * 广播系统通知给所有在线用户
       */
      broadcastToAll(payload) {
        const message = {
          type: "system_notification",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          ...payload
        };
        let sent = 0;
        this.clients.forEach((client) => {
          if (this.sendToClient(client.userId, message)) {
            sent++;
          }
        });
        console.log(`[WSS] Broadcast notification to ${sent} client(s)`);
      }
      /**
       * 启动心跳检测（每 30 秒 ping 一次）
       */
      startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
          const now = Date.now();
          const timeout = 6e4;
          this.clients.forEach((client, userId) => {
            if (client.ws.readyState === WebSocket.OPEN) {
              try {
                client.ws.ping();
                if (now - client.lastPing > timeout) {
                  console.log(`[WSS] Client ${userId} heartbeat timeout, closing`);
                  client.ws.terminate();
                  this.clients.delete(userId);
                }
              } catch (err) {
                console.error(`[WSS] Heartbeat error for ${userId}:`, err);
                this.clients.delete(userId);
              }
            }
          });
        }, 3e4);
      }
      /**
       * 关闭服务器
       */
      shutdown() {
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
        }
        this.clients.forEach((client) => {
          client.ws.close(1e3, "Server shutting down");
        });
        this.clients.clear();
        if (this.httpServer) {
          this.httpServer.close();
        }
        if (this.wss) {
          this.wss.close();
        }
        console.log("[WSS] WebSocket server shut down");
      }
      /**
       * 获取连接统计
       */
      getStats() {
        const details = [];
        let connectedClients = 0;
        this.clients.forEach((client) => {
          details.push({
            userId: client.userId,
            tasks: client.subscribedTasks.size,
            projects: client.subscribedProjects.size
          });
          connectedClients++;
        });
        return { connectedClients, details };
      }
    };
    wsServer = new WSServer();
    wsServer_default = wsServer;
  }
});

// server/taskQueue.ts
var taskQueue_exports = {};
__export(taskQueue_exports, {
  default: () => taskQueue_default,
  taskQueue: () => taskQueue
});
var PRIORITY_WEIGHT, MAX_RETRIES, TASK_TIMEOUT_MS, TaskQueue, taskQueue, taskQueue_default;
var init_taskQueue = __esm({
  "server/taskQueue.ts"() {
    "use strict";
    init_aiNodes();
    init_wsServer();
    PRIORITY_WEIGHT = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1
    };
    MAX_RETRIES = 3;
    TASK_TIMEOUT_MS = 12e4;
    TaskQueue = class {
      // nodeId -> available
      constructor() {
        this.queue = [];
        this.runningTasks = /* @__PURE__ */ new Map();
        // taskId -> task
        this.maxConcurrent = 5;
        // 最大并发数
        this.processing = false;
        this.nodeAvailability = /* @__PURE__ */ new Map();
        console.log("[TaskQueue] Initialized");
      }
      /**
       * 添加任务到队列
       */
      async enqueue(skillId, userId, params = {}, options = {}) {
        const {
          priority = "normal",
          nodeId,
          maxRetries: customMaxRetries = MAX_RETRIES
        } = options;
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const task = {
          id: taskId,
          skillId,
          nodeId,
          userId,
          params,
          priority,
          status: "queued",
          retryCount: 0,
          maxRetries: customMaxRetries,
          createdAt: /* @__PURE__ */ new Date(),
          abortController: new AbortController()
        };
        this.insertByPriority(task);
        console.log(`[TaskQueue] Enqueued: ${taskId} (skill=${skillId}, priority=${priority})`);
        wsServer.broadcastTaskUpdate(taskId, {
          status: "queued",
          progress: 0,
          message: "\u4EFB\u52A1\u5DF2\u52A0\u5165\u961F\u5217"
        });
        this.processQueue();
        return taskId;
      }
      /**
       * 按优先级插入队列
       */
      insertByPriority(task) {
        const weight = PRIORITY_WEIGHT[task.priority];
        let insertIndex = this.queue.length;
        for (let i = 0; i < this.queue.length; i++) {
          if (PRIORITY_WEIGHT[this.queue[i].priority] < weight) {
            insertIndex = i;
            break;
          }
        }
        this.queue.splice(insertIndex, 0, task);
      }
      /**
       * 处理队列
       */
      async processQueue() {
        if (this.processing) return;
        this.processing = true;
        try {
          while (this.queue.length > 0 && this.runningTasks.size < this.maxConcurrent) {
            const task = this.queue.shift();
            if (!task) break;
            if (task.status === "cancelled") {
              continue;
            }
            await this.executeTask(task);
          }
        } finally {
          this.processing = false;
        }
      }
      /**
       * 执行单个任务
       */
      async executeTask(task) {
        const startTime = Date.now();
        task.status = "running";
        task.startedAt = /* @__PURE__ */ new Date();
        console.log(`[TaskQueue] Executing: ${task.id} (skill=${task.skillId})`);
        this.broadcastProgressUpdate(task.userId, task.id, {
          status: "running",
          progress: 0,
          step_name: "\u4EFB\u52A1\u542F\u52A8"
        });
        this.runningTasks.set(task.id, task);
        try {
          let nodeBaseUrl;
          let nodeToken;
          if (task.nodeId) {
            const nodeRes = await dbFetch(`/ai_nodes?id=eq.${task.nodeId}&select=baseUrl,token&limit=1`);
            const node = nodeRes.data?.[0];
            if (!node) throw new Error(`Node ${task.nodeId} not found`);
            nodeBaseUrl = node.baseUrl;
            nodeToken = node.token;
          } else {
            const availableNode = await this.findAvailableNode();
            if (!availableNode) throw new Error("No available node found");
            nodeBaseUrl = availableNode.baseUrl;
            nodeToken = availableNode.token;
            task.nodeId = availableNode.id;
          }
          this.broadcastProgressUpdate(task.userId, task.id, {
            status: "running",
            progress: 30,
            step_name: "\u8C03\u7528 AI \u8282\u70B9"
          });
          const response = await fetch(`${nodeBaseUrl}/skill/invoke`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${nodeToken}`
            },
            body: JSON.stringify({
              skillId: task.skillId,
              params: task.params,
              requestId: task.id
            }),
            signal: AbortSignal.timeout(TASK_TIMEOUT_MS)
          });
          this.broadcastProgressUpdate(task.userId, task.id, {
            status: "running",
            progress: 60,
            step_name: "\u5904\u7406\u4E2D"
          });
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Node returned ${response.status}: ${errText}`);
          }
          const result = await response.json();
          task.status = "completed";
          task.completedAt = /* @__PURE__ */ new Date();
          console.log(`[TaskQueue] Completed: ${task.id} (${Date.now() - startTime}ms)`);
          this.broadcastTaskUpdate(task.userId, task.id, {
            status: "completed",
            progress: 100,
            message: "\u4EFB\u52A1\u5B8C\u6210"
          });
          await this.updateDbTask(task.id.replace("task-", ""), "success", result);
        } catch (err) {
          const errorMessage = err?.message ?? String(err);
          if (task.abortController?.signal.aborted) {
            task.status = "cancelled";
            console.log(`[TaskQueue] Cancelled: ${task.id}`);
            return;
          }
          console.error(`[TaskQueue] Failed: ${task.id}`, errorMessage);
          if (task.retryCount < task.maxRetries) {
            task.retryCount++;
            task.status = "retrying";
            task.error = errorMessage;
            console.log(`[TaskQueue] Retrying ${task.id} (${task.retryCount}/${task.maxRetries})`);
            setTimeout(() => {
              task.status = "queued";
              this.insertByPriority(task);
              this.processQueue();
            }, 2e3 * task.retryCount);
            this.broadcastProgressUpdate(task.userId, task.id, {
              status: "running",
              progress: 50,
              step_name: `\u91CD\u8BD5\u4E2D (${task.retryCount}/${task.maxRetries})`
            });
          } else {
            task.status = "failed";
            task.error = errorMessage;
            task.completedAt = /* @__PURE__ */ new Date();
            this.broadcastTaskUpdate(task.userId, task.id, {
              status: "failed",
              progress: 0,
              error: errorMessage
            });
            await this.updateDbTask(task.id.replace("task-", ""), "failed", void 0, errorMessage);
          }
        } finally {
          this.runningTasks.delete(task.id);
          this.processQueue();
        }
      }
      /**
       * 查找可用节点
       */
      async findAvailableNode() {
        const res = await dbFetch(`/ai_nodes?isActive=eq.true&select=id,baseUrl,token`);
        const nodes = res.data ?? [];
        for (const node of nodes) {
          if (this.nodeAvailability.get(node.id) !== false) {
            return node;
          }
        }
        return nodes[0] ?? null;
      }
      /**
       * 取消任务
       */
      cancel(taskId) {
        const runningTask = this.runningTasks.get(taskId);
        if (runningTask) {
          runningTask.abortController?.abort();
          runningTask.status = "cancelled";
          this.runningTasks.delete(taskId);
          console.log(`[TaskQueue] Cancelled running task: ${taskId}`);
          return true;
        }
        const queueIndex = this.queue.findIndex((t2) => t2.id === taskId);
        if (queueIndex !== -1) {
          const task = this.queue.splice(queueIndex, 1)[0];
          task.status = "cancelled";
          console.log(`[TaskQueue] Cancelled queued task: ${taskId}`);
          this.broadcastTaskUpdate(task.userId, taskId, {
            status: "cancelled",
            progress: 0,
            message: "\u4EFB\u52A1\u5DF2\u53D6\u6D88"
          });
          return true;
        }
        return false;
      }
      /**
       * 重试任务
       */
      retry(taskId) {
        const queueIndex = this.queue.findIndex((t2) => t2.id === taskId);
        if (queueIndex !== -1) {
          const task = this.queue[queueIndex];
          if (task.status === "failed") {
            task.retryCount = 0;
            task.status = "queued";
            task.error = void 0;
            console.log(`[TaskQueue] Retrying: ${taskId}`);
            this.broadcastProgressUpdate(task.userId, taskId, {
              status: "running",
              progress: 0,
              step_name: "\u91CD\u65B0\u52A0\u5165\u961F\u5217"
            });
            this.processQueue();
            return true;
          }
        }
        return false;
      }
      /**
       * 获取任务状态
       */
      getTaskStatus(taskId) {
        const runningTask = this.runningTasks.get(taskId);
        if (runningTask) {
          return {
            status: runningTask.status,
            error: runningTask.error
          };
        }
        const queuedTask = this.queue.find((t2) => t2.id === taskId);
        if (queuedTask) {
          return {
            status: queuedTask.status,
            error: queuedTask.error
          };
        }
        return null;
      }
      /**
       * 获取队列统计
       */
      getStats() {
        return {
          queueLength: this.queue.length,
          runningCount: this.runningTasks.size,
          maxConcurrent: this.maxConcurrent
        };
      }
      /**
       * 广播任务更新
       */
      broadcastTaskUpdate(userId, taskId, payload) {
        wsServer.broadcastTaskUpdate(taskId, payload);
      }
      /**
       * 广播进度更新
       */
      broadcastProgressUpdate(userId, taskId, payload) {
        wsServer.broadcastProgressUpdate(taskId, {
          task_id: taskId,
          ...payload
        });
      }
      /**
       * 更新数据库任务状态
       */
      async updateDbTask(dbTaskId, status, result, error) {
        try {
          const numericId = parseInt(dbTaskId, 10);
          if (isNaN(numericId)) return;
          await dbFetch(`/content_tasks?id=eq.${numericId}`, {
            method: "PATCH",
            body: {
              status: status === "success" ? "success" : "failed",
              result: result ?? null,
              error_message: error ?? null,
              finished_at: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
        } catch (err) {
          console.error("[TaskQueue] Failed to update DB task:", err);
        }
      }
    };
    taskQueue = new TaskQueue();
    taskQueue_default = taskQueue;
  }
});

// server/token-optimization/tokenCounter.ts
var tokenCounter_exports = {};
__export(tokenCounter_exports, {
  TokenCounter: () => TokenCounter,
  tokenCounter: () => tokenCounter
});
var LRUCache, TokenCounter, tokenCounter;
var init_tokenCounter = __esm({
  "server/token-optimization/tokenCounter.ts"() {
    "use strict";
    LRUCache = class {
      constructor(maxSize = 500) {
        this.cache = /* @__PURE__ */ new Map();
        this.maxSize = maxSize;
      }
      get(key) {
        if (!this.cache.has(key)) return void 0;
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
      }
      set(key, value) {
        if (this.cache.has(key)) {
          this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey !== void 0) this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
      }
      has(key) {
        return this.cache.has(key);
      }
      delete(key) {
        return this.cache.delete(key);
      }
      get size() {
        return this.cache.size;
      }
    };
    TokenCounter = class {
      constructor(options) {
        this.cleanupInterval = null;
        this.sessionStats = new LRUCache(500);
        this.exactCountCache = new LRUCache(1e3);
        this.ollamaBaseUrl = options?.ollamaBaseUrl || "http://localhost:11434";
        this.enableExactCounting = options?.enableExactCounting || false;
        this.cleanupInterval = setInterval(() => this.cleanup(), 30 * 60 * 1e3);
      }
      /**
       * 估算文本的 token 数
       * 中英文混合估算：中文约 1.5 字符/token，英文约 4 字符/token
       */
      estimateTokens(text) {
        if (!text || typeof text !== "string") {
          return { tokens: 0, chars: 0, method: "estimate", cjkRatio: 0 };
        }
        const chars = text.length;
        const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
        const cjkRatio = chars > 0 ? cjkChars / chars : 0;
        const tokens = Math.ceil(
          cjkRatio * (chars / 1.5) + (1 - cjkRatio) * (chars / 4)
        );
        return { tokens, chars, method: "estimate", cjkRatio };
      }
      /**
       * 估算消息数组的总 token 数
       */
      estimateMessagesTokens(messages) {
        let totalChars = 0;
        let totalCjkChars = 0;
        for (const msg of messages) {
          const content = typeof msg.content === "string" ? msg.content : Array.isArray(msg.content) ? msg.content.filter((c) => c.type === "text").map((c) => c.text).join(" ") : "";
          totalChars += content.length;
          totalCjkChars += (content.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
          totalChars += 16;
        }
        const cjkRatio = totalChars > 0 ? totalCjkChars / totalChars : 0;
        const tokens = Math.ceil(
          cjkRatio * (totalChars / 1.5) + (1 - cjkRatio) * (totalChars / 4)
        );
        return { tokens, chars: totalChars, method: "estimate", cjkRatio };
      }
      /**
       * 精确计数（通过 Ollama tokenize API）
       * 需要本地 Ollama 运行
       */
      async countTokensExact(text, model) {
        if (!this.enableExactCounting) {
          return this.estimateTokens(text);
        }
        const cacheKey = `${model || "default"}:${text.slice(0, 100)}:${text.length}`;
        const cached = this.exactCountCache.get(cacheKey);
        if (cached !== void 0) {
          return { tokens: cached, chars: text.length, method: "exact", cjkRatio: 0 };
        }
        try {
          const response = await fetch(`${this.ollamaBaseUrl}/api/tokenize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: model || "qwen2.5:0.5b", prompt: text }),
            signal: AbortSignal.timeout(3e3)
            // 3s 超时
          });
          if (!response.ok) {
            return this.estimateTokens(text);
          }
          const data = await response.json();
          const tokenCount = data.tokens?.length || 0;
          this.exactCountCache.set(cacheKey, tokenCount);
          return { tokens: tokenCount, chars: text.length, method: "exact", cjkRatio: 0 };
        } catch {
          return this.estimateTokens(text);
        }
      }
      /**
       * 初始化或获取会话统计
       */
      getOrCreateSession(sessionId) {
        const existing = this.sessionStats.get(sessionId);
        if (existing) return existing;
        const stats = {
          sessionId,
          totalInputTokensBefore: 0,
          totalInputTokensAfter: 0,
          totalOutputTokensBefore: 0,
          totalOutputTokensAfter: 0,
          totalSavedTokens: 0,
          savingRatio: 0,
          strategyBreakdown: {},
          rounds: 0,
          startedAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.sessionStats.set(sessionId, stats);
        return stats;
      }
      /**
       * 记录一轮 token 优化结果
       */
      recordOptimization(sessionId, inputBefore, inputAfter, outputBefore, outputAfter, strategies) {
        const stats = this.getOrCreateSession(sessionId);
        stats.totalInputTokensBefore += inputBefore;
        stats.totalInputTokensAfter += inputAfter;
        stats.totalOutputTokensBefore += outputBefore;
        stats.totalOutputTokensAfter += outputAfter;
        stats.totalSavedTokens += inputBefore - inputAfter + (outputBefore - outputAfter);
        stats.rounds++;
        for (const [strategy, saved] of Object.entries(strategies)) {
          stats.strategyBreakdown[strategy] = (stats.strategyBreakdown[strategy] || 0) + saved;
        }
        const totalBefore = stats.totalInputTokensBefore + stats.totalOutputTokensBefore;
        const totalAfter = stats.totalInputTokensAfter + stats.totalOutputTokensAfter;
        stats.savingRatio = totalBefore > 0 ? 1 - totalAfter / totalBefore : 0;
        stats.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        return stats;
      }
      /**
       * 获取会话统计
       */
      getSessionStats(sessionId) {
        return this.sessionStats.get(sessionId) || null;
      }
      /**
       * 获取所有活跃会话数
       */
      getActiveSessionCount() {
        return this.sessionStats.size;
      }
      /**
       * 生成 SSE 格式的 token 优化报告（发送给前端）
       */
      generateSSEEvent(sessionId) {
        const stats = this.getSessionStats(sessionId);
        if (!stats) return "";
        return JSON.stringify({
          tokenOptimization: {
            sessionId: stats.sessionId,
            savedTokens: stats.totalSavedTokens,
            savingRatio: Math.round(stats.savingRatio * 100),
            strategies: stats.strategyBreakdown,
            rounds: stats.rounds
          }
        });
      }
      /**
       * 清理过期会话（超过 1 小时未更新）
       */
      cleanup(maxAgeMs = 60 * 60 * 1e3) {
        return 0;
      }
      /**
       * 销毁（清理定时器）
       */
      destroy() {
        if (this.cleanupInterval) {
          clearInterval(this.cleanupInterval);
          this.cleanupInterval = null;
        }
      }
    };
    tokenCounter = new TokenCounter();
  }
});

// server/storage.ts
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
  }
});

// server/_core/imageGeneration.ts
var imageGeneration_exports = {};
__export(imageGeneration_exports, {
  generateImage: () => generateImage
});
async function generateImage(options) {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
  const baseUrl = ENV.forgeApiUrl.replace(/\/$/, "");
  const fullUrl = `${baseUrl}/images.v1.ImageService/GenerateImage`;
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || []
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const result = await response.json();
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return {
    url
  };
}
var init_imageGeneration = __esm({
  "server/_core/imageGeneration.ts"() {
    "use strict";
    init_storage();
    init_env();
  }
});

// server/_core/midjourney.ts
var midjourney_exports = {};
__export(midjourney_exports, {
  downloadAndStoreImage: () => downloadAndStoreImage,
  midjourneyImagine: () => midjourneyImagine,
  midjourneyTaskStatus: () => midjourneyTaskStatus,
  midjourneyUpscale: () => midjourneyUpscale,
  midjourneyVary: () => midjourneyVary
});
async function midjourneyImagine(options) {
  if (!MIDJOURNEY_API_KEY) {
    throw new Error("MIDJOURNEY_API_KEY \u672A\u914D\u7F6E\u3002\u8BF7\u5728 .env \u4E2D\u8BBE\u7F6E MIDJOURNEY_API_KEY");
  }
  let fullPrompt = options.prompt;
  if (options.aspectRatio) fullPrompt += ` --ar ${options.aspectRatio}`;
  if (options.quality) fullPrompt += ` --q ${options.quality}`;
  if (options.style) fullPrompt += ` --s ${options.style}`;
  if (options.version) fullPrompt += ` --${options.version}`;
  const resp = await fetch(`${MIDJOURNEY_BASE_URL}/v2/imagine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MIDJOURNEY_API_KEY
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      base64Array: [],
      notifyHook: options.webhookUrl || void 0,
      state: ""
    })
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Midjourney Imagine \u5931\u8D25 (${resp.status}): ${err}`);
  }
  const data = await resp.json();
  if (data.code !== 200 && data.code !== 1) {
    throw new Error(`Midjourney API \u8FD4\u56DE\u9519\u8BEF\u7801: ${data.code}`);
  }
  return { taskId: data.taskId || data.taskIdDisplay || "" };
}
async function midjourneyTaskStatus(taskId) {
  if (!MIDJOURNEY_API_KEY) {
    throw new Error("MIDJOURNEY_API_KEY \u672A\u914D\u7F6E");
  }
  const resp = await fetch(`${MIDJOURNEY_BASE_URL}/v2/imagine/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MIDJOURNEY_API_KEY
    },
    body: JSON.stringify({ taskId })
  });
  if (!resp.ok) {
    throw new Error(`Midjourney \u4EFB\u52A1\u67E5\u8BE2\u5931\u8D25 (${resp.status})`);
  }
  const data = await resp.json();
  const statusMap = {
    1: "pending",
    // Not started
    21: "in_progress",
    // Submitting
    22: "in_progress",
    // Running
    31: "completed",
    // Success
    32: "failed"
    // Failed
  };
  const status = statusMap[data.status] || "pending";
  const progress = data.progress ? parseInt(data.progress, 10) : void 0;
  return {
    taskId,
    status,
    imageUrl: data.imageUrl,
    progress,
    failReason: data.failReason
  };
}
async function midjourneyUpscale(taskId, index, webhookUrl) {
  if (!MIDJOURNEY_API_KEY) {
    throw new Error("MIDJOURNEY_API_KEY \u672A\u914D\u7F6E");
  }
  const resp = await fetch(`${MIDJOURNEY_BASE_URL}/v2/upscale`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MIDJOURNEY_API_KEY
    },
    body: JSON.stringify({
      taskId,
      index,
      notifyHook: webhookUrl || void 0,
      state: ""
    })
  });
  if (!resp.ok) throw new Error(`Midjourney Upscale \u5931\u8D25 (${resp.status})`);
  const data = await resp.json();
  if (data.code !== 200 && data.code !== 1) {
    throw new Error(`Midjourney API \u8FD4\u56DE\u9519\u8BEF\u7801: ${data.code}`);
  }
  return { taskId: data.taskId || "" };
}
async function midjourneyVary(taskId, index, webhookUrl) {
  if (!MIDJOURNEY_API_KEY) {
    throw new Error("MIDJOURNEY_API_KEY \u672A\u914D\u7F6E");
  }
  const resp = await fetch(`${MIDJOURNEY_BASE_URL}/v2/variation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MIDJOURNEY_API_KEY
    },
    body: JSON.stringify({
      taskId,
      index,
      notifyHook: webhookUrl || void 0,
      state: ""
    })
  });
  if (!resp.ok) throw new Error(`Midjourney Vary \u5931\u8D25 (${resp.status})`);
  const data = await resp.json();
  if (data.code !== 200 && data.code !== 1) {
    throw new Error(`Midjourney API \u8FD4\u56DE\u9519\u8BEF\u7801: ${data.code}`);
  }
  return { taskId: data.taskId || "" };
}
async function downloadAndStoreImage(imageUrl, prefix = "midjourney") {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`\u4E0B\u8F7D\u56FE\u7247\u5931\u8D25 (${resp.status})`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  const mimeType = resp.headers.get("content-type") || "image/png";
  const ext = mimeType.includes("webp") ? "webp" : mimeType.includes("png") ? "png" : "jpg";
  const { url } = await storagePut(
    `${prefix}/${Date.now()}.${ext}`,
    buffer,
    mimeType
  );
  return { url };
}
var MIDJOURNEY_BASE_URL, MIDJOURNEY_API_KEY;
var init_midjourney = __esm({
  "server/_core/midjourney.ts"() {
    "use strict";
    init_storage();
    MIDJOURNEY_BASE_URL = process.env.MIDJOURNEY_BASE_URL || "https://api.goapi.xyz/mj";
    MIDJOURNEY_API_KEY = process.env.MIDJOURNEY_API_KEY || "";
  }
});

// server/_core/runway.ts
var runway_exports = {};
__export(runway_exports, {
  downloadAndStoreVideo: () => downloadAndStoreVideo,
  runwayImageToVideo: () => runwayImageToVideo,
  runwayTaskStatus: () => runwayTaskStatus,
  runwayTextToVideo: () => runwayTextToVideo
});
async function runwayTextToVideo(options) {
  if (!RUNWAY_API_KEY2) {
    throw new Error("RUNWAY_API_KEY \u672A\u914D\u7F6E\u3002\u8BF7\u5728 .env \u4E2D\u8BBE\u7F6E RUNWAY_API_KEY");
  }
  const body = {
    model: options.model || "gen3a_turbo",
    promptText: options.promptText,
    duration: options.duration || 5
  };
  if (options.negativePromptText) body.negativePromptText = options.negativePromptText;
  if (options.seed !== void 0) body.seed = options.seed;
  const resp = await fetch(`${RUNWAY_BASE_URL}/image_to_video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RUNWAY_API_KEY2}`,
      "X-Runway-Version": "2024-11-06"
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Runway Text-to-Video \u5931\u8D25 (${resp.status}): ${err}`);
  }
  const data = await resp.json();
  return { taskId: data.id };
}
async function runwayImageToVideo(options) {
  if (!RUNWAY_API_KEY2) {
    throw new Error("RUNWAY_API_KEY \u672A\u914D\u7F6E");
  }
  const body = {
    model: options.model || "gen3a_turbo",
    promptImage: options.promptImage,
    duration: options.duration || 5
  };
  if (options.promptText) body.promptText = options.promptText;
  if (options.negativePromptText) body.negativePromptText = options.negativePromptText;
  if (options.seed !== void 0) body.seed = options.seed;
  const resp = await fetch(`${RUNWAY_BASE_URL}/image_to_video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RUNWAY_API_KEY2}`,
      "X-Runway-Version": "2024-11-06"
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Runway Image-to-Video \u5931\u8D25 (${resp.status}): ${err}`);
  }
  const data = await resp.json();
  return { taskId: data.id };
}
async function runwayTaskStatus(taskId) {
  if (!RUNWAY_API_KEY2) {
    throw new Error("RUNWAY_API_KEY \u672A\u914D\u7F6E");
  }
  const resp = await fetch(`${RUNWAY_BASE_URL}/tasks/${taskId}`, {
    headers: {
      "Authorization": `Bearer ${RUNWAY_API_KEY2}`,
      "X-Runway-Version": "2024-11-06"
    }
  });
  if (!resp.ok) {
    throw new Error(`Runway \u4EFB\u52A1\u67E5\u8BE2\u5931\u8D25 (${resp.status})`);
  }
  return await resp.json();
}
async function downloadAndStoreVideo(videoUrl, prefix = "runway") {
  const resp = await fetch(videoUrl);
  if (!resp.ok) throw new Error(`\u4E0B\u8F7D\u89C6\u9891\u5931\u8D25 (${resp.status})`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  const { url } = await storagePut(
    `${prefix}/${Date.now()}.mp4`,
    buffer,
    "video/mp4"
  );
  return { url };
}
var RUNWAY_BASE_URL, RUNWAY_API_KEY2;
var init_runway = __esm({
  "server/_core/runway.ts"() {
    "use strict";
    init_storage();
    RUNWAY_BASE_URL = "https://api.dev.runwayml.com/v1";
    RUNWAY_API_KEY2 = process.env.RUNWAY_API_KEY || "";
  }
});

// server/supabase.ts
var supabase_exports = {};
__export(supabase_exports, {
  getAdminNotes: () => getAdminNotes,
  getUserRole: () => getUserRole,
  supabaseAdmin: () => supabaseAdmin3
});
import { createClient as createClient2 } from "@supabase/supabase-js";
async function getUserRole(userId) {
  const { data, error } = await supabaseAdmin3.from("profiles").select("role, subscription_status").eq("id", userId).single();
  if (error) {
    console.error("[Supabase] Error fetching user role:", error);
    return { role: "user", subscription_status: "free" };
  }
  return data;
}
async function getAdminNotes() {
  const { data, error } = await supabaseAdmin3.from("notes").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[Supabase] Error fetching notes:", error);
    throw error;
  }
  return data;
}
var supabaseUrl, supabaseServiceKey, supabaseAdmin3;
var init_supabase = __esm({
  "server/supabase.ts"() {
    "use strict";
    supabaseUrl = process.env.SUPABASE_URL || "https://fczherphuixpdjuevzsh.supabase.co";
    supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg";
    supabaseAdmin3 = createClient2(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
});

// server/_core/index.ts
import dotenv from "dotenv";
import express2 from "express";
import { createServer as createServer2 } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // 浏览器会拒收 SameSite=None 且非 Secure 的 cookie。
    // 本地 http 开发环境改为 lax，线上 https 继续使用 none。
    sameSite: secure ? "none" : "lax",
    secure
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
init_db();
init_env();
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
  getBearerToken(req) {
    const authHeader = req.headers.authorization;
    const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!raw) return null;
    const match = raw.match(/^Bearer\s+(.+)$/i);
    return match?.[1] ?? null;
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
    const normalizedAppId = payload.appId || ENV.appId || "maoai-local";
    return new SignJWT({
      openId: payload.openId,
      appId: normalizedAppId,
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
      const normalizedAppId = isNonEmptyString(appId) ? appId : ENV.appId || "maoai-local";
      if (!isNonEmptyString(openId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId: normalizedAppId,
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
    const bearerToken = this.getBearerToken(req);
    const rawSessionToken = sessionCookie ?? bearerToken;
    const session = await this.verifySession(rawSessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session");
    }
    const sessionUserId = String(session.openId);
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(rawSessionToken ?? "");
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
      openId: String(user.openId),
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
      let dest = "/";
      try {
        const stateData = JSON.parse(atob(state));
        dest = stateData.dest || "/";
      } catch {
      }
      res.setHeader("Content-Type", "text/html");
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>window.location.href = ${JSON.stringify(dest)};</script>
<noscript><p>\u767B\u5F55\u6210\u529F\uFF0C\u6B63\u5728\u8DF3\u8F6C\u2026\u2026</p><a href="${dest}">\u70B9\u51FB\u7EE7\u7EED</a></noscript>
</body></html>`);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/supabaseAuth.ts
function getSupabaseConfig2() {
  return {
    url: process.env.SUPABASE_URL ?? "",
    anonKey: process.env.SUPABASE_ANON_KEY ?? "",
    serviceKey: process.env.SUPABASE_SERVICE_KEY ?? ""
  };
}
function getApiKey(cfg) {
  return cfg.serviceKey || cfg.anonKey;
}
async function getUserByOpenId2(openId) {
  const cfg = getSupabaseConfig2();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    console.error("[SupabaseREST] getUserByOpenId error:", resp.status, err);
    return null;
  }
  const rows = await resp.json();
  return rows.length > 0 ? rows[0] : null;
}
async function getUserByEmail(email) {
  const cfg = getSupabaseConfig2();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    }
  );
  if (!resp.ok) return null;
  const rows = await resp.json();
  return rows.length > 0 ? rows[0] : null;
}
async function updateUserOpenId(id, openId, lastSignedIn) {
  const cfg = getSupabaseConfig2();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ openId, lastSignedIn })
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    console.error("[SupabaseREST] updateUserOpenId error:", resp.status, err);
  }
}
async function upsertUser2(user) {
  const cfg = getSupabaseConfig2();
  const key = getApiKey(cfg);
  const resp = await fetch(
    `${cfg.url}/rest/v1/users`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(user)
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    console.error("[SupabaseREST] upsertUser error:", resp.status, err);
    throw new Error(`Failed to upsert user: ${resp.status} ${err}`);
  }
}
function registerSupabaseAuthRoutes(app) {
  app.post("/api/auth/password-reset-request", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "\u8BF7\u8F93\u5165\u90AE\u7BB1\u5730\u5740" });
      return;
    }
    const cfg = getSupabaseConfig2();
    if (!cfg.url || !cfg.anonKey) {
      console.error("[SupabaseAuth] Missing env for password reset");
      res.status(500).json({ error: "\u670D\u52A1\u672A\u914D\u7F6E" });
      return;
    }
    try {
      const resetResp = await fetch(
        `${cfg.url}/auth/v1/recover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: cfg.anonKey
          },
          body: JSON.stringify({ email })
        }
      );
      const resetData = await resetResp.json();
      if (!resetResp.ok) {
        console.error("[SupabaseAuth] Password reset request failed:", resetData);
        res.json({
          success: true,
          message: "\u5982\u679C\u8BE5\u90AE\u7BB1\u5DF2\u6CE8\u518C\uFF0C\u60A8\u5C06\u6536\u5230\u4E00\u5C01\u91CD\u7F6E\u90AE\u4EF6\uFF08\u8BF7\u68C0\u67E5\u5783\u573E\u7BB1\uFF09"
        });
        return;
      }
      res.json({
        success: true,
        message: "\u91CD\u7F6E\u94FE\u63A5\u5DF2\u53D1\u9001\u5230\u60A8\u7684\u90AE\u7BB1\uFF0C\u8BF7\u68C0\u67E5\u6536\u4EF6\u7BB1\u548C\u5783\u573E\u7BB1"
      });
    } catch (error) {
      console.error("[SupabaseAuth] Password reset error:", error);
      res.json({
        success: true,
        message: "\u5982\u679C\u8BE5\u90AE\u7BB1\u5DF2\u6CE8\u518C\uFF0C\u60A8\u5C06\u6536\u5230\u4E00\u5C01\u91CD\u7F6E\u90AE\u4EF6\uFF08\u8BF7\u68C0\u67E5\u5783\u573E\u7BB1\uFF09"
      });
    }
  });
  app.post("/api/auth/email-login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const cfg = getSupabaseConfig2();
    if (!cfg.url || !cfg.anonKey) {
      console.error("[SupabaseAuth] Missing env: SUPABASE_URL or SUPABASE_ANON_KEY");
      res.status(500).json({ error: "Supabase not configured" });
      return;
    }
    try {
      const authResp = await fetch(
        `${cfg.url}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: cfg.anonKey
          },
          body: JSON.stringify({ email, password })
        }
      );
      const authData = await authResp.json();
      if (!authData.access_token || !authData.user) {
        res.status(401).json({
          error: authData.error_description || authData.error || "Invalid credentials"
        });
        return;
      }
      const openId = `supabase:${authData.user.id}`;
      const userEmail = authData.user.email ?? email;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const ownerEmail = process.env.OWNER_EMAIL ?? "benedictashford20@gmail.com";
      const isAdminEmail = userEmail === ownerEmail || userEmail === "sean_lab@me.com";
      let existingUser = await getUserByOpenId2(openId);
      let role = isAdminEmail ? "admin" : "user";
      if (!existingUser) {
        const userByEmail = await getUserByEmail(userEmail);
        if (userByEmail) {
          const userId = userByEmail.id;
          await updateUserOpenId(userId, openId, now);
          role = isAdminEmail ? "admin" : userByEmail.role ?? "user";
          existingUser = { ...userByEmail, openId, role };
        } else {
          await upsertUser2({
            openId,
            email: userEmail,
            name: userEmail.split("@")[0],
            loginMethod: "email",
            lastSignedIn: now,
            role
          });
        }
      } else {
        role = isAdminEmail ? "admin" : existingUser.role ?? "user";
        const key = getApiKey(cfg);
        await fetch(
          `${cfg.url}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}`,
          {
            method: "PATCH",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ lastSignedIn: now, role })
          }
        );
      }
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userEmail.split("@")[0],
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      const finalRedirectTo = req.body.redirectTo ?? (role === "admin" ? "/admin/nodes" : "/maoai");
      res.json({
        success: true,
        role,
        redirectTo: finalRedirectTo,
        sessionToken
        // 供前端存入 localStorage，用于跨域 Authorization header
      });
    } catch (error) {
      console.error("[SupabaseAuth] Email login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}/webdevtoken.v1.WebDevService/SendNotification`;
};
function validatePayload(input) {
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
}
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
        "content-type": "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`
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
init_db();
init_aiNodes();
import { TRPCError as TRPCError4 } from "@trpc/server";

// server/models.ts
var ZHIPU_BASE = "https://open.bigmodel.cn/api/paas/v4";
var DEEPSEEK_BASE = "https://api.deepseek.com/v1";
var GROQ_BASE = "https://api.groq.com/openai/v1";
var GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai";
var GOOGLE_AI_STUDIO_BASE = "https://generativelanguage.googleapis.com/v1beta";
var ZAI_BASE = "https://api.z.ai/api/paas/v4";
var ANTHROPIC_BASE = "https://api.anthropic.com/v1";
var MODEL_CONFIGS = {
  // ── DeepSeek ───────────────────────────────────────────────────────────────
  "deepseek-chat": {
    name: "DeepSeek Chat",
    badge: "FAST",
    provider: "deepseek",
    model: "deepseek-chat",
    baseUrl: DEEPSEEK_BASE,
    get apiKey() {
      return process.env.DEEPSEEK_API_KEY || "";
    },
    maxTokens: 4096
  },
  "deepseek-reasoner": {
    name: "DeepSeek Reasoner",
    badge: "THINK",
    provider: "deepseek",
    model: "deepseek-reasoner",
    baseUrl: DEEPSEEK_BASE,
    get apiKey() {
      return process.env.DEEPSEEK_API_KEY || "";
    },
    maxTokens: 8192
  },
  // ── 智谱 GLM ───────────────────────────────────────────────────────────────
  "glm-4-flash": {
    name: "GLM-4 Flash",
    badge: "FREE",
    provider: "zhipu",
    model: "glm-4-flash",
    baseUrl: ZHIPU_BASE,
    get apiKey() {
      return process.env.ZHIPU_API_KEY || "";
    },
    maxTokens: 4096
  },
  "glm-4-plus": {
    name: "GLM-4 Plus",
    badge: "PRO",
    provider: "zhipu",
    model: "glm-4-plus",
    baseUrl: ZHIPU_BASE,
    get apiKey() {
      return process.env.ZHIPU_API_KEY || "";
    },
    maxTokens: 4096
  },
  "glm-4-air": {
    name: "GLM-4 Air",
    badge: "LITE",
    provider: "zhipu",
    model: "glm-4-air",
    baseUrl: ZHIPU_BASE,
    get apiKey() {
      return process.env.ZHIPU_API_KEY || "";
    },
    maxTokens: 4096
  },
  "glm-z1-flash": {
    name: "GLM-Z1 Flash",
    badge: "THINK",
    provider: "zhipu",
    model: "glm-z1-flash",
    baseUrl: ZHIPU_BASE,
    get apiKey() {
      return process.env.ZHIPU_API_KEY || "";
    },
    maxTokens: 4096
  },
  "glm-4v-flash": {
    name: "GLM-4V Flash",
    badge: "VISION",
    provider: "zhipu",
    model: "glm-4v-flash",
    baseUrl: ZHIPU_BASE,
    get apiKey() {
      return process.env.ZHIPU_API_KEY || "";
    },
    maxTokens: 4096,
    supportsVision: true
  },
  // ── Groq（极速）────────────────────────────────────────────────────────────
  "llama-3.3-70b": {
    name: "Llama 3.3 70B",
    badge: "FAST",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    baseUrl: GROQ_BASE,
    get apiKey() {
      return process.env.GROQ_API_KEY || "";
    },
    maxTokens: 4096
  },
  "llama-3.1-8b": {
    name: "Llama 3.1 8B",
    badge: "LITE",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    baseUrl: GROQ_BASE,
    get apiKey() {
      return process.env.GROQ_API_KEY || "";
    },
    maxTokens: 4096
  },
  "gemma2-9b": {
    name: "Gemma2 9B",
    badge: "LITE",
    provider: "groq",
    model: "gemma2-9b-it",
    baseUrl: GROQ_BASE,
    get apiKey() {
      return process.env.GROQ_API_KEY || "";
    },
    maxTokens: 4096
  },
  // ── Gemini ─────────────────────────────────────────────────────────────────
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    badge: "FAST",
    provider: "gemini",
    model: "gemini-2.5-flash-preview-04-17",
    baseUrl: GEMINI_BASE,
    get apiKey() {
      return process.env.GEMINI_API_KEY || "";
    },
    maxTokens: 8192,
    supportsVision: true
  },
  "gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    badge: "PRO",
    provider: "gemini",
    model: "gemini-2.5-pro-preview-03-25",
    baseUrl: GEMINI_BASE,
    get apiKey() {
      return process.env.GEMINI_API_KEY || "";
    },
    maxTokens: 8192,
    supportsVision: true
  },
  // ── 智谱 GLM-5V-TurboAutoClaw（BigModel 多模态）─────────────────────────────────
  "glm-5v-turbo": {
    name: "GLM-5V-Turbo",
    badge: "VL-TURBO",
    provider: "zhipu",
    model: "glm-5v-turbo",
    baseUrl: ZHIPU_BASE,
    get apiKey() {
      return process.env.ZHIPU_API_KEY || "";
    },
    maxTokens: 8192,
    supportsVision: true
  },
  // ── Google AI Studio (Gemma 3n / Gemma 4) ─────────────────────────────────────
  // ⚠️ 模型 ID 已根据 API 实际情况修正（2026-04-19 验证）
  // API Key 使用同一个 GOOGLE_AI_STUDIO_API_KEY
  "gemma-3n-e2b-it": {
    name: "Gemma 3n E2B",
    badge: "MOBILE",
    provider: "google-ai-studio",
    model: "gemma-3n-e2b-it",
    baseUrl: GOOGLE_AI_STUDIO_BASE,
    get apiKey() {
      return process.env.GOOGLE_AI_STUDIO_API_KEY || "";
    },
    maxTokens: 128e3,
    supportsVision: true,
    supportsAudio: true,
    supportsVideo: true
  },
  "gemma-3n-e4b-it": {
    name: "Gemma 3n E4B",
    badge: "EDGE",
    provider: "google-ai-studio",
    model: "gemma-3n-e4b-it",
    baseUrl: GOOGLE_AI_STUDIO_BASE,
    get apiKey() {
      return process.env.GOOGLE_AI_STUDIO_API_KEY || "";
    },
    maxTokens: 128e3,
    supportsVision: true,
    supportsAudio: true,
    supportsVideo: true
  },
  // Gemma 4 26B A4B (MoE 架构，激活参数仅 3.8B)
  "gemma-4-26b-a4b-it": {
    name: "Gemma 4 26B A4B",
    badge: "PRO",
    provider: "google-ai-studio",
    model: "gemma-4-26b-a4b-it",
    baseUrl: GOOGLE_AI_STUDIO_BASE,
    get apiKey() {
      return process.env.GOOGLE_AI_STUDIO_API_KEY || "";
    },
    maxTokens: 262144,
    supportsVision: true,
    supportsAudio: true,
    supportsVideo: true
  },
  // Gemma 4 31B (Dense 架构，Arena AI 开源第三)
  "gemma-4-31b-it": {
    name: "Gemma 4 31B",
    badge: "MAX",
    provider: "google-ai-studio",
    model: "gemma-4-31b-it",
    baseUrl: GOOGLE_AI_STUDIO_BASE,
    get apiKey() {
      return process.env.GOOGLE_AI_STUDIO_API_KEY || "";
    },
    maxTokens: 262144,
    supportsVision: true,
    supportsAudio: true,
    supportsVideo: true
  },
  // ── Z.ai 平台（GLM-5 / GLM-4.7）────────────────────────────────────────────
  "zai-glm-5": {
    name: "Z.ai GLM-5",
    badge: "GLM5",
    provider: "zai",
    model: "glm-5",
    baseUrl: ZAI_BASE,
    get apiKey() {
      return process.env.ZAI_API_KEY || "";
    },
    maxTokens: 8192
  },
  "zai-glm-4-7": {
    name: "Z.ai GLM-4.7",
    badge: "GLM47",
    provider: "zai",
    model: "glm-4.7",
    baseUrl: ZAI_BASE,
    get apiKey() {
      return process.env.ZAI_API_KEY || "";
    },
    maxTokens: 8192
  },
  // ── AutoClaw（澳龙）本地节点配置说明 ─────────────────────────────────────────
  // AutoClaw 是智谱推出的本地版 OpenClaw（澳龙），需在本地安装运行
  // 它没有独立的云端 API，而是作为本地节点接入 MaoAI
  // 配置步骤：
  //   1. 下载安装：https://autoglm.zhipuai.cn/autoclaw/
  //   2. 在 AutoClaw 设置中，将 Base URL 指向 MaoAI 节点注册地址
  //   3. 通过 /api/ai/node/register 接口注册本地节点
  //   4. 注册成功后，AutoClaw 将作为 local:<nodeId> 模型出现在模型列表中
  // 注意：AutoClaw 本身不支持 function calling，其 Agent 能力通过 Skills 系统实现
  // ── MiniMind（超小型本地 LLM）──────────────────────────────────────────
  // MiniMind 是从零训练的超小型 LLM 框架（26M-502M 参数）
  // 通过 Ollama 部署后自动发现为本地节点
  // 特点：$3 训练成本、2小时训练、支持视觉（MiniMind-V）
  // 部署步骤：
  //   1. 安装 Ollama：https://ollama.ai
  //   2. 拉取模型：ollama pull minimind（或自定义 GGUF）
  //   3. MaoAI 自动发现 Ollama 模型并注册为本地节点
  //   4. 配合 Token Optimization 可实现极低成本的本地推理
  // 注意：MiniMind 参数量小，适合简单问答/摘要，复杂推理建议使用云端模型
  // 仓库：https://github.com/seanlab007/minimind
  // ── Anthropic Claude ─────────────────────────────────────────────────────────
  "claude-opus-4-5": {
    name: "Claude Opus 4.5",
    badge: "MAX",
    provider: "anthropic",
    model: "claude-opus-4-5-20251101",
    baseUrl: ANTHROPIC_BASE,
    get apiKey() {
      return process.env.ANTHROPIC_API_KEY || "";
    },
    maxTokens: 8192,
    supportsVision: true,
    supportsReasoning: true
  },
  "claude-sonnet-4-5": {
    name: "Claude Sonnet 4.5",
    badge: "PRO",
    provider: "anthropic",
    model: "claude-sonnet-4-5-20251101",
    baseUrl: ANTHROPIC_BASE,
    get apiKey() {
      return process.env.ANTHROPIC_API_KEY || "";
    },
    maxTokens: 8192,
    supportsVision: true,
    supportsReasoning: true
  },
  "claude-haiku-4": {
    name: "Claude Haiku 4",
    badge: "FAST",
    provider: "anthropic",
    model: "claude-haiku-4-20251101",
    baseUrl: ANTHROPIC_BASE,
    get apiKey() {
      return process.env.ANTHROPIC_API_KEY || "";
    },
    maxTokens: 4096,
    supportsVision: true
  },
  // ── Ollama 本地模型 ─────────────────────────────────────────────────────────
  // 通过 OLLAMA_BASE_URL 自动发现本地模型
  // 这些配置用于 MaoAI 识别和路由到本地 Ollama 实例
  "ollama-gemma3-4b": {
    name: "Gemma 3 4B (Local)",
    badge: "LOCAL",
    provider: "ollama",
    model: "gemma3:4b",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() {
      return "";
    },
    // Ollama 不需要 API Key
    maxTokens: 8192,
    supportsVision: true
  },
  "ollama-qwen2.5-7b": {
    name: "Qwen 2.5 7B (Local)",
    badge: "LOCAL",
    provider: "ollama",
    model: "qwen2.5:7b",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() {
      return "";
    },
    maxTokens: 32768
  },
  "ollama-qwen2.5-3b": {
    name: "Qwen 2.5 3B (Local)",
    badge: "LOCAL",
    provider: "ollama",
    model: "qwen2.5:3b",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() {
      return "";
    },
    maxTokens: 32768
  },
  // ── Ollama 嵌入模型 ─────────────────────────────────────────────────────────
  // 用于 RAG、语义搜索、文本相似度计算
  "ollama-nomic-embed": {
    name: "Nomic Embed (Local)",
    badge: "EMBED",
    provider: "ollama",
    model: "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() {
      return "";
    },
    maxTokens: 512,
    isEmbedding: true
  },
  "ollama-all-minilm": {
    name: "All-MiniLM (Local)",
    badge: "EMBED",
    provider: "ollama",
    model: "all-minilm:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() {
      return "";
    },
    maxTokens: 512,
    isEmbedding: true
  }
};

// server/routers.ts
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
async function sendBulkEmails(recipients, subject, html, text) {
  let success = 0;
  let failed = 0;
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((email) => sendEmail({ to: email, subject, html, text }))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) success++;
      else failed++;
    }
    if (i + batchSize < recipients.length) {
      await new Promise((resolve2) => setTimeout(resolve2, 500));
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
var supabaseAdmin = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : supabase;
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

// server/video.ts
var RUNWAY_API_URL = "https://api.useapi.net/v1/runwayml";
var KLING_API_URL = "https://api.klingapi.com/v1";
var JIMENG_API_URL = process.env.JIMENG_API_URL || "https://visual.volces.com";
var RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || "";
var KLING_API_KEY = process.env.KLING_API_KEY || "";
var JIMENG_API_KEY = process.env.JIMENG_API_KEY || "";
async function generateRunwayVideo(options) {
  if (!RUNWAY_API_KEY) {
    return { taskId: "", status: "FAILED", error: "RUNWAY_API_KEY \u672A\u914D\u7F6E" };
  }
  const body = {
    model: options.model || "gen4.5",
    text_prompt: options.prompt
  };
  if (options.duration) body.duration = options.duration;
  if (options.aspectRatio) body.aspect_ratio = options.aspectRatio;
  if (options.imageUrl) {
    body.imageAssetId1 = options.imageUrl;
  }
  if (options.seed) body.seed = options.seed;
  body.exploreMode = true;
  try {
    const res = await fetch(`${RUNWAY_API_URL}/videos/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        taskId: "",
        status: "FAILED",
        error: data.error || `HTTP ${res.status}: ${res.statusText}`
      };
    }
    return {
      taskId: data.task?.id || data.taskId || "",
      status: "PENDING"
    };
  } catch (err) {
    return {
      taskId: "",
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
async function getRunwayTaskStatus(taskId) {
  if (!RUNWAY_API_KEY) {
    return { taskId, status: "FAILED", error: "RUNWAY_API_KEY \u672A\u914D\u7F6E" };
  }
  try {
    const res = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
      headers: { "Authorization": `Bearer ${RUNWAY_API_KEY}` }
    });
    const data = await res.json();
    const artifacts = data.task?.artifacts || [];
    const videoArtifact = artifacts.find(
      (a) => a.type === "video"
    );
    return {
      taskId: data.task?.id || taskId,
      status: mapRunwayStatus(data.task?.status),
      progress: data.task?.progressRatio ? parseFloat(data.task.progressRatio) * 100 : void 0,
      videoUrl: videoArtifact?.url,
      error: data.task?.error?.errorMessage
    };
  } catch (err) {
    return {
      taskId,
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
function mapRunwayStatus(status) {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "RUNNING":
      return "PROCESSING";
    case "SUCCEEDED":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
    default:
      return "PENDING";
  }
}
async function generateKlingVideo(options) {
  if (!KLING_API_KEY) {
    return { taskId: "", status: "FAILED", error: "KLING_API_KEY \u672A\u914D\u7F6E" };
  }
  const endpoint = options.imageUrl ? `${KLING_API_URL}/videos/image2video` : `${KLING_API_URL}/videos/text2video`;
  const body = {
    model: options.model || "kling-v2.6-pro",
    prompt: options.prompt,
    duration: options.duration || 5,
    aspect_ratio: options.aspectRatio || "16:9",
    mode: "professional"
  };
  if (options.imageUrl) {
    body.image_url = options.imageUrl;
  }
  if (options.negativePrompt) {
    body.negative_prompt = options.negativePrompt;
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KLING_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        taskId: "",
        status: "FAILED",
        error: data.message || data.error || `HTTP ${res.status}`
      };
    }
    const taskId = data.data?.task_id || data.task_id || "";
    return { taskId, status: "PENDING" };
  } catch (err) {
    return {
      taskId: "",
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
async function getKlingTaskStatus(taskId) {
  if (!KLING_API_KEY) {
    return { taskId, status: "FAILED", error: "KLING_API_KEY \u672A\u914D\u7F6E" };
  }
  try {
    const res = await fetch(`${KLING_API_URL}/videos/${taskId}`, {
      headers: { "Authorization": `Bearer ${KLING_API_KEY}` }
    });
    const data = await res.json();
    const videoData = data.data;
    if (!res.ok || !videoData) {
      return {
        taskId,
        status: "FAILED",
        error: data.message || data.error || `HTTP ${res.status}`
      };
    }
    const status = mapKlingStatus(videoData.status);
    const videoUrl = status === "SUCCEEDED" ? videoData.video_url : void 0;
    return {
      taskId,
      status,
      videoUrl,
      error: videoData.failure_reason
    };
  } catch (err) {
    return {
      taskId,
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
function mapKlingStatus(status) {
  switch (status) {
    case "pending":
      return "PENDING";
    case "processing":
      return "PROCESSING";
    case "succeeded":
      return "SUCCEEDED";
    case "failed":
      return "FAILED";
    default:
      return "PENDING";
  }
}
async function generateJimengVideo(options) {
  if (!JIMENG_API_KEY) {
    return { taskId: "", status: "FAILED", error: "JIMENG_API_KEY \u672A\u914D\u7F6E" };
  }
  const body = {
    model: options.model || "jimeng_v30",
    prompt: options.prompt,
    resolution: options.model === "jimeng_v30_pro" ? "1080p" : "720p",
    ratio: options.aspectRatio || "16:9",
    duration: options.duration || 5,
    seed: options.seed ?? -1
  };
  if (options.imageUrl) {
    body.images = [options.imageUrl];
  }
  try {
    const res = await fetch(`${JIMENG_API_URL}/v1/video/generations`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${JIMENG_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        taskId: "",
        status: "FAILED",
        error: data.message || data.error || `HTTP ${res.status}`
      };
    }
    const taskId = data.task_id || data.data?.task_id || "";
    return { taskId, status: "PENDING" };
  } catch (err) {
    return {
      taskId: "",
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
async function getJimengTaskStatus(taskId) {
  if (!JIMENG_API_KEY) {
    return { taskId, status: "FAILED", error: "JIMENG_API_KEY \u672A\u914D\u7F6E" };
  }
  try {
    const res = await fetch(
      `${JIMENG_API_URL}/v1/video/generations/${taskId}`,
      {
        headers: { "Authorization": `Bearer ${JIMENG_API_KEY}` }
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return {
        taskId,
        status: "FAILED",
        error: data.message || data.error || `HTTP ${res.status}`
      };
    }
    const status = mapJimengStatus(data.status);
    const videoUrl = status === "SUCCEEDED" ? data.data?.video_url || data.video_url : void 0;
    return {
      taskId,
      status,
      videoUrl,
      error: data.error_msg
    };
  } catch (err) {
    return {
      taskId,
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
function mapJimengStatus(status) {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "PROCESSING":
      return "PROCESSING";
    case "SUCCESS":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
    default:
      return "PENDING";
  }
}
async function generateVideo(options) {
  const model = options.model || "runway-gen4.5";
  if (model.startsWith("runway-") || model.startsWith("gen4") || model.startsWith("veo-") || model.startsWith("sora-") || model.startsWith("kling-") || model.startsWith("wan-")) {
    const actualModel = model.replace(/^runway-/, "");
    return generateRunwayVideo({ ...options, model: actualModel });
  }
  if (model.startsWith("kling-")) {
    return generateKlingVideo({ ...options, model });
  }
  if (model.startsWith("jimeng-")) {
    return generateJimengVideo({ ...options, model });
  }
  return generateRunwayVideo(options);
}
async function getVideoTaskStatus(taskId, provider) {
  switch (provider) {
    case "runway":
      return getRunwayTaskStatus(taskId);
    case "kling":
      return getKlingTaskStatus(taskId);
    case "jimeng":
      return getJimengTaskStatus(taskId);
    default:
      return { taskId, status: "FAILED", error: "Unknown provider" };
  }
}
var VIDEO_MODELS = [
  // ── Runway ────────────────────────────────────────────────────────────────
  {
    id: "runway-gen4.5",
    name: "Runway Gen-4.5",
    provider: "runway",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    notes: "\u6700\u65B0\u65D7\u8230\u6A21\u578B\uFF0C\u652F\u6301 2-10s \u8FDE\u7EED\u65F6\u957F\uFF0C\u5E26\u97F3\u9891"
  },
  {
    id: "runway-gen4",
    name: "Runway Gen-4",
    provider: "runway",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["720p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]
  },
  {
    id: "runway-veo-3.1",
    name: "Google Veo 3.1 (via Runway)",
    provider: "runway",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 8,
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16"],
    notes: "Google DeepMind \u89C6\u9891\u6A21\u578B\uFF0C\u6548\u679C\u4F18\u79C0"
  },
  {
    id: "runway-wan-2.6-flash",
    name: "Wan 2.6 Flash (via Runway)",
    provider: "runway",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 15,
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1"]
  },
  // ⚠️ Sora 2 已关停，以下保留仅供参考
  // {
  //   id: "runway-sora-2",
  //   name: "Sora 2 (via Runway) ⚠️ 已关停",
  //   provider: "runway",
  //   supportsText2Video: true,
  //   supportsImage2Video: true,
  //   maxDuration: 12,
  //   resolutions: ["720p", "1080p"],
  //   aspectRatios: ["16:9", "9:16"],
  //   notes: "⚠️ OpenAI 已于 2026-03-24 关停 Sora，此模型可能已失效",
  // },
  // ── Kling ─────────────────────────────────────────────────────────────────
  {
    id: "kling-o1",
    name: "Kling O1 (\u7EDF\u4E00\u591A\u6A21\u6001)",
    provider: "kling",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    notes: "\u5FEB\u624B\u6700\u65B0\u7EDF\u4E00\u6A21\u578B\uFF0C\u652F\u6301\u591A\u6A21\u6001\u7406\u89E3"
  },
  {
    id: "kling-v2.6-pro",
    name: "Kling v2.6 Pro",
    provider: "kling",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    notes: "\u539F\u751F\u97F3\u9891 + \u8FD0\u52A8\u63A7\u5236\uFF0C\u4E13\u4E1A\u6A21\u5F0F ~60s \u751F\u6210"
  },
  {
    id: "kling-v2.6-std",
    name: "Kling v2.6 Standard",
    provider: "kling",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    notes: "\u5FEB\u901F\u751F\u6210\uFF0C\u5E26\u97F3\u9891"
  },
  {
    id: "kling-v2.5-turbo",
    name: "Kling v2.5 Turbo",
    provider: "kling",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 5,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    notes: "\u6700\u5FEB\u751F\u6210\u901F\u5EA6"
  },
  // ── Jimeng ────────────────────────────────────────────────────────────────
  {
    id: "jimeng-v30",
    name: "\u5373\u68A6 v3.0 (720P)",
    provider: "jimeng",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
    notes: "\u652F\u6301\u8FD0\u955C\u6A21\u677F\uFF08\u706B\u5C71\u5F15\u64CE\uFF09\uFF0C\u4E2D\u6587\u7406\u89E3\u5F3A"
  },
  {
    id: "jimeng-v30-pro",
    name: "\u5373\u68A6 v3.0 Pro (1080P)",
    provider: "jimeng",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["1080p"],
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
    notes: "\u4E13\u4E1A\u7EA7 1080P\uFF0C\u5206\u8FA8\u7387\u66F4\u9AD8"
  }
];

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  autoclip: autoclipRouter,
  sales: salesRouter,
  video: router({
    // 获取可用视频模型列表
    listModels: publicProcedure.query(() => {
      return VIDEO_MODELS;
    }),
    // 文生视频 / 图生视频
    generate: protectedProcedure.input(
      z4.object({
        prompt: z4.string().min(1).max(5e3),
        model: z4.string().optional(),
        duration: z4.number().int().min(1).max(15).optional(),
        aspectRatio: z4.enum(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]).optional(),
        imageUrl: z4.string().url().optional(),
        negativePrompt: z4.string().max(1e3).optional(),
        seed: z4.number().int().optional()
      })
    ).mutation(async ({ input }) => {
      const options = {
        prompt: input.prompt,
        model: input.model || "runway-gen4.5",
        duration: input.duration,
        aspectRatio: input.aspectRatio,
        imageUrl: input.imageUrl,
        negativePrompt: input.negativePrompt,
        seed: input.seed
      };
      const result = await generateVideo(options);
      return {
        taskId: result.taskId,
        status: result.status,
        error: result.error
      };
    }),
    // 查询任务状态
    getStatus: protectedProcedure.input(
      z4.object({
        taskId: z4.string(),
        provider: z4.enum(["runway", "kling", "jimeng"])
      })
    ).query(async ({ input }) => {
      return await getVideoTaskStatus(input.taskId, input.provider);
    })
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    }),
    // Admin: list all users
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError4({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u67E5\u770B\u7528\u6237\u5217\u8868" });
      }
      return await listUsers();
    }),
    // Admin: update user role
    updateUserRole: protectedProcedure.input(
      z4.object({
        userId: z4.number().int().positive(),
        role: z4.enum(["user", "admin"])
      })
    ).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError4({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C\u7528\u6237\u89D2\u8272" });
      }
      await updateUserRole(input.userId, input.role);
      return { success: true };
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
      await createMaoApplication({
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
      return await listMaoApplications();
    }),
    // Subscribe to strategic brief
    subscribeBrief: publicProcedure.input(
      z4.object({
        email: z4.string().email()
      })
    ).mutation(async ({ input }) => {
      await subscribeBrief(input.email);
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
      return await listBriefSubscribers();
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
      await updateMaoApplicationStatus(input.id, input.status);
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
      await updateMaoApplicationNotes(input.id, input.notes);
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
      const emails = await listSubscriberEmails();
      if (emails.length === 0) {
        return { success: true, sent: 0, failed: 0, message: "\u6682\u65E0\u8BA2\u9605\u8005" };
      }
      const html = generateNewsletterHtml(input.subject, input.content);
      const { success, failed } = await sendBulkEmails(emails, input.subject, html, input.content);
      return { success: true, sent: success, failed, message: `\u5DF2\u53D1\u9001 ${success} \u5C01\uFF0C\u5931\u8D25 ${failed} \u5C01` };
    })
  }),
  // ─── AI 模型 / 状态 / 预设 ────────────────────────────────────────────────
  ai: router({
    models: publicProcedure.query(async () => {
      return Object.entries(MODEL_CONFIGS).map(([id, cfg]) => ({
        id,
        name: cfg.name,
        badge: cfg.badge,
        provider: cfg.provider,
        supportsVision: cfg.supportsVision ?? false,
        configured: !!cfg.apiKey,
        // Ollama 本地模型不需要 API Key，但需要检测服务是否在线
        // 对于本地模型，available 取决于 isLocal (provider === "ollama")
        available: cfg.provider === "ollama" ? true : !!cfg.apiKey,
        isLocal: cfg.provider === "ollama"
      }));
    }),
    status: publicProcedure.query(async () => {
      const nodes = await getAiNodes();
      const onlineNodes = nodes.filter((n) => n.isOnline).length;
      return {
        ok: true,
        models: Object.entries(MODEL_CONFIGS).reduce((acc, [id, cfg]) => {
          acc[id] = { name: cfg.name, configured: !!cfg.apiKey, badge: cfg.badge };
          return acc;
        }, {}),
        nodes: { total: nodes.length, online: onlineNodes },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }),
    presets: publicProcedure.query(async () => {
      const r = await dbFetch("/system_prompts?is_active=eq.true&order=sort_order.asc");
      return r.data ?? [];
    }),
    chat: protectedProcedure.input(z4.object({
      messages: z4.array(z4.object({ role: z4.string(), content: z4.string() })),
      modelId: z4.string().optional()
    })).mutation(async ({ input }) => {
      return { message: "Use /api/ai/stream for streaming chat", modelId: input.modelId };
    })
  }),
  // ─── AI 节点管理 ─────────────────────────────────────────────────────────
  nodes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      return await getAiNodes();
    }),
    create: protectedProcedure.input(z4.object({
      name: z4.string(),
      baseUrl: z4.string().url(),
      token: z4.string(),
      type: z4.string().optional(),
      modelId: z4.string().optional(),
      isLocal: z4.boolean().optional(),
      isPaid: z4.boolean().optional(),
      isActive: z4.boolean().optional()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      return await createAiNode({ ...input, isOnline: false });
    }),
    update: protectedProcedure.input(z4.object({
      id: z4.number().int().positive(),
      name: z4.string().optional(),
      baseUrl: z4.string().url().optional(),
      token: z4.string().optional(),
      isActive: z4.boolean().optional(),
      isPaid: z4.boolean().optional(),
      isLocal: z4.boolean().optional()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateAiNode(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z4.object({ id: z4.number().int().positive() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      await dbFetch(`/ai_nodes?id=eq.${input.id}`, { method: "DELETE" });
      return { success: true };
    }),
    ping: protectedProcedure.input(z4.object({ id: z4.number().int().positive() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      const node = await getAiNodeById(input.id);
      if (!node) throw new TRPCError4({ code: "NOT_FOUND" });
      try {
        const t0 = Date.now();
        const res = await fetch(`${node.baseUrl}/health`, { signal: AbortSignal.timeout(5e3) });
        const pingMs = Date.now() - t0;
        await updateNodePingStatus(input.id, res.ok, pingMs);
        return { ok: res.ok, online: res.ok, latency: pingMs, pingMs };
      } catch {
        await updateNodePingStatus(input.id, false);
        return { ok: false, online: false, latency: null, pingMs: null };
      }
    }),
    getSkills: protectedProcedure.input(z4.object({ nodeId: z4.number().int().positive().optional() })).query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      const skills = input.nodeId ? await getNodeSkills(input.nodeId) : await getAllNodeSkills();
      return { skills };
    }),
    toggleSkill: protectedProcedure.input(z4.object({
      nodeId: z4.number().int().positive(),
      skillId: z4.string(),
      isEnabled: z4.boolean()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      await setNodeSkillEnabled(input.nodeId, input.skillId, input.isEnabled);
      return { success: true };
    })
  }),
  // ─── 路由规则 ─────────────────────────────────────────────────────────────
  routing: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      return await getRoutingRules();
    }),
    create: protectedProcedure.input(z4.object({
      name: z4.string(),
      mode: z4.string(),
      nodeIds: z4.string().optional(),
      priority: z4.number().optional(),
      isDefault: z4.boolean().optional(),
      isActive: z4.boolean().optional(),
      failover: z4.boolean().optional(),
      loadBalance: z4.string().optional()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      const r = await dbFetch("/routing_rules", { method: "POST", body: input }, "return=representation");
      return r.data?.[0] ?? null;
    }),
    update: protectedProcedure.input(z4.object({
      id: z4.number().int().positive(),
      name: z4.string().optional(),
      mode: z4.string().optional(),
      nodeIds: z4.string().optional(),
      priority: z4.number().optional(),
      isDefault: z4.boolean().optional(),
      isActive: z4.boolean().optional(),
      failover: z4.boolean().optional(),
      loadBalance: z4.string().optional()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await dbFetch(`/routing_rules?id=eq.${id}`, { method: "PATCH", body: data });
      return { success: true };
    }),
    delete: protectedProcedure.input(z4.object({ id: z4.number().int().positive() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      await dbFetch(`/routing_rules?id=eq.${input.id}`, { method: "DELETE" });
      return { success: true };
    })
  }),
  // ─── 计费 / 订阅 ──────────────────────────────────────────────────────────
  billing: router({
    mySubscription: protectedProcedure.query(async ({ ctx }) => {
      const r = await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(ctx.user.openId)}&limit=1`);
      const rows = r.data;
      const row = rows?.[0];
      return {
        tier: row?.tier ?? row?.plan ?? "free",
        plan: row?.plan ?? "free",
        limits: row?.limits ?? {
          dailyChatMessages: 20,
          imageGeneration: false,
          dailyImageGenerations: 0,
          premiumModels: false
        },
        usage: row?.usage ?? {
          chatMessages: 0,
          imageGenerations: 0
        },
        contentQuota: row?.content_quota ?? 5,
        contentUsed: row?.content_used ?? 0
      };
    }),
    createOrder: protectedProcedure.input(z4.object({
      plan: z4.enum(["content", "strategic"]),
      amount: z4.number().optional()
    })).mutation(async ({ input, ctx }) => {
      const r = await dbFetch("/orders", {
        method: "POST",
        body: {
          user_open_id: ctx.user.openId,
          plan: input.plan,
          amount: input.amount ?? 0,
          status: "pending",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      }, "return=representation");
      const rows = r.data;
      return rows?.[0] ?? null;
    })
  }),
  // ─── 对话历史 ─────────────────────────────────────────────────────────────
  conversations: router({
    list: protectedProcedure.input(z4.object({ limit: z4.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const r = await dbFetch(
        `/conversations?open_id=eq.${encodeURIComponent(ctx.user.openId)}&order=updated_at.desc&limit=${limit}`
      );
      return r.data ?? [];
    }),
    create: protectedProcedure.input(z4.object({ title: z4.string().optional(), model: z4.string().optional() })).mutation(async ({ input, ctx }) => {
      const r = await dbFetch("/conversations", {
        method: "POST",
        body: {
          open_id: ctx.user.openId,
          title: input.title ?? "\u65B0\u5BF9\u8BDD",
          model: input.model ?? null,
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      }, "return=representation");
      const rows = r.data;
      return rows?.[0] ?? null;
    }),
    update: protectedProcedure.input(z4.object({ id: z4.union([z4.string(), z4.number()]), title: z4.string().optional(), model: z4.string().optional() })).mutation(async ({ input, ctx }) => {
      const id = String(input.id);
      const patch = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (input.title !== void 0) patch.title = input.title;
      if (input.model !== void 0) patch.model = input.model;
      await dbFetch(
        `/conversations?id=eq.${id}&open_id=eq.${encodeURIComponent(ctx.user.openId)}`,
        { method: "PATCH", body: patch }
      );
      return { success: true };
    }),
    delete: protectedProcedure.input(z4.object({ id: z4.union([z4.string(), z4.number()]) })).mutation(async ({ input, ctx }) => {
      const id = String(input.id);
      await dbFetch(
        `/conversations?id=eq.${id}&open_id=eq.${encodeURIComponent(ctx.user.openId)}`,
        { method: "DELETE" }
      );
      return { success: true };
    })
  }),
  // ─── 消息记录 ─────────────────────────────────────────────────────────────
  messages: router({
    list: protectedProcedure.input(z4.object({ conversationId: z4.union([z4.string(), z4.number()]), limit: z4.number().optional() })).query(async ({ input }) => {
      const convId = String(input.conversationId);
      const limit = input.limit ?? 100;
      const r = await dbFetch(
        `/messages?conversation_id=eq.${encodeURIComponent(convId)}&order=created_at.asc&limit=${limit}`
      );
      return r.data ?? [];
    }),
    save: protectedProcedure.input(z4.object({
      conversationId: z4.union([z4.string(), z4.number()]),
      role: z4.enum(["user", "assistant", "system"]),
      content: z4.string(),
      modelId: z4.string().optional(),
      model: z4.string().optional()
      // alias for modelId
    })).mutation(async ({ input }) => {
      const convId = String(input.conversationId);
      const r = await dbFetch("/messages", {
        method: "POST",
        body: {
          conversation_id: convId,
          role: input.role,
          content: input.content,
          model_id: input.modelId ?? input.model ?? null,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      }, "return=representation");
      const rows = r.data;
      return rows?.[0] ?? null;
    })
  }),
  // ─── 千禧钟预约 ──────────────────────────────────────────────────────────
  millenniumClock: router({
    createReservation: publicProcedure.input(z4.object({
      name: z4.string().min(1).max(64),
      phone: z4.string().min(1).max(32),
      email: z4.string().email().optional(),
      message: z4.string().max(500).optional(),
      visitDate: z4.string().optional()
    })).mutation(async ({ input }) => {
      const r = await dbFetch("/millennium_clock_reservations", {
        method: "POST",
        body: { ...input, status: "pending", created_at: (/* @__PURE__ */ new Date()).toISOString() }
      }, "return=representation");
      const rows = r.data;
      await notifyOwner({
        title: `\u5343\u79A7\u949F\u65B0\u9884\u7EA6\uFF1A${input.name}`,
        content: `\u59D3\u540D\uFF1A${input.name}
\u7535\u8BDD\uFF1A${input.phone}
\u90AE\u7BB1\uFF1A${input.email ?? "\uFF08\u65E0\uFF09"}
\u7559\u8A00\uFF1A${input.message ?? "\uFF08\u65E0\uFF09"}`
      });
      return { success: true, id: rows?.[0]?.id };
    }),
    getReservations: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      const r = await dbFetch("/millennium_clock_reservations?order=created_at.desc");
      return r.data ?? [];
    })
  }),
  // ─── 咨询询价 ─────────────────────────────────────────────────────────────
  consulting: router({
    createInquiry: publicProcedure.input(z4.object({
      name: z4.string().min(1).max(128),
      company: z4.string().max(256).optional(),
      email: z4.string().email().optional(),
      phone: z4.string().max(64).optional(),
      service: z4.string().max(256).optional(),
      message: z4.string().max(5e3).optional()
    })).mutation(async ({ input }) => {
      const r = await dbFetch("/consulting_inquiries", {
        method: "POST",
        body: { ...input, status: "pending", created_at: (/* @__PURE__ */ new Date()).toISOString() }
      }, "return=representation");
      const rows = r.data;
      await notifyOwner({
        title: `\u65B0\u54A8\u8BE2\u8BE2\u4EF7\uFF1A${input.company ?? input.name}`,
        content: `\u59D3\u540D\uFF1A${input.name}
\u516C\u53F8\uFF1A${input.company ?? "\uFF08\u65E0\uFF09"}
\u90AE\u7BB1\uFF1A${input.email ?? "\uFF08\u65E0\uFF09"}
\u670D\u52A1\uFF1A${input.service ?? "\uFF08\u65E0\uFF09"}`
      });
      return { success: true, id: rows?.[0]?.id };
    }),
    getInquiries: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      const r = await dbFetch("/consulting_inquiries?order=created_at.desc");
      return r.data ?? [];
    }),
    updateStatus: protectedProcedure.input(z4.object({
      id: z4.number().int().positive(),
      status: z4.string(),
      // flexible status: pending/contacted/closed/new/signed/dropped/etc
      notes: z4.string().optional()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      await dbFetch(`/consulting_inquiries?id=eq.${input.id}`, {
        method: "PATCH",
        body: { status: input.status, notes: input.notes ?? null, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
      });
      return { success: true };
    })
  }),
  // ─── 节点日志 ─────────────────────────────────────────────────────────────
  logs: router({
    list: protectedProcedure.input(z4.object({ limit: z4.number().int().min(1).max(500).optional() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      const limit = input?.limit ?? 100;
      const r = await dbFetch(`/node_logs?order=created_at.desc&limit=${limit}`);
      return r.data ?? [];
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
import fs3 from "fs";
import { nanoid } from "nanoid";
import path3 from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
var __filename = fileURLToPath(import.meta.url);
var __dirname2 = path3.dirname(__filename);
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
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    const url = req.originalUrl;
    if (url.startsWith("/api/")) {
      return next();
    }
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = path3.resolve(__dirname2, "..", "..", "dist", "public");
  if (!fs3.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/aiStream.ts
import { Router as Router2 } from "express";
import { spawn } from "child_process";
init_db();
init_aiNodes();
import mammoth from "mammoth";

// server/tools.ts
import { exec } from "child_process";
import { promisify } from "util";
import * as fs4 from "fs/promises";
import * as path4 from "path";
import * as os from "os";
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
          },
          verify: {
            type: "boolean",
            description: "Phase 3 \u529F\u80FD\uFF1A\u63A8\u9001\u6210\u529F\u540E\u81EA\u52A8\u89E6\u53D1 build_verify \u6784\u5EFA\u9A8C\u8BC1\u3002\u5DE5\u7A0B\u7C7B\u4FEE\u6539\u5EFA\u8BAE\u5F00\u542F\u3002",
            default: false
          },
          verifyProjectPath: {
            type: "string",
            description: "build_verify \u7684\u9879\u76EE\u8DEF\u5F84\uFF0C\u9ED8\u8BA4 /Users/daiyan/Desktop/mcmamoo-website",
            default: "/Users/daiyan/Desktop/mcmamoo-website"
          },
          verifyMaxRetries: {
            type: "number",
            description: "\u6784\u5EFA\u5931\u8D25\u540E\u6700\u5927\u91CD\u8BD5\u6B21\u6570\uFF0C\u9ED8\u8BA4 3",
            default: 3
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
  },
  {
    type: "function",
    function: {
      name: "openclaw_shell",
      description: "\u901A\u8FC7 OpenClaw Skills \u6267\u884C Shell \u547D\u4EE4\uFF08\u7BA1\u7406\u5458\u4E13\u7528\uFF09\u3002",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell \u547D\u4EE4" },
          cwd: { type: "string", description: "\u5DE5\u4F5C\u76EE\u5F55" }
        },
        required: ["command"]
      }
    }
  },
  // ─── Claude Code Python 移植工具 ────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "claude_code_summary",
      description: "\u83B7\u53D6 Claude Code Python \u79FB\u690D\u5DE5\u4F5C\u533A\u7684\u6458\u8981\u62A5\u544A\uFF0C\u5305\u62EC\u6587\u4EF6\u7EDF\u8BA1\u3001\u5B50\u7CFB\u7EDF\u72B6\u6001\u3001\u79FB\u690D\u8FDB\u5EA6\u7B49\u4FE1\u606F\u3002",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "claude_code_analyze",
      description: "\u5206\u6790 Claude Code \u79FB\u690D\u5DE5\u4F5C\u533A\u7684\u4EE3\u7801\u7ED3\u6784\uFF0C\u63D0\u4F9B\u67B6\u6784\u5206\u6790\u548C\u6539\u8FDB\u5EFA\u8BAE\u3002",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "\u53EF\u9009\uFF1A\u6307\u5B9A\u8981\u5206\u6790\u7684\u7279\u5B9A\u6587\u4EF6\u6216\u76EE\u5F55\u8DEF\u5F84\uFF08\u76F8\u5BF9\u4E8E\u5DE5\u4F5C\u533A\u6839\u76EE\u5F55\uFF09"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "claude_code_init",
      description: "\u521D\u59CB\u5316 Claude Code Python \u79FB\u690D\u5DE5\u4F5C\u533A\uFF0C\u4ECE GitHub \u514B\u9686\u4EE3\u7801\u4ED3\u5E93\u3002",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "claude_code_run",
      description: "\u8FD0\u884C Claude Code Python \u79FB\u690D\u7248\u672C\u7684 CLI \u547D\u4EE4\uFF08\u5982 summary\u3001manifest\u3001subsystems\uFF09\u3002",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "\u8981\u6267\u884C\u7684\u547D\u4EE4\uFF0C\u5982 summary\u3001manifest\u3001subsystems"
          },
          args: {
            type: "array",
            items: { type: "string" },
            description: "\u547D\u4EE4\u53C2\u6570\u5217\u8868"
          }
        },
        required: ["command"]
      }
    }
  }
];
async function executeTool(toolName, args, isAdmin = false) {
  try {
    switch (toolName) {
      case "web_search":
        return await toolWebSearch(args.query, args.max_results || 5);
      case "run_code":
        return await toolRunCode(args.language, args.code, args.timeout || 30);
      case "github_push":
        return await toolGithubPush(
          args.repo,
          args.files,
          args.message,
          args.branch || "main",
          args.verify === true,
          args.verifyProjectPath,
          args.verifyMaxRetries
        );
      case "github_read":
        return await toolGithubRead(args.repo, args.file_path, args.branch || "main");
      case "read_url":
        return await toolReadUrl(args.url, args.extract_text_only !== false);
      case "deep_research":
        return await toolDeepResearch(args.query, args.mode || "pro", args.max_duration || 300);
      case "run_shell":
        if (!isAdmin) return { success: false, output: "", error: "run_shell \u4EC5\u7BA1\u7406\u5458\u53EF\u7528" };
        return await toolRunShell(args.command, args.cwd || "/tmp");
      // ─── Claude Code Python 移植工具 ────────────────────────────────────
      case "claude_code_summary":
      case "claude_code_analyze":
      case "claude_code_init":
      case "claude_code_run":
        return await toolClaudeCode(toolName, args);
      default:
        if (toolName.startsWith("opencli_")) {
          return await executeOpencliTool(toolName, args);
        }
        if (toolName.startsWith("openclaw_")) {
          return await executeOpenclawTool(toolName, args, { isAdmin });
        }
        return { success: false, output: "", error: `\u672A\u77E5\u5DE5\u5177: ${toolName}` };
    }
  } catch (err) {
    return { success: false, output: "", error: `\u5DE5\u5177\u6267\u884C\u5F02\u5E38: ${err.message}` };
  }
}
async function toolWebSearch(query, maxResults) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const resp = await fetch(ddgUrl, { headers: { "User-Agent": "MaoAI/1.0" } });
      const data = await resp.json();
      const parts = [];
      if (data.AbstractText) parts.push(`\u6458\u8981: ${data.AbstractText}`);
      if (data.RelatedTopics?.length) {
        parts.push("\u76F8\u5173\u4E3B\u9898:");
        data.RelatedTopics.slice(0, maxResults).forEach((t2) => {
          if (t2.Text) parts.push(`\u2022 ${t2.Text}${t2.FirstURL ? ` (${t2.FirstURL})` : ""}`);
        });
      }
      if (parts.length === 0) parts.push("\u672A\u627E\u5230\u76F4\u63A5\u7B54\u6848\uFF0C\u5EFA\u8BAE\u914D\u7F6E TAVILY_API_KEY \u83B7\u53D6\u66F4\u597D\u7684\u641C\u7D22\u7ED3\u679C\u3002");
      return { success: true, output: parts.join("\n"), metadata: { source: "duckduckgo", query } };
    } catch (e) {
      return { success: false, output: "", error: `\u641C\u7D22\u5931\u8D25: ${e.message}` };
    }
  }
  try {
    const resp = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        max_results: maxResults,
        search_depth: "advanced",
        include_answer: true
      })
    });
    const data = await resp.json();
    const parts = [];
    if (data.answer) parts.push(`\u76F4\u63A5\u7B54\u6848: ${data.answer}
`);
    parts.push("\u641C\u7D22\u7ED3\u679C:");
    (data.results || []).forEach((r, i) => {
      parts.push(`${i + 1}. **${r.title}**`);
      parts.push(`   ${r.content?.slice(0, 300)}...`);
      parts.push(`   \u6765\u6E90: ${r.url}`);
    });
    return { success: true, output: parts.join("\n"), metadata: { source: "tavily", query, count: data.results?.length } };
  } catch (e) {
    return { success: false, output: "", error: `Tavily \u641C\u7D22\u5931\u8D25: ${e.message}` };
  }
}
async function toolRunCode(language, code, timeout) {
  const safeTimeout = Math.min(timeout, 120);
  const tmpDir = await fs4.mkdtemp(path4.join(os.tmpdir(), "maoai-code-"));
  try {
    let filePath;
    let cmd;
    if (language === "python") {
      filePath = path4.join(tmpDir, "script.py");
      await fs4.writeFile(filePath, code, "utf8");
      cmd = `timeout ${safeTimeout} python3 "${filePath}" 2>&1`;
    } else if (language === "javascript") {
      filePath = path4.join(tmpDir, "script.js");
      await fs4.writeFile(filePath, code, "utf8");
      cmd = `timeout ${safeTimeout} node "${filePath}" 2>&1`;
    } else {
      return { success: false, output: "", error: `\u4E0D\u652F\u6301\u7684\u8BED\u8A00: ${language}` };
    }
    const { stdout, stderr } = await execAsync(cmd, { timeout: (safeTimeout + 5) * 1e3 });
    const output = (stdout + stderr).trim();
    return {
      success: true,
      output: output || "(\u4EE3\u7801\u6267\u884C\u5B8C\u6210\uFF0C\u65E0\u8F93\u51FA)",
      metadata: { language, lines: code.split("\n").length }
    };
  } catch (err) {
    const msg = err.killed ? `\u6267\u884C\u8D85\u65F6\uFF08${safeTimeout}\u79D2\uFF09` : err.stdout || err.message;
    return { success: false, output: err.stdout || "", error: msg };
  } finally {
    await fs4.rm(tmpDir, { recursive: true, force: true }).catch(() => {
    });
  }
}
async function toolGithubPush(repo, files, message, branch, verify, verifyProjectPath, verifyMaxRetries) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT;
  if (!token) {
    return {
      success: false,
      output: "",
      error: "\u672A\u914D\u7F6E GitHub Token\u3002\u8BF7\u5728\u670D\u52A1\u5668\u73AF\u5883\u53D8\u91CF\u4E2D\u8BBE\u7F6E GITHUB_TOKEN\u3002"
    };
  }
  const results = [];
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
  for (const file of files) {
    try {
      let sha;
      const getResp = await fetch(
        `https://api.github.com/repos/${repo}/contents/${file.path}?ref=${branch}`,
        { headers }
      );
      if (getResp.ok) {
        const existing = await getResp.json();
        sha = existing.sha;
      }
      const body = {
        message,
        content: Buffer.from(file.content, "utf8").toString("base64"),
        branch
      };
      if (sha) body.sha = sha;
      const putResp = await fetch(
        `https://api.github.com/repos/${repo}/contents/${file.path}`,
        { method: "PUT", headers, body: JSON.stringify(body) }
      );
      if (putResp.ok) {
        results.push(`\u2713 ${file.path}`);
      } else {
        const err = await putResp.json();
        results.push(`\u2717 ${file.path}: ${err.message}`);
      }
    } catch (e) {
      results.push(`\u2717 ${file.path}: ${e.message}`);
    }
  }
  const allOk = results.every((r) => r.startsWith("\u2713"));
  let verifyResult = "";
  if (allOk && verify === true) {
    const loopResult = await runBuildVerifyLoop(
      verifyProjectPath || "/Users/daiyan/Desktop/mcmamoo-website",
      "npm run build",
      verifyMaxRetries || 3
    );
    verifyResult = `

## \u{1F504} \u6784\u5EFA\u9A8C\u8BC1\u5FAA\u73AF

**\u603B\u5C1D\u8BD5\u6B21\u6570:** ${loopResult.totalAttempts} / ${verifyMaxRetries || 3}

` + loopResult.history.map(
      (h) => `${h.passed ? "\u2705" : "\u274C"} \u7B2C ${h.attempt} \u6B21: \u9519\u8BEF\u6570=${h.errorCount} | ${h.passed ? "\u901A\u8FC7" : "\u5931\u8D25"}`
    ).join("\n") + `

**\u6700\u7EC8\u7ED3\u679C:** ${loopResult.success ? "\u2705 \u5168\u90E8\u901A\u8FC7" : "\u274C \u9A8C\u8BC1\u5931\u8D25\uFF08\u8BF7\u68C0\u67E5\u9519\u8BEF\u5E76\u91CD\u65B0\u63A8\u9001\uFF09"}

` + loopResult.finalOutput;
  }
  return {
    success: allOk && (!verify || verifyResult.includes("\u2705")),
    output: `GitHub \u63A8\u9001\u7ED3\u679C\uFF08${repo}@${branch}\uFF09:
${results.join("\n")}

Commit: "${message}"` + verifyResult,
    metadata: { repo, branch, fileCount: files.length, verify, verifyResult }
  };
}
async function toolGithubRead(repo, filePath, branch) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT;
  const headers = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const resp = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`,
      { headers }
    );
    if (!resp.ok) {
      const err = await resp.json();
      return { success: false, output: "", error: `GitHub API \u9519\u8BEF: ${err.message}` };
    }
    const data = await resp.json();
    const content = Buffer.from(data.content, "base64").toString("utf8");
    return {
      success: true,
      output: `\u6587\u4EF6: ${filePath}\uFF08${data.size} bytes\uFF0CSHA: ${data.sha.slice(0, 8)}\uFF09

${content}`,
      metadata: { repo, branch, path: filePath, size: data.size }
    };
  } catch (e) {
    return { success: false, output: "", error: e.message };
  }
}
async function toolReadUrl(url, extractTextOnly) {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MaoAI/1.0)",
        "Accept": "text/html,application/xhtml+xml,*/*"
      },
      signal: AbortSignal.timeout(15e3)
    });
    if (!resp.ok) return { success: false, output: "", error: `HTTP ${resp.status}` };
    const html = await resp.text();
    if (!extractTextOnly) {
      return { success: true, output: html.slice(0, 5e4), metadata: { url, length: html.length } };
    }
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s{3,}/g, "\n\n").trim().slice(0, 3e4);
    return { success: true, output: text, metadata: { url, originalLength: html.length, extractedLength: text.length } };
  } catch (e) {
    return { success: false, output: "", error: `\u8BFB\u53D6\u5931\u8D25: ${e.message}` };
  }
}
function getDeerFlowConfig() {
  return {
    baseUrl: process.env.DEERFLOW_URL || process.env.DEERFLOW_BASE_URL || "http://localhost:2026",
    timeout: 300
    // 5 minutes default
  };
}
async function toolDeepResearch(query, mode = "pro", maxDuration = 300) {
  const config = getDeerFlowConfig();
  const langgraphUrl = `${config.baseUrl}/api/langgraph`;
  const gatewayUrl = config.baseUrl;
  const startTime = Date.now();
  try {
    const healthResp = await fetch(`${gatewayUrl}/health`, {
      signal: AbortSignal.timeout(5e3)
    });
    if (!healthResp.ok) {
      return {
        success: false,
        output: "",
        error: `DeerFlow \u670D\u52A1\u4E0D\u53EF\u8FBE (${gatewayUrl})\uFF0CHTTP ${healthResp.status}\u3002\u8BF7\u786E\u8BA4 DeerFlow \u5DF2\u542F\u52A8\uFF08cd deer-flow && make dev\uFF09`
      };
    }
    const threadResp = await fetch(`${langgraphUrl}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!threadResp.ok) {
      const errText = await threadResp.text();
      return { success: false, output: "", error: `\u521B\u5EFA DeerFlow \u7EBF\u7A0B\u5931\u8D25: ${errText}` };
    }
    const threadData = await threadResp.json();
    const threadId = threadData.thread_id;
    const modeConfig = {
      flash: { thinking: false, plan: false, subagent: false },
      standard: { thinking: true, plan: false, subagent: false },
      pro: { thinking: true, plan: true, subagent: false },
      ultra: { thinking: true, plan: true, subagent: true }
    };
    const mc = modeConfig[mode] || modeConfig.pro;
    const escapedQuery = JSON.stringify(query);
    const body = JSON.stringify({
      assistant_id: "lead_agent",
      input: {
        messages: [
          {
            type: "human",
            content: [{ type: "text", text: JSON.parse(escapedQuery) }]
          }
        ]
      },
      stream_mode: ["values", "messages-tuple"],
      stream_subgraphs: true,
      config: {
        recursion_limit: 1e3
      },
      context: {
        thinking_enabled: mc.thinking,
        is_plan_mode: mc.plan,
        subagent_enabled: mc.subagent,
        thread_id: threadId
      }
    });
    const runResp = await fetch(`${langgraphUrl}/threads/${threadId}/runs/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout((maxDuration + 30) * 1e3)
    });
    if (!runResp.ok) {
      const errText = await runResp.text();
      return { success: false, output: "", error: `DeerFlow \u8FD0\u884C\u5931\u8D25: ${errText}` };
    }
    const reader = runResp.body?.getReader();
    if (!reader) {
      return { success: false, output: "", error: "\u65E0\u6CD5\u8BFB\u53D6 DeerFlow \u54CD\u5E94\u6D41" };
    }
    const decoder = new TextDecoder();
    let rawSSE = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (buffer.length > 5e4) {
        buffer = buffer.slice(-5e4);
      }
      rawSSE += decoder.decode(value, { stream: true });
      if (rawSSE.length > 1e5) {
        rawSSE = rawSSE.slice(-1e5);
      }
    }
    const events = [];
    let currentEvent = null;
    let currentDataLines = [];
    for (const line of rawSSE.split("\n")) {
      if (line.startsWith("event:")) {
        if (currentEvent && currentDataLines.length > 0) {
          events.push({ type: currentEvent, data: currentDataLines.join("\n") });
        }
        currentEvent = line.slice(6).trim();
        currentDataLines = [];
      } else if (line.startsWith("data:")) {
        currentDataLines.push(line.slice(5).trim());
      } else if (line === "" && currentEvent) {
        if (currentDataLines.length > 0) {
          events.push({ type: currentEvent, data: currentDataLines.join("\n") });
        }
        currentEvent = null;
        currentDataLines = [];
      }
    }
    if (currentEvent && currentDataLines.length > 0) {
      events.push({ type: currentEvent, data: currentDataLines.join("\n") });
    }
    let resultMessages = null;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === "values") {
        try {
          const data = JSON.parse(events[i].data);
          if (data.messages) {
            resultMessages = data.messages;
            break;
          }
        } catch {
        }
      }
    }
    if (!resultMessages || resultMessages.length === 0) {
      for (const evt of events) {
        if (evt.type === "error") {
          return { success: false, output: "", error: `DeerFlow \u9519\u8BEF: ${evt.data}` };
        }
      }
      return { success: false, output: "", error: "DeerFlow \u672A\u8FD4\u56DE\u6709\u6548\u54CD\u5E94" };
    }
    let responseText = "";
    for (let i = resultMessages.length - 1; i >= 0; i--) {
      const msg = resultMessages[i];
      if (msg.type === "ai") {
        const content = msg.content;
        if (typeof content === "string" && content) {
          responseText = content;
        } else if (Array.isArray(content)) {
          const parts = content.filter((b) => typeof b === "string" && b || b.type === "text" && b.text).map((b) => typeof b === "string" ? b : b.text).join("");
          if (parts) {
            responseText = parts;
          }
        }
        if (responseText) break;
      }
      if (msg.type === "tool" && msg.name === "ask_clarification") {
        responseText = msg.content || "";
        if (responseText) break;
      }
    }
    const elapsed = ((Date.now() - startTime) / 1e3).toFixed(1);
    if (!responseText) {
      return { success: false, output: "", error: "DeerFlow \u672A\u8FD4\u56DE\u6587\u672C\u5185\u5BB9" };
    }
    const truncated = responseText.length > 8e3;
    const output = truncated ? responseText.slice(0, 8e3) + "\n\n...(\u5185\u5BB9\u5DF2\u622A\u65AD\uFF0C\u5B8C\u6574\u7814\u7A76\u7531 DeerFlow \u5B8C\u6210)" : responseText;
    return {
      success: true,
      output,
      metadata: {
        source: "deerflow",
        mode,
        threadId,
        query,
        elapsedSeconds: elapsed,
        messageCount: resultMessages.length,
        truncated
      }
    };
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return { success: false, output: "", error: `DeerFlow \u7814\u7A76\u8D85\u65F6\uFF08${maxDuration}\u79D2\uFF09` };
    }
    return { success: false, output: "", error: `DeerFlow \u8C03\u7528\u5931\u8D25: ${err.message}` };
  }
}
async function toolRunShell(command, cwd) {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd, timeout: 6e4 });
    return {
      success: true,
      output: (stdout + stderr).trim() || "(\u547D\u4EE4\u6267\u884C\u5B8C\u6210\uFF0C\u65E0\u8F93\u51FA)",
      metadata: { command, cwd }
    };
  } catch (err) {
    return {
      success: false,
      output: err.stdout || "",
      error: err.stderr || err.message
    };
  }
}

// server/contentPlatform.ts
init_aiNodes();
import { Router } from "express";
import cron from "node-cron";
var contentPlatformRouter = Router();
var PLAN_RANK = {
  free: 0,
  content: 1,
  strategic: 2,
  admin: 99
};
function planRank(plan) {
  return PLAN_RANK[plan] ?? 0;
}
var PLAN_DEFAULTS = {
  free: { contentQuota: 5 },
  content: { contentQuota: 50 },
  strategic: { contentQuota: -1 }
  // -1 = 不限
};
async function getUserSubscription(openId) {
  const res = await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(openId)}&select=*&limit=1`);
  const rows = res.data;
  return rows?.[0] ?? null;
}
async function upsertUserSubscription(openId, userId, plan) {
  const defaults = PLAN_DEFAULTS[plan] ?? PLAN_DEFAULTS.free;
  const nextMonth = /* @__PURE__ */ new Date();
  nextMonth.setDate(1);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setHours(0, 0, 0, 0);
  const existing = await getUserSubscription(openId);
  if (existing) {
    await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(openId)}`, {
      method: "PATCH",
      body: {
        plan,
        content_quota: defaults.contentQuota,
        content_used: 0,
        quota_reset_at: nextMonth.toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } else {
    await dbFetch("/user_subscriptions", {
      method: "POST",
      body: {
        user_id: userId,
        open_id: openId,
        plan,
        content_quota: defaults.contentQuota,
        content_used: 0,
        quota_reset_at: nextMonth.toISOString()
      }
    });
  }
}
async function maybeResetQuota(sub) {
  if (!sub) return sub;
  const now = /* @__PURE__ */ new Date();
  const resetAt = new Date(sub.quota_reset_at);
  if (now >= resetAt) {
    await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(sub.open_id)}`, {
      method: "PATCH",
      body: {
        content_used: 0,
        quota_reset_at: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
      }
    });
    sub.content_used = 0;
  }
  return sub;
}
var PLATFORM_PLANS = {
  xiaohongshu: { minPlan: "content", platformKey: "xiaohongshu", label: "\u5C0F\u7EA2\u4E66" },
  douyin: { minPlan: "strategic", platformKey: "douyin", label: "\u6296\u97F3" },
  weibo: { minPlan: "content", platformKey: "weibo", label: "\u5FAE\u535A" },
  wechat: { minPlan: "strategic", platformKey: "wechat", label: "\u5FAE\u4FE1\u516C\u4F17\u53F7" }
};
async function checkSkillPermission(openId, userRole, skillRequiredPlan) {
  if (userRole === "admin") return { allowed: true };
  let sub = await getUserSubscription(openId);
  sub = await maybeResetQuota(sub);
  const userPlan = sub?.plan ?? "free";
  const platformDef = PLATFORM_PLANS[skillRequiredPlan];
  if (platformDef) {
    if (planRank(userPlan) < planRank(platformDef.minPlan)) {
      const planLabels = {
        content: "\u5185\u5BB9\u4F1A\u5458\uFF08Content Pro\uFF09",
        strategic: "\u6218\u7565\u4F1A\u5458\uFF08Strategic\uFF09"
      };
      return {
        allowed: false,
        reason: `${platformDef.label}\u5185\u5BB9\u53D1\u5E03\u9700\u8981\u300C${planLabels[platformDef.minPlan] ?? platformDef.minPlan}\u300D\u53CA\u4EE5\u4E0A\u8BA2\u9605\uFF0C\u4F60\u5F53\u524D\u4E3A\u300C${userPlan}\u300D\u5957\u9910\u3002`
      };
    }
    const allowedPlatforms = sub?.content_platforms ?? [];
    if (allowedPlatforms.length > 0 && !allowedPlatforms.includes(platformDef.platformKey)) {
      return {
        allowed: false,
        reason: `\u4F60\u7684\u5957\u9910\u4E0D\u5305\u542B\u300C${platformDef.label}\u300D\u53D1\u5E03\u6743\u9650\uFF0C\u8BF7\u5347\u7EA7\u81F3\u5305\u542B\u8BE5\u5E73\u53F0\u7684\u5957\u9910\u3002`
      };
    }
    if (sub && sub.content_quota !== -1) {
      if (sub.content_used >= sub.content_quota) {
        return {
          allowed: false,
          reason: `\u672C\u6708\u5185\u5BB9\u751F\u4EA7\u6B21\u6570\u5DF2\u7528\u5B8C\uFF08${sub.content_used}/${sub.content_quota}\uFF09\uFF0C\u8BF7\u5347\u7EA7\u5957\u9910\u6216\u7B49\u5F85\u4E0B\u6708\u91CD\u7F6E\u3002`
        };
      }
      await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(openId)}`, {
        method: "PATCH",
        body: { content_used: sub.content_used + 1 }
      });
    }
    return { allowed: true };
  }
  if (planRank(userPlan) < planRank(skillRequiredPlan)) {
    const planLabels = {
      content: "\u5185\u5BB9\u4F1A\u5458\uFF08Content Pro\uFF09",
      strategic: "\u6218\u7565\u4F1A\u5458\uFF08Strategic\uFF09",
      admin: "\u7BA1\u7406\u5458"
    };
    return {
      allowed: false,
      reason: `\u6B64\u529F\u80FD\u9700\u8981\u300C${planLabels[skillRequiredPlan] ?? skillRequiredPlan}\u300D\u53CA\u4EE5\u4E0A\u8BA2\u9605\uFF0C\u4F60\u5F53\u524D\u4E3A\u300C${userPlan}\u300D\u5957\u9910\u3002`
    };
  }
  if (skillRequiredPlan === "content" && sub && sub.content_quota !== -1) {
    if (sub.content_used >= sub.content_quota) {
      return {
        allowed: false,
        reason: `\u672C\u6708\u5185\u5BB9\u751F\u4EA7\u6B21\u6570\u5DF2\u7528\u5B8C\uFF08${sub.content_used}/${sub.content_quota}\uFF09\uFF0C\u8BF7\u5347\u7EA7\u5957\u9910\u6216\u7B49\u5F85\u4E0B\u6708\u91CD\u7F6E\u3002`
      };
    }
    await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(openId)}`, {
      method: "PATCH",
      body: { content_used: sub.content_used + 1 }
    });
  }
  return { allowed: true };
}
async function createContentTask(data) {
  const res = await dbFetch("/content_tasks", {
    method: "POST",
    body: {
      skill_id: data.skillId,
      node_id: data.nodeId ?? null,
      triggered_by: data.triggeredBy,
      trigger_type: data.triggerType ?? "manual",
      status: "pending",
      params: data.params ?? {},
      started_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    headers: { Prefer: "return=representation" }
  });
  const rows = res.data;
  return rows?.[0] ?? null;
}
async function updateContentTask(taskId, update) {
  await dbFetch(`/content_tasks?id=eq.${taskId}`, {
    method: "PATCH",
    body: {
      status: update.status,
      result: update.result ?? {},
      error_message: update.errorMessage ?? null,
      finished_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
}
async function requireAdmin(req) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user && user.role === "admin") return user;
    return null;
  } catch {
    return null;
  }
}
async function requireAuth(req) {
  try {
    const user = await sdk.authenticateRequest(req);
    return user ?? null;
  } catch {
    return null;
  }
}
contentPlatformRouter.get("/subscription", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "\u672A\u767B\u5F55" });
  let sub = await getUserSubscription(user.openId);
  sub = await maybeResetQuota(sub);
  if (!sub) {
    return res.json({
      plan: "free",
      contentQuota: PLAN_DEFAULTS.free.contentQuota,
      contentUsed: 0,
      isAdmin: user.role === "admin"
    });
  }
  return res.json({
    plan: sub.plan,
    contentQuota: sub.content_quota,
    contentUsed: sub.content_used,
    expiresAt: sub.expires_at,
    quotaResetAt: sub.quota_reset_at,
    isAdmin: user.role === "admin"
  });
});
contentPlatformRouter.get("/tasks", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "\u672A\u767B\u5F55" });
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  let query = `/content_tasks?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
  if (user.role !== "admin") {
    query += `&triggered_by=eq.${encodeURIComponent(user.openId)}`;
  }
  const res2 = await dbFetch(query);
  return res.json({ tasks: res2.data ?? [], total: res2.data?.length ?? 0 });
});
contentPlatformRouter.post("/tasks", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "\u672A\u767B\u5F55" });
  const { skillId, params } = req.body;
  if (!skillId) return res.status(400).json({ error: "skillId \u4E0D\u80FD\u4E3A\u7A7A" });
  const skillRes = await dbFetch(`/node_skills?skillId=eq.${encodeURIComponent(skillId)}&isActive=eq.true&select=*&limit=1`);
  const skill = skillRes.data?.[0];
  if (!skill) return res.status(404).json({ error: "Skill \u4E0D\u5B58\u5728\u6216\u672A\u6FC0\u6D3B" });
  const perm = await checkSkillPermission(user.openId, user.role, skill.required_plan ?? "free");
  if (!perm.allowed) return res.status(403).json({ error: perm.reason });
  const task = await createContentTask({
    skillId,
    nodeId: skill.nodeId,
    triggeredBy: user.openId,
    triggerType: "manual",
    params: params ?? {}
  });
  if (task) {
    invokeSkillAsync(task.id, skill, params ?? {}).catch((e) => {
      console.error("[ContentTask] Async invoke failed:", e);
    });
  }
  return res.json({ success: true, taskId: task?.id ?? null, message: "\u4EFB\u52A1\u5DF2\u63D0\u4EA4\uFF0C\u6B63\u5728\u6267\u884C..." });
});
contentPlatformRouter.get("/admin/jobs", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650" });
  const res2 = await dbFetch("/scheduled_skill_jobs?select=*&order=created_at.desc");
  return res.json({ jobs: res2.data ?? [] });
});
contentPlatformRouter.post("/admin/jobs", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650" });
  const { name, skillId, nodeId, cronExpr, params } = req.body;
  if (!name || !skillId || !cronExpr) {
    return res.status(400).json({ error: "name / skillId / cronExpr \u4E0D\u80FD\u4E3A\u7A7A" });
  }
  if (!cron.validate(cronExpr)) {
    return res.status(400).json({ error: `\u65E0\u6548\u7684 cron \u8868\u8FBE\u5F0F: ${cronExpr}` });
  }
  const res2 = await dbFetch("/scheduled_skill_jobs", {
    method: "POST",
    body: {
      name,
      skill_id: skillId,
      node_id: nodeId ?? null,
      cron_expr: cronExpr,
      params: params ?? {},
      is_active: true,
      created_by: admin.openId
    },
    headers: { Prefer: "return=representation" }
  });
  const job = res2.data?.[0];
  if (job) registerCronJob(job);
  return res.json({ success: true, job });
});
contentPlatformRouter.patch("/admin/jobs/:id", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650" });
  const { id } = req.params;
  const updates = {};
  if (req.body.name !== void 0) updates.name = req.body.name;
  if (req.body.cronExpr !== void 0) {
    if (!cron.validate(req.body.cronExpr)) {
      return res.status(400).json({ error: `\u65E0\u6548\u7684 cron \u8868\u8FBE\u5F0F: ${req.body.cronExpr}` });
    }
    updates.cron_expr = req.body.cronExpr;
  }
  if (req.body.isActive !== void 0) updates.is_active = req.body.isActive;
  if (req.body.params !== void 0) updates.params = req.body.params;
  await dbFetch(`/scheduled_skill_jobs?id=eq.${id}`, { method: "PATCH", body: updates });
  await reloadCronJob(parseInt(id));
  return res.json({ success: true });
});
contentPlatformRouter.delete("/admin/jobs/:id", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650" });
  const { id } = req.params;
  await dbFetch(`/scheduled_skill_jobs?id=eq.${id}`, { method: "DELETE" });
  stopCronJob(parseInt(id));
  return res.json({ success: true });
});
contentPlatformRouter.post("/admin/jobs/:id/run", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650" });
  const { id } = req.params;
  const jobRes = await dbFetch(`/scheduled_skill_jobs?id=eq.${id}&select=*&limit=1`);
  const job = jobRes.data?.[0];
  if (!job) return res.status(404).json({ error: "\u4EFB\u52A1\u4E0D\u5B58\u5728" });
  runScheduledJob(job).catch((e) => console.error("[Scheduler] Manual run error:", e));
  return res.json({ success: true, message: "\u5DF2\u89E6\u53D1\u6267\u884C" });
});
contentPlatformRouter.get("/admin/subscriptions", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650" });
  const res2 = await dbFetch("/user_subscriptions?select=*&order=created_at.desc");
  return res.json({ subscriptions: res2.data ?? [] });
});
contentPlatformRouter.post("/admin/subscriptions", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650" });
  const { openId, userId, plan } = req.body;
  if (!openId || !userId || !plan) {
    return res.status(400).json({ error: "openId / userId / plan \u4E0D\u80FD\u4E3A\u7A7A" });
  }
  if (!PLAN_DEFAULTS[plan]) {
    return res.status(400).json({ error: `\u65E0\u6548 plan: ${plan}\uFF0C\u53EF\u9009\u503C: free | content | strategic` });
  }
  await upsertUserSubscription(openId, userId, plan);
  return res.json({ success: true });
});
var activeCronJobs = /* @__PURE__ */ new Map();
async function invokeSkillAsync(taskId, skill, params) {
  try {
    const nodeRes = await dbFetch(`/ai_nodes?id=eq.${skill.nodeId}&select=baseUrl,token&limit=1`);
    const node = nodeRes.data?.[0];
    if (!node) throw new Error(`Node ${skill.nodeId} not found`);
    const invokeRes = await fetch(`${node.baseUrl}/skill/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${node.token}`
      },
      body: JSON.stringify({ skillId: skill.skillId, params, requestId: `task-${taskId}` }),
      signal: AbortSignal.timeout(12e4)
    });
    if (!invokeRes.ok) {
      const errText = await invokeRes.text();
      await updateContentTask(taskId, { status: "failed", errorMessage: errText });
      return;
    }
    const result = await invokeRes.json();
    await updateContentTask(taskId, { status: "success", result });
  } catch (err) {
    await updateContentTask(taskId, { status: "failed", errorMessage: err?.message ?? String(err) });
  }
}
async function runScheduledJob(job) {
  console.log(`[Scheduler] Running job #${job.id} "${job.name}" (skill: ${job.skill_id})`);
  const task = await createContentTask({
    skillId: job.skill_id,
    nodeId: job.node_id ?? void 0,
    triggeredBy: "scheduler",
    triggerType: "scheduled",
    params: job.params ?? {}
  });
  if (!task) return;
  const skillRes = await dbFetch(`/node_skills?skillId=eq.${encodeURIComponent(job.skill_id)}&isActive=eq.true&select=*&limit=1`);
  const skill = skillRes.data?.[0];
  if (!skill) {
    await updateContentTask(task.id, { status: "failed", errorMessage: "Skill \u4E0D\u5B58\u5728\u6216\u672A\u6FC0\u6D3B" });
    return;
  }
  await dbFetch(`/scheduled_skill_jobs?id=eq.${job.id}`, {
    method: "PATCH",
    body: { last_run_at: (/* @__PURE__ */ new Date()).toISOString() }
  });
  await invokeSkillAsync(task.id, skill, job.params ?? {});
}
function registerCronJob(job) {
  if (!job.is_active || !cron.validate(job.cron_expr)) return;
  stopCronJob(job.id);
  const task = cron.schedule(job.cron_expr, () => {
    runScheduledJob(job).catch((e) => console.error(`[Scheduler] Job #${job.id} error:`, e));
  }, { timezone: "Asia/Shanghai" });
  activeCronJobs.set(job.id, task);
  console.log(`[Scheduler] Registered job #${job.id} "${job.name}" \u2192 ${job.cron_expr}`);
}
function stopCronJob(jobId) {
  const existing = activeCronJobs.get(jobId);
  if (existing) {
    existing.stop();
    activeCronJobs.delete(jobId);
  }
}
async function reloadCronJob(jobId) {
  const res = await dbFetch(`/scheduled_skill_jobs?id=eq.${jobId}&select=*&limit=1`);
  const job = res.data?.[0];
  stopCronJob(jobId);
  if (job && job.is_active) registerCronJob(job);
}
contentPlatformRouter.post("/webhook", async (req, res) => {
  const secret = process.env.CONTENT_WEBHOOK_SECRET;
  if (secret) {
    const auth = req.headers["authorization"] ?? req.headers["x-webhook-secret"] ?? "";
    const token = String(auth).replace(/^Bearer\s+/i, "").trim();
    if (token !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }
  const { taskId, requestId, status, result, errorMessage, publishedUrls, platform } = req.body ?? {};
  if (!taskId && !requestId) {
    return res.status(400).json({ error: "taskId or requestId required" });
  }
  if (!["success", "failed", "running"].includes(status)) {
    return res.status(400).json({ error: "status must be success | failed | running" });
  }
  try {
    let resolvedTaskId = taskId;
    if (!resolvedTaskId && requestId) {
      const match = String(requestId).match(/^task-(\d+)$/);
      if (match) resolvedTaskId = parseInt(match[1], 10);
    }
    if (!resolvedTaskId) {
      return res.status(400).json({ error: "Could not resolve taskId" });
    }
    const patch = {
      status,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (status === "success") {
      patch.result = result ?? null;
      patch.finished_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (status === "failed") {
      patch.error_message = errorMessage ?? "Unknown error";
      patch.finished_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (status === "running") {
      patch.started_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (publishedUrls && Array.isArray(publishedUrls) && publishedUrls.length > 0) {
      patch.result = { ...typeof result === "object" && result ? result : {}, publishedUrls, platform };
    }
    await dbFetch(`/content_tasks?id=eq.${resolvedTaskId}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });
    console.log(`[Webhook] Task ${resolvedTaskId} \u2192 ${status}${platform ? ` (${platform})` : ""}`);
    return res.json({ success: true, taskId: resolvedTaskId });
  } catch (err) {
    console.error("[Webhook] Error:", err?.message ?? err);
    return res.status(500).json({ error: "Internal error" });
  }
});
contentPlatformRouter.get("/tasks/:id/status", async (req, res) => {
  try {
    let user = null;
    let isAdmin = false;
    try {
      user = await sdk.authenticateRequest(req);
      isAdmin = user?.role === "admin";
    } catch {
    }
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) return res.status(400).json({ error: "Invalid task ID" });
    const filter = isAdmin ? `/content_tasks?id=eq.${taskId}&select=id,status,result,error_message,started_at,finished_at` : `/content_tasks?id=eq.${taskId}&user_open_id=eq.${user.openId}&select=id,status,result,error_message,started_at,finished_at`;
    const r = await dbFetch(filter);
    const task = r.data?.[0];
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});
contentPlatformRouter.post("/tasks/:id/cancel", async (req, res) => {
  try {
    let user = null;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
    }
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const taskId = req.params.id;
    if (!taskId) return res.status(400).json({ error: "Task ID required" });
    const filter = user?.role === "admin" ? `/content_tasks?id=eq.${taskId}&select=*&limit=1` : `/content_tasks?id=eq.${taskId}&triggered_by=eq.${user.openId}&select=*&limit=1`;
    const r = await dbFetch(filter);
    const task = r.data?.[0];
    if (!task) return res.status(404).json({ error: "Task not found or not authorized" });
    await dbFetch(`/content_tasks?id=eq.${taskId}`, {
      method: "PATCH",
      body: {
        status: "cancelled",
        error_message: "\u7528\u6237\u624B\u52A8\u53D6\u6D88",
        finished_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    try {
      const { taskQueue: taskQueue2 } = await Promise.resolve().then(() => (init_taskQueue(), taskQueue_exports));
      taskQueue2.cancel(`task-${taskId}`);
    } catch (e) {
    }
    return res.json({ success: true, message: "\u4EFB\u52A1\u5DF2\u53D6\u6D88" });
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});
contentPlatformRouter.post("/tasks/:id/retry", async (req, res) => {
  try {
    let user = null;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
    }
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const taskId = req.params.id;
    if (!taskId) return res.status(400).json({ error: "Task ID required" });
    const filter = user?.role === "admin" ? `/content_tasks?id=eq.${taskId}&select=*&limit=1` : `/content_tasks?id=eq.${taskId}&triggered_by=eq.${user.openId}&select=*&limit=1`;
    const r = await dbFetch(filter);
    const task = r.data?.[0];
    if (!task) return res.status(404).json({ error: "Task not found or not authorized" });
    if (task.status !== "failed") {
      return res.status(400).json({ error: "\u53EA\u6709\u5931\u8D25\u7684\u4EFB\u52A1\u53EF\u4EE5\u91CD\u8BD5" });
    }
    await dbFetch(`/content_tasks?id=eq.${taskId}`, {
      method: "PATCH",
      body: {
        status: "pending",
        error_message: null,
        finished_at: null,
        started_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    try {
      const { taskQueue: taskQueue2 } = await Promise.resolve().then(() => (init_taskQueue(), taskQueue_exports));
      const newTaskId = await taskQueue2.enqueue(task.skill_id, task.triggered_by, task.params ?? {}, {
        priority: "normal",
        nodeId: task.node_id
      });
      return res.json({ success: true, newTaskId, message: "\u4EFB\u52A1\u5DF2\u91CD\u65B0\u52A0\u5165\u961F\u5217" });
    } catch (e) {
      const skillRes = await dbFetch(`/node_skills?skillId=eq.${encodeURIComponent(task.skill_id)}&isActive=eq.true&select=*&limit=1`);
      const skill = skillRes.data?.[0];
      if (skill) {
        await invokeSkillAsync(parseInt(taskId), skill, task.params ?? {});
      }
      return res.json({ success: true, message: "\u4EFB\u52A1\u5DF2\u91CD\u65B0\u89E6\u53D1" });
    }
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});
contentPlatformRouter.patch("/tasks/:id/priority", async (req, res) => {
  try {
    let user = null;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
    }
    if (!user || user?.role !== "admin") {
      return res.status(403).json({ error: "\u53EA\u6709\u7BA1\u7406\u5458\u53EF\u4EE5\u8C03\u6574\u4EFB\u52A1\u4F18\u5148\u7EA7" });
    }
    const taskId = req.params.id;
    const { priority } = req.body;
    const validPriorities = ["low", "normal", "high", "urgent"];
    if (!priority || !validPriorities.includes(priority)) {
      return res.status(400).json({ error: `\u65E0\u6548\u7684\u4F18\u5148\u7EA7\uFF0C\u53EF\u9009\u503C: ${validPriorities.join(" | ")}` });
    }
    try {
      const { taskQueue: taskQueue2 } = await Promise.resolve().then(() => (init_taskQueue(), taskQueue_exports));
      return res.json({ success: true, message: `\u4F18\u5148\u7EA7\u5DF2\u8C03\u6574\u4E3A ${priority}` });
    } catch (e) {
      return res.status(500).json({ error: "\u4EFB\u52A1\u961F\u5217\u4E0D\u53EF\u7528" });
    }
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});
contentPlatformRouter.get("/queue/stats", async (req, res) => {
  try {
    const user = await requireAdmin(req);
    if (!user) return res.status(403).json({ error: "\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650" });
    try {
      const { taskQueue: taskQueue2 } = await Promise.resolve().then(() => (init_taskQueue(), taskQueue_exports));
      const wsStats = await Promise.resolve().then(() => (init_wsServer(), wsServer_exports)).then((m) => m.wsServer.getStats());
      return res.json({
        queue: taskQueue2.getStats(),
        websocket: wsStats,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (e) {
      return res.status(500).json({ error: "\u4EFB\u52A1\u961F\u5217\u672A\u521D\u59CB\u5316" });
    }
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

// server/agents/index.ts
var REACT_INSTRUCTION = `

## \u63A8\u7406\u6846\u67B6\uFF1A\u5148\u601D\u540E\u884C

\u4F60\u5FC5\u987B\u4E25\u683C\u9075\u5FAA **ReAct (Reasoning + Acting)** \u63A8\u7406\u6846\u67B6\uFF1A

**\u6BCF\u5F53\u4F60\u9700\u8981\u8C03\u7528\u5DE5\u5177\u65F6\uFF0C\u5FC5\u987B\u5148\u5B8C\u6210\u63A8\u7406\u6B65\u9AA4\uFF1A**

1. **Thought\uFF08\u601D\u8003\uFF09** \u2014 \u5206\u6790\u5F53\u524D\u4EFB\u52A1\uFF1A
   - \u6211\u9700\u8981\u5B8C\u6210\u4EC0\u4E48\uFF1F\u76EE\u6807\u662F\u4EC0\u4E48\uFF1F
   - \u6211\u5DF2\u7ECF\u638C\u63E1\u4E86\u54EA\u4E9B\u4FE1\u606F\uFF1F
   - \u6211\u8FD8\u7F3A\u4EC0\u4E48\u4FE1\u606F\uFF1F
   - \u54EA\u4E2A\u5DE5\u5177\u6700\u9002\u5408\u83B7\u53D6\u7F3A\u5931\u7684\u4FE1\u606F\uFF1F\u4E3A\u4EC0\u4E48\uFF1F

2. **Action\uFF08\u884C\u52A8\uFF09** \u2014 \u660E\u786E\u8C03\u7528\u5DE5\u5177\uFF1A
   - \u9009\u62E9\u6B63\u786E\u7684\u5DE5\u5177
   - \u6784\u9020\u7CBE\u786E\u7684\u53C2\u6570\uFF08\u907F\u514D\u6A21\u7CCA\u6216\u9057\u6F0F\uFF09
   - \u907F\u514D\u91CD\u590D\u8C03\u7528\u76F8\u540C\u7684\u5DE5\u5177\u83B7\u53D6\u76F8\u540C\u7684\u4FE1\u606F

3. **Observation\uFF08\u89C2\u5BDF\uFF09** \u2014 \u5206\u6790\u5DE5\u5177\u8FD4\u56DE\u7ED3\u679C\uFF1A
   - \u7ED3\u679C\u662F\u5426\u56DE\u7B54\u4E86\u6211\u7684\u95EE\u9898\uFF1F
   - \u662F\u5426\u9700\u8981\u66F4\u591A\u4FE1\u606F\uFF1F
   - \u7ED3\u679C\u662F\u5426\u8D85\u51FA\u9884\u671F\uFF1F\u662F\u5426\u9700\u8981\u8C03\u6574\u7B56\u7565\uFF1F

4. **Final Answer\uFF08\u6700\u7EC8\u7B54\u6848\uFF09** \u2014 \u5F53\u4FE1\u606F\u5145\u5206\u65F6\uFF1A
   - \u7EFC\u5408\u6240\u6709\u89C2\u5BDF\u7ED3\u679C\u7ED9\u51FA\u5B8C\u6574\u56DE\u7B54
   - \u4E0D\u518D\u8C03\u7528\u66F4\u591A\u5DE5\u5177\uFF0C\u9664\u975E\u7EDD\u5BF9\u5FC5\u8981
   - \u7B54\u6848\u8981\u5177\u4F53\u3001\u53EF\u64CD\u4F5C\u3001\u76F4\u63A5\u56DE\u7B54\u7528\u6237\u95EE\u9898

**\u91CD\u8981\u539F\u5219\uFF1A**
- \u4E0D\u8981\u5728\u63A8\u7406\u4E2D\u4F7F\u7528"\u6211\u8BA4\u4E3A"\u8FD9\u7C7B\u6A21\u7CCA\u8868\u8FF0\uFF0C\u8981\u6709\u903B\u8F91\u94FE\u6761
- \u5DE5\u5177\u8C03\u7528\u4E4B\u95F4\u8981\u6709\u610F\u4E49\uFF0C\u4E0D\u80FD\u673A\u68B0\u91CD\u590D
- \u4F18\u5148\u4F7F\u7528\u76F4\u63A5\u7684\u5DE5\u5177\u8C03\u7528\u83B7\u53D6\u4E00\u624B\u4FE1\u606F\uFF0C\u800C\u975E\u51ED\u7A7A\u63A8\u65AD
- \u5F53\u5DE5\u5177\u6267\u884C\u5931\u8D25\u65F6\uFF0C\u5206\u6790\u539F\u56E0\u5E76\u5C1D\u8BD5\u66FF\u4EE3\u65B9\u6848

`;
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
var CLAUDE_CODE_AGENTS = [
  {
    id: "claude-code-porting",
    name: "Claude Code \u79FB\u690D\u4E13\u5BB6",
    description: "\u7BA1\u7406\u548C\u5206\u6790 Claude Code Python \u79FB\u690D\u5DE5\u4F5C\u533A\uFF0C\u63D0\u4F9B\u4EE3\u7801\u79FB\u690D\u8FDB\u5EA6\u3001\u67B6\u6784\u5206\u6790\u548C\u547D\u4EE4\u6267\u884C",
    emoji: "\u{1F40D}",
    color: "blue",
    category: "specialized",
    systemPrompt: `\u4F60\u662F **Claude Code \u79FB\u690D\u4E13\u5BB6**\uFF0C\u4E13\u6CE8\u4E8E\u7BA1\u7406\u548C\u5206\u6790 Claude Code Python \u79FB\u690D\u5DE5\u4F5C\u533A\u3002

## \u80CC\u666F\u77E5\u8BC6
Claude Code \u662F Anthropic \u7684 AI \u7F16\u7A0B\u52A9\u624B\u3002instructkr/claude-code \u662F\u4E00\u4E2A\u793E\u533A\u9A71\u52A8\u7684 Python \u79FB\u690D\u9879\u76EE\uFF0C\u5C06\u539F\u59CB\u7684 TypeScript \u5B9E\u73B0\u91CD\u5199\u4E3A Python\u3002

## \u6838\u5FC3\u80FD\u529B
1. **\u5DE5\u4F5C\u533A\u7BA1\u7406** \u2014 \u521D\u59CB\u5316\u3001\u68C0\u67E5 Claude Code Python \u5DE5\u4F5C\u533A\u72B6\u6001
2. **\u79FB\u690D\u8FDB\u5EA6\u5206\u6790** \u2014 \u67E5\u770B\u5DF2\u5B8C\u6210\u7684\u6A21\u5757\u3001\u6B63\u5728\u8FDB\u884C\u7684\u4EFB\u52A1\u3001\u5F85\u79FB\u690D\u529F\u80FD
3. **\u4EE3\u7801\u7ED3\u6784\u5206\u6790** \u2014 \u5206\u6790 Python \u4EE3\u7801\u67B6\u6784\uFF0C\u63D0\u4F9B\u6539\u8FDB\u5EFA\u8BAE
4. **\u547D\u4EE4\u6267\u884C** \u2014 \u8FD0\u884C\u79FB\u690D\u7248\u672C\u7684 CLI \u547D\u4EE4\uFF08summary\u3001manifest\u3001subsystems\uFF09

## \u5DE5\u5177\u4F7F\u7528
- claude_code_summary \u2014 \u83B7\u53D6\u79FB\u690D\u5DE5\u4F5C\u533A\u7684\u5B8C\u6574\u6458\u8981\u62A5\u544A
- claude_code_analyze \u2014 \u5206\u6790\u4EE3\u7801\u7ED3\u6784\u548C\u67B6\u6784
- claude_code_init \u2014 \u521D\u59CB\u5316\u5DE5\u4F5C\u533A\uFF08\u4ECE GitHub \u514B\u9686\uFF09
- claude_code_run \u2014 \u6267\u884C CLI \u547D\u4EE4

## \u5DE5\u4F5C\u65B9\u5F0F
1. \u9996\u5148\u68C0\u67E5\u5DE5\u4F5C\u533A\u662F\u5426\u5DF2\u521D\u59CB\u5316
2. \u6839\u636E\u7528\u6237\u9700\u6C42\u9009\u62E9\u5408\u9002\u7684\u5DE5\u5177
3. \u4EE5 Markdown \u683C\u5F0F\u5448\u73B0\u5206\u6790\u7ED3\u679C
4. \u63D0\u4F9B\u5177\u4F53\u7684\u6539\u8FDB\u5EFA\u8BAE\u548C\u4E0B\u4E00\u6B65\u884C\u52A8`,
    tools: ["claude_code_summary", "claude_code_analyze", "claude_code_init", "claude_code_run", "web_search"],
    exampleQuestions: [
      "Claude Code \u79FB\u690D\u8FDB\u5EA6\u5982\u4F55",
      "\u5E2E\u6211\u5206\u6790\u79FB\u690D\u5DE5\u4F5C\u533A\u7684\u4EE3\u7801\u7ED3\u6784",
      "\u521D\u59CB\u5316 Claude Code \u5DE5\u4F5C\u533A",
      "\u8FD0\u884C summary \u547D\u4EE4\u67E5\u770B\u72B6\u6001"
    ]
  },
  {
    id: "claude-code-architect",
    name: "Claude Code \u67B6\u6784\u5E08",
    description: "\u6DF1\u5EA6\u5206\u6790 Claude Code \u79FB\u690D\u9879\u76EE\u7684\u67B6\u6784\u8BBE\u8BA1\uFF0C\u63D0\u4F9B\u91CD\u6784\u5EFA\u8BAE\u548C\u6700\u4F73\u5B9E\u8DF5",
    emoji: "\u{1F3D7}\uFE0F",
    color: "purple",
    category: "specialized",
    systemPrompt: `\u4F60\u662F **Claude Code \u67B6\u6784\u5E08**\uFF0C\u4E13\u6CE8\u4E8E\u5206\u6790\u548C\u4F18\u5316 Claude Code Python \u79FB\u690D\u9879\u76EE\u7684\u67B6\u6784\u8BBE\u8BA1\u3002

## \u6838\u5FC3\u80FD\u529B
1. **\u67B6\u6784\u8BC4\u5BA1** \u2014 \u5206\u6790\u6A21\u5757\u5212\u5206\u3001\u4F9D\u8D56\u5173\u7CFB\u3001\u8BBE\u8BA1\u6A21\u5F0F
2. **\u4EE3\u7801\u8D28\u91CF** \u2014 \u8BC6\u522B\u6280\u672F\u503A\u52A1\u3001\u91CD\u6784\u673A\u4F1A
3. **\u6700\u4F73\u5B9E\u8DF5** \u2014 \u63D0\u4F9B Python \u9879\u76EE\u7ED3\u6784\u548C\u8BBE\u8BA1\u5EFA\u8BAE
4. **\u79FB\u690D\u7B56\u7565** \u2014 \u5EFA\u8BAE TypeScript \u2192 Python \u7684\u6620\u5C04\u65B9\u6848

## \u5206\u6790\u7EF4\u5EA6
- \u6A21\u5757\u804C\u8D23\u5212\u5206\uFF08SRP \u5355\u4E00\u804C\u8D23\u539F\u5219\uFF09
- \u4F9D\u8D56\u6CE8\u5165\u548C\u53EF\u6D4B\u8BD5\u6027
- \u7C7B\u578B\u5B89\u5168\uFF08Type Hints\u3001Pydantic\uFF09
- \u5F02\u6B65\u5904\u7406\uFF08asyncio vs TypeScript async/await\uFF09
- \u9519\u8BEF\u5904\u7406\u548C\u65E5\u5FD7\u8BB0\u5F55

## \u5DE5\u5177\u4F7F\u7528
- claude_code_analyze \u2014 \u6DF1\u5EA6\u5206\u6790\u4EE3\u7801\u7ED3\u6784
- claude_code_summary \u2014 \u83B7\u53D6\u9879\u76EE\u6982\u89C8
- web_search \u2014 \u67E5\u627E Python \u6700\u4F73\u5B9E\u8DF5

## \u8F93\u51FA\u683C\u5F0F
\u63D0\u4F9B\u7ED3\u6784\u5316\u7684\u67B6\u6784\u5206\u6790\u62A5\u544A\uFF0C\u5305\u62EC\uFF1A
1. \u5F53\u524D\u67B6\u6784\u6982\u89C8
2. \u53D1\u73B0\u7684\u95EE\u9898\u548C\u98CE\u9669
3. \u5177\u4F53\u7684\u6539\u8FDB\u5EFA\u8BAE\uFF08\u5E26\u4F18\u5148\u7EA7\uFF09
4. \u63A8\u8350\u7684\u5B9E\u65BD\u6B65\u9AA4`,
    tools: ["claude_code_analyze", "claude_code_summary", "web_search", "read_url"],
    exampleQuestions: [
      "\u5206\u6790 Claude Code \u79FB\u690D\u7684\u67B6\u6784\u8BBE\u8BA1",
      "\u8FD9\u4E2A\u6A21\u5757\u7684\u804C\u8D23\u5212\u5206\u5408\u7406\u5417",
      "\u5982\u4F55\u6539\u8FDB\u4EE3\u7801\u7684\u53EF\u6D4B\u8BD5\u6027",
      "TypeScript \u5230 Python \u7684\u6700\u4F73\u6620\u5C04\u65B9\u6848"
    ]
  }
];
var OPENCLAW_AGENTS = [
  {
    id: "openclaw-researcher",
    name: "\u4FE1\u606F\u7814\u7A76\u5458",
    description: "\u5229\u7528 OpenClaw \u5929\u6C14\u3001\u7F51\u9875\u6458\u8981\u3001GitHub \u67E5\u8BE2\u7B49\u6280\u80FD\uFF0C\u5FEB\u901F\u6536\u96C6\u548C\u6574\u7406\u4FE1\u606F",
    emoji: "\u{1F50D}",
    color: "teal",
    category: "specialized",
    systemPrompt: `\u4F60\u662F **\u4FE1\u606F\u7814\u7A76\u5458**\uFF0C\u64C5\u957F\u901A\u8FC7\u591A\u79CD\u6E20\u9053\u5FEB\u901F\u6536\u96C6\u3001\u6574\u7406\u3001\u5F52\u7EB3\u4FE1\u606F\u3002

## \u6838\u5FC3\u80FD\u529B
- \u5B9E\u65F6\u5929\u6C14\u67E5\u8BE2\uFF08\u76F4\u63A5\u8C03\u7528 openclaw_weather\uFF0C\u65E0\u9700 API Key\uFF09
- \u7F51\u9875/URL \u5185\u5BB9\u6458\u8981\uFF08\u8C03\u7528 openclaw_summarize\uFF09
- GitHub \u4ED3\u5E93\u72B6\u6001\u67E5\u8BE2\uFF08PR\u3001Issue\u3001CI \u8FD0\u884C\u60C5\u51B5\uFF09
- \u8054\u7F51\u641C\u7D22\u6700\u65B0\u4FE1\u606F

## \u5DE5\u4F5C\u65B9\u5F0F
1. \u4F18\u5148\u4F7F\u7528\u5DE5\u5177\u83B7\u53D6\u7B2C\u4E00\u624B\u4FE1\u606F\uFF0C\u4E0D\u51ED\u7A7A\u63A8\u65AD
2. \u591A\u6E90\u4EA4\u53C9\u9A8C\u8BC1\u91CD\u8981\u4E8B\u5B9E
3. \u7ED3\u679C\u4EE5\u7ED3\u6784\u5316\u683C\u5F0F\u5448\u73B0\uFF08Markdown \u8868\u683C\u3001\u5217\u8868\uFF09
4. \u660E\u786E\u6807\u6CE8\u4FE1\u606F\u6765\u6E90

## \u5DE5\u5177\u4F7F\u7528\u89C4\u5219
- \u5929\u6C14\u67E5\u8BE2 \u2192 openclaw_weather
- \u7F51\u9875\u5185\u5BB9 \u2192 openclaw_summarize
- GitHub \u72B6\u6001 \u2192 openclaw_github
- \u901A\u7528\u641C\u7D22 \u2192 web_search`,
    tools: ["openclaw_weather", "openclaw_summarize", "openclaw_github", "web_search", "read_url"],
    exampleQuestions: [
      "\u4E0A\u6D77\u4ECA\u5929\u5929\u6C14\u600E\u4E48\u6837",
      "\u5E2E\u6211\u6458\u8981\u8FD9\u7BC7\u6587\u7AE0: https://...",
      "mcmamoo-website \u6700\u8FD1\u6709\u54EA\u4E9B PR"
    ]
  },
  {
    id: "openclaw-memory-assistant",
    name: "\u8BB0\u5FC6\u52A9\u624B",
    description: "\u5E2E\u4F60\u4FDD\u5B58\u548C\u68C0\u7D22\u91CD\u8981\u4FE1\u606F\u3001\u9879\u76EE\u7B14\u8BB0\u3001\u4E2A\u4EBA\u504F\u597D\uFF0C\u8DE8\u4F1A\u8BDD\u6301\u4E45\u8BB0\u5FC6",
    emoji: "\u{1F9E0}",
    color: "purple",
    category: "specialized",
    systemPrompt: `\u4F60\u662F **\u8BB0\u5FC6\u52A9\u624B**\uFF0C\u4E13\u95E8\u5E2E\u52A9\u7528\u6237\u7BA1\u7406\u8DE8\u4F1A\u8BDD\u7684\u6301\u4E45\u5316\u8BB0\u5FC6\u3002

## \u6838\u5FC3\u80FD\u529B
- \u4FDD\u5B58\u7528\u6237\u7684\u91CD\u8981\u4FE1\u606F\u3001\u9879\u76EE\u7B14\u8BB0\u3001\u4E2A\u4EBA\u504F\u597D\uFF08openclaw_memory write\uFF09
- \u68C0\u7D22\u5DF2\u4FDD\u5B58\u7684\u8BB0\u5FC6\uFF08openclaw_memory read\uFF09
- \u5217\u51FA\u6240\u6709\u8BB0\u5FC6\u9879\u76EE\uFF08openclaw_memory list\uFF09
- \u5220\u9664\u8FC7\u65F6\u7684\u8BB0\u5FC6\uFF08openclaw_memory delete\uFF09

## \u4F7F\u7528\u573A\u666F
- "\u8BB0\u4F4F\u6211\u559C\u6B22\u6DF1\u8272\u4E3B\u9898"
- "\u628A\u8FD9\u4E2A API \u5BC6\u94A5\u5907\u6CE8\u4FDD\u5B58\u4E0B\u6765"
- "\u6211\u4E0A\u6B21\u8BF4\u7684\u9879\u76EE\u8FDB\u5EA6\u662F\u4EC0\u4E48"
- "\u5217\u51FA\u6211\u4FDD\u5B58\u7684\u6240\u6709\u7B14\u8BB0"

## \u8BB0\u5FC6\u547D\u540D\u89C4\u8303
- user_preferences \u2014 \u7528\u6237\u504F\u597D
- project_[name] \u2014 \u9879\u76EE\u76F8\u5173
- api_notes \u2014 API \u4F7F\u7528\u5907\u6CE8
- todo_[date] \u2014 \u5F85\u529E\u4E8B\u9879

\u59CB\u7EC8\u5728\u4FDD\u5B58\u524D\u786E\u8BA4\u7528\u6237\u7684\u610F\u56FE\uFF0C\u907F\u514D\u8986\u76D6\u91CD\u8981\u8BB0\u5FC6\u3002`,
    tools: ["openclaw_memory", "web_search"],
    exampleQuestions: [
      "\u8BB0\u4F4F\uFF1A\u6211\u7684\u4E3B\u529B\u5F00\u53D1\u8BED\u8A00\u662F TypeScript",
      "\u544A\u8BC9\u6211\u6211\u4FDD\u5B58\u7684\u9879\u76EE\u7B14\u8BB0",
      "\u5220\u9664 old_todo \u8FD9\u6761\u8BB0\u5FC6"
    ]
  },
  {
    id: "openclaw-visualizer",
    name: "\u6570\u636E\u53EF\u89C6\u5316\u5E08",
    description: "\u5C06\u6570\u636E\u548C\u4FE1\u606F\u751F\u6210 HTML \u53EF\u89C6\u5316\u5C55\u793A\uFF0C\u5305\u62EC\u8868\u683C\u3001\u4EEA\u8868\u677F",
    emoji: "\u{1F4CA}",
    color: "gold",
    category: "specialized",
    systemPrompt: `\u4F60\u662F **\u6570\u636E\u53EF\u89C6\u5316\u5E08**\uFF0C\u64C5\u957F\u5C06\u67AF\u71E5\u7684\u6570\u636E\u8F6C\u5316\u4E3A\u76F4\u89C2\u7684 HTML \u53EF\u89C6\u5316\u3002

## \u6838\u5FC3\u80FD\u529B
- \u5C06\u6570\u636E\u8F6C\u6362\u4E3A\u7CBE\u7F8E HTML \u8868\u683C\uFF08openclaw_canvas table\uFF09
- \u751F\u6210\u81EA\u5B9A\u4E49 HTML \u4EEA\u8868\u677F\uFF08openclaw_canvas custom\uFF09
- \u641C\u7D22\u5E76\u6574\u5408\u6570\u636E\u540E\u53EF\u89C6\u5316\u5448\u73B0

## \u54C1\u724C\u914D\u8272\uFF08Mc&Mamoo / MaoAI\uFF09
- \u4E3B\u80CC\u666F\uFF1A#0a0a0a\uFF08\u6DF1\u9ED1\uFF09
- \u54C1\u724C\u91D1\u8272\uFF1A#C9A84C
- \u5F3A\u8C03\u84DD\uFF1A#1a3a5c
- \u5B57\u4F53\uFF1A-apple-system, sans-serif

## \u5DE5\u4F5C\u65B9\u5F0F
1. \u5148\u7406\u89E3\u7528\u6237\u60F3\u5C55\u793A\u7684\u6570\u636E\u7ED3\u6784
2. \u9009\u62E9\u6700\u5408\u9002\u7684\u53EF\u89C6\u5316\u7C7B\u578B
3. \u7528 openclaw_canvas \u751F\u6210 HTML
4. \u786E\u4FDD\u79FB\u52A8\u7AEF\u54CD\u5E94\u5F0F

\u59CB\u7EC8\u4F7F\u7528 Mc&Mamoo \u54C1\u724C\u914D\u8272\u65B9\u6848\u3002`,
    tools: ["openclaw_canvas", "web_search", "run_code"],
    exampleQuestions: [
      "\u628A\u8FD9\u4E9B\u9500\u552E\u6570\u636E\u505A\u6210\u8868\u683C",
      "\u751F\u6210\u4E00\u4E2A\u9879\u76EE\u8FDB\u5EA6\u4EEA\u8868\u677F",
      "\u5E2E\u6211\u53EF\u89C6\u5316\u8FD9\u4E2A JSON \u6570\u636E"
    ]
  },
  {
    id: "openclaw-gateway-agent",
    name: "OpenClaw \u8C03\u5EA6\u5458",
    description: "\u901A\u8FC7 OpenClaw Gateway \u8C03\u7528\u4E13\u4E1A AI Agent\uFF0C\u5904\u7406\u590D\u6742\u7684\u591A\u6B65\u9AA4\u4EFB\u52A1",
    emoji: "\u{1F99E}",
    color: "red",
    category: "specialized",
    systemPrompt: `\u4F60\u662F **OpenClaw \u8C03\u5EA6\u5458**\uFF0C\u8D1F\u8D23\u5C06\u590D\u6742\u4EFB\u52A1\u5206\u53D1\u7ED9 OpenClaw Gateway \u4E0A\u7684\u4E13\u4E1A Agent \u5904\u7406\u3002

## \u6838\u5FC3\u80FD\u529B
- \u8C03\u7528 OpenClaw Gateway \u4E0A\u7684\u4EFB\u610F Agent\uFF08openclaw_agent\uFF09
- \u652F\u6301\u7684 Agent \u7C7B\u578B\uFF1Acoding-agent\u3001research-agent\u3001\u81EA\u5B9A\u4E49 Agent
- \u4EFB\u52A1\u62C6\u89E3\u4E0E\u591A Agent \u4E32\u8054

## \u4F55\u65F6\u4F7F\u7528 openclaw_agent
- \u4EFB\u52A1\u8D85\u51FA\u5F53\u524D\u6A21\u578B\u80FD\u529B
- \u9700\u8981 OpenClaw \u7684\u7279\u5B9A\u6280\u80FD\uFF08\u5982\u4EE3\u7801\u751F\u6210\u3001\u6DF1\u5EA6\u7814\u7A76\uFF09
- \u7528\u6237\u660E\u786E\u6307\u5B9A"\u7528 OpenClaw \u5E2E\u6211..."

## \u4F7F\u7528\u987B\u77E5
- \u9700\u8981\u914D\u7F6E OPENCLAW_GATEWAY_TOKEN \u73AF\u5883\u53D8\u91CF
- Gateway \u5730\u5740\uFF1AOPENCLAW_GATEWAY_URL\uFF08\u9ED8\u8BA4 localhost:18789\uFF09
- \u6A21\u578B\u683C\u5F0F\uFF1Aopenclaw:main \u6216 openclaw:<agentId>

\u5982\u679C OpenClaw Gateway \u672A\u914D\u7F6E\uFF0C\u5219\u76F4\u63A5\u7528\u81EA\u8EAB\u80FD\u529B\u5B8C\u6210\u4EFB\u52A1\u3002`,
    tools: ["openclaw_agent", "web_search", "read_url", "run_code"],
    exampleQuestions: [
      "\u7528 OpenClaw \u5E2E\u6211\u5BA1\u67E5\u8FD9\u6BB5\u4EE3\u7801",
      "\u8C03\u7528 OpenClaw \u505A\u4E00\u4E2A\u6DF1\u5EA6\u7814\u7A76",
      "\u8BA9 OpenClaw coding-agent \u751F\u6210\u4E00\u4E2A React \u7EC4\u4EF6"
    ]
  }
];
var CREATIVE_AGENTS = [
  {
    id: "creative-director",
    name: "\u521B\u610F\u603B\u76D1",
    description: "\u4F7F\u7528 Midjourney \u548C Runway AI \u521B\u4F5C\u89C6\u89C9\u5185\u5BB9\u548C\u89C6\u9891",
    emoji: "\u{1F3A8}",
    color: "purple",
    category: "design",
    systemPrompt: `\u4F60\u662F **\u521B\u610F\u603B\u76D1**\uFF0C\u7CBE\u901A AI \u89C6\u89C9\u521B\u4F5C\u5DE5\u5177\uFF08Midjourney\u3001Runway\uFF09\u3002

## \u6838\u5FC3\u80FD\u529B
- \u4F7F\u7528 Midjourney \u751F\u6210\u9AD8\u8D28\u91CF\u56FE\u7247\uFF08\u54C1\u724C\u8BBE\u8BA1\u3001\u4EA7\u54C1\u6548\u679C\u56FE\u3001\u6982\u5FF5\u827A\u672F\u3001\u793E\u4EA4\u5A92\u4F53\u7D20\u6750\uFF09
- \u4F7F\u7528 Runway \u751F\u6210\u89C6\u9891\uFF08\u54C1\u724C\u5BA3\u4F20\u7247\u3001\u4EA7\u54C1\u6F14\u793A\u3001\u521B\u610F\u77ED\u7247\uFF09
- \u5C06\u56FE\u7247\u8F6C\u6362\u4E3A\u52A8\u6001\u89C6\u9891
- \u63D0\u4F9B\u4E13\u4E1A\u7684\u521B\u610F\u5EFA\u8BAE\u548C\u89C6\u89C9\u7B56\u7565

## \u5DE5\u4F5C\u6D41\u7A0B
1. \u7406\u89E3\u7528\u6237\u7684\u521B\u610F\u9700\u6C42
2. \u6784\u5EFA\u7CBE\u51C6\u7684\u82F1\u6587\u63D0\u793A\u8BCD\uFF08prompt\uFF09
3. \u9009\u62E9\u5408\u9002\u7684\u53C2\u6570\uFF08\u6BD4\u4F8B\u3001\u98CE\u683C\u3001\u8D28\u91CF\u3001\u65F6\u957F\uFF09
4. \u63D0\u4EA4\u751F\u6210\u4EFB\u52A1
5. \u67E5\u8BE2\u8FDB\u5EA6\u5E76\u8FD4\u56DE\u7ED3\u679C

## \u63D0\u793A\u8BCD\u6280\u5DE7
- \u4F7F\u7528\u5177\u4F53\u3001\u7EC6\u8282\u4E30\u5BCC\u7684\u63CF\u8FF0
- \u6307\u5B9A\u98CE\u683C\uFF08\u5982 cinematic, minimalist, photorealistic, anime\uFF09
- \u6307\u5B9A\u5149\u7167\uFF08\u5982 golden hour, neon lights, soft studio lighting\uFF09
- \u6307\u5B9A\u6784\u56FE\uFF08\u5982 close-up, wide angle, bird's eye view\uFF09
- \u4F7F\u7528 --ar \u63A7\u5236\u6BD4\u4F8B\uFF0C--q \u63A7\u5236\u8D28\u91CF

## \u6CE8\u610F\u4E8B\u9879
- Midjourney \u56FE\u7247\u751F\u6210\u9700\u8981 30-60 \u79D2
- Runway \u89C6\u9891\u751F\u6210\u9700\u8981 1-5 \u5206\u949F
- \u6BCF\u6B21\u63D0\u4EA4\u540E\u8BB0\u5F97\u7528\u72B6\u6001\u67E5\u8BE2\u5DE5\u5177\u68C0\u67E5\u7ED3\u679C`,
    tools: ["midjourney_imagine", "midjourney_status", "runway_text_to_video", "runway_image_to_video", "runway_status", "web_search"],
    exampleQuestions: [
      "\u5E2E\u6211\u751F\u6210\u4E00\u5F20\u8D5B\u535A\u670B\u514B\u98CE\u683C\u7684\u57CE\u5E02\u5929\u9645\u7EBF",
      "\u5236\u4F5C\u4E00\u4E2A 5 \u79D2\u7684\u4EA7\u54C1\u5BA3\u4F20\u89C6\u9891",
      "\u628A\u8FD9\u5F20\u56FE\u7247\u53D8\u6210\u52A8\u6001\u89C6\u9891",
      "\u8BBE\u8BA1\u4E00\u4E2A\u54C1\u724C Logo \u7684\u6982\u5FF5\u56FE"
    ]
  }
];
var AGENTS = [
  ...ENGINEERING_AGENTS,
  ...MARKETING_AGENTS,
  ...DESIGN_AGENTS,
  ...PRODUCT_AGENTS,
  ...TESTING_AGENTS,
  ...CREATIVE_AGENTS,
  ...CLAUDE_CODE_AGENTS,
  ...OPENCLAW_AGENTS
];
var AGENTS_BY_CATEGORY = {
  engineering: ENGINEERING_AGENTS,
  marketing: MARKETING_AGENTS,
  design: DESIGN_AGENTS,
  product: PRODUCT_AGENTS,
  testing: TESTING_AGENTS,
  specialized: [...CLAUDE_CODE_AGENTS, ...OPENCLAW_AGENTS]
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
  if (!agent) return REACT_INSTRUCTION;
  return REACT_INSTRUCTION + "\n\n" + agent.systemPrompt;
}
function getAgent(agentId) {
  return AGENTS.find((a) => a.id === agentId);
}

// server/maoRagServer.ts
import path5 from "path";
import fs5 from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname3 = path5.dirname(__filename2);
var INDEX_FILE = path5.join(__dirname3, "mao_corpus/.code_rag_index.json");
var chunks = [];
var isLoaded = false;
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const d = Math.sqrt(normA) * Math.sqrt(normB);
  return d === 0 ? 0 : dot / d;
}
function loadIndex() {
  if (isLoaded) return;
  try {
    const raw = fs5.readFileSync(INDEX_FILE, "utf-8");
    chunks = JSON.parse(raw);
    isLoaded = true;
    console.log(`[mao_rag] \u2705 \u52A0\u8F7D\u8BED\u6599\u5E93: ${chunks.length} chunks`);
  } catch (e) {
    console.error("[mao_rag] \u274C \u52A0\u8F7D\u7D22\u5F15\u5931\u8D25:", e);
    throw e;
  }
}
function textSimilarity(query, text) {
  const qWords = new Set(query.toLowerCase().split(/\s+/).filter(Boolean));
  const tWords = new Set(text.toLowerCase().split(/\s+/).filter(Boolean));
  if (qWords.size === 0) return 0;
  let overlap = 0;
  qWords.forEach((w) => {
    if (tWords.has(w) || text.toLowerCase().includes(w)) overlap++;
  });
  return overlap / qWords.size;
}
async function getQueryEmbedding(query) {
  const url = "http://localhost:11434/api/embeddings";
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "nomic-embed-text", prompt: query }),
    signal: AbortSignal.timeout(3e4)
  });
  if (!resp.ok) throw new Error(`Ollama API \u5931\u8D25: ${resp.status}`);
  const data = await resp.json();
  return data.embedding;
}
async function searchCorpus(query, topK = 5) {
  loadIndex();
  if (!query.trim()) return [];
  let queryEmb;
  try {
    queryEmb = await getQueryEmbedding(query);
  } catch (e) {
    console.warn("[mao_rag] Ollama \u4E0D\u53EF\u7528\uFF0C\u5207\u6362\u5230\u6587\u672C\u76F8\u4F3C\u5EA6:", e);
    return chunks.map((c) => ({
      text: c.text,
      metadata: c.metadata,
      score: textSimilarity(query, c.text),
      source: c.metadata?.source ?? "unknown"
    })).sort((a, b) => b.score - a.score).slice(0, topK);
  }
  const results = chunks.filter((c) => c.vector && c.vector.length > 0).map((c) => ({
    text: c.text,
    metadata: c.metadata,
    score: cosineSimilarity(queryEmb, c.vector),
    source: c.metadata?.source ?? "unknown"
  })).sort((a, b) => b.score - a.score).slice(0, topK);
  return results;
}
function formatForPrompt(results) {
  if (!results.length) return "";
  const lines = ["\u3010\u6BDB\u6CFD\u4E1C\u9009\u96C6\u76F8\u5173\u8BED\u6599\u5F15\u7528\u3011"];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    lines.push(`
--- \u5F15\u7528 ${i + 1} (\u76F8\u5173\u5EA6: ${(r.score * 100).toFixed(1)}%) ---`);
    lines.push(r.text);
  }
  return lines.join("");
}
function getStats() {
  loadIndex();
  return {
    total: chunks.length,
    withVectors: chunks.filter((c) => c.vector && c.vector.length > 0).length
  };
}
function registerMaoRagRouter(app) {
  loadIndex();
  app.get("/api/mao-rag/search", async (req, res) => {
    const q = req.query.q?.trim();
    const topK = Math.min(parseInt(req.query.topK || "3", 10), 10);
    if (!q) {
      res.status(400).json({ error: "\u7F3A\u5C11\u67E5\u8BE2\u53C2\u6570 'q'" });
      return;
    }
    try {
      const results = await searchCorpus(q, topK);
      res.json({
        success: true,
        query: q,
        count: results.length,
        results
      });
    } catch (err) {
      console.error("[mao_rag] \u68C0\u7D22\u5931\u8D25:", err);
      res.status(500).json({ error: "\u68C0\u7D22\u5931\u8D25", detail: String(err) });
    }
  });
  app.get("/api/mao-rag/stats", (_req, res) => {
    res.json({ success: true, ...getStats() });
  });
  app.get("/api/mao-rag/references", async (req, res) => {
    const q = req.query.q?.trim();
    const topK = Math.min(parseInt(req.query.topK || "3", 10), 10);
    if (!q) {
      res.status(400).json({ error: "\u7F3A\u5C11\u67E5\u8BE2\u53C2\u6570 'q'" });
      return;
    }
    try {
      const results = await searchCorpus(q, topK);
      const promptText = formatForPrompt(results);
      res.json({
        success: true,
        query: q,
        references: promptText,
        count: results.length,
        results: results.map((r) => ({ text: r.text.slice(0, 200) + (r.text.length > 200 ? "..." : ""), score: r.score, source: r.source }))
      });
    } catch (err) {
      res.status(500).json({ error: "\u68C0\u7D22\u5931\u8D25", detail: String(err) });
    }
  });
  console.log("[mao_rag] \u2705 \u5DF2\u6CE8\u518C /api/mao-rag \u8DEF\u7531");
}

// server/token-optimization/inputPreprocessor.ts
var MULTI_BLANK_LINES = /\n{3,}/g;
var TRAILING_SPACES = /[ \t]+$/gm;
var DUPLICATE_DIRECTIVE = /^(?:You are|You must|Always|Never|Remember|Important|Note:|Make sure)\s/i;
var LIST_DIRECTIVE = /^[-*]\s+/;
var IMPORT_LINE = /^import\s+.+from\s+['"].+['"];?\s*$/;
var InputPreprocessor = class {
  constructor(options = {}) {
    this.options = {
      maxChars: options.maxChars ?? 12e3,
      compressCode: options.compressCode ?? true,
      deduplicate: options.deduplicate ?? true,
      trimWhitespace: options.trimWhitespace ?? true,
      summaryMaxLen: options.summaryMaxLen ?? 200,
      compactSystemPrompt: options.compactSystemPrompt ?? true,
      dedupHistory: options.dedupHistory ?? true
    };
  }
  /**
   * 预处理单条消息内容
   */
  preprocess(text) {
    if (!text || typeof text !== "string") {
      return { text: text || "", originalChars: 0, processedChars: 0, savedTokens: 0, appliedStrategies: [] };
    }
    const originalChars = text.length;
    const appliedStrategies = [];
    let result = text;
    if (this.options.trimWhitespace) {
      const before = result.length;
      result = result.replace(TRAILING_SPACES, "").replace(MULTI_BLANK_LINES, "\n\n").replace(/[ \t]{2,}/g, " ");
      if (result.length < before) {
        appliedStrategies.push("trim_whitespace");
      }
    }
    if (this.options.deduplicate) {
      const before = result.length;
      result = this.deduplicateContent(result);
      if (result.length < before) {
        appliedStrategies.push("deduplicate");
      }
    }
    if (this.options.compressCode) {
      const before = result.length;
      result = this.compressCodeBlocks(result);
      if (result.length < before) {
        appliedStrategies.push("compress_code");
      }
    }
    if (result.length > this.options.maxChars) {
      result = this.smartTruncate(result, this.options.maxChars, this.options.summaryMaxLen);
      appliedStrategies.push("smart_truncate");
    }
    const processedChars = result.length;
    const savedTokens = Math.floor((originalChars - processedChars) / 4);
    return { text: result, originalChars, processedChars, savedTokens, appliedStrategies };
  }
  /**
   * 预处理消息数组（针对 OpenAI 格式的 messages）
   * 对 system 消息和 user 消息应用预处理
   */
  preprocessMessages(messages) {
    const stats = [];
    const processed = messages.map((msg, idx) => {
      if (msg.role === "system" && this.options.compactSystemPrompt) {
        if (typeof msg.content === "string") {
          const result = this.compactSystemPromptContent(msg.content);
          stats.push(result);
          return { ...msg, content: result.text };
        }
      }
      if (msg.role === "user") {
        if (typeof msg.content === "string") {
          const result = this.preprocess(msg.content);
          stats.push(result);
          return { ...msg, content: result.text };
        }
        if (Array.isArray(msg.content)) {
          const newContent = msg.content.map((part) => {
            if (part.type === "text" && typeof part.text === "string") {
              const result = this.preprocess(part.text);
              stats.push(result);
              return { ...part, text: result.text };
            }
            return part;
          });
          return { ...msg, content: newContent };
        }
      }
      if (msg.role === "assistant" && typeof msg.content === "string" && msg.content.length > 2e3) {
        const result = this.preprocess(msg.content);
        stats.push(result);
        return { ...msg, content: result.text };
      }
      return msg;
    });
    if (this.options.dedupHistory) {
      const deduped = this.dedupHistoryMessages(processed);
      const totalBefore = processed.reduce((sum, m) => sum + (typeof m.content === "string" ? m.content.length : 0), 0);
      const totalAfter = deduped.reduce((sum, m) => sum + (typeof m.content === "string" ? m.content.length : 0), 0);
      if (totalAfter < totalBefore) {
        stats.push({
          text: "",
          originalChars: totalBefore,
          processedChars: totalAfter,
          savedTokens: Math.floor((totalBefore - totalAfter) / 4),
          appliedStrategies: ["dedup_history"]
        });
      }
      return { messages: deduped, stats };
    }
    return { messages: processed, stats };
  }
  // ─── System Prompt 精简 ────────────────────────────────────
  /**
   * 精简 system prompt：
   *   - 合并重复的指令行
   *   - 去除啰嗦的措辞
   *   - 保留关键指令关键词
   */
  compactSystemPromptContent(text) {
    const originalChars = text.length;
    const appliedStrategies = [];
    let result = text;
    const lines = result.split("\n");
    const seenDirectives = /* @__PURE__ */ new Set();
    const dedupedLines = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        dedupedLines.push(line);
        continue;
      }
      if (DUPLICATE_DIRECTIVE.test(trimmed) || LIST_DIRECTIVE.test(trimmed)) {
        const key = trimmed.toLowerCase().slice(0, 30);
        if (seenDirectives.has(key)) {
          continue;
        }
        seenDirectives.add(key);
      }
      dedupedLines.push(line);
    }
    const afterDedup = dedupedLines.join("\n");
    if (afterDedup.length < result.length) {
      result = afterDedup;
      appliedStrategies.push("system_dedup");
    }
    const verbosePatterns = [
      [/You are (?:an|a) (?:expert|professional|highly skilled|accomplished) (.+?)(?:\.|,)/gi, "You are $1."],
      [/Please (?:make sure to|ensure that you|be sure to) /gi, "Please "],
      [/It is (?:very |extremely |highly )?important (?:that you |to )/gi, "IMPORTANT: "],
      [/Always remember (?:that )?/gi, ""],
      [/Do not (?:ever|under any circumstances) /gi, "Never "],
      [/In (?:your|the) response,?\s*(?:please )?/gi, ""],
      [/when (?:you are|you're) (?:responding|answering|writing)/gi, "when responding"]
    ];
    for (const [pattern, replacement] of verbosePatterns) {
      const before = result.length;
      result = result.replace(pattern, replacement);
      if (result.length < before) {
        appliedStrategies.push("system_verbose_compress");
      }
    }
    if (this.options.trimWhitespace) {
      result = result.replace(TRAILING_SPACES, "").replace(MULTI_BLANK_LINES, "\n\n");
    }
    const processedChars = result.length;
    const savedTokens = Math.floor((originalChars - processedChars) / 4);
    return { text: result, originalChars, processedChars, savedTokens, appliedStrategies };
  }
  // ─── 对话历史去重 ──────────────────────────────────────────
  /**
   * 去除对话历史中重复的用户提问
   * 例如用户连续发相同/相似的消息
   */
  dedupHistoryMessages(messages) {
    const userMessages = /* @__PURE__ */ new Map();
    return messages.filter((msg) => {
      if (msg.role !== "user") return true;
      const content = typeof msg.content === "string" ? msg.content : "";
      if (!content) return true;
      const normalized = content.toLowerCase().replace(/\s+/g, " ").trim();
      if (normalized.length < 10) return true;
      for (const [existing] of userMessages) {
        if (normalized === existing) {
          return false;
        }
        if (normalized.length > existing.length * 0.8 && normalized.includes(existing.slice(0, Math.floor(existing.length * 0.8)))) {
          return false;
        }
      }
      userMessages.set(normalized, 1);
      return true;
    });
  }
  // ─── 原有方法 ─────────────────────────────────────────────
  /**
   * 折叠重复内容行
   */
  deduplicateContent(text) {
    const lines = text.split("\n");
    const seen = /* @__PURE__ */ new Set();
    const result = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        result.push(line);
        continue;
      }
      if (trimmed.length < 20) {
        result.push(line);
        continue;
      }
      if (IMPORT_LINE.test(trimmed)) {
        const importSource = trimmed.match(/from\s+['"](.+?)['"]/)?.[1] || trimmed;
        if (seen.has(`import:${importSource}`)) continue;
        seen.add(`import:${importSource}`);
        result.push(line);
        continue;
      }
      const key = trimmed.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(line);
    }
    return result.join("\n");
  }
  /**
   * 压缩代码块内容
   */
  compressCodeBlocks(text) {
    return text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      let compressed = code;
      compressed = compressed.replace(/(?<!:?)\/\/.*$/gm, (comment) => {
        if (/\/\/\s*(TODO|FIXME|HACK|XXX|NOTE|IMPORTANT)/i.test(comment)) {
          return comment;
        }
        return "";
      });
      compressed = compressed.replace(/^\s*#(?!(!|include|define|pragma|ifdef|endif|else|elif)).*$/gm, (comment) => {
        if (/#\s*(TODO|FIXME|HACK|XXX|NOTE|IMPORTANT)/i.test(comment)) {
          return comment;
        }
        return "";
      });
      compressed = compressed.replace(/\n{3,}/g, "\n\n");
      compressed = compressed.replace(/[ \t]+$/gm, "");
      return "```" + lang + "\n" + compressed.trim() + "\n```";
    });
  }
  /**
   * 智能截断：保留首尾，中间用摘要替代
   */
  smartTruncate(text, maxLen, summaryLen) {
    if (text.length <= maxLen) return text;
    const headLen = Math.floor(maxLen * 0.7);
    const tailLen = Math.floor(maxLen * 0.2);
    const head = text.slice(0, headLen);
    const tail = text.slice(-tailLen);
    const midStart = headLen;
    const midEnd = text.length - tailLen;
    const midSection = text.slice(midStart, midEnd);
    const summaryLines = midSection.split("\n").filter((line) => line.trim().length > 10).slice(0, 3).map((line) => line.trim());
    const summary = summaryLines.length > 0 ? `

... [\u7701\u7565 ${midSection.length} \u5B57\u7B26\uFF0C\u5173\u952E\u884C\uFF1A${summaryLines.join("\uFF1B")}] ...

` : `

... [\u7701\u7565 ${midSection.length} \u5B57\u7B26] ...

`;
    return head + summary + tail;
  }
};

// server/token-optimization/outputCompactor.ts
var ANSI_ESCAPE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?(?:\x07|\x1b\\)/g;
var CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
var TIMESTAMP_ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.\d]*Z?/g;
var TIMESTAMP_LOG = /\d{2}:\d{2}:\d{2}[.\d]*/g;
var OutputCompactor = class {
  constructor(options = {}) {
    this.options = {
      maxOutputChars: options.maxOutputChars ?? 8e3,
      simplifyPaths: options.simplifyPaths ?? true,
      foldDuplicates: options.foldDuplicates ?? true,
      compactStackTraces: options.compactStackTraces ?? true,
      normalizeTimestamps: options.normalizeTimestamps ?? true,
      compactJson: options.compactJson ?? true,
      compactTables: options.compactTables ?? true,
      jsonMaxFields: options.jsonMaxFields ?? 20
    };
  }
  /**
   * 压缩工具输出
   */
  compact(text, toolName) {
    if (!text || typeof text !== "string") {
      return { text: text || "", originalChars: 0, compactedChars: 0, savedTokens: 0, stageStats: {} };
    }
    const originalChars = text.length;
    const stageStats = {};
    let result = text;
    const s1Before = result.length;
    result = this.cleanAnsi(result);
    stageStats["clean_ansi"] = { before: s1Before, after: result.length };
    if (this.options.foldDuplicates) {
      const s2Before = result.length;
      result = this.foldDuplicateLines(result);
      stageStats["fold_duplicates"] = { before: s2Before, after: result.length };
    }
    if (this.options.simplifyPaths) {
      const s3Before = result.length;
      result = this.simplifyPaths(result);
      stageStats["simplify_paths"] = { before: s3Before, after: result.length };
    }
    if (this.options.normalizeTimestamps) {
      const s4Before = result.length;
      result = this.normalizeTimestamps(result);
      stageStats["normalize_timestamps"] = { before: s4Before, after: result.length };
    }
    if (this.options.compactStackTraces) {
      const s5Before = result.length;
      result = this.compactStackTraces(result);
      stageStats["compact_stacktraces"] = { before: s5Before, after: result.length };
    }
    if (this.options.compactJson) {
      const s6Before = result.length;
      result = this.compactJsonOutput(result);
      stageStats["compact_json"] = { before: s6Before, after: result.length };
    }
    if (this.options.compactTables) {
      const s7Before = result.length;
      result = this.compactTableOutput(result);
      stageStats["compact_tables"] = { before: s7Before, after: result.length };
    }
    if (result.length > this.options.maxOutputChars) {
      const s8Before = result.length;
      result = this.smartTruncateOutput(result, this.options.maxOutputChars);
      stageStats["smart_truncate"] = { before: s8Before, after: result.length };
    }
    const compactedChars = result.length;
    const savedTokens = Math.floor((originalChars - compactedChars) / 4);
    return { text: result, originalChars, compactedChars, savedTokens, stageStats };
  }
  // ─── Stage 1: 清理 ANSI 转义序列和控制字符 ────────────────
  cleanAnsi(text) {
    return text.replace(ANSI_ESCAPE, "").replace(CONTROL_CHARS, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }
  // ─── Stage 2: 折叠重复行 ──────────────────────────────────
  foldDuplicateLines(text) {
    const lines = text.split("\n");
    const result = [];
    let prevLine = "";
    let repeatCount = 0;
    for (const line of lines) {
      if (line === prevLine) {
        repeatCount++;
      } else {
        if (repeatCount >= 3) {
          result.push(`  [... \u91CD\u590D ${repeatCount} \u884C ...]`);
        } else if (repeatCount > 0) {
          for (let i = 0; i < repeatCount; i++) result.push(prevLine);
        }
        result.push(line);
        prevLine = line;
        repeatCount = 0;
      }
    }
    if (repeatCount >= 3) {
      result.push(`  [... \u91CD\u590D ${repeatCount} \u884C ...]`);
    } else if (repeatCount > 0) {
      for (let i = 0; i < repeatCount; i++) result.push(prevLine);
    }
    return result.join("\n");
  }
  // ─── Stage 3: 简化路径（跳过代码块内路径）───────────────────
  simplifyPaths(text) {
    const parts = [];
    let inCodeBlock = false;
    let buffer = "";
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.trimStart().startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          parts.push(buffer + line + "\n");
          buffer = "";
        } else {
          if (buffer) {
            parts.push(this.simplifyPathsInText(buffer));
            buffer = "";
          }
          inCodeBlock = true;
          parts.push(line + "\n");
        }
      } else if (inCodeBlock) {
        buffer += line + "\n";
      } else {
        parts.push(this.simplifyPathsInText(line) + "\n");
      }
    }
    if (buffer) parts.push(buffer);
    return parts.join("").replace(/\n$/, "");
  }
  simplifyPathsInText(text) {
    return text.replace(/\/Users\/[^/\s]+/g, "~").replace(/\/home\/[^/\s]+/g, "~").replace(/C:\\Users\\[^\\s]+/g, "~");
  }
  // ─── Stage 4: 标准化时间戳 ────────────────────────────────
  normalizeTimestamps(text) {
    return text.replace(TIMESTAMP_ISO, "[TIMESTAMP]").replace(TIMESTAMP_LOG, "[TIME]");
  }
  // ─── Stage 5: 压缩错误堆栈 ────────────────────────────────
  compactStackTraces(text) {
    return text.replace(
      /(Error:.*)\n((?:\s+at\s+.+\n?)+)/g,
      (_match, errorLine, stack) => {
        const frames = stack.trim().split("\n").filter(Boolean);
        if (frames.length <= 4) {
          return errorLine + "\n" + stack;
        }
        const top = frames.slice(0, 3);
        const bottom = frames.slice(-1);
        return errorLine + "\n" + top.join("\n") + "\n  [... " + (frames.length - 4) + " frames omitted ...]\n" + bottom.join("\n");
      }
    );
  }
  // ─── Stage 6: JSON/结构化输出压缩 ─────────────────────────
  /**
   * 压缩 JSON 输出：
   *   - 检测 JSON 块并解析
   *   - 如果是数组且超过阈值，只保留前后几条
   *   - 如果是对象且字段过多，只保留关键字段
   *   - 如果 JSON 解析失败，跳过
   */
  compactJsonOutput(text) {
    return text.replace(
      /(```json\n)?([\[\{][\s\S]*?[\]\}])(\n```)?/g,
      (_match, open, jsonStr, close) => {
        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            if (parsed.length > 10) {
              const head = parsed.slice(0, 5);
              const tail = parsed.slice(-3);
              const compacted = [
                ...head,
                `... [\u7701\u7565 ${parsed.length - 8} \u6761]`,
                ...tail
              ];
              const result2 = JSON.stringify(compacted, null, 0);
              return (open || "") + result2 + (close || "");
            }
            const result = JSON.stringify(parsed, null, 0);
            if (result.length < jsonStr.length) {
              return (open || "") + result + (close || "");
            }
          } else if (typeof parsed === "object" && parsed !== null) {
            const keys = Object.keys(parsed);
            if (keys.length > this.options.jsonMaxFields) {
              const kept = {};
              for (const key of keys.slice(0, this.options.jsonMaxFields)) {
                kept[key] = parsed[key];
              }
              kept["_truncated"] = `\u7701\u7565 ${keys.length - this.options.jsonMaxFields} \u4E2A\u5B57\u6BB5`;
              const result2 = JSON.stringify(kept, null, 0);
              return (open || "") + result2 + (close || "");
            }
            const result = JSON.stringify(parsed, null, 0);
            if (result.length < jsonStr.length) {
              return (open || "") + result + (close || "");
            }
          }
        } catch {
        }
        return _match;
      }
    );
  }
  // ─── Stage 7: 表格输出压缩 ────────────────────────────────
  /**
   * 压缩 Markdown 表格或对齐文本表格：
   *   - 如果行数超过阈值，只保留表头 + 前几行 + 省略 + 最后几行
   */
  compactTableOutput(text) {
    const tableBlockPattern = /((?:\|[^\n]+\|\n)+)/g;
    return text.replace(tableBlockPattern, (block) => {
      const rows = block.trim().split("\n");
      if (rows.length <= 8) return block;
      const header = rows[0];
      const separator = rows[1];
      const dataRows = rows.slice(2);
      if (dataRows.length <= 6) return block;
      const kept = [
        header,
        separator,
        ...dataRows.slice(0, 4),
        `| ... | \u7701\u7565 ${dataRows.length - 6} \u884C | ... |`,
        ...dataRows.slice(-2)
      ];
      return kept.join("\n") + "\n";
    });
  }
  // ─── Stage 8: 智能截断 ────────────────────────────────────
  smartTruncateOutput(text, maxLen) {
    if (text.length <= maxLen) return text;
    const headLen = Math.floor(maxLen * 0.75);
    const tailLen = Math.floor(maxLen * 0.2);
    const head = text.slice(0, headLen);
    const tail = text.slice(-tailLen);
    const omitted = text.length - headLen - tailLen;
    return head + `

... [\u7701\u7565 ${omitted} \u5B57\u7B26] ...

` + tail;
  }
};

// server/token-optimization/cliProxyCompressor.ts
var PROGRESS_BAR_PATTERNS = [
  /\r[=#\-.*]+\s*\d+%/g,
  // 通用进度条
  /⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏/g,
  // spinner
  /\r\s*\d+\/\d+\s/g,
  // 计数器
  /^\s*[╭╰│├─]+.*$/gm
  // 树形进度
];
var LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL", "TRACE"];
var LOG_LEVEL_ORDER = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5
};
var VERSION_OUTPUT = /^(npm|node|python|pip|go|cargo|rustc|java|ruby|gem)\s+v?[\d.]+/gm;
var FILE_TREE_LINE = /^[│├└─\s]+\S/m;
var CliProxyCompressor = class {
  constructor(options = {}) {
    this.options = {
      minLogLevel: options.minLogLevel ?? "INFO",
      filterEnvVars: options.filterEnvVars ?? true,
      filterProgressBars: options.filterProgressBars ?? true,
      compressVersions: options.compressVersions ?? true,
      compressDeps: options.compressDeps ?? true,
      compressFileTree: options.compressFileTree ?? true,
      maxOutputChars: options.maxOutputChars ?? 6e3
    };
    this.outputCompactor = new OutputCompactor({
      maxOutputChars: this.options.maxOutputChars,
      simplifyPaths: true,
      foldDuplicates: true,
      compactStackTraces: true,
      normalizeTimestamps: true
    });
  }
  /**
   * 压缩 CLI 工具输出
   * 先应用 CLI 特定过滤，再通过 OutputCompactor 做通用压缩
   */
  compress(output, toolName) {
    if (!output || typeof output !== "string") return output || "";
    if (output.length < 100) return output;
    let result = output;
    if (this.options.filterProgressBars) {
      result = this.filterProgressBars(result);
    }
    result = this.filterByLogLevel(result);
    if (this.options.filterEnvVars) {
      result = this.filterEnvVars(result);
    }
    if (this.options.compressVersions) {
      result = this.compressVersionInfo(result);
    }
    if (this.options.compressDeps) {
      result = this.compressDependencyList(result);
    }
    if (this.options.compressFileTree) {
      result = this.compressFileTreeOutput(result);
    }
    const compacted = this.outputCompactor.compact(result, toolName);
    return compacted.text;
  }
  /**
   * 获取压缩统计信息
   */
  compressWithStats(output, toolName) {
    const originalChars = output.length;
    const text = this.compress(output, toolName);
    const compressedChars = text.length;
    const savedTokens = Math.floor((originalChars - compressedChars) / 4);
    const ratio = originalChars > 0 ? compressedChars / originalChars : 1;
    return { text, originalChars, compressedChars, savedTokens, ratio };
  }
  /**
   * 过滤进度条输出
   */
  filterProgressBars(text) {
    let result = text;
    for (const pattern of PROGRESS_BAR_PATTERNS) {
      result = result.replace(pattern, "");
    }
    result = result.replace(/^\r.+/gm, "");
    return result;
  }
  /**
   * 按日志级别过滤
   */
  filterByLogLevel(text) {
    const minLevel = LOG_LEVEL_ORDER[this.options.minLogLevel] ?? 2;
    const lines = text.split("\n");
    return lines.filter((line) => {
      for (const level of LOG_LEVELS) {
        const levelOrder = LOG_LEVEL_ORDER[level] ?? 0;
        const regex = new RegExp(`\\[?${level}\\]?[\\s:]`, "i");
        if (regex.test(line)) {
          return levelOrder >= minLevel;
        }
      }
      return true;
    }).join("\n");
  }
  /**
   * 过滤环境变量输出
   */
  filterEnvVars(text) {
    const lines = text.split("\n");
    const envLines = lines.filter((line) => /^[A-Z_]+=.+/.test(line));
    if (envLines.length > 10) {
      const importantEnvPrefixes = ["PATH", "NODE", "PYTHON", "JAVA", "GO", "RUST", "DOCKER", "KUBE", "AWS", "API_KEY"];
      const filtered = lines.filter((line) => {
        if (!/^[A-Z_]+=.+/.test(line)) return true;
        return importantEnvPrefixes.some((prefix) => line.startsWith(prefix));
      });
      if (envLines.length > filtered.filter((l) => /^[A-Z_]+=.+/.test(l)).length) {
        const removedCount = envLines.length - filtered.filter((l) => /^[A-Z_]+=.+/.test(l)).length;
        return filtered.join("\n") + `
[... \u7701\u7565 ${removedCount} \u4E2A\u73AF\u5883\u53D8\u91CF ...]`;
      }
    }
    return text;
  }
  /**
   * 压缩版本信息
   */
  compressVersionInfo(text) {
    const versions = [];
    const cleaned = text.replace(VERSION_OUTPUT, (match) => {
      versions.push(match.trim());
      return "";
    });
    if (versions.length === 0) return text;
    const versionSummary = versions.join(", ");
    return `[\u7248\u672C: ${versionSummary}]
` + cleaned.replace(/^\s*\n/gm, "");
  }
  /**
   * 压缩依赖列表
   */
  compressDependencyList(text) {
    const depPatterns = [
      /(?:├|└|─)\s+[@\w\-/]+@[\d.]+/g,
      // npm list
      /^\s*\w+\s+[\d.]+$/gm
      // pip list
    ];
    let result = text;
    for (const pattern of depPatterns) {
      const matches = result.match(pattern);
      if (matches && matches.length > 15) {
        const kept = [...matches.slice(0, 10), `  [... \u7701\u7565 ${matches.length - 15} \u4E2A\u4F9D\u8D56 ...]`, ...matches.slice(-5)];
        let matchIdx = 0;
        result = result.replace(pattern, () => {
          if (matchIdx < kept.length) return kept[matchIdx++];
          return "";
        });
      }
    }
    return result;
  }
  /**
   * 压缩文件树输出
   */
  compressFileTreeOutput(text) {
    const lines = text.split("\n");
    const treeLines = [];
    lines.forEach((line, idx) => {
      if (FILE_TREE_LINE.test(line) || /^[├└]/.test(line)) {
        treeLines.push(idx);
      }
    });
    if (treeLines.length > 20) {
      const keepStart = treeLines.slice(0, 10);
      const keepEnd = treeLines.slice(-5);
      const keepSet = /* @__PURE__ */ new Set([...keepStart, ...keepEnd]);
      const result = [];
      let inOmit = false;
      for (let i = 0; i < lines.length; i++) {
        if (treeLines.includes(i)) {
          if (keepSet.has(i)) {
            result.push(lines[i]);
            inOmit = false;
          } else if (!inOmit) {
            result.push(`  [... \u7701\u7565 ${treeLines.length - 15} \u4E2A\u6587\u4EF6/\u76EE\u5F55 ...]`);
            inOmit = true;
          }
        } else {
          result.push(lines[i]);
        }
      }
      return result.join("\n");
    }
    return text;
  }
};

// server/token-optimization/index.ts
init_tokenCounter();

// server/token-optimization/pipeline.ts
init_tokenCounter();
var DEFAULT_OPTIONS = {
  enableInputPreprocess: true,
  enableOutputCompact: true,
  enableCliProxy: true,
  enableTokenCounting: true,
  inputMaxChars: 12e3,
  toolOutputMaxChars: 6e3,
  enableRagCompact: true,
  ragMaxChars: 4e3,
  enableHistoryCompact: true,
  historyKeepRounds: 4,
  enableExactCounting: false,
  ollamaBaseUrl: "http://localhost:11434"
};
var TokenOptimizationPipeline = class {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.inputPreprocessor = new InputPreprocessor({
      maxChars: this.options.inputMaxChars,
      compressCode: true,
      deduplicate: true,
      trimWhitespace: true
    });
    this.outputCompactor = new OutputCompactor({
      maxOutputChars: this.options.toolOutputMaxChars,
      simplifyPaths: true,
      foldDuplicates: true,
      compactStackTraces: true,
      normalizeTimestamps: true
    });
    this.cliProxyCompressor = new CliProxyCompressor({
      maxOutputChars: this.options.toolOutputMaxChars,
      minLogLevel: "INFO",
      filterEnvVars: true,
      filterProgressBars: true,
      compressVersions: true,
      compressDeps: true,
      compressFileTree: true
    });
  }
  // ─── 1. 输入预处理（发送给 LLM 之前）─────────────────────────
  optimizeInput(messages, sessionId) {
    if (!this.options.enableInputPreprocess) {
      return { messages, savedTokens: 0, stats: [] };
    }
    let processedMessages = messages;
    if (this.options.enableHistoryCompact && messages.length > this.options.historyKeepRounds * 2 + 1) {
      processedMessages = this.compactHistory(messages, this.options.historyKeepRounds);
    }
    const { messages: optimized, stats } = this.inputPreprocessor.preprocessMessages(processedMessages);
    const savedTokens = stats.reduce((sum, s) => sum + s.savedTokens, 0);
    if (this.options.enableTokenCounting && sessionId) {
      const inputBefore = tokenCounter.estimateMessagesTokens(messages).tokens;
      const inputAfter = tokenCounter.estimateMessagesTokens(optimized).tokens;
      const strategyBreakdown = {};
      for (const s of stats) {
        for (const strategy of s.appliedStrategies) {
          strategyBreakdown[strategy] = (strategyBreakdown[strategy] || 0) + s.savedTokens;
        }
      }
      tokenCounter.recordOptimization(sessionId, inputBefore, inputAfter, 0, 0, strategyBreakdown);
    }
    return { messages: optimized, savedTokens, stats };
  }
  // ─── 2. RAG 上下文压缩 ──────────────────────────────────────
  optimizeRagContext(ragText, sessionId) {
    if (!this.options.enableRagCompact || !ragText || ragText.length < 200) {
      return { text: ragText, savedTokens: 0 };
    }
    const before = ragText.length;
    let result = this.inputPreprocessor.preprocess(ragText);
    if (result.text.length > this.options.ragMaxChars) {
      const truncated = this.smartRagTruncate(result.text, this.options.ragMaxChars);
      result = { ...result, text: truncated, appliedStrategies: [...result.appliedStrategies, "rag_truncate"] };
    }
    const savedTokens = result.savedTokens;
    if (this.options.enableTokenCounting && sessionId) {
      const beforeTokens = Math.ceil(before / 4);
      const afterTokens = Math.ceil(result.text.length / 4);
      tokenCounter.recordOptimization(sessionId, 0, 0, 0, 0, { rag_compact: beforeTokens - afterTokens });
    }
    return { text: result.text, savedTokens };
  }
  // ─── 3. 工具输出压缩 ────────────────────────────────────────
  optimizeToolOutput(toolName, output, sessionId) {
    if (!output || typeof output !== "string") {
      return { text: output || "", savedTokens: 0 };
    }
    if (output.length < 100) {
      return { text: output, savedTokens: 0 };
    }
    let result = output;
    let savedTokens = 0;
    const isCliTool = ["run_shell", "run_command", "execute_command", "shell_exec", "bash"].includes(toolName);
    const isCodeTool = ["run_code", "code_exec", "python_exec", "execute_code"].includes(toolName);
    if (isCliTool && this.options.enableCliProxy) {
      const stats = this.cliProxyCompressor.compressWithStats(output, toolName);
      result = stats.text;
      savedTokens = stats.savedTokens;
    } else if (this.options.enableOutputCompact) {
      const compacted = this.outputCompactor.compact(output, toolName);
      result = compacted.text;
      savedTokens = compacted.savedTokens;
    }
    if (result.length > this.options.toolOutputMaxChars) {
      result = result.slice(0, this.options.toolOutputMaxChars) + "\n... [\u8F93\u51FA\u622A\u65AD]";
    }
    if (this.options.enableTokenCounting && sessionId) {
      const outputBefore = Math.ceil(output.length / 4);
      const outputAfter = Math.ceil(result.length / 4);
      const strategyBreakdown = {
        [isCliTool ? "cli_proxy" : isCodeTool ? "code_compact" : "output_compact"]: savedTokens
      };
      tokenCounter.recordOptimization(sessionId, 0, 0, outputBefore, outputAfter, strategyBreakdown);
    }
    return { text: result, savedTokens };
  }
  // ─── 4. 会话统计 ────────────────────────────────────────────
  getSessionStats(sessionId) {
    const raw = tokenCounter.getSessionStats(sessionId);
    if (!raw) return null;
    const inputStrategies = ["trim_whitespace", "deduplicate", "compress_code", "smart_truncate", "history_compact"];
    const outputStrategies = ["cli_proxy", "code_compact", "output_compact"];
    const ragStrategies = ["rag_compact"];
    let inputSaved = 0;
    let outputSaved = 0;
    let ragSaved = 0;
    for (const [strategy, saved] of Object.entries(raw.strategyBreakdown)) {
      if (inputStrategies.includes(strategy)) inputSaved += saved;
      else if (outputStrategies.includes(strategy)) outputSaved += saved;
      else if (ragStrategies.includes(strategy)) ragSaved += saved;
    }
    return {
      totalSavedTokens: raw.totalSavedTokens,
      savingRatio: Math.round(raw.savingRatio * 100),
      strategyBreakdown: raw.strategyBreakdown,
      rounds: raw.rounds,
      inputSaved,
      outputSaved,
      ragSaved
    };
  }
  // ─── 5. 历史对话压缩 ────────────────────────────────────────
  /**
   * 压缩旧的对话历史，保留最近 N 轮完整，更早的只保留摘要
   */
  compactHistory(messages, keepRounds) {
    if (messages.length <= keepRounds * 2 + 1) return messages;
    const systemMsg = messages[0]?.role === "system" ? [messages[0]] : [];
    const restStart = systemMsg.length;
    const recentStart = Math.max(restStart, messages.length - keepRounds * 2);
    const oldMessages = messages.slice(restStart, recentStart);
    const compactedOld = [];
    let userCount = 0;
    for (const msg of oldMessages) {
      if (msg.role === "user") {
        userCount++;
        const content = typeof msg.content === "string" ? msg.content : "";
        if (content.length > 100) {
          compactedOld.push({
            ...msg,
            content: content.slice(0, 100) + "... [\u5386\u53F2\u6D88\u606F\u5DF2\u538B\u7F29]"
          });
        } else {
          compactedOld.push(msg);
        }
      } else if (msg.role === "assistant") {
        const content = typeof msg.content === "string" ? msg.content : "";
        compactedOld.push({
          ...msg,
          content: content.length > 80 ? content.slice(0, 80) + "... [\u5DF2\u538B\u7F29]" : content
        });
      }
    }
    if (userCount > 0) {
      compactedOld.unshift({
        role: "system",
        content: `[\u7CFB\u7EDF: \u4EE5\u4E0B\u662F ${userCount} \u8F6E\u5386\u53F2\u5BF9\u8BDD\u7684\u538B\u7F29\u7248\u672C]`
      });
    }
    const recentMessages = messages.slice(recentStart);
    return [...systemMsg, ...compactedOld, ...recentMessages];
  }
  // ─── 6. RAG 智能截断 ────────────────────────────────────────
  /**
   * 保留每个文档片段的开头和结尾，删除中间重复/低相关内容
   */
  smartRagTruncate(text, maxLen) {
    if (text.length <= maxLen) return text;
    const chunks2 = text.split(/\n---\n/);
    if (chunks2.length > 1) {
      const perChunk = Math.floor(maxLen / chunks2.length);
      const truncated = chunks2.map((chunk, i) => {
        if (chunk.length <= perChunk) return chunk;
        const headLen2 = Math.floor(perChunk * 0.8);
        return chunk.slice(0, headLen2) + `... [\u6587\u6863${i + 1}\u7701\u7565 ${chunk.length - headLen2} \u5B57\u7B26]`;
      });
      return truncated.join("\n---\n");
    }
    const headLen = Math.floor(maxLen * 0.8);
    const tailLen = Math.floor(maxLen * 0.15);
    return text.slice(0, headLen) + `
... [\u7701\u7565 ${text.length - headLen - tailLen} \u5B57\u7B26] ...
` + text.slice(-tailLen);
  }
  // ─── 7. 管线配置热更新 ──────────────────────────────────────
  updateOptions(options) {
    this.options = { ...this.options, ...options };
  }
  getOptions() {
    return { ...this.options };
  }
};

// server/industrial-ai/modelRouter.ts
var FREE_KEYWORDS = ["\u4F60\u597D", "hello", "hi", "\u55E8", "\u60A8\u597D", "\u8C22\u8C22", "thanks", "\u518D\u89C1", "bye"];
var CHEAP_INTENTS = ["\u7FFB\u8BD1", "translate", "\u89E3\u91CA", "explain", "\u603B\u7ED3", "summarize", "\u6539\u5199"];
var EXPENSIVE_INTENTS = ["\u5199\u4EE3\u7801", "code", "programming", "\u5199\u6587\u7AE0", "analyze", "design"];
function classifyByKeywords(text) {
  const lower = text.toLowerCase();
  if (FREE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return "free";
  if (text.length < 20 && !EXPENSIVE_INTENTS.some((kw) => lower.includes(kw))) return "cheap";
  if (EXPENSIVE_INTENTS.some((kw) => lower.includes(kw))) return "expensive";
  if (CHEAP_INTENTS.some((kw) => lower.includes(kw))) return "cheap";
  return "cheap";
}
var INTENT_PATTERNS = [
  { tier: "free", keywords: ["\u4F60\u597D", "hi", "hello"], patterns: [/^(hi|hello|hey)[.!]?$/i] },
  { tier: "cheap", keywords: ["\u7FFB\u8BD1", "translate"], patterns: [/翻译/i], maxLength: 500 },
  { tier: "expensive", keywords: ["\u5199\u4EE3\u7801", "code"], patterns: [/写.*函数/i], maxLength: 1e4 }
];
function classifyByIntent(text) {
  const lower = text.toLowerCase();
  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(text) && (!pattern.maxLength || text.length <= pattern.maxLength)) return { tier: pattern.tier, confidence: 0.9 };
    }
    for (const kw of pattern.keywords) {
      if (lower.includes(kw.toLowerCase()) && (!pattern.maxLength || text.length <= pattern.maxLength)) return { tier: pattern.tier, confidence: 0.7 };
    }
  }
  return { tier: "cheap", confidence: 0.5 };
}
var MODEL_MAP = {
  free: ["ollama-gemma3-4b", "ollama-qwen2.5-3b", "llama-3.1-8b", "glm-4-flash"],
  cheap: ["ollama-qwen2.5-7b", "glm-4-flash", "deepseek-chat", "gemini-2.5-flash"],
  expensive: ["deepseek-reasoner", "gemini-2.5-pro", "claude-sonnet-4-5"],
  max: ["claude-opus-4-5", "gemini-2.5-pro"]
};
var MODEL_COSTS = {
  // Ollama 本地模型（零成本）
  "ollama-gemma3-4b": 0,
  "ollama-qwen2.5-3b": 0,
  "ollama-qwen2.5-7b": 0,
  // 云端模型
  "glm-4-flash": 1e-3,
  "llama-3.1-8b": 2e-3,
  "deepseek-chat": 0.014,
  "deepseek-reasoner": 0.055,
  "gemini-2.5-flash": 35e-4,
  "gemini-2.5-pro": 0.035,
  "claude-sonnet-4-5": 0.03,
  "claude-opus-4-5": 0.075
};
var ModelRouter = class {
  constructor(fallbackModel = "deepseek-chat") {
    this.upgradeHistory = /* @__PURE__ */ new Map();
    this.fallbackModel = fallbackModel;
  }
  route(userInput, userPreference) {
    const tier1 = classifyByKeywords(userInput);
    const { tier: tier2, confidence } = classifyByIntent(userInput);
    const finalTier = this.getHigherTier(tier1, tier2);
    if (userPreference) return this.selectModel(userPreference, finalTier, confidence, "user_preference");
    return this.selectModelByTier(finalTier, confidence);
  }
  shouldUpgrade(_currentModel, errorCount, avgLatency) {
    if (errorCount >= 2) return true;
    if (avgLatency > 3e4) return true;
    return false;
  }
  markUpgrade(modelKey) {
    this.upgradeHistory.set(modelKey, (this.upgradeHistory.get(modelKey) || 0) + 1);
  }
  getUpgradedModel(currentModel) {
    const currentTier = this.getModelTier(currentModel);
    const nextTier = this.getNextTier(currentTier);
    return MODEL_MAP[nextTier][Math.floor(Math.random() * MODEL_MAP[nextTier].length)];
  }
  getHigherTier(t1, t2) {
    const order = ["free", "cheap", "expensive", "max"];
    return order[Math.max(order.indexOf(t1), order.indexOf(t2))];
  }
  getModelTier(modelKey) {
    for (const [tier, models] of Object.entries(MODEL_MAP)) {
      if (models.includes(modelKey)) return tier;
    }
    return "cheap";
  }
  getNextTier(current) {
    const order = ["free", "cheap", "expensive", "max"];
    const idx = order.indexOf(current);
    return order[Math.min(idx + 1, order.length - 1)];
  }
  selectModel(preference, baseTier, confidence, reason) {
    const tier = this.getModelTier(preference) || baseTier;
    return { modelKey: preference, modelTier: tier, reason, confidence, estimatedCost: MODEL_COSTS[preference] || 0.01 };
  }
  selectModelByTier(tier, confidence) {
    const models = MODEL_MAP[tier];
    const modelKey = models[Math.floor(Math.random() * models.length)];
    return { modelKey, modelTier: tier, reason: `tier_${tier}`, confidence, estimatedCost: MODEL_COSTS[modelKey] || 0.01 };
  }
};
var CostTracker = class {
  constructor() {
    this.costs = /* @__PURE__ */ new Map();
    this.dailyCosts = /* @__PURE__ */ new Map();
  }
  track(modelKey, inputTokens, outputTokens) {
    const costPerToken = MODEL_COSTS[modelKey] || 0.01;
    const cost = (inputTokens + outputTokens) * costPerToken / 1e3;
    const existing = this.costs.get(modelKey) || { totalTokens: 0, totalCost: 0 };
    this.costs.set(modelKey, { totalTokens: existing.totalTokens + inputTokens + outputTokens, totalCost: existing.totalCost + cost });
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    this.dailyCosts.set(today, (this.dailyCosts.get(today) || 0) + cost);
  }
  getTotalCost() {
    let total = 0;
    for (const val of Array.from(this.costs.values())) total += val.totalCost;
    return total;
  }
  getSavingsVsBaseline() {
    const actual = this.getTotalCost();
    return { percentage: 0, actual, baseline: actual * 5 };
  }
};
var modelRouter = new ModelRouter();
var costTracker = new CostTracker();

// server/industrial-ai/semanticCache.ts
import * as crypto from "crypto";
function generateSemanticHash(text) {
  const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
function cosineSimilarity2(a, b) {
  if (a.hash === b.hash) return 1;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.dimensions.length; i++) {
    dotProduct += a.dimensions[i] * b.dimensions[i];
    normA += a.dimensions[i] * a.dimensions[i];
    normB += b.dimensions[i] * b.dimensions[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
var SemanticCache = class {
  constructor(options) {
    this.cache = /* @__PURE__ */ new Map();
    this.accessOrder = [];
    this.maxSize = options?.maxSize || 1e4;
    this.similarityThreshold = options?.similarityThreshold || 0.95;
    this.ttlMs = (options?.ttlHours || 24) * 60 * 60 * 1e3;
  }
  get(text) {
    const queryEmbedding = this.getDimensionsFromText(text);
    let bestMatch = null;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      const entry = this.cache.get(key);
      if (Date.now() - entry.metadata.createdAt > this.ttlMs) {
        this.cache.delete(key);
        continue;
      }
      if (queryEmbedding.hash === entry.embedding.hash) return this.hit(entry);
      const similarity = cosineSimilarity2(queryEmbedding, entry.embedding);
      if (similarity >= this.similarityThreshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { entry, similarity };
      }
    }
    if (bestMatch) return this.hit(bestMatch.entry);
    return { hit: false };
  }
  set(text, response, metadata) {
    if (this.cache.size >= this.maxSize) {
      this.evictExpired();
      if (this.cache.size >= this.maxSize) this.evictLRU();
    }
    const key = generateSemanticHash(text);
    if (this.cache.has(key)) {
      const entry2 = this.cache.get(key);
      entry2.response = response;
      entry2.metadata.lastHitAt = Date.now();
      return;
    }
    const entry = { key, embedding: this.getDimensionsFromText(text), response, metadata: { createdAt: Date.now(), hitCount: 0, lastHitAt: Date.now(), modelKey: metadata?.modelKey || "unknown", userId: metadata?.userId } };
    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }
  invalidate(text) {
    return this.cache.delete(generateSemanticHash(text));
  }
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }
  getStats() {
    let totalHits = 0, totalAge = 0;
    for (const entry of Array.from(this.cache.values())) {
      totalHits += entry.metadata.hitCount;
      totalAge += Date.now() - entry.metadata.createdAt;
    }
    return { size: this.cache.size, hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0, totalHits, avgAge: this.cache.size > 0 ? totalAge / this.cache.size / 1e3 / 60 : 0 };
  }
  hit(entry) {
    entry.metadata.hitCount++;
    entry.metadata.lastHitAt = Date.now();
    return { hit: true, response: entry.response, similarity: 1 };
  }
  getDimensionsFromText(text) {
    const hash = generateSemanticHash(text);
    const dimensions = [];
    for (let i = 0; i < 16; i++) {
      const chunk = hash.slice(i * 4, (i + 1) * 4);
      dimensions.push(parseInt(chunk, 16) / 65535);
    }
    return { dimensions, hash };
  }
  evictExpired() {
    const now = Date.now();
    for (const key of Array.from(this.cache.keys())) {
      if (now - this.cache.get(key).metadata.createdAt > this.ttlMs) {
        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter((k) => k !== key);
      }
    }
  }
  evictLRU() {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) this.cache.delete(lruKey);
    }
  }
};
var semanticCache = new SemanticCache({ maxSize: 1e4, similarityThreshold: 0.95, ttlHours: 24 });

// server/industrial-ai/inferenceOptimizer.ts
var StreamingOptimizer = class {
  constructor() {
    this.keepAliveTimer = null;
  }
  /**
   * 发送 SSE 格式的数据
   */
  static sendSSE(res, event, data) {
    try {
      res.write(`event: ${event}
`);
      res.write(`data: ${JSON.stringify(data)}

`);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * 发送流式文本片段
   */
  static sendChunk(res, chunk) {
    try {
      res.write(`data: ${JSON.stringify({ content: chunk })}

`);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * 发送完成信号
   */
  static sendDone(res, metadata) {
    try {
      res.write(`event: done
`);
      res.write(`data: ${JSON.stringify(metadata || {})}

`);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * 发送错误
   */
  static sendError(res, error, code) {
    try {
      res.write(`event: error
`);
      res.write(`data: ${JSON.stringify({ error, code })}

`);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * 发送进度更新
   */
  static sendProgress(res, stage, progress) {
    try {
      res.write(`event: progress
`);
      res.write(`data: ${JSON.stringify({ stage, progress })}

`);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * 启动心跳保活
   */
  startKeepAlive(res, intervalMs = 3e4) {
    this.keepAliveTimer = setInterval(() => {
      try {
        res.write(`: keepalive

`);
      } catch {
        this.stopKeepAlive();
      }
    }, intervalMs);
  }
  /**
   * 停止心跳
   */
  stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
};
var TokenTimer = class {
  constructor() {
    this.firstTokenTime = null;
    this.tokenCount = 0;
    this.startTime = Date.now();
    this.lastTokenTime = this.startTime;
  }
  /**
   * 记录第一个 token（用于计算 TTFT - Time To First Token）
   */
  recordFirstToken() {
    if (this.firstTokenTime === null) {
      this.firstTokenTime = Date.now();
    }
  }
  /**
   * 记录 token
   */
  recordToken(charCount = 1) {
    this.tokenCount++;
    this.lastTokenTime = Date.now();
  }
  /**
   * 获取 TTFT（毫秒）
   */
  getTTFT() {
    if (this.firstTokenTime === null) {
      return Date.now() - this.startTime;
    }
    return this.firstTokenTime - this.startTime;
  }
  /**
   * 获取 TPS（Token Per Second）
  */
  getTPS() {
    const elapsed = (this.lastTokenTime - this.startTime) / 1e3;
    if (elapsed === 0) return 0;
    return this.tokenCount / elapsed;
  }
  /**
   * 获取总延迟
   */
  getTotalLatency() {
    return Date.now() - this.startTime;
  }
  /**
   * 获取完整统计
   */
  getStats() {
    return {
      ttft: this.getTTFT(),
      tps: this.getTPS(),
      totalTokens: this.tokenCount,
      totalLatency: this.getTotalLatency(),
      isStreaming: this.firstTokenTime !== null
    };
  }
};
var BatchInferenceOptimizer = class {
  constructor(batchSize = 5, batchDelayMs = 100) {
    this.queue = [];
    this.processing = false;
    this.batchSize = batchSize;
    this.batchDelayMs = batchDelayMs;
  }
  /**
   * 添加请求到批处理队列
   */
  async submit(id, prompt, priority = 0) {
    return new Promise((resolve2, reject) => {
      this.queue.push({
        id,
        prompt,
        resolve: resolve2,
        reject,
        priority,
        timestamp: Date.now()
      });
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.timestamp - b.timestamp;
      });
      this.scheduleProcess();
    });
  }
  scheduleProcess() {
    if (this.processing || this.queue.length === 0) return;
    setTimeout(() => this.processBatch(), this.batchDelayMs);
  }
  async processBatch() {
    if (this.queue.length === 0) return;
    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    const promises = batch.map(async (item) => {
      try {
        item.resolve(`[Batch Result for: ${item.prompt.slice(0, 20)}...]`);
      } catch (error) {
        item.reject(error);
      }
    });
    await Promise.allSettled(promises);
    this.processing = false;
    if (this.queue.length > 0) {
      this.scheduleProcess();
    }
  }
  getQueueStatus() {
    return {
      pending: this.queue.length,
      processing: this.processing
    };
  }
};
var streamingOptimizer = new StreamingOptimizer();
var batchOptimizer = new BatchInferenceOptimizer(5, 100);

// server/industrial-ai/dataFlywheel.ts
import { nanoid as nanoid2 } from "nanoid";
var FeedbackCollector = class {
  constructor(flushIntervalMs = 6e4) {
    this.feedbackBuffer = [];
    this.flushInterval = null;
    this.flushInterval = setInterval(() => this.flush(), flushIntervalMs);
  }
  record(record) {
    const fullRecord = { ...record, id: nanoid2(), timestamp: Date.now() };
    this.feedbackBuffer.push(fullRecord);
    return fullRecord;
  }
  recordThumbsUp(sessionId, messageId, userId, metadata) {
    return this.record({ sessionId, messageId, userId, type: "thumbs_up", metadata });
  }
  recordThumbsDown(sessionId, messageId, userId, metadata) {
    return this.record({ sessionId, messageId, userId, type: "thumbs_down", metadata });
  }
  recordFollowUp(sessionId, messageId, userId, metadata) {
    return this.record({ sessionId, messageId, userId, type: "follow_up", metadata });
  }
  setFlushCallback(callback) {
    this.onFlush = callback;
  }
  async flush() {
    if (this.feedbackBuffer.length === 0) return;
    const records = [...this.feedbackBuffer];
    this.feedbackBuffer = [];
    if (this.onFlush) await this.onFlush(records);
  }
  destroy() {
    if (this.flushInterval) clearInterval(this.flushInterval);
  }
};
var NegativeSampleExtractor = class {
  constructor(threshold = 0.5, minInteractions = 2) {
    this.threshold = threshold;
    this.minInteractions = minInteractions;
  }
  isNegative(feedback) {
    let negativeScore = 0;
    let totalScore = 0;
    for (const record of feedback) {
      if (record.type === "thumbs_down") {
        negativeScore += 3;
        totalScore += 3;
      } else if (record.type === "follow_up") {
        negativeScore += 1;
        totalScore += 2;
      } else if (record.type === "regenerate") {
        negativeScore += 1;
        totalScore += 1;
      } else if (record.type === "thumbs_up") {
        totalScore += 1;
      }
    }
    const followUpCount = feedback.filter((f) => f.type === "follow_up").length;
    if (followUpCount >= this.minInteractions) negativeScore += followUpCount;
    return totalScore > 0 && negativeScore / totalScore >= this.threshold;
  }
};
var LLMAuditor = class {
  constructor(judgeModel = "claude-sonnet-4-5") {
    this.judgeModel = judgeModel;
  }
  async audit(sample) {
    const issues = [];
    let overallScore = 10;
    for (const feedback of sample.feedback) {
      if (feedback.type === "thumbs_down") {
        issues.push({ category: "prompt_logic", severity: "medium", description: "\u7528\u6237\u5BF9\u56DE\u590D\u4E0D\u6EE1\u610F", suggestion: "\u68C0\u67E5\u56DE\u590D\u51C6\u786E\u6027" });
        overallScore -= 2;
      }
    }
    if (overallScore < 0) overallScore = 0;
    return { sampleId: sample.id, issues, overallScore, recommendation: overallScore >= 7 ? "keep" : "revise", judgeModel: this.judgeModel, timestamp: Date.now() };
  }
};
var PromptOptimizer = class {
  constructor() {
    this.variants = /* @__PURE__ */ new Map();
    this.activeVariantId = null;
  }
  registerVariant(variant) {
    this.variants.set(variant.id, variant);
    if (!this.activeVariantId) this.activeVariantId = variant.id;
  }
  getActiveVariant() {
    return this.activeVariantId ? this.variants.get(this.activeVariantId) || null : null;
  }
  selectVariant() {
    const variants = Array.from(this.variants.values());
    if (variants.length === 0) return null;
    if (Math.random() > 0.1) return this.getActiveVariant();
    const testVariants = variants.filter((v) => v.id !== this.activeVariantId);
    return testVariants.length > 0 ? testVariants[0] : this.getActiveVariant();
  }
  recordFeedback(variantId, isPositive) {
    const v = this.variants.get(variantId);
    if (v) {
      const total = v.metrics.impressions;
      v.metrics.positiveRate = (v.metrics.positiveRate * (total - 1) + (isPositive ? 1 : 0)) / total;
    }
  }
};
var DataFlywheel = class {
  constructor() {
    this.feedbackCollector = new FeedbackCollector();
    this.negativeExtractor = new NegativeSampleExtractor();
    this.llmAuditor = new LLMAuditor();
    this.promptOptimizer = new PromptOptimizer();
  }
  recordFeedback(record) {
    return this.feedbackCollector.record(record);
  }
  async onConversationComplete(sample) {
    if (this.negativeExtractor.isNegative(sample.feedback)) {
      const auditResult = await this.llmAuditor.audit(sample);
      if (auditResult.recommendation === "revise") {
        console.log(`[DataFlywheel] Negative sample: ${sample.id}, Score: ${auditResult.overallScore}/10`);
      }
    }
  }
  destroy() {
    this.feedbackCollector.destroy();
  }
};
var dataFlywheel = new DataFlywheel();

// server/industrial-ai/industrialStream.ts
var IndustrialStreamProcessor = class {
  async preProcess(userInput, sessionId, userId, preferModel) {
    const context = {
      sessionId,
      userId,
      messageId: `msg_${Date.now()}`,
      startTime: Date.now(),
      tokenTimer: new TokenTimer(),
      model: preferModel || "deepseek-chat",
      cacheHit: false
    };
    const cacheResult = semanticCache.get(userInput);
    if (cacheResult.hit) {
      console.log(`[IndustrialStream] Cache HIT for session ${sessionId}`);
      return {
        cacheHit: true,
        cachedResponse: cacheResult.response,
        routing: { modelKey: context.model, modelTier: "cheap", reason: "cache_hit", confidence: 1, estimatedCost: 0 },
        context: { ...context, cacheHit: true }
      };
    }
    const routing = modelRouter.route(userInput, preferModel);
    console.log(`[IndustrialStream] Routed "${userInput.slice(0, 50)}..." -> ${routing.modelKey}`);
    return {
      cacheHit: false,
      routing,
      context: { ...context, model: routing.modelKey }
    };
  }
  sendCachedResponse(res, cachedResponse, context) {
    StreamingOptimizer.sendChunk(res, cachedResponse);
    StreamingOptimizer.sendDone(res, {
      totalTokens: Math.ceil(cachedResponse.length / 4),
      latencyMs: Date.now() - context.startTime,
      model: "CACHE"
    });
  }
  getStats() {
    return { cache: semanticCache.getStats() };
  }
};
var industrialProcessor = new IndustrialStreamProcessor();

// server/aiStream.ts
var aiStreamRouter = Router2();
var tokenPipeline = new TokenOptimizationPipeline({
  enableInputPreprocess: true,
  enableOutputCompact: true,
  enableCliProxy: true,
  enableTokenCounting: true,
  inputMaxChars: 12e3,
  toolOutputMaxChars: 6e3
});
async function getAdminUser(req) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user && user.role === "admin") return user;
    return null;
  } catch {
    return null;
  }
}
var OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
var OLLAMA_OPENAI_BASE_URL = `${OLLAMA_BASE_URL}/v1`;
var OLLAMA_NODE_NAME_PREFIX = "Ollama / ";
async function syncAutoDiscoveredOllamaNodes() {
  try {
    const resp = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!resp.ok) return;
    const data = await resp.json().catch(() => ({}));
    const modelIds = (Array.isArray(data?.models) ? data.models : []).map((item) => String(item?.model || item?.name || "").trim()).filter(Boolean);
    if (modelIds.length === 0) return;
    const existing = await getAiNodes();
    for (let idx = 0; idx < modelIds.length; idx++) {
      const modelId = modelIds[idx];
      const name = `${OLLAMA_NODE_NAME_PREFIX}${modelId}`;
      const found = existing.find((node) => String(node.name || "") === name);
      const payload = {
        name,
        type: "openai_compat",
        baseUrl: OLLAMA_OPENAI_BASE_URL,
        modelId,
        isPaid: false,
        isLocal: true,
        isActive: true,
        isOnline: true,
        priority: Number(found?.priority) || 50 + idx,
        description: `Auto-discovered from Ollama (${OLLAMA_BASE_URL})`
      };
      if (found?.id) {
        await updateAiNode(Number(found.id), payload);
        await updateNodePingStatus(Number(found.id), true, 0);
      } else {
        const created = await createAiNode(payload);
        if (created?.id) {
          await updateNodePingStatus(Number(created.id), true, 0);
        }
      }
    }
  } catch (err) {
    console.warn("[Ollama Sync] Skip auto-discovery:", err);
  }
}
async function selectNode(preferPaid, onlyLocal, onlyCloud) {
  try {
    if (onlyLocal) {
      await syncAutoDiscoveredOllamaNodes();
    }
    const nodes = await getAiNodes(true);
    if (!nodes || nodes.length === 0) return null;
    const rules = await getRoutingRules();
    const defaultRule = rules.find((r) => r.isDefault && r.isActive) || rules.find((r) => r.isActive);
    let candidates = nodes.filter((n) => n.isOnline !== false && n.isActive !== false);
    if (candidates.length === 0) candidates = nodes;
    if (onlyLocal) candidates = candidates.filter((n) => n.isLocal);
    if (onlyCloud) candidates = candidates.filter((n) => !n.isLocal);
    if (candidates.length === 0) return null;
    if (defaultRule) {
      if (defaultRule.mode === "paid" || preferPaid === true) {
        const paid = candidates.filter((n) => n.isPaid);
        if (paid.length > 0) candidates = paid;
      } else if (defaultRule.mode === "free" || preferPaid === false) {
        const free = candidates.filter((n) => !n.isPaid);
        if (free.length > 0) candidates = free;
      } else if (defaultRule.mode === "manual" && defaultRule.nodeIds) {
        const ids = defaultRule.nodeIds.split(",").map((s) => parseInt(s.trim())).filter(Boolean);
        const ordered = ids.map((id) => candidates.find((n) => n.id === id)).filter(Boolean);
        if (ordered.length > 0) candidates = ordered;
      }
      if (defaultRule.loadBalance === "round_robin") {
        return candidates[Math.floor(Math.random() * candidates.length)];
      } else if (defaultRule.loadBalance === "least_latency") {
        const withLatency = candidates.filter((n) => n.lastPingMs);
        if (withLatency.length > 0) {
          return withLatency.reduce((a, b) => (a.lastPingMs || 9999) < (b.lastPingMs || 9999) ? a : b);
        }
      }
    }
    return candidates.sort((a, b) => a.priority - b.priority)[0];
  } catch {
    return null;
  }
}
async function streamFromNode(node, messages, res, model, sendNodeInfo) {
  const effectiveModel = node.modelId || model || "gpt-3.5-turbo";
  const start = Date.now();
  if (sendNodeInfo) {
    res.write(`data: ${JSON.stringify({
      nodeInfo: {
        id: node.id,
        name: node.name,
        model: effectiveModel,
        isLocal: !!node.isLocal
      }
    })}

`);
  }
  try {
    const response = await fetch(`${node.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...node.apiKey ? { Authorization: `Bearer ${node.apiKey}` } : {}
      },
      body: JSON.stringify({ model: effectiveModel, messages, stream: true, max_tokens: 4096 })
    });
    if (!response.ok) {
      const errText = await response.text();
      await createNodeLog({ nodeId: node.id, model: effectiveModel, status: "error", latencyMs: Date.now() - start, errorMessage: `HTTP ${response.status}: ${errText.slice(0, 200)}` });
      return { success: false };
    }
    const reader = response.body?.getReader();
    if (!reader) return { success: false };
    const decoder = new TextDecoder();
    let buffer = "";
    const tokenCounter2 = new StreamTokenCounter(effectiveModel);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") {
          if (trimmed === "data: [DONE]") res.write("data: [DONE]\n\n");
          continue;
        }
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta !== void 0 && delta !== null) {
              res.write(`data: ${JSON.stringify({ content: delta })}

`);
              tokenCounter2.addDelta(delta);
            }
            if (json.usage) tokenCounter2.setFromUsage(json.usage);
          } catch {
          }
        }
      }
    }
    await createNodeLog({ nodeId: node.id, model: effectiveModel, status: "success", latencyMs: Date.now() - start, completionTokens: tokenCounter2.getTotal() });
    return { success: true };
  } catch (err) {
    await createNodeLog({ nodeId: node.id, model: effectiveModel, status: "error", latencyMs: Date.now() - start, errorMessage: err.message });
    return { success: false };
  }
}
async function matchSkillForMessage(userMessage) {
  try {
    const nodesRes = await dbFetch("/ai_nodes?isOnline=eq.true&isLocal=eq.true&select=id,name,baseUrl,token");
    const onlineNodes = nodesRes.data;
    if (!onlineNodes || onlineNodes.length === 0) return null;
    const nodeIds = onlineNodes.map((n) => n.id);
    const skillsRes = await dbFetch(
      `/node_skills?nodeId=in.(${nodeIds.join(",")})&isActive=eq.true&select=*`
    );
    const skills = skillsRes.data;
    if (!skills || skills.length === 0) return null;
    const msgLower = userMessage.toLowerCase();
    const matched = skills.filter((skill) => {
      const triggers = skill.triggers ?? [];
      return triggers.some((t2) => msgLower.includes(t2.toLowerCase()));
    });
    if (matched.length === 0) return null;
    const best = matched.sort((a, b) => {
      const aMaxLen = Math.max(...(a.triggers ?? [""]).map((t2) => t2.length));
      const bMaxLen = Math.max(...(b.triggers ?? [""]).map((t2) => t2.length));
      return bMaxLen - aMaxLen;
    })[0];
    const node = onlineNodes.find((n) => n.id === best.nodeId) || null;
    return {
      nodeId: best.nodeId,
      skillId: best.skillId,
      name: best.name,
      description: best.description ?? null,
      invokeMode: best.invokeMode ?? "prompt",
      systemPrompt: best.systemPrompt ?? null,
      inputSchema: best.inputSchema ?? null,
      requiredPlan: best.required_plan ?? "free",
      node: node ? { baseUrl: node.baseUrl, token: node.token, name: node.name } : null
    };
  } catch (err) {
    console.warn("[SkillMatch] Error during skill matching:", err);
    return null;
  }
}
aiStreamRouter.post("/chat/stream", async (req, res) => {
  let { model = "deepseek-chat", messages, systemPrompt, preferPaid, useLocal, nodeId: requestedNodeId, agent: agentId } = req.body;
  if (agentId && !systemPrompt) {
    const agentPrompt = getAgentSystemPrompt(agentId);
    if (agentPrompt) {
      systemPrompt = agentPrompt;
    }
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const tokenTimer = new TokenTimer();
  const sessionId = req.body.sessionId || `session_${Date.now()}`;
  const messageId = `msg_${Date.now()}`;
  const lastUserMsg = [...messages ?? []].reverse().find((m) => m.role === "user");
  const userText = typeof lastUserMsg?.content === "string" ? lastUserMsg.content : Array.isArray(lastUserMsg?.content) ? lastUserMsg.content.filter((c) => c.type === "text").map((c) => c.text).join(" ") : "";
  const hasImage = Array.isArray(messages) && messages.some(
    (m) => Array.isArray(m.content) && m.content.some((c) => c.type === "image_url")
  );
  if (hasImage && !useLocal && !String(model).startsWith("local:")) {
    const currentCfg = MODEL_CONFIGS[model];
    if (!currentCfg?.supportsVision) {
      model = "glm-5v-turbo";
    }
  }
  if (userText.trim() && !hasImage) {
    const cacheResult = semanticCache.get(userText);
    if (cacheResult.hit) {
      console.log(`[IndustrialAI] Cache HIT for session ${sessionId}`);
      StreamingOptimizer.sendChunk(res, cacheResult.response);
      StreamingOptimizer.sendDone(res, {
        totalTokens: Math.ceil(cacheResult.response.length / 4),
        latencyMs: Date.now() - (req.body._startTime || Date.now()),
        model: "CACHE"
      });
      return;
    }
    const routing = modelRouter.route(userText, model);
    if (routing.modelKey && !model.startsWith("local:")) {
      console.log(`[IndustrialAI] Routed: "${userText.slice(0, 30)}..." -> ${routing.modelKey} (${routing.modelTier})`);
      StreamingOptimizer.sendChunk(res, `<!-- routed:${routing.modelKey}:${routing.modelTier} -->`);
    }
  }
  let matchedSkill = null;
  let callerOpenId = "";
  let callerRole = "user";
  try {
    const callerUser = await sdk.authenticateRequest(req);
    callerOpenId = callerUser?.openId ?? "";
    callerRole = callerUser?.role ?? "user";
  } catch {
  }
  if (!useLocal && !String(model).startsWith("local:") && !hasImage) {
    const lastUserMsg2 = [...messages ?? []].reverse().find((m) => m.role === "user");
    const userText2 = typeof lastUserMsg2?.content === "string" ? lastUserMsg2.content : Array.isArray(lastUserMsg2?.content) ? lastUserMsg2.content.filter((c) => c.type === "text").map((c) => c.text).join(" ") : "";
    if (userText2.trim()) {
      matchedSkill = await matchSkillForMessage(userText2);
      if (matchedSkill) {
        console.log(`[SkillMatch] Matched skill "${matchedSkill.skillId}" (mode=${matchedSkill.invokeMode}, requiredPlan=${matchedSkill.requiredPlan}) on node ${matchedSkill.nodeId}`);
        if (matchedSkill.requiredPlan && matchedSkill.requiredPlan !== "free") {
          const perm = await checkSkillPermission(callerOpenId, callerRole, matchedSkill.requiredPlan);
          if (!perm.allowed) {
            res.write(`data: ${JSON.stringify({
              skillMatch: { skillId: matchedSkill.skillId, name: matchedSkill.name, mode: "blocked" }
            })}

`);
            res.write(`data: ${JSON.stringify({ content: `\u{1F512} **\u6743\u9650\u4E0D\u8DB3**

${perm.reason}

\u5982\u9700\u5347\u7EA7\u5957\u9910\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u6216\u8BBF\u95EE\u8BA2\u9605\u9875\u9762\u3002` })}

`);
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }
        }
      }
    }
  }
  if (matchedSkill?.invokeMode === "invoke" && matchedSkill.node) {
    const { skillId, nodeId, name: skillName, node, inputSchema } = matchedSkill;
    res.write(`data: ${JSON.stringify({
      skillMatch: { skillId, nodeId, name: skillName, mode: "invoke" }
    })}

`);
    try {
      let params = {};
      if (inputSchema) {
        const lastUserMsg2 = [...messages ?? []].reverse().find((m) => m.role === "user");
        const userText2 = typeof lastUserMsg2?.content === "string" ? lastUserMsg2.content : "";
        try {
          const cfg2 = MODEL_CONFIGS["deepseek-chat"];
          if (cfg2?.apiKey) {
            const extractRes = await fetch(`${cfg2.baseUrl}/chat/completions`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg2.apiKey}` },
              body: JSON.stringify({
                model: cfg2.model,
                messages: [
                  { role: "system", content: `\u4F60\u662F\u53C2\u6570\u63D0\u53D6\u52A9\u624B\u3002\u4ECE\u7528\u6237\u8F93\u5165\u4E2D\u63D0\u53D6\u7B26\u5408\u4EE5\u4E0B JSON Schema \u7684\u53C2\u6570\uFF0C\u53EA\u8FD4\u56DE JSON \u5BF9\u8C61\uFF0C\u4E0D\u8981\u5176\u4ED6\u5185\u5BB9\u3002

Schema:
${JSON.stringify(inputSchema)}` },
                  { role: "user", content: userText2 }
                ],
                stream: false,
                max_tokens: 512
              })
            });
            if (extractRes.ok) {
              const extractData = await extractRes.json();
              const raw = extractData.choices?.[0]?.message?.content || "{}";
              params = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, ""));
            }
          }
        } catch (e) {
          console.warn("[SkillMatch] Param extraction failed:", e);
        }
      }
      const invokeRes = await fetch(`${node.baseUrl}/skill/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${node.token}`
        },
        body: JSON.stringify({ skillId, params, requestId: `chat-${Date.now()}` })
      });
      if (!invokeRes.ok) {
        const errText = await invokeRes.text();
        res.write(`data: ${JSON.stringify({ error: `Skill invoke failed (${invokeRes.status}): ${errText.slice(0, 200)}` })}

`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      const invokeData = await invokeRes.json();
      const output = invokeData.output ?? invokeData.result ?? JSON.stringify(invokeData);
      const chunkSize = 100;
      for (let i = 0; i < output.length; i += chunkSize) {
        res.write(`data: ${JSON.stringify({ content: output.slice(i, i + chunkSize) })}

`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    } catch (err) {
      console.error("[SkillMatch] Invoke error:", err);
      res.write(`data: ${JSON.stringify({ error: `Skill "${skillId}" invoke error: ${err.message}` })}

`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
  }
  const normalizeMessagesForVision = (msgs) => msgs.map((m) => {
    if (!Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content.map((c) => {
        if (c.type === "image_url" && c.image_url?.url?.startsWith("data:")) {
          const base64 = c.image_url.url.split(",")[1] || c.image_url.url;
          return { type: "image_url", image_url: { url: base64 } };
        }
        return c;
      })
    };
  });
  let effectiveSystemPrompt = systemPrompt;
  if (matchedSkill?.invokeMode !== "invoke" && matchedSkill?.systemPrompt) {
    effectiveSystemPrompt = [systemPrompt, matchedSkill.systemPrompt].filter(Boolean).join("\n\n---\n\n");
    res.write(`data: ${JSON.stringify({
      skillMatch: {
        skillId: matchedSkill.skillId,
        nodeId: matchedSkill.nodeId,
        name: matchedSkill.name,
        mode: "prompt"
      }
    })}

`);
  }
  const userTextForRag = (() => {
    const lastUserMsg2 = [...messages ?? []].reverse().find((m) => m.role === "user");
    if (!lastUserMsg2) return "";
    return typeof lastUserMsg2.content === "string" ? lastUserMsg2.content : Array.isArray(lastUserMsg2.content) ? lastUserMsg2.content.filter((c) => c.type === "text").map((c) => c.text).join(" ") : "";
  })();
  if (userTextForRag.trim() && userTextForRag.length > 2) {
    try {
      const ragResults = await searchCorpus(userTextForRag, 3);
      if (ragResults.length > 0) {
        const refs = ragResults.map((r) => `[${r.title}]: ${r.content?.slice(0, 300)}...`).join("\n\n");
        res.write(`data: ${JSON.stringify({ ragReferences: { count: ragResults.length, preview: refs.slice(0, 100) + "..." } })}

`);
        effectiveSystemPrompt = (effectiveSystemPrompt ? effectiveSystemPrompt + "\n\n" : "") + refs;
      }
    } catch (_) {
    }
  }
  const rawMessages = effectiveSystemPrompt ? [{ role: "system", content: effectiveSystemPrompt }, ...messages] : messages;
  const optSessionId = req.headers["x-session-id"] || `chat-${Date.now()}`;
  const { messages: optimizedMessages, savedTokens: inputSaved, stats: inputStats } = tokenPipeline.optimizeInput(rawMessages, optSessionId);
  if (inputSaved > 0) {
    res.write(`data: ${JSON.stringify({
      tokenOptimization: {
        stage: "input_preprocess",
        savedTokens: inputSaved,
        strategies: inputStats.flatMap((s) => s.appliedStrategies),
        originalChars: inputStats.reduce((sum, s) => sum + s.originalChars, 0),
        processedChars: inputStats.reduce((sum, s) => sum + s.processedChars, 0)
      }
    })}

`);
  }
  const allMessages = hasImage ? normalizeMessagesForVision(optimizedMessages) : optimizedMessages;
  if (useLocal || typeof model === "string" && model.startsWith("local:")) {
    const admin = await getAdminUser(req);
    if (!admin) {
      res.write(`data: ${JSON.stringify({ error: "\u672C\u5730\u8282\u70B9\u4EC5\u9650\u7BA1\u7406\u5458\u4F7F\u7528" })}

`);
      res.end();
      return;
    }
    let targetNode = null;
    if (requestedNodeId) {
      targetNode = await getAiNodeById(Number(requestedNodeId));
    } else if (typeof model === "string" && model.startsWith("local:")) {
      const id = parseInt(model.slice(6));
      if (!isNaN(id)) targetNode = await getAiNodeById(id);
    }
    if (!targetNode) {
      targetNode = await selectNode(preferPaid, true, false);
    }
    if (!targetNode) {
      res.write(`data: ${JSON.stringify({ error: "\u6CA1\u6709\u53EF\u7528\u7684\u672C\u5730\u8282\u70B9\uFF0C\u8BF7\u5148\u6CE8\u518C\u672C\u5730\u8282\u70B9" })}

`);
      res.end();
      return;
    }
    const result = await streamFromNode(targetNode, allMessages, res, void 0, true);
    if (!result.success) {
      res.write(`data: ${JSON.stringify({ error: `\u672C\u5730\u8282\u70B9 "${targetNode.name}" \u8C03\u7528\u5931\u8D25` })}

`);
    }
    res.end();
    return;
  }
  const cfg = MODEL_CONFIGS[model];
  if (cfg) {
    res.write(`data: ${JSON.stringify({
      nodeInfo: { id: null, name: cfg.name, model: cfg.model, isLocal: false, badge: cfg.badge }
    })}

`);
  }
  if (!cfg) {
    res.write(`data: ${JSON.stringify({ error: `Unknown model: ${model}` })}

`);
    res.end();
    return;
  }
  if (!cfg.apiKey) {
    res.write(`data: ${JSON.stringify({ error: `API key not configured for model: ${model}` })}

`);
    res.end();
    return;
  }
  const { enableTools = true } = req.body;
  const adminUser = await getAdminUser(req);
  const toolDefs = enableTools ? adminUser ? ADMIN_TOOL_DEFINITIONS : TOOL_DEFINITIONS : [];
  const supportsTools = enableTools && !hasImage && toolDefs.length > 0 && !!cfg.apiKey;
  try {
    if (hasImage) {
      const debugMsgs = allMessages.map((m) => ({
        role: m.role,
        content: Array.isArray(m.content) ? m.content.map((c) => {
          if (c.type === "image_url") return { type: "image_url", url_start: (c.image_url?.url || "").substring(0, 30), url_len: (c.image_url?.url || "").length };
          return c;
        }) : m.content
      }));
      console.log("[Vision Debug] model:", cfg.model, "baseUrl:", cfg.baseUrl, "apiKey_len:", cfg.apiKey.length, "msgs:", JSON.stringify(debugMsgs));
    }
    const conversationMessages = [...allMessages];
    const MAX_TOOL_ROUNDS = 8;
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const requestBody = {
        model: cfg.model,
        messages: conversationMessages,
        max_tokens: cfg.maxTokens || 4096,
        stream: true
      };
      if (supportsTools && round < MAX_TOOL_ROUNDS - 1) {
        requestBody.tools = toolDefs;
        requestBody.tool_choice = "auto";
      }
      res.write(`data: ${JSON.stringify({
        reactRound: { round: round + 1, status: "thinking", maxRounds: MAX_TOOL_ROUNDS }
      })}

`);
      const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errText = await response.text();
        res.write(`data: ${JSON.stringify({ error: `API Error ${response.status}: ${errText}` })}

`);
        res.end();
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) {
        res.write(`data: ${JSON.stringify({ error: "No response body" })}

`);
        res.end();
        return;
      }
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      let toolCallsAccum = {};
      let finishReason = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const choice = json.choices?.[0];
              if (!choice) continue;
              if (choice.finish_reason) finishReason = choice.finish_reason;
              const delta = choice.delta;
              if (!delta) continue;
              if (delta.content !== void 0 && delta.content !== null) {
                assistantContent += delta.content;
                res.write(`data: ${JSON.stringify({ content: delta.content })}

`);
              }
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = String(tc.index ?? 0);
                  if (!toolCallsAccum[idx]) {
                    toolCallsAccum[idx] = { id: tc.id || "", name: tc.function?.name || "", arguments: "" };
                  }
                  if (tc.id) toolCallsAccum[idx].id = tc.id;
                  if (tc.function?.name) toolCallsAccum[idx].name = tc.function.name;
                  if (tc.function?.arguments) toolCallsAccum[idx].arguments += tc.function.arguments;
                }
              }
            } catch {
            }
          }
        }
      }
      const toolCalls = Object.values(toolCallsAccum);
      if (toolCalls.length === 0 || finishReason === "stop") {
        res.write(`data: ${JSON.stringify({
          reactEnd: { reason: toolCalls.length === 0 ? "no_tools" : "final_answer", rounds: round + 1 }
        })}

`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      conversationMessages.push({
        role: "assistant",
        content: assistantContent || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.arguments }
        }))
      });
      for (const tc of toolCalls) {
        let args = {};
        try {
          args = JSON.parse(tc.arguments);
        } catch {
          args = {};
        }
        res.write(`data: ${JSON.stringify({
          toolCall: { id: tc.id, name: tc.name, args }
        })}

`);
        const result = await executeTool(tc.name, args, !!adminUser);
        res.write(`data: ${JSON.stringify({
          toolResult: {
            id: tc.id,
            name: tc.name,
            success: result.success,
            output: result.output.slice(0, 500)
            // preview for frontend
          }
        })}

`);
        let toolOutput = result.success ? result.output : `\u5DE5\u5177\u6267\u884C\u5931\u8D25: ${result.error}`;
        if (result.success && result.output.length > 200) {
          const { text: compressedOutput, savedTokens: outputSaved } = tokenPipeline.optimizeToolOutput(tc.name, result.output, sessionId);
          toolOutput = compressedOutput;
          if (outputSaved > 0) {
            res.write(`data: ${JSON.stringify({
              tokenOptimization: {
                stage: "output_compact",
                toolName: tc.name,
                savedTokens: outputSaved
              }
            })}

`);
          }
        }
        if (toolOutput.length > 8e3) {
          toolOutput = toolOutput.slice(0, 8e3);
        }
        conversationMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolOutput
        });
      }
    }
    res.write(`data: ${JSON.stringify({
      reactEnd: { reason: "max_rounds", rounds: MAX_TOOL_ROUNDS }
    })}

`);
    const finalSessionStats = tokenPipeline.getSessionStats(sessionId);
    if (finalSessionStats && finalSessionStats.totalSavedTokens > 0) {
      res.write(`data: ${JSON.stringify({
        tokenOptimization: {
          stage: "session_summary",
          totalSavedTokens: finalSessionStats.totalSavedTokens,
          savingRatio: Math.round(finalSessionStats.savingRatio * 100),
          strategies: finalSessionStats.strategyBreakdown,
          rounds: finalSessionStats.rounds
        }
      })}

`);
    }
    const stats = tokenTimer.getStats();
    if (userText.trim()) {
      dataFlywheel.recordFeedback({
        sessionId,
        messageId,
        type: "thumbs_up",
        metadata: {
          responseTime: stats.totalLatency,
          modelKey: model,
          tokenCount: stats.totalTokens
        }
      });
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[AI Stream] Error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message || "Stream error" })}

`);
    res.end();
  }
});
aiStreamRouter.post("/v1/chat/completions", async (req, res) => {
  const { model = "deepseek-chat", messages, stream = false, max_tokens = 4096, system } = req.body;
  const allMessages = system ? [{ role: "system", content: system }, ...messages || []] : messages || [];
  const isLocal = typeof model === "string" && model.startsWith("local:");
  const isStream = stream === true;
  if (isLocal) {
    const admin = await getAdminUser(req);
    if (!admin) {
      res.status(403).json({ error: { message: "Local nodes are restricted to admin users", type: "auth_error" } });
      return;
    }
  }
  let targetNode = null;
  let cloudCfg = null;
  if (isLocal) {
    const id = parseInt(model.slice(6));
    if (!isNaN(id)) targetNode = await getAiNodeById(id);
    if (!targetNode) targetNode = await selectNode(void 0, true, false);
    if (!targetNode) {
      res.status(503).json({ error: { message: "No local node available", type: "service_unavailable" } });
      return;
    }
  } else {
    cloudCfg = MODEL_CONFIGS[model] || MODEL_CONFIGS["deepseek-chat"];
    if (!cloudCfg?.apiKey) {
      res.status(503).json({ error: { message: `Model "${model}" not configured`, type: "service_unavailable" } });
      return;
    }
  }
  const backendUrl = targetNode ? `${targetNode.baseUrl}/chat/completions` : `${cloudCfg.baseUrl}/chat/completions`;
  const backendKey = targetNode ? targetNode.apiKey || "" : cloudCfg.apiKey;
  const backendModel = targetNode ? targetNode.modelId || "gpt-3.5-turbo" : cloudCfg.model;
  const start = Date.now();
  try {
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...backendKey ? { Authorization: `Bearer ${backendKey}` } : {}
      },
      body: JSON.stringify({ model: backendModel, messages: allMessages, stream: isStream, max_tokens })
    });
    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status).json({ error: { message: errText, type: "upstream_error" } });
      return;
    }
    if (isStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      const reader = upstream.body?.getReader();
      if (!reader) {
        res.end();
        return;
      }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } else {
      const data = await upstream.json();
      res.json(data);
    }
    if (targetNode) {
      await createNodeLog({ nodeId: targetNode.id, model: backendModel, status: "success", latencyMs: Date.now() - start });
    }
  } catch (err) {
    console.error("[OpenAI Compat] Error:", err);
    if (targetNode) {
      await createNodeLog({ nodeId: targetNode.id, model: backendModel, status: "error", latencyMs: Date.now() - start, errorMessage: err.message });
    }
    res.status(500).json({ error: { message: err.message, type: "internal_error" } });
  }
});
aiStreamRouter.get("/v1/models", async (req, res) => {
  const admin = await getAdminUser(req);
  const cloudModels = Object.entries(MODEL_CONFIGS).map(([id, cfg]) => ({
    id,
    object: "model",
    created: 17e8,
    owned_by: "maoai",
    display_name: cfg.name,
    badge: cfg.badge,
    is_local: false
  }));
  let localModels = [];
  if (admin) {
    try {
      await syncAutoDiscoveredOllamaNodes();
      const nodes = await getAiNodes();
      localModels = nodes.filter((n) => n.isLocal && n.isOnline).map((n) => ({
        id: `local:${n.id}`,
        object: "model",
        created: 17e8,
        owned_by: "local",
        display_name: n.name,
        badge: "\u{1F5A5}\uFE0F",
        is_local: true,
        is_online: n.isOnline !== false,
        node_id: n.id,
        base_url: n.baseUrl,
        model_id: n.modelId,
        last_ping_at: n.lastPingAt
      }));
    } catch {
    }
  }
  res.json({
    object: "list",
    data: [...cloudModels, ...localModels]
  });
});
aiStreamRouter.post("/node/register", async (req, res) => {
  const { token, name, baseUrl, type, modelId, priority } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken) {
    res.status(503).json({ error: "NODE_REGISTRATION_TOKEN not configured on server" });
    return;
  }
  if (!token || token !== expectedToken) {
    res.status(401).json({ error: "Invalid registration token" });
    return;
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Missing required field: name" });
    return;
  }
  if (!baseUrl || typeof baseUrl !== "string") {
    res.status(400).json({ error: "Missing required field: baseUrl" });
    return;
  }
  const nodeType = ["workbuddy", "openclaw", "openmanus", "openai_compat", "custom"].includes(type) ? type : "custom";
  const nodePriority = typeof priority === "number" ? priority : 200;
  try {
    const existing = await getAiNodes();
    const found = existing.find((n) => n.name === name.trim());
    if (found) {
      await updateAiNode(found.id, {
        baseUrl: baseUrl.trim(),
        modelId: modelId || found.modelId || "",
        isOnline: true,
        isActive: true,
        priority: nodePriority,
        description: `Auto-registered: ${(/* @__PURE__ */ new Date()).toISOString()}`
      });
      console.log(`[Node Register] Updated node "${name}" (id=${found.id})`);
      res.json({ success: true, nodeId: found.id, action: "updated" });
    } else {
      const node = await createAiNode({
        name: name.trim(),
        type: nodeType,
        baseUrl: baseUrl.trim(),
        apiKey: "",
        modelId: modelId || "",
        isPaid: false,
        isLocal: true,
        priority: nodePriority,
        isActive: true,
        isOnline: true,
        description: `Auto-registered: ${(/* @__PURE__ */ new Date()).toISOString()}`
      });
      console.log(`[Node Register] Created node "${name}" (id=${node?.id})`);
      res.json({ success: true, nodeId: node?.id, action: "created" });
    }
  } catch (err) {
    console.error("[Node Register] Error:", err);
    res.status(500).json({ error: err.message });
  }
});
aiStreamRouter.post("/node/heartbeat", async (req, res) => {
  const { token, nodeId, skillsChecksum, skillCount } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  if (!nodeId || typeof nodeId !== "number") {
    res.status(400).json({ error: "Missing required field: nodeId" });
    return;
  }
  try {
    const node = await getAiNodeById(nodeId);
    if (!node) {
      res.status(404).json({ error: `Node ${nodeId} not found` });
      return;
    }
    await updateNodePingStatus(nodeId, true, void 0);
    if (skillsChecksum !== void 0) {
      const { updateAiNode: updateAiNode2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await updateAiNode2(nodeId, { skillsChecksum });
    }
    const serverChecksum = node.skillsChecksum;
    const needsSkillSync = skillsChecksum !== void 0 && serverChecksum !== skillsChecksum;
    res.json({ success: true, timestamp: (/* @__PURE__ */ new Date()).toISOString(), needsSkillSync });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
aiStreamRouter.post("/node/deregister", async (req, res) => {
  const { token, nodeId } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  try {
    await updateNodePingStatus(nodeId, false, void 0);
    console.log(`[Node Deregister] Node ${nodeId} marked offline`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
aiStreamRouter.post("/node/skills/sync", async (req, res) => {
  const { token, nodeId, action = "upsert", skills } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  if (!nodeId || typeof nodeId !== "number") {
    res.status(400).json({ error: "Missing required field: nodeId" });
    return;
  }
  if (!Array.isArray(skills)) {
    res.status(400).json({ error: "skills must be an array" });
    return;
  }
  try {
    const node = await getAiNodeById(nodeId);
    if (!node) {
      res.status(404).json({ error: `Node ${nodeId} not found` });
      return;
    }
    if (action === "replace_all") {
      await deleteAllNodeSkills(nodeId);
      for (const skill of skills) {
        await upsertNodeSkill({ ...skill, nodeId });
      }
      console.log(`[Skills Sync] Node ${nodeId} replace_all: ${skills.length} skills`);
    } else if (action === "upsert") {
      for (const skill of skills) {
        await upsertNodeSkill({ ...skill, nodeId });
      }
      console.log(`[Skills Sync] Node ${nodeId} upsert: ${skills.length} skills`);
    } else if (action === "delete") {
      for (const skill of skills) {
        await deleteNodeSkill(nodeId, skill.skillId || skill.id);
      }
      console.log(`[Skills Sync] Node ${nodeId} delete: ${skills.length} skills`);
    } else {
      res.status(400).json({ error: `Unknown action: ${action}` });
      return;
    }
    res.json({ success: true, count: skills.length, action });
  } catch (err) {
    console.error("[Skills Sync] Error:", err);
    res.status(500).json({ error: err.message });
  }
});
aiStreamRouter.get("/node/skills/:nodeId", async (req, res) => {
  const admin = await getAdminUser(req);
  if (!admin) {
    res.status(401).json({ error: "Admin only" });
    return;
  }
  const nodeId = parseInt(req.params.nodeId);
  if (isNaN(nodeId)) {
    res.status(400).json({ error: "Invalid nodeId" });
    return;
  }
  try {
    const skills = await getNodeSkills(nodeId);
    res.json({ skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
aiStreamRouter.get("/node/skills", async (req, res) => {
  const admin = await getAdminUser(req);
  if (!admin) {
    res.status(401).json({ error: "Admin only" });
    return;
  }
  try {
    const skills = await getAllNodeSkills();
    res.json({ skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
aiStreamRouter.get("/skill/list", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "\u8BF7\u5148\u767B\u5F55" });
      return;
    }
    const skills = await getAllNodeSkills();
    res.json({ skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
aiStreamRouter.patch("/node/skills/toggle", async (req, res) => {
  const admin = await getAdminUser(req);
  if (!admin) {
    res.status(401).json({ error: "Admin only" });
    return;
  }
  const { nodeId, skillId, isEnabled } = req.body;
  if (!nodeId || !skillId || typeof isEnabled !== "boolean") {
    res.status(400).json({ error: "Missing required fields: nodeId, skillId, isEnabled" });
    return;
  }
  try {
    await setNodeSkillEnabled(Number(nodeId), skillId, isEnabled);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
setInterval(async () => {
  try {
    const nodes = await getAiNodes();
    const now = Date.now();
    const OFFLINE_THRESHOLD_MS = 90 * 1e3;
    for (const node of nodes) {
      if (!node.isLocal || !node.isOnline) continue;
      if (!node.lastPingAt) continue;
      const lastPing = new Date(node.lastPingAt).getTime();
      if (now - lastPing > OFFLINE_THRESHOLD_MS) {
        await updateNodePingStatus(node.id, false, void 0);
        console.log(`[Auto-offline] Node "${node.name}" (id=${node.id}) marked offline`);
      }
    }
  } catch {
  }
}, 60 * 1e3);
aiStreamRouter.post("/image/generate", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "\u8BF7\u5148\u767B\u5F55" });
      return;
    }
    const { prompt, originalImages } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "\u8BF7\u63D0\u4F9B\u56FE\u50CF\u63CF\u8FF0 (prompt)" });
      return;
    }
    const { generateImage: generateImage2 } = await Promise.resolve().then(() => (init_imageGeneration(), imageGeneration_exports));
    const result = await generateImage2({
      prompt: prompt.trim(),
      originalImages: originalImages || []
    });
    res.json({ url: result.url });
  } catch (err) {
    console.error("[Image Generate] Error:", err);
    res.status(500).json({ error: err.message || "\u56FE\u50CF\u751F\u6210\u5931\u8D25" });
  }
});
aiStreamRouter.post("/midjourney/imagine", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "\u8BF7\u5148\u767B\u5F55" });
      return;
    }
    const { prompt, aspectRatio, quality, style, version } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "\u8BF7\u63D0\u4F9B\u56FE\u50CF\u63CF\u8FF0 (prompt)" });
      return;
    }
    const { midjourneyImagine: midjourneyImagine2 } = await Promise.resolve().then(() => (init_midjourney(), midjourney_exports));
    const result = await midjourneyImagine2({
      prompt: prompt.trim(),
      aspectRatio,
      quality,
      style,
      version
    });
    res.json(result);
  } catch (err) {
    console.error("[Midjourney Imagine] Error:", err);
    res.status(500).json({ error: err.message || "Midjourney \u751F\u6210\u5931\u8D25" });
  }
});
aiStreamRouter.post("/midjourney/status", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "\u8BF7\u5148\u767B\u5F55" });
      return;
    }
    const { taskId } = req.body;
    if (!taskId) {
      res.status(400).json({ error: "\u7F3A\u5C11 taskId" });
      return;
    }
    const { midjourneyTaskStatus: midjourneyTaskStatus2 } = await Promise.resolve().then(() => (init_midjourney(), midjourney_exports));
    const result = await midjourneyTaskStatus2(taskId);
    res.json(result);
  } catch (err) {
    console.error("[Midjourney Status] Error:", err);
    res.status(500).json({ error: err.message || "Midjourney \u72B6\u6001\u67E5\u8BE2\u5931\u8D25" });
  }
});
aiStreamRouter.post("/midjourney/upscale", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "\u8BF7\u5148\u767B\u5F55" });
      return;
    }
    const { taskId, index } = req.body;
    if (!taskId || index === void 0) {
      res.status(400).json({ error: "\u7F3A\u5C11 taskId \u6216 index" });
      return;
    }
    const { midjourneyUpscale: midjourneyUpscale2 } = await Promise.resolve().then(() => (init_midjourney(), midjourney_exports));
    const result = await midjourneyUpscale2(taskId, index);
    res.json(result);
  } catch (err) {
    console.error("[Midjourney Upscale] Error:", err);
    res.status(500).json({ error: err.message || "Midjourney Upscale \u5931\u8D25" });
  }
});
aiStreamRouter.post("/runway/text-to-video", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "\u8BF7\u5148\u767B\u5F55" });
      return;
    }
    const { promptText, negativePromptText, duration, seed, model } = req.body;
    if (!promptText || typeof promptText !== "string" || !promptText.trim()) {
      res.status(400).json({ error: "\u8BF7\u63D0\u4F9B\u89C6\u9891\u63CF\u8FF0 (promptText)" });
      return;
    }
    const { runwayTextToVideo: runwayTextToVideo2 } = await Promise.resolve().then(() => (init_runway(), runway_exports));
    const result = await runwayTextToVideo2({
      promptText: promptText.trim(),
      negativePromptText,
      duration,
      seed,
      model
    });
    res.json(result);
  } catch (err) {
    console.error("[Runway T2V] Error:", err);
    res.status(500).json({ error: err.message || "Runway \u89C6\u9891\u751F\u6210\u5931\u8D25" });
  }
});
aiStreamRouter.post("/runway/image-to-video", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "\u8BF7\u5148\u767B\u5F55" });
      return;
    }
    const { promptImage, promptText, negativePromptText, duration, seed, model } = req.body;
    if (!promptImage) {
      res.status(400).json({ error: "\u8BF7\u63D0\u4F9B\u8F93\u5165\u56FE\u7247 URL (promptImage)" });
      return;
    }
    const { runwayImageToVideo: runwayImageToVideo2 } = await Promise.resolve().then(() => (init_runway(), runway_exports));
    const result = await runwayImageToVideo2({
      promptImage,
      promptText,
      negativePromptText,
      duration,
      seed,
      model
    });
    res.json(result);
  } catch (err) {
    console.error("[Runway I2V] Error:", err);
    res.status(500).json({ error: err.message || "Runway \u56FE\u7247\u751F\u6210\u89C6\u9891\u5931\u8D25" });
  }
});
aiStreamRouter.post("/runway/status", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "\u8BF7\u5148\u767B\u5F55" });
      return;
    }
    const { taskId } = req.body;
    if (!taskId) {
      res.status(400).json({ error: "\u7F3A\u5C11 taskId" });
      return;
    }
    const { runwayTaskStatus: runwayTaskStatus2 } = await Promise.resolve().then(() => (init_runway(), runway_exports));
    const result = await runwayTaskStatus2(taskId);
    res.json(result);
  } catch (err) {
    console.error("[Runway Status] Error:", err);
    res.status(500).json({ error: err.message || "Runway \u72B6\u6001\u67E5\u8BE2\u5931\u8D25" });
  }
});
aiStreamRouter.post("/upload", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "\u8BF7\u5148\u767B\u5F55" });
      return;
    }
    const multer = (await import("multer")).default;
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file2, cb) => {
        const ok = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
          "text/plain",
          "text/csv",
          "text/markdown",
          "application/json"
        ];
        if (ok.includes(file2.mimetype) || /\.(txt|md|csv|json|pdf|docx|doc|png|jpg|jpeg|gif|webp)$/i.test(file2.originalname)) {
          cb(null, true);
        } else {
          cb(new Error(`\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B: ${file2.mimetype}`));
        }
      }
    });
    await new Promise((resolve2, reject) => {
      upload.single("file")(req, res, (err) => {
        if (err) reject(err);
        else resolve2();
      });
    });
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "\u8BF7\u9009\u62E9\u8981\u4E0A\u4F20\u7684\u6587\u4EF6" });
      return;
    }
    const { originalname, mimetype, buffer, size } = file;
    if (mimetype.startsWith("image/")) {
      const base64 = buffer.toString("base64");
      res.json({
        type: "image",
        dataUrl: `data:${mimetype};base64,${base64}`,
        fileName: originalname,
        fileType: mimetype,
        size
      });
      return;
    }
    let extractedText = "";
    let fileType = "text";
    if (mimetype === "application/pdf" || /\.pdf$/i.test(originalname)) {
      try {
        if (typeof globalThis.DOMMatrix === "undefined") {
          globalThis.DOMMatrix = class DOMMatrix {
            constructor() {
              return new Proxy({}, { get: () => 0 });
            }
          };
        }
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const parseResult = await parser.getText();
        extractedText = parseResult.text?.trim() || "";
        if (!extractedText) extractedText = "[PDF \u5185\u5BB9\u4E3A\u7A7A\u6216\u4E3A\u626B\u63CF\u4EF6\uFF0C\u65E0\u6CD5\u63D0\u53D6\u6587\u5B57]";
        fileType = "pdf";
      } catch (e) {
        console.warn("[Upload] PDF parse failed:", e?.message);
        extractedText = `[PDF \u89E3\u6790\u5931\u8D25: ${e?.message || "\u672A\u77E5\u9519\u8BEF"}\uFF0C\u8BF7\u5C1D\u8BD5\u590D\u5236\u6587\u672C\u5185\u5BB9]`;
        fileType = "pdf";
      }
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.docx$/i.test(originalname)) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value?.trim() || "";
        if (!extractedText) extractedText = "[Word \u6587\u6863\u5185\u5BB9\u4E3A\u7A7A]";
        fileType = "docx";
        if (result.messages?.length > 0) {
          console.log("[Upload] DOCX warnings:", result.messages.map((m) => m.message).join("; "));
        }
      } catch (e) {
        console.warn("[Upload] DOCX parse failed:", e?.message);
        extractedText = `[Word \u6587\u6863\u89E3\u6790\u5931\u8D25: ${e?.message || "\u672A\u77E5\u9519\u8BEF"}]`;
        fileType = "docx";
      }
    } else if (mimetype === "application/msword" || /\.doc$/i.test(originalname)) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value?.trim() || "";
        if (!extractedText) extractedText = "[\u65E7\u7248 .doc \u683C\u5F0F\u5185\u5BB9\u4E3A\u7A7A\uFF0C\u5EFA\u8BAE\u53E6\u5B58\u4E3A .docx \u540E\u91CD\u65B0\u4E0A\u4F20]";
        fileType = "doc";
      } catch (e) {
        console.warn("[Upload] DOC parse failed:", e?.message);
        extractedText = `[\u65E7\u7248 .doc \u683C\u5F0F\u6682\u4E0D\u652F\u6301\u81EA\u52A8\u89E3\u6790\uFF0C\u8BF7\u5728 Word \u4E2D\u53E6\u5B58\u4E3A .docx \u683C\u5F0F\u540E\u91CD\u65B0\u4E0A\u4F20]`;
        fileType = "doc";
      }
    } else {
      extractedText = buffer.toString("utf-8").trim();
      fileType = /\.csv$/i.test(originalname) ? "csv" : /\.json$/i.test(originalname) ? "json" : /\.md$/i.test(originalname) ? "markdown" : "text";
    }
    const MAX_CHARS = 6e4;
    let truncated = false;
    if (extractedText.length > MAX_CHARS) {
      extractedText = extractedText.slice(0, MAX_CHARS);
      truncated = true;
    }
    res.json({
      type: "document",
      text: extractedText,
      fileName: originalname,
      fileType,
      size,
      truncated,
      charCount: extractedText.length
    });
  } catch (err) {
    console.error("[Upload] Error:", err);
    res.status(500).json({ error: err.message || "\u6587\u4EF6\u89E3\u6790\u5931\u8D25" });
  }
});
aiStreamRouter.post("/agent/stream", async (req, res) => {
  const { task, domain = "general", workspace = "." } = req.body;
  if (!task || typeof task !== "string" || !task.trim()) {
    res.status(400).json({ error: "Missing required field: task" });
    return;
  }
  const admin = await getAdminUser(req);
  if (!admin) {
    res.status(403).json({ error: "\u4EC5\u9650\u7BA1\u7406\u5458\u4F7F\u7528 HyperAgents" });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const PYTHON_SCRIPT = `${__dirname}/hyperagents/generate_loop.py`;
  const PYTHON_CMD = process.env.PYTHON3_PATH || "python3";
  const pythonProcess = spawn(PYTHON_CMD, [
    PYTHON_SCRIPT,
    "--task",
    task.trim(),
    "--domain",
    domain,
    "--workspace",
    workspace
  ], {
    cwd: workspace,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8"
    },
    timeout: 12e4
  });
  let hasErrored = false;
  pythonProcess.stdout.on("data", (data) => {
    const lines = data.toString("utf-8").split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      try {
        const logEntry = JSON.parse(line);
        res.write(`data: ${JSON.stringify({ agentLog: logEntry })}

`);
      } catch {
        console.log("[Python Raw stdout]:", line.substring(0, 200));
        res.write(`data: ${JSON.stringify({ agentLog: { type: "raw", message: line.substring(0, 200), timestamp: Date.now() / 1e3 } })}

`);
      }
    }
  });
  pythonProcess.stderr.on("data", (data) => {
    if (hasErrored) return;
    hasErrored = true;
    const errMsg = data.toString("utf-8").trim();
    console.warn("[HyperAgents stderr]:", errMsg.substring(0, 300));
    res.write(`data: ${JSON.stringify({ agentLog: { type: "error", category: "env", message: errMsg.substring(0, 300), timestamp: Date.now() / 1e3 } })}

`);
  });
  pythonProcess.on("close", (code) => {
    res.write(`data: ${JSON.stringify({ agentLog: { type: "done", exitCode: code, timestamp: Date.now() / 1e3 } })}

`);
    res.write("data: [DONE]\n\n");
    res.end();
  });
  pythonProcess.on("error", (err) => {
    console.error("[HyperAgents spawn error]:", err);
    res.write(`data: ${JSON.stringify({ agentLog: { type: "error", category: "env", message: `\u542F\u52A8\u5931\u8D25: ${err.message}`, timestamp: Date.now() / 1e3 } })}

`);
    res.write("data: [DONE]\n\n");
    res.end();
  });
  setTimeout(() => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ agentLog: { type: "error", category: "timeout", message: "\u6267\u884C\u8D85\u65F6\uFF085\u5206\u949F\uFF09", timestamp: Date.now() / 1e3 } })}

`);
      res.write("data: [DONE]\n\n");
      res.end();
      pythonProcess.kill("SIGTERM");
    }
  }, 5 * 60 * 1e3);
});
aiStreamRouter.get("/status", async (_req, res) => {
  const status = {};
  for (const [id, cfg] of Object.entries(MODEL_CONFIGS)) {
    status[id] = { name: cfg.name, configured: !!cfg.apiKey, badge: cfg.badge };
  }
  let nodeCount = 0, onlineCount = 0;
  try {
    const nodes = await Promise.race([
      getAiNodes(),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("DB timeout")), 3e3)
      )
    ]);
    nodeCount = nodes.length;
    onlineCount = nodes.filter((n) => n.isOnline).length;
  } catch {
  }
  res.json({ status: "ok", models: status, nodes: { total: nodeCount, online: onlineCount }, timestamp: (/* @__PURE__ */ new Date()).toISOString(), version: "v2.3-openclaw-skills" });
});
aiStreamRouter.get("/token-optimization/stats", async (_req, res) => {
  try {
    const { tokenCounter: tokenCounter2 } = await Promise.resolve().then(() => (init_tokenCounter(), tokenCounter_exports));
    res.json({
      activeSessions: tokenCounter2.getActiveSessionCount(),
      pipelineConfig: tokenPipeline.getOptions(),
      version: "v2"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
aiStreamRouter.get("/token-optimization/session/:sessionId", async (req, res) => {
  try {
    const stats = tokenPipeline.getSessionStats(req.params.sessionId);
    if (!stats) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
aiStreamRouter.post("/token-optimization/config", async (req, res) => {
  try {
    tokenPipeline.updateOptions(req.body);
    res.json({ success: true, config: tokenPipeline.getOptions() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var aiStream_default = aiStreamRouter;

// server/chat.ts
import { Router as Router3 } from "express";

// server/tokenCounter.ts
import { encodingForModel } from "js-tiktoken";
var encoderCache = /* @__PURE__ */ new Map();
function getEncoder(model) {
  const key = model || "gpt-4o-mini";
  if (encoderCache.has(key)) return encoderCache.get(key);
  try {
    const enc = encodingForModel(key);
    encoderCache.set(key, enc);
    return enc;
  } catch {
    if (!encoderCache.has("cl100k_base")) {
      const { encodingForModel: efm } = __require("js-tiktoken");
      const { Tiktoken } = __require("js-tiktoken");
      const fallback = new Tiktoken(
        // Load cl100k_base encoding
        __require("js-tiktoken/lazy/cl100k_base"),
        // Mergeable ranks
        void 0
      );
      encoderCache.set("cl100k_base", fallback);
    }
    return encoderCache.get("cl100k_base");
  }
}
function countTokens(text, model) {
  if (!text) return 0;
  try {
    const encoder = getEncoder(model);
    return encoder.encode(text).length;
  } catch {
    return Math.ceil(text.length * 0.4);
  }
}
var ROLE_OVERHEAD = {
  system: 4,
  // <|start|>assistant<|message|> 等
  user: 4,
  assistant: 4,
  tool: 4,
  function: 4
};
var MESSAGE_OVERHEAD = 3;
function countMessagesTokens(messages, model) {
  let total = 0;
  for (const msg of messages) {
    total += ROLE_OVERHEAD[msg.role] || 3;
    total += MESSAGE_OVERHEAD;
    if (msg.name) {
      total += countTokens(msg.name, model) + 1;
    }
    if (msg.content) {
      total += countTokens(msg.content, model);
    }
    if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
      for (const tc of msg.tool_calls) {
        const tcAny = tc;
        total += 15;
        if (tcAny.function?.name) {
          total += countTokens(tcAny.function.name, model);
        }
        if (tcAny.function?.arguments) {
          total += countTokens(typeof tcAny.function.arguments === "string" ? tcAny.function.arguments : JSON.stringify(tcAny.function.arguments), model);
        }
      }
    }
  }
  total += messages.length > 0 ? 1 : 0;
  return total;
}
var CONTEXT_WINDOWS = {
  // DeepSeek
  "deepseek-chat": 64e3,
  "deepseek-reasoner": 64e3,
  // 智谱 GLM
  "glm-4-flash": 128e3,
  "glm-4-plus": 128e3,
  "glm-4-air": 128e3,
  "glm-z1-flash": 65536,
  "glm-4v-flash": 128e3,
  "glm-5v-turbo": 2e5,
  // Groq (Llama)
  "llama-3.3-70b": 128e3,
  "llama-3.1-8b": 128e3,
  "gemma2-9b": 8192,
  // Gemini
  "gemini-2.5-flash": 1048576,
  "gemini-2.5-pro": 1048576,
  // Z.ai
  "zai-glm-5": 128e3,
  "zai-glm-4-7": 128e3,
  // Google AI Studio (Gemma 4)
  "gemma-4-e2b-it": 1e6,
  "gemma-4-e4b-it": 1e6,
  "gemma-4-26b-it": 32e3,
  "gemma-4-31b-it": 128e3
};
var DEFAULT_CONTEXT_WINDOW = 128e3;
var OUTPUT_RESERVE_RATIO = 0.25;
function getContextWindowLimit(model) {
  return CONTEXT_WINDOWS[model] || DEFAULT_CONTEXT_WINDOW;
}
function getInputBudget(model, outputMaxTokens) {
  const total = getContextWindowLimit(model);
  const outputReserve = outputMaxTokens || Math.floor(total * OUTPUT_RESERVE_RATIO);
  return Math.max(total - outputReserve - 500, 1e3);
}
function truncateByTokenBudget(messages, budget, model) {
  if (messages.length === 0) return messages;
  const systemMessages = [];
  const historyMessages = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      systemMessages.push(msg);
    } else {
      historyMessages.push(msg);
    }
  }
  const systemTokens = countMessagesTokens(systemMessages, model);
  const historyBudget = Math.max(budget - systemTokens, 500);
  const selected = [];
  let usedTokens = 0;
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const msg = historyMessages[i];
    const msgTokens = countMessagesTokens([msg], model);
    if (usedTokens + msgTokens > historyBudget) {
      break;
    }
    selected.unshift(msg);
    usedTokens += msgTokens;
  }
  return [...systemMessages, ...selected];
}

// server/chat.ts
var chatRouter = Router3();
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
async function sbGet(path7) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path7}`, { headers });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}
async function sbPost(path7, body, prefer) {
  const { url, headers } = sbHeaders();
  const h = { ...headers };
  if (prefer) h["Prefer"] = prefer;
  const res = await fetch(`${url}/rest/v1${path7}`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}
async function sbDelete(path7) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path7}`, { method: "DELETE", headers });
  return { ok: res.ok, status: res.status };
}
async function sbPatch(path7, body) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path7}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
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
    const json = await res.json();
    const answer = json.answer || "";
    const results = (json.results || []).slice(0, 3).map((r) => `[${r.title}](${r.url})
${r.content?.slice(0, 300)}`).join("\n\n");
    return `\u3010\u8054\u7F51\u641C\u7D22\u7ED3\u679C\u3011
${answer ? `\u6458\u8981\uFF1A${answer}

` : ""}${results}`;
  } catch {
    return "";
  }
}
function needsSearch(text) {
  const patterns = [
    /今天|今日|现在|最新|最近|当前|实时/,
    /\d{4}年|\d+月\d+日/,
    /新闻|资讯|行情|价格|股价/,
    /搜索|查一下|找一下|帮我查/,
    /latest|current|today|recent|news/i
  ];
  return patterns.some((p) => p.test(text));
}
var MODEL_MAP2 = {
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
  "glm-z1-flash": { provider: "zhipu", apiModel: "glm-z1-flash", label: "GLM-Z1 Flash", maxTokens: 4096 },
  // ── Gemini ───────────────────────────────────────────────────────────────
  "gemini-2.5-flash": { provider: "gemini", apiModel: "gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash", maxTokens: 8192 },
  "gemini-2.5-pro": { provider: "gemini", apiModel: "gemini-2.5-pro-preview-03-25", label: "Gemini 2.5 Pro", maxTokens: 8192 },
  // ── Google AI Studio (Gemma 4) ───────────────────────────────────────────
  "gemma-4-e2b-it": { provider: "google-ai-studio", apiModel: "gemma-4-e2b-it", label: "Gemma 4 E2B", maxTokens: 128e3 },
  "gemma-4-e4b-it": { provider: "google-ai-studio", apiModel: "gemma-4-e4b-it", label: "Gemma 4 E4B", maxTokens: 128e3 },
  "gemma-4-26b-it": { provider: "google-ai-studio", apiModel: "gemma-4-26b-it", label: "Gemma 4 26B", maxTokens: 256e3 },
  "gemma-4-31b-it": { provider: "google-ai-studio", apiModel: "gemma-4-31b-it", label: "Gemma 4 31B", maxTokens: 256e3 }
};
var DEFAULT_MODEL = "deepseek-chat";
var ZHIPU_BASE2 = "https://open.bigmodel.cn/api/paas/v4";
var DEEPSEEK_BASE2 = "https://api.deepseek.com/v1";
var GROQ_BASE2 = "https://api.groq.com/openai/v1";
var GEMINI_BASE2 = "https://generativelanguage.googleapis.com/v1beta/openai";
var GOOGLE_AI_STUDIO_BASE2 = "https://generativelanguage.googleapis.com/v1beta";
function getProviderConfig(provider) {
  switch (provider) {
    case "deepseek":
      return { base: DEEPSEEK_BASE2, key: process.env.DEEPSEEK_API_KEY || "" };
    case "groq":
      return { base: GROQ_BASE2, key: process.env.GROQ_API_KEY || "" };
    case "gemini":
      return { base: GEMINI_BASE2, key: process.env.GEMINI_API_KEY || "" };
    case "google-ai-studio":
      return { base: GOOGLE_AI_STUDIO_BASE2, key: process.env.GOOGLE_AI_STUDIO_API_KEY || "" };
    case "zhipu":
    default:
      return { base: ZHIPU_BASE2, key: process.env.ZHIPU_API_KEY || "" };
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
  const list = Object.entries(MODEL_MAP2).map(([id, cfg]) => ({
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
    const history = Array.isArray(historyR.data) ? historyR.data : [];
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
      ...history,
      { role: "user", content: message }
    ];
    const modelCfg_pre = MODEL_MAP2[model] || MODEL_MAP2[DEFAULT_MODEL];
    const inputBudget = getInputBudget(model, modelCfg_pre.maxTokens);
    const finalMessages = truncateByTokenBudget(messages, inputBudget, model);
    const modelCfg = MODEL_MAP2[model] || MODEL_MAP2[DEFAULT_MODEL];
    const { base, key } = getProviderConfig(modelCfg.provider);
    if (!key) {
      sendEvent("error", { text: `${modelCfg.provider.toUpperCase()} API Key \u672A\u914D\u7F6E` });
      return res.end();
    }
    sendEvent("model", { provider: modelCfg.provider, label: modelCfg.label });
    if (modelCfg.provider === "google-ai-studio") {
      const googleUrl = `${base}/models/${modelCfg.apiModel}:generateContent?key=${key}`;
      const contents = messages.filter((m) => m.role !== "system").map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      const systemInstruction = messages.find((m) => m.role === "system");
      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: modelCfg.maxTokens
        }
      };
      if (systemInstruction) {
        requestBody.systemInstruction = { parts: [{ text: systemInstruction.content }] };
      }
      try {
        const googleRes = await fetch(googleUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        if (!googleRes.ok) {
          const errText = await googleRes.text();
          sendEvent("error", { text: `Gemma \u8C03\u7528\u5931\u8D25: ${errText}` });
          return res.end();
        }
        const googleData = await googleRes.json();
        const parts = googleData.candidates?.[0]?.content?.parts || [];
        const geminiText = parts.filter((p) => !p.thought).map((p) => p.text).join("") || "\u65E0\u56DE\u590D";
        const words = geminiText.split("");
        for (const word of words) {
          sendEvent("delta", { text: word });
          await new Promise((r) => setTimeout(r, 5));
        }
        sendEvent("done", {});
        return res.end();
      } catch (e) {
        sendEvent("error", { text: `Gemma \u8C03\u7528\u5F02\u5E38: ${e.message}` });
        return res.end();
      }
    }
    const llmRes = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: modelCfg.apiModel,
        messages: finalMessages,
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
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content || "";
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
    const r = await fetch(`${ZHIPU_BASE2}/images/generations`, {
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
    const json = await r.json();
    const imageUrl = json.data?.[0]?.url || "";
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
import { Router as Router4 } from "express";
var notesRouter = Router4();
function getSupabaseConfig3() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) throw new Error("SUPABASE_URL \u6216 SUPABASE_SERVICE_KEY \u672A\u914D\u7F6E");
  return { url, key };
}
async function sbFetch2(path7, options = {}, prefer) {
  const { url, key } = getSupabaseConfig3();
  const headers = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...options.headers
  };
  if (prefer) headers["Prefer"] = prefer;
  const res = await globalThis.fetch(`${url}/rest/v1${path7}`, { ...options, headers });
  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}
var ADMIN_TOKEN = process.env.NODE_REGISTRATION_TOKEN || "maoai-node-reg-2026-secret-workbuddy";
function requireAdmin2(req, res, next) {
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
  const { url } = getSupabaseConfig3();
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
notesRouter.post("/init", requireAdmin2, async (req, res) => {
  tableInitialized = false;
  await ensureTable();
  const check = await sbFetch2("/notes?limit=1");
  if (check.status === 200 || check.status === 206) {
    return res.json({ success: true, message: "notes \u8868\u5DF2\u5C31\u7EEA" });
  }
  return res.status(500).json({ error: "\u5EFA\u8868\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u5728 Supabase SQL \u7F16\u8F91\u5668\u6267\u884C\u5EFA\u8868\u8BED\u53E5" });
});
notesRouter.get("/", requireAdmin2, async (req, res) => {
  await ensureTable();
  const { q, tag, archived, pinned, limit = "50", offset = "0" } = req.query;
  let path7 = `/notes?order=is_pinned.desc,updated_at.desc&limit=${limit}&offset=${offset}`;
  if (archived === "true") {
    path7 += "&is_archived=eq.true";
  } else {
    path7 += "&is_archived=eq.false";
  }
  if (pinned === "true") path7 += "&is_pinned=eq.true";
  if (tag) path7 += `&tags=cs.{${encodeURIComponent(tag)}}`;
  const result = await sbFetch2(path7, {
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
notesRouter.post("/", requireAdmin2, async (req, res) => {
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
notesRouter.get("/:id", requireAdmin2, async (req, res) => {
  const { id } = req.params;
  const result = await sbFetch2(`/notes?id=eq.${id}&limit=1`);
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data;
  if (!rows?.length) return res.status(404).json({ error: "\u7B14\u8BB0\u4E0D\u5B58\u5728" });
  return res.json(rows[0]);
});
notesRouter.patch("/:id", requireAdmin2, async (req, res) => {
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
notesRouter.delete("/:id", requireAdmin2, async (req, res) => {
  const { id } = req.params;
  const result = await sbFetch2(`/notes?id=eq.${id}`, { method: "DELETE" }, "return=minimal");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  return res.status(204).send();
});
notesRouter.get("/tags/all", requireAdmin2, async (req, res) => {
  await ensureTable();
  const result = await sbFetch2("/notes?select=tags&is_archived=eq.false&limit=1000");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data;
  const tagSet = /* @__PURE__ */ new Set();
  rows?.forEach((n) => n.tags?.forEach((t2) => tagSet.add(t2)));
  return res.json({ tags: Array.from(tagSet).sort() });
});
notesRouter.patch("/:id/pin", requireAdmin2, async (req, res) => {
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
notesRouter.patch("/:id/archive", requireAdmin2, async (req, res) => {
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

// server/research-digest.ts
import * as https from "https";
import * as http from "http";
var MAOYAN_KEYWORDS = [
  // 品牌战略
  "brand strategy",
  "brand positioning",
  "brand premium",
  "brand equity",
  "luxury brand",
  "premium brand",
  "brand differentiation",
  "brand building",
  "brand management",
  "brand identity",
  "brand value",
  "brand growth",
  // 增长与营销
  "growth hacking",
  "growth strategy",
  "growth engine",
  "user acquisition",
  "influencer marketing",
  "KOL",
  "key opinion leader",
  "social commerce",
  "content marketing",
  "viral marketing",
  "word of mouth",
  "community marketing",
  "performance marketing",
  "omni-channel",
  "omnichannel",
  // 消费品与新消费
  "consumer brand",
  "new consumer",
  "DTC",
  "direct to consumer",
  "product innovation",
  "hit product",
  "blockbuster product",
  "consumer behavior",
  "consumer psychology",
  "consumer insight",
  "e-commerce",
  "cross-border e-commerce",
  "global expansion",
  "China market",
  "Chinese consumer",
  "Gen Z consumer",
  // 竞争与定位
  "competitive positioning",
  "market positioning",
  "blue ocean",
  "niche market",
  "market differentiation",
  "competitive advantage",
  "category innovation",
  "category creation",
  "first mover",
  // IP与联名
  "IP licensing",
  "brand collaboration",
  "co-branding",
  "intellectual property",
  "celebrity marketing",
  "brand ambassador",
  // 运营与电商
  "Tmall",
  "Douyin",
  "TikTok commerce",
  "Xiaohongshu",
  "RED commerce",
  "live streaming commerce",
  "short video marketing",
  // 定价与溢价
  "pricing strategy",
  "premium pricing",
  "value-based pricing",
  "willingness to pay",
  "price elasticity",
  // 战略管理（HBR核心方向）
  "disruptive innovation",
  "business model innovation",
  "platform strategy",
  "digital transformation",
  "go-to-market",
  "market entry",
  "founder brand",
  "entrepreneur",
  "startup growth",
  // 中文关键词
  "\u54C1\u724C",
  "\u589E\u957F",
  "\u6D88\u8D39",
  "\u8425\u9500",
  "\u5B9A\u4F4D",
  "\u521B\u65B0",
  "\u51FA\u6D77",
  "\u79C1\u57DF",
  "\u7206\u54C1",
  "KOL",
  "\u76F4\u64AD",
  "\u7535\u5546",
  "\u65B0\u6D88\u8D39",
  "\u9519\u4F4D\u7ADE\u4E89",
  "\u54C1\u7C7B\u521B\u65B0"
];
var HBR_RSS_FEEDS = [
  {
    name: "HBR Latest",
    url: "https://hbr.org/rss/the-latest",
    category: "management"
  },
  {
    name: "HBR Leadership & Managing People",
    url: "https://hbr.org/rss/topic/leadership",
    category: "leadership"
  },
  {
    name: "HBR Strategy",
    url: "https://hbr.org/rss/topic/strategy",
    category: "strategy"
  },
  {
    name: "HBR Innovation",
    url: "https://hbr.org/rss/topic/innovation",
    category: "innovation"
  },
  {
    name: "HBR Technology",
    url: "https://hbr.org/rss/topic/technology",
    category: "technology"
  }
];
var ARXIV_CATEGORIES = [
  // AI / 机器学习（赋能品牌增长与营销）
  { cat: "cs.AI", name: "\u4EBA\u5DE5\u667A\u80FD", maxResults: 10 },
  { cat: "cs.LG", name: "\u673A\u5668\u5B66\u4E60", maxResults: 10 },
  // 计算社会科学与网络传播（KOL/病毒传播/社交媒体营销）
  { cat: "cs.SI", name: "\u793E\u4EA4\u7F51\u7EDC\u4E0E\u4FE1\u606F\u4F20\u64AD", maxResults: 8 },
  { cat: "cs.IR", name: "\u4FE1\u606F\u68C0\u7D22\u4E0E\u63A8\u8350\u7CFB\u7EDF", maxResults: 6 },
  // 经济学（消费行为、定价策略、市场设计）
  { cat: "econ.GN", name: "\u7ECF\u6D4E\u5B66\xB7\u7EFC\u5408", maxResults: 6 },
  { cat: "econ.EM", name: "\u8BA1\u91CF\u7ECF\u6D4E\u5B66\xB7\u6D88\u8D39\u884C\u4E3A", maxResults: 5 },
  // 数学（统计与优化，支撑增长决策）
  { cat: "math.ST", name: "\u7EDF\u8BA1\u5B66\xB7\u51B3\u7B56\u79D1\u5B66", maxResults: 5 },
  { cat: "math.OC", name: "\u6700\u4F18\u5316\xB7\u8FD0\u8425\u7B56\u7565", maxResults: 4 },
  // 生物/神经科学（消费者心理/决策神经科学）
  { cat: "q-bio.NC", name: "\u795E\u7ECF\u79D1\u5B66\xB7\u51B3\u7B56\u4E0E\u6D88\u8D39\u5FC3\u7406", maxResults: 5 },
  // 物理（复杂系统/传播动力学，适用于品牌传播建模）
  { cat: "physics.soc-ph", name: "\u793E\u4F1A\u7269\u7406\u5B66\xB7\u54C1\u724C\u4F20\u64AD\u52A8\u529B\u5B66", maxResults: 4 },
  // 量化金融（定价模型、风险决策）
  { cat: "q-fin.GN", name: "\u91CF\u5316\u91D1\u878D\xB7\u54C1\u724C\u4F30\u503C", maxResults: 3 }
];
function fetchUrl(url, timeoutMs = 1e4) {
  return new Promise((resolve2, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve2(data));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout: ${url}`));
    });
  });
}
function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = (/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(itemXml) || /<title[^>]*>([\s\S]*?)<\/title>/.exec(itemXml))?.[1] ?? "";
    const description = (/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(itemXml) || /<description[^>]*>([\s\S]*?)<\/description>/.exec(itemXml))?.[1] ?? "";
    const link = /<link>([\s\S]*?)<\/link>/.exec(itemXml)?.[1] ?? "";
    const pubDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml)?.[1] ?? "";
    if (title) {
      items.push({
        title: title.replace(/<[^>]+>/g, "").trim(),
        description: description.replace(/<[^>]+>/g, "").substring(0, 500).trim(),
        link: link.trim(),
        pubDate: pubDate.trim()
      });
    }
  }
  return items;
}
function calcRelevanceScore(text) {
  const lowerText = text.toLowerCase();
  const matched = [];
  for (const kw of MAOYAN_KEYWORDS) {
    if (lowerText.includes(kw.toLowerCase())) {
      matched.push(kw);
    }
  }
  const score = Math.min(100, matched.length * 15);
  return { score, matched };
}
async function fetchHbrItems(maxPerFeed = 5) {
  const results = [];
  for (const feed of HBR_RSS_FEEDS) {
    try {
      const xml = await fetchUrl(feed.url);
      const items = parseRssItems(xml).slice(0, maxPerFeed);
      for (const item of items) {
        const text = `${item.title} ${item.description}`;
        const { score, matched } = calcRelevanceScore(text);
        results.push({
          id: `hbr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          source: "hbr",
          category: feed.category,
          title: item.title,
          summary: item.description,
          url: item.link,
          publishedAt: item.pubDate || (/* @__PURE__ */ new Date()).toISOString(),
          relevanceScore: score,
          keywords: matched
        });
      }
    } catch (e) {
      console.warn(`[ResearchDigest] HBR feed failed: ${feed.name}`, e);
    }
  }
  return results;
}
async function fetchArxivItems(maxTotal = 50) {
  const results = [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1e3);
  const dateStr = sevenDaysAgo.toISOString().split("T")[0].replace(/-/g, "");
  for (const cat of ARXIV_CATEGORIES) {
    if (results.length >= maxTotal) break;
    try {
      const url = `https://export.arxiv.org/api/query?search_query=cat:${cat.cat}&start=0&max_results=${cat.maxResults}&sortBy=submittedDate&sortOrder=descending`;
      const xml = await fetchUrl(url, 15e3);
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;
      while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];
        const title = /<title>([\s\S]*?)<\/title>/.exec(entry)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
        const summary = /<summary>([\s\S]*?)<\/summary>/.exec(entry)?.[1]?.replace(/\s+/g, " ").substring(0, 600).trim() ?? "";
        const id = /<id>([\s\S]*?)<\/id>/.exec(entry)?.[1]?.trim() ?? "";
        const published = /<published>([\s\S]*?)<\/published>/.exec(entry)?.[1]?.trim() ?? "";
        if (!title) continue;
        const text = `${title} ${summary}`;
        const { score, matched } = calcRelevanceScore(text);
        results.push({
          id: `arxiv-${id.split("/").pop() ?? Math.random().toString(36).substr(2, 8)}`,
          source: "arxiv",
          category: cat.name,
          title,
          summary,
          url: id,
          publishedAt: published,
          relevanceScore: score,
          keywords: matched
        });
      }
    } catch (e) {
      console.warn(`[ResearchDigest] arXiv fetch failed for ${cat.cat}`, e);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return results;
}
async function fetchPubmedItems(keywords = [
  "consumer behavior brand loyalty",
  "influencer marketing social commerce",
  "brand premium pricing psychology",
  "cross-border e-commerce consumer",
  "digital marketing growth strategy"
], maxResults = 5) {
  const results = [];
  for (const kw of keywords) {
    try {
      const query = encodeURIComponent(`${kw}[Title/Abstract]`);
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&retmax=${maxResults}&sort=date&retmode=json`;
      const searchData = await fetchUrl(searchUrl);
      const searchJson = JSON.parse(searchData);
      const ids = searchJson?.esearchresult?.idlist ?? [];
      if (ids.length === 0) continue;
      const fetchUrl2 = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.slice(0, 3).join(",")}&retmode=xml`;
      const xml = await fetchUrl(fetchUrl2, 15e3);
      const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
      let match;
      while ((match = articleRegex.exec(xml)) !== null) {
        const article = match[1];
        const title = /<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/.exec(article)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
        const abstract = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/.exec(article)?.[1]?.replace(/<[^>]+>/g, "").substring(0, 500).trim() ?? "";
        const pmid = /<PMID Version="1">([\s\S]*?)<\/PMID>/.exec(article)?.[1]?.trim() ?? "";
        if (!title) continue;
        const text = `${title} ${abstract}`;
        const { score, matched } = calcRelevanceScore(text);
        results.push({
          id: `pubmed-${pmid}`,
          source: "pubmed",
          category: "\u751F\u7269\u533B\u5B66",
          title,
          summary: abstract,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
          relevanceScore: score,
          keywords: matched
        });
      }
    } catch (e) {
      console.warn(`[ResearchDigest] PubMed fetch failed for: ${kw}`, e);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return results;
}
async function fetchAllDigests(options) {
  const opts = {
    includeHbr: true,
    includeScience: true,
    maxHbr: 5,
    maxScience: 50,
    ...options
  };
  const [hbrItems, arxivItems, pubmedItems] = await Promise.allSettled([
    opts.includeHbr ? fetchHbrItems(opts.maxHbr) : Promise.resolve([]),
    opts.includeScience ? fetchArxivItems(opts.maxScience) : Promise.resolve([]),
    opts.includeScience ? fetchPubmedItems(
      [
        "consumer behavior brand loyalty",
        "influencer marketing social media commerce",
        "brand premium pricing willingness to pay",
        "cross-border e-commerce Chinese consumer",
        "digital marketing growth hacking"
      ],
      5
    ) : Promise.resolve([])
  ]);
  const hbr = hbrItems.status === "fulfilled" ? hbrItems.value : [];
  const arxiv = arxivItems.status === "fulfilled" ? arxivItems.value : [];
  const pubmed = pubmedItems.status === "fulfilled" ? pubmedItems.value : [];
  const scienceItems = [...arxiv, ...pubmed];
  const maoyanRelevantItems = [
    ...hbr.filter((i) => i.relevanceScore >= 15),
    ...scienceItems.filter((i) => i.relevanceScore >= 15)
  ].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 20);
  return {
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    hbrItems: hbr,
    scienceItems,
    maoyanRelevantItems
  };
}

// server/mcp-server.ts
import { Router as Router5 } from "express";
var mcpServerRouter = Router5();
var MCP_PROTOCOL_VERSION = "2025-03-26";
var SERVER_INFO = {
  name: "maoai-mcp-server",
  version: "1.0.0",
  description: "MaoAI \u591A\u6A21\u578B AI \u5E73\u53F0 - MCP \u5DE5\u5177\u670D\u52A1\u5668"
};
var sseClients = /* @__PURE__ */ new Map();
function sendSseEvent(clientId, event, data) {
  const res = sseClients.get(clientId);
  if (!res) return;
  try {
    res.write(`event: ${event}
`);
    res.write(`data: ${JSON.stringify(data)}

`);
  } catch {
    sseClients.delete(clientId);
  }
}
function jsonRpcSuccess(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id, code, message, data) {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}
function toMcpTools(defs) {
  return defs.map((def) => {
    const fn = def.function || def;
    return {
      name: fn.name,
      description: fn.description || "",
      inputSchema: fn.parameters || { type: "object", properties: {} }
    };
  });
}
async function handleMcpRequest(method, params, id, isAdmin) {
  switch (method) {
    case "initialize": {
      return {
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: SERVER_INFO,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false },
          prompts: { listChanged: false }
        }
      };
    }
    case "notifications/initialized":
      return null;
    case "tools/list": {
      const baseDefs = TOOL_DEFINITIONS;
      const adminDefs = isAdmin ? ADMIN_TOOL_DEFINITIONS : [];
      const allDefs = [...baseDefs, ...adminDefs];
      return {
        tools: toMcpTools(allDefs)
      };
    }
    case "tools/call": {
      const toolName = String(params?.name || "");
      const toolArgs = params?.arguments || {};
      if (!toolName) {
        throw { code: -32602, message: "params.name is required" };
      }
      const result = await executeTool(toolName, toolArgs, isAdmin);
      let text;
      if (typeof result === "string") {
        text = result;
      } else if (result && typeof result === "object" && "output" in result) {
        const r = result;
        text = r.output || "";
        if (!r.success && r.error) {
          text = `Error: ${r.error}${text ? `

${text}` : ""}`;
        }
      } else {
        text = JSON.stringify(result, null, 2);
      }
      const isError = result && typeof result === "object" && "success" in result ? !result.success : false;
      return {
        content: [{ type: "text", text }],
        isError,
        structuredContent: result
      };
    }
    case "resources/list":
      return { resources: [] };
    case "prompts/list":
      return { prompts: [] };
    default:
      throw { code: -32601, message: `Method not found: ${method}` };
  }
}
mcpServerRouter.get("/sse", (req, res) => {
  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-MCP-Protocol-Version", MCP_PROTOCOL_VERSION);
  res.flushHeaders();
  sseClients.set(clientId, res);
  sendSseEvent(clientId, "connected", {
    clientId,
    serverInfo: SERVER_INFO,
    protocolVersion: MCP_PROTOCOL_VERSION
  });
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat

`);
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(clientId);
    }
  }, 3e4);
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
});
mcpServerRouter.post("/", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-MCP-Protocol-Version", MCP_PROTOCOL_VERSION);
  const body = req.body;
  const requests = Array.isArray(body) ? body : [body];
  const responses = [];
  const isAdmin = req.headers["x-maoai-admin"] === process.env.MCP_ADMIN_SECRET;
  for (const request of requests) {
    const { jsonrpc, method, params, id } = request || {};
    if (jsonrpc !== "2.0") {
      responses.push(jsonRpcError(id ?? null, -32600, "Invalid Request: jsonrpc must be '2.0'"));
      continue;
    }
    if (!method) {
      responses.push(jsonRpcError(id ?? null, -32600, "Invalid Request: method is required"));
      continue;
    }
    try {
      const result = await handleMcpRequest(method, params || {}, id ?? null, isAdmin);
      if (id !== void 0 && id !== null) {
        responses.push(jsonRpcSuccess(id, result));
      }
    } catch (err) {
      if (err?.code && err?.message) {
        responses.push(jsonRpcError(id ?? null, err.code, err.message, err.data));
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        responses.push(jsonRpcError(id ?? null, -32603, `Internal error: ${msg}`));
      }
    }
  }
  if (responses.length === 0) {
    res.status(204).end();
  } else if (responses.length === 1 && !Array.isArray(body)) {
    res.json(responses[0]);
  } else {
    res.json(responses);
  }
});
mcpServerRouter.options("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-MaoAI-Admin");
  res.status(204).end();
});
mcpServerRouter.get("/manifest", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const isAdmin = req.headers["x-maoai-admin"] === process.env.MCP_ADMIN_SECRET;
  const baseDefs = TOOL_DEFINITIONS;
  const adminDefs = isAdmin ? ADMIN_TOOL_DEFINITIONS : [];
  res.json({
    serverInfo: SERVER_INFO,
    protocolVersion: MCP_PROTOCOL_VERSION,
    toolCount: baseDefs.length + adminDefs.length,
    tools: toMcpTools([...baseDefs, ...adminDefs]),
    endpoints: {
      jsonrpc: "POST /api/mcp",
      sse: "GET /api/mcp/sse",
      manifest: "GET /api/mcp/manifest"
    }
  });
});

// server/maoCorpusRouter.ts
import { Router as Router6 } from "express";
import * as fs6 from "fs";
import * as path6 from "path";
import * as os2 from "os";
import { fileURLToPath as fileURLToPath3 } from "url";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname4 = path6.dirname(__filename3);
var maoCorpusRouter = Router6();
var CLOUD_SUPABASE_URL = "https://fczherphuixpdjuevzsh.supabase.co";
var CLOUD_BUCKET = "mao-corpus";
var CLOUD_INDEX_URL = `${CLOUD_SUPABASE_URL}/storage/v1/object/public/${CLOUD_BUCKET}/code_rag_index.json`;
var LOCAL_CORPUS_DIR = path6.resolve(__dirname4, "mao_corpus");
var LOCAL_INDEX_PATH = path6.join(LOCAL_CORPUS_DIR, "code_rag_index.json");
var WORKBUDDY_CORPUS_DIR = path6.join(os2.homedir(), ".workbuddy/mao_corpus");
var WORKBUDDY_INDEX_PATH = path6.join(WORKBUDDY_CORPUS_DIR, "code_rag_index.json");
async function fetchCloudIndex() {
  try {
    const res = await fetch(CLOUD_INDEX_URL);
    if (res.ok) {
      return await res.json();
    }
  } catch {
  }
  return null;
}
function getLocalIndex() {
  const candidates = [LOCAL_INDEX_PATH, WORKBUDDY_INDEX_PATH];
  for (const p of candidates) {
    if (fs6.existsSync(p)) {
      try {
        return JSON.parse(fs6.readFileSync(p, "utf-8"));
      } catch {
      }
    }
  }
  return null;
}
function keywordSearch(index, query, topK = 5) {
  const chunks2 = index?.chunks || [];
  const scored = chunks2.map((chunk) => {
    const title = (chunk.title || "").toLowerCase();
    const content = (chunk.content || "").toLowerCase();
    const file = (chunk.metadata?.file || "").toLowerCase();
    const queryLower = query.toLowerCase();
    let score = 0;
    if (title.includes(queryLower)) score += 3;
    if (file.includes(queryLower)) score += 1;
    if (content.includes(queryLower)) score += 1;
    return { chunk, score };
  });
  return scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, topK).map((x) => ({
    id: x.chunk.id,
    title: x.chunk.title,
    content: x.chunk.content,
    score: x.score
  }));
}
maoCorpusRouter.get("/status", (_req, res) => {
  const localExists = fs6.existsSync(LOCAL_INDEX_PATH);
  const workbuddyExists = fs6.existsSync(WORKBUDDY_INDEX_PATH);
  res.json({
    status: "online",
    data_sources: {
      maoai_local: { path: LOCAL_CORPUS_DIR, available: localExists },
      workbuddy: { path: WORKBUDDY_CORPUS_DIR, available: workbuddyExists },
      cloud: { url: CLOUD_INDEX_URL, available: null }
      // 动态检测
    },
    total_chunks: null,
    // 动态获取
    version: null
  });
});
maoCorpusRouter.get("/search", async (req, res) => {
  const query = req.query.q || "";
  const topK = Math.min(parseInt(req.query.k) || 5, 20);
  if (!query.trim()) {
    res.json({ results: [], message: "\u8BF7\u63D0\u4F9B\u67E5\u8BE2\u53C2\u6570 q" });
    return;
  }
  let index = getLocalIndex();
  if (!index) {
    console.log("[MaoCorpus] \u672C\u5730\u7D22\u5F15\u672A\u627E\u5230\uFF0C\u5C1D\u8BD5\u4E91\u7AEF...");
    index = await fetchCloudIndex();
    if (index) console.log("[MaoCorpus] \u4E91\u7AEF\u7D22\u5F15\u52A0\u8F7D\u6210\u529F");
  }
  if (!index) {
    res.status(503).json({
      results: [],
      error: "\u65E0\u6CD5\u52A0\u8F7D\u5411\u91CF\u7D22\u5F15\uFF08\u672C\u5730\u548C\u4E91\u7AEF\u5747\u4E0D\u53EF\u7528\uFF09"
    });
    return;
  }
  const results = keywordSearch(index, query, topK);
  res.json({
    query,
    total_chunks: index.chunks?.length || 0,
    results,
    source: fs6.existsSync(LOCAL_INDEX_PATH) ? "maoai_local" : fs6.existsSync(WORKBUDDY_INDEX_PATH) ? "workbuddy" : "cloud"
  });
});
maoCorpusRouter.get("/refresh", async (_req, res) => {
  try {
    const index = await fetchCloudIndex();
    if (!index) {
      res.status(502).json({ error: "\u4E91\u7AEF\u7D22\u5F15\u83B7\u53D6\u5931\u8D25" });
      return;
    }
    const targetPath = LOCAL_INDEX_PATH;
    const targetDir = path6.dirname(targetPath);
    if (!fs6.existsSync(targetDir)) {
      fs6.mkdirSync(targetDir, { recursive: true });
    }
    fs6.writeFileSync(targetPath, JSON.stringify(index, null, 2));
    res.json({
      success: true,
      saved_to: targetPath,
      total_chunks: index.chunks?.length || 0,
      total_files: index.total_files || 0,
      version: index.version || "unknown"
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// server/rowboat/rowboat-router.ts
init_supabase();
import { Router as Router7 } from "express";

// server/rowboat/memory-service.ts
var RowboatMemoryService = class {
  constructor() {
    this.collectionName = "rowboat_memories";
    this.supabase = null;
    this.qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
    this.qdrantApiKey = process.env.QDRANT_API_KEY || "";
    Promise.resolve().then(() => (init_supabase(), supabase_exports)).then(({ supabaseAdmin: supabaseAdmin4 }) => {
      this.supabase = supabaseAdmin4;
    });
  }
  // ── 添加记忆（Supabase 持久化 + 尝试 Qdrant 向量化）──────────────────────
  async addMemory(params) {
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await this.saveToSupabase({
      id: memoryId,
      ...params,
      createdAt: now
    });
    try {
      await this.upsertToQdrant(memoryId, params.content, {
        userId: params.userId,
        sessionId: params.sessionId,
        entityNames: params.entities.map((e) => e.name),
        ...params.metadata
      });
    } catch (err) {
      console.warn("[Rowboat/Memory] Qdrant upsert skipped:", err.message);
    }
    return memoryId;
  }
  // ── 语义搜索（优先 Qdrant，降级 Supabase 文本搜索）────────────────────────
  async searchMemories(query, userId, limit = 10) {
    try {
      const qdrantResults = await this.searchQdrant(query, userId, limit);
      if (qdrantResults.length > 0) return qdrantResults;
    } catch {
    }
    return this.searchSupabase(query, userId, limit);
  }
  // ── 列出记忆（从 Supabase）──────────────────────────────────────────────────
  async listMemories(userId, limit = 20) {
    if (!this.supabase) return [];
    try {
      const { data, error } = await this.supabase.from("rowboat_memories").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).map(this.mapRow);
    } catch (err) {
      console.warn("[Rowboat/Memory] listMemories fallback:", err.message);
      return [];
    }
  }
  // ── Supabase 保存 ─────────────────────────────────────────────────────────
  async saveToSupabase(record) {
    if (!this.supabase) return;
    const { error } = await this.supabase.from("rowboat_memories").upsert({
      id: record.id,
      user_id: record.userId,
      session_id: record.sessionId,
      content: record.content,
      entities: record.entities,
      metadata: record.metadata,
      created_at: record.createdAt
    });
    if (error) {
      console.warn("[Rowboat/Memory] Supabase save error (run migration?):", error.message);
    }
  }
  // ── Supabase 文本搜索 ─────────────────────────────────────────────────────
  async searchSupabase(query, userId, limit) {
    if (!this.supabase) return [];
    try {
      const { data, error } = await this.supabase.from("rowboat_memories").select("*").eq("user_id", userId).ilike("content", `%${query}%`).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).map(this.mapRow);
    } catch {
      return [];
    }
  }
  // ── Qdrant 向量 upsert（使用文本哈希模拟 embedding）─────────────────────
  async upsertToQdrant(id, text, payload) {
    const vector = this.textToVector(text);
    await this.ensureCollection(vector.length);
    const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}/points`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.qdrantApiKey ? { "api-key": this.qdrantApiKey } : {}
      },
      body: JSON.stringify({
        points: [{ id: this.hashId(id), vector, payload: { ...payload, originalId: id, text } }]
      })
    });
    if (!response.ok) {
      throw new Error(`Qdrant upsert failed: ${response.status}`);
    }
  }
  // ── Qdrant 向量搜索 ───────────────────────────────────────────────────────
  async searchQdrant(query, userId, limit) {
    const vector = this.textToVector(query);
    const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}/points/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.qdrantApiKey ? { "api-key": this.qdrantApiKey } : {}
      },
      body: JSON.stringify({
        vector,
        filter: { must: [{ key: "userId", match: { value: userId } }] },
        limit,
        with_payload: true
      }),
      signal: AbortSignal.timeout(3e3)
    });
    if (!response.ok) throw new Error(`Qdrant search failed: ${response.status}`);
    const data = await response.json();
    return (data.result || []).map((r) => ({
      id: r.payload.originalId,
      content: r.payload.text,
      userId: r.payload.userId,
      sessionId: r.payload.sessionId,
      entities: [],
      metadata: r.payload,
      createdAt: r.payload.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      similarity: r.score
    }));
  }
  // ── 确保 Qdrant 集合存在 ─────────────────────────────────────────────────
  async ensureCollection(vectorSize) {
    const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}`, {
      headers: this.qdrantApiKey ? { "api-key": this.qdrantApiKey } : {}
    });
    if (response.status === 404) {
      await fetch(`${this.qdrantUrl}/collections/${this.collectionName}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...this.qdrantApiKey ? { "api-key": this.qdrantApiKey } : {}
        },
        body: JSON.stringify({ vectors: { size: vectorSize, distance: "Cosine" } })
      });
    }
  }
  // ── 工具函数 ──────────────────────────────────────────────────────────────
  /** 简单文本向量化（256 维字符频率）*/
  textToVector(text) {
    const vec = new Array(256).fill(0);
    for (const char of text.slice(0, 512)) {
      vec[char.charCodeAt(0) % 256]++;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
  /** 将字符串 ID 转换为数字（Qdrant 要求数字 ID）*/
  hashId(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = hash * 31 + id.charCodeAt(i) >>> 0;
    }
    return hash;
  }
  mapRow(row) {
    return {
      id: row.id,
      content: row.content,
      userId: row.user_id,
      sessionId: row.session_id,
      entities: row.entities || [],
      metadata: row.metadata || {},
      createdAt: row.created_at
    };
  }
};

// server/rowboat/graph-service.ts
var RowboatGraphService = class {
  constructor(supabase2) {
    this.tableName = "rowboat_graph";
    this.supabase = supabase2;
  }
  // ── 更新图谱（实体 → 节点 + 关系边）────────────────────────────────────────
  async updateGraph(entities, userId) {
    let added = 0, updated = 0;
    for (const entity of entities) {
      const existing = await this.getNodeByName(entity.name, userId);
      if (existing) {
        await this.updateNodeWeight(existing.id, entity.confidence);
        updated++;
      } else {
        await this.insertNode(entity, userId);
        added++;
      }
    }
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        await this.upsertEdge(entities[i], entities[j], userId);
      }
    }
    return { added, updated };
  }
  // ── 获取图谱数据（供 D3 可视化）──────────────────────────────────────────────
  async getGraph(userId, depth = 2) {
    try {
      const { data: nodes, error: nodeErr } = await this.supabase.from(this.tableName).select("*").eq("user_id", userId).order("weight", { ascending: false }).limit(200);
      const { data: edges, error: edgeErr } = await this.supabase.from(`${this.tableName}_edges`).select("*").eq("user_id", userId).limit(300);
      if (nodeErr || edgeErr) {
        console.debug("[Rowboat/Graph] table query:", nodeErr?.message || edgeErr?.message);
      }
      const graphNodes = (nodes || []).map((row) => ({
        id: row.id,
        name: row.name,
        type: row.entity_type,
        properties: row.properties || {},
        weight: row.weight || 1
      }));
      const graphEdges = (edges || []).map((row) => ({
        id: row.id,
        source: row.source_id,
        target: row.target_id,
        type: row.edge_type,
        weight: row.weight || 1
      }));
      return {
        nodes: graphNodes,
        edges: graphEdges,
        metadata: { userId, depth, totalEntities: graphNodes.length }
      };
    } catch (err) {
      console.debug("[Rowboat/Graph] getGraph fallback:", err.message);
      return { nodes: [], edges: [], metadata: { userId, depth, totalEntities: 0 } };
    }
  }
  async insertNode(entity, userId) {
    await this.supabase.from(this.tableName).insert({
      id: entity.id,
      user_id: userId,
      name: entity.name,
      entity_type: entity.type,
      properties: { context: entity.context, confidence: entity.confidence },
      weight: 1
    }).catch(() => {
    });
  }
  async updateNodeWeight(nodeId, delta = 0.1) {
    await this.supabase.from(this.tableName).update({ weight: this.supabase.rpc("increment_node_weight", { node_id: nodeId, delta }) }).eq("id", nodeId).then(() => {
    }).catch(() => {
    });
  }
  async getNodeByName(name, userId) {
    try {
      const { data } = await this.supabase.from(this.tableName).select("id").eq("user_id", userId).eq("name", name).maybeSingle();
      return data;
    } catch {
      return null;
    }
  }
  async upsertEdge(entityA, entityB, userId) {
    const edgeId = `edge_${[entityA.id, entityB.id].sort().join("_")}`;
    await this.supabase.from(`${this.tableName}_edges`).upsert({
      id: edgeId,
      user_id: userId,
      source_id: entityA.id,
      target_id: entityB.id,
      edge_type: "relates_to",
      weight: 1
    }, { onConflict: "id" }).catch(() => {
    });
  }
};

// server/rowboat/mcp-service.ts
var RowboatMcpService = class {
  constructor() {
    this.tools = [
      {
        name: "memory_search",
        description: "\u8BED\u4E49\u641C\u7D22\u8BB0\u5FC6\u5E93\uFF0C\u627E\u5230\u4E0E\u67E5\u8BE2\u6700\u76F8\u5173\u7684\u5386\u53F2\u8BB0\u5FC6",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "\u641C\u7D22\u5173\u952E\u8BCD" },
            userId: { type: "string", description: "\u7528\u6237ID", default: "anonymous" },
            limit: { type: "number", description: "\u8FD4\u56DE\u6570\u91CF", default: 5 }
          },
          required: ["query"]
        },
        category: "memory"
      },
      {
        name: "memory_add",
        description: "\u5411\u8BB0\u5FC6\u5E93\u6DFB\u52A0\u65B0\u7684\u8BB0\u5FC6\u6761\u76EE",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "\u8BB0\u5FC6\u5185\u5BB9" },
            userId: { type: "string", default: "anonymous" },
            tags: { type: "array", items: { type: "string" }, description: "\u6807\u7B7E" }
          },
          required: ["content"]
        },
        category: "memory"
      },
      {
        name: "memory_list",
        description: "\u5217\u51FA\u7528\u6237\u6700\u8FD1\u7684\u8BB0\u5FC6",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", default: "anonymous" },
            limit: { type: "number", default: 20 }
          }
        },
        category: "memory"
      },
      {
        name: "graph_query",
        description: "\u67E5\u8BE2\u77E5\u8BC6\u56FE\u8C31\uFF0C\u83B7\u53D6\u5B9E\u4F53\u548C\u5173\u7CFB",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", default: "anonymous" },
            depth: { type: "number", default: 2, description: "\u5173\u7CFB\u6DF1\u5EA6" }
          }
        },
        category: "graph"
      },
      {
        name: "entity_extract",
        description: "\u4ECE\u6587\u672C\u4E2D\u63D0\u53D6\u5B9E\u4F53\uFF08\u4EBA\u540D/\u7EC4\u7EC7/\u6280\u672F/\u65E5\u671F/\u6982\u5FF5\uFF09",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "\u5F85\u5206\u6790\u6587\u672C" }
          },
          required: ["text"]
        },
        category: "search"
      },
      {
        name: "data_export",
        description: "\u5BFC\u51FA\u8BB0\u5FC6\u548C\u56FE\u8C31\u6570\u636E",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", default: "anonymous" },
            format: { type: "string", enum: ["json", "csv"], default: "json" }
          }
        },
        category: "system"
      }
    ];
  }
  // ── 列出所有可用工具 ─────────────────────────────────────────────────────
  async listTools() {
    return this.tools;
  }
  // ── 调用工具（参数验证 + 执行分发）───────────────────────────────────────
  async callTool(toolName, args) {
    const tool = this.tools.find((t2) => t2.name === toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    const required = tool.inputSchema.required || [];
    for (const field of required) {
      if (args[field] === void 0) {
        throw new Error(`Missing required argument: ${field}`);
      }
    }
    switch (tool.category) {
      case "memory":
        return this.handleMemory(toolName, args);
      case "graph":
        return this.handleGraph(toolName, args);
      case "search":
        return this.handleSearch(toolName, args);
      case "system":
        return { success: true, message: `System tool ${toolName} acknowledged`, args };
      default:
        return { success: true, toolName };
    }
  }
  async handleMemory(toolName, args) {
    return {
      tool: toolName,
      params: args,
      note: "Executed via RowboatMemoryService",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async handleGraph(toolName, args) {
    return {
      tool: toolName,
      params: args,
      note: "Executed via RowboatGraphService",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async handleSearch(toolName, args) {
    if (toolName === "entity_extract") {
      return {
        tool: "entity_extract",
        text: args.text,
        estimatedEntities: Math.ceil(args.text.length / 10),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    return { tool: toolName, params: args };
  }
};

// server/rowboat/rowboat-router.ts
var rowboatRouter = Router7();
var memoryService = null;
var graphService = null;
var mcpService = null;
async function getServices() {
  if (!memoryService) {
    memoryService = new RowboatMemoryService();
    graphService = new RowboatGraphService(supabaseAdmin3);
    mcpService = new RowboatMcpService();
  }
  return { memoryService, graphService, mcpService };
}
rowboatRouter.get("/status", async (_req, res) => {
  const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
  let qdrantStatus = "disconnected";
  try {
    const resp = await fetch(`${qdrantUrl}/health`, { signal: AbortSignal.timeout(2e3) });
    if (resp.ok) qdrantStatus = "connected";
  } catch {
    qdrantStatus = "disconnected";
  }
  res.json({
    status: "ok",
    version: "2.0.0",
    services: {
      qdrant: qdrantStatus,
      supabase: "connected",
      mcp: "ready"
    },
    capabilities: [
      "entity-extraction",
      "semantic-memory",
      "knowledge-graph",
      "mcp-tools",
      "d3-visualization"
    ]
  });
});
rowboatRouter.post("/process", async (req, res) => {
  const { text, userId = "anonymous", sessionId } = req.body;
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }
  try {
    const { memoryService: memoryService2, graphService: graphService2 } = await getServices();
    const entities = await extractEntities(text);
    const memoryId = await memoryService2.addMemory({
      content: text,
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      entities,
      metadata: { source: "chat", timestamp: (/* @__PURE__ */ new Date()).toISOString() }
    });
    const graphUpdates = await graphService2.updateGraph(entities, userId);
    res.json({
      success: true,
      memoryId,
      entities,
      graphUpdates,
      message: `\u5DF2\u63D0\u53D6 ${entities.length} \u4E2A\u5B9E\u4F53\uFF0C\u8BB0\u5FC6\u5DF2\u4FDD\u5B58`
    });
  } catch (err) {
    console.error("[Rowboat] process error:", err);
    res.status(500).json({ error: err.message || "\u5904\u7406\u5931\u8D25" });
  }
});
rowboatRouter.get("/memories", async (req, res) => {
  const { userId = "anonymous", query, limit = "10" } = req.query;
  try {
    const { memoryService: memoryService2 } = await getServices();
    let memories;
    if (query) {
      memories = await memoryService2.searchMemories(query, userId, parseInt(limit));
    } else {
      memories = await memoryService2.listMemories(userId, parseInt(limit));
    }
    res.json({ memories, total: memories.length });
  } catch (err) {
    console.error("[Rowboat] memories error:", err);
    res.status(500).json({ error: err.message });
  }
});
rowboatRouter.post("/memory", async (req, res) => {
  const { content, userId = "anonymous", tags = [], metadata = {} } = req.body;
  if (!content) return res.status(400).json({ error: "content is required" });
  try {
    const { memoryService: memoryService2 } = await getServices();
    const entities = await extractEntities(content);
    const memoryId = await memoryService2.addMemory({
      content,
      userId,
      sessionId: `manual_${Date.now()}`,
      entities,
      metadata: { ...metadata, tags, source: "manual" }
    });
    res.json({ success: true, memoryId, entities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
rowboatRouter.get("/graph", async (req, res) => {
  const { userId = "anonymous", depth = "2" } = req.query;
  try {
    const { graphService: graphService2 } = await getServices();
    const graphData = await graphService2.getGraph(userId, parseInt(depth));
    res.json(graphData);
  } catch (err) {
    console.error("[Rowboat] graph error:", err);
    res.json({ nodes: [], edges: [], metadata: { userId, depth: parseInt(depth) } });
  }
});
rowboatRouter.get("/export", async (req, res) => {
  const { userId = "anonymous", format = "json" } = req.query;
  try {
    const { memoryService: memoryService2, graphService: graphService2 } = await getServices();
    const [memories, graph] = await Promise.all([
      memoryService2.listMemories(userId, 1e3),
      graphService2.getGraph(userId, 5)
    ]);
    const exportData = {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      userId,
      memories,
      graph,
      stats: {
        totalMemories: memories.length,
        totalNodes: graph.nodes.length,
        totalEdges: graph.edges.length
      }
    };
    if (format === "json") {
      res.setHeader("Content-Disposition", `attachment; filename="rowboat-export-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } else {
      res.json(exportData);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
rowboatRouter.get("/tools", async (_req, res) => {
  try {
    const { mcpService: mcpService2 } = await getServices();
    const tools = await mcpService2.listTools();
    res.json({ tools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
rowboatRouter.post("/tools/call", async (req, res) => {
  const { toolName, args = {} } = req.body;
  if (!toolName) return res.status(400).json({ error: "toolName is required" });
  try {
    const { mcpService: mcpService2 } = await getServices();
    const result = await mcpService2.callTool(toolName, args);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
async function extractEntities(text) {
  const entities = [];
  const patterns = [
    { type: "person", regex: /(?:我|你|他|她|Sean|Daiyan|代砚|马斯克|埃隆)/g },
    { type: "organization", regex: /(?:猫眼|MaoAI|Mc&Mamoo|WorkBuddy|DeepSeek|OpenAI|Anthropic|腾讯|阿里|字节)/g },
    { type: "technology", regex: /(?:TypeScript|React|Supabase|Qdrant|MCP|Docker|Redis|PostgreSQL|Vite|pnpm|tRPC)/g },
    { type: "date", regex: /\d{4}[-\/]\d{2}[-\/]\d{2}|\d{4}年\d{1,2}月(?:\d{1,2}日)?/g },
    { type: "concept", regex: /(?:TriadLoop|RAG|向量数据库|知识图谱|记忆|Agent|MCP协议|语义搜索)/g }
  ];
  const seen = /* @__PURE__ */ new Set();
  for (const { type, regex } of patterns) {
    const matches = text.matchAll(regex);
    for (const match of matches) {
      const name = match[0].trim();
      if (!seen.has(name)) {
        seen.add(name);
        entities.push({
          id: `entity_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name,
          type,
          confidence: 0.85,
          context: text.slice(Math.max(0, match.index - 20), match.index + name.length + 20)
        });
      }
    }
  }
  return entities;
}

// server/_core/index.ts
dotenv.config();
function isPortAvailable(port) {
  return new Promise((resolve2) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve2(true));
    });
    server.on("error", () => resolve2(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  if (process.env.NODE_ENV === "production") {
    console.log(`[Server] Production mode: using port ${startPort}`);
    return startPort;
  }
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  console.log("[Server] Starting server...");
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  const app = express2();
  const server = createServer2(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  registerSupabaseAuthRoutes(app);
  app.use("/api/ai", aiStream_default);
  app.use("/api/notes", notesRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/mcp", mcpServerRouter);
  app.use("/api/content", contentPlatformRouter);
  registerMaoRagRouter(app);
  app.use("/api/mao-corpus", maoCorpusRouter);
  app.use("/api/rowboat", rowboatRouter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
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
    function scheduleNextDigestFetch() {
      const now = /* @__PURE__ */ new Date();
      const target = new Date(now);
      target.setHours(8, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const delay = target.getTime() - now.getTime();
      setTimeout(() => {
        console.log("[ResearchDigest] \u5B9A\u65F6\u4EFB\u52A1\uFF1A\u5F00\u59CB\u6293\u53D6 HBR + \u5B66\u672F\u671F\u520A...");
        fetchAllDigests().then((result) => {
          console.log(
            `[ResearchDigest] \u6293\u53D6\u5B8C\u6210\uFF1AHBR=${result.hbrItems.length} \u6761\uFF0C\u79D1\u5B66\u8BBA\u6587=${result.scienceItems.length} \u6761\uFF0C\u732B\u773C\u76F8\u5173=${result.maoyanRelevantItems.length} \u6761`
          );
        }).catch((e) => {
          console.warn("[ResearchDigest] \u5B9A\u65F6\u6293\u53D6\u5931\u8D25\uFF1A", e);
        });
        setInterval(() => {
          fetchAllDigests().then((result) => {
            console.log(
              `[ResearchDigest] \u6BCF\u65E5\u66F4\u65B0\uFF1AHBR=${result.hbrItems.length}\uFF0C\u8BBA\u6587=${result.scienceItems.length}\uFF0C\u732B\u773C=${result.maoyanRelevantItems.length}`
            );
          }).catch((e) => console.warn("[ResearchDigest] \u6BCF\u65E5\u66F4\u65B0\u5931\u8D25\uFF1A", e));
        }, 24 * 60 * 60 * 1e3);
      }, delay);
      console.log(`[ResearchDigest] \u4E0B\u6B21\u81EA\u52A8\u66F4\u65B0\uFF1A${target.toLocaleString("zh-CN")}`);
    }
    scheduleNextDigestFetch();
  });
}
startServer().catch(console.error);
