import { Router } from "express";
import { ContradictionAnalysisAgent } from "./hyperagents/agent/contradiction_analysis_agent";
import { MaoRAG } from "./hyperagents/utils/mao_rag";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const strategicAnalysisRouter = Router();

// 初始化 MaoRAG 和 ContradictionAnalysisAgent
// 注意：这里需要确保 .mao_rag_index.json 已经通过 python3 rebuild_rag.py 生成
const workspaceRoot = path.resolve(__dirname, ".."); // 指向 mcmamoo-website 根目录
const maoCorpusDir = path.join(workspaceRoot, "server", "mao_corpus");
const maoRAGIndex = path.join(workspaceRoot, ".mao_rag_index.json");

let maoRAGInstance: MaoRAG | null = null;
let contradictionAgent: ContradictionAnalysisAgent | null = null;

async function initStrategicAgents() {
    try {
        maoRAGInstance = new MaoRAG(maoCorpusDir, maoRAGIndex);
        // 尝试加载索引，如果不存在则提示用户先运行 rebuild_rag.py
        if (!maoRAGInstance.store.data || maoRAGInstance.store.data.length === 0) {
            console.warn("[StrategicAnalysis] MaoRAG index not found or empty. Please run `python3 rebuild_rag.py` in server/hyperagents/utils.");
            // 可以考虑在这里触发一个异步索引过程，或者直接报错
        }
        contradictionAgent = new ContradictionAnalysisAgent(workspaceRoot, maoRAGInstance);
        console.log("[StrategicAnalysis] ContradictionAnalysisAgent initialized.");
    } catch (error) {
        console.error("[StrategicAnalysis] Failed to initialize agents:", error);
    }
}

// 在服务器启动时初始化 Agent
initStrategicAgents();

strategicAnalysisRouter.post("/contradiction", async (req, res) => {
    if (!contradictionAgent) {
        return res.status(500).json({ error: "Strategic analysis agent not initialized." });
    }

    const { problemDescription } = req.body;

    if (!problemDescription) {
        return res.status(400).json({ error: "problemDescription is required." });
    }

    try {
        const analysisResult = await contradictionAgent.analyze(problemDescription);
        res.json(analysisResult);
    } catch (error) {
        console.error("[StrategicAnalysis] Contradiction analysis failed:", error);
        res.status(500).json({ error: "Failed to perform contradiction analysis." });
    }
});

// 可以添加其他战略分析接口，例如持久战推演、统一战线构建等
strategicAnalysisRouter.post("/long_war", async (req, res) => {
    // ... 持久战推演逻辑
    res.status(501).json({ message: "Long War analysis not yet implemented." });
});

strategicAnalysisRouter.post("/united_front", async (req, res) => {
    // ... 统一战线构建逻辑
    res.status(501).json({ message: "United Front analysis not yet implemented." });
});
