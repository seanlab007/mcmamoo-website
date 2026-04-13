import os
import json
from openai import OpenAI
from typing import Dict, Any, List

class MuskAgent:
    def __init__(self, workspace_root: str, rag_engine):
        self.workspace_root = workspace_root
        self.rag_engine = rag_engine
        self.client = OpenAI(
            api_key="sk-981846fa644848c8a41aeff541c4184b",
            base_url="https://api.deepseek.com"
        )
        self.model = "deepseek-chat"
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        prompt_path = os.path.join(self.workspace_root, "server", "hyperagents", "agent", "musk_agent_prompt.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    async def analyze(self, issue: str) -> Dict:
        """基于第一性原理提出方案"""
        context = self.rag_engine.query("马斯克 第一性原理 五步工作法 物理学 极限成本", top_k=3)
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"针对以下议题，请基于第一性原理提出一个极致的工程和商业方案：\n\n议题：{issue}\n\n相关思想背景：\n{context}\n\n请输出 JSON 格式，包含：\n1. 物理极限拆解\n2. 五步工作法应用路径\n3. 核心技术壁垒构建\n4. 预期指数级提升指标"}
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {"error": str(e)}

    async def review_strategy(self, strategy_content: str) -> str:
        """Review 方案"""
        context = self.rag_engine.query("马斯克 第一性原理 五步工作法 迭代 物理学", top_k=3)
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"请基于马斯克的第一性原理和工程哲学，对以下战略方案进行 Review 和挑战：\n\n方案内容：\n{strategy_content}\n\n相关思想背景：\n{context}\n\n请指出方案中的类比思维陷阱，并提出如何通过第一性原理进行重构。"}
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Musk Agent Error: {str(e)}"

    async def respond(self, review_content: str) -> str:
        """回应 Review"""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"你收到了来自毛泽东思想 Agent 的战略 Review。请基于你的工程哲学进行回应，重点讨论如何在坚持物理真理的同时，处理复杂的现实环境：\n\nReview 内容：\n{review_content}"}
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Musk Agent Error: {str(e)}"
