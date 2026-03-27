/**
 * useSEO — 动态设置页面 meta 标签
 * 支持 og:title / og:description / og:image / twitter card / canonical / keywords / JSON-LD
 */
import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  keywords?: string;
  /** JSON-LD structured data object(s) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** BreadcrumbList items */
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const SITE_NAME = "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine) · Mc&Mamoo Brand Management Inc.";
const BASE_URL = "https://www.mcmamoo.com";

export function useSEO({
  title,
  description,
  image,
  url,
  type = "website",
  keywords,
  jsonLd,
  breadcrumbs,
}: SEOProps) {
  useEffect(() => {
    // Page title
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
      const existing = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (existing) {
        existing.href = href;
      } else {
        const el = document.createElement("link");
        el.rel = rel;
        el.href = href;
        document.head.appendChild(el);
      }
    };

    // Canonical
    if (url) setLink("canonical", url.startsWith("http") ? url : `${BASE_URL}${url}`);

    // Standard
    setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);

    // Open Graph
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    if (url) setMeta("og:url", url.startsWith("http") ? url : `${BASE_URL}${url}`, "property");
    if (image) {
      setMeta("og:image", image, "property");
      setMeta("og:image:alt", title, "property");
    }

    // Twitter Card
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);

    // JSON-LD injection
    const injectJsonLd = (id: string, data: Record<string, unknown>) => {
      let el = document.querySelector(`script[data-seo-id="${id}"]`) as HTMLScriptElement | null;
      if (!el) {
        el = document.createElement("script");
        el.type = "application/ld+json";
        el.setAttribute("data-seo-id", id);
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    };

    // Remove old dynamic JSON-LD scripts
    document.querySelectorAll('script[data-seo-id]').forEach((el) => el.remove());

    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((item, i) => injectJsonLd(`dynamic-${i}`, item));
    }

    // Breadcrumb structured data
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.url.startsWith("http") ? crumb.url : `${BASE_URL}${crumb.url}`,
        })),
      };
      injectJsonLd("breadcrumb", breadcrumbData as Record<string, unknown>);
    }

    return () => {
      document.title = SITE_NAME;
      document.querySelectorAll('script[data-seo-id]').forEach((el) => el.remove());
    };
  }, [title, description, image, url, type, keywords, jsonLd, breadcrumbs]);
}
