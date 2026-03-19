/**
 * useSEO — 动态设置页面 meta 标签（参照 osens.cn SEO 最佳实践增强版）
 * 支持：title / description / keywords / canonical / og / twitter card / JSON-LD
 */
import { useEffect } from "react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  /** 面包屑导航，用于生成 BreadcrumbList 结构化数据 */
  breadcrumbs?: BreadcrumbItem[];
  /** 文章发布时间（ISO 8601） */
  datePublished?: string;
  /** 文章修改时间（ISO 8601） */
  dateModified?: string;
  /** 作者名称 */
  author?: string;
}

const SITE_NAME = "猫眼增长引擎 · Mc&Mamoo Brand Management";
const SITE_URL = "https://www.mcmamoo.com";
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao_eye_logo_1a9f9467.png";

export function useSEO({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  breadcrumbs,
  datePublished,
  dateModified,
  author,
}: SEOProps) {
  useEffect(() => {
    // ── Page title ──────────────────────────────────────────────────────────
    document.title = title;

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    const setJsonLd = (id: string, data: object) => {
      let el = document.querySelector(`script[data-seo-id="${id}"]`) as HTMLScriptElement | null;
      if (!el) {
        el = document.createElement("script");
        el.type = "application/ld+json";
        el.setAttribute("data-seo-id", id);
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    };

    const removeJsonLd = (id: string) => {
      const el = document.querySelector(`script[data-seo-id="${id}"]`);
      if (el) el.remove();
    };

    // ── Standard meta ───────────────────────────────────────────────────────
    setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);

    // ── Canonical ───────────────────────────────────────────────────────────
    if (url) setLink("canonical", url);

    // ── Open Graph ──────────────────────────────────────────────────────────
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    if (url) setMeta("og:url", url, "property");
    if (image) setMeta("og:image", image, "property");
    setMeta("og:locale", "zh_CN", "property");

    // ── Twitter Card ────────────────────────────────────────────────────────
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);

    // ── Breadcrumb JSON-LD ──────────────────────────────────────────────────
    if (breadcrumbs && breadcrumbs.length > 0) {
      setJsonLd("breadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "首页",
            "item": SITE_URL,
          },
          ...breadcrumbs.map((b, i) => ({
            "@type": "ListItem",
            "position": i + 2,
            "name": b.name,
            "item": b.url,
          })),
        ],
      });
    } else {
      removeJsonLd("breadcrumb");
    }

    // ── Article JSON-LD ─────────────────────────────────────────────────────
    if (type === "article") {
      setJsonLd("article", {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "image": image || "",
        "url": url || "",
        "datePublished": datePublished || new Date().toISOString(),
        "dateModified": dateModified || datePublished || new Date().toISOString(),
        "author": {
          "@type": "Person",
          "name": author || "猫眼增长引擎战略研究团队",
        },
        "publisher": {
          "@type": "Organization",
          "name": SITE_NAME,
          "logo": {
            "@type": "ImageObject",
            "url": LOGO_URL,
          },
        },
      });
    } else {
      removeJsonLd("article");
    }

    return () => {
      document.title = "猫眼增长引擎 · Mc&Mamoo Brand Management Inc. | 全球新消费第一品牌管理公司";
    };
  }, [title, description, keywords, image, url, type, breadcrumbs, datePublished, dateModified, author]);
}
