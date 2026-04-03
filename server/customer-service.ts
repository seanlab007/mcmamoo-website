/**
 * MaoAI Sales Customer Service Router
 *
 * 客服功能：
 * 1. ElevenLabs 语音合成（TTS）
 * 2. ElevenLabs 对话式 AI 代理管理
 * 3. 客服电话记录
 * 4. AI 客服聊天（文本）
 */

import { protectedProcedure, router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { dbFetch } from "./aiNodes";

export const customerServiceRouter = router({
  // ─── ElevenLabs 语音列表 ─────────────────────────────────────────────────
  listVoices: protectedProcedure.query(async () => {
    try {
      const { listVoices } = await import("./_core/elevenlabs");
      const voices = await listVoices();
      return voices.map(v => ({
        voiceId: v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels,
        previewUrl: v.preview_url,
        description: v.description,
      }));
    } catch (err: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
    }
  }),

  // ─── ElevenLabs TTS 语音合成 ────────────────────────────────────────────
  textToSpeech: protectedProcedure
    .input(z.object({
      text: z.string().min(1).max(5000),
      voiceId: z.string(),
      stability: z.number().min(0).max(1).optional(),
      similarity: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { textToSpeechBase64 } = await import("./_core/elevenlabs");
        const audioBase64 = await textToSpeechBase64({
          text: input.text,
          voiceId: input.voiceId,
          stability: input.stability,
          similarity: input.similarity,
        });
        return { audio: audioBase64, format: "mp3" };
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  // ─── ElevenLabs 对话式 AI 代理管理 ─────────────────────────────────────
  listAgents: protectedProcedure.query(async () => {
    try {
      const { listConversationalAgents } = await import("./_core/elevenlabs");
      const agents = await listConversationalAgents();
      return agents;
    } catch (err: any) {
      // If not configured, return empty
      if (err.message.includes("未配置")) return [];
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
    }
  }),

  createAgent: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      preamble: z.string().min(1).max(5000).describe("Agent 的系统提示词，定义其人格和行为"),
      firstMessage: z.string().min(1).max(1000).describe("Agent 的第一条消息"),
      voiceId: z.string().optional(),
      phoneNumber: z.string().optional(),
      language: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { createConversationalAgent } = await import("./_core/elevenlabs");
        const result = await createConversationalAgent({
          name: input.name,
          prompt: {
            preamble: input.preamble,
            language: input.language,
          },
          firstMessage: input.firstMessage,
          voiceId: input.voiceId,
          phoneNumber: input.phoneNumber,
          language: input.language,
          temperature: input.temperature,
        });
        return { agentId: result.agent_id, success: true };
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  // ─── 电话呼叫记录 ──────────────────────────────────────────────────────
  listCallRecords: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const r = await dbFetch("/customer_service_calls?order=created_at.desc&limit=100");
    return (r.data as Record<string, unknown>[]) ?? [];
  }),

  createCallRecord: protectedProcedure
    .input(z.object({
      customerName: z.string().max(128),
      customerPhone: z.string().max(32),
      customerEmail: z.string().email().optional(),
      agentId: z.string().optional(),
      conversationId: z.string().optional(),
      callType: z.enum(["inbound", "outbound"]).default("outbound"),
      status: z.enum(["ringing", "in_progress", "completed", "missed", "failed"]).default("ringing"),
      summary: z.string().max(2000).optional(),
      duration: z.number().optional(),
      recordingUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const r = await dbFetch("/customer_service_calls", {
        method: "POST",
        body: {
          ...input,
          created_at: new Date().toISOString(),
        },
      }, "return=representation");
      const rows = r.data as Record<string, unknown>[] | null;
      return { success: true, id: rows?.[0]?.id };
    }),

  updateCallRecord: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.string().optional(),
      summary: z.string().optional(),
      duration: z.number().optional(),
      recordingUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await dbFetch(`/customer_service_calls?id=eq.${id}`, {
        method: "PATCH",
        body: { ...data, updated_at: new Date().toISOString() },
      });
      return { success: true };
    }),

  // ─── 客服统计 ──────────────────────────────────────────────────────────
  getStats: protectedProcedure.query(async () => {
    try {
      const callsResp = await dbFetch(
        "/customer_service_calls?select=status,duration,call_type,created_at&order=created_at.desc&limit=500"
      );

      // dbFetch 可能返回各种格式：Supabase 错误对象、null、或数组
      const rawCalls = callsResp.data;
      const calls = Array.isArray(rawCalls)
        ? (rawCalls as Record<string, unknown>[])
        : [];

      const today = new Date().toISOString().split("T")[0];
      const todayCalls = calls.filter(c => (c.created_at as string)?.startsWith(today));

      const statusCounts: Record<string, number> = {};
      let totalDuration = 0;
      for (const call of calls) {
        const status = call.status as string;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        if (typeof call.duration === "number") totalDuration += call.duration;
      }

      const withDurationCalls = calls.filter(c => typeof c.duration === "number" && c.duration > 0);
      const avgDuration = withDurationCalls.length
        ? Math.round(totalDuration / withDurationCalls.length)
        : 0;

      return {
        totalCalls: calls.length,
        todayCalls: todayCalls.length,
        statusBreakdown: statusCounts,
        totalDurationMinutes: Math.round(totalDuration / 60),
        averageDurationSeconds: avgDuration,
      };
    } catch (err: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
    }
  }),

  // ─── AI 客服聊天（文本）───────────────────────────────────────────────
  chat: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(5000),
      leadId: z.string().optional(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Use available AI model to handle customer service chat
        const { MODEL_CONFIGS } = await import("./models");
        const model = MODEL_CONFIGS["deepseek-chat"] || MODEL_CONFIGS["glm-4-flash"];
        if (!model?.apiKey) {
          throw new Error("未配置 AI 模型，无法使用客服聊天功能");
        }

        const systemPrompt = `你是 MaoAI 智能客服，代表猫眼咨询为客户提供专业的咨询服务。

## 你的职责
- 回答客户关于服务、价格、流程等问题
- 帮助客户预约咨询
- 记录客户需求并转交给销售团队
- 提供友好、专业的服务体验

## 服务信息
- 公司：猫眼咨询（MaoAI Consulting）
- 主营业务：AI 解决方案、数字化转型、企业咨询
- 联系方式：可通过平台预约咨询

## 回答原则
- 友好热情，但不卑不亢
- 如果不确定答案，诚实告知并建议转人工
- 所有回答使用中文
- 回答简洁明了，不要过于冗长`;

        const resp = await fetch(`${model.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${model.apiKey}`,
          },
          body: JSON.stringify({
            model: model.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input.message },
            ],
            max_tokens: model.maxTokens,
            temperature: 0.7,
          }),
        });

        if (!resp.ok) {
          throw new Error(`AI 客服响应失败 (${resp.status})`);
        }

        const data = (await resp.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        const reply = data.choices?.[0]?.message?.content || "抱歉，我暂时无法回答您的问题，请稍后再试。";

        // Save chat log
        await dbFetch("/customer_service_chats", {
          method: "POST",
          body: {
            user_id: ctx.user.id,
            message: input.message,
            reply,
            lead_id: input.leadId || null,
            session_id: input.sessionId || null,
            created_at: new Date().toISOString(),
          },
        });

        return { reply, sessionId: input.sessionId };
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  // ─── 客服聊天历史 ──────────────────────────────────────────────────────
  getChatHistory: protectedProcedure
    .input(z.object({
      sessionId: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      try {
        let query = "/customer_service_chats?order=created_at.asc";
        if (input.sessionId) {
          query += `&session_id=eq.${encodeURIComponent(input.sessionId)}`;
        }
        query += `&limit=${input.limit}`;
        const r = await dbFetch(query);
        return (r.data as Record<string, unknown>[]) ?? [];
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  // ─── ElevenLabs 配置状态 ──────────────────────────────────────────────
  getConfigStatus: protectedProcedure.query(async () => {
    const { isElevenLabsConfigured } = await import("./_core/elevenlabs");
    return {
      configured: isElevenLabsConfigured(),
      apiKey: isElevenLabsConfigured() ? "configured" : "not_set",
    };
  }),
});
