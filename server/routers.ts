import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getConversations, createConversation, updateConversation,
  deleteConversation, getMessages, createMessage, clearMessages,
  getAiNodes, getAiNodeById, createAiNode, updateAiNode, deleteAiNode, updateNodePingStatus,
  getRoutingRules, createRoutingRule, updateRoutingRule, deleteRoutingRule,
  getNodeLogs, getNodeStats,
} from "./db";

// ─── Admin Guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可操作" });
  }
  return next({ ctx });
});

// ─── Model Configs ────────────────────────────────────────────────────────────
export const MODEL_CONFIGS: Record<string, { name: string; baseUrl: string; apiKey: string; model: string; badge: string }> = {
  "deepseek-chat": { name: "DeepSeek V3", badge: "🔵", baseUrl: "https://api.deepseek.com/v1", apiKey: process.env.DEEPSEEK_API_KEY || "", model: "deepseek-chat" },
  "deepseek-reasoner": { name: "DeepSeek R1", badge: "🧠", baseUrl: "https://api.deepseek.com/v1", apiKey: process.env.DEEPSEEK_API_KEY || "", model: "deepseek-reasoner" },
  "glm-4-flash": { name: "智谱 GLM-4 Flash", badge: "⚡", baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: process.env.ZHIPU_API_KEY || "", model: "glm-4-flash" },
  "glm-4-plus": { name: "智谱 GLM-4 Plus", badge: "🟣", baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: process.env.ZHIPU_API_KEY || "", model: "glm-4-plus" },
  "llama-3.3-70b-versatile": { name: "Groq Llama 3.3 70B", badge: "⚡", baseUrl: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY || "", model: "llama-3.3-70b-versatile" },
};

export const SYSTEM_PRESETS = [
  { id: "coding", name: "💻 编程助手", prompt: "你是一个专业的编程助手。帮助用户编写、调试、优化和解释代码。提供清晰的代码示例，并解释每个步骤。支持所有主流编程语言。回答时优先提供可运行的代码示例。" },
  { id: "general", name: "🤖 通用对话", prompt: "你是一个有帮助的 AI 助手。请用清晰、准确、友好的方式回答用户的问题。" },
  { id: "chinese", name: "🇨🇳 中文助手", prompt: "你是一个专业的中文 AI 助手。请始终用中文回答，语言表达要自然流畅，符合中文习惯。" },
  { id: "analyst", name: "📊 数据分析师", prompt: "你是一个数据分析专家。帮助用户分析数据、解读统计结果、提供数据可视化建议，并给出基于数据的决策建议。" },
  { id: "writer", name: "✍️ 写作助手", prompt: "你是一个专业的写作助手。帮助用户撰写、润色和改进各类文章，包括技术文档、商业报告、创意写作等。" },
];

// ─── Router ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  ai: router({
    models: publicProcedure.query(() =>
      Object.entries(MODEL_CONFIGS).map(([id, cfg]) => ({ id, name: cfg.name, badge: cfg.badge, available: !!cfg.apiKey }))
    ),
    presets: publicProcedure.query(() => SYSTEM_PRESETS),
    status: publicProcedure.query(async () => {
      const results: Record<string, boolean> = {};
      for (const [id, cfg] of Object.entries(MODEL_CONFIGS)) results[id] = !!cfg.apiKey;
      return results;
    }),
  }),

  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => getConversations(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({ title: z.string().optional(), model: z.string().optional(), systemPrompt: z.string().optional() }))
      .mutation(async ({ ctx, input }) => createConversation({ userId: ctx.user.id, title: input.title || "新对话", model: input.model || "deepseek-chat", systemPrompt: input.systemPrompt || SYSTEM_PRESETS[0].prompt })),
    update: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().optional(), model: z.string().optional(), systemPrompt: z.string().optional() }))
      .mutation(async ({ ctx, input }) => { const { id, ...data } = input; await updateConversation(id, ctx.user.id, data); return { success: true }; }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => { await deleteConversation(input.id, ctx.user.id); return { success: true }; }),
  }),

  messages: router({
    list: protectedProcedure.input(z.object({ conversationId: z.number() })).query(async ({ input }) => getMessages(input.conversationId)),
    clear: protectedProcedure.input(z.object({ conversationId: z.number() })).mutation(async ({ input }) => { await clearMessages(input.conversationId); return { success: true }; }),
    save: protectedProcedure
      .input(z.object({ conversationId: z.number(), role: z.enum(["user", "assistant", "system"]), content: z.string(), model: z.string().optional() }))
      .mutation(async ({ input }) => createMessage({ conversationId: input.conversationId, role: input.role, content: input.content, model: input.model })),
  }),

  // ─── Admin: AI Nodes ─────────────────────────────────────────────────────────
  nodes: router({
    list: adminProcedure.query(async () => getAiNodes()),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["claude_api", "openai_compat", "openmanus", "openclaw", "workbuddy", "custom"]),
        baseUrl: z.string().url(),
        apiKey: z.string().optional(),
        modelId: z.string().optional(),
        isPaid: z.boolean().optional(),
        isLocal: z.boolean().optional(),
        priority: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => createAiNode({
        name: input.name, type: input.type, baseUrl: input.baseUrl,
        apiKey: input.apiKey || "", modelId: input.modelId || "",
        isPaid: input.isPaid ?? false, isLocal: input.isLocal ?? false,
        priority: input.priority ?? 100, isActive: true, isOnline: false,
        description: input.description || "",
      })),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["claude_api", "openai_compat", "openmanus", "openclaw", "workbuddy", "custom"]).optional(),
        baseUrl: z.string().optional(),
        apiKey: z.string().optional(),
        modelId: z.string().optional(),
        isPaid: z.boolean().optional(),
        isLocal: z.boolean().optional(),
        priority: z.number().optional(),
        isActive: z.boolean().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => { const { id, ...data } = input; await updateAiNode(id, data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteAiNode(input.id); return { success: true }; }),
    ping: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const node = await getAiNodeById(input.id);
        if (!node) throw new TRPCError({ code: "NOT_FOUND" });
        const start = Date.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(`${node.baseUrl}/models`, {
            headers: node.apiKey ? { Authorization: `Bearer ${node.apiKey}` } : {},
            signal: controller.signal,
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
    stats: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => getNodeStats(input.id)),
  }),

  // ─── Admin: Routing Rules ────────────────────────────────────────────────────
  routing: router({
    list: adminProcedure.query(async () => getRoutingRules()),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        mode: z.enum(["paid", "free", "auto", "manual"]),
        nodeIds: z.string(),
        failover: z.boolean().optional(),
        loadBalance: z.enum(["priority", "round_robin", "least_latency"]).optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => createRoutingRule({
        name: input.name, mode: input.mode, nodeIds: input.nodeIds,
        failover: input.failover ?? true, loadBalance: input.loadBalance ?? "priority",
        isDefault: input.isDefault ?? false, isActive: true,
      })),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        mode: z.enum(["paid", "free", "auto", "manual"]).optional(),
        nodeIds: z.string().optional(),
        failover: z.boolean().optional(),
        loadBalance: z.enum(["priority", "round_robin", "least_latency"]).optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => { const { id, ...data } = input; await updateRoutingRule(id, data); return { success: true }; }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await deleteRoutingRule(input.id); return { success: true }; }),
  }),

  // ─── Admin: Logs ─────────────────────────────────────────────────────────────
  logs: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => getNodeLogs(input.limit ?? 100)),
  }),
});

export type AppRouter = typeof appRouter;
