import os
import json
from typing import List, Dict, Any
from ..utils.mao_rag import MaoRAG
from ..utils.llm_utils import get_llm_response

class UnitedFrontAgent:
    """
    统一战线 Agent：基于毛泽东统一战线思想，分析利益相关方，识别敌我友，构建最广泛的联盟。
    核心思想：
    1. 敌我友划分
    2. 争取中间力量
    3. 策略与原则
    """

    def __init__(self, workspace_root: str, mao_rag: MaoRAG):
        self.workspace_root = workspace_root
        self.mao_rag = mao_rag
        self.llm_model = "gpt-4o" # 或其他合适的LLM模型

    async def analyze(self, problem_description: str, stakeholders: List[str]) -> Dict[str, Any]:
        """
        分析当前问题，构建统一战线策略。
        :param problem_description: 用户描述的战略问题或市场困境。
        :param stakeholders: 利益相关方列表。
        :return: 统一战线分析结果。
        """
        print(f"[UnitedFrontAgent] Starting analysis for: {problem_description}")

        # 1. 从《毛选》中检索统一战线相关原文作为上下文
        rag_context = self.mao_rag.query(
            f"统一战线、敌我友、争取中间力量、团结 {problem_description}",
            top_k=5,
            strategic_type="统一战线"
        )
        mao_quotes = [
            {"text": c.raw_text, "volume": c.volume, "chapter": c.chapter}
            for c in rag_context
        ]
        context_text = "\n\n".join([c.raw_text for c in rag_context])

        # 2. 构建 LLM Prompt
        stakeholders_str = ", ".join(stakeholders)
        prompt = f"""
        你是一个精通毛泽东统一战线思想的战略分析师。请根据用户提供的战略问题和利益相关方，结合统一战线的核心思想，进行深度分析并提出构建联盟的策略。

        用户战略问题：{problem_description}
        利益相关方：{stakeholders_str}

        《毛泽东选集》相关原文参考：
        """{context_text}"""

        请你严格按照以下结构输出JSON格式的分析结果，不要包含任何额外文字或解释：
        {{
            "enemyIdentification": "谁是主要敌人？",
            "friendIdentification": "谁是我们的朋友？",
            "neutralForces": "谁是中间力量，如何争取？",
            "allianceStrategy": [
                "构建联盟的具体策略1",
                "构建联盟的具体策略2"
            ],
            "principlesToFollow": [
                "应遵循的统一战线原则1",
                "应遵循的统一战线原则2"
            ],
            "maoQuotes": {json.dumps(mao_quotes, ensure_ascii=False)} // 直接引用相关毛选原文
        }}
        """

        # 3. 调用 LLM 进行分析
        try:
            llm_response_text = await get_llm_response(prompt, model=self.llm_model, temperature=0.7)
            analysis_result = json.loads(llm_response_text)
            print(f"[UnitedFrontAgent] Analysis complete.")
            return analysis_result
        except json.JSONDecodeError as e:
            print(f"[UnitedFrontAgent] LLM response is not valid JSON: {llm_response_text}. Error: {e}")
            raise ValueError("LLM返回格式错误，请重试。")
        except Exception as e:
            print(f"[UnitedFrontAgent] Error during LLM call: {e}")
            raise

# 辅助函数：获取LLM响应 (假设已存在于llm_utils.py)
# from ..utils.llm_utils import get_llm_response
