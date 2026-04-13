import os
import json
import asyncio
from openai import OpenAI
from .musk_agent import MuskAgent
from .tactical_execution_agent import TacticalExecutionAgent
from ..utils.code_rag import CodeRAG

class DualAgentReviewSystem:
    def __init__(self, workspace_root: str):
        self.workspace_root = workspace_root
        self.rag = CodeRAG(workspace_root)
        # 适配旧版 Ollama 的 RAG 配置
        self.rag.get_embedding = lambda text, model="all-minilm": self.rag._get_ollama_embedding(text, model)
        
        self.musk_agent = MuskAgent(workspace_root, self.rag)
        self.mao_agent = TacticalExecutionAgent(workspace_root, self.rag)
        self.client = OpenAI(
            api_key="sk-981846fa644848c8a41aeff541c4184b",
            base_url="https://api.deepseek.com"
        )
        self.model = "deepseek-chat"

    async def run_review_session(self, initial_proposal: str, rounds: int = 1):
        """
        运行双 Agent 相互 Review 会话。
        1. 毛泽东思想 Agent 先基于战略战术给出分析。
        2. 马斯克思想 Agent 基于第一性原理进行挑战和 Review。
        3. 毛泽东思想 Agent 针对马斯克的挑战进行回应和反 Review。
        """
        print(f"--- 初始方案 ---\n{initial_proposal}\n")
        
        # 1. 毛泽东思想 Agent 分析
        mao_analysis = await self.mao_agent.analyze_tactics(
            problem_description=initial_proposal,
            current_strength="待定",
            enemy_strength="待定",
            resources="待定"
        )
        mao_text = json.dumps(mao_analysis, ensure_ascii=False, indent=2)
        print(f"--- 毛泽东思想 Agent 战略分析 ---\n{mao_text}\n")
        
        # 2. 马斯克思想 Agent Review
        musk_review = await self.musk_agent.review_strategy(mao_text)
        print(f"--- 马斯克思想 Agent 第一性原理 Review ---\n{musk_review}\n")
        
        # 3. 毛泽东思想 Agent 反 Review
        # 构造反 Review 的提示词
        mao_rebuttal_prompt = f"马斯克思想 Agent 对你的战略分析提出了以下挑战：\n\n{musk_review}\n\n请基于毛泽东军事思想（如《论持久战》、矛盾论、实践论等），对马斯克的挑战进行回应。请指出马斯克工程思维中可能忽视的社会、政治和长期战略规律，并完善你的方案。"
        
        # 检索相关毛泽东文献
        mao_context = self.rag.query(musk_review, top_k=3)
        
        messages = [
            {"role": "system", "content": self.mao_agent.system_prompt},
            {"role": "user", "content": f"{mao_rebuttal_prompt}\n\n相关文献参考：\n{mao_context}"}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
            )
            mao_rebuttal = response.choices[0].message.content
            print(f"--- 毛泽东思想 Agent 战略回应 ---\n{mao_rebuttal}\n")
            return {
                "initial_proposal": initial_proposal,
                "mao_analysis": mao_analysis,
                "musk_review": musk_review,
                "mao_rebuttal": mao_rebuttal
            }
        except Exception as e:
            return {"error": str(e)}

if __name__ == "__main__":
    # 简单测试脚本
    async def test():
        system = DualAgentReviewSystem("/home/ubuntu/mcmamoo-website")
        await system.run_review_session("如何在竞争激烈的低空经济市场中建立壁垒？")
    
    asyncio.run(test())
