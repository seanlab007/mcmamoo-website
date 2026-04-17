/*
 * RelatedCases — 相关案例推荐组件
 * 在每个案例详情页底部展示 2-3 个相关案例卡片
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
>>>>>>> origin/deploy/trigger-build-1774631965
 */
import { Link } from "wouter";

export interface RelatedCase {
  brand: string;
  category: string;
  result: string;
  href: string;
  accent: string; // CSS color for accent
}

const ALL_CASES: Record<string, RelatedCase> = {
  xietaitai: {
    brand: "蟹太太大闸蟹",
    category: "生鲜 / 品牌化",
    result: "从0到8亿营收，全网蟹券销量连续多年第一",
    href: "/cases/xietaitai",
    accent: "#C9A84C",
  },
  xiaoxiandun: {
    brand: "小仙炖鲜炖燕窝",
    category: "滋补 / 新消费",
    result: "5年20亿在线营收，天猫品类第一",
    href: "/cases/xiaoxiandun",
    accent: "#C9A84C",
  },
  jiangzhong: {
    brand: "江中猴姑饼干",
    category: "大健康 / 食品",
    result: "上市第一年销售额破17亿元",
    href: "/cases/jiangzhong",
    accent: "#C9A84C",
  },
  xiaoguan: {
    brand: "小罐茶",
    category: "茶叶 / 高端礼品",
    result: "重新定义中国高端茶礼，2亿营收",
    href: "/cases/xiaoguan",
    accent: "#C9A84C",
  },
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
};

interface Props {
  current: keyof typeof ALL_CASES;
=======
=======
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
>>>>>>> origin/deploy/trigger-build-1774631965
  pangge: {
    brand: "胖哥食品",
    category: "休闲食品 / 槟榔",
    result: "品牌全案战略，实现全域增长与品类占位",
    href: "/cases/pangge",
    accent: "#C9A84C",
  },
};

interface Props {
  current: string;
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
>>>>>>> origin/deploy/trigger-build-1774631965
  bg?: string;
  borderColor?: string;
}

export default function RelatedCases({ current, bg = "#080C14", borderColor = "rgba(201,168,76,0.1)" }: Props) {
  const related = Object.entries(ALL_CASES)
    .filter(([key]) => key !== current)
    .slice(0, 3)
    .map(([, val]) => val);

  return (
    <div
      className="py-16 px-8 md:px-20"
      style={{ background: bg, borderTop: `1px solid ${borderColor}` }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Related Cases · 相关案例
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {related.map((c) => (
            <Link key={c.href} href={c.href}>
              <a
                className="block p-6 group"
                style={{
                  background: "rgba(201,168,76,0.03)",
                  border: "1px solid rgba(201,168,76,0.12)",
                  textDecoration: "none",
                  transition: "border-color 0.25s, background 0.25s",
                }}
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.06)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.12)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.03)";
                }}
=======
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
>>>>>>> origin/deploy/trigger-build-1774631965
              >
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(201,168,76,0.5)", letterSpacing: "0.12em", marginBottom: 8 }}>
                  {c.category}
                </div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#F5F0E8", fontSize: "1.05rem", fontWeight: 700, marginBottom: 10 }}>
                  {c.brand}
                </div>
                <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "0.82rem", lineHeight: 1.7, marginBottom: 16 }}>
                  {c.result}
                </p>
                <div
                  className="flex items-center gap-2"
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.1em" }}
                >
                  查看完整案例
                  <span style={{ transition: "transform 0.2s" }} className="group-hover:translate-x-1">→</span>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {/* Back to all cases */}
        <div className="mt-10 text-center">
          <Link href="/#cases">
            <a style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(245,240,232,0.35)", letterSpacing: "0.15em", textDecoration: "none", transition: "color 0.2s" }}
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#C9A84C"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.35)"}
=======
              className="hover:text-[#C9A84C]"
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
              className="hover:text-[#C9A84C]"
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
              className="hover:text-[#C9A84C]"
>>>>>>> origin/deploy/trigger-build-1774631965
            >
              ← 返回全部案例
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
