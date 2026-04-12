/**
 * MaoAI Autonomous Agent Engine (Manus Max Architecture)
 * ─────────────────────────────────────────────────────────────────────────────
 * 核心逻辑：ReAct (Reasoning + Acting) 循环
 * 1. Input -> 2. Thought -> 3. Action -> 4. Observation -> 5. Repeat
 */

import { z } from "zod";
import OpenAI from "openai";

// ─── 1. 工具定义 (Tool Registry) ─────────────────────────────────────────────
// 使用 Zod 定义工具的输入 Schema，确保 AI 传参的类型安全
const ToolSchema = z.object({
  name: z.string(),
  args: z.any(),
});

type ToolResult = {
  success: boolean;
  output: string;
  error?: string;
};

// 模拟工具集：您可以根据需要扩展（如：联网搜索、代码执行、文件读写）
const tools: Record<string, (args: any) => Promise<ToolResult>> = {
  web_search: async ({ query }) => {
    console.log(`[Tool] Searching for: ${query}`);
    // 实际集成 Tavily 或 Serper API
    return { success: true, output: `Found results for "${query}": ...` };
  },
  run_code: async ({ code, language }) => {
    console.log(`[Tool] Running ${language} code...`);
    // 实际集成 E2B 或本地 Docker 沙盒
    try {
      // 模拟执行结果
      return { success: true, output: "Execution successful: Result = 42" };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
  read_file: async ({ path }) => {
    console.log(`[Tool] Reading file: ${path}`);
    // 实际集成 fs.readFile
    return { success: true, output: "File content: export const config = { ... }" };
  }
};

// ─── 2. 推理循环 (The Loop) ──────────────────────────────────────────────────
export async function runAgentLoop(
  userInput: string,
  model: string = "gpt-4-turbo",
  maxRounds: number = 10
) {
  const openai = new OpenAI();
  
  // 核心 System Prompt：强制 AI 遵循 ReAct 格式
  const systemPrompt = `
You are an Autonomous Agent with High-Order Reasoning.
Follow this format for every step:

Thought: Describe your reasoning about what to do next.
Action: { "name": "tool_name", "args": { "arg1": "val1" } }
Observation: (This will be provided by the system after you output an Action)

Available Tools:
- web_search(query: string): Search the internet.
- run_code(code: string, language: "python" | "javascript"): Execute code in a sandbox.
- read_file(path: string): Read a file from the project.

When you have the final answer, output:
Final Answer: Your comprehensive response to the user.
  `;

  let messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userInput }
  ];

  console.log("--- Starting Agent Loop ---");

  for (let round = 1; round <= maxRounds; round++) {
    console.log(`\n[Round ${round}] Reasoning...`);
    
    const response = await openai.chat.completions.create({
      model,
      messages,
      stop: ["Observation:"], // 强制 AI 在输出 Action 后停止，等待系统反馈 Observation
      temperature: 0,
    });

    const content = response.choices[0].message.content || "";
    console.log(content);
    messages.push({ role: "assistant", content });

    // 检查是否完成
    if (content.includes("Final Answer:")) {
      return content.split("Final Answer:")[1].trim();
    }

    // 解析 Action
    const actionMatch = content.match(/Action:\s*({.*})/s);
    if (actionMatch) {
      try {
        const actionJson = JSON.parse(actionMatch[1]);
        const { name, args } = ToolSchema.parse(actionJson);
        
        // 执行工具
        const toolFn = tools[name];
        if (!toolFn) throw new Error(`Unknown tool: ${name}`);
        
        const result = await toolFn(args);
        
        // 反馈 Observation 给 AI
        const observation = result.success 
          ? `Observation: ${result.output}` 
          : `Observation Error: ${result.error}`;
        
        console.log(observation);
        messages.push({ role: "user", content: observation });
        
      } catch (err: any) {
        const errorMsg = `Observation Error: Invalid Action format or execution failed. ${err.message}`;
        console.log(errorMsg);
        messages.push({ role: "user", content: errorMsg });
      }
    } else {
      // 如果 AI 没输出 Action 也没输出 Final Answer，提示它继续
      messages.push({ role: "user", content: "Observation: Please provide an Action or Final Answer." });
    }
  }

  return "Max rounds reached without a final answer.";
}

// ─── 3. 使用示例 ─────────────────────────────────────────────────────────────
/*
runAgentLoop("Check the current project config and fix any potential bugs in the login logic.")
  .then(answer => console.log("\n--- Final Result ---\n", answer));
*/
