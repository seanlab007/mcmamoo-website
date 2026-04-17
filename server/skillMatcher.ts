/**
 * skillMatcher.ts
 *
 * Universal Skill Matching Engine (P1)
 *
 * Shared between aiStream.ts (chat pipeline) and aiNodes.ts (API endpoint).
 * Provides cached skill loading + 4-strategy matching:
 *   1. Trigger keyword match (exact substring, highest priority)
 *   2. Skill name fuzzy match (name tokens in message)
 *   3. Description relevance match (message tokens appear in description)
 *   4. Category-based hint match (e.g. "帮我画" → creative skills)
 *
 * Each strategy produces a score; highest score wins. Threshold: 2 points.
 */

import { dbFetch } from "./aiNodes";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedSkill {
  nodeId: number;
  skillId: string;
  name: string;
  triggers: string[];
  description: string;
  invokeMode: string;
  systemPrompt: string | null;
  inputSchema: Record<string, unknown> | null;
  requiredPlan: string;
}

export interface CachedNode {
  id: number;
  name: string;
  baseUrl: string;
  token: string;
}

export type MatchResult = {
  nodeId: number;
  skillId: string;
  name: string;
  description: string;
  invokeMode: string;
  systemPrompt: string | null;
  inputSchema: Record<string, unknown> | null;
  requiredPlan: string;
  node: { baseUrl: string; token: string; name: string } | null;
  matchScore: number;
  matchStrategy: string;
};

// ─── Skill Cache ─────────────────────────────────────────────────────────────
// Shared singleton — both aiStream and aiNodes hit the same cache.

let skillCache: {
  skills: CachedSkill[];
  nodes: CachedNode[];
  loadedAt: number;
  ttl: number;
} = { skills: [], nodes: [], loadedAt: 0, ttl: 5 * 60_000 };

/**
 * Refresh the in-memory skill cache from DB.
 * @param force  If true, always re-fetch regardless of TTL.
 */
export async function refreshSkillCache(force = false): Promise<void> {
  const now = Date.now();
  if (!force && skillCache.skills.length > 0 && now - skillCache.loadedAt < skillCache.ttl) {
    return;
  }

  try {
    const nodesRes = await dbFetch("/ai_nodes?isOnline=eq.true&isLocal=eq.true&select=id,name,baseUrl,token");
    const onlineNodes = nodesRes.data as CachedNode[] | [];
    if (!onlineNodes || onlineNodes.length === 0) {
      skillCache.skills = [];
      skillCache.nodes = [];
      return;
    }

    const nodeIds = onlineNodes.map((n) => n.id);
    const skillsRes = await dbFetch(
      `/node_skills?nodeId=in.(${nodeIds.join(",")})&isActive=eq.true&select=*`
    );
    const rawSkills = skillsRes.data as Array<{
      nodeId: number;
      skillId: string;
      name: string;
      triggers: string[] | null;
      description: string | null;
      invokeMode: string | null;
      systemPrompt: string | null;
      inputSchema: Record<string, unknown> | null;
      required_plan: string | null;
    }> | [];

    skillCache.skills = (rawSkills ?? []).map((s) => ({
      nodeId: s.nodeId,
      skillId: s.skillId,
      name: s.name,
      triggers: s.triggers ?? [],
      description: s.description ?? "",
      invokeMode: s.invokeMode ?? "prompt",
      systemPrompt: s.systemPrompt,
      inputSchema: s.inputSchema,
      requiredPlan: s.required_plan ?? "free",
    }));
    skillCache.nodes = onlineNodes;
    skillCache.loadedAt = now;

    console.log(`[SkillCache] Refreshed: ${skillCache.skills.length} skills from ${onlineNodes.length} nodes`);
  } catch (err) {
    console.warn("[SkillCache] Refresh failed:", err);
  }
}

/** Get a snapshot of the current cache (for status endpoints). */
export function getSkillCacheSnapshot() {
  return {
    skills: skillCache.skills,
    nodes: skillCache.nodes,
    loadedAt: skillCache.loadedAt,
  };
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\u4e00-\u9fff\u3400-\u4dbfa-z0-9]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

// ─── Multi-Strategy Matching ──────────────────────────────────────────────────

export async function matchSkillForMessage(userMessage: string): Promise<MatchResult | null> {
  try {
    await refreshSkillCache();
    const { skills, nodes } = skillCache;
    if (skills.length === 0 || nodes.length === 0) return null;

    const msgLower = userMessage.toLowerCase();
    const msgTokens = tokenize(userMessage);

    let bestMatch: MatchResult | null = null;

    for (const skill of skills) {
      let score = 0;
      let strategy = "";

      // Strategy 1: Trigger keyword match (highest priority)
      for (const trigger of skill.triggers) {
        if (msgLower.includes(trigger.toLowerCase())) {
          score += 5 + trigger.length * 2;
          strategy = "trigger";
          break;
        }
      }

      // Strategy 2: Skill name fuzzy match
      const skillNameLower = skill.name.toLowerCase();
      if (!strategy) {
        if (skillNameLower.length >= 2 && msgLower.includes(skillNameLower)) {
          score += 3 + skillNameLower.length;
          strategy = "name";
        } else {
          const nameTokens = tokenize(skill.name);
          const overlap = nameTokens.filter((t) => msgTokens.includes(t));
          if (overlap.length > 0 && overlap.length >= nameTokens.length * 0.6) {
            score += 2 + overlap.length * 2;
            strategy = "name-fuzzy";
          }
        }
      }

      // Strategy 3: Description keyword relevance (needs 2+ matches)
      if (!strategy && skill.description) {
        const descTokens = tokenize(skill.description);
        const descOverlap = msgTokens.filter((t) => descTokens.includes(t) && t.length > 1);
        if (descOverlap.length >= 2) {
          score += descOverlap.length;
          strategy = "description";
        }
      }

      // Strategy 4: Category-based hint (lowest priority)
      if (!strategy) {
        const categoryHints: Record<string, string[]> = {
          creative: ["画", "图片", "生成图", "绘图", "设计", "logo", "ppt", "文档", "word", "excel", "gif"],
          productivity: ["日历", "备忘录", "提醒", "笔记", "邮件", "通讯录", "日程"],
          engineering: ["代码", "github", "部署", "编译", "pr", "issue", "仓库"],
          research: ["搜索", "论文", "arxiv", "研究", "学术"],
          integration: ["微信", "飞书", "钉钉", "slack", "通知", "webhook"],
        };
        // Find the best matching category based on skill name heuristics
        for (const [cat, hints] of Object.entries(categoryHints)) {
          if (hints.some((h) => msgLower.includes(h))) {
            const catKeywords: Record<string, string[]> = {
              creative: ["canvas", "ppt", "word", "pdf", "gif", "ai绘图", "fb", "excel"],
              productivity: ["apple", "things", "joplin", "google", "himalaya", "whatsapp", "qq", "smtp"],
              engineering: ["github", "flutter", "react", "mcp"],
              research: ["arxiv", "twitter"],
              integration: ["飞书", "微信", "openclaw"],
            };
            const catKeys = catKeywords[cat] ?? [];
            const skillIdLower = skill.skillId.toLowerCase();
            if (catKeys.some((k) => skillIdLower.includes(k))) {
              score += 1;
              strategy = "category-hint";
              break;
            }
          }
        }
      }

      // Require minimum score threshold
      if (score >= 2 && (!bestMatch || score > bestMatch.matchScore)) {
        const node = nodes.find((n) => n.id === skill.nodeId) || null;
        bestMatch = {
          nodeId: skill.nodeId,
          skillId: skill.skillId,
          name: skill.name,
          description: skill.description,
          invokeMode: skill.invokeMode,
          systemPrompt: skill.systemPrompt,
          inputSchema: skill.inputSchema,
          requiredPlan: skill.requiredPlan,
          node: node ? { baseUrl: node.baseUrl, token: node.token, name: node.name } : null,
          matchScore: score,
          matchStrategy: strategy,
        };
      }
    }

    if (bestMatch) {
      console.log(
        `[SkillMatch] "${bestMatch.name}" (${bestMatch.skillId})` +
        ` score=${bestMatch.matchScore} strategy=${bestMatch.matchStrategy} mode=${bestMatch.invokeMode}`
      );
    }

    return bestMatch;
  } catch (err) {
    console.warn("[SkillMatch] Error during skill matching:", err);
    return null;
  }
}
