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
  getContentCopies, createContentCopy, deleteContentCopy, updateContentCopyStatus,
  createMillenniumClockReservation, getMillenniumClockReservations,
  getUserSubscription, upsertSubscription, createPaymentOrder, updatePaymentOrder, getPaymentOrders, getTodayUsage, incrementUsage,
} from "./db";
import { PLAN_LIMITS, PLAN_PRICES, PLAN_META, FEATURE_ROWS, PAYMENT_PROVIDERS, type PlanTier, type Currency } from "@shared/plans";
import { invokeLLM } from "./_core/llm";

// ─── Admin Guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可操作" });
  }
  return next({ ctx });
});

// ─── Model Configs ────────────────────────────────────────────────────────────
export const MODEL_CONFIGS: Record<string, { name: string; baseUrl: string; apiKey: string; model: string; badge: string; supportsVision?: boolean; maxTokens?: number }> = {
  "deepseek-chat": { name: "DeepSeek V3", badge: "🔵", baseUrl: "https://api.deepseek.com/v1", apiKey: process.env.DEEPSEEK_API_KEY || "", model: "deepseek-chat" },
  "deepseek-reasoner": { name: "DeepSeek R1", badge: "🧠", baseUrl: "https://api.deepseek.com/v1", apiKey: process.env.DEEPSEEK_API_KEY || "", model: "deepseek-reasoner" },
  "glm-4-flash": { name: "智谱 GLM-4 Flash", badge: "⚡", baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: process.env.ZHIPU_API_KEY || "", model: "glm-4-flash" },
  "glm-4-plus": { name: "智谱 GLM-4 Plus", badge: "🟣", baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: process.env.ZHIPU_API_KEY || "", model: "glm-4-plus" },
  "glm-4v-flash": { name: "GLM-4V 视觉", badge: "👁️", baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: process.env.ZHIPU_API_KEY || "", model: "glm-4v-flash", supportsVision: true, maxTokens: 1024 },
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
          await updateNodePingStatus(node.id as number, online, latency);
          return { online, latency };
        } catch {
          await updateNodePingStatus(node.id as number, false);
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

  // ─── Admin: Logs ───────────────────────────────────────────────────────────────────────────
  logs: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => getNodeLogs(input.limit ?? 100)),
  }),

  // ─── Platform: 猜眼内容平台 ───────────────────────────────────────────────────────────────────
  platform: router({
    // 获取文案库
    listCopies: adminProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => getContentCopies(undefined, input.limit ?? 100)),

    // 删除文案
    deleteCopy: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteContentCopy(input.id); return { success: true }; }),

    // 更新文案状态
    updateCopyStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["draft", "approved", "published"]) }))
      .mutation(async ({ input }) => { await updateContentCopyStatus(input.id, input.status); return { success: true }; }),

    // AI 文案生成（流式）— 返回完整文案并保存到库
    generateCopy: adminProcedure
      .input(z.object({
        brand: z.string().min(1),
        platform: z.string().min(1),
        contentType: z.string().min(1),
        style: z.string().min(1),
        keywords: z.array(z.string()).optional(),
        language: z.enum(["zh", "en", "fr"]).optional(),
        save: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lang = input.language || "zh";
        const kwStr = input.keywords?.join("、") || "";

        const systemPrompt = lang === "fr"
          ? `Tu es un expert en marketing de luxe pour la maison de parfum LA CELLE PARIS 1802. Tu crées des contenus marketing élégants, émotionnels et persuasifs pour les réseaux sociaux.`
          : lang === "en"
          ? `You are a luxury fragrance marketing expert for LA CELLE PARIS 1802, a prestigious French perfume house founded in 1802. Create compelling, elegant, and emotionally resonant marketing content for social media.`
          : `你是法国奈尊香水世家 LA CELLE PARIS 1802 的高级市场营销专家。请为该品牌创作具有法式奈尊气质、情感共鸣和带货转化力的社交媒体营销内容。品牌创立于1802年，拥有拿破仑皇帝的皆室认可。`;

        const userPrompt = lang === "fr"
          ? `Crée un contenu ${input.contentType} pour ${input.platform} sur la marque "${input.brand}" avec le style "${input.style}"${kwStr ? `. Mots-clés: ${kwStr}` : ""}.

Structure requise:
1. Titre accrocheur (2-3 options)
2. Corps du texte (300-500 mots)
3. Hashtags pertinents (10-15)
4. Call-to-action
5. Note sur le meilleur moment de publication`
          : lang === "en"
          ? `Create a ${input.contentType} for ${input.platform} about "${input.brand}" in "${input.style}" style${kwStr ? `. Keywords: ${kwStr}` : ""}.

Required structure:
1. Catchy title (2-3 options)
2. Main body (300-500 words)
3. Relevant hashtags (10-15)
4. Call-to-action
5. Best posting time suggestion`
          : `为「${input.brand}」创作一篇${input.platform}平台的${input.contentType}，风格为「${input.style}」${kwStr ? `，关键词：${kwStr}` : ""}.

请按以下结构输出：
1. 爆款标题（2-3个选项）
2. 正文内容（300-500字，包含情感开头、产品介绍、使用场景、封尾号召）
3. 话题标签（10-15个）
4. 引流行动号召（CTA）
5. 最佳发布时间建议`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text || "").join("") : "");

        // 如果需要保存到文案库
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
            status: "draft",
          });
        }

        return { content, saved };
      }),

    // 批量生成 la-celle1802.com 推广文案
    batchGenerate: adminProcedure
      .input(z.object({
        platforms: z.array(z.string()).min(1),
        language: z.enum(["zh", "en", "fr", "all"]).optional(),
      }))
      .mutation(async ({ ctx }) => {
        const tasks = [
          { brand: "LA CELLE PARIS 1802", platform: "小红书", contentType: "图文笔记", style: "情绪共鸣", keywords: ["法式奈尊", "皇室香水", "1802", "历史传承"], language: "zh" },
          { brand: "LA CELLE PARIS 1802", platform: "小红书", contentType: "种草长文", style: "场景化描写", keywords: ["巴黎奈尊", "价唃香水", "香水测评"], language: "zh" },
          { brand: "LA CELLE PARIS 1802", platform: "Instagram", contentType: "Caption", style: "Luxury Storytelling", keywords: ["French perfume", "heritage", "Napoleon", "luxury"], language: "en" },
          { brand: "LA CELLE PARIS 1802", platform: "Instagram", contentType: "Story Script", style: "Behind the Scenes", keywords: ["Grasse", "artisan", "fragrance", "1802"], language: "en" },
          { brand: "LA CELLE PARIS 1802", platform: "X (Twitter)", contentType: "Thread", style: "Historical Facts", keywords: ["Napoleon", "Josephine", "Paris 1802", "luxury perfume"], language: "en" },
          { brand: "LA CELLE PARIS 1802", platform: "微信朋友圈", contentType: "种草文", style: "高端礼品推荐", keywords: ["法式香水", "高端礼品", "奈尊局"], language: "zh" },
        ];

        const results = [];
        for (const task of tasks) {
          try {
            const lang = task.language as "zh" | "en" | "fr";
            const kwStr = task.keywords.join("、");
            const systemPrompt = lang === "en"
              ? `You are a luxury fragrance marketing expert for LA CELLE PARIS 1802. Website: la-celle1802.com`
              : `你是 LA CELLE PARIS 1802 的高级市场营销专家。官网: la-celle1802.com`;
            const userPrompt = lang === "en"
              ? `Create a ${task.contentType} for ${task.platform} about "${task.brand}" in "${task.style}" style. Keywords: ${kwStr}. Include website la-celle1802.com naturally.`
              : `为「${task.brand}」创作${task.platform}平台${task.contentType}，风格：${task.style}，关键词：${kwStr}。请自然地嵌入官网 la-celle1802.com。`;

            const response = await invokeLLM({
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            });
            const rawContent2 = response.choices[0]?.message?.content;
            const content = typeof rawContent2 === "string" ? rawContent2 : (Array.isArray(rawContent2) ? rawContent2.map((c: any) => c.text || "").join("") : "");
            const saved = await createContentCopy({
              userId: ctx.user.id,
              brand: task.brand,
              platform: task.platform,
              contentType: task.contentType,
              style: task.style,
              keywords: JSON.stringify(task.keywords),
              content,
              status: "draft",
            });
            results.push({ platform: task.platform, contentType: task.contentType, id: saved?.id, success: true });
          } catch (e) {
            results.push({ platform: task.platform, contentType: task.contentType, success: false, error: String(e) });
          }
        }
        return { results, total: results.length, success: results.filter(r => r.success).length };
      }),
     // 定时发布：设置发布时间
    scheduleCopy: adminProcedure
      .input(z.object({
        id: z.number(),
        scheduledAt: z.number().nullable(), // UTC timestamp ms, null = clear
      }))
      .mutation(async ({ input }) => {
        const { updateContentCopyStatus } = await import("./db");
        await updateContentCopyStatus(input.id, input.scheduledAt ? "approved" : "draft");
        return { ok: true };
      }),
    // 获取待发布文案（scheduledAt 已设置）
    getScheduled: adminProcedure
      .query(async () => {
        const { getContentCopies } = await import("./db");
        return getContentCopies();
      }),
  }),
  // ─── Mao 和询表单 & 订阅路由 ───────────────────────────────────────────────────
  mao: router({
    // 公开：提交和询申请
    submitApplication: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        organization: z.string().min(1),
        consultType: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
        const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
        if (!SUPABASE_URL || !SUPABASE_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/mao_applications`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ name: input.name, organization: input.organization, consult_type: input.consultType, description: input.description, status: "pending" }),
        });
        if (!resp.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "提交失败" });
        return { success: true };
      }),
    // 公开：订阅战略简报
    subscribeBrief: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
        const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
        if (!SUPABASE_URL || !SUPABASE_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/brief_subscribers`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
          body: JSON.stringify({ email: input.email }),
        });
        if (!resp.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "订阅失败" });
        return { success: true };
      }),
    // 管理员：获取和询列表
    listApplications: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问" });
        const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
        const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
        if (!SUPABASE_URL || !SUPABASE_KEY) return [];
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/mao_applications?order=created_at.desc&limit=100`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
        if (!resp.ok) return [];
        return resp.json() as Promise<Record<string, unknown>[]>;
      }),
    // 管理员：获取订阅者列表
    listSubscribers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问" });
        const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
        const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
        if (!SUPABASE_URL || !SUPABASE_KEY) return [];
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/brief_subscribers?order=created_at.desc&limit=500`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
        if (!resp.ok) return [];
        return resp.json() as Promise<Record<string, unknown>[]>;
      }),
    // 管理员：更新和询状态
    updateApplicationStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "reviewing", "approved", "rejected"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可操作" });
        const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
        const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ?? "";
        if (!SUPABASE_URL || !SUPABASE_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/mao_applications?id=eq.${input.id}`, {
          method: "PATCH",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ status: input.status }),
        });
        if (!resp.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "更新失败" });
        return { success: true };
      }),
  }),

  // ─── Billing & Subscriptions ──────────────────────────────────────────────────
  billing: router({
    // Get plan definitions (public)
    plans: publicProcedure.query(() => ({
      limits: PLAN_LIMITS,
      prices: PLAN_PRICES,
      meta: PLAN_META,
      features: FEATURE_ROWS,
      providers: PAYMENT_PROVIDERS,
    })),

    // Get current user's subscription and today's usage
    mySubscription: protectedProcedure.query(async ({ ctx }) => {
      const sub = await getUserSubscription(ctx.user.id);
      const usage = await getTodayUsage(ctx.user.id);
      const tier = (sub?.tier as PlanTier) ?? "free";
      const limits = PLAN_LIMITS[tier];
      return {
        tier,
        status: (sub?.status as string) ?? "active",
        currentPeriodEnd: (sub?.currentPeriodEnd as string) ?? null,
        usage: {
          chatMessages: (usage.chatMessages as number) ?? 0,
          imageGenerations: (usage.imageGenerations as number) ?? 0,
        },
        limits,
      };
    }),

    // Get payment history
    paymentHistory: protectedProcedure.query(async ({ ctx }) => {
      return getPaymentOrders(ctx.user.id);
    }),

    // Create a payment order (stub — actual payment URL filled by provider webhook)
    createOrder: protectedProcedure
      .input(z.object({
        tier: z.enum(["pro", "max"]),
        provider: z.enum(["alipay", "lianpay", "paypal", "stripe", "wechatpay", "manual"]),
        currency: z.enum(["CNY", "USD"]),
        billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
      }))
      .mutation(async ({ ctx, input }) => {
        const price = PLAN_PRICES[input.tier][input.currency as Currency];
        const amount = input.billingCycle === "yearly" ? price.yearly : price.monthly;
        const order = await createPaymentOrder({
          userId: ctx.user.id,
          tier: input.tier,
          provider: input.provider,
          currency: input.currency,
          amount: amount.toFixed(2),
          metadata: JSON.stringify({ billingCycle: input.billingCycle }),
        });
        // TODO: integrate actual payment gateway SDK here
        // For now, return a stub pending order
        return {
          orderId: (order as any).id,
          status: "pending",
          amount,
          currency: input.currency,
          paymentUrl: null, // Will be populated by payment provider integration
          message: "支付接口接入中，请联系客服完成支付",
        };
      }),

    // Admin: manually activate a subscription (for manual payments / testing)
    adminActivate: adminProcedure
      .input(z.object({
        userId: z.number(),
        tier: z.enum(["free", "pro", "max"]),
        durationDays: z.number().default(30),
      }))
      .mutation(async ({ input }) => {
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + input.durationDays);
        await upsertSubscription({
          userId: input.userId,
          tier: input.tier,
          status: "active",
          currentPeriodStart: start.toISOString(),
          currentPeriodEnd: input.tier === "free" ? null : end.toISOString(),
        });
        return { success: true };
      }),

    // Webhook stub: called by payment provider after successful payment
    // In production, verify signature from provider before trusting this
    paymentWebhook: publicProcedure
      .input(z.object({
        orderId: z.number(),
        externalOrderId: z.string().optional(),
        provider: z.string(),
        status: z.enum(["paid", "failed", "refunded"]),
      }))
      .mutation(async ({ input }) => {
        await updatePaymentOrder(input.orderId, {
          status: input.status,
          externalOrderId: input.externalOrderId,
          paidAt: input.status === "paid" ? new Date().toISOString() : undefined,
        });
        // If paid, activate subscription
        if (input.status === "paid") {
          const orders = await getPaymentOrders(0); // will be filtered below
          // TODO: look up order by ID to get userId and tier, then upsertSubscription
          // This is a stub — implement full lookup when integrating real payment SDK
        }
        return { success: true };
      }),
  }),

  // ─── 万年钟预约 ────────────────────────────────────────────────────────────────────────
  millenniumClock: router({
    createReservation: publicProcedure
      .input((val: unknown) => {
        const v = val as { name: string; company?: string; email: string; phone?: string; intent: string; message?: string };
        if (!v.name || !v.email || !v.intent) throw new TRPCError({ code: "BAD_REQUEST", message: "必填字段不能为空" });
        return v;
      })
      .mutation(async ({ input, ctx }) => {
        const reservation = await createMillenniumClockReservation(input);
        // 发送邮件通知给 Owner
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: `万年钟新预约: ${input.name} (${input.intent})`,
            content: `姓名: ${input.name}\n机构: ${input.company || '未填写'}\n邮筱: ${input.email}\n电话: ${input.phone || '未填写'}\n意向: ${input.intent}\n说明: ${input.message || '无'}`,
          });
        } catch (e) {
          console.warn("[millenniumClock] 邮件通知失败:", e);
        }
        return { success: true, id: (reservation as { id: number })?.id };
      }),

    getReservations: adminProcedure
      .query(async () => {
        return getMillenniumClockReservations();
      }),
  }),
});
export type AppRouter = typeof appRouter;
