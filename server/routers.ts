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
} from "./db";
import { z } from "zod";
import { sendBulkEmails, generateNewsletterHtml, sendEmail, generateContactConfirmationHtml, generateContactAdminHtml } from "./email";
import { reportMcmamooOrder } from "./_core/maoyan-rewards";
import { autoclipRouter } from "./autoclip";
import { salesRouter } from "./sales";

export const appRouter = router({
  system: systemRouter,
  autoclip: autoclipRouter,
  sales: salesRouter,
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
});

export type AppRouter = typeof appRouter;
