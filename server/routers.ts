import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { maoApplications, briefSubscribers } from "../drizzle/schema";
import { z } from "zod";
import { sendBulkEmails, generateNewsletterHtml, sendEmail, generateContactConfirmationHtml, generateContactAdminHtml } from "./email";
import { translateRouter } from "./routers/translate";

export const appRouter = router({
  system: systemRouter,
  translate: translateRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
            subject: `感谢您的咨询申请 — 猫眼增长引擎`,
            html: confirmHtml,
            text: `尊敬的 ${input.name}，感谢您向猫眼增长引擎提交咨询申请。我们将在 1-2 个工作日内与您联系。`,
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
            subject: `猫眼增长引擎新咨询申请：${input.name} / ${input.company}`,
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
        const db = await getDb();
        if (!db) {
          throw new Error("Database unavailable");
        }

        await db.insert(maoApplications).values({
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
      const db = await getDb();
      if (!db) return [];
      const results = await db.select().from(maoApplications).orderBy(maoApplications.createdAt);
      return results;
    }),

    // Subscribe to strategic brief
    subscribeBrief: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        // Upsert to avoid duplicate subscriptions
        await db.insert(briefSubscribers).values({
          email: input.email,
        }).onDuplicateKeyUpdate({ set: { email: input.email } });
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
      const db = await getDb();
      if (!db) return [];
      const results = await db.select().from(briefSubscribers).orderBy(briefSubscribers.createdAt);
      return results;
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
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { eq } = await import("drizzle-orm");
        await db
          .update(maoApplications)
          .set({ status: input.status })
          .where(eq(maoApplications.id, input.id));
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
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { eq } = await import("drizzle-orm");
        await db
          .update(maoApplications)
          .set({ notes: input.notes })
          .where(eq(maoApplications.id, input.id));
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
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const subscribers = await db.select().from(briefSubscribers);
        if (subscribers.length === 0) {
          return { success: true, sent: 0, failed: 0, message: "暂无订阅者" };
        }
        const emails = subscribers.map((s) => s.email);
        const html = generateNewsletterHtml(input.subject, input.content);
        const { success, failed } = await sendBulkEmails(emails, input.subject, html, input.content);
        return { success: true, sent: success, failed, message: `已发送 ${success} 封，失败 ${failed} 封` };
      }),
  }),
});

export type AppRouter = typeof appRouter;
