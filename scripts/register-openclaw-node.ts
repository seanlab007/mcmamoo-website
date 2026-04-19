/**
 * OpenClaw → MaoAI 节点注册脚本
 * 
 * 用途：将 OpenClaw 作为本地节点注册到 MaoAI，实现双向打通
 * OpenClaw 是 MaoAI 的 Python Agent 引擎，支持复杂任务执行
 * 
 * 使用方法：
 *   ts-node scripts/register-openclaw-node.ts
 */

const MAOAI_BASE_URL = process.env.MAOAI_BASE_URL || "http://localhost:3000/api/ai";
const NODE_REGISTRATION_TOKEN = process.env.NODE_REGISTRATION_TOKEN || "";
const OPENCLAW_BASE_URL = process.env.OPENCLAW_BASE_URL || "http://localhost:5000";

interface NodeRegistrationPayload {
  token: string;
  name: string;
  baseUrl: string;
  type: "workbuddy" | "openclaw" | "openmanus" | "openai_compat" | "custom";
  modelId: string;
  priority: number;
  description?: string;
}

interface SkillRegistrationPayload {
  token: string;
  nodeId: number;
  action: "upsert" | "delete" | "replace_all";
  skills: Array<{
    skillId: string;
    name: string;
    description?: string;
    triggers: string[];
    invokeMode: "prompt" | "invoke";
    systemPrompt?: string;
    inputSchema?: Record<string, unknown>;
    required_plan?: "free" | "content" | "strategic" | "admin";
  }>;
}

// OpenClaw 内置 Skills 定义
const OPENCLAW_SKILLS = [
  {
    skillId: "deep_research",
    name: "深度研究",
    description: "执行多步骤深度研究任务，自动搜索、分析、总结",
    triggers: ["研究", "调研", "分析", "深度研究", "research", "analyze"],
    invokeMode: "invoke" as const,
    required_plan: "content",
  },
  {
    skillId: "code_generation",
    name: "代码生成",
    description: "生成完整项目代码，支持多文件、多模块",
    triggers: ["生成代码", "创建项目", "写代码", "code generation", "scaffold"],
    invokeMode: "invoke" as const,
    required_plan: "free",
  },
  {
    skillId: "data_analysis",
    name: "数据分析",
    description: "分析 CSV/Excel/JSON 数据，生成图表和报告",
    triggers: ["分析数据", "数据处理", "可视化", "data analysis", "chart"],
    invokeMode: "invoke" as const,
    required_plan: "content",
  },
  {
    skillId: "web_scraping",
    name: "网页抓取",
    description: "抓取网页内容，提取结构化数据",
    triggers: ["抓取网页", "爬取", "提取数据", "scrape", "crawl"],
    invokeMode: "invoke" as const,
    required_plan: "content",
  },
  {
    skillId: "document_processing",
    name: "文档处理",
    description: "处理 PDF/Word/Excel 文档，提取文本和元数据",
    triggers: ["处理文档", "解析PDF", "提取文本", "document", "pdf"],
    invokeMode: "invoke" as const,
    required_plan: "free",
  },
  {
    skillId: "multi_agent_collaboration",
    name: "多智能体协作",
    description: "启动多个 Agent 协作完成复杂任务",
    triggers: ["多Agent", "协作", "团队", "multi-agent", "collaboration"],
    invokeMode: "invoke" as const,
    required_plan: "strategic",
  },
];

async function registerNode(): Promise<{ nodeId: number; action: string } | null> {
  if (!NODE_REGISTRATION_TOKEN) {
    console.error("[OpenClaw Register] NODE_REGISTRATION_TOKEN not set");
    return null;
  }

  const payload: NodeRegistrationPayload = {
    token: NODE_REGISTRATION_TOKEN,
    name: "OpenClaw / Agent Engine",
    baseUrl: `${OPENCLAW_BASE_URL}/v1`,
    type: "openclaw",
    modelId: "openclaw-agent",
    priority: 80, // 优先级低于 WorkBuddy，但高于普通 Ollama
    description: `OpenClaw Python Agent Engine - Registered at ${new Date().toISOString()}`,
  };

  try {
    const res = await fetch(`${MAOAI_BASE_URL}/node/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[OpenClaw Register] Failed:", err);
      return null;
    }

    const data = await res.json();
    console.log(`[OpenClaw Register] Success: nodeId=${data.nodeId}, action=${data.action}`);
    return data;
  } catch (err) {
    console.error("[OpenClaw Register] Error:", err);
    return null;
  }
}

async function syncSkills(nodeId: number): Promise<boolean> {
  if (!NODE_REGISTRATION_TOKEN) return false;

  const payload: SkillRegistrationPayload = {
    token: NODE_REGISTRATION_TOKEN,
    nodeId,
    action: "replace_all",
    skills: OPENCLAW_SKILLS,
  };

  try {
    const res = await fetch(`${MAOAI_BASE_URL}/node/skills/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[OpenClaw Skills] Sync failed:", err);
      return false;
    }

    const data = await res.json();
    console.log(`[OpenClaw Skills] Synced ${data.count} skills`);
    return true;
  } catch (err) {
    console.error("[OpenClaw Skills] Error:", err);
    return false;
  }
}

async function sendHeartbeat(nodeId: number): Promise<void> {
  if (!NODE_REGISTRATION_TOKEN) return;

  try {
    await fetch(`${MAOAI_BASE_URL}/node/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: NODE_REGISTRATION_TOKEN,
        nodeId,
      }),
    });
    console.log(`[OpenClaw Heartbeat] Sent for node ${nodeId}`);
  } catch (err) {
    console.error("[OpenClaw Heartbeat] Error:", err);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("OpenClaw → MaoAI Node Registration");
  console.log("=".repeat(60));
  console.log(`MaoAI Base URL: ${MAOAI_BASE_URL}`);
  console.log(`OpenClaw Base URL: ${OPENCLAW_BASE_URL}`);
  console.log("");

  // Step 1: Register node
  const result = await registerNode();
  if (!result) {
    console.error("Registration failed, exiting");
    process.exit(1);
  }

  // Step 2: Sync skills
  const skillsOk = await syncSkills(result.nodeId);
  if (!skillsOk) {
    console.warn("Skills sync failed, but node is registered");
  }

  // Step 3: Start heartbeat
  console.log("\nStarting heartbeat service (every 30s)...");
  console.log("Press Ctrl+C to stop\n");

  // Send initial heartbeat
  await sendHeartbeat(result.nodeId);

  // Schedule periodic heartbeats
  const heartbeatInterval = setInterval(() => {
    sendHeartbeat(result.nodeId);
  }, 30000);

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n[OpenClaw] Shutting down...");
    clearInterval(heartbeatInterval);
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n[OpenClaw] Shutting down...");
    clearInterval(heartbeatInterval);
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { registerNode, syncSkills, sendHeartbeat, OPENCLAW_SKILLS };
