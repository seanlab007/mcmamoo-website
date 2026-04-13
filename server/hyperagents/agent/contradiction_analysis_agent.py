import os
import sys
import json
from typing import List, Dict, Any
import requests

# 确保可以导入 mao_rag
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils')))
from mao_rag import MaoRAG # 假设 mao_rag.py 也在 utils 目录下

class ContradictionAnalysisAgent:
    def __init__(self, workspace_root: str, mao_rag_instance: MaoRAG = None):
        self.workspace_root = workspace_root
        # 如果没有传入 MaoRAG 实例，则自己初始化一个
        if mao_rag_instance:
            self.rag = mao_rag_instance
        else:
            self.rag = MaoRAG(
                mao_text_dir=os.path.join(workspace_root, "server", "mao_corpus"),
                index_path=os.path.join(workspace_root, ".mao_rag_index.json"),
                embedding_model="nomic-embed-text",
            )
            # 确保 RAG 使用 Ollama 的 get_embedding
            self.rag.get_embedding = lambda text, model="nomic-embed-text": self.rag._get_ollama_embedding(text, model)

        self.llm_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("DEEPSEEK_API_KEY")
        self.llm_base_url = os.getenv("OPENAI_API_BASE") or "https://api.deepseek.com/v1"
        self.llm_model = "deepseek-chat" # 推荐使用 DeepSeek 或 GPT-4o

    def _call_llm(self, prompt: str) -> str:
        if not self.llm_api_key:
            return "错误：未配置 LLM API 密钥。请设置 OPENAI_API_KEY 或 DEEPSEEK_API_KEY。"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.llm_api_key}"
        }
        payload = {
            "model": self.llm_model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False
        }
        try:
            response = requests.post(self.llm_base_url + "/chat/completions", headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"LLM 调用失败: {e}"

    def analyze(self, problem_description: str) -> Dict[str, Any]:
        print(f"[ContradictionAnalysisAgent] 开始分析问题: {problem_description}")

        # 1. 从《毛选》RAG 中检索矛盾论相关原文
        # 使用 MaoRAG 的 retrieve 方法，它返回的是 MaoChunk 列表
        mao_chunks = self.rag.retrieve("矛盾论的核心思想和分析方法是什么？", top_k=5)
        mao_context = "\n\n".join([f"--- 来源: 《毛泽东选集》第{chunk.volume}卷《{chunk.chapter}》 ---\n{chunk.raw_text}" for chunk in mao_chunks])
        
        print("[ContradictionAnalysisAgent] 已检索到《矛盾论》相关原文。")

        # 2. 构建矛盾分析 Prompt
        analysis_prompt = f"""
        你是一个精通毛泽东战略思想的分析师，特别是《矛盾论》的专家。
        请你运用《矛盾论》的原理，对以下问题进行深入的矛盾分析。

        问题描述：{problem_description}

        《矛盾论》相关原文（供参考）：
        {mao_context}

        请严格按照以下步骤和格式进行分析：

        ### 1. 问题背景与核心矛盾识别
        - 简要概括问题背景。
        - 识别并阐述当前情境下的**主要矛盾**（即起主导和决定作用的矛盾）。
        - 识别并阐述当前情境下的**次要矛盾**（即处于从属地位的矛盾）。

        ### 2. 主要矛盾的特殊性分析
        - 针对主要矛盾，分析其**特殊性**，即它区别于其他矛盾的独特性质和表现形式。
        - 分析主要矛盾的**主要方面**和**次要方面**，并说明哪一方面目前处于主导地位。
        - 阐述主要矛盾的**转化条件**，即在什么条件下，主要方面和次要方面会相互转化。

        ### 3. 战略建议与行动方向
        - 基于上述矛盾分析，提出解决主要矛盾的**战略建议**。
        - 明确当前阶段的**主要行动方向**和**次要行动方向**。
        - 强调在解决矛盾过程中需要注意的**辩证关系**和**策略原则**。

        请确保分析逻辑严谨，语言精炼，并严格遵循《矛盾论》的哲学思想。
        """
        print("[ContradictionAnalysisAgent] 正在调用 LLM 进行矛盾分析...")
        llm_response = self._call_llm(analysis_prompt)
        print("[ContradictionAnalysisAgent] LLM 分析完成。")

        # 3. 解析 LLM 响应 (这里简化为直接返回文本，后续可增加结构化解析)
        return {
            "problem_description": problem_description,
            "analysis_result": llm_response,
            "mao_context_used": mao_context
        }

if __name__ == "__main__":
    # 示例用法
    # 请确保已设置 OPENAI_API_KEY 或 DEEPSEEK_API_KEY 环境变量
    # 并且 Ollama 服务已启动，nomic-embed-text 模型已下载
    
    # 假设脚本在 server/hyperagents/agent/ 目录下运行
    current_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
    
    agent = ContradictionAnalysisAgent(workspace_root)
    
    test_problem = "猫眼内容平台在短视频领域面临抖音和快手的激烈竞争，用户增长缓慢，如何突破困境？"
    analysis = agent.analyze(test_problem)
    
    print("\n--- 矛盾分析结果 ---")
    print(analysis["analysis_result"])
    print("\n--- 引用《矛盾论》原文 ---")
    print(analysis["mao_context_used"])
