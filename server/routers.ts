import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getConversations, createConversation, updateConversation,
  deleteConversation, getMessages, createMessage, clearMessages
} from "./db";

// ─── Model Configs ────────────────────────────────────────────────────────────

export const MODEL_CONFIGS: Record<string, { name: string; baseUrl: string; apiKey: string; model: string; badge: string }> = {
  "deepseek-chat": {
    name: "DeepSeek V3",
    badge: "🔵",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    model: "deepseek-chat",
  },
  "deepseek-reasoner": {
    name: "DeepSeek R1",
    badge: "🧠",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    model: "deepseek-reasoner",
  },
  "glm-4-flash": {
    name: "智谱 GLM-4 Flash",
    badge: "⚡",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    apiKey: process.env.ZHIPU_API_KEY || "",
    model: "glm-4-flash",
  },
  "glm-4-plus": {
    name: "智谱 GLM-4 Plus",
    badge: "🟣",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    apiKey: process.env.ZHIPU_API_KEY || "",
    model: "glm-4-plus",
  },
  "llama-3.3-70b-versatile": {
    name: "Groq Llama 3.3 70B",
    badge: "⚡",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || "",
    model: "llama-3.3-70b-versatile",
  },
};

export const SYSTEM_PRESETS = [
  {
    id: "coding",
    name: "💻 编程助手",
    prompt: "你是一个专业的编程助手。帮助用户编写、调试、优化和解释代码。提供清晰的代码示例，并解释每个步骤。支持所有主流编程语言。回答时优先提供可运行的代码示例。",
  },
  {
    id: "general",
    name: "🤖 通用对话",
    prompt: "你是一个有帮助的 AI 助手。请用清晰、准确、友好的方式回答用户的问题。",
  },
  {
    id: "chinese",
    name: "🇨🇳 中文助手",
    prompt: "你是一个专业的中文 AI 助手。请始终用中文回答，语言表达要自然流畅，符合中文习惯。",
  },
  {
    id: "analyst",
    name: "📊 数据分析师",
    prompt: "你是一个数据分析专家。帮助用户分析数据、解读统计结果、提供数据可视化建议，并给出基于数据的决策建议。",
  },
  {
    id: "writer",
    name: "✍️ 写作助手",
    prompt: "你是一个专业的写作助手。帮助用户撰写、润色和改进各类文章，包括技术文档、商业报告、创意写作等。",
  },
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

  // ─── AI Config ──────────────────────────────────────────────────────────────
  ai: router({
    models: publicProcedure.query(() => {
      return Object.entries(MODEL_CONFIGS).map(([id, cfg]) => ({
        id,
        name: cfg.name,
        badge: cfg.badge,
        available: !!cfg.apiKey,
      }));
    }),
    presets: publicProcedure.query(() => SYSTEM_PRESETS),
    status: publicProcedure.query(async () => {
      const results: Record<string, boolean> = {};
      for (const [id, cfg] of Object.entries(MODEL_CONFIGS)) {
        results[id] = !!cfg.apiKey;
      }
      return results;
    }),
  }),

  // ─── Conversations ──────────────────────────────────────────────────────────
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getConversations(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createConversation({
          userId: ctx.user.id,
          title: input.title || "新对话",
          model: input.model || "deepseek-chat",
          systemPrompt: input.systemPrompt || SYSTEM_PRESETS[0].prompt,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateConversation(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteConversation(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Messages ───────────────────────────────────────────────────────────────
  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return getMessages(input.conversationId);
      }),

    clear: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input }) => {
        await clearMessages(input.conversationId);
        return { success: true };
      }),

    save: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        model: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createMessage({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          model: input.model,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
