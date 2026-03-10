/*
 * RelatedCases — 相关案例推荐组件（SEO 内链优化版）
 * 在每个案例详情页底部展示其余全部案例卡片，提升整站内链权重
 * 参照 osens.cn 的相关内容推荐策略：展示封面图 + 品牌名 + 行业 + 核心成果
 */
import { Link } from "wouter";

export interface RelatedCase {
  brand: string;
  category: string;
  result: string;
  href: string;
  accent: string;
  cover: string;
  tag: string;
}

const ALL_CASES: Record<string, RelatedCase> = {
  xietaitai: {
    brand: "蟹太太大闸蟹",
    category: "生鲜 · 品牌化",
    result: "从0孵化到年营收8亿，全网蟹券销量连续多年第一",
    href: "/cases/xietaitai",
    accent: "#C9A84C",
    cover: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hero-video-frame1-9AHtkPtKZTrG9N5GhnTvLQ.png",
    tag: "0→8亿",
  },
  xiaoxiandun: {
    brand: "小仙炖鲜炖燕窝",
    category: "滋补 · 新消费",
    result: "5年营收突破20亿，天猫燕窝品类第一品牌",
    href: "/cases/xiaoxiandun",
    accent: "#C9A84C",
    cover: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xiaoxiandun-hero-MSw4oXFtJRpVC9YWG9wg4G.webp",
    tag: "5年20亿",
  },
  jiangzhong: {
    brand: "江中猴姑饼干",
    category: "大健康 · 食品",
    result: "创造养胃食品新品类，上市第一年销售额破17亿",
    href: "/cases/jiangzhong",
    accent: "#C9A84C",
    cover: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/jiangzhong-hero-KXANLzXFb4CfE2Wse65obd.webp",
    tag: "品类第一",
  },
  xiaoguan: {
    brand: "小罐茶",
    category: "茶叶 · 高端礼品",
    result: "重塑高端礼品茶品类，天猫茶叶礼品市场第一",
    href: "/cases/xiaoguan",
    accent: "#C9A84C",
    cover: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xiaoguan-hero-VMo5tD5EjgTVTXUiupePuQ.webp",
    tag: "礼品茶第一",
  },
  pangge: {
    brand: "湖南胖哥食品",
    category: "食品 · 品牌升级",
    result: "100万+终端网点，400+经销商，槟榔行业洗牌期领先品牌",
    href: "/cases/pangge",
    accent: "#C9A84C",
    cover: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/800511093070b2f8324e764a335e8869_94eff669.jpg",
    tag: "全国布局",
  },
};

interface Props {
  current: keyof typeof ALL_CASES;
  bg?: string;
  borderColor?: string;
}

export default function RelatedCases({
  current,
  bg = "#080C14",
  borderColor = "rgba(201,168,76,0.12)",
}: Props) {
  const related = Object.entries(ALL_CASES)
    .filter(([key]) => key !== current)
    .map(([, val]) => val);

  return (
    <section
      aria-label="相关案例推荐"
      style={{ background: bg, borderTop: `1px solid ${borderColor}` }}
    >
      <div className="max-w-6xl mx-auto px-8 md:px-16 py-16">
        {/* Section header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.65rem",
                color: "#C9A84C",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Related Cases · 相关案例
            </span>
          </div>
          <Link href="/#cases">
            <a
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.6rem",
                color: "rgba(201,168,76,0.5)",
                letterSpacing: "0.12em",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#C9A84C")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(201,168,76,0.5)")
              }
            >
              查看全部案例 →
            </a>
          </Link>
        </div>

        {/* Case cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {related.map((c) => (
            <Link key={c.href} href={c.href}>
              <a
                className="block group"
                style={{
                  background: "rgba(201,168,76,0.03)",
                  border: "1px solid rgba(201,168,76,0.12)",
                  textDecoration: "none",
                  transition: "border-color 0.25s, transform 0.25s",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(201,168,76,0.45)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(201,168,76,0.12)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                }}
              >
                {/* Cover image */}
                <div
                  style={{
                    position: "relative",
                    height: 140,
                    overflow: "hidden",
                    background: "#0D0D0D",
                  }}
                >
                  <img
                    src={c.cover}
                    alt={`${c.brand}品牌案例封面`}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.7,
                      transition: "opacity 0.3s, transform 0.4s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity =
                        "0.9";
                      (e.currentTarget as HTMLImageElement).style.transform =
                        "scale(1.04)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity =
                        "0.7";
                      (e.currentTarget as HTMLImageElement).style.transform =
                        "scale(1)";
                    }}
                  />
                  {/* Tag badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "rgba(201,168,76,0.9)",
                      color: "#0A0A0A",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      padding: "3px 8px",
                    }}
                  >
                    {c.tag}
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: "14px 16px 16px" }}>
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.58rem",
                      color: "rgba(201,168,76,0.5)",
                      letterSpacing: "0.1em",
                      marginBottom: 6,
                    }}
                  >
                    {c.category}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      color: "#F5F0E8",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {c.brand}
                  </div>
                  <p
                    style={{
                      color: "rgba(245,240,232,0.5)",
                      fontSize: "0.75rem",
                      lineHeight: 1.65,
                      marginBottom: 12,
                    }}
                  >
                    {c.result}
                  </p>
                  <div
                    className="flex items-center gap-1"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.6rem",
                      color: "#C9A84C",
                      letterSpacing: "0.08em",
                    }}
                  >
                    查看完整案例
                    <span
                      style={{ transition: "transform 0.2s" }}
                      className="group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link href="/#contact">
            <a
              style={{
                display: "inline-block",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.65rem",
                color: "#C9A84C",
                letterSpacing: "0.15em",
                textDecoration: "none",
                border: "1px solid rgba(201,168,76,0.4)",
                padding: "12px 28px",
                transition: "background 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(201,168,76,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(201,168,76,0.7)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(201,168,76,0.4)";
              }}
            >
              预约品牌诊断 · 开启您的增长之旅
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
}
