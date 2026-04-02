/**
 * Research Digest Router
 * ─────────────────────────────────────────────────────────────────────────────
 * 提供信息搜索 API：HBR 管理学简报 + arXiv/PubMed 学术论文
 * 集成到 MaoAI 后端
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import {
  fetchHbrItems,
  fetchArxivItems,
  fetchAllDigests,
  formatDigestForAI,
  type DigestResult,
} from "./research-digest";

// ─── 简单内存缓存（避免频繁抓取）────────────────────────────────────────────
let _cachedDigest: DigestResult | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 分钟缓存

function isCacheValid(): boolean {
  return _cachedDigest !== null && Date.now() - _cacheTimestamp < CACHE_TTL_MS;
}

export const researchDigestRouter = router({

  /**
   * 获取最新摘要（带缓存，30 分钟内不重复抓取）
   */
  getDigest: publicProcedure
    .input(
      z.object({
        forceRefresh: z.boolean().optional().default(false),
        includeHbr: z.boolean().optional().default(true),
        includeScience: z.boolean().optional().default(true),
        maxHbr: z.number().int().min(1).max(20).optional().default(5),
        maxScience: z.number().int().min(1).max(100).optional().default(40),
      })
    )
    .query(async ({ input }) => {
      if (!input.forceRefresh && isCacheValid() && _cachedDigest) {
        return {
          ...(_cachedDigest),
          fromCache: true,
          cacheAge: Math.floor((Date.now() - _cacheTimestamp) / 1000),
        };
      }

      const digest = await fetchAllDigests({
        includeHbr: input.includeHbr,
        includeScience: input.includeScience,
        maxHbr: input.maxHbr,
        maxScience: input.maxScience,
      });

      _cachedDigest = digest;
      _cacheTimestamp = Date.now();

      return { ...digest, fromCache: false, cacheAge: 0 };
    }),

  /**
   * 格式化摘要为 AI 可读文本（用于 AI 提炼总结）
   */
  getFormattedForAI: publicProcedure
    .input(
      z.object({
        mode: z.enum(["hbr", "science", "maoyan", "all"]).optional().default("all"),
        forceRefresh: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      if (!input.forceRefresh && isCacheValid() && _cachedDigest) {
        return {
          text: formatDigestForAI(_cachedDigest, input.mode),
          fetchedAt: _cachedDigest.fetchedAt,
          fromCache: true,
        };
      }

      const digest = await fetchAllDigests();
      _cachedDigest = digest;
      _cacheTimestamp = Date.now();

      return {
        text: formatDigestForAI(digest, input.mode),
        fetchedAt: digest.fetchedAt,
        fromCache: false,
      };
    }),

  /**
   * 仅搜索 HBR（快速返回）
   */
  searchHbr: publicProcedure
    .input(
      z.object({
        maxPerFeed: z.number().int().min(1).max(10).optional().default(5),
      })
    )
    .query(async ({ input }) => {
      const items = await fetchHbrItems(input.maxPerFeed);
      return { items, fetchedAt: new Date().toISOString() };
    }),

  /**
   * 搜索 arXiv 特定学科
   */
  searchArxiv: publicProcedure
    .input(
      z.object({
        categories: z.array(z.string()).optional(),
        keywords: z.string().optional(),
        maxResults: z.number().int().min(1).max(50).optional().default(20),
      })
    )
    .query(async ({ input }) => {
      const items = await fetchArxivItems(input.maxResults);
      // 如果有关键词过滤
      const filtered = input.keywords
        ? items.filter(
            (i) =>
              i.title.toLowerCase().includes(input.keywords!.toLowerCase()) ||
              i.summary.toLowerCase().includes(input.keywords!.toLowerCase())
          )
        : items;
      return { items: filtered, fetchedAt: new Date().toISOString() };
    }),

  /**
   * 获取与猫眼业务相关的研究摘要
   */
  getMaoyanRelevant: publicProcedure
    .input(
      z.object({
        minScore: z.number().int().min(0).max(100).optional().default(15),
        limit: z.number().int().min(1).max(30).optional().default(10),
        forceRefresh: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      let digest: DigestResult;
      if (!input.forceRefresh && isCacheValid() && _cachedDigest) {
        digest = _cachedDigest;
      } else {
        digest = await fetchAllDigests();
        _cachedDigest = digest;
        _cacheTimestamp = Date.now();
      }

      const relevant = digest.maoyanRelevantItems
        .filter((i) => i.relevanceScore >= input.minScore)
        .slice(0, input.limit);

      return {
        items: relevant,
        fetchedAt: digest.fetchedAt,
        total: relevant.length,
      };
    }),

  /**
   * 清除缓存（管理员操作）
   */
  clearCache: protectedProcedure.mutation(() => {
    _cachedDigest = null;
    _cacheTimestamp = 0;
    return { success: true, message: "研究摘要缓存已清除" };
  }),
});

export type ResearchDigestRouter = typeof researchDigestRouter;
