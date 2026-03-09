import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { maoApplications } from "../drizzle/schema";
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

    // Admin: list all applications (can be protected later)
    listApplications: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const results = await db.select().from(maoApplications).orderBy(maoApplications.createdAt);
      return results;
    }),
  }),
});

export type AppRouter = typeof appRouter;
