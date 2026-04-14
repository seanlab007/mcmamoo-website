import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  listUsers,
  updateUserRole as dbUpdateUserRole,
  createMaoApplication,
  listMaoApplications,
  updateMaoApplicationStatus,
  updateMaoApplicationNotes,
  subscribeBrief,
  listBriefSubscribers,
  listSubscriberEmails,
  getAiNodes,
  getAiNodeById,
  createAiNode,
  updateAiNode,
  updateNodePingStatus,
  getRoutingRules,
  getNodeSkills,
  getAllNodeSkills,
  upsertNodeSkill,
  deleteNodeSkill,
  deleteAllNodeSkills,
  setNodeSkillEnabled,
  createNodeLog,
} from "./db";
import { dbFetch } from "./aiNodes";
import { MODEL_CONFIGS } from "./models";
import { z } from "zod";
import { sendBulkEmails, generateNewsletterHtml, sendEmail, generateContactConfirmationHtml, generateContactAdminHtml } from "./email";
import { reportMcmamooOrder } from "./_core/maoyan-rewards";
import { autoclipRouter } from "./autoclip";
import { salesRouter } from "./sales";
import { accountingRouter } from "./accounting";
import {
  generateVideo,
  getVideoTaskStatus,
  VIDEO_MODELS,
  type VideoGenerateOptions,
} from "./video";

export const appRouter = router({
  system: systemRouter,
  autoclip: autoclipRouter,
  sales: salesRouter,
  accounting: accountingRouter,
  video: router({
    // 获取可用视频模型列表
    listModels: publicProcedure.query(() => {
      return VIDEO_MODELS;
    }),

    // 文生视频 / 图生视频
    generate: protectedProcedure
      .input(
        z.object({
          prompt: z.string().min(1).max(5000),
          model: z.string().optional(),
          duration: z.number().int().min(1).max(15).optional(),
          aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]).optional(),
          imageUrl: z.string().url().optional(),
          negativePrompt: z.string().max(1000).optional(),
          seed: z.number().int().optional(),
        })
      )
      .mutation(async ({ input }): Promise<{ taskId: string; status: string; error?: string }> => {
        const options: VideoGenerateOptions = {
          prompt: input.prompt,
          model: input.model || "runway-gen4.5",
          duration: input.duration,
          aspectRatio: input.aspectRatio,
          imageUrl: input.imageUrl,
          negativePrompt: input.negativePrompt,
          seed: input.seed,
        };

        const result = await generateVideo(options);
        return {
          taskId: result.taskId,
          status: result.status,
          error: result.error,
        };
      }),

    // 查询任务状态
    getStatus: protectedProcedure
      .input(
        z.object({
          taskId: z.string(),
          provider: z.enum(["runway", "kling", "jimeng"]),
        })
      )
      .query(async ({ input }) => {
        return await getVideoTaskStatus(input.taskId, input.provider);
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    // Admin: list all users
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可查看用户列表" });
      }
      return await listUsers();
    }),
    // Admin: update user role
    updateUserRole: protectedProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          role: z.enum(["user", "admin"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only admins can update user roles
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可操作用户角色" });
        }
        await dbUpdateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // Contact form submission with email notification
  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1).max(128),
          company: z.string().min(1).max(256),
          phone: z.string().min(1).max(64),
          message: z.string().max(2000).optional(),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const adminEmail = process.env.SMTP_USER || "";

        // 1. Send confirmation email to visitor (if they provided email)
        if (input.email) {
          const confirmHtml = generateContactConfirmationHtml(input.name, input.company);
          await sendEmail({
            to: input.email,
            subject: `感谢您的咨询申请 — 猫眼咨询`,
            html: confirmHtml,
            text: `尊敬的 ${input.name}，感谢您向猫眼咨询提交咨询申请。我们将在 1-2 个工作日内与您联系。`,
          });
        }

        // 2. Send notification to admin
        if (adminEmail) {
          const adminHtml = generateContactAdminHtml(
            input.name,
            input.company,
            input.phone,
            input.message ?? ""
          );
          await sendEmail({
            to: adminEmail,
            subject: `猫眼咨询新咨询申请：${input.name} / ${input.company}`,
            html: adminHtml,
          });
        }

        // 3. Also notify via built-in notification
        await notifyOwner({
          title: `新咨询申请：${input.company}`,
          content: `姓名：${input.name}\n公司：${input.company}\n电话：${input.phone}\n需求：${input.message ?? "（无）"}`,
        });

        return { success: true };
      }),
  }),

  // Mao Think Tank consultation application
  mao: router({
    submitApplication: publicProcedure
      .input(
        z.object({
          name: z.string().min(1).max(128),
          organization: z.string().min(1).max(256),
          consultType: z.string().min(1).max(128),
          description: z.string().max(2000).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createMaoApplication({
          name: input.name,
          organization: input.organization,
          consultType: input.consultType,
          description: input.description ?? null,
          status: "pending",
        });

        // Notify owner via built-in notification
        await notifyOwner({
          title: `新毛智库咨询申请：${input.organization}`,
          content: `申请人：${input.name}\n机构：${input.organization}\n咨询方向：${input.consultType}\n说明：${input.description ?? "（无）"}`,
        });

        return { success: true };
      }),

    // Admin: list all applications (protected - admin only)
    listApplications: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问" });
      }
      return await listMaoApplications();
    }),

    // Subscribe to strategic brief
    subscribeBrief: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
        })
      )
      .mutation(async ({ input }) => {
        await subscribeBrief(input.email);
        await notifyOwner({
          title: "新战略简报订阅",
          content: `邮箱：${input.email} 已订阅毛智库战略简报`,
        });
        return { success: true };
      }),

    // Admin: list all subscribers (protected - admin only)
    listSubscribers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问" });
      }
      return await listBriefSubscribers();
    }),

    // Admin: update application status (protected - admin only)
    updateApplicationStatus: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum(["pending", "approved", "rejected", "reviewing"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可操作" });
        }
        await updateMaoApplicationStatus(input.id, input.status);
        return { success: true };
      }),

    // Admin: update application notes (protected - admin only)
    updateApplicationNotes: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          notes: z.string().max(2000),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可操作" });
        }
        await updateMaoApplicationNotes(input.id, input.notes);
        return { success: true };
      }),

    // Admin: send newsletter to all subscribers (protected - admin only)
    sendNewsletter: protectedProcedure
      .input(
        z.object({
          subject: z.string().min(1).max(256),
          content: z.string().min(1).max(10000),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可操作" });
        }
        const emails = await listSubscriberEmails();
        if (emails.length === 0) {
          return { success: true, sent: 0, failed: 0, message: "暂无订阅者" };
        }
        const html = generateNewsletterHtml(input.subject, input.content);
        const { success, failed } = await sendBulkEmails(emails, input.subject, html, input.content);
        return { success: true, sent: success, failed, message: `已发送 ${success} 封，失败 ${failed} 封` };
      }),
  }),

  // ─── AI 模型 / 状态 / 预设 ────────────────────────────────────────────────
  ai: router({
    models: publicProcedure.query(async () => {
      return Object.entries(MODEL_CONFIGS).map(([id, cfg]) => {
        // 本地模型不需要 API Key，只要有配置就可用
        const isLocal = cfg.isLocal ?? false;
        const hasApiKey = !!cfg.apiKey;
        return {
          id,
          name: cfg.name,
          badge: cfg.badge,
          provider: cfg.provider,
          supportsVision: cfg.supportsVision ?? false,
          configured: isLocal || hasApiKey,
          available: isLocal || hasApiKey, // 本地模型总是可用（如果 Ollama 服务运行中）
          isLocal,
        };
      });
    }),
    status: publicProcedure.query(async () => {
      const nodes = await getAiNodes();
      const onlineNodes = nodes.filter((n) => n.isOnline).length;
      return {
        ok: true,
        models: Object.entries(MODEL_CONFIGS).reduce<Record<string, { name: string; configured: boolean; badge: string; isLocal?: boolean }>>((acc, [id, cfg]) => {
          const isLocal = cfg.isLocal ?? false;
          acc[id] = { 
            name: cfg.name, 
            configured: isLocal || !!cfg.apiKey, 
            badge: cfg.badge,
            isLocal,
          };
          return acc;
        }, {}),
        nodes: { total: nodes.length, online: onlineNodes },
        timestamp: new Date().toISOString(),
      };
    }),
    presets: publicProcedure.query(async () => {
      const r = await dbFetch("/system_prompts?is_active=eq.true&order=sort_order.asc");
      return (r.data as Record<string, unknown>[]) ?? [];
    }),
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({ role: z.string(), content: z.string() })),
        modelId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Lightweight passthrough — actual streaming handled by /api/ai/stream REST endpoint
        return { message: "Use /api/ai/stream for streaming chat", modelId: input.modelId };
      }),
  }),

  // ─── AI 节点管理 ─────────────────────────────────────────────────────────
  nodes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return await getAiNodes();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        baseUrl: z.string().url(),
        token: z.string(),
        type: z.string().optional(),
        modelId: z.string().optional(),
        isLocal: z.boolean().optional(),
        isPaid: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return await createAiNode({ ...input, isOnline: false });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: z.string().optional(),
        baseUrl: z.string().url().optional(),
        token: z.string().optional(),
        isActive: z.boolean().optional(),
        isPaid: z.boolean().optional(),
        isLocal: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await updateAiNode(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await dbFetch(`/ai_nodes?id=eq.${input.id}`, { method: "DELETE" });
        return { success: true };
      }),
    ping: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const node = await getAiNodeById(input.id);
        if (!node) throw new TRPCError({ code: "NOT_FOUND" });
        try {
          const t0 = Date.now();
          const res = await fetch(`${node.baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
          const pingMs = Date.now() - t0;
          await updateNodePingStatus(input.id, res.ok, pingMs);
          return { ok: res.ok, online: res.ok, latency: pingMs, pingMs };
        } catch {
          await updateNodePingStatus(input.id, false);
          return { ok: false, online: false, latency: null, pingMs: null };
        }
      }),
    getSkills: protectedProcedure
      .input(z.object({ nodeId: z.number().int().positive().optional() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const skills = input.nodeId ? await getNodeSkills(input.nodeId) : await getAllNodeSkills();
        return { skills };
      }),
    toggleSkill: protectedProcedure
      .input(z.object({
        nodeId: z.number().int().positive(),
        skillId: z.string(),
        isEnabled: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await setNodeSkillEnabled(input.nodeId, input.skillId, input.isEnabled);
        return { success: true };
      }),
  }),

  // ─── 路由规则 ─────────────────────────────────────────────────────────────
  routing: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return await getRoutingRules();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        mode: z.string(),
        nodeIds: z.string().optional(),
        priority: z.number().optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
        failover: z.boolean().optional(),
        loadBalance: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const r = await dbFetch("/routing_rules", { method: "POST", body: input }, "return=representation");
        return (r.data as Record<string, unknown>[])?.[0] ?? null;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: z.string().optional(),
        mode: z.string().optional(),
        nodeIds: z.string().optional(),
        priority: z.number().optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
        failover: z.boolean().optional(),
        loadBalance: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await dbFetch(`/routing_rules?id=eq.${id}`, { method: "PATCH", body: data });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await dbFetch(`/routing_rules?id=eq.${input.id}`, { method: "DELETE" });
        return { success: true };
      }),
  }),

  // ─── 计费 / 订阅 ──────────────────────────────────────────────────────────
  billing: router({
    mySubscription: protectedProcedure.query(async ({ ctx }) => {
      const r = await dbFetch(`/user_subscriptions?open_id=eq.${encodeURIComponent(ctx.user.openId)}&limit=1`);
      const rows = r.data as Record<string, unknown>[] | null;
      const row = rows?.[0];
      // Return a strongly-typed subscription object so the client has proper TS inference
      return {
        tier: (row?.tier as string | undefined) ?? (row?.plan as string | undefined) ?? "free",
        plan: (row?.plan as string | undefined) ?? "free",
        limits: (row?.limits as {
          dailyChatMessages: number;
          imageGeneration: boolean;
          dailyImageGenerations: number;
          premiumModels: boolean;
          [key: string]: unknown;
        } | undefined) ?? {
          dailyChatMessages: 20,
          imageGeneration: false,
          dailyImageGenerations: 0,
          premiumModels: false,
        },
        usage: (row?.usage as {
          chatMessages: number;
          imageGenerations: number;
          [key: string]: unknown;
        } | undefined) ?? {
          chatMessages: 0,
          imageGenerations: 0,
        },
        contentQuota: (row?.content_quota as number | undefined) ?? 5,
        contentUsed: (row?.content_used as number | undefined) ?? 0,
      };
    }),
    createOrder: protectedProcedure
      .input(z.object({
        plan: z.enum(["content", "strategic"]),
        amount: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const r = await dbFetch("/orders", {
          method: "POST",
          body: {
            user_open_id: ctx.user.openId,
            plan: input.plan,
            amount: input.amount ?? 0,
            status: "pending",
            created_at: new Date().toISOString(),
          },
        }, "return=representation");
        const rows = r.data as Record<string, unknown>[] | null;
        return rows?.[0] ?? null;
      }),
  }),

  // ─── 对话历史 ─────────────────────────────────────────────────────────────
  conversations: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 50;
        const r = await dbFetch(
          `/conversations?open_id=eq.${encodeURIComponent(ctx.user.openId)}&order=updated_at.desc&limit=${limit}`
        );
        return (r.data as Record<string, unknown>[]) ?? [];
      }),
    create: protectedProcedure
      .input(z.object({ title: z.string().optional(), model: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const r = await dbFetch("/conversations", {
          method: "POST",
          body: {
            open_id: ctx.user.openId,
            title: input.title ?? "新对话",
            model: input.model ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }, "return=representation");
        const rows = r.data as Record<string, unknown>[] | null;
        return rows?.[0] ?? null;
      }),
    update: protectedProcedure
      .input(z.object({ id: z.union([z.string(), z.number()]), title: z.string().optional(), model: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const id = String(input.id);
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (input.title !== undefined) patch.title = input.title;
        if (input.model !== undefined) patch.model = input.model;
        await dbFetch(
          `/conversations?id=eq.${id}&open_id=eq.${encodeURIComponent(ctx.user.openId)}`,
          { method: "PATCH", body: patch }
        );
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.union([z.string(), z.number()]) }))
      .mutation(async ({ input, ctx }) => {
        const id = String(input.id);
        await dbFetch(
          `/conversations?id=eq.${id}&open_id=eq.${encodeURIComponent(ctx.user.openId)}`,
          { method: "DELETE" }
        );
        return { success: true };
      }),
  }),

  // ─── 消息记录 ─────────────────────────────────────────────────────────────
  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.union([z.string(), z.number()]), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const convId = String(input.conversationId);
        const limit = input.limit ?? 100;
        const r = await dbFetch(
          `/messages?conversation_id=eq.${encodeURIComponent(convId)}&order=created_at.asc&limit=${limit}`
        );
        return (r.data as Record<string, unknown>[]) ?? [];
      }),
    save: protectedProcedure
      .input(z.object({
        conversationId: z.union([z.string(), z.number()]),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        modelId: z.string().optional(),
        model: z.string().optional(), // alias for modelId
      }))
      .mutation(async ({ input }) => {
        const convId = String(input.conversationId);
        const r = await dbFetch("/messages", {
          method: "POST",
          body: {
            conversation_id: convId,
            role: input.role,
            content: input.content,
            model_id: input.modelId ?? input.model ?? null,
            created_at: new Date().toISOString(),
          },
        }, "return=representation");
        const rows = r.data as Record<string, unknown>[] | null;
        return rows?.[0] ?? null;
      }),
  }),

  // ─── 千禧钟预约 ──────────────────────────────────────────────────────────
  millenniumClock: router({
    createReservation: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(64),
        phone: z.string().min(1).max(32),
        email: z.string().email().optional(),
        message: z.string().max(500).optional(),
        visitDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const r = await dbFetch("/millennium_clock_reservations", {
          method: "POST",
          body: { ...input, status: "pending", created_at: new Date().toISOString() },
        }, "return=representation");
        const rows = r.data as Record<string, unknown>[] | null;
        await notifyOwner({
          title: `千禧钟新预约：${input.name}`,
          content: `姓名：${input.name}\n电话：${input.phone}\n邮箱：${input.email ?? "（无）"}\n留言：${input.message ?? "（无）"}`,
        });
        return { success: true, id: rows?.[0]?.id };
      }),
    getReservations: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const r = await dbFetch("/millennium_clock_reservations?order=created_at.desc");
      return (r.data as Record<string, unknown>[]) ?? [];
    }),
  }),

  // ─── 咨询询价 ─────────────────────────────────────────────────────────────
  consulting: router({
    createInquiry: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        company: z.string().max(256).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(64).optional(),
        service: z.string().max(256).optional(),
        message: z.string().max(5000).optional(),
      }))
      .mutation(async ({ input }) => {
        const r = await dbFetch("/consulting_inquiries", {
          method: "POST",
          body: { ...input, status: "pending", created_at: new Date().toISOString() },
        }, "return=representation");
        const rows = r.data as Record<string, unknown>[] | null;
        await notifyOwner({
          title: `新咨询询价：${input.company ?? input.name}`,
          content: `姓名：${input.name}\n公司：${input.company ?? "（无）"}\n邮箱：${input.email ?? "（无）"}\n服务：${input.service ?? "（无）"}`,
        });
        return { success: true, id: rows?.[0]?.id };
      }),
    getInquiries: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const r = await dbFetch("/consulting_inquiries?order=created_at.desc");
      return (r.data as Record<string, unknown>[]) ?? [];
    }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.string(), // flexible status: pending/contacted/closed/new/signed/dropped/etc
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await dbFetch(`/consulting_inquiries?id=eq.${input.id}`, {
          method: "PATCH",
          body: { status: input.status, notes: input.notes ?? null, updated_at: new Date().toISOString() },
        });
        return { success: true };
      }),
  }),

  // ─── 节点日志 ─────────────────────────────────────────────────────────────
  logs: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const limit = input?.limit ?? 100;
        const r = await dbFetch(`/node_logs?order=created_at.desc&limit=${limit}`);
        return (r.data as Record<string, unknown>[]) ?? [];
      }),
  }),
});

export type AppRouter = typeof appRouter;
