import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";

// AutoClip API - 代理到外部 AutoClip 服务
// 在生产环境中，这应该指向部署的 AutoClip 后端 URL
const AUTOCLIP_API_URL = process.env.AUTOCLIP_API_URL || "http://localhost:8000";

export const autoclipRouter = router({
  // 获取项目列表
  listProjects: publicProcedure.query(async () => {
    try {
      const response = await fetch(`${AUTOCLIP_API_URL}/api/v1/projects`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch projects");
      return await response.json();
    } catch (error) {
      console.error("AutoClip API error:", error);
      // 返回模拟数据用于开发
      return {
        items: [],
        total: 0,
      };
    }
  }),

  // 创建新项目
  createProject: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        platform: z.enum(["youtube", "bilibili", "local"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${AUTOCLIP_API_URL}/api/v1/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: input.url,
            platform: input.platform,
          }),
        });
        if (!response.ok) throw new Error("Failed to create project");
        return await response.json();
      } catch (error) {
        console.error("AutoClip API error:", error);
        // 返回模拟数据用于开发
        return {
          id: Date.now().toString(),
          status: "pending",
          url: input.url,
          platform: input.platform,
        };
      }
    }),

  // 获取项目详情
  getProject: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const response = await fetch(
          `${AUTOCLIP_API_URL}/api/v1/projects/${input.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch project");
        return await response.json();
      } catch (error) {
        console.error("AutoClip API error:", error);
        return null;
      }
    }),

  // 解析 YouTube 视频
  parseYouTube: publicProcedure
    .input(z.object({ url: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(
          `${AUTOCLIP_API_URL}/api/v1/youtube/parse`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: input.url }),
          }
        );
        if (!response.ok) throw new Error("Failed to parse YouTube video");
        return await response.json();
      } catch (error) {
        console.error("AutoClip API error:", error);
        return {
          title: "视频解析",
          duration: 0,
          thumbnail: "",
        };
      }
    }),

  // 解析 Bilibili 视频
  parseBilibili: publicProcedure
    .input(z.object({ url: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(
          `${AUTOCLIP_API_URL}/api/v1/bilibili/parse`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: input.url }),
          }
        );
        if (!response.ok) throw new Error("Failed to parse Bilibili video");
        return await response.json();
      } catch (error) {
        console.error("AutoClip API error:", error);
        return {
          title: "视频解析",
          duration: 0,
          thumbnail: "",
        };
      }
    }),

  // 开始处理项目
  processProject: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(
          `${AUTOCLIP_API_URL}/api/v1/projects/${input.id}/process`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to process project");
        return await response.json();
      } catch (error) {
        console.error("AutoClip API error:", error);
        return { success: true, status: "processing" };
      }
    }),

  // 获取处理状态
  getProjectStatus: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const response = await fetch(
          `${AUTOCLIP_API_URL}/api/v1/projects/${input.id}/status`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to get status");
        return await response.json();
      } catch (error) {
        console.error("AutoClip API error:", error);
        return {
          status: "unknown",
          progress: 0,
        };
      }
    }),
});