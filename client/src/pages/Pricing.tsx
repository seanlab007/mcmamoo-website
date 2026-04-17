/*
 * ============================================================
<<<<<<< HEAD
 * Pricing Page — 猫眼增长引擎服务体系与定价
 * ============================================================
 * 定价策略：
<<<<<<< HEAD
 * 1. 核心竞争力 = 极低的尝试价格（9.8/38/98/198）
 * 2. 按"设计 -> 内容 -> 战略"梯度分层
 * 3. AI 组与专家组均提供低价一次性尝试服务
 * 4. 降低获客门槛，快速转化为付费用户
=======
 * 1. 精简低价服务：回归"尝鲜"本质（如 9.8 元仅限单次 AI Logo 尝试）
 * 2. 设计服务：分为 爆品设计、官网设计、单项设计
 * 3. 战略服务：数字增长引擎、爆品打造(30万)、品牌全案(480万)、战略咨询(5000万)
 * 4. 业务逻辑：AI 组为高效平替，专家组为高端定制
>>>>>>> origin/fix/navbar-dropdown-interaction
 * ============================================================
=======
 * Pricing Page — 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎全线业务定价体系
 * ============================================================
 * 定价架构：6 大业务板块 × 6 级定价梯度（3 AI + 3 专家）
 * 1. 设计服务（单项设计、官网设计、爆品设计）
 * 2. 官网建设（展示官网、商城官网、定制官网）
 * 3. 爆品打造（爆品策划、爆品执行、爆品全案）
 * 4. 品牌全案（品牌诊断、品牌升级、品牌护航）
 * 5. 战略咨询（数字增长、战略定位、顶级合伙）
 * 6. 毛智库（军事战略、兵棋推演、国防思路）
 * ============================================================
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
>>>>>>> origin/fix/final-navbar-restructure-1774631973
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
<<<<<<< HEAD
<<<<<<< HEAD
import { Check, ShieldCheck, Zap, Brain, Sparkles, Flame } from "lucide-react";
=======
import { Check, ShieldCheck, Zap, Brain, Sparkles, Flame, Star, TrendingUp, Globe } from "lucide-react";
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
import { Check, Zap, Brain, Sparkles } from "lucide-react";
>>>>>>> origin/fix/final-navbar-restructure-1774631973

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData_zh = {
<<<<<<< HEAD
<<<<<<< HEAD
  // 1. 设计类服务
=======
  // 1. 设计类服务：爆品、官网、单项
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
  // 1. 设计服务：6 级定价
>>>>>>> origin/fix/final-navbar-restructure-1774631973
  designServices: {
    id: "design-services",
    badge: "设计类",
    badgeColor: "#E53E3E",
    title: "品牌视觉设计",
<<<<<<< HEAD
    subtitle: "Brand Design & Visual Identity",
<<<<<<< HEAD
    desc: "从 AI 快速设计到专家全案规划，打造一流品牌形象。",
=======
    desc: "分为爆品设计、官网设计、单项设计，满足不同阶段的视觉需求。",
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
    subtitle: "单项设计 / 官网设计 / 爆品设计",
    desc: "从极致性价比的 AI 设计到顶级专家团队的高端定制，满足全阶段视觉需求。",
>>>>>>> origin/fix/final-navbar-restructure-1774631973
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
<<<<<<< HEAD
<<<<<<< HEAD
        desc: "AI 辅助的极速设计方案，经济高效",
        plans: [
          {
            name: "AI Logo 尝鲜",
=======
        desc: "AI 辅助的极速设计方案，极致性价比",
        plans: [
          {
            name: "单项设计尝鲜",
>>>>>>> origin/fix/navbar-dropdown-interaction
            period: "单次",
            price: "9.8",
            unit: "元",
            highlight: false,
<<<<<<< HEAD
            features: ["AI 生成 Logo 5 套方案", "品牌色彩系统建议", "基础 VI 规范", "永久使用权"],
=======
            features: ["单次 AI Logo 尝试", "3 套 AI 生成方案", "基础色彩建议"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即体验",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "AI 品牌设计包",
            period: "单次",
            price: "98",
            unit: "元",
            highlight: true,
            features: ["AI Logo + 视觉锤", "完整 VI 规范手册", "品牌故事文案", "基础包装建议"],
=======
            name: "AI 爆品视觉包",
            period: "单次",
            price: "198",
            unit: "元",
            highlight: true,
            features: ["AI 爆品主图设计", "详情页 AI 优化", "卖点视觉锤提炼", "适配主流电商平台"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即开通",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "AI 官网设计",
            period: "单次",
            price: "1980",
            unit: "元",
            highlight: false,
            features: ["AI 官网策划与设计", "响应式开发", "SEO 基础优化", "1 个月免费维护"],
=======
            name: "AI 官网原型",
            period: "单次",
            price: "980",
            unit: "元",
            highlight: false,
            features: ["AI 官网视觉原型", "响应式布局建议", "交互逻辑策划", "1 周内交付"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "预约咨询",
            href: "#contact"
          }
=======
        desc: "AI 驱动的高效设计方案",
        plans: [
          { name: "单项设计尝鲜", period: "单次", price: "9.8", unit: "元", features: ["单次 AI Logo 尝试", "3 套方案", "基础反馈"] },
          { name: "AI 官网设计", period: "单次", price: "198", unit: "元", features: ["AI 生成官网模板", "5 页面设计", "响应式优化"] },
          { name: "AI 爆品视觉包", period: "单次", price: "1980", unit: "元", highlight: true, features: ["完整爆品视觉系统", "包装 + 海报 + 主图", "AI 迭代优化"] }
>>>>>>> origin/fix/final-navbar-restructure-1774631973
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
<<<<<<< HEAD
        desc: "专家设计师主导的高端品牌塑造",
        plans: [
          {
<<<<<<< HEAD
            name: "专家品牌诊断",
            period: "单次",
            price: "980",
            unit: "元",
            highlight: false,
            features: ["品牌视觉诊断", "竞品分析", "定位建议", "升级方向指导"],
=======
            name: "专家单项设计",
            period: "单次",
            price: "3800",
            unit: "元",
            highlight: false,
            features: ["专家级 Logo 设计", "完整 VI 应用规范", "品牌视觉诊断", "2 次深度修改"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即预约",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "专家品牌全案",
            period: "单次",
            price: "9800",
            unit: "元",
            highlight: true,
            features: ["品牌战略定位", "Logo + 视觉锤设计", "完整 VI 规范", "包装设计", "电商视觉体系"],
=======
            name: "专家爆品全案",
            period: "单产品",
            price: "3.8",
            unit: "万",
            highlight: true,
            features: ["爆品视觉战略定位", "全套电商视觉体系", "产品包装设计", "卖点视觉锤打造"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "预约提案",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "专家官网设计开发",
            period: "单次",
            price: "38000",
            unit: "元",
            highlight: false,
            features: ["品牌官网策划与设计", "响应式开发", "18 语言国际化", "SEO 优化", "3 个月免费维护"],
=======
            name: "专家官网全案",
            period: "单次",
            price: "12.8",
            unit: "万",
            highlight: false,
            features: ["品牌官网深度策划", "定制化视觉设计", "18 语言国际化开发", "SEO 战略布局"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "预约咨询",
            href: "#contact"
          }
=======
        desc: "顶级设计师团队操刀",
        plans: [
          { name: "专家设计诊断", period: "单次", price: "3800", unit: "元", features: ["品牌视觉审计", "竞品分析", "改进方案"] },
          { name: "专家官网设计", period: "单次", price: "28000", unit: "元", features: ["创意官网设计", "交互原型", "前端开发指导"] },
          { name: "专家爆品全案", period: "单次", price: "98000", unit: "元", highlight: true, features: ["爆品视觉系统设计", "全域物料设计", "品牌指导手册"] }
>>>>>>> origin/fix/final-navbar-restructure-1774631973
        ]
      }
    ]
  },

<<<<<<< HEAD
<<<<<<< HEAD
  // 2. 内容类服务
  contentServices: {
    id: "content-services",
    badge: "内容类",
    badgeColor: "#40d090",
    title: "内容自动化平台",
    subtitle: "Content Automation & Production",
    desc: "从 AI 自动化内容到专家策划执行，满足全域内容需求。",
=======
  // 2. 官网建设：6 级定价
  websiteServices: {
    id: "website-services",
    badge: "官网类",
    badgeColor: "#3B82F6",
    title: "官网建设与优化",
    subtitle: "展示官网 / 商城官网 / 定制官网",
    desc: "从快速上线的 AI 官网到高端定制的品牌官网，助力品牌全域转化。",
>>>>>>> origin/fix/final-navbar-restructure-1774631973
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
<<<<<<< HEAD
        desc: "AI 驱动的全自动内容生产，高效且经济",
        plans: [
          {
            name: "AI 内容尝鲜",
            period: "单次",
            price: "38",
            unit: "元",
            highlight: false,
            features: ["3 条 AI 图文内容", "1 条 AI 视频剪辑", "基础合规预审", "多平台格式"],
            cta: "立即体验",
            href: "/platform"
          },
          {
            name: "AI 内容包",
            period: "单次",
            price: "198",
            unit: "元",
            highlight: true,
            features: ["15 条 AI 图文内容", "5 条 AI 视频剪辑", "爆款预测应用", "全平台自动分发"],
            cta: "立即开通",
            href: "/platform"
          },
          {
            name: "AI 月度订阅",
            period: "月付",
            price: "1980",
            unit: "元",
            highlight: false,
            features: ["每月 150 条 AI 内容", "高级 AutoClip 支持", "4 个平台账号", "实时数据监测"],
            cta: "预约演示",
            href: "/platform"
          }
=======
        desc: "AI 快速建站方案",
        plans: [
          { name: "AI 官网尝鲜", period: "单次", price: "38", unit: "元", features: ["AI 生成官网框架", "3 套模板选择", "基础 SEO 优化"] },
          { name: "AI 商城官网", period: "单次", price: "1980", unit: "元", features: ["AI 电商模板", "产品管理系统", "支付集成"] },
          { name: "AI 定制官网", period: "单次", price: "9800", unit: "元", highlight: true, features: ["AI 定制化设计", "完整功能开发", "3 个月运维"] }
>>>>>>> origin/fix/final-navbar-restructure-1774631973
        ]
      },
      {
        name: "专家组 (Expert-Led)",
<<<<<<< HEAD
        icon: <Zap className="text-[#C9A84C]" size={20} />,
        desc: "专家策划师主导的人工内容生产与审核",
        plans: [
          {
            name: "专家内容尝鲜",
            period: "单次",
            price: "1980",
            unit: "元",
            highlight: false,
            features: ["5 条策划内容", "人工策略师指导", "内容日历规划", "人工审核"],
            cta: "立即开通",
            href: "#contact"
          },
          {
            name: "专家内容包",
            period: "单次",
            price: "9800",
            unit: "元",
            highlight: true,
            features: ["30 条策划内容", "专属策略师", "深度数据分析", "KOL 内容协同", "A/B 测试优化"],
            cta: "立即升级",
            href: "#contact"
          },
          {
            name: "专家月度陪跑",
            period: "月付",
            price: "19800",
            unit: "元",
            highlight: false,
            features: ["不限量策划内容", "全平台账号管理", "专属内容团队", "实时爆款预警", "季度战略复盘"],
            cta: "预约演示",
            href: "#contact"
          }
=======
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级官网设计与开发",
        plans: [
          { name: "专家官网诊断", period: "单次", price: "8800", unit: "元", features: ["官网体验审计", "转化漏斗分析", "优化建议"] },
          { name: "专家商城官网", period: "单次", price: "68000", unit: "元", features: ["高端商城设计", "完整电商功能", "营销工具集成"] },
          { name: "专家定制官网", period: "单次", price: "280000", unit: "元", highlight: true, features: ["顶级品牌官网", "全定制开发", "年度运维支持"] }
>>>>>>> origin/fix/final-navbar-restructure-1774631973
        ]
      }
    ]
  },

<<<<<<< HEAD
  // 3. 战略类服务
=======
  // 2. 战略类服务：数字增长、爆品打造、品牌全案、战略咨询
>>>>>>> origin/fix/navbar-dropdown-interaction
  strategyServices: {
    id: "strategy-services",
    badge: "战略类",
    badgeColor: "#C9A84C",
    title: "战略大脑与咨询",
    subtitle: "Strategic Intelligence & Consulting",
<<<<<<< HEAD
    desc: "从 AI 战略助手到专家深度陪跑，打造增长引擎。",
=======
    desc: "从数字增长引擎到 5000 万级顶层战略咨询，为企业提供全生命周期护航。",
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
  // 3. 爆品打造：6 级定价
  explosiveProductServices: {
    id: "explosive-product-services",
    badge: "爆品类",
    badgeColor: "#F59E0B",
    title: "爆品打造与营销",
    subtitle: "爆品策划 / 爆品执行 / 爆品全案",
    desc: "从 AI 驱动的爆品策划到顶级专家的全案护航，打造真正的爆品。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 爆品方案",
        plans: [
          { name: "AI 爆品策划", period: "单次", price: "98", unit: "元", features: ["AI 爆品分析", "市场定位建议", "竞品对标"] },
          { name: "AI 爆品执行", period: "单次", price: "4980", unit: "元", features: ["AI 内容生成", "投放文案", "数据监测"] },
          { name: "AI 爆品全案", period: "单次", price: "29800", unit: "元", highlight: true, features: ["完整爆品策划", "内容 + 投放", "30 天优化"] }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级爆品打造",
        plans: [
          { name: "专家爆品策划", period: "单次", price: "18000", unit: "元", features: ["深度市场研究", "爆品定位", "上市方案"] },
          { name: "专家爆品执行", period: "单次", price: "98000", unit: "元", features: ["专家团队执行", "全域投放", "60 天运营"] },
          { name: "专家爆品全案", period: "单次", price: "300000", unit: "元", highlight: true, features: ["从 0 到 1 爆品打造", "完整运营护航", "品牌建设"] }
        ]
      }
    ]
  },

  // 4. 品牌全案：6 级定价
  brandFullCaseServices: {
    id: "brand-full-case-services",
    badge: "品牌类",
    badgeColor: "#10B981",
    title: "品牌全案与护航",
    subtitle: "品牌诊断 / 品牌升级 / 品牌护航",
    desc: "从品牌诊断到年度护航，打造持久的品牌竞争力。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 品牌方案",
        plans: [
          { name: "AI 品牌诊断", period: "单次", price: "198", unit: "元", features: ["AI 品牌分析", "竞品对标", "改进建议"] },
          { name: "AI 品牌升级", period: "单次", price: "9800", unit: "元", features: ["品牌定位优化", "视觉系统更新", "传播策略"] },
          { name: "AI 品牌护航", period: "3 个月", price: "29800", unit: "元", highlight: true, features: ["持续品牌优化", "内容运营", "数据监测"] }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级品牌全案",
        plans: [
          { name: "专家品牌诊断", period: "单次", price: "28000", unit: "元", features: ["深度品牌审计", "战略建议", "行动方案"] },
          { name: "专家品牌升级", period: "单次", price: "180000", unit: "元", features: ["完整品牌重塑", "全域视觉系统", "传播护航"] },
          { name: "专家品牌护航", period: "1 年", price: "4800000", unit: "元", highlight: true, features: ["年度品牌战略", "全域运营护航", "专家陪跑"] }
        ]
      }
    ]
  },

  // 5. 战略咨询：6 级定价
  strategyConsultingServices: {
    id: "strategy-consulting-services",
    badge: "战略类",
    badgeColor: "#8B5CF6",
    title: "战略咨询与定位",
    subtitle: "数字增长 / 战略定位 / 顶级合伙",
    desc: "从数字增长引擎到 3 年 5000 万的顶级合伙，重新定义品牌增长。",
>>>>>>> origin/fix/final-navbar-restructure-1774631973
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
<<<<<<< HEAD
<<<<<<< HEAD
        desc: "MaoAI 驱动的智能战略模型，高效且经济",
        plans: [
          {
            name: "MaoAI 尝鲜",
=======
        desc: "MaoAI 驱动的智能战略模型，高效洞察",
        plans: [
          {
            name: "数字增长尝鲜",
>>>>>>> origin/fix/navbar-dropdown-interaction
            period: "单次",
            price: "98",
            unit: "元",
            highlight: false,
<<<<<<< HEAD
            features: ["MaoAI 基础对话", "行业趋势分析", "竞品动态预警", "品牌声量分析"],
=======
            features: ["MaoAI 增长诊断", "行业趋势简报", "竞品动态预警"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即体验",
            href: "/mao-ai"
          },
          {
<<<<<<< HEAD
            name: "MaoAI 战略包",
=======
            name: "AI 爆品策划包",
>>>>>>> origin/fix/navbar-dropdown-interaction
            period: "单次",
            price: "1980",
            unit: "元",
            highlight: true,
<<<<<<< HEAD
            features: ["MaoAI 高级战略模型", "爆品策划 AI 预审", "竞品深度分析", "AI 自动生成周报"],
=======
            features: ["AI 爆品定义模型", "卖点 AI 自动提炼", "投放策略 AI 建议"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即开通",
            href: "/mao-ai"
          },
          {
<<<<<<< HEAD
            name: "MaoAI 月度订阅",
=======
            name: "AI 战略月度订阅",
>>>>>>> origin/fix/navbar-dropdown-interaction
            period: "月付",
            price: "9800",
            unit: "元",
            highlight: false,
<<<<<<< HEAD
            features: ["全量 MaoAI 智库权限", "不限次战略咨询", "实时市场预警", "AI 自动生成月报"],
=======
            features: ["全量 MaoAI 智库权限", "不限次战略咨询", "实时市场预警"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "预约演示",
            href: "/mao-ai"
          }
=======
        desc: "AI 战略方案",
        plans: [
          { name: "AI 增长诊断", period: "单次", price: "98", unit: "元", features: ["AI 增长分析", "机会识别", "行动建议"] },
          { name: "AI 数字增长", period: "3 个月", price: "19800", unit: "元", features: ["AI 增长方案", "数据优化", "月度报告"] },
          { name: "AI 战略定位", period: "6 个月", price: "98000", unit: "元", highlight: true, features: ["完整战略规划", "执行指导", "季度评审"] }
>>>>>>> origin/fix/final-navbar-restructure-1774631973
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
<<<<<<< HEAD
<<<<<<< HEAD
        desc: "代言先生及核心专家团队亲自操刀的战略护航",
        plans: [
          {
            name: "专家战略尝鲜",
            period: "单次",
            price: "3800",
            unit: "元",
            highlight: false,
            features: ["企业战略诊断", "竞争格局分析", "增长机会识别", "高管汇报 1 次"],
=======
        desc: "代言先生及核心专家团队亲自操刀的顶层战略",
        plans: [
          {
            name: "爆品打造全案",
            period: "单产品",
            price: "30",
            unit: "万",
            highlight: false,
            features: ["爆品定义与策划", "全渠道增长路径", "错位竞争战略应用", "管理员终审报告"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即预约",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "专家战略全案",
            period: "单次",
            price: "38000",
            unit: "元",
            highlight: true,
            features: ["战略定位深度研究", "错位竞争理论应用", "爆品策划人工审核", "专属战略顾问支持", "管理员终审报告"],
            cta: "预约演示",
            href: "#contact"
          },
          {
            name: "专家年度陪跑",
            period: "年付",
            price: "188000",
            unit: "元",
            highlight: false,
            features: ["全年战略护航陪跑", "毛智库深度研报", "季度高管闭门研讨", "重大决策人工复核", "国际机构资源对接"],
=======
            name: "品牌年度全案",
            period: "年付",
            price: "480",
            unit: "万",
            highlight: true,
            features: ["全年品牌战略护航", "全案视觉与内容管理", "季度高管闭门研讨", "专属战略顾问团队"],
            cta: "预约提案",
            href: "#contact"
          },
          {
            name: "顶层战略咨询",
            period: "3年",
            price: "5000",
            unit: "万",
            highlight: false,
            features: ["3 年长期战略规划", "全球资源整合对接", "企业级增长引擎构建", "代言先生亲自指导"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "申请加入",
            href: "#contact"
          }
=======
        desc: "顶级战略咨询",
        plans: [
          { name: "专家增长诊断", period: "单次", price: "38000", unit: "元", features: ["深度战略诊断", "市场机会分析", "3 年规划"] },
          { name: "专家战略定位", period: "1 年", price: "300000", unit: "元", features: ["完整战略规划", "执行护航", "月度陪跑"] },
          { name: "顶级合伙方案", period: "3 年", price: "5000000", unit: "元", highlight: true, features: ["深度战略合伙", "年度 CEO 陪跑", "全域增长护航"] }
        ]
      }
    ]
  },

  // 6. 毛智库（军事业务）：6 级定价
  maoThinkTankServices: {
    id: "mao-think-tank-services",
    badge: "军事类",
    badgeColor: "#EF4444",
    title: "毛智库 — 军事战略与兵棋推演",
    subtitle: "To 军队 / 国防战略 / 兵棋推演",
    desc: "专业的军事战略咨询与兵棋推演服务，为国防建设提供智力支持。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 军事分析方案",
        plans: [
          { name: "AI 战略分析", period: "单次", price: "198", unit: "元", features: ["AI 军事分析", "情报综合", "趋势预测"] },
          { name: "AI 兵棋模拟", period: "单次", price: "19800", unit: "元", features: ["AI 兵棋推演", "场景模拟", "结果分析"] },
          { name: "AI 国防咨询", period: "3 个月", price: "98000", unit: "元", highlight: true, features: ["持续战略分析", "定期推演", "专项研究"] }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级军事战略",
        plans: [
          { name: "专家战略咨询", period: "单次", price: "68000", unit: "元", features: ["深度战略分析", "专家评估", "建议方案"] },
          { name: "专家兵棋推演", period: "单次", price: "200000", unit: "元", features: ["完整兵棋推演", "多方案模拟", "详细报告"] },
          { name: "顶级国防合伙", period: "1 年", price: "2000000", unit: "元", highlight: true, features: ["年度战略护航", "定期推演", "专家陪跑"] }
>>>>>>> origin/fix/final-navbar-restructure-1774631973
        ]
      }
    ]
  }
};

<<<<<<< HEAD
// ─── 页面组件 ─────────────────────────────────────────────────────────────────

function ServiceCard({ plan, isEn }: { plan: any; isEn: boolean }) {
  return (
    <div className={`relative p-8 border transition-all duration-500 flex flex-col ${
      plan.highlight ? "bg-[#C9A84C]/5 border-[#C9A84C]/30 scale-105 z-10 ring-2 ring-[#C9A84C]/20" : "bg-white/[0.02] border-white/10 hover:border-white/20"
    }`}>
      {plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-bold tracking-widest uppercase px-3 py-1 flex items-center gap-1">
          <Flame size={12} /> {isEn ? "Best Value" : "最佳选择"}
        </div>
      )}
      <div className="mb-6">
        <h4 className="text-white text-xl font-bold mb-1">{plan.name}</h4>
        <span className="text-white/40 text-xs uppercase tracking-widest font-mono">{plan.period}</span>
      </div>
      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${plan.highlight ? "text-[#C9A84C]" : "text-white"}`}>{plan.price}</span>
          <span className="text-white/60 text-sm">{plan.unit}</span>
        </div>
      </div>
      <ul className="space-y-4 mb-10 flex-1">
        {plan.features.map((f: string) => (
          <li key={f} className="flex items-start gap-3 text-white/70 text-sm leading-relaxed">
            <Check size={16} className="text-[#C9A84C] mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <a
        href={plan.href}
        className={`block text-center py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
          plan.highlight ? "bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#D4B866]" : "border border-white/20 text-white hover:bg-white/5"
        }`}
      >
        {plan.cta}
      </a>
    </div>
  );
}

export default function Pricing() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "zh";
  const data = pricingData_zh;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 border-b border-white/5">
        <div className="container">
          <div className="inline-block px-3 py-1 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-bold tracking-widest uppercase mb-6">
            Service & Pricing
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight font-['Noto_Serif_SC']">
<<<<<<< HEAD
            {isEn ? "Growth Engine Pricing" : "极具竞争力的定价体系"}
          </h1>
          <p className="text-white/50 text-lg max-w-3xl leading-relaxed">
            {isEn 
              ? "Ultra-low entry prices (¥9.8/38/98/198) as our core competitive advantage. Every service offers both AI and Expert options."
              : "我们的核心竞争力：极低的尝试价格（¥9.8/38/98/198）。每项业务都分为 AI 组与专家组，快速获客，高效转化。"}
=======
            {isEn ? "Growth Engine Pricing" : "全生命周期定价体系"}
          </h1>
          <p className="text-white/50 text-lg max-w-3xl leading-relaxed">
            {isEn 
              ? "From ¥9.8 AI Logo to ¥50M Strategic Consulting. We provide full-cycle growth solutions for brands at all stages."
              : "从 ¥9.8 的 AI Logo 尝试，到 5000 万级的顶层战略咨询。我们为品牌提供从爆品打造到全球全案的全生命周期增长方案。"}
>>>>>>> origin/fix/navbar-dropdown-interaction
          </p>
        </div>
      </section>

      {/* 定价板块 */}
      <section className="py-24">
        <div className="container">
          {/* 1. 设计类 */}
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.designServices.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.designServices.desc}</p>
            
            {data.designServices.groups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  {group.icon}
                  <h4 className="text-xl font-bold text-white">{group.name}</h4>
                  <span className="text-white/30 text-sm ml-auto">{group.desc}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {group.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
                </div>
              </div>
            ))}
          </div>

<<<<<<< HEAD
          {/* 2. 内容类 */}
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.contentServices.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.contentServices.desc}</p>
            
            {data.contentServices.groups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  {group.icon}
                  <h4 className="text-xl font-bold text-white">{group.name}</h4>
                  <span className="text-white/30 text-sm ml-auto">{group.desc}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {group.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
                </div>
              </div>
            ))}
          </div>

          {/* 3. 战略类 */}
=======
          {/* 2. 战略类 */}
>>>>>>> origin/fix/navbar-dropdown-interaction
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.strategyServices.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.strategyServices.desc}</p>
            
            {data.strategyServices.groups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  {group.icon}
                  <h4 className="text-xl font-bold text-white">{group.name}</h4>
                  <span className="text-white/30 text-sm ml-auto">{group.desc}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {group.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
                </div>
              </div>
=======
// ─── 组件定义 ────────────────────────────────────────────────────────────

interface PricingPlan {
  name: string;
  period: string;
  price: string;
  unit: string;
  features: string[];
  highlight?: boolean;
  cta?: string;
  href?: string;
}

interface PricingGroup {
  name: string;
  icon: React.ReactNode;
  desc: string;
  plans: PricingPlan[];
}

interface PricingService {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  desc: string;
  groups: PricingGroup[];
}

export default function Pricing() {
  const { t } = useTranslation();
  const [activeService, setActiveService] = useState<string>("design-services");

  const services = Object.values(pricingData_zh) as PricingService[];
  const currentService = services.find(s => s.id === activeService);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full mb-6">
              <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">PRICING SYSTEM</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 font-['Noto_Serif_SC']">
              全线业务定价体系
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              6 大业务板块 × 6 级定价梯度 | 3 AI 方案 + 3 专家方案 | 从 ¥9.8 到 ¥5000 万
            </p>
          </div>

          {/* Service Selector */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
            {services.map(service => (
              <button
                key={service.id}
                onClick={() => setActiveService(service.id)}
                className={`p-4 border rounded-sm transition-all ${
                  activeService === service.id
                    ? "bg-[#C9A84C]/20 border-[#C9A84C] text-white"
                    : "bg-transparent border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                <div className="text-xs font-bold tracking-widest uppercase mb-1">{service.badge}</div>
                <div className="text-sm font-semibold">{service.title}</div>
              </button>
>>>>>>> origin/fix/final-navbar-restructure-1774631973
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* 底部 CTA */}
      <section className="py-24 border-t border-white/5 bg-[#C9A84C]/5">
        <div className="container text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 font-['Noto_Serif_SC']">
<<<<<<< HEAD
            {isEn ? "Start Your Growth Journey" : "从 ¥9.8 开始您的增长之旅"}
          </h2>
          <p className="text-white/50 mb-12 max-w-2xl mx-auto">
            极低的尝试价格是我们的竞争力。无论您选择 AI 高效方案还是专家深度陪跑，都能以最经济的方式快速验证效果。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#contact" className="px-12 py-5 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all">
              立即开始尝试（¥9.8 起）
=======
            {isEn ? "Start Your Growth Journey" : "开启您的品牌增长引擎"}
          </h2>
          <p className="text-white/50 mb-12 max-w-2xl mx-auto">
            无论是追求极致效率的 AI 组，还是追求顶层深度的专家组，我们都为您准备了最合适的切入点。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#contact" className="px-12 py-5 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all">
              立即预约咨询
>>>>>>> origin/fix/navbar-dropdown-interaction
            </a>
            <a href="/mao-ai" className="px-12 py-5 border border-white/20 text-white font-bold tracking-widest uppercase hover:bg-white/5 transition-all">
              体验 MaoAI 大脑
            </a>
          </div>
=======
      {/* Pricing Section */}
      {currentService && (
        <section className="pb-24 px-8 md:px-20">
          <div className="max-w-6xl mx-auto">
            {/* Service Header */}
            <div className="mb-12">
              <div className="inline-block px-3 py-1 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full mb-4">
                <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">{currentService.badge}</span>
              </div>
              <h2 className="text-4xl font-bold mb-2 font-['Noto_Serif_SC']">{currentService.title}</h2>
              <p className="text-white/50 mb-4">{currentService.subtitle}</p>
              <p className="text-white/70 max-w-3xl">{currentService.desc}</p>
            </div>

            {/* Pricing Groups */}
            <div className="space-y-12">
              {currentService.groups.map((group, groupIdx) => (
                <div key={groupIdx}>
                  <div className="flex items-center gap-3 mb-6">
                    {group.icon}
                    <div>
                      <h3 className="text-xl font-bold">{group.name}</h3>
                      <p className="text-white/50 text-sm">{group.desc}</p>
                    </div>
                  </div>

                  {/* Plans Grid */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {group.plans.map((plan, planIdx) => (
                      <div
                        key={planIdx}
                        className={`p-6 border rounded-sm transition-all ${
                          plan.highlight
                            ? "bg-[#C9A84C]/10 border-[#C9A84C]"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="mb-4">
                          <h4 className="text-lg font-bold mb-1">{plan.name}</h4>
                          <p className="text-white/50 text-xs">{plan.period}</p>
                        </div>

                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">¥{plan.price}</span>
                            <span className="text-white/50">{plan.unit}</span>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature, featureIdx) => (
                            <li key={featureIdx} className="flex items-start gap-2 text-sm text-white/70">
                              <Check size={16} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button className="w-full py-2 px-4 bg-[#C9A84C] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all rounded-sm">
                          {plan.cta || "立即咨询"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-8 md:px-20 bg-[#111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-['Noto_Serif_SC']">
            无法确定最适合的方案？
          </h2>
          <p className="text-white/60 mb-8">
            我们的专家团队随时准备为您提供个性化的咨询与建议。
          </p>
          <button className="px-8 py-3 bg-[#C9A84C] text-[#0A0A0A] text-sm font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all rounded-sm">
            预约专家咨询
          </button>
>>>>>>> origin/fix/final-navbar-restructure-1774631973
        </div>
      </section>

      <Footer />
    </div>
  );
}
