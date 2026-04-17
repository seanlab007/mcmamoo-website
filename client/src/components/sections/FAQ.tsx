/*
 * FAQ Section — 常见问题解答
 * 用于首页SEO内容增强，提供FAQPage结构化数据支持
 * 回答用户关于品牌战略咨询的核心问题
 */
import { useEffect, useRef, useState } from "react";

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

const FAQS = [
  {
<<<<<<< HEAD
    question: "猫眼咨询的核心服务是什么？",
    answer: "猫眼咨询提供四大核心服务：新消费第一品牌全案战略咨询、爆品营销策划、天猫流量池构建、整合营销带货。我们独创错位竞争理论，帮助品牌避开正面竞争，通过品类错位、场景错位、人群错位等方式找到市场空白，实现快速成为细分品类第一。",
  },
  {
    question: "猫眼咨询与麦肯锡等传统咨询公司有什么区别？",
    answer: "猫眼咨询不是传统意义上的咨询公司，我们是您的深度战略合伙人。我们不提供研究报告，而是打造爆品使利润倍增；不是传统甲乙关系，而是深度战略合伙人；不只给建议，而是全域增长打爆天猫；不做短期项目指导，而是品牌显贵长期护航。",
  },
  {
    question: "什么是错位竞争理论？",
    answer: "错位竞争是猫眼咨询独创的品牌战略理论。核心理念是帮助品牌避开正面竞争，通过品类错位（创造新品类）、场景错位（占领新场景）、人群错位（聚焦特定人群）等方式找到市场空白，实现快速成为细分品类第一，而非在红海市场中血拼。",
  },
  {
    question: "猫眼咨询服务过哪些知名品牌？",
    answer: "猫眼咨询服务过江中猴姑饼干（上市第一年17亿销售额）、小仙炖鲜炖燕窝（5年20亿在线营收、天猫品类第一）、小罐茶（重新定义高端茶礼）、蟹太太大闸蟹（全网蟹券销量连续多年第一）、湖南胖哥食品（槟榔行业领袖品牌）等10亿级大单品品牌。",
  },
  {
    question: "什么样的品牌适合找猫眼咨询合作？",
    answer: "适合与猫眼咨询合作的品牌包括：新消费品牌希望从0到1快速起量、成熟品牌希望突破增长瓶颈、传统企业希望转型升级、有产品优势但缺乏品牌认知的企业、希望在天猫等电商平台打爆的品牌。我们尤其擅长食品、大健康、美妆、家居等新消费领域。",
  },
  {
    question: "猫眼咨询的合作流程是怎样的？",
=======
    question: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)的核心服务是什么？",
    answer: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)提供四大核心服务：新消费第一品牌全案战略咨询、爆品营销策划、天猫流量池构建、整合营销带货。我们独创错位竞争理论，帮助品牌避开正面竞争，通过品类错位、场景错位、人群错位等方式找到市场空白，实现快速成为细分品类第一。",
  },
  {
    question: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)与麦肯锡等传统咨询公司有什么区别？",
    answer: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)不是传统意义上的咨询公司，我们是您的深度战略合伙人。我们不提供研究报告，而是打造爆品使利润倍增；不是传统甲乙关系，而是深度战略合伙人；不只给建议，而是全域增长打爆天猫；不做短期项目指导，而是品牌显贵长期护航。",
  },
  {
    question: "什么是错位竞争理论？",
    answer: "错位竞争是猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)独创的品牌战略理论。核心理念是帮助品牌避开正面竞争，通过品类错位（创造新品类）、场景错位（占领新场景）、人群错位（聚焦特定人群）等方式找到市场空白，实现快速成为细分品类第一，而非在红海市场中血拼。",
  },
  {
    question: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)服务过哪些知名品牌？",
    answer: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)服务过江中猴姑饼干（上市第一年17亿销售额）、小仙炖鲜炖燕窝（5年20亿在线营收、天猫品类第一）、小罐茶（重新定义高端茶礼）、蟹太太大闸蟹（全网蟹券销量连续多年第一）、湖南胖哥食品（槟榔行业领袖品牌）等10亿级大单品品牌。",
  },
  {
    question: "什么样的品牌适合找猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)合作？",
    answer: "适合与猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)合作的品牌包括：新消费品牌希望从0到1快速起量、成熟品牌希望突破增长瓶颈、传统企业希望转型升级、有产品优势但缺乏品牌认知的企业、希望在天猫等电商平台打爆的品牌。我们尤其擅长食品、大健康、美妆、家居等新消费领域。",
  },
  {
    question: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)的合作流程是怎样的？",
>>>>>>> origin/fix/final-navbar-restructure-1774631973
    answer: "合作流程分为四个阶段：第一阶段是战略诊断，深入了解企业现状和市场机会；第二阶段是战略规划，制定错位竞争战略和品类定位；第三阶段是执行落地，包括爆品策划、视觉锤设计、营销传播等；第四阶段是持续优化，跟踪数据表现，持续迭代优化。",
  },
];

export default function FAQ() {
  const { ref, isVisible } = useReveal(0.1);

  return (
    <section
      id="faq"
      ref={ref}
      className="py-20 md:py-28"
      style={{ background: "#0A0A0A" }}
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="container">
        {/* Section Header */}
        <div
          className="mb-12"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 32, height: 1, background: "#C9A84C" }} />
            <span
              style={{
                color: "#C9A84C",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              FAQ · 常见问题
            </span>
          </div>
          <h2
            className="text-2xl md:text-4xl font-bold"
            style={{
              fontFamily: "'Noto Serif SC', serif",
              color: "#F5F0E8",
              lineHeight: 1.3,
            }}
          >
            关于品牌战略咨询的常见问题
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl">
<<<<<<< HEAD
            了解猫眼咨询如何帮助新消费品牌实现错位竞争、品类第一的战略目标
=======
            了解猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)如何帮助新消费品牌实现错位竞争、品类第一的战略目标
>>>>>>> origin/fix/final-navbar-restructure-1774631973
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="p-6 md:p-8"
              style={{
                background: "rgba(201,168,76,0.03)",
                border: "1px solid rgba(201,168,76,0.12)",
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`,
              }}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <h3
                className="text-lg font-semibold mb-3"
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  color: "#F5F0E8",
                  lineHeight: 1.5,
                }}
                itemProp="name"
              >
                {faq.question}
              </h3>
              <div
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                  itemProp="text"
                >
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-12 text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s",
          }}
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium transition-all duration-300"
            style={{
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#C9A84C",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.2)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.1)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)";
            }}
          >
            还有更多问题？联系我们
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
