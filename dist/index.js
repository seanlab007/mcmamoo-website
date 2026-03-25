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
import { webcrypto } from "node:crypto";
import cors from "cors";
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

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isIpAddress(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getRootDomain(hostname) {
  if (!hostname || LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return void 0;
  }
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join(".")}`;
  }
  return void 0;
}
function getSessionCookieOptions(req) {
  const hostname = req.hostname;
  const domain = getRootDomain(hostname);
  return {
    domain,
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
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : void 0;
    const tokenToVerify = sessionCookie || bearerToken;
    const session = await this.verifySession(tokenToVerify);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    const supabaseUrl = ENV.supabaseUrl;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ENV.supabaseAnonKey;
    let user = null;
    if (supabaseUrl && supabaseKey) {
      try {
        const resp = await fetch(
          `${supabaseUrl}/rest/v1/users?openId=eq.${encodeURIComponent(sessionUserId)}&limit=1`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json"
            }
          }
        );
        if (resp.ok) {
          const rows = await resp.json();
          if (rows.length > 0) {
            user = rows[0];
          }
        } else {
          console.error("[Auth] Supabase REST lookup failed:", resp.status, await resp.text());
        }
      } catch (err) {
        console.error("[Auth] Supabase REST error:", err);
      }
    } else {
      user = await getUserByOpenId(sessionUserId);
    }
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? bearerToken ?? "");
        if (supabaseUrl && supabaseKey) {
          await fetch(`${supabaseUrl}/rest/v1/users`, {
            method: "POST",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates,return=minimal"
            },
            body: JSON.stringify({
              openId: userInfo.openId,
              name: userInfo.name || null,
              email: userInfo.email ?? null,
              loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
              lastSignedIn: signedInAt.toISOString()
            })
          });
          const resp2 = await fetch(
            `${supabaseUrl}/rest/v1/users?openId=eq.${encodeURIComponent(userInfo.openId)}&limit=1`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`
              }
            }
          );
          if (resp2.ok) {
            const rows2 = await resp2.json();
            if (rows2.length > 0) user = rows2[0];
          }
        } else {
          await upsertUser({
            openId: userInfo.openId,
            name: userInfo.name || null,
            email: userInfo.email ?? null,
            loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
            lastSignedIn: signedInAt
          });
          user = await getUserByOpenId(userInfo.openId);
        }
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    if (supabaseUrl && supabaseKey) {
      fetch(`${supabaseUrl}/rest/v1/users?openId=eq.${encodeURIComponent(sessionUserId)}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ lastSignedIn: signedInAt.toISOString() })
      }).catch((err) => console.error("[Auth] Failed to update lastSignedIn:", err));
    } else {
      await upsertUser({
        openId: user.openId,
        lastSignedIn: signedInAt
      });
    }
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

// server/_core/supabaseAuth.ts
var SUPABASE_URL2 = process.env.SUPABASE_URL ?? "";
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";
function getApiKey() {
  return SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
}
async function getUserByOpenId2(openId) {
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL2}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}&limit=1`,
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
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL2}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`,
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
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL2}/rest/v1/users?id=eq.${id}`,
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
  const key = getApiKey();
  const resp = await fetch(
    `${SUPABASE_URL2}/rest/v1/users`,
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
  app.post("/api/auth/email-login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    if (!SUPABASE_URL2 || !SUPABASE_ANON_KEY) {
      res.status(500).json({ error: "Supabase not configured" });
      return;
    }
    try {
      const authResp = await fetch(
        `${SUPABASE_URL2}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY
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
      let existingUser = await getUserByOpenId2(openId);
      let role = "user";
      if (!existingUser) {
        const userByEmail = await getUserByEmail(userEmail);
        if (userByEmail) {
          const userId = userByEmail.id;
          await updateUserOpenId(userId, openId, now);
          role = userByEmail.role ?? "user";
          existingUser = { ...userByEmail, openId };
        } else {
          const ownerEmail = process.env.OWNER_EMAIL ?? "benedictashford20@gmail.com";
          if (userEmail === ownerEmail) {
            role = "admin";
          }
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
        role = existingUser.role ?? "user";
        const key = getApiKey();
        await fetch(
          `${SUPABASE_URL2}/rest/v1/users?openId=eq.${encodeURIComponent(openId)}`,
          {
            method: "PATCH",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ lastSignedIn: now })
          }
        );
      }
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userEmail.split("@")[0],
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        success: true,
        role,
        redirectTo: role === "admin" ? "/admin/nodes" : "/maoai",
        sessionToken
        // 供前端存入 localStorage，用于跨域 Authorization header
      });
    } catch (error) {
      console.error("[SupabaseAuth] Email login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/_core/systemRouter.ts
init_notification();
import { z } from "zod";

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

// shared/plans.ts
var PLAN_LIMITS = {
  starter: {
    dailyChatMessages: 100,
    dailyImageGenerations: 5,
    maxConversations: 50,
    premiumModels: false,
    imageGeneration: true,
    priorityQueue: false,
    fileUpload: false,
    brandStrategy: false,
    accountManager: false,
    customPersona: false,
    apiAccess: false,
    teamSeats: 1
  },
  pro: {
    dailyChatMessages: 1e3,
    dailyImageGenerations: 100,
    maxConversations: -1,
    premiumModels: true,
    imageGeneration: true,
    priorityQueue: true,
    fileUpload: true,
    brandStrategy: false,
    accountManager: false,
    customPersona: true,
    apiAccess: true,
    teamSeats: 3
  },
  flagship: {
    dailyChatMessages: -1,
    dailyImageGenerations: -1,
    maxConversations: -1,
    premiumModels: true,
    imageGeneration: true,
    priorityQueue: true,
    fileUpload: true,
    brandStrategy: true,
    accountManager: true,
    customPersona: true,
    apiAccess: true,
    teamSeats: 10
  }
};
var PLAN_PRICES = {
  // ── 入门版 ──────────────────────────────────────────────────────────────────
  starter: {
    CNY: {
      monthly: { total: 99, perMonth: 99, months: 1, savingPct: 0 },
      biannual: { total: 560, perMonth: 93, months: 6, savingPct: 6, anchorLabel: { zh: "\u7701 \xA534", en: "Save \xA534" } },
      annual: { total: 980, perMonth: 82, months: 12, savingPct: 17, anchorLabel: { zh: "\u7701 \xA5208", en: "Save \xA5208" } },
      lifetime: { total: 3980, perMonth: 0, months: 0, savingPct: 0, anchorLabel: { zh: "\u4E00\u6B21\u4E70\u65AD", en: "One-time" } }
    },
    USD: {
      monthly: { total: 13.99, perMonth: 13.99, months: 1, savingPct: 0 },
      biannual: { total: 79.99, perMonth: 13.33, months: 6, savingPct: 5, anchorLabel: { zh: "Save $4", en: "Save $4" } },
      annual: { total: 139.99, perMonth: 11.67, months: 12, savingPct: 17, anchorLabel: { zh: "Save $28", en: "Save $28" } },
      lifetime: { total: 549.99, perMonth: 0, months: 0, savingPct: 0, anchorLabel: { zh: "One-time", en: "One-time" } }
    }
  },
  // ── 专业版 ──────────────────────────────────────────────────────────────────
  pro: {
    CNY: {
      monthly: { total: 398, perMonth: 398, months: 1, savingPct: 0 },
      biannual: { total: 2280, perMonth: 380, months: 6, savingPct: 5, anchorLabel: { zh: "\u7701 \xA5108", en: "Save \xA5108" } },
      annual: { total: 3980, perMonth: 332, months: 12, savingPct: 17, anchorLabel: { zh: "\u7701 \xA5796", en: "Save \xA5796" } },
      lifetime: { total: 15800, perMonth: 0, months: 0, savingPct: 0, anchorLabel: { zh: "\u4E00\u6B21\u4E70\u65AD", en: "One-time" } }
    },
    USD: {
      monthly: { total: 54.99, perMonth: 54.99, months: 1, savingPct: 0 },
      biannual: { total: 319.99, perMonth: 53.33, months: 6, savingPct: 3, anchorLabel: { zh: "Save $10", en: "Save $10" } },
      annual: { total: 549.99, perMonth: 45.83, months: 12, savingPct: 17, anchorLabel: { zh: "Save $110", en: "Save $110" } },
      lifetime: { total: 2199.99, perMonth: 0, months: 0, savingPct: 0, anchorLabel: { zh: "One-time", en: "One-time" } }
    }
  },
  // ── 品牌全案旗舰版 ──────────────────────────────────────────────────────────
  flagship: {
    CNY: {
      monthly: { total: 998, perMonth: 998, months: 1, savingPct: 0 },
      biannual: { total: 5680, perMonth: 947, months: 6, savingPct: 5, anchorLabel: { zh: "\u7701 \xA5308", en: "Save \xA5308" } },
      annual: { total: 9980, perMonth: 832, months: 12, savingPct: 17, anchorLabel: { zh: "\u7701 \xA51996", en: "Save \xA51996" } },
      lifetime: { total: 39800, perMonth: 0, months: 0, savingPct: 0, anchorLabel: { zh: "\u4E00\u6B21\u4E70\u65AD", en: "One-time" } }
    },
    USD: {
      monthly: { total: 138.99, perMonth: 138.99, months: 1, savingPct: 0 },
      biannual: { total: 799.99, perMonth: 133.33, months: 6, savingPct: 4, anchorLabel: { zh: "Save $34", en: "Save $34" } },
      annual: { total: 1399.99, perMonth: 116.67, months: 12, savingPct: 16, anchorLabel: { zh: "Save $268", en: "Save $268" } },
      lifetime: { total: 5599.99, perMonth: 0, months: 0, savingPct: 0, anchorLabel: { zh: "One-time", en: "One-time" } }
    }
  }
};
var PLAN_META = {
  starter: {
    name: { zh: "\u5165\u95E8\u7248", en: "Starter" },
    tagline: { zh: "\u8F7B\u677E\u4E0A\u624B AI \u521B\u4F5C", en: "Get started with AI" },
    badge: "\u{1F431}",
    highlighted: false,
    accentColor: "text-sky-400",
    accentBg: "bg-sky-400/10",
    accentBorder: "border-sky-400/30"
  },
  pro: {
    name: { zh: "\u4E13\u4E1A\u7248", en: "Pro" },
    tagline: { zh: "\u9AD8\u9891\u4F7F\u7528 \xB7 \u5168\u6A21\u578B\u89E3\u9501", en: "Unlock all models & priority" },
    badge: "\u26A1",
    highlighted: true,
    accentColor: "text-[#C9A84C]",
    accentBg: "bg-[#C9A84C]/10",
    accentBorder: "border-[#C9A84C]/40"
  },
  flagship: {
    name: { zh: "\u54C1\u724C\u5168\u6848\u65D7\u8230\u7248", en: "Flagship" },
    tagline: { zh: "\u65E0\u9650\u4F7F\u7528 \xB7 \u54C1\u724C\u6218\u7565 \xB7 \u4E13\u5C5E\u987E\u95EE", en: "Unlimited \xB7 Brand strategy \xB7 Dedicated manager" },
    badge: "\u{1F451}",
    highlighted: false,
    accentColor: "text-purple-400",
    accentBg: "bg-purple-500/10",
    accentBorder: "border-purple-500/40"
  }
};
var FEATURE_ROWS = [
  // AI 对话
  {
    key: "chat",
    category: "AI \u5BF9\u8BDD",
    label: { zh: "\u6BCF\u65E5\u5BF9\u8BDD\u6B21\u6570", en: "Daily chat messages" },
    starter: "100 \u6B21/\u5929",
    pro: "1,000 \u6B21/\u5929",
    flagship: "\u65E0\u9650\u5236"
  },
  {
    key: "models",
    category: "AI \u5BF9\u8BDD",
    label: { zh: "\u57FA\u7840\u6A21\u578B\uFF08DeepSeek V3\u3001GLM-4 Flash\uFF09", en: "Basic models" },
    starter: true,
    pro: true,
    flagship: true
  },
  {
    key: "premium_models",
    category: "AI \u5BF9\u8BDD",
    label: { zh: "\u9AD8\u7EA7\u6A21\u578B\uFF08DeepSeek R1\u3001GLM-4 Plus\uFF09", en: "Premium models (R1, GLM-4+)" },
    starter: false,
    pro: true,
    flagship: true
  },
  {
    key: "priority",
    category: "AI \u5BF9\u8BDD",
    label: { zh: "\u4F18\u5148\u54CD\u5E94\u961F\u5217\uFF08\u66F4\u5FEB\u56DE\u590D\uFF09", en: "Priority response queue" },
    starter: false,
    pro: true,
    flagship: true
  },
  // 图像生成
  {
    key: "image_gen",
    category: "\u56FE\u50CF\u751F\u6210",
    label: { zh: "nano banana \u56FE\u50CF\u751F\u6210", en: "nano banana image gen" },
    starter: "5 \u6B21/\u5929",
    pro: "100 \u6B21/\u5929",
    flagship: "\u65E0\u9650\u5236"
  },
  // 文件与数据
  {
    key: "file",
    category: "\u6587\u4EF6\u4E0E\u6570\u636E",
    label: { zh: "\u6587\u4EF6\u4E0A\u4F20\u4E0E\u5206\u6790\uFF08PDF\u3001Word\u3001\u8868\u683C\uFF09", en: "File upload & analysis" },
    starter: false,
    pro: true,
    flagship: true
  },
  {
    key: "persona",
    category: "\u6587\u4EF6\u4E0E\u6570\u636E",
    label: { zh: "\u81EA\u5B9A\u4E49 AI \u4EBA\u8BBE / \u7CFB\u7EDF\u63D0\u793A\u8BCD", en: "Custom AI persona / system prompt" },
    starter: false,
    pro: true,
    flagship: true
  },
  // 历史与存储
  {
    key: "history",
    category: "\u5386\u53F2\u4E0E\u5B58\u50A8",
    label: { zh: "\u5BF9\u8BDD\u5386\u53F2\u4FDD\u5B58", en: "Conversation history" },
    starter: "\u6700\u8FD1 50 \u6761",
    pro: "\u65E0\u9650\u5236",
    flagship: "\u65E0\u9650\u5236"
  },
  // API
  {
    key: "api",
    category: "API \u4E0E\u96C6\u6210",
    label: { zh: "API \u63A5\u5165\uFF08\u5F00\u53D1\u8005\u8C03\u7528\uFF09", en: "API access" },
    starter: false,
    pro: true,
    flagship: true
  },
  {
    key: "seats",
    category: "API \u4E0E\u96C6\u6210",
    label: { zh: "\u56E2\u961F\u5E2D\u4F4D", en: "Team seats" },
    starter: "1 \u5E2D",
    pro: "3 \u5E2D",
    flagship: "10 \u5E2D"
  },
  // 品牌服务（旗舰版专属）
  {
    key: "brand",
    category: "\u54C1\u724C\u5168\u6848\u670D\u52A1",
    label: { zh: "\u54C1\u724C\u6218\u7565 AI \u5206\u6790\u62A5\u544A", en: "Brand strategy AI reports" },
    starter: false,
    pro: false,
    flagship: true
  },
  {
    key: "manager",
    category: "\u54C1\u724C\u5168\u6848\u670D\u52A1",
    label: { zh: "\u4E13\u5C5E\u5BA2\u6237\u7ECF\u7406\uFF081v1 \u670D\u52A1\uFF09", en: "Dedicated account manager" },
    starter: false,
    pro: false,
    flagship: true
  },
  // 支持
  {
    key: "support",
    category: "\u5BA2\u670D\u652F\u6301",
    label: { zh: "\u5BA2\u670D\u652F\u6301", en: "Customer support" },
    starter: "\u793E\u533A\u8BBA\u575B",
    pro: "\u90AE\u4EF6\u4F18\u5148\u54CD\u5E94",
    flagship: "\u4E13\u5C5E 1v1 \u5FAE\u4FE1"
  }
];
var PAYMENT_PROVIDERS = [
  { id: "alipay", name: { zh: "\u652F\u4ED8\u5B9D", en: "Alipay" }, currencies: ["CNY"], available: false, color: "text-blue-400" },
  { id: "wechatpay", name: { zh: "\u5FAE\u4FE1\u652F\u4ED8", en: "WeChat Pay" }, currencies: ["CNY"], available: false, color: "text-green-400" },
  { id: "lianpay", name: { zh: "\u8FDE\u8FDE\u652F\u4ED8", en: "LianLian Pay" }, currencies: ["CNY", "USD"], available: false, color: "text-orange-400" },
  { id: "paypal", name: { zh: "PayPal", en: "PayPal" }, currencies: ["USD"], available: false, color: "text-sky-400" },
  { id: "stripe", name: { zh: "Stripe", en: "Stripe" }, currencies: ["USD"], available: false, color: "text-violet-400" }
];

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/routers.ts
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "\u4EC5\u7BA1\u7406\u5458\u53EF\u64CD\u4F5C" });
  }
  return next({ ctx });
});
var MODEL_CONFIGS = {
  "deepseek-chat": { name: "DeepSeek V3", badge: "\u{1F535}", baseUrl: "https://api.deepseek.com/v1", apiKey: process.env.DEEPSEEK_API_KEY || "", model: "deepseek-chat" },
  "deepseek-reasoner": { name: "DeepSeek R1", badge: "\u{1F9E0}", baseUrl: "https://api.deepseek.com/v1", apiKey: process.env.DEEPSEEK_API_KEY || "", model: "deepseek-reasoner" },
  "glm-4-flash": { name: "\u667A\u8C31 GLM-4 Flash", badge: "\u26A1", baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: process.env.ZHIPU_API_KEY || "", model: "glm-4-flash" },
  "glm-4-plus": { name: "\u667A\u8C31 GLM-4 Plus", badge: "\u{1F7E3}", baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: process.env.ZHIPU_API_KEY || "", model: "glm-4-plus" },
  "glm-4v-flash": { name: "GLM-4V \u89C6\u89C9", badge: "\u{1F441}\uFE0F", baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: process.env.ZHIPU_API_KEY || "", model: "glm-4v-flash", supportsVision: true, maxTokens: 1024 },
  "llama-3.3-70b-versatile": { name: "Groq Llama 3.3 70B", badge: "\u26A1", baseUrl: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY || "", model: "llama-3.3-70b-versatile" }
};
var SYSTEM_PRESETS = [
  { id: "coding", name: "\u{1F4BB} \u7F16\u7A0B\u52A9\u624B", prompt: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u7F16\u7A0B\u52A9\u624B\u3002\u5E2E\u52A9\u7528\u6237\u7F16\u5199\u3001\u8C03\u8BD5\u3001\u4F18\u5316\u548C\u89E3\u91CA\u4EE3\u7801\u3002\u63D0\u4F9B\u6E05\u6670\u7684\u4EE3\u7801\u793A\u4F8B\uFF0C\u5E76\u89E3\u91CA\u6BCF\u4E2A\u6B65\u9AA4\u3002\u652F\u6301\u6240\u6709\u4E3B\u6D41\u7F16\u7A0B\u8BED\u8A00\u3002\u56DE\u7B54\u65F6\u4F18\u5148\u63D0\u4F9B\u53EF\u8FD0\u884C\u7684\u4EE3\u7801\u793A\u4F8B\u3002" },
  { id: "general", name: "\u{1F916} \u901A\u7528\u5BF9\u8BDD", prompt: "\u4F60\u662F\u4E00\u4E2A\u6709\u5E2E\u52A9\u7684 AI \u52A9\u624B\u3002\u8BF7\u7528\u6E05\u6670\u3001\u51C6\u786E\u3001\u53CB\u597D\u7684\u65B9\u5F0F\u56DE\u7B54\u7528\u6237\u7684\u95EE\u9898\u3002" },
  { id: "chinese", name: "\u{1F1E8}\u{1F1F3} \u4E2D\u6587\u52A9\u624B", prompt: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u4E2D\u6587 AI \u52A9\u624B\u3002\u8BF7\u59CB\u7EC8\u7528\u4E2D\u6587\u56DE\u7B54\uFF0C\u8BED\u8A00\u8868\u8FBE\u8981\u81EA\u7136\u6D41\u7545\uFF0C\u7B26\u5408\u4E2D\u6587\u4E60\u60EF\u3002" },
  { id: "analyst", name: "\u{1F4CA} \u6570\u636E\u5206\u6790\u5E08", prompt: "\u4F60\u662F\u4E00\u4E2A\u6570\u636E\u5206\u6790\u4E13\u5BB6\u3002\u5E2E\u52A9\u7528\u6237\u5206\u6790\u6570\u636E\u3001\u89E3\u8BFB\u7EDF\u8BA1\u7ED3\u679C\u3001\u63D0\u4F9B\u6570\u636E\u53EF\u89C6\u5316\u5EFA\u8BAE\uFF0C\u5E76\u7ED9\u51FA\u57FA\u4E8E\u6570\u636E\u7684\u51B3\u7B56\u5EFA\u8BAE\u3002" },
  { id: "writer", name: "\u270D\uFE0F \u5199\u4F5C\u52A9\u624B", prompt: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u5199\u4F5C\u52A9\u624B\u3002\u5E2E\u52A9\u7528\u6237\u64B0\u5199\u3001\u6DA6\u8272\u548C\u6539\u8FDB\u5404\u7C7B\u6587\u7AE0\uFF0C\u5305\u62EC\u6280\u672F\u6587\u6863\u3001\u5546\u4E1A\u62A5\u544A\u3001\u521B\u610F\u5199\u4F5C\u7B49\u3002" }
];
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
        tier,
        status: sub?.status ?? "active",
        currentPeriodEnd: sub?.currentPeriodEnd ?? null,
        usage: {
          chatMessages: usage.chatMessages ?? 0,
          imageGenerations: usage.imageGenerations ?? 0
        },
        limits
      };
    }),
    // Get payment history
    paymentHistory: protectedProcedure.query(async ({ ctx }) => {
      return getPaymentOrders(ctx.user.id);
    }),
    // Create a payment order — supports both subscription tiers and generic products
    createOrder: protectedProcedure.input(z2.object({
      // Subscription tier mode (MaoAI)
      tier: z2.enum(["starter", "pro", "flagship"]).optional(),
      billingCycle: z2.enum(["monthly", "biannual", "annual", "lifetime"]).optional().default("monthly"),
      // Generic product mode (OpenClaw, MillenniumClock, MaoThinkTank, etc.)
      productId: z2.string().optional(),
      productName: z2.string().optional(),
      amount: z2.number().optional(),
      // Common fields
      provider: z2.enum(["alipay", "lianpay", "paypal", "stripe", "wechatpay", "manual"]),
      currency: z2.enum(["CNY", "USD"])
    })).mutation(async ({ ctx, input }) => {
      let finalAmount;
      let tierLabel;
      let meta;
      if (input.tier) {
        const tierPrices = PLAN_PRICES[input.tier];
        const cyclePrices = tierPrices[input.currency];
        const pricing = cyclePrices[input.billingCycle];
        finalAmount = pricing.total;
        tierLabel = input.tier;
        meta = { billingCycle: input.billingCycle, perMonth: pricing.perMonth };
      } else if (input.productId && input.amount !== void 0) {
        finalAmount = input.amount;
        tierLabel = input.productId;
        meta = { productId: input.productId, productName: input.productName };
      } else {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Must provide either tier or productId+amount" });
      }
      const order = await createPaymentOrder({
        userId: ctx.user.id,
        tier: tierLabel,
        provider: input.provider,
        currency: input.currency,
        amount: finalAmount.toFixed(2),
        metadata: JSON.stringify(meta)
      });
      return {
        orderId: order.id ?? `ORD-${Date.now()}`,
        status: "pending",
        amount: finalAmount,
        currency: input.currency,
        paymentUrl: null,
        message: "\u652F\u4ED8\u63A5\u53E3\u63A5\u5165\u4E2D\uFF0C\u8BF7\u8054\u7CFB\u5BA2\u670D\u5B8C\u6210\u652F\u4ED8"
      };
    }),
    // Admin: manually activate a subscription (for manual payments / testing)
    adminActivate: adminProcedure2.input(z2.object({
      userId: z2.number(),
      tier: z2.enum(["free", "starter", "pro", "flagship"]),
      durationDays: z2.number().default(30)
    })).mutation(async ({ input }) => {
      const start = /* @__PURE__ */ new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + input.durationDays);
      await upsertSubscription({
        userId: input.userId,
        tier: input.tier,
        status: "active",
        currentPeriodStart: start.toISOString(),
        currentPeriodEnd: input.tier === "free" ? null : end.toISOString()
      });
      return { success: true };
    }),
    // Webhook stub: called by payment provider after successful payment
    // In production, verify signature from provider before trusting this
    paymentWebhook: publicProcedure.input(z2.object({
      orderId: z2.number(),
      externalOrderId: z2.string().optional(),
      provider: z2.string(),
      status: z2.enum(["paid", "failed", "refunded"])
    })).mutation(async ({ input }) => {
      await updatePaymentOrder(input.orderId, {
        status: input.status,
        externalOrderId: input.externalOrderId,
        paidAt: input.status === "paid" ? (/* @__PURE__ */ new Date()).toISOString() : void 0
      });
      if (input.status === "paid") {
        const orders = await getPaymentOrders(0);
      }
      return { success: true };
    })
  }),
  // ─── 咨询服务预约 ──────────────────────────────────────────────────────────────────────────────
  consulting: router({
    createInquiry: publicProcedure.input((val) => {
      const v = val;
      if (!v.name || !v.email) throw new TRPCError3({ code: "BAD_REQUEST", message: "\u5FC5\u586B\u5B57\u6BB5\u4E0D\u80FD\u4E3A\u7A7A" });
      return v;
    }).mutation(async ({ input }) => {
      const { createConsultingInquiry: createConsultingInquiry2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const inquiry = await createConsultingInquiry2(input);
      try {
        const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
        await notifyOwner2({
          title: `\u{1F514} \u54A8\u8BE2\u670D\u52A1\u65B0\u7EBF\u7D22: ${input.name}${input.company ? ` (${input.company})` : ""} \u2014 ${input.service || "\u672A\u6307\u5B9A\u670D\u52A1"}`,
          content: `\u59D3\u540D: ${input.name}
\u516C\u53F8: ${input.company || "\u672A\u586B\u5199"}
\u90AE\u7BB1: ${input.email}
\u7535\u8BDD: ${input.phone || "\u672A\u586B\u5199"}
\u610F\u5411\u670D\u52A1: ${input.service || "\u672A\u6307\u5B9A"}
\u9884\u7B97: ${input.budget || "\u672A\u586B\u5199"}
\u8BF4\u660E: ${input.message || "\u65E0"}`
        });
      } catch (e) {
        console.warn("[consulting] Manus \u901A\u77E5\u5931\u8D25:", e);
      }
      try {
        const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
        const adminHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"/><title>\u65B0\u54A8\u8BE2\u7EBF\u7D22 \u2014 \u732B\u773C\u589E\u957F\u5F15\u64CE</title>
<style>
body{margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;}
.wrapper{max-width:600px;margin:0 auto;background:#111111;}
.header{background:#0A0A0A;padding:24px 32px;border-bottom:2px solid #C9A84C;}
.title{color:#C9A84C;font-size:18px;font-weight:700;}
.badge{display:inline-block;background:#C9A84C;color:#000;font-size:11px;font-weight:700;padding:3px 10px;letter-spacing:0.1em;margin-left:10px;}
.body{padding:32px;}
.field{margin-bottom:16px;border-bottom:1px solid #ffffff0d;padding-bottom:16px;}
.label{color:#C9A84C;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;}
.value{color:#ffffff;font-size:15px;}
.msg{color:#cccccc;font-size:14px;line-height:1.7;background:#0A0A0A;padding:16px;border-left:3px solid #C9A84C;margin-top:6px;}
.footer{background:#0A0A0A;padding:20px 32px;border-top:1px solid #ffffff11;color:#ffffff33;font-size:12px;}
</style></head>
<body>
<div class="wrapper">
  <div class="header"><div class="title">\u{1F514} \u65B0\u54A8\u8BE2\u7EBF\u7D22<span class="badge">NEW LEAD</span></div></div>
  <div class="body">
    <div class="field"><div class="label">\u59D3\u540D</div><div class="value">${input.name}</div></div>
    <div class="field"><div class="label">\u516C\u53F8</div><div class="value">${input.company || "\uFF08\u672A\u586B\u5199\uFF09"}</div></div>
    <div class="field"><div class="label">\u90AE\u7BB1</div><div class="value"><a href="mailto:${input.email}" style="color:#C9A84C">${input.email}</a></div></div>
    <div class="field"><div class="label">\u7535\u8BDD</div><div class="value">${input.phone || "\uFF08\u672A\u586B\u5199\uFF09"}</div></div>
    <div class="field"><div class="label">\u610F\u5411\u670D\u52A1</div><div class="value">${input.service || "\uFF08\u672A\u6307\u5B9A\uFF09"}</div></div>
    <div class="field"><div class="label">\u9884\u7B97\u8303\u56F4</div><div class="value">${input.budget || "\uFF08\u672A\u586B\u5199\uFF09"}</div></div>
    <div class="field"><div class="label">\u8865\u5145\u8BF4\u660E</div><div class="msg">${input.message || "\uFF08\u65E0\uFF09"}</div></div>
  </div>
  <div class="footer">\u732B\u773C\u589E\u957F\u5F15\u64CE \xB7 www.mcmamoo.com \xB7 \u8BF7\u5728 1-2 \u4E2A\u5DE5\u4F5C\u65E5\u5185\u8DDF\u8FDB\u6B64\u7EBF\u7D22</div>
</div>
</body></html>`;
        await sendEmail2({
          to: "sean_lab@163.com",
          subject: `[\u732B\u773C\u54A8\u8BE2\u7EBF\u7D22] ${input.name}${input.company ? ` \xB7 ${input.company}` : ""} \u2014 ${input.service || "\u54A8\u8BE2\u9884\u7EA6"}`,
          html: adminHtml
        });
      } catch (e) {
        console.warn("[consulting] \u7EBF\u7D22\u90AE\u4EF6\u53D1\u9001\u5931\u8D25:", e);
      }
      try {
        const { sendEmail: sendEmail2, generateContactConfirmationHtml: generateContactConfirmationHtml2 } = await Promise.resolve().then(() => (init_email(), email_exports));
        await sendEmail2({
          to: input.email,
          subject: `\u611F\u8C22\u60A8\u7684\u54A8\u8BE2\u7533\u8BF7 \u2014 \u732B\u773C\u589E\u957F\u5F15\u64CE Mc&Mamoo`,
          html: generateContactConfirmationHtml2(input.name, input.company || "")
        });
      } catch (e) {
        console.warn("[consulting] \u7528\u6237\u786E\u8BA4\u90AE\u4EF6\u53D1\u9001\u5931\u8D25:", e);
      }
      return { success: true, id: inquiry?.id };
    }),
    getInquiries: adminProcedure2.query(async () => {
      const { getConsultingInquiries: getConsultingInquiries2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return getConsultingInquiries2();
    }),
    updateStatus: adminProcedure2.input((val) => {
      const v = val;
      if (!v.id || !v.status) throw new TRPCError3({ code: "BAD_REQUEST", message: "id \u548C status \u4E3A\u5FC5\u586B" });
      const validStatuses = ["new", "contacted", "signed", "dropped"];
      if (!validStatuses.includes(v.status)) throw new TRPCError3({ code: "BAD_REQUEST", message: "\u65E0\u6548\u72B6\u6001" });
      return v;
    }).mutation(async ({ input }) => {
      const { updateInquiryStatus: updateInquiryStatus2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await updateInquiryStatus2(input.id, input.status, input.notes);
      return { success: true };
    })
  }),
  // ─── 万年钟预约 ──────────────────────────────────────────────────────────────────────────────
  millenniumClock: router({
    createReservation: publicProcedure.input((val) => {
      const v = val;
      if (!v.name || !v.email || !v.intent) throw new TRPCError3({ code: "BAD_REQUEST", message: "\u5FC5\u586B\u5B57\u6BB5\u4E0D\u80FD\u4E3A\u7A7A" });
      return v;
    }).mutation(async ({ input, ctx }) => {
      const reservation = await createMillenniumClockReservation(input);
      try {
        const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
        await notifyOwner2({
          title: `\u4E07\u5E74\u949F\u65B0\u9884\u7EA6: ${input.name} (${input.intent})`,
          content: `\u59D3\u540D: ${input.name}
\u673A\u6784: ${input.company || "\u672A\u586B\u5199"}
\u90AE\u7BB1: ${input.email}
\u7535\u8BDD: ${input.phone || "\u672A\u586B\u5199"}
\u610F\u5411: ${input.intent}
\u8BF4\u660E: ${input.message || "\u65E0"}`
        });
      } catch (e) {
        console.warn("[millenniumClock] \u90AE\u4EF6\u901A\u77E5\u5931\u8D25:", e);
      }
      return { success: true, id: reservation?.id };
    }),
    getReservations: adminProcedure2.query(async () => {
      return getMillenniumClockReservations();
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
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var __filename = typeof import.meta.url === "string" ? fileURLToPath(import.meta.url) : process.argv[1];
var __dirname_safe = path.dirname(__filename);
var PROJECT_ROOT = (typeof import.meta.dirname === "string" ? import.meta.dirname : null) ?? __dirname_safe;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
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
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(PROJECT_ROOT, "client", "src"),
      "@shared": path.resolve(PROJECT_ROOT, "shared"),
      "@assets": path.resolve(PROJECT_ROOT, "attached_assets")
    }
  },
  envDir: path.resolve(PROJECT_ROOT),
  root: path.resolve(PROJECT_ROOT, "client"),
  publicDir: path.resolve(PROJECT_ROOT, "client", "public"),
  build: {
    outDir: path.resolve(PROJECT_ROOT, "dist/public"),
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

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const __dir = typeof import.meta.dirname === "string" ? import.meta.dirname : path2.dirname(fileURLToPath2(import.meta.url));
      const clientTemplate = path2.resolve(
        __dir,
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
  const distPath = path2.resolve(process.cwd(), "dist", "public");
  if (!fs2.existsSync(distPath)) {
    console.warn(
      `[serveStatic] Build directory not found: ${distPath}. Running in API-only mode.`
    );
    return;
  }
  console.log(`[serveStatic] Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/aiStream.ts
import { Router } from "express";
init_db();
import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

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
}
async function selectNode(preferPaid, onlyLocal, onlyCloud) {
  try {
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
    let totalTokens = 0;
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
              totalTokens += delta.length;
            }
            if (json.usage?.total_tokens) totalTokens = json.usage.total_tokens;
          } catch {
          }
        }
      }
    }
    await createNodeLog({ nodeId: node.id, model: effectiveModel, status: "success", latencyMs: Date.now() - start, completionTokens: totalTokens });
    return { success: true };
  } catch (err) {
    await createNodeLog({ nodeId: node.id, model: effectiveModel, status: "error", latencyMs: Date.now() - start, errorMessage: err.message });
    return { success: false };
  }
}
aiStreamRouter.post("/chat/stream", async (req, res) => {
  let { model = "deepseek-chat", messages, systemPrompt, preferPaid, useLocal, nodeId: requestedNodeId } = req.body;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const hasImage = Array.isArray(messages) && messages.some(
    (m) => Array.isArray(m.content) && m.content.some((c) => c.type === "image_url")
  );
  if (hasImage && !useLocal && !String(model).startsWith("local:")) {
    const currentCfg = MODEL_CONFIGS[model];
    if (!currentCfg?.supportsVision) {
      model = "glm-4v-flash";
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
  const rawMessages = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
  const allMessages = hasImage ? normalizeMessagesForVision(rawMessages) : rawMessages;
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
    res.json({ url: result.url });
  } catch (err) {
    console.error("[Image Generate] Error:", err);
    res.status(500).json({ error: err.message || "\u56FE\u50CF\u751F\u6210\u5931\u8D25" });
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
        const result = await pdfParse(buffer);
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
  let nodeCount = 0, onlineCount = 0;
  try {
    const nodes = await getAiNodes();
    nodeCount = nodes.length;
    onlineCount = nodes.filter((n) => n.isOnline).length;
  } catch {
  }
  res.json({ status: "ok", models: status, nodes: { total: nodeCount, online: onlineCount }, timestamp: (/* @__PURE__ */ new Date()).toISOString(), version: "v2.3-openclaw-skills" });
});
var aiStream_default = aiStreamRouter;

// server/_core/index.ts
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
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
  app.use(cors({
    origin: [
      "https://mcmamoo-website.pages.dev",
      "https://www.mcmamoo.com",
      "https://mcmamoo.com",
      "https://api.mcmamoo.com",
      /\.mcmamoo-website\.pages\.dev$/,
      /\.mcmamoo\.com$/
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
  }));
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  registerSupabaseAuthRoutes(app);
  app.use("/api/ai", aiStream_default);
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
    try {
      serveStatic(app);
    } catch (e) {
      console.warn("[serveStatic] Failed to serve static files (API-only mode):", e);
    }
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
