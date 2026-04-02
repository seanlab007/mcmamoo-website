/**
 * Research Digest Service
 * ─────────────────────────────────────────────────────────────────────────────
 * 定期抓取 HBR 管理学简报 + 学术期刊（arXiv / PubMed）最新内容，
 * 并通过 AI 提炼核心理念，与猫眼业务场景关联。
 *
 * 数据源：
 *   - HBR RSS Feed（管理学）
 *   - arXiv API（数学/物理/化学/生物）
 *   - PubMed API（生物医学）
 *   - Semantic Scholar API（跨学科）
 */

import * as https from "https";
import * as http from "http";

// ─── 猫眼业务关键词（用于相关性过滤）───────────────────────────────────────
const MAOYAN_KEYWORDS = [
  "movie", "film", "cinema", "theater", "ticket", "audience", "entertainment",
  "streaming", "media", "content", "recommendation", "prediction",
  "box office", "consumer behavior", "sentiment", "rating",
  "computer vision", "image recognition", "natural language",
  "data mining", "machine learning", "neural network",
  "social network", "viral", "marketing", "pricing",
  "demand forecast", "time series", "user behavior",
  // 中文关键词（部分摘要含中文翻译）
  "电影", "影院", "票房", "观众", "流媒体", "内容推荐",
];

// ─── HBR RSS Feeds ─────────────────────────────────────────────────────────

const HBR_RSS_FEEDS = [
  {
    name: "HBR Latest",
    url: "https://hbr.org/rss/the-latest",
    category: "management",
  },
  {
    name: "HBR Leadership & Managing People",
    url: "https://hbr.org/rss/topic/leadership",
    category: "leadership",
  },
  {
    name: "HBR Strategy",
    url: "https://hbr.org/rss/topic/strategy",
    category: "strategy",
  },
  {
    name: "HBR Innovation",
    url: "https://hbr.org/rss/topic/innovation",
    category: "innovation",
  },
  {
    name: "HBR Technology",
    url: "https://hbr.org/rss/topic/technology",
    category: "technology",
  },
];

// ─── arXiv 学科分类 ──────────────────────────────────────────────────────────

const ARXIV_CATEGORIES = [
  // 数学
  { cat: "math.ST", name: "数学·统计学", maxResults: 5 },
  { cat: "math.OC", name: "数学·最优化控制", maxResults: 5 },
  // 物理
  { cat: "physics.data-an", name: "物理·数据分析", maxResults: 5 },
  // 计算机（AI/ML，与猫眼最相关）
  { cat: "cs.AI", name: "计算机·人工智能", maxResults: 10 },
  { cat: "cs.LG", name: "计算机·机器学习", maxResults: 10 },
  { cat: "cs.IR", name: "计算机·信息检索/推荐系统", maxResults: 8 },
  { cat: "cs.CV", name: "计算机·计算机视觉", maxResults: 5 },
  // 生物
  { cat: "q-bio.NC", name: "生物·神经科学", maxResults: 5 },
  { cat: "q-bio.GN", name: "生物·基因组学", maxResults: 3 },
  // 经济/定量金融（与票务定价相关）
  { cat: "econ.EM", name: "经济·计量经济学", maxResults: 5 },
  { cat: "q-fin.GN", name: "量化金融·综合", maxResults: 3 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DigestItem {
  id: string;
  source: "hbr" | "arxiv" | "pubmed";
  category: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  relevanceScore: number; // 0-100，与猫眼业务相关度
  keywords: string[];
}

export interface DigestResult {
  fetchedAt: string;
  hbrItems: DigestItem[];
  scienceItems: DigestItem[];
  maoyanRelevantItems: DigestItem[];
  aiSummary?: string;
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

function fetchUrl(url: string, timeoutMs = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout: ${url}`));
    });
  });
}

// ─── RSS Parser（简单 XML 解析）─────────────────────────────────────────────

function parseRssItems(xml: string): Array<{
  title: string;
  description: string;
  link: string;
  pubDate: string;
}> {
  const items: Array<{ title: string; description: string; link: string; pubDate: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = (/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(itemXml) ||
                   /<title[^>]*>([\s\S]*?)<\/title>/.exec(itemXml))?.[1] ?? "";
    const description = (/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(itemXml) ||
                         /<description[^>]*>([\s\S]*?)<\/description>/.exec(itemXml))?.[1] ?? "";
    const link = (/<link>([\s\S]*?)<\/link>/.exec(itemXml))?.[1] ?? "";
    const pubDate = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml))?.[1] ?? "";
    if (title) {
      items.push({
        title: title.replace(/<[^>]+>/g, "").trim(),
        description: description.replace(/<[^>]+>/g, "").substring(0, 500).trim(),
        link: link.trim(),
        pubDate: pubDate.trim(),
      });
    }
  }
  return items;
}

// ─── Relevance Score ─────────────────────────────────────────────────────────

function calcRelevanceScore(text: string): { score: number; matched: string[] } {
  const lowerText = text.toLowerCase();
  const matched: string[] = [];
  for (const kw of MAOYAN_KEYWORDS) {
    if (lowerText.includes(kw.toLowerCase())) {
      matched.push(kw);
    }
  }
  const score = Math.min(100, matched.length * 15);
  return { score, matched };
}

// ─── HBR Fetcher ─────────────────────────────────────────────────────────────

export async function fetchHbrItems(maxPerFeed = 5): Promise<DigestItem[]> {
  const results: DigestItem[] = [];

  for (const feed of HBR_RSS_FEEDS) {
    try {
      const xml = await fetchUrl(feed.url);
      const items = parseRssItems(xml).slice(0, maxPerFeed);

      for (const item of items) {
        const text = `${item.title} ${item.description}`;
        const { score, matched } = calcRelevanceScore(text);
        results.push({
          id: `hbr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          source: "hbr",
          category: feed.category,
          title: item.title,
          summary: item.description,
          url: item.link,
          publishedAt: item.pubDate || new Date().toISOString(),
          relevanceScore: score,
          keywords: matched,
        });
      }
    } catch (e) {
      console.warn(`[ResearchDigest] HBR feed failed: ${feed.name}`, e);
    }
  }

  return results;
}

// ─── arXiv Fetcher ───────────────────────────────────────────────────────────

export async function fetchArxivItems(maxTotal = 50): Promise<DigestItem[]> {
  const results: DigestItem[] = [];

  // 获取7天内的论文
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const dateStr = sevenDaysAgo.toISOString().split("T")[0].replace(/-/g, "");

  for (const cat of ARXIV_CATEGORIES) {
    if (results.length >= maxTotal) break;
    try {
      // arXiv API: 按分类搜索最新论文
      const url = `https://export.arxiv.org/api/query?search_query=cat:${cat.cat}&start=0&max_results=${cat.maxResults}&sortBy=submittedDate&sortOrder=descending`;
      const xml = await fetchUrl(url, 15000);

      // 解析 Atom XML
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;
      while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];
        const title = (/<title>([\s\S]*?)<\/title>/.exec(entry))?.[1]?.replace(/\s+/g, " ").trim() ?? "";
        const summary = (/<summary>([\s\S]*?)<\/summary>/.exec(entry))?.[1]?.replace(/\s+/g, " ").substring(0, 600).trim() ?? "";
        const id = (/<id>([\s\S]*?)<\/id>/.exec(entry))?.[1]?.trim() ?? "";
        const published = (/<published>([\s\S]*?)<\/published>/.exec(entry))?.[1]?.trim() ?? "";

        if (!title) continue;

        const text = `${title} ${summary}`;
        const { score, matched } = calcRelevanceScore(text);

        results.push({
          id: `arxiv-${id.split("/").pop() ?? Math.random().toString(36).substr(2, 8)}`,
          source: "arxiv",
          category: cat.name,
          title,
          summary,
          url: id,
          publishedAt: published,
          relevanceScore: score,
          keywords: matched,
        });
      }
    } catch (e) {
      console.warn(`[ResearchDigest] arXiv fetch failed for ${cat.cat}`, e);
    }

    // 礼貌性延迟，避免被封
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

// ─── PubMed Fetcher ──────────────────────────────────────────────────────────

export async function fetchPubmedItems(
  keywords = ["machine learning cinema", "AI recommendation system", "consumer behavior prediction"],
  maxResults = 5
): Promise<DigestItem[]> {
  const results: DigestItem[] = [];

  for (const kw of keywords) {
    try {
      const query = encodeURIComponent(`${kw}[Title/Abstract]`);
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&retmax=${maxResults}&sort=date&retmode=json`;
      const searchData = await fetchUrl(searchUrl);
      const searchJson = JSON.parse(searchData);
      const ids: string[] = searchJson?.esearchresult?.idlist ?? [];

      if (ids.length === 0) continue;

      // 获取摘要
      const fetchUrl2 = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.slice(0, 3).join(",")}&retmode=xml`;
      const xml = await fetchUrl(fetchUrl2, 15000);

      // 解析 PubMed XML
      const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
      let match;
      while ((match = articleRegex.exec(xml)) !== null) {
        const article = match[1];
        const title = (/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/.exec(article))?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
        const abstract = (/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/.exec(article))?.[1]?.replace(/<[^>]+>/g, "").substring(0, 500).trim() ?? "";
        const pmid = (/<PMID Version="1">([\s\S]*?)<\/PMID>/.exec(article))?.[1]?.trim() ?? "";

        if (!title) continue;

        const text = `${title} ${abstract}`;
        const { score, matched } = calcRelevanceScore(text);

        results.push({
          id: `pubmed-${pmid}`,
          source: "pubmed",
          category: "生物医学",
          title,
          summary: abstract,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          publishedAt: new Date().toISOString(),
          relevanceScore: score,
          keywords: matched,
        });
      }
    } catch (e) {
      console.warn(`[ResearchDigest] PubMed fetch failed for: ${kw}`, e);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

// ─── Main Digest Fetcher ─────────────────────────────────────────────────────

export async function fetchAllDigests(options?: {
  includeHbr?: boolean;
  includeScience?: boolean;
  maxHbr?: number;
  maxScience?: number;
}): Promise<DigestResult> {
  const opts = {
    includeHbr: true,
    includeScience: true,
    maxHbr: 5,
    maxScience: 50,
    ...options,
  };

  const [hbrItems, arxivItems, pubmedItems] = await Promise.allSettled([
    opts.includeHbr ? fetchHbrItems(opts.maxHbr) : Promise.resolve([]),
    opts.includeScience ? fetchArxivItems(opts.maxScience) : Promise.resolve([]),
    opts.includeScience
      ? fetchPubmedItems(
          ["machine learning movie recommendation", "AI entertainment", "box office prediction"],
          5
        )
      : Promise.resolve([]),
  ]);

  const hbr = hbrItems.status === "fulfilled" ? hbrItems.value : [];
  const arxiv = arxivItems.status === "fulfilled" ? arxivItems.value : [];
  const pubmed = pubmedItems.status === "fulfilled" ? pubmedItems.value : [];

  const scienceItems = [...arxiv, ...pubmed];

  // 与猫眼相关的筛选（relevanceScore > 0 或关键词命中）
  const maoyanRelevantItems = [
    ...hbr.filter((i) => i.relevanceScore >= 15),
    ...scienceItems.filter((i) => i.relevanceScore >= 15),
  ].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 20);

  return {
    fetchedAt: new Date().toISOString(),
    hbrItems: hbr,
    scienceItems,
    maoyanRelevantItems,
  };
}

// ─── Format for AI Summarization ─────────────────────────────────────────────

export function formatDigestForAI(digest: DigestResult, mode: "hbr" | "science" | "maoyan" | "all" = "all"): string {
  const sections: string[] = [];

  if ((mode === "hbr" || mode === "all") && digest.hbrItems.length > 0) {
    sections.push("## 📊 哈佛商业评论 (HBR) 最新简报\n");
    for (const item of digest.hbrItems.slice(0, 10)) {
      sections.push(`### ${item.title}\n分类：${item.category}\n摘要：${item.summary}\n链接：${item.url}\n`);
    }
  }

  if ((mode === "science" || mode === "all") && digest.scienceItems.length > 0) {
    sections.push("## 🔬 学术期刊最新论文\n");
    // 按分类分组
    const grouped: Record<string, DigestItem[]> = {};
    for (const item of digest.scienceItems.slice(0, 30)) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
    for (const [cat, items] of Object.entries(grouped)) {
      sections.push(`### ${cat}`);
      for (const item of items.slice(0, 3)) {
        sections.push(`- **${item.title}**\n  摘要：${item.summary.substring(0, 200)}...\n  链接：${item.url}`);
      }
      sections.push("");
    }
  }

  if ((mode === "maoyan" || mode === "all") && digest.maoyanRelevantItems.length > 0) {
    sections.push("## 🐱 与猫眼业务相关的研究\n");
    for (const item of digest.maoyanRelevantItems.slice(0, 10)) {
      sections.push(`### ${item.title}\n来源：${item.source.toUpperCase()} | 相关度：${item.relevanceScore}/100\n关键词：${item.keywords.join(", ")}\n摘要：${item.summary.substring(0, 300)}...\n链接：${item.url}\n`);
    }
  }

  return sections.join("\n") || "暂无内容";
}
