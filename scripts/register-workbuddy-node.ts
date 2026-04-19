/**
 * WorkBuddy → MaoAI 节点注册脚本
 * 
 * 用途：将 WorkBuddy 作为本地节点注册到 MaoAI，实现双向打通
 * 运行时机：WorkBuddy 启动时 / MaoAI 启动后
 * 
 * 使用方法：
 *   ts-node scripts/register-workbuddy-node.ts
 * 或
 *   node --loader ts-node/esm scripts/register-workbuddy-node.ts
 */

const MAOAI_BASE_URL = process.env.MAOAI_BASE_URL || "http://localhost:3000/api/ai";
const NODE_REGISTRATION_TOKEN = process.env.NODE_REGISTRATION_TOKEN || "";
const WORKBUDDY_BASE_URL = process.env.WORKBUDDY_BASE_URL || "http://localhost:8080";

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

// WorkBuddy 内置 Skills 定义
const WORKBUDDY_SKILLS = [
  {
    skillId: "file_read",
    name: "读取文件",
    description: "读取本地文件内容",
    triggers: ["读文件", "打开文件", "查看文件", "read file", "open file"],
    invokeMode: "invoke" as const,
    required_plan: "free",
  },
  {
    skillId: "file_write",
    name: "写入文件",
    description: "写入内容到本地文件",
    triggers: ["写文件", "保存文件", "创建文件", "write file", "save file"],
    invokeMode: "invoke" as const,
    required_plan: "free",
  },
  {
    skillId: "code_search",
    name: "代码搜索",
    description: "在代码库中搜索符号或文本",
    triggers: ["搜索代码", "查找代码", "code search", "find code"],
    invokeMode: "invoke" as const,
    required_plan: "free",
  },
  {
    skillId: "terminal_execute",
    name: "执行命令",
    description: "在终端执行 shell 命令",
    triggers: ["执行命令", "运行命令", "execute", "run command"],
    invokeMode: "invoke" as const,
    required_plan: "admin", // 需要管理员权限
  },
  {
    skillId: "browser_automation",
    name: "浏览器自动化",
    description: "控制浏览器进行网页操作",
    triggers: ["打开网页", "浏览网站", "截图", "browser", "webpage"],
    invokeMode: "invoke" as const,
    required_plan: "content",
  },
];

async function registerNode(): Promise<{ nodeId: number; action: string } | null> {
  if (!NODE_REGISTRATION_TOKEN) {
    console.error("[WorkBuddy Register] NODE_REGISTRATION_TOKEN not set");
    return null;
  }

  const payload: NodeRegistrationPayload = {
    token: NODE_REGISTRATION_TOKEN,
    name: "WorkBuddy / Local",
    baseUrl: `${WORKBUDDY_BASE_URL}/v1`,
    type: "workbuddy",
    modelId: "workbuddy-local",
    priority: 100,
    description: `WorkBuddy IDE Agent Node - Registered at ${new Date().toISOString()}`,
  };

  try {
    const res = await fetch(`${MAOAI_BASE_URL}/node/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[WorkBuddy Register] Failed:", err);
      return null;
    }

    const data = await res.json();
    console.log(`[WorkBuddy Register] Success: nodeId=${data.nodeId}, action=${data.action}`);
    return data;
  } catch (err) {
    console.error("[WorkBuddy Register] Error:", err);
    return null;
  }
}

async function syncSkills(nodeId: number): Promise<boolean> {
  if (!NODE_REGISTRATION_TOKEN) return false;

  const payload: SkillRegistrationPayload = {
    token: NODE_REGISTRATION_TOKEN,
    nodeId,
    action: "replace_all",
    skills: WORKBUDDY_SKILLS,
  };

  try {
    const res = await fetch(`${MAOAI_BASE_URL}/node/skills/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[WorkBuddy Skills] Sync failed:", err);
      return false;
    }

    const data = await res.json();
    console.log(`[WorkBuddy Skills] Synced ${data.count} skills`);
    return true;
  } catch (err) {
    console.error("[WorkBuddy Skills] Error:", err);
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
    console.log(`[WorkBuddy Heartbeat] Sent for node ${nodeId}`);
  } catch (err) {
    console.error("[WorkBuddy Heartbeat] Error:", err);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("WorkBuddy → MaoAI Node Registration");
  console.log("=".repeat(60));
  console.log(`MaoAI Base URL: ${MAOAI_BASE_URL}`);
  console.log(`WorkBuddy Base URL: ${WORKBUDDY_BASE_URL}`);
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
    console.log("\n[WorkBuddy] Shutting down...");
    clearInterval(heartbeatInterval);
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n[WorkBuddy] Shutting down...");
    clearInterval(heartbeatInterval);
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { registerNode, syncSkills, sendHeartbeat, WORKBUDDY_SKILLS };
