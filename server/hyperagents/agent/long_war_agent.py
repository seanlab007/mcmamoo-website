import os
import json
from typing import List, Dict, Any
from ..utils.mao_rag import MaoRAG
from ..utils.llm_utils import get_llm_response

class LongWarAgent:
    """
    持久战 Agent：基于《论持久战》的核心思想，分析当前局势并推演战略阶段。
    核心思想：
    1. 敌我力量对比分析
    2. 战争发展阶段推演（战略防御、战略相持、战略反攻）
    3. 制定各阶段的战略方针
    """

    def __init__(self, workspace_root: str, mao_rag: MaoRAG):
        self.workspace_root = workspace_root
        self.mao_rag = mao_rag
        self.llm_model = "gpt-4o" # 或其他合适的LLM模型

    async def analyze(self, problem_description: str, enemy_strength: str, our_strength: str) -> Dict[str, Any]:
        """
        分析当前问题，推演持久战战略。
        :param problem_description: 用户描述的战略问题或市场困境。
        :param enemy_strength: 敌方力量描述。
        :param our_strength: 我方力量描述。
        :return: 持久战分析结果。
        """
        print(f"[LongWarAgent] Starting analysis for: {problem_description}")

        # 1. 从《毛选》中检索持久战相关原文作为上下文
        rag_context = self.mao_rag.query(
            f"论持久战、战略防御、战略相持、战略反攻、敌强我弱、以空间换时间 {problem_description}",
            top_k=5,
            strategic_type="持久战"
        )
        mao_quotes = [
            {"text": c.raw_text, "volume": c.volume, "chapter": c.chapter}
            for c in rag_context
        ]
        context_text = "\n\n".join([c.raw_text for c in rag_context])

        # 2. 构建 LLM Prompt
        prompt = f"""
        你是一个精通毛泽东《论持久战》思想的战略分析师。请根据用户提供的战略问题、敌我力量对比，结合《论持久战》的核心思想，进行深度分析并推演持久战的战略阶段和方针。

        用户战略问题：{problem_description}
        敌方力量描述：{enemy_strength}
        我方力量描述：{our_strength}

        《毛泽东选集》相关原文参考：
        """{context_text}"""

        请你严格按照以下结构输出JSON格式的分析结果，不要包含任何额外文字或解释：
        {{
            "currentSituation": "对当前敌我力量对比和局势的判断，属于持久战的哪个阶段（战略防御、战略相持、战略反攻）？",
            "strategicPhase": "当前所处的持久战阶段（战略防御/战略相持/战略反攻）",
            "phaseCharacteristics": "当前阶段的主要特点和任务",
            "strategicPrinciples": [
                "本阶段应遵循的核心战略原则1",
                "本阶段应遵循的核心战略原则2"
            ],
            "actionSuggestions": [
                "具体行动建议1",
                "具体行动建议2"
            ],
            "maoQuotes": {json.dumps(mao_quotes, ensure_ascii=False)} // 直接引用相关毛选原文
        }}
        """

        # 3. 调用 LLM 进行分析
        try:
            llm_response_text = await get_llm_response(prompt, model=self.llm_model, temperature=0.7)
            analysis_result = json.loads(llm_response_text)
            print(f"[LongWarAgent] Analysis complete.")
            return analysis_result
        except json.JSONDecodeError as e:
            print(f"[LongWarAgent] LLM response is not valid JSON: {llm_response_text}. Error: {e}")
            raise ValueError("LLM返回格式错误，请重试。")
        except Exception as e:
            print(f"[LongWarAgent] Error during LLM call: {e}")
            raise

# 辅助函数：获取LLM响应 (假设已存在于llm_utils.py)
# from ..utils.llm_utils import get_llm_response
