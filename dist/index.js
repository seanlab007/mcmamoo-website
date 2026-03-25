var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/db.ts
var db_exports = {};
__export(db_exports, {
  clearMessages: () => clearMessages,
  createAiNode: () => createAiNode,
  createConsultingInquiry: () => createConsultingInquiry,
  createContentCopy: () => createContentCopy,
  createConversation: () => createConversation,
  createMessage: () => createMessage,
  createMillenniumClockReservation: () => createMillenniumClockReservation,
  createNodeLog: () => createNodeLog,
  createPaymentOrder: () => createPaymentOrder,
  createRoutingRule: () => createRoutingRule,
  deleteAiNode: () => deleteAiNode,
  deleteAllNodeSkills: () => deleteAllNodeSkills,
  deleteContentCopy: () => deleteContentCopy,
  deleteConversation: () => deleteConversation,
  deleteNodeSkill: () => deleteNodeSkill,
  deleteRoutingRule: () => deleteRoutingRule,
  getAiNodeById: () => getAiNodeById,
  getAiNodes: () => getAiNodes,
  getAllNodeSkills: () => getAllNodeSkills,
  getConsultingInquiries: () => getConsultingInquiries,
  getContentCopies: () => getContentCopies,
  getConversations: () => getConversations,
  getDefaultRoutingRule: () => getDefaultRoutingRule,
  getMessages: () => getMessages,
  getMillenniumClockReservations: () => getMillenniumClockReservations,
  getNodeLogs: () => getNodeLogs,
  getNodeSkills: () => getNodeSkills,
  getNodeStats: () => getNodeStats,
  getPaymentOrders: () => getPaymentOrders,
  getRoutingRules: () => getRoutingRules,
  getTodayUsage: () => getTodayUsage,
  getUserByOpenId: () => getUserByOpenId,
  getUserSubscription: () => getUserSubscription,
  incrementUsage: () => incrementUsage,
  setNodeSkillEnabled: () => setNodeSkillEnabled,
  updateAiNode: () => updateAiNode,
  updateContentCopyStatus: () => updateContentCopyStatus,
  updateConversation: () => updateConversation,
  updateInquiryStatus: () => updateInquiryStatus,
  updateNodePingStatus: () => updateNodePingStatus,
  updatePaymentOrder: () => updatePaymentOrder,
  updateRoutingRule: () => updateRoutingRule,
  upsertNodeSkill: () => upsertNodeSkill,
  upsertSubscription: () => upsertSubscription,
  upsertUser: () => upsertUser
});
function getHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}
async function supabaseGet(table, query) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(`[DB] Supabase not configured, cannot query ${table}`);
    return [];
  }
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: getHeaders()
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed query: ${body}`);
  }
  return resp.json();
}
async function supabaseInsert(table, data) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Database not available");
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed insert: ${body}`);
  }
  const rows = await resp.json();
  return rows[0];
}
async function supabaseUpsert(table, data, onConflict) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(`[DB] Supabase not configured, cannot upsert ${table}`);
    return;
  }
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      Prefer: `resolution=merge-duplicates,return=minimal`
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed upsert: ${body}`);
  }
}
async function supabasePatch(table, filter, data) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(`[DB] Supabase not configured, cannot patch ${table}`);
    return;
  }
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { ...getHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed patch: ${body}`);
  }
}
async function supabaseDelete(table, filter) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(`[DB] Supabase not configured, cannot delete from ${table}`);
    return;
  }
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: { ...getHeaders(), Prefer: "return=minimal" }
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed delete: ${body}`);
  }
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const data = { openId: user.openId };
  if (user.name !== void 0) data.name = user.name ?? null;
  if (user.email !== void 0) data.email = user.email ?? null;
  if (user.loginMethod !== void 0) data.loginMethod = user.loginMethod ?? null;
  if (user.lastSignedIn !== void 0) data.lastSignedIn = user.lastSignedIn instanceof Date ? user.lastSignedIn.toISOString() : user.lastSignedIn;
  if (user.role !== void 0) data.role = user.role;
  if (!data.lastSignedIn) data.lastSignedIn = (/* @__PURE__ */ new Date()).toISOString();
  await supabaseUpsert("users", data, "openId");
}
async function getUserByOpenId(openId) {
  const rows = await supabaseGet("users", `openId=eq.${encodeURIComponent(openId)}&limit=1`);
  return rows.length > 0 ? rows[0] : void 0;
}
async function getConversations(userId) {
  return supabaseGet("conversations", `userId=eq.${userId}&order=updatedAt.desc`);
}
async function createConversation(data) {
  return supabaseInsert("conversations", data);
}
async function updateConversation(id, userId, data) {
  await supabasePatch("conversations", `id=eq.${id}`, { ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
}
async function deleteConversation(id, userId) {
  await supabaseDelete("messages", `conversationId=eq.${id}`);
  await supabaseDelete("conversations", `id=eq.${id}`);
}
async function getMessages(conversationId) {
  return supabaseGet("messages", `conversationId=eq.${conversationId}&order=createdAt.asc`);
}
async function createMessage(data) {
  return supabaseInsert("messages", data);
}
async function clearMessages(conversationId) {
  await supabaseDelete("messages", `conversationId=eq.${conversationId}`);
}
async function getAiNodes(activeOnly = false) {
  const filter = activeOnly ? "isActive=eq.true&order=priority.asc" : "order=priority.asc";
  return supabaseGet("ai_nodes", filter);
}
async function getAiNodeById(id) {
  const rows = await supabaseGet("ai_nodes", `id=eq.${id}&limit=1`);
  return rows[0];
}
async function createAiNode(data) {
  return supabaseInsert("ai_nodes", data);
}
async function updateAiNode(id, data) {
  await supabasePatch("ai_nodes", `id=eq.${id}`, { ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
}
async function deleteAiNode(id) {
  await supabaseDelete("ai_nodes", `id=eq.${id}`);
}
async function updateNodePingStatus(id, isOnline, latencyMs) {
  await supabasePatch("ai_nodes", `id=eq.${id}`, {
    isOnline,
    lastPingAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastPingMs: latencyMs ?? null
  });
}
async function getRoutingRules() {
  return supabaseGet("routing_rules", "order=id.asc");
}
async function getDefaultRoutingRule() {
  const rows = await supabaseGet("routing_rules", "isDefault=eq.true&limit=1");
  return rows[0];
}
async function createRoutingRule(data) {
  return supabaseInsert("routing_rules", data);
}
async function updateRoutingRule(id, data) {
  await supabasePatch("routing_rules", `id=eq.${id}`, { ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
}
async function deleteRoutingRule(id) {
  await supabaseDelete("routing_rules", `id=eq.${id}`);
}
async function createNodeLog(data) {
  try {
    await supabaseInsert("node_logs", data);
  } catch (err) {
    console.error("[DB] Failed to create node log:", err);
  }
}
async function getNodeLogs(limit = 100) {
  return supabaseGet("node_logs", `order=createdAt.desc&limit=${limit}`);
}
async function getNodeStats(nodeId) {
  const logs = await supabaseGet("node_logs", `nodeId=eq.${nodeId}&order=createdAt.desc&limit=1000`);
  const total = logs.length;
  const success = logs.filter((l) => l.status === "success").length;
  const avgLatency = logs.filter((l) => l.latencyMs).reduce((s, l) => s + (l.latencyMs || 0), 0) / (logs.filter((l) => l.latencyMs).length || 1);
  return {
    total,
    success,
    successRate: total > 0 ? (success / total * 100).toFixed(1) : "0",
    avgLatency: Math.round(avgLatency)
  };
}
async function getContentCopies(userId, limit = 100) {
  return supabaseGet("content_copies", `order=createdAt.desc&limit=${limit}`);
}
async function createContentCopy(data) {
  return supabaseInsert("content_copies", data);
}
async function deleteContentCopy(id) {
  await supabaseDelete("content_copies", `id=eq.${id}`);
}
async function updateContentCopyStatus(id, status) {
  await supabasePatch("content_copies", `id=eq.${id}`, { status });
}
async function createMillenniumClockReservation(data) {
  return supabaseInsert("millennium_clock_reservations", {
    ...data,
    status: "pending"
  });
}
async function getMillenniumClockReservations() {
  return supabaseGet("millennium_clock_reservations", "order=createdAt.desc&limit=200");
}
async function getUserSubscription(userId) {
  const rows = await supabaseGet(
    "subscriptions",
    `userId=eq.${userId}&status=eq.active&order=createdAt.desc&limit=1`
  );
  return rows[0] ?? null;
}
async function upsertSubscription(data) {
  const existing = await supabaseGet(
    "subscriptions",
    `userId=eq.${data.userId}&limit=1`
  );
  if (existing.length > 0) {
    await supabasePatch("subscriptions", `userId=eq.${data.userId}`, {
      tier: data.tier,
      status: data.status ?? "active",
      currentPeriodStart: data.currentPeriodStart ?? (/* @__PURE__ */ new Date()).toISOString(),
      currentPeriodEnd: data.currentPeriodEnd ?? null,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } else {
    await supabaseInsert("subscriptions", {
      userId: data.userId,
      tier: data.tier,
      status: data.status ?? "active",
      currentPeriodStart: data.currentPeriodStart ?? (/* @__PURE__ */ new Date()).toISOString(),
      currentPeriodEnd: data.currentPeriodEnd ?? null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
}
async function createPaymentOrder(data) {
  return supabaseInsert("payment_orders", {
    ...data,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function updatePaymentOrder(id, data) {
  await supabasePatch("payment_orders", `id=eq.${id}`, {
    ...data,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function getPaymentOrders(userId) {
  return supabaseGet(
    "payment_orders",
    `userId=eq.${userId}&order=createdAt.desc&limit=50`
  );
}
function todayStr() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function getTodayUsage(userId) {
  const date = todayStr();
  const rows = await supabaseGet(
    "usage_records",
    `userId=eq.${userId}&date=eq.${date}&limit=1`
  );
  return rows[0] ?? { userId, date, chatMessages: 0, imageGenerations: 0 };
}
async function incrementUsage(userId, field) {
  const date = todayStr();
  const existing = await supabaseGet(
    "usage_records",
    `userId=eq.${userId}&date=eq.${date}&limit=1`
  );
  if (existing.length > 0) {
    const current = existing[0][field] ?? 0;
    await supabasePatch("usage_records", `userId=eq.${userId}&date=eq.${date}`, {
      [field]: current + 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } else {
    await supabaseInsert("usage_records", {
      userId,
      date,
      chatMessages: field === "chatMessages" ? 1 : 0,
      imageGenerations: field === "imageGenerations" ? 1 : 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
}
async function createConsultingInquiry(data) {
  return supabaseInsert("consulting_inquiries", {
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone,
    service_interest: data.service,
    budget: data.budget,
    message: data.message,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function getConsultingInquiries() {
  return supabaseGet("consulting_inquiries", "order=created_at.desc&limit=200");
}
async function updateInquiryStatus(id, status, notes) {
  const data = { status, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  if (notes !== void 0) data.notes = notes;
  await supabasePatch("consulting_inquiries", `id=eq.${id}`, data);
}
async function getNodeSkills(nodeId) {
  const rows = await supabaseGet(
    "node_skills",
    `nodeId=eq.${nodeId}&order=category.asc,name.asc`
  );
  return rows;
}
async function getAllNodeSkills() {
  const rows = await supabaseGet(
    "node_skills",
    "order=nodeId.asc,category.asc,name.asc"
  );
  return rows;
}
async function upsertNodeSkill(skill) {
  const data = {
    nodeId: skill.nodeId,
    skillId: skill.skillId,
    name: skill.name,
    version: skill.version ?? "1.0.0",
    description: skill.description ?? "",
    category: skill.category ?? "general",
    triggers: Array.isArray(skill.triggers) ? JSON.stringify(skill.triggers) : skill.triggers ?? "[]",
    isEnabled: skill.isEnabled !== false,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await supabaseUpsert("node_skills", data, "nodeId,skillId");
}
async function deleteNodeSkill(nodeId, skillId) {
  await supabaseDelete("node_skills", `nodeId=eq.${nodeId}&skillId=eq.${encodeURIComponent(skillId)}`);
}
async function deleteAllNodeSkills(nodeId) {
  await supabaseDelete("node_skills", `nodeId=eq.${nodeId}`);
}
async function setNodeSkillEnabled(nodeId, skillId, isEnabled) {
  await supabasePatch("node_skills", `nodeId=eq.${nodeId}&skillId=eq.${encodeURIComponent(skillId)}`, {
    isEnabled,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
var SUPABASE_URL, SUPABASE_KEY;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    SUPABASE_URL = process.env.SUPABASE_URL ?? "";
    SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
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
      ownerEmail: process.env.OWNER_EMAIL ?? "benedictashford20@gmail.com",
      supabaseUrl: process.env.SUPABASE_URL ?? "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      togetherApiKey: process.env.TOGETHER_API_KEY ?? "",
      stableHordeApiKey: process.env.STABLE_HORDE_API_KEY ?? "0000000000",
      tavilyApiKey: process.env.TAVILY_API_KEY ?? "",
      githubToken: process.env.GITHUB_TOKEN ?? ""
    };
  }
});

// server/_core/notification.ts
var notification_exports = {};
__export(notification_exports, {
  notifyOwner: () => notifyOwner
});
import { TRPCError } from "@trpc/server";
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
var TITLE_MAX_LENGTH, CONTENT_MAX_LENGTH, trimValue, isNonEmptyString2, buildEndpointUrl, validatePayload;
var init_notification = __esm({
  "server/_core/notification.ts"() {
    "use strict";
    init_env();
    TITLE_MAX_LENGTH = 1200;
    CONTENT_MAX_LENGTH = 2e4;
    trimValue = (value) => value.trim();
    isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
    buildEndpointUrl = (baseUrl) => {
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      return new URL(
        "webdevtoken.v1.WebDevService/SendNotification",
        normalizedBase
      ).toString();
    };
    validatePayload = (input) => {
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
  }
});

// server/email.ts
var email_exports = {};
__export(email_exports, {
  generateContactAdminHtml: () => generateContactAdminHtml,
  generateContactConfirmationHtml: () => generateContactConfirmationHtml,
  generateNewsletterHtml: () => generateNewsletterHtml,
  sendBulkEmails: () => sendBulkEmails,
  sendEmail: () => sendEmail
});
import nodemailer from "nodemailer";
function encodeHeader(text) {
  return `=?UTF-8?B?${Buffer.from(text).toString("base64")}?=`;
}
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
    const fromName = process.env.SMTP_FROM_NAME || "\u732B\u773C\u589E\u957F\u5F15\u64CE";
    const fromEmail = process.env.SMTP_USER || "";
    await transporter.sendMail({
      from: `${encodeHeader(fromName)} <${fromEmail}>`,
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
  <title>\u611F\u8C22\u60A8\u7684\u54A8\u8BE2\u7533\u8BF7 \u2014 \u732B\u773C\u589E\u957F\u5F15\u64CE</title>
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
      <div class="logo-text">\u732B\u773C\u589E\u957F\u5F15\u64CE</div>
      <div class="logo-sub">MC&MAMOO BRAND MANAGEMENT</div>
    </div>
    <div class="body">
      <div class="greeting">\u5C0A\u656C\u7684 ${name}\uFF0C</div>
      <div class="content">
        <p>\u611F\u8C22\u60A8\u5411\u732B\u773C\u589E\u957F\u5F15\u64CE\u63D0\u4EA4\u54C1\u724C\u6218\u7565\u54A8\u8BE2\u7533\u8BF7\u3002\u6211\u4EEC\u5DF2\u6536\u5230\u60A8\u7684\u4FE1\u606F\uFF0C\u6211\u4EEC\u7684\u9996\u5E2D\u6218\u7565\u4E13\u5BB6\u56E2\u961F\u5C06\u5728 <span class="highlight">1-2\u4E2A\u5DE5\u4F5C\u65E5\u5185</span> \u4E0E\u60A8\u8054\u7CFB\u3002</p>
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
        \u732B\u773C\u589E\u957F\u5F15\u64CE Mc&Mamoo Brand Management Inc.<br/>
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
  <title>\u65B0\u54A8\u8BE2\u7533\u8BF7 \u2014 \u732B\u773C\u589E\u957F\u5F15\u64CE\u540E\u53F0</title>
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
      <div class="logo-text">\u732B\u773C\u589E\u957F\u5F15\u64CE</div>
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
        \u60A8\u6536\u5230\u6B64\u90AE\u4EF6\u662F\u56E0\u4E3A\u60A8\u8BA2\u9605\u4E86\u732B\u773C\u589E\u957F\u5F15\u64CE\u6218\u7565\u7B80\u62A5\u3002<br/>
        \u5982\u9700\u9000\u8BA2\uFF0C\u8BF7\u56DE\u590D\u6B64\u90AE\u4EF6\u5E76\u6CE8\u660E"\u9000\u8BA2"\u3002<br/>
        \xA9 2025 \u732B\u773C\u589E\u957F\u5F15\u64CE Mc&Mamoo Brand Management Inc. \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
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
async function generateImageViaTogetherAI(options) {
  const model = "black-forest-labs/FLUX.1-schnell-Free";
  const body = {
    model,
    prompt: options.prompt,
    width: options.width ?? 1024,
    height: options.height ?? 1024,
    steps: options.steps ?? 4,
    n: 1,
    response_format: "b64_json",
    output_format: "png"
  };
  const response = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.togetherApiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Together AI image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const result = await response.json();
  const item = result.data?.[0];
  if (!item) throw new Error("Together AI returned empty data");
  if (item.b64_json) {
    const buffer = Buffer.from(item.b64_json, "base64");
    const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, "image/png");
    return { url };
  }
  if (item.url) return { url: item.url };
  throw new Error("Together AI returned no image data");
}
async function generateImageViaStableHorde(options) {
  const apiKey = ENV.stableHordeApiKey || "0000000000";
  const submitRes = await fetch("https://stablehorde.net/api/v2/generate/async", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
      "Client-Agent": "MaoAI:1.0:mcmamoo"
    },
    body: JSON.stringify({
      prompt: options.prompt,
      params: {
        width: options.width ?? 512,
        height: options.height ?? 512,
        steps: options.steps ?? 20,
        n: 1,
        sampler_name: "k_euler_a",
        cfg_scale: 7
      },
      models: ["stable_diffusion"],
      r2: true,
      shared: false
    })
  });
  if (!submitRes.ok) {
    const detail = await submitRes.text().catch(() => "");
    throw new Error(`Stable Horde submit failed (${submitRes.status}): ${detail}`);
  }
  const { id: jobId } = await submitRes.json();
  if (!jobId) throw new Error("Stable Horde did not return a job ID");
  const maxAttempts = 36;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5e3));
    const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${jobId}`, {
      headers: { "Client-Agent": "MaoAI:1.0:mcmamoo" }
    });
    if (!checkRes.ok) continue;
    const check = await checkRes.json();
    if (check.faulted) throw new Error("Stable Horde generation faulted");
    if (!check.done) continue;
    const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`, {
      headers: { "Client-Agent": "MaoAI:1.0:mcmamoo" }
    });
    if (!statusRes.ok) throw new Error(`Stable Horde status fetch failed (${statusRes.status})`);
    const status = await statusRes.json();
    const gen = status.generations?.[0];
    if (!gen) throw new Error("Stable Horde returned no generations");
    const imgData = gen.img;
    if (imgData.startsWith("http")) {
      return { url: imgData };
    }
    const buffer = Buffer.from(imgData, "base64");
    const { url } = await storagePut(`generated/${Date.now()}.webp`, buffer, "image/webp");
    return { url };
  }
  throw new Error("Stable Horde generation timed out after 3 minutes");
}
async function generateImageViaForge(options) {
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL("images.v1.ImageService/GenerateImage", baseUrl).toString();
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify({ prompt: options.prompt, original_images: options.originalImages || [] })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Forge image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const result = await response.json();
  const buffer = Buffer.from(result.image.b64Json, "base64");
  const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, result.image.mimeType);
  return { url };
}
async function generateImage(options) {
  if (ENV.togetherApiKey) {
    try {
      return await generateImageViaTogetherAI(options);
    } catch (err) {
      const msg = String(err?.message || "");
      if (msg.includes("credit") || msg.includes("Credit") || msg.includes("billing")) {
        console.warn("[ImageGen] Together AI credit limit, falling back to Stable Horde");
      } else {
        throw err;
      }
    }
  }
  try {
    return await generateImageViaStableHorde(options);
  } catch (err) {
    console.warn("[ImageGen] Stable Horde failed:", err?.message);
  }
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    return generateImageViaForge(options);
  }
  throw new Error(
    "\u56FE\u50CF\u751F\u6210\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002\u5982\u9700\u63D0\u5347\u7A33\u5B9A\u6027\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u914D\u7F6E TOGETHER_API_KEY\u3002"
  );
}
var init_imageGeneration = __esm({
  "server/_core/imageGeneration.ts"() {
    "use strict";
    init_storage();
    init_env();
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
      return { success: true };
    })
  }),
  ai: router({
    models: publicProcedure.query(
      () => Object.entries(MODEL_CONFIGS).map(([id, cfg]) => ({ id, name: cfg.name, badge: cfg.badge, available: !!cfg.apiKey }))
    ),
    presets: publicProcedure.query(() => SYSTEM_PRESETS),
    status: publicProcedure.query(async () => {
      const results = {};
      for (const [id, cfg] of Object.entries(MODEL_CONFIGS)) results[id] = !!cfg.apiKey;
      return results;
    })
  }),
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => getConversations(ctx.user.id)),
    create: protectedProcedure.input(z2.object({ title: z2.string().optional(), model: z2.string().optional(), systemPrompt: z2.string().optional() })).mutation(async ({ ctx, input }) => createConversation({ userId: ctx.user.id, title: input.title || "\u65B0\u5BF9\u8BDD", model: input.model || "deepseek-chat", systemPrompt: input.systemPrompt || SYSTEM_PRESETS[0].prompt })),
    update: protectedProcedure.input(z2.object({ id: z2.number(), title: z2.string().optional(), model: z2.string().optional(), systemPrompt: z2.string().optional() })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateConversation(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteConversation(input.id, ctx.user.id);
      return { success: true };
    })
  }),
  messages: router({
    list: protectedProcedure.input(z2.object({ conversationId: z2.number() })).query(async ({ input }) => getMessages(input.conversationId)),
    clear: protectedProcedure.input(z2.object({ conversationId: z2.number() })).mutation(async ({ input }) => {
      await clearMessages(input.conversationId);
      return { success: true };
    }),
    save: protectedProcedure.input(z2.object({ conversationId: z2.number(), role: z2.enum(["user", "assistant", "system"]), content: z2.string(), model: z2.string().optional() })).mutation(async ({ input }) => createMessage({ conversationId: input.conversationId, role: input.role, content: input.content, model: input.model }))
  }),
  // ─── Admin: AI Nodes ─────────────────────────────────────────────────────────
  nodes: router({
    list: adminProcedure2.query(async () => getAiNodes()),
    create: adminProcedure2.input(z2.object({
      name: z2.string().min(1),
      type: z2.enum(["claude_api", "openai_compat", "openmanus", "openclaw", "workbuddy", "custom"]),
      baseUrl: z2.string().url(),
      apiKey: z2.string().optional(),
      modelId: z2.string().optional(),
      isPaid: z2.boolean().optional(),
      isLocal: z2.boolean().optional(),
      priority: z2.number().optional(),
      description: z2.string().optional()
    })).mutation(async ({ input }) => createAiNode({
      name: input.name,
      type: input.type,
      baseUrl: input.baseUrl,
      apiKey: input.apiKey || "",
      modelId: input.modelId || "",
      isPaid: input.isPaid ?? false,
      isLocal: input.isLocal ?? false,
      priority: input.priority ?? 100,
      isActive: true,
      isOnline: false,
      description: input.description || ""
    })),
    update: adminProcedure2.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      type: z2.enum(["claude_api", "openai_compat", "openmanus", "openclaw", "workbuddy", "custom"]).optional(),
      baseUrl: z2.string().optional(),
      apiKey: z2.string().optional(),
      modelId: z2.string().optional(),
      isPaid: z2.boolean().optional(),
      isLocal: z2.boolean().optional(),
      priority: z2.number().optional(),
      isActive: z2.boolean().optional(),
      description: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAiNode(id, data);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteAiNode(input.id);
      return { success: true };
    }),
    ping: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const node = await getAiNodeById(input.id);
      if (!node) throw new TRPCError3({ code: "NOT_FOUND" });
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8e3);
        const res = await fetch(`${node.baseUrl}/models`, {
          headers: node.apiKey ? { Authorization: `Bearer ${node.apiKey}` } : {},
          signal: controller.signal
        });
        clearTimeout(timeout);
        const latency = Date.now() - start;
        const online = res.status < 500;
        await updateNodePingStatus(node.id, online, latency);
        return { online, latency };
      } catch {
        await updateNodePingStatus(node.id, false);
        return { online: false, latency: null };
      }
    }),
    stats: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => getNodeStats(input.id)),
    getSkills: adminProcedure2.input(z2.object({ nodeId: z2.number() })).query(async ({ input }) => {
      const skills = await getNodeSkills(input.nodeId);
      return { skills };
    }),
    toggleSkill: adminProcedure2.input(z2.object({ nodeId: z2.number(), skillId: z2.string(), isEnabled: z2.boolean() })).mutation(async ({ input }) => {
      await setNodeSkillEnabled(input.nodeId, input.skillId, input.isEnabled);
      return { success: true };
    })
  }),
  // ─── Admin: Routing Rules ────────────────────────────────────────────────────
  routing: router({
    list: adminProcedure2.query(async () => getRoutingRules()),
    create: adminProcedure2.input(z2.object({
      name: z2.string().min(1),
      mode: z2.enum(["paid", "free", "auto", "manual"]),
      nodeIds: z2.string(),
      failover: z2.boolean().optional(),
      loadBalance: z2.enum(["priority", "round_robin", "least_latency"]).optional(),
      isDefault: z2.boolean().optional()
    })).mutation(async ({ input }) => createRoutingRule({
      name: input.name,
      mode: input.mode,
      nodeIds: input.nodeIds,
      failover: input.failover ?? true,
      loadBalance: input.loadBalance ?? "priority",
      isDefault: input.isDefault ?? false,
      isActive: true
    })),
    update: adminProcedure2.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      mode: z2.enum(["paid", "free", "auto", "manual"]).optional(),
      nodeIds: z2.string().optional(),
      failover: z2.boolean().optional(),
      loadBalance: z2.enum(["priority", "round_robin", "least_latency"]).optional(),
      isDefault: z2.boolean().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateRoutingRule(id, data);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteRoutingRule(input.id);
      return { success: true };
    })
  }),
  // ─── Admin: Logs ───────────────────────────────────────────────────────────────────────────
  logs: router({
    list: adminProcedure2.input(z2.object({ limit: z2.number().optional() })).query(async ({ input }) => getNodeLogs(input.limit ?? 100))
  }),
  // ─── Platform: 猜眼内容平台 ───────────────────────────────────────────────────────────────────
  platform: router({
    // 获取文案库
    listCopies: adminProcedure2.input(z2.object({ limit: z2.number().optional() })).query(async ({ input }) => getContentCopies(void 0, input.limit ?? 100)),
    // 删除文案
    deleteCopy: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteContentCopy(input.id);
      return { success: true };
    }),
    // 更新文案状态
    updateCopyStatus: adminProcedure2.input(z2.object({ id: z2.number(), status: z2.enum(["draft", "approved", "published"]) })).mutation(async ({ input }) => {
      await updateContentCopyStatus(input.id, input.status);
      return { success: true };
    }),
    // AI 文案生成（流式）— 返回完整文案并保存到库
    generateCopy: adminProcedure2.input(z2.object({
      brand: z2.string().min(1),
      platform: z2.string().min(1),
      contentType: z2.string().min(1),
      style: z2.string().min(1),
      keywords: z2.array(z2.string()).optional(),
      language: z2.enum(["zh", "en", "fr"]).optional(),
      save: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const lang = input.language || "zh";
      const kwStr = input.keywords?.join("\u3001") || "";
      const systemPrompt = lang === "fr" ? `Tu es un expert en marketing de luxe pour la maison de parfum LA CELLE PARIS 1802. Tu cr\xE9es des contenus marketing \xE9l\xE9gants, \xE9motionnels et persuasifs pour les r\xE9seaux sociaux.` : lang === "en" ? `You are a luxury fragrance marketing expert for LA CELLE PARIS 1802, a prestigious French perfume house founded in 1802. Create compelling, elegant, and emotionally resonant marketing content for social media.` : `\u4F60\u662F\u6CD5\u56FD\u5948\u5C0A\u9999\u6C34\u4E16\u5BB6 LA CELLE PARIS 1802 \u7684\u9AD8\u7EA7\u5E02\u573A\u8425\u9500\u4E13\u5BB6\u3002\u8BF7\u4E3A\u8BE5\u54C1\u724C\u521B\u4F5C\u5177\u6709\u6CD5\u5F0F\u5948\u5C0A\u6C14\u8D28\u3001\u60C5\u611F\u5171\u9E23\u548C\u5E26\u8D27\u8F6C\u5316\u529B\u7684\u793E\u4EA4\u5A92\u4F53\u8425\u9500\u5185\u5BB9\u3002\u54C1\u724C\u521B\u7ACB\u4E8E1802\u5E74\uFF0C\u62E5\u6709\u62FF\u7834\u4ED1\u7687\u5E1D\u7684\u7686\u5BA4\u8BA4\u53EF\u3002`;
      const userPrompt = lang === "fr" ? `Cr\xE9e un contenu ${input.contentType} pour ${input.platform} sur la marque "${input.brand}" avec le style "${input.style}"${kwStr ? `. Mots-cl\xE9s: ${kwStr}` : ""}.

Structure requise:
1. Titre accrocheur (2-3 options)
2. Corps du texte (300-500 mots)
3. Hashtags pertinents (10-15)
4. Call-to-action
5. Note sur le meilleur moment de publication` : lang === "en" ? `Create a ${input.contentType} for ${input.platform} about "${input.brand}" in "${input.style}" style${kwStr ? `. Keywords: ${kwStr}` : ""}.

Required structure:
1. Catchy title (2-3 options)
2. Main body (300-500 words)
3. Relevant hashtags (10-15)
4. Call-to-action
5. Best posting time suggestion` : `\u4E3A\u300C${input.brand}\u300D\u521B\u4F5C\u4E00\u7BC7${input.platform}\u5E73\u53F0\u7684${input.contentType}\uFF0C\u98CE\u683C\u4E3A\u300C${input.style}\u300D${kwStr ? `\uFF0C\u5173\u952E\u8BCD\uFF1A${kwStr}` : ""}.

\u8BF7\u6309\u4EE5\u4E0B\u7ED3\u6784\u8F93\u51FA\uFF1A
1. \u7206\u6B3E\u6807\u9898\uFF082-3\u4E2A\u9009\u9879\uFF09
2. \u6B63\u6587\u5185\u5BB9\uFF08300-500\u5B57\uFF0C\u5305\u542B\u60C5\u611F\u5F00\u5934\u3001\u4EA7\u54C1\u4ECB\u7ECD\u3001\u4F7F\u7528\u573A\u666F\u3001\u5C01\u5C3E\u53F7\u53EC\uFF09
3. \u8BDD\u9898\u6807\u7B7E\uFF0810-15\u4E2A\uFF09
4. \u5F15\u6D41\u884C\u52A8\u53F7\u53EC\uFF08CTA\uFF09
5. \u6700\u4F73\u53D1\u5E03\u65F6\u95F4\u5EFA\u8BAE`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : Array.isArray(rawContent) ? rawContent.map((c) => c.text || "").join("") : "";
      let saved = null;
      if (input.save !== false) {
        saved = await createContentCopy({
          userId: ctx.user.id,
          brand: input.brand,
          platform: input.platform,
          contentType: input.contentType,
          style: input.style,
          keywords: JSON.stringify(input.keywords || []),
          content,
          status: "draft"
        });
      }
      return { content, saved };
    }),
    // 批量生成 la-celle1802.com 推广文案
    batchGenerate: adminProcedure2.input(z2.object({
      platforms: z2.array(z2.string()).min(1),
      language: z2.enum(["zh", "en", "fr", "all"]).optional()
    })).mutation(async ({ ctx }) => {
      const tasks = [
        { brand: "LA CELLE PARIS 1802", platform: "\u5C0F\u7EA2\u4E66", contentType: "\u56FE\u6587\u7B14\u8BB0", style: "\u60C5\u7EEA\u5171\u9E23", keywords: ["\u6CD5\u5F0F\u5948\u5C0A", "\u7687\u5BA4\u9999\u6C34", "1802", "\u5386\u53F2\u4F20\u627F"], language: "zh" },
        { brand: "LA CELLE PARIS 1802", platform: "\u5C0F\u7EA2\u4E66", contentType: "\u79CD\u8349\u957F\u6587", style: "\u573A\u666F\u5316\u63CF\u5199", keywords: ["\u5DF4\u9ECE\u5948\u5C0A", "\u4EF7\u5503\u9999\u6C34", "\u9999\u6C34\u6D4B\u8BC4"], language: "zh" },
        { brand: "LA CELLE PARIS 1802", platform: "Instagram", contentType: "Caption", style: "Luxury Storytelling", keywords: ["French perfume", "heritage", "Napoleon", "luxury"], language: "en" },
        { brand: "LA CELLE PARIS 1802", platform: "Instagram", contentType: "Story Script", style: "Behind the Scenes", keywords: ["Grasse", "artisan", "fragrance", "1802"], language: "en" },
        { brand: "LA CELLE PARIS 1802", platform: "X (Twitter)", contentType: "Thread", style: "Historical Facts", keywords: ["Napoleon", "Josephine", "Paris 1802", "luxury perfume"], language: "en" },
        { brand: "LA CELLE PARIS 1802", platform: "\u5FAE\u4FE1\u670B\u53CB\u5708", contentType: "\u79CD\u8349\u6587", style: "\u9AD8\u7AEF\u793C\u54C1\u63A8\u8350", keywords: ["\u6CD5\u5F0F\u9999\u6C34", "\u9AD8\u7AEF\u793C\u54C1", "\u5948\u5C0A\u5C40"], language: "zh" }
      ];
      const results = [];
      for (const task of tasks) {
        try {
          const lang = task.language;
          const kwStr = task.keywords.join("\u3001");
          const systemPrompt = lang === "en" ? `You are a luxury fragrance marketing expert for LA CELLE PARIS 1802. Website: la-celle1802.com` : `\u4F60\u662F LA CELLE PARIS 1802 \u7684\u9AD8\u7EA7\u5E02\u573A\u8425\u9500\u4E13\u5BB6\u3002\u5B98\u7F51: la-celle1802.com`;
          const userPrompt = lang === "en" ? `Create a ${task.contentType} for ${task.platform} about "${task.brand}" in "${task.style}" style. Keywords: ${kwStr}. Include website la-celle1802.com naturally.` : `\u4E3A\u300C${task.brand}\u300D\u521B\u4F5C${task.platform}\u5E73\u53F0${task.contentType}\uFF0C\u98CE\u683C\uFF1A${task.style}\uFF0C\u5173\u952E\u8BCD\uFF1A${kwStr}\u3002\u8BF7\u81EA\u7136\u5730\u5D4C\u5165\u5B98\u7F51 la-celle1802.com\u3002`;
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ]
          });
          const rawContent2 = response.choices[0]?.message?.content;
          const content = typeof rawContent2 === "string" ? rawContent2 : Array.isArray(rawContent2) ? rawContent2.map((c) => c.text || "").join("") : "";
          const saved = await createContentCopy({
            userId: ctx.user.id,
            brand: task.brand,
            platform: task.platform,
            contentType: task.contentType,
            style: task.style,
            keywords: JSON.stringify(task.keywords),
            content,
            status: "draft"
          });
          results.push({ platform: task.platform, contentType: task.contentType, id: saved?.id, success: true });
        } catch (e) {
          results.push({ platform: task.platform, contentType: task.contentType, success: false, error: String(e) });
        }
      }
      return { results, total: results.length, success: results.filter((r) => r.success).length };
    }),
    // 定时发布：设置发布时间
    scheduleCopy: adminProcedure2.input(z2.object({
      id: z2.number(),
      scheduledAt: z2.number().nullable()
      // UTC timestamp ms, null = clear
    })).mutation(async ({ input }) => {
      const { updateContentCopyStatus: updateContentCopyStatus2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await updateContentCopyStatus2(input.id, input.scheduledAt ? "approved" : "draft");
      return { ok: true };
    }),
    // 获取待发布文案（scheduledAt 已设置）
    getScheduled: adminProcedure2.query(async () => {
      const { getContentCopies: getContentCopies2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return getContentCopies2();
    })
  }),
  // ─── Mao 和询表单 & 订阅路由 ───────────────────────────────────────────────────
  mao: router({
    // 公开：提交和询申请
    submitApplication: publicProcedure.input(z2.object({
      name: z2.string().min(1),
      organization: z2.string().min(1),
      consultType: z2.string().min(1),
      description: z2.string().optional()
    })).mutation(async ({ input }) => {
      const SUPABASE_URL3 = process.env.SUPABASE_URL ?? "";
      const SUPABASE_KEY2 = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
      if (!SUPABASE_URL3 || !SUPABASE_KEY2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const resp = await fetch(`${SUPABASE_URL3}/rest/v1/mao_applications`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY2, Authorization: `Bearer ${SUPABASE_KEY2}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ name: input.name, organization: input.organization, consult_type: input.consultType, description: input.description, status: "pending" })
      });
      if (!resp.ok) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u63D0\u4EA4\u5931\u8D25" });
      return { success: true };
    }),
    // 公开：订阅战略简报
    subscribeBrief: publicProcedure.input(z2.object({ email: z2.string().email() })).mutation(async ({ input }) => {
      const SUPABASE_URL3 = process.env.SUPABASE_URL ?? "";
      const SUPABASE_KEY2 = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
      if (!SUPABASE_URL3 || !SUPABASE_KEY2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const resp = await fetch(`${SUPABASE_URL3}/rest/v1/brief_subscribers`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY2, Authorization: `Bearer ${SUPABASE_KEY2}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ email: input.email })
      });
      if (!resp.ok) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u8BA2\u9605\u5931\u8D25" });
      return { success: true };
    }),
    // 管理员：获取和询列表
    listApplications: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE" });
      const SUPABASE_URL3 = process.env.SUPABASE_URL ?? "";
      const SUPABASE_KEY2 = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
      if (!SUPABASE_URL3 || !SUPABASE_KEY2) return [];
      const resp = await fetch(`${SUPABASE_URL3}/rest/v1/mao_applications?order=created_at.desc&limit=100`, {
        headers: { apikey: SUPABASE_KEY2, Authorization: `Bearer ${SUPABASE_KEY2}` }
      });
      if (!resp.ok) return [];
      return resp.json();
    }),
    // 管理员：获取订阅者列表
    listSubscribers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE" });
      const SUPABASE_URL3 = process.env.SUPABASE_URL ?? "";
      const SUPABASE_KEY2 = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
      if (!SUPABASE_URL3 || !SUPABASE_KEY2) return [];
      const resp = await fetch(`${SUPABASE_URL3}/rest/v1/brief_subscribers?order=created_at.desc&limit=500`, {
        headers: { apikey: SUPABASE_KEY2, Authorization: `Bearer ${SUPABASE_KEY2}` }
      });
      if (!resp.ok) return [];
      return resp.json();
    }),
    // 管理员：更新和询状态
    updateApplicationStatus: protectedProcedure.input(z2.object({ id: z2.number(), status: z2.enum(["pending", "reviewing", "approved", "rejected"]) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
      const SUPABASE_URL3 = process.env.SUPABASE_URL ?? "";
      const SUPABASE_KEY2 = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
      if (!SUPABASE_URL3 || !SUPABASE_KEY2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const resp = await fetch(`${SUPABASE_URL3}/rest/v1/mao_applications?id=eq.${input.id}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY2, Authorization: `Bearer ${SUPABASE_KEY2}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ status: input.status })
      });
      if (!resp.ok) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u66F4\u65B0\u5931\u8D25" });
      return { success: true };
    })
  }),
  // ─── Billing & Subscriptions ──────────────────────────────────────────────────
  billing: router({
    // Get plan definitions (public)
    plans: publicProcedure.query(() => ({
      limits: PLAN_LIMITS,
      prices: PLAN_PRICES,
      meta: PLAN_META,
      features: FEATURE_ROWS,
      providers: PAYMENT_PROVIDERS
    })),
    // Get current user's subscription and today's usage
    mySubscription: protectedProcedure.query(async ({ ctx }) => {
      const sub = await getUserSubscription(ctx.user.id);
      const usage = await getTodayUsage(ctx.user.id);
      const rawTier = sub?.tier ?? "free";
      const tierMap = {
        free: "free",
        starter: "starter",
        pro: "pro",
        max: "flagship",
        flagship: "flagship"
      };
      const tier = tierMap[rawTier] ?? "starter";
      const FREE_LIMITS = {
        dailyChatMessages: 20,
        dailyImageGenerations: 0,
        maxConversations: 10,
        premiumModels: false,
        imageGeneration: false,
        priorityQueue: false,
        fileUpload: false,
        brandStrategy: false,
        accountManager: false,
        customPersona: false,
        apiAccess: false,
        teamSeats: 1
      };
      const limits = rawTier === "free" ? FREE_LIMITS : PLAN_LIMITS[tier];
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
init_db();
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// server/tools.ts
import { exec } from "child_process";
import { promisify } from "util";
import * as fs3 from "fs/promises";
import * as path3 from "path";
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
async function executeTool(toolName, args, isAdmin = false) {
  try {
    switch (toolName) {
      case "web_search":
        return await toolWebSearch(args.query, args.max_results || 5);
      case "run_code":
        return await toolRunCode(args.language, args.code, args.timeout || 30);
      case "github_push":
        return await toolGithubPush(args.repo, args.files, args.message, args.branch || "main");
      case "github_read":
        return await toolGithubRead(args.repo, args.file_path, args.branch || "main");
      case "read_url":
        return await toolReadUrl(args.url, args.extract_text_only !== false);
      case "run_shell":
        if (!isAdmin) return { success: false, output: "", error: "run_shell \u4EC5\u7BA1\u7406\u5458\u53EF\u7528" };
        return await toolRunShell(args.command, args.cwd || "/tmp");
      default:
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
  const tmpDir = await fs3.mkdtemp(path3.join(os.tmpdir(), "maoai-code-"));
  try {
    let filePath;
    let cmd;
    if (language === "python") {
      filePath = path3.join(tmpDir, "script.py");
      await fs3.writeFile(filePath, code, "utf8");
      cmd = `timeout ${safeTimeout} python3 "${filePath}" 2>&1`;
    } else if (language === "javascript") {
      filePath = path3.join(tmpDir, "script.js");
      await fs3.writeFile(filePath, code, "utf8");
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
    await fs3.rm(tmpDir, { recursive: true, force: true }).catch(() => {
    });
  }
}
async function toolGithubPush(repo, files, message, branch) {
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
  return {
    success: allOk,
    output: `GitHub \u63A8\u9001\u7ED3\u679C\uFF08${repo}@${branch}\uFF09:
${results.join("\n")}

Commit: "${message}"`,
    metadata: { repo, branch, fileCount: files.length }
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

// server/aiStream.ts
var aiStreamRouter = Router();
async function getAdminUser(req) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user && user.role === "admin") return user;
    return null;
  } catch {
    return null;
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
  const { enableTools = true } = req.body;
  const adminUser = await getAdminUser(req);
  const toolDefs = enableTools ? adminUser ? ADMIN_TOOL_DEFINITIONS : TOOL_DEFINITIONS : [];
  const supportsTools = enableTools && !hasImage && toolDefs.length > 0 && (model === "deepseek-chat" || model === "glm-4-plus" || model === "glm-4-flash");
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
        conversationMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result.success ? result.output.slice(0, 8e3) : `\u5DE5\u5177\u6267\u884C\u5931\u8D25: ${result.error}`
        });
      }
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
      const nodes = await getAiNodes();
      localModels = nodes.filter((n) => n.isLocal && n.isOnline).map((n) => ({
        id: `local:${n.id}`,
        object: "model",
        created: 17e8,
        owned_by: "local",
        display_name: n.name,
        badge: "\u{1F5A5}\uFE0F",
        is_local: true,
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
  } catch (error) {
    console.error("[aiNodes] register error:", error);
    res.status(500).json({ success: false, error: String(error) });
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
    await new Promise((resolve, reject) => {
      upload.single("file")(req, res, (err) => {
        if (err) reject(err);
        else resolve();
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
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        extractedText = result.text?.trim() || "";
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
aiStreamRouter.get("/status", async (_req, res) => {
  const status = {};
  for (const [id, cfg] of Object.entries(MODEL_CONFIGS)) {
    status[id] = { name: cfg.name, configured: !!cfg.apiKey, badge: cfg.badge };
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
