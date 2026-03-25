/*
 * Breadcrumb — 面包屑导航组件
 * 支持SEO结构化数据渲染，提升用户体验和搜索引擎理解
 */
import { Link } from "wouter";

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** 是否包含结构化数据标记 */
  withSchema?: boolean;
}

export default function Breadcrumb({ items, withSchema = true }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="面包屑导航"
      className="py-4 px-4 sm:px-6 lg:px-8"
      style={{ background: "rgba(10,10,10,0.5)" }}
    >
      <ol
        className="flex flex-wrap items-center gap-2 text-xs"
        style={{ color: "rgba(255,255,255,0.4)" }}
        {...(withSchema && {
          itemScope: true,
          itemType: "https://schema.org/BreadcrumbList",
        })}
      >
        {/* 首页 */}
        <li
          {...(withSchema && {
            itemProp: "itemListElement",
            itemScope: true,
            itemType: "https://schema.org/ListItem",
          })}
        >
          <Link href="/">
            <a
              className="hover:text-[#C9A84C] transition-colors"
              {...(withSchema && {
                itemProp: "item",
              })}
            >
              <span {...(withSchema && { itemProp: "name" })}>首页</span>
            </a>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        <span className="text-white/20">/</span>

        {/* 其他面包屑项 */}
        {items.map((item, index) => {
          const position = index + 2;
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              className="flex items-center gap-2"
              {...(withSchema && {
                itemProp: "itemListElement",
                itemScope: true,
                itemType: "https://schema.org/ListItem",
              })}
            >
              {item.url && !isLast ? (
                <Link href={item.url}>
                  <a
                    className="hover:text-[#C9A84C] transition-colors"
                    {...(withSchema && { itemProp: "item" })}
                  >
                    <span {...(withSchema && { itemProp: "name" })}>{item.name}</span>
                  </a>
                </Link>
              ) : (
                <span
                  className={isLast ? "text-white/60" : ""}
                  {...(withSchema && { itemProp: "name" })}
                >
                  {item.name}
                </span>
              )}
              <meta itemProp="position" content={String(position)} />
              {!isLast && <span className="text-white/20">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
