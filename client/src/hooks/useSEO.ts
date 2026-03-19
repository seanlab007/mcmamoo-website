/**
 * useSEO — 动态设置页面 meta 标签
 * 支持 og:title / og:description / og:image / twitter card
 */
import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

export function useSEO({ title, description, image, url, type = "website" }: SEOProps) {
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

    // Standard
    setMeta("description", description);

    // Open Graph
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", "猫眼增长引擎 · Mc&Mamoo Brand Management", "property");
    if (url) setMeta("og:url", url, "property");
    if (image) setMeta("og:image", image, "property");

    // Twitter Card
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);

    return () => {
      document.title = "猫眼增长引擎 · Mc&Mamoo Brand Management Inc.";
    };
  }, [title, description, image, url, type]);
}
