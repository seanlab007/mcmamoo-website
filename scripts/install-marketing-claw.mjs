#!/usr/bin/env node
/**
 * install-marketing-claw.mjs
 *
 * 将 marketing-claw 的 12 个 AI 营销智能体作为 OpenClaw skills
 * 注册到 MaoAI 节点管理系统。
 *
 * 使用方式：
 *   node scripts/install-marketing-claw.mjs
 *
 * 环境变量（可在 .env 中配置）：
 *   MAOAI_URL              MaoAI 服务地址，默认 http://localhost:5000
 *   NODE_REGISTRATION_TOKEN  节点注册 token（见管理员控制台 → Secrets）
 *   OPENCLAW_BASE_URL      本地 OpenClaw API 地址，默认 http://localhost:8080/v1
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 配置 ────────────────────────────────────────────────────────────────────

// 尝试加载 .env（若存在）
try {
  const envPath = resolve(__dirname, "../.env");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env 不存在则跳过
}

const MAOAI_URL = process.env.MAOAI_URL || "http://localhost:5000";
const TOKEN = process.env.NODE_REGISTRATION_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || "";
const OPENCLAW_BASE_URL = process.env.OPENCLAW_BASE_URL || "http://localhost:8080/v1";

// ─── Marketing Claw 的 12 个 Skills ─────────────────────────────────────────

const MARKETING_CLAW_SKILLS = [
  // ── Starter Tier (5) ──────────────────────────────────────────────────────
  {
    id: "marketing-claw:pulse",
    name: "Pulse — Daily Analytics Digest",
    version: "1.0.0",
    description:
      "每日早 8 点自动推送营销数据摘要，涵盖流量、热门内容、转化信号及今日关注点，异常自动标记。",
    triggers: ["日报", "流量", "数据摘要", "analytics", "pulse", "每日分析", "转化"],
    category: "marketing",
    tier: "starter",
    schedule: "0 8 * * *",
  },
  {
    id: "marketing-claw:hype",
    name: "Hype — Daily Content Briefing",
    version: "1.0.0",
    description:
      "每日早 9 点生成社交内容简报，提供 3 条完整文案创意，贴合品牌调性与当前平台趋势。",
    triggers: ["内容简报", "发帖建议", "社交内容", "hype", "content brief", "文案创意"],
    category: "marketing",
    tier: "starter",
    schedule: "0 9 * * *",
  },
  {
    id: "marketing-claw:megaphone",
    name: "Megaphone — Social Posting Engine",
    version: "1.0.0",
    description:
      "每日早 10 点从审核队列自动执行社交媒体发帖，并记录已发内容日志。",
    triggers: ["自动发帖", "社交发布", "megaphone", "social post", "发布内容"],
    category: "marketing",
    tier: "starter",
    schedule: "0 10 * * *",
  },
  {
    id: "marketing-claw:mingle",
    name: "Mingle — Social Engagement Engine",
    version: "1.0.0",
    description:
      "每日 11 点和 16 点各运行一次，识别高价值回复机会、起草互动回复，在 X/LinkedIn 上增强品牌存在感。",
    triggers: ["互动", "回复", "涨粉", "mingle", "engagement", "社区运营"],
    category: "marketing",
    tier: "starter",
    schedule: "0 11,16 * * *",
  },
  {
    id: "marketing-claw:ghost",
    name: "Ghost — Blog Content Engine",
    version: "1.0.0",
    description:
      "每周二、周四早 9 点从编辑日历取下一个选题，生成完整博客草稿或提纲，待审核后发布。",
    triggers: ["博客", "文章", "ghost", "blog", "写作", "内容生产"],
    category: "marketing",
    tier: "starter",
    schedule: "0 9 * * 2,4",
  },

  // ── Pro Tier (7) ──────────────────────────────────────────────────────────
  {
    id: "marketing-claw:scout",
    name: "Scout — Community Intelligence Monitor",
    version: "1.0.0",
    description:
      "每日早 8:30 监控 Reddit、X 及相关社区，捕捉品牌提及、竞品动态、ICP 信号与互动机会。",
    triggers: ["品牌监控", "社区监控", "scout", "竞品", "舆情", "community"],
    category: "marketing",
    tier: "pro",
    schedule: "30 8 * * *",
  },
  {
    id: "marketing-claw:oracle",
    name: "Oracle — Weekly Editorial Intelligence",
    version: "1.0.0",
    description:
      "每周一早 7 点提供编辑情报周报：本周热点话题、内容缺口、竞品定位变化及推荐选题方向。",
    triggers: ["编辑日历", "选题", "oracle", "editorial", "趋势分析", "内容规划"],
    category: "marketing",
    tier: "pro",
    schedule: "0 7 * * 1",
  },
  {
    id: "marketing-claw:quill",
    name: "Quill — Newsletter Drafting Engine",
    version: "1.0.0",
    description:
      "每周三早 10 点从零生成完整 Newsletter 草稿，供审核、编辑后通过邮件平台发送。",
    triggers: ["newsletter", "邮件", "quill", "通讯", "weekly email", "邮件营销"],
    category: "marketing",
    tier: "pro",
    schedule: "0 10 * * 3",
  },
  {
    id: "marketing-claw:judge",
    name: "Judge — Content Performance Scorer",
    version: "1.0.0",
    description:
      "每周五下午 3 点对当周所有社交、博客、Newsletter 内容打分，分析哪些内容有效、为何有效，并给出下周建议。",
    triggers: ["内容评分", "效果分析", "judge", "performance", "复盘", "ROI"],
    category: "marketing",
    tier: "pro",
    schedule: "0 15 * * 5",
  },
  {
    id: "marketing-claw:hunter",
    name: "Hunter — Warm Outbound Lead Finder",
    version: "1.0.0",
    description:
      "每日早 7:30 识别正在主动寻找解决方案的潜在客户，打分后将最热线索加入今日外联队列。",
    triggers: ["线索", "潜客", "hunter", "lead", "outbound", "外联", "销售线索"],
    category: "marketing",
    tier: "pro",
    schedule: "30 7 * * *",
  },
  {
    id: "marketing-claw:prospector",
    name: "Prospector — Lead Generation Batch",
    version: "1.0.0",
    description:
      "每周一、三、五早 6 点批量从多平台系统化挖掘 ICP 匹配潜客，打分并丰富销售管道。",
    triggers: ["潜客挖掘", "prospector", "ICP", "lead gen", "开发客户", "获客"],
    category: "marketing",
    tier: "pro",
    schedule: "0 6 * * 1,3,5",
  },
  {
    id: "marketing-claw:standup",
    name: "Standup — Daily Agent Audit",
    version: "1.0.0",
    description:
      "每日早 9:30 审查所有智能体的运行状态，输出简报：哪些已完成、哪些待处理、是否有阻塞项。",
    triggers: ["状态报告", "智能体审计", "standup", "agent status", "运行状态", "日检"],
    category: "marketing",
    tier: "pro",
    schedule: "30 9 * * *",
  },
];

// ─── 注册逻辑 ─────────────────────────────────────────────────────────────────

async function registerNode() {
  const registerUrl = `${MAOAI_URL}/api/ai/node/register`;

  const body = {
    token: TOKEN,
    name: "Marketing Claw (OpenClaw)",
    baseUrl: OPENCLAW_BASE_URL,
    type: "openclaw",
    modelId: "claude-sonnet-4",
    skills: MARKETING_CLAW_SKILLS.map(({ id, name, version, description, triggers, category }) => ({
      id,
      name,
      version,
      description,
      triggers,
      category,
      isActive: true,
    })),
  };

  console.log(`\n🦞 Marketing Claw → MaoAI 安装程序`);
  console.log(`   目标：${registerUrl}`);
  console.log(`   节点：${OPENCLAW_BASE_URL}`);
  console.log(`   Skills：${MARKETING_CLAW_SKILLS.length} 个`);
  console.log(`   Token：${TOKEN ? TOKEN.slice(0, 6) + "****" : "(未设置，开发模式)"}\n`);

  try {
    const res = await fetch(registerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      console.log(`✅ 注册成功！节点 ID：${data.nodeId}`);
      console.log(`\n已注册的 Skills：`);

      const starterSkills = MARKETING_CLAW_SKILLS.filter((s) => s.tier === "starter");
      const proSkills = MARKETING_CLAW_SKILLS.filter((s) => s.tier === "pro");

      console.log(`\n  📦 Starter Tier (${starterSkills.length} 个)：`);
      for (const s of starterSkills) {
        console.log(`     ✓ ${s.name} [${s.schedule}]`);
      }

      console.log(`\n  💎 Pro Tier (${proSkills.length} 个)：`);
      for (const s of proSkills) {
        console.log(`     ✓ ${s.name} [${s.schedule}]`);
      }

      console.log(`\n🎉 Marketing Claw 已成功安装到 MaoAI！`);
      console.log(`   在 MaoAI 管理员控制台 → 节点管理 中可以查看该节点。`);
      console.log(`   在 MaoAI 管理员控制台 → 路由策略 中配置是否启用该节点。\n`);
    } else {
      console.error(`❌ 注册失败：${data.error}`);
      if (!TOKEN) {
        console.log(`\n💡 提示：请设置 NODE_REGISTRATION_TOKEN 环境变量，`);
        console.log(`   可在 MaoAI 管理员控制台 → Secrets 中找到。`);
      }
      process.exit(1);
    }
  } catch (err) {
    const isConnRefused =
      String(err).includes("ECONNREFUSED") || String(err).includes("fetch failed");

    if (isConnRefused) {
      console.error(`❌ 无法连接到 MaoAI（${MAOAI_URL}）`);
      console.log(`\n💡 请确认：`);
      console.log(`   1. MaoAI (mcmamoo-website) 已启动：npm run dev`);
      console.log(`   2. 或设置正确的 MAOAI_URL 环境变量指向线上地址`);
    } else {
      console.error(`❌ 请求失败：${err}`);
    }
    process.exit(1);
  }
}

registerNode();
