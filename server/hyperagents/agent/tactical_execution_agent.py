import os
import json
from openai import OpenAI

class TacticalExecutionAgent:
    def __init__(self, workspace_root: str, mao_rag):
        self.workspace_root = workspace_root
        self.mao_rag = mao_rag
        self.client = OpenAI(
            api_key="sk-981846fa644848c8a41aeff541c4184b",
            base_url="https://api.deepseek.com"
        )
        self.model = "deepseek-chat"
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        prompt_path = os.path.join(self.workspace_root, "server", "hyperagents", "agent", "tactical_execution_agent_prompt.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    async def analyze(self, issue: str) -> dict:
        """基于毛泽东军事思想提出方案"""
        # 这里的实现与 analyze_tactics 类似，但为了接口统一
        return await self.analyze_tactics(issue, "初期创业公司", "成熟行业巨头", "有限的资金和技术团队")

    async def analyze_tactics(self, problem_description: str, current_strength: str, enemy_strength: str, resources: str) -> dict:
        query = f"问题描述: {problem_description}\n我方力量: {current_strength}\n敌方力量: {enemy_strength}\n可用资源: {resources}"
        
        # 使用 RAG 检索相关文献
        context = self.mao_rag.query(query, top_k=5)

        user_content = f"请根据以下问题和相关毛泽东军事思想文献，分析并提供具体的战术执行建议。\n\n问题：{query}\n\n相关文献：\n{context}\n\n请严格按照以下JSON格式输出：\n{{\n  \"tactical_principles\": [\"原则1\", \"原则2\"],\n  \"strategy_recommendations\": \"详细的战略建议\",\n  \"specific_tactics\": [\n    {{\n      \"name\": \"战术名称1\",\n      \"description\": \"战术描述1\",\n      \"implementation_steps\": [\"步骤1\", \"步骤2\"]\n    }},\n    {{\n      \"name\": \"战术名称2\",\n      \"description\": \"战术描述2\",\n      \"implementation_steps\": [\"步骤1\", \"步骤2\"]\n    }}\n  ],\n  \"risk_assessment\": \"风险评估\",\n  \"expected_outcomes\": \"预期结果\"\n}}"

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error during OpenAI API call: {e}")
            return {"error": str(e)}

    async def review(self, proposal_content: str) -> str:
        """基于毛泽东军事思想 Review 方案"""
        # 检索关于战略阶段、群众路线、统一战线等文献
        context = self.mao_rag.query("战略阶段 群众路线 统一战线 敌强我弱 人的因素", top_k=5)
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"请基于毛泽东军事思想（特别是战略阶段论、群众路线、人的因素第一等），对以下技术/工程方案进行战略 Review：\n\n方案内容：\n{proposal_content}\n\n相关思想背景：\n{context}\n\n请指出该方案在社会动员、战略节奏、以及处理复杂现实矛盾方面的潜在盲点，并给出改进建议。"}
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Mao Agent Review Error: {str(e)}"
