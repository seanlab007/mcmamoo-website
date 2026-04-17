#!/usr/bin/env node
/**
 * skill-bridge.mjs
 *
 * WorkBuddy ↔ MaoAI 双向技能同步桥梁
 *
 * 功能：
 *   1. 扫描 WorkBuddy 本地技能目录 (~/.workbuddy/skills/)
 *   2. 解析 SKILL.md（YAML frontmatter + Markdown）
 *   3. 转换为 MaoAI node_skills 格式
 *   4. 通过 MaoAI API 注册/增量同步
 *   5. 支持 dry-run 模式预览变更
 *   6. 支持 watch 模式实时监控技能目录变化
 *
 * 使用方式：
 *   node scripts/skill-bridge.mjs                  # 执行同步
 *   node scripts/skill-bridge.mjs --dry-run        # 预览变更，不执行
 *   node scripts/skill-bridge.mjs --watch           # 监控模式（每60s检查一次）
 *   node scripts/skill-bridge.mjs --watch --interval 30  # 自定义监控间隔
 *   node scripts/skill-bridge.mjs --force           # 强制全量同步（忽略checksum）
 *
 * 环境变量（可在 .env 中配置）：
 *   MAOAI_URL                MaoAI 服务地址，默认 http://localhost:5000
 *   NODE_REGISTRATION_TOKEN   节点注册 token
 *   WORKBUDDY_SKILLS_DIR      WorkBuddy 技能目录，默认 ~/.workbuddy/skills
 *   SKILLS_MARKETPLACE_DIR    技能市场目录，默认 ~/.workbuddy/skills-marketplace
 *   BRIDGE_NODE_NAME          注册到 MaoAI 的节点名称，默认 "WorkBuddy Bridge"
 */

import { readFileSync, readdirSync, existsSync, statSync, writeFileSync, watch } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 配置 ────────────────────────────────────────────────────────────────────

// 加载 .env
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
} catch { /* .env not found */ }

const MAOAI_URL = process.env.MAOAI_URL || "http://localhost:5000";
const TOKEN = process.env.NODE_REGISTRATION_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || "";
const WORKBUDDY_SKILLS_DIR = process.env.WORKBUDDY_SKILLS_DIR || join(homedir(), ".workbuddy", "skills");
const SKILLS_MARKETPLACE_DIR = process.env.SKILLS_MARKETPLACE_DIR || join(homedir(), ".workbuddy", "skills-marketplace");
const BRIDGE_NODE_NAME = process.env.BRIDGE_NODE_NAME || "WorkBuddy Bridge";

// 解析命令行参数
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const WATCH_MODE = args.includes("--watch");
const FORCE_SYNC = args.includes("--force");
const intervalIdx = args.indexOf("--interval");
const WATCH_INTERVAL = intervalIdx !== -1 && args[intervalIdx + 1]
  ? parseInt(args[intervalIdx + 1], 10) * 1000
  : 60_000;

// ─── YAML Frontmatter 解析器 ────────────────────────────────────────────────

/**
 * 解析 SKILL.md 的 YAML frontmatter
 * 格式：---\nkey: value\nkey2: "value with spaces"\n---
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const yamlStr = match[1];
  const frontmatter = {};

  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    // 去掉引号
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    frontmatter[key] = val;
  }

  const body = content.slice(match[0].length).trim();
  return { frontmatter, body };
}

/**
 * 从 Markdown 正文提取 triggers（触发词）
 * 规则：
 *   - 约定在 "## 触发条件" 或 "## Triggers" 下的列表项
 *   - 或者在 frontmatter 中有 triggers: ["词1", "词2"]
 */
function extractTriggers(frontmatter, body) {
  // 优先使用 frontmatter 中的 triggers
  if (frontmatter.triggers) {
    if (typeof frontmatter.triggers === "string") {
      try {
        return JSON.parse(frontmatter.triggers);
      } catch {
        return frontmatter.triggers.split(",").map(t => t.trim()).filter(Boolean);
      }
    }
    return Array.isArray(frontmatter.triggers) ? frontmatter.triggers : [];
  }

  // 从正文中提取
  const triggers = [];
  const lines = body.split("\n");
  let inTriggerSection = false;

  for (const line of lines) {
    if (/^##\s*(触发条件|Triggers|触发词|When to use)/i.test(line)) {
      inTriggerSection = true;
      continue;
    }
    if (inTriggerSection && /^##\s/.test(line)) {
      break;
    }
    if (inTriggerSection && /^\s*[-*]\s*(?:当用户|✅)/.test(line)) {
      // 提取引号中的内容或整行
      const quoted = line.match(/[""「]([^""」]+)[""」]/g);
      if (quoted) {
        for (const q of quoted) {
          triggers.push(q.replace(/[""「」]/g, "").trim());
        }
      }
    }
  }

  return triggers;
}

/**
 * 从目录名或 frontmatter 推断 category
 */
function inferCategory(dirName, frontmatter) {
  if (frontmatter.category) return frontmatter.category;
  if (frontmatter.metadata?.maoai?.category) return frontmatter.metadata?.maoai?.category;

  const categoryMap = {
    "AI绘图": "creative",
    "canvas-design": "creative",
    "FBS-BookWriter": "creative",
    "PPT": "creative",
    "Word": "creative",
    "PDF": "creative",
    "GIF": "creative",
    "Excel": "productivity",
    "Apple备忘录": "productivity",
    "Apple提醒事项": "productivity",
    "Things": "productivity",
    "Joplin": "productivity",
    "Google全家桶": "productivity",
    "Himalaya": "productivity",
    "WhatsApp": "productivity",
    "QQ邮箱": "productivity",
    "SMTP邮件": "productivity",
    "智能体邮箱": "productivity",
    "GitHub": "engineering",
    "Flutter": "engineering",
    "React Native": "engineering",
    "MCP": "engineering",
    "CloudQ": "infrastructure",
    "CMG": "infrastructure",
    "ZeroTier": "infrastructure",
    "ArXiv": "research",
    "Twitter": "research",
    "MBTI": "specialized",
    "飞书": "integration",
    "微信": "integration",
    "OpenClaw": "specialized",
    "maoai": "specialized",
  };

  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (dirName.toLowerCase().includes(keyword.toLowerCase())) return cat;
  }

  return "custom";
}

// ─── 技能扫描器 ──────────────────────────────────────────────────────────────

/**
 * 扫描 WorkBuddy 技能目录，返回技能列表
 */
function scanWorkBuddySkills() {
  const skills = [];

  if (!existsSync(WORKBUDDY_SKILLS_DIR)) {
    console.warn(`[SkillBridge] 技能目录不存在: ${WORKBUDDY_SKILLS_DIR}`);
    return skills;
  }

  const entries = readdirSync(WORKBUDDY_SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = join(WORKBUDDY_SKILLS_DIR, entry.name);
    const skillMdPath = join(skillDir, "SKILL.md");

    // 跳过没有 SKILL.md 的目录
    if (!existsSync(skillMdPath)) continue;

    try {
      const content = readFileSync(skillMdPath, "utf8");
      const { frontmatter, body } = parseFrontmatter(content);

      // 跳过非技能目录（如 hooks/）
      if (entry.name === "hooks" || entry.name === "scripts") continue;

      const name = frontmatter.name || entry.name;
      const description = frontmatter.description || "";
      const version = frontmatter.version || "1.0.0";
      const triggers = extractTriggers(frontmatter, body);
      const category = inferCategory(entry.name, frontmatter);

      // 从目录名生成 skillId（kebab-case）
      const skillId = `workbuddy:${entry.name.toLowerCase().replace(/[\s（）()]+/g, "-")}`;

      // 计算内容 hash 用于增量检测
      const contentHash = createHash("sha256")
        .update(content)
        .digest("hex")
        .slice(0, 12);

      skills.push({
        id: skillId,
        name,
        version,
        description,
        triggers,
        category,
        isActive: true,
        _source: "workbuddy",
        _dirName: entry.name,
        _contentHash: contentHash,
        _systemPrompt: buildSystemPrompt(skillId, name, description, body, frontmatter),
      });
    } catch (err) {
      console.warn(`[SkillBridge] 解析 ${entry.name}/SKILL.md 失败:`, err.message);
    }
  }

  return skills;
}

/**
 * 扫描 skills-marketplace 目录中的 SKILL.md 文件
 */
function scanMarketplaceSkills() {
  const skills = [];

  const marketplaceSkillsDir = join(SKILLS_MARKETPLACE_DIR, "skills");
  if (!existsSync(marketplaceSkillsDir)) {
    return skills;
  }

  const entries = readdirSync(marketplaceSkillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillMdPath = join(marketplaceSkillsDir, entry.name, "SKILL.md");
    if (!existsSync(skillMdPath)) continue;

    try {
      const content = readFileSync(skillMdPath, "utf8");
      const { frontmatter, body } = parseFrontmatter(content);

      const name = frontmatter.name || entry.name;
      const description = frontmatter.description || "";
      const version = frontmatter.version || "1.0.0";
      const triggers = extractTriggers(frontmatter, body);
      const category = inferCategory(entry.name, frontmatter);

      const skillId = `marketplace:${entry.name.toLowerCase().replace(/[\s（）()]+/g, "-")}`;

      const contentHash = createHash("sha256")
        .update(content)
        .digest("hex")
        .slice(0, 12);

      skills.push({
        id: skillId,
        name: `[Market] ${name}`,
        version,
        description,
        triggers,
        category,
        isActive: true,
        _source: "marketplace",
        _dirName: entry.name,
        _contentHash: contentHash,
        _systemPrompt: buildSystemPrompt(skillId, name, description, body, frontmatter),
      });
    } catch (err) {
      console.warn(`[SkillBridge] 解析 marketplace/${entry.name}/SKILL.md 失败:`, err.message);
    }
  }

  return skills;
}

/**
 * 构建 systemPrompt（用于 invokeMode='prompt' 的技能）
 * 将 SKILL.md 的正文作为 system prompt 注入到 MaoAI 对话
 */
function buildSystemPrompt(skillId, name, description, body, frontmatter) {
  const allowedTools = frontmatter["allowed-tools"] || "";

  return `## [Skill: ${name}]\n\n${description}\n\n${body}\n\n${allowedTools ? `Allowed tools: ${allowedTools}` : ""}
---
Skill source: ${skillId}
Skill bridge: WorkBuddy → MaoAI`;
}

// ─── Checksum 计算 ──────────────────────────────────────────────────────────

/**
 * 计算技能列表的 checksum（与 MaoAI 服务端 computeChecksum 保持一致）
 */
function computeChecksum(skills) {
  const sorted = [...skills].sort((a, b) => a.id.localeCompare(b.id));
  const raw = sorted.map((s) => `${s.id}:${s.version}`).join("|");
  return "sha256:" + createHash("sha256").update(raw).digest("hex").slice(0, 8);
}

// ─── MaoAI API 调用 ─────────────────────────────────────────────────────────

async function registerSkills(skills) {
  if (skills.length === 0) {
    console.log("[SkillBridge] 无技能需要同步");
    return;
  }

  const registerUrl = `${MAOAI_URL}/api/ai/node/register`;
  const checksum = computeChecksum(skills);

  const body = {
    token: TOKEN,
    name: BRIDGE_NODE_NAME,
    baseUrl: "file://workbuddy-bridge",  // 虚拟 URL，表示来自本地文件桥
    type: "workbuddy-bridge",
    modelId: "bridge-v1",
    skills: skills.map(({ id, name, version, description, triggers, category, isActive, _systemPrompt }) => ({
      id,
      name,
      version,
      description,
      triggers,
      category,
      isActive,
      invokeMode: "prompt",         // WorkBuddy 技能默认用 prompt 模式
      systemPrompt: _systemPrompt,  // SKILL.md 正文作为 system prompt 注入
    })),
  };

  if (DRY_RUN) {
    console.log(`\n🔄 DRY RUN — 不会实际执行注册\n`);
    console.log(`   目标：${registerUrl}`);
    console.log(`   节点：${BRIDGE_NODE_NAME}`);
    console.log(`   技能数：${skills.length}`);
    console.log(`   Checksum：${checksum}\n`);

    // 按分类分组展示
    const byCategory = {};
    for (const s of skills) {
      const cat = s.category || "custom";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(s);
    }

    for (const [cat, catSkills] of Object.entries(byCategory)) {
      console.log(`  📦 ${cat} (${catSkills.length} 个)：`);
      for (const s of catSkills) {
        const triggerInfo = s.triggers?.length ? ` [${s.triggers.slice(0, 3).join(", ")}${s.triggers.length > 3 ? "..." : ""}]` : "";
        console.log(`     ✓ ${s.name}${triggerInfo}`);
      }
      console.log("");
    }

    return { dryRun: true, skillCount: skills.length, checksum };
  }

  try {
    console.log(`\n🌉 Skill Bridge → MaoAI 同步`);
    console.log(`   目标：${registerUrl}`);
    console.log(`   节点：${BRIDGE_NODE_NAME}`);
    console.log(`   技能数：${skills.length}`);
    console.log(`   Checksum：${checksum}`);
    console.log(`   Token：${TOKEN ? TOKEN.slice(0, 6) + "****" : "(未设置，开发模式)"}\n`);

    const res = await fetch(registerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      console.log(`✅ 同步成功！节点 ID：${data.nodeId}`);
      console.log(`   已注册 ${skills.length} 个技能`);

      // 显示分类统计
      const categories = {};
      for (const s of skills) {
        categories[s.category] = (categories[s.category] || 0) + 1;
      }
      console.log(`\n   📊 分类统计：`);
      for (const [cat, count] of Object.entries(categories)) {
        console.log(`      ${cat}: ${count} 个`);
      }

      return { success: true, nodeId: data.nodeId, skillCount: skills.length, checksum };
    } else {
      console.error(`❌ 同步失败：${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (err) {
    const isConnRefused =
      String(err).includes("ECONNREFUSED") || String(err).includes("fetch failed");

    if (isConnRefused) {
      console.error(`❌ 无法连接到 MaoAI（${MAOAI_URL}）`);
      console.log(`\n💡 请确认：`);
      console.log(`   1. MaoAI 已启动：cd /Users/mac/Desktop/mcmamoo-website && npm run dev`);
      console.log(`   2. 或设置正确的 MAOAI_URL 环境变量`);
    } else {
      console.error(`❌ 请求失败：${err}`);
    }
    return { success: false, error: String(err) };
  }
}

// ─── 状态文件（用于增量检测）─────────────────────────────────────────────────

const STATE_FILE = resolve(__dirname, "../.skill-bridge-state.json");

function loadBridgeState() {
  try {
    if (!existsSync(STATE_FILE)) return {};
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveBridgeState(state) {
  try {
    const { writeFileSync } = require("fs");
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // 静默失败
  }
}

/**
 * 检查是否有增量变更
 */
function hasChanges(skills) {
  if (FORCE_SYNC) return true;

  const state = loadBridgeState();
  const prevChecksum = state.lastChecksum;

  if (!prevChecksum) return true;

  const currentChecksum = computeChecksum(skills);
  if (currentChecksum !== prevChecksum) return true;

  // 检查单个技能的 contentHash 是否变化
  for (const skill of skills) {
    const prevHash = state.skillHashes?.[skill.id];
    if (prevHash && prevHash !== skill._contentHash) {
      return true;
    }
  }

  return false;
}

function updateState(skills, result) {
  const checksum = computeChecksum(skills);
  const skillHashes = {};
  for (const s of skills) {
    skillHashes[s.id] = s._contentHash;
  }

  const state = {
    lastSync: new Date().toISOString(),
    lastChecksum: checksum,
    skillCount: skills.length,
    skillHashes,
    result: result.success ? "success" : "failed",
  };

  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // 状态保存失败不影响主流程
  }
}

// ─── 去重 ──────────────────────────────────────────────────────────────────────

/**
 * 去重：本地已存在的技能不再从市场重复添加
 */
function deduplicateSkills(wbSkills, mpSkills) {
  const allSkills = [...wbSkills, ...mpSkills];
  const wbSkillIds = new Set(wbSkills.map(s => s._dirName?.toLowerCase()));
  return allSkills.filter((s, idx, arr) => {
    if (s._source === "workbuddy") return true;
    if (wbSkillIds.has(s._dirName?.toLowerCase())) return false;
    const firstIdx = arr.findIndex(other => other.id === s.id);
    return firstIdx === idx;
  });
}

// ─── Watch 模式 ──────────────────────────────────────────────────────────────

function startWatch(skills) {
  console.log(`\n👀 Watch 模式已启动`);
  console.log(`   监控目录：${WORKBUDDY_SKILLS_DIR}`);
  console.log(`   检查间隔：${WATCH_INTERVAL / 1000}s`);
  console.log(`   按 Ctrl+C 停止\n`);

  let lastChecksum = computeChecksum(skills);
  let syncCount = 0;

  const timer = setInterval(async () => {
    try {
      const wbSkills = scanWorkBuddySkills();
      const mpSkills = scanMarketplaceSkills();
      const deduped = deduplicateSkills(wbSkills, mpSkills);

      const newChecksum = computeChecksum(deduped);

      if (newChecksum !== lastChecksum || FORCE_SYNC) {
        console.log(`\n[${new Date().toLocaleTimeString("zh-CN")}] 🔄 检测到技能变更，开始同步...`);
        const result = await registerSkills(deduped);
        if (result.success) {
          syncCount++;
          lastChecksum = newChecksum;
          console.log(`[${new Date().toLocaleTimeString("zh-CN")}] ✅ 同步完成（第 ${syncCount} 次）\n`);
        }
      }
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString("zh-CN")}] ❌ Watch 错误:`, err.message);
    }
  }, WATCH_INTERVAL);

  // 优雅退出
  process.on("SIGINT", () => {
    console.log(`\n\n👋 Watch 模式已停止（共同步 ${syncCount} 次）`);
    clearInterval(timer);
    process.exit(0);
  });
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  🌉 WorkBuddy ↔ MaoAI Skill Bridge`);
  console.log(`  ${new Date().toLocaleString("zh-CN")}`);
  console.log(`${"═".repeat(60)}\n`);

  // 1. 扫描技能
  console.log(`📡 扫描 WorkBuddy 本地技能...`);
  const wbSkills = scanWorkBuddySkills();
  console.log(`   找到 ${wbSkills.length} 个本地技能`);

  console.log(`📡 扫描技能市场...`);
  const mpSkills = scanMarketplaceSkills();
  console.log(`   找到 ${mpSkills.length} 个市场技能`);

  const allSkills = [...wbSkills, ...mpSkills];

  // 去重：本地已存在的技能不再从市场重复添加
  const dedupedSkills = deduplicateSkills(wbSkills, mpSkills);
  console.log(`   去重后：${dedupedSkills.length} 个（移除 ${allSkills.length - dedupedSkills.length} 个重复）\n`);

  if (dedupedSkills.length === 0) {
    console.log("⚠️  未找到任何技能，请检查目录路径：");
    console.log(`   WorkBuddy: ${WORKBUDDY_SKILLS_DIR}`);
    console.log(`   Marketplace: ${SKILLS_MARKETPLACE_DIR}`);
    process.exit(1);
  }

  // 2. 检查增量变更
  if (!DRY_RUN && !WATCH_MODE && !hasChanges(dedupedSkills)) {
    console.log("✅ 技能无变更，跳过同步");
    console.log(`   上次同步：${loadBridgeState().lastSync || "(未知)"}`);
    console.log(`   提示：使用 --force 强制全量同步\n`);
    return;
  }

  // 3. 执行同步
  const result = await registerSkills(dedupedSkills);

  // 4. 保存同步状态
  if (!DRY_RUN && result && !result.dryRun) {
    try {
      const checksum = computeChecksum(dedupedSkills);
      const skillHashes = {};
      for (const s of dedupedSkills) {
        skillHashes[s.id] = s._contentHash;
      }
      const state = {
        lastSync: new Date().toISOString(),
        lastChecksum: checksum,
        skillCount: dedupedSkills.length,
        skillHashes,
        wbSkillCount: wbSkills.length,
        mpSkillCount: mpSkills.length,
        result: result.success ? "success" : "failed",
      };
      writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
    } catch {
      // 状态保存失败不影响主流程
    }
  }

  // 5. Watch 模式
  if (WATCH_MODE) {
    startWatch(dedupedSkills);
  }
}

main().catch((err) => {
  console.error("❌ Skill Bridge 运行失败:", err);
  process.exit(1);
});
