import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { maoApplications, briefSubscribers } from "../drizzle/schema";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
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
  }),
});

export type AppRouter = typeof appRouter;
