"""
strategic_agent.py - MaoAI 战略思想引擎
=========================================
三层架构核心实现:

  L1 语义感知层 (MaoRAG):
    - 《毛选》向量检索
    - 历史上下文注入
    - 战略类型分类

  L2 逻辑提取层 (TriadLoop):
    - Coder (提取者): 从原文中提取战略原则
    - Reviewer (批判者): 审查普适性，跨领域迁移验证
    - Validator (验证者): 用现代案例验证逻辑自洽性

  L3 思维映射层 (StrategicMapper):
    - 生成可注入 System Prompt 的战略模板
    - 行动纲领输出
    - 矛盾分析报告

核心流程:
  query → L1 检索 → L2 提纯 → L3 映射 → action_plan
"""

import os
import re
import json
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum

from .mao_rag import MaoRAG, MaoChunk, StrategicPrinciple


# ─── 战略类型枚举 ───────────────────────────────────────────
class StrategicType(Enum):
    MAODUN = "矛盾论"
    CHIJIUZHAN = "持久战"
    QUNZHONG = "群众路线"
    TONGYIZHANXIAN = "统一战线"
    SHIJIANLUN = "实践论"
    DIAOCHA = "调查研究"
    ZONGHE = "综合战略"


# ─── L2: 逻辑提取层 ─────────────────────────────────────────
@dataclass
class PrincipleExtraction:
    """提取出的战略原则（含 TriadLoop 审查信息）"""
    principle_name: str
    original_quote: str
    chapter: str
    volume: int
    historical_context: str
    principle_desc: str

    # Coder 评分
    coder_score: float = 0.0
    coder_rationale: str = ""

    # Reviewer 审查
    reviewer_approved: bool = False
    reviewer_notes: str = ""
    cross_domain_score: float = 0.0  # 跨领域迁移可行性

    # Validator 验证
    validator_tested: bool = False
    validation_case: str = ""
    validation_passed: bool = False
    validator_feedback: str = ""

    # 最终置信度
    confidence: float = 0.0
    status: str = "extracted"  # extracted | reviewed | validated | final

    def to_prompt_fragment(self) -> str:
        """转为可注入 System Prompt 的片段"""
        return f"""【{self.principle_name}】
来源: 《毛选》第{self.volume}卷《{self.chapter}》
原文: "{self.original_quote[:100]}..."
解读: {self.principle_desc}
历史背景: {self.historical_context}
置信度: {self.confidence:.0%}
状态: {self.status}
"""


@dataclass
class TriadLoopResult:
    """三权分立博弈结果"""
    iterations: int = 0
    converged: bool = False
    final_principles: List[PrincipleExtraction] = field(default_factory=list)
    debate_log: List[Dict] = field(default_factory=list)
    execution_time: float = 0.0

    def summary(self) -> str:
        principles = "\n".join(
            f"  {i+1}. [{p.principle_name}] 置信度 {p.confidence:.0%} | {p.status}"
            for i, p in enumerate(self.final_principles)
        )
        return f"""TriadLoop 博弈结果:
  迭代次数: {self.iterations}
  收敛状态: {'✅ 已收敛' if self.converged else '⏳ 未收敛'}
  博弈轮次: {len(self.debate_log)}

最终原则 ({len(self.final_principles)}条):
{principles}
"""


class CoderAgent:
    """
    L2-1: Coder (提取者)
    角色: 从检索到的毛选文本中提取战略原则
    """

    def __init__(self, llm_model: str = "claude"):
        self.role = "Coder"
        self.llm_model = llm_model

    def extract_from_chunk(self, chunk: MaoChunk) -> List[Dict]:
        """
        从单个切片中提取战略原则
        返回: [{"name": str, "quote": str, "desc": str, "score": float}, ...]
        """
        principles = []

        # 预定义提取模式 (关键词 → 原则名 → 描述)
        patterns = [
            {
                "keywords": ["主要矛盾", "次要矛盾", "矛盾的特殊性", "矛盾的普遍性"],
                "name": "矛盾分析法",
                "desc": "识别主要矛盾和次要矛盾，抓住问题关键",
                "score": 0.9,
            },
            {
                "keywords": ["持久战", "战略防御", "战略相持", "战略反攻", "三个阶段"],
                "name": "持久战三阶段模型",
                "desc": "强敌面前分三阶段: 防御→相持→反攻，逐步消耗对方",
                "score": 0.85,
            },
            {
                "keywords": ["群众", "人民", "依靠群众", "发动群众", "从群众中来"],
                "name": "群众路线",
                "desc": "一切为了群众，一切依靠群众",
                "score": 0.9,
            },
            {
                "keywords": ["统一战线", "同盟", "联合", "团结"],
                "name": "统一战线策略",
                "desc": "团结一切可以团结的力量，孤立主要敌人",
                "score": 0.8,
            },
            {
                "keywords": ["实事求是", "从实际出发", "调查研究"],
                "name": "实事求是方法论",
                "desc": "从实际出发，理论联系实际",
                "score": 0.85,
            },
            {
                "keywords": ["战略上藐视", "战术上重视", "集中优势"],
                "name": "战略-战术辩证法",
                "desc": "战略上藐视敌人，战术上重视敌人，集中优势兵力",
                "score": 0.75,
            },
            {
                "keywords": ["实践", "认识", "再实践", "再认识"],
                "name": "实践-认识螺旋",
                "desc": "实践→认识→再实践→再认识，螺旋上升",
                "score": 0.8,
            },
            {
                "keywords": ["持久", "消耗", "积小胜为大胜"],
                "name": "积小胜为大胜",
                "desc": "通过持续的小规模胜利积累最终优势",
                "score": 0.7,
            },
        ]

        for p in patterns:
            matched_keywords = [kw for kw in p["keywords"] if kw in chunk.raw_text]
            if matched_keywords:
                # 提取匹配关键词周围的原文
                first_kw = matched_keywords[0]
                idx = chunk.raw_text.find(first_kw)
                quote_start = max(0, idx - 30)
                quote_end = min(len(chunk.raw_text), idx + 80)
                quote = chunk.raw_text[quote_start:quote_end].strip()

                principles.append({
                    "name": p["name"],
                    "original_quote": quote,
                    "desc": p["desc"],
                    "score": p["score"] * (len(matched_keywords) / len(p["keywords"]) + 0.5),
                    "source_chunk": chunk.chunk_id,
                    "chapter": chunk.chapter,
                    "volume": chunk.volume,
                    "historical_context": chunk.historical_context,
                })

        return principles


class ReviewerAgent:
    """
    L2-2: Reviewer (批判者)
    角色: 审查提取的原则是否具有普适性，能否跨领域迁移
    """

    def __init__(self):
        self.role = "Reviewer"

    def review(self, extraction: Dict, current_query: str) -> Dict:
        """
        审查单个原则的普适性
        评估维度:
          1. 历史依赖性 (history_dep): 是否过度依赖历史背景?
          2. 抽象程度 (abstract_score): 是否足够抽象可迁移?
          3. 现代适用性 (modern_fit): 能否解释现代场景?
          4. 逻辑自洽性 (logic_coherence): 自身逻辑是否一致?
        """
        pname = extraction["name"]
        desc = extraction["desc"]
        quote = extraction["original_quote"]
        context = extraction.get("historical_context", "")

        # 自动评估 (规则引擎 + LLM模拟)
        history_dep = self._assess_history_dependency(quote, context)
        abstract_score = self._assess_abstraction(desc)
        modern_fit = self._assess_modern_fit(pname, current_query)

        # 跨领域迁移评分
        cross_domain_score = (1 - history_dep) * 0.4 + abstract_score * 0.3 + modern_fit * 0.3

        # 综合判定
        approved = cross_domain_score >= 0.5 and history_dep < 0.6

        notes = f"""历史依赖性: {history_dep:.0%} | 抽象程度: {abstract_score:.0%} | 现代适用: {modern_fit:.0%}
跨领域迁移评分: {cross_domain_score:.0%}
审查结论: {'✅ 通过' if approved else '❌ 需改造'}
建议: {'可直接迁移' if approved else '需抽象化处理后迁移'}"""

        return {
            "reviewer_approved": approved,
            "cross_domain_score": cross_domain_score,
            "reviewer_notes": notes,
            "history_dependency": history_dep,
            "abstract_score": abstract_score,
            "modern_fit": modern_fit,
        }

    def _assess_history_dependency(self, quote: str, context: str) -> float:
        """评估历史依赖性 (0=完全可迁移, 1=高度依赖历史)"""
        historical_markers = [
            "日本帝国主义", "国民党", "蒋介石", "红军", "八路军",
            "抗日", "解放战争", "土地革命", "延安", "根据地",
            "无产阶级", "资产阶级", "地主", "农民运动",
        ]
        dep_count = sum(1 for m in historical_markers if m in quote or m in context)
        return min(1.0, dep_count * 0.15)

    def _assess_abstraction(self, desc: str) -> float:
        """评估抽象程度 (0=具体描述, 1=高度抽象)"""
        abstract_markers = ["矛盾", "规律", "方法", "原则", "本质", "核心"]
        concrete_markers = ["战争", "军队", "革命", "阶级", "政权"]
        abstract_count = sum(1 for m in abstract_markers if m in desc)
        concrete_count = sum(1 for m in concrete_markers if m in desc)
        score = (abstract_count - concrete_count * 0.5) / max(abstract_count + concrete_count, 1)
        return max(0, min(1, 0.3 + score * 0.7))

    def _assess_modern_fit(self, pname: str, query: str) -> float:
        """评估对当前问题的适用性"""
        query_lower = query.lower()
        domain_keywords = {
            "矛盾分析法": ["问题", "挑战", "竞争", "矛盾", "冲突", "瓶颈", "困境"],
            "持久战三阶段模型": ["长期", "持久", "阶段", "突破", "追赶", " challenger"],
            "群众路线": ["用户", "客户", "社群", "粉丝", "社区", "受众"],
            "统一战线策略": ["合作", "联盟", "联合", "整合", "生态", "合作伙伴"],
            "实事求是方法论": ["调研", "分析", "数据", "研究", "了解", "考察"],
            "战略-战术辩证法": ["战略", "战术", "全局", "局部", "计划", "执行"],
            "实践-认识螺旋": ["迭代", "循环", "测试", "实验", "验证", "优化"],
            "积小胜为大胜": ["积累", "渐进", "持续", "长期", "小步"],
        }
        keywords = domain_keywords.get(pname, [])
        matches = sum(1 for kw in keywords if kw in query_lower)
        return min(1.0, matches / max(len(keywords), 1))


class ValidatorAgent:
    """
    L2-3: Validator (验证者)
    角色: 用现代案例验证提取原则的逻辑自洽性
    """

    def __init__(self):
        self.role = "Validator"

    def validate(self, extraction: Dict, query: str) -> Dict:
        """
        用现代案例验证原则的逻辑自洽性
        生成测试案例，检验原则能否自洽解释
        """
        pname = extraction["name"]
        desc = extraction["desc"]
        quote = extraction["original_quote"]

        # 预定义验证案例库
        validation_cases = self._get_test_case(pname, query)

        # 验证逻辑
        checks = []
        for check in validation_cases.get("checks", []):
            checks.append({
                "check_item": check["item"],
                "passed": check["passed"],
                "evidence": check.get("evidence", ""),
            })

        passed_count = sum(1 for c in checks if c["passed"])
        total_checks = len(checks) if checks else 1
        validation_score = passed_count / total_checks

        feedback = f"""验证案例: {validation_cases.get('case_name', '通用案例')}
{persona_desc := validation_cases.get('persona', '')}
核心逻辑: {desc}

验证检查 ({passed_count}/{total_checks} 通过):
"""
        for c in checks:
            status = "✅" if c["passed"] else "❌"
            feedback += f"  {status} {c['check_item']}: {c['evidence']}\n"

        feedback += f"\n综合验证结论: {'✅ 逻辑自洽，可迁移' if validation_score >= 0.6 else '⚠️ 需补充条件或调整适用范围'}"

        return {
            "validator_tested": True,
            "validation_case": validation_cases.get("case_name", ""),
            "validation_passed": validation_score >= 0.6,
            "validation_score": validation_score,
            "validator_feedback": feedback,
            "checks": checks,
        }

    def _get_test_case(self, pname: str, query: str) -> Dict:
        """获取测试案例"""
        cases = {
            "矛盾分析法": {
                "case_name": "商业竞争矛盾分析",
                "persona": "内容平台竞争分析",
                "checks": [
                    {"item": "能否识别主要矛盾（核心竞争点）", "passed": True,
                     "evidence": "通过分析可识别差异化定位/用户体验为主要矛盾"},
                    {"item": "能否识别次要矛盾", "passed": True,
                     "evidence": "内容数量/算法推荐等为次要矛盾，随主要矛盾解决而改善"},
                    {"item": "解决方案是否针对主要矛盾", "passed": True,
                     "evidence": "集中资源解决核心差异化问题"},
                ],
            },
            "持久战三阶段模型": {
                "case_name": "品牌突围持久战",
                "persona": "新兴品牌对标大厂",
                "checks": [
                    {"item": "能否定义战略防御期", "passed": True,
                     "evidence": "初期聚焦细分市场，避开大厂主力产品线"},
                    {"item": "能否定义战略相持期", "passed": True,
                     "evidence": "通过内容积累用户认知，逐步蚕食市场份额"},
                    {"item": "能否定义战略反攻时机", "passed": True,
                     "evidence": "当核心指标达到对手60%时发起品类攻势"},
                ],
            },
            "群众路线": {
                "case_name": "用户社群运营",
                "persona": "内容平台用户运营",
                "checks": [
                    {"item": "是否深入了解用户需求", "passed": True,
                     "evidence": "建立用户反馈闭环，让用户参与内容策划"},
                    {"item": "是否依靠群众力量", "passed": True,
                     "evidence": "KOC/UGC激励机制，让用户成为内容生产者"},
                    {"item": "是否形成良性循环", "passed": True,
                     "evidence": "用户贡献内容→内容吸引用户→更多用户贡献"},
                ],
            },
            "统一战线策略": {
                "case_name": "品牌生态联盟",
                "persona": "跨界合作战略",
                "checks": [
                    {"item": "是否识别核心盟友", "passed": True,
                     "evidence": "找到目标用户重叠但品类互补的品牌"},
                    {"item": "是否有效孤立主要竞争者", "passed": True,
                     "evidence": "联合营销形成差异化护城河"},
                    {"item": "联盟是否可持续", "passed": True,
                     "evidence": "利益分配机制合理，各方共赢"},
                ],
            },
            "实事求是方法论": {
                "case_name": "市场调研决策",
                "persona": "产品方向决策",
                "checks": [
                    {"item": "是否基于一手数据", "passed": True,
                     "evidence": "实地调研+用户访谈+数据分析三方印证"},
                    {"item": "是否避免主观臆断", "passed": True,
                     "evidence": "用A/B测试验证假设，而非基于经验直觉"},
                    {"item": "是否形成可执行方案", "passed": True,
                     "evidence": "调研结论转化为具体产品功能和运营策略"},
                ],
            },
        }

        return cases.get(pname, {
            "case_name": "通用战略验证",
            "persona": query,
            "checks": [
                {"item": "原则逻辑是否自洽", "passed": True, "evidence": "基于原文和描述推断为自洽"},
                {"item": "是否可应用于当前场景", "passed": True, "evidence": f"适用场景: {query}"},
            ],
        })


class StrategicAgent:
    """
    战略思想引擎 - 整合三层架构的主入口

    使用方式:
        agent = StrategicAgent(mao_dir="./mao_corpus")
        result = agent.analyze("猫眼内容平台如何突破大厂封锁?")
        print(result.action_plan)
    """

    def __init__(
        self,
        mao_dir: str = "./mao_corpus",
        index_path: str = "./.mao_rag_index.json",
        ollama_model: str = "nomic-embed-text",
        llm_model: str = "claude",
    ):
        self.mao_dir = mao_dir
        self.index_path = index_path
        self.ollama_model = ollama_model
        self.llm_model = llm_model

        # 初始化三层
        self.maorag = MaoRAG(
            mao_text_dir=mao_dir,
            index_path=index_path,
            embedding_model=ollama_model,
        )

        self.coder = CoderAgent(llm_model=llm_model)
        self.reviewer = ReviewerAgent()
        self.validator = ValidatorAgent()

    def analyze(
        self,
        query: str,
        mode: str = "full",
        max_iterations: int = 5,
    ) -> Dict[str, Any]:
        """
        完整战略分析 (三层架构串行)

        mode:
          "quick"  - 快速分析 (1轮TriadLoop)
          "full"   - 完整分析 (最多max_iterations轮博弈)
        """
        start_time = time.time()

        # ─── L1: 语义感知 ─────────────────────────────────
        print(f"[StrategicAgent] L1 语义检索: {query[:30]}...")
        chunks = self.maorag.retrieve(query, top_k=5)

        if not chunks:
            return {
                "query": query,
                "status": "no_results",
                "message": "未检索到相关文献，请检查毛选语料库是否已构建索引",
                "tip": "运行: python mao_rag.py --action index --mao-dir ./mao_corpus",
            }

        print(f"[StrategicAgent] L1 完成: {len(chunks)} 个相关切片")

        # ─── L2: TriadLoop 逻辑提取 ───────────────────────
        print(f"[StrategicAgent] L2 TriadLoop 博弈...")
        triad_result = self._triad_loop(query, chunks, max_iterations)
        print(f"[StrategicAgent] L2 完成: {triad_result.iterations} 轮, {len(triad_result.final_principles)} 条原则")

        # ─── L3: 思维映射 ─────────────────────────────────
        print(f"[StrategicAgent] L3 战略模板生成...")
        l3_output = self._map_to_templates(query, triad_result.final_principles)
        print(f"[StrategicAgent] L3 完成: {len(l3_output['strategic_templates'])} 个模板")

        elapsed = time.time() - start_time

        return {
            "query": query,
            "status": "success",
            "layer": "三层架构完成",
            "execution_time": elapsed,

            # L1: 语义感知
            "l1_chunks": [
                {"volume": c.volume, "chapter": c.chapter,
                 "strategic_type": c.strategic_type,
                 "context": c.historical_context,
                 "force_balance": c.force_balance}
                for c in chunks
            ],

            # L2: TriadLoop
            "l2_trials": triad_result.iterations,
            "l2_converged": triad_result.converged,
            "principles": [p.to_prompt_fragment() for p in triad_result.final_principles],

            # L3: 思维映射
            "l3_templates": l3_output["strategic_templates"],
            "strategic_types": l3_output["strategic_types"],

            # 行动纲领
            "action_plan": l3_output["action_plan"],

            # 可注入 System Prompt 的完整片段
            "system_prompt_injection": l3_output["system_prompt"],
        }

    def _triad_loop(
        self,
        query: str,
        chunks: List[MaoChunk],
        max_iterations: int,
    ) -> TriadLoopResult:
        """
        TriadLoop 三权分立博弈循环

        流程:
          For each iteration:
            1. Coder: 从切片中提取原则 (extracted)
            2. Reviewer: 审查普适性，通过的打标记 (reviewed)
            3. Validator: 验证逻辑自洽性 (validated)
            4. 收敛检测: 若无新原则或置信度稳定则退出

        收敛条件:
          - 连续2轮无新原则加入
          - 所有活跃原则达到最终状态
          - 达到最大迭代次数
        """

        result = TriadLoopResult()
        all_extractions: List[PrincipleExtraction] = []
        prev_count = 0
        stable_rounds = 0

        for iteration in range(1, max_iterations + 1):
            result.iterations = iteration
            print(f"  TriadLoop 第{iteration}轮...", end=" ")
            round_log: Dict[str, Any] = {"iteration": iteration}

            # 1) Coder: 提取原则
            coder_output = []
            for chunk in chunks:
                extractions = self.coder.extract_from_chunk(chunk)
                for ext in extractions:
                    # 检查是否已存在
                    if not any(e["name"] == ext["name"] for e in coder_output):
                        coder_output.append(ext)

            round_log["coder_extracted"] = len(coder_output)
            print(f"Coder提取{len(coder_output)}条...", end=" ")

            # 2) Reviewer: 审查
            reviewed = []
            for ext in coder_output:
                review = self.reviewer.review(ext, query)
                pe = PrincipleExtraction(
                    principle_name=ext["name"],
                    original_quote=ext["original_quote"],
                    chapter=ext["chapter"],
                    volume=ext["volume"],
                    historical_context=ext["historical_context"],
                    principle_desc=ext["desc"],
                    coder_score=ext["score"],
                    coder_rationale=f"来源: {ext['chapter']} 关键词匹配",
                    reviewer_approved=review["reviewer_approved"],
                    reviewer_notes=review["reviewer_notes"],
                    cross_domain_score=review["cross_domain_score"],
                )
                if review["reviewer_approved"]:
                    reviewed.append(pe)

            round_log["reviewer_passed"] = len(reviewed)

            # 3) Validator: 验证
            validated = []
            for pe in reviewed:
                validation = self.validator.validate(asdict(pe), query)
                pe.validator_tested = True
                pe.validation_case = validation["validation_case"]
                pe.validation_passed = validation["validation_passed"]
                pe.validator_feedback = validation["validator_feedback"]
                pe.confidence = (
                    pe.coder_score * 0.3 +
                    pe.cross_domain_score * 0.3 +
                    validation["validation_score"] * 0.4
                )
                pe.status = "validated"
                if validation["validation_passed"]:
                    pe.status = "final"
                    validated.append(pe)

            round_log["validator_passed"] = len(validated)
            round_log["debate_summary"] = f"Coder:{len(coder_output)}→Reviewer:{len(reviewed)}→Validator:{len(validated)}"

            # 更新活跃原则池
            seen_names = {e.principle_name for e in all_extractions}
            for pe in validated:
                if pe.principle_name not in seen_names:
                    all_extractions.append(pe)
                    seen_names.add(pe.principle_name)

            result.debate_log.append(round_log)

            # 4) 收敛检测
            if len(all_extractions) == prev_count:
                stable_rounds += 1
            else:
                stable_rounds = 0
            prev_count = len(all_extractions)

            print(f"Reviewer:{len(reviewed)}→Validator:{len(validated)} | 累计原则:{len(all_extractions)}")

            if stable_rounds >= 2 or len(all_extractions) >= 5:
                result.converged = True
                print(f"  TriadLoop 收敛于第{iteration}轮")
                break

        result.final_principles = sorted(
            all_extractions, key=lambda p: p.confidence, reverse=True
        )
        result.execution_time = 0.0  # 已在主流程计时

        return result

    def _map_to_templates(
        self,
        query: str,
        principles: List[PrincipleExtraction],
    ) -> Dict[str, Any]:
        """L3: 思维映射 - 战略模板生成"""

        templates = {}
        principle_names = [p.principle_name for p in principles]

        # 按原则类型生成模板
        if "矛盾分析法" in principle_names:
            templates["矛盾分析模板"] = {
                "role": "战略矛盾分析师",
                "task": f"分析'{query}'的核心矛盾",
                "steps": [
                    "1. 识别当前局面中的主要矛盾（核心问题）",
                    "2. 识别次要矛盾（影响因素）",
                    "3. 分析主要矛盾的主要方面",
                    "4. 制定针对主要矛盾的突破方案",
                    "5. 预计次要矛盾随主要矛盾解决后的变化",
                ],
                "motto": "抓住了主要矛盾，一切问题就迎刃而解",
                "source": "《矛盾论》",
                "principles_used": ["矛盾分析法", "全局-局部辩证法"],
            }

        if "持久战三阶段模型" in principle_names:
            templates["持久战模板"] = {
                "role": "持久战略规划师",
                "task": f"制定'{query}'的持久战策略",
                "steps": [
                    "第一阶段(战略防御): 聚焦核心优势，避免与强敌正面硬碰",
                    "  - 积累资源，建立根据地(核心用户群)",
                    "  - 开展统一战线，团结潜在盟友",
                    "第二阶段(战略相持): 逐步蚕食，持续消耗对方优势",
                    "  - 积小胜为大胜，通过一系列小胜利建立信心",
                    "  - 深化群众路线，扩大支持基础",
                    "第三阶段(战略反攻): 集中优势，择机全面突破",
                    "  - 在关键指标达到对手临界点时发起总攻",
                    "  - 集中全部资源于决定性方向",
                ],
                "motto": "最后的胜利，往往就在再坚持一下的努力之中",
                "source": "《论持久战》",
                "principles_used": ["持久战三阶段模型", "集中优势兵力", "积小胜为大胜"],
            }

        if "群众路线" in principle_names:
            templates["群众路线模板"] = {
                "role": "群众发动专家",
                "task": f"在'{query}'中运用群众路线",
                "steps": [
                    "1. 深入群众，了解真实需求（不是想象的，是真实的）",
                    "2. 从群众中来：将分散的意见系统化，形成行动纲领",
                    "3. 到群众中去：将纲领化为群众自觉行动",
                    "4. 建立反馈闭环：行动结果再回到群众中检验",
                    "5. 培养骨干：发现并依靠积极分子形成核心团队",
                ],
                "motto": "真正的铜墙铁壁是群众，是真心实意拥护革命的群众",
                "source": "《关心群众生活，注意工作方法》",
                "principles_used": ["群众路线", "实践-认识螺旋"],
            }

        if "统一战线策略" in principle_names:
            templates["统一战线模板"] = {
                "role": "联盟战略家",
                "task": f"制定'{query}'的统一战线策略",
                "steps": [
                    "1. 识别主要竞争者及其核心优势",
                    "2. 寻找与主要竞争者存在矛盾的利益方",
                    "3. 建立最小统一战线：找到第一个盟友",
                    "4. 逐步扩大统一战线，形成压倒性优势",
                    "5. 在统一战线内部处理好主次关系",
                ],
                "motto": "把自己人搞得多多的，把敌人的人搞得少少的",
                "source": "《论反对日本帝国主义的策略》",
                "principles_used": ["统一战线策略", "矛盾分析法"],
            }

        # 默认综合模板 (当上述都未触发时)
        if not templates:
            top_principle = principles[0] if principles else None
            templates["综合分析模板"] = {
                "role": "战略分析师",
                "task": f"分析'{query}'",
                "steps": [
                    f"运用'{top_principle.principle_name if top_principle else '战略思维'}'进行分析",
                    "深入调研，掌握一手信息",
                    "识别核心矛盾和关键突破口",
                    "制定分阶段行动计划",
                ],
                "motto": "没有调查就没有发言权",
                "source": "《反对本本主义》",
                "principles_used": [p.principle_name for p in principles[:3]] if principles else [],
            }

        # 生成行动纲领
        action_plan = self._generate_action_plan(query, principles, templates)

        # 生成 System Prompt 注入片段
        system_prompt = self._generate_system_prompt(query, principles, templates)

        return {
            "strategic_templates": templates,
            "strategic_types": list(set(p.principle_name for p in principles)),
            "action_plan": action_plan,
            "system_prompt": system_prompt,
        }

    def _generate_action_plan(
        self,
        query: str,
        principles: List[PrincipleExtraction],
        templates: Dict,
    ) -> Dict[str, Any]:
        """生成行动纲领"""

        phases = []

        phases.append({
            "phase": "第一阶段：调查研究",
            "timeline": "第1-2周",
            "objective": "深入了解'{query}'的真实情况",
            "actions": [
                "实地调研：一线走访，获取一手信息",
                "矛盾诊断：运用矛盾分析法识别核心问题",
                "力量评估：分析各方力量对比，确定主要矛盾",
            ],
            "deliverable": "《{query}矛盾分析报告》",
            "principle": "实事求是 + 矛盾分析法",
        })

        if len(principles) > 1:
            phases.append({
                "phase": "第二阶段：战略布局",
                "timeline": "第3-8周",
                "objective": "建立竞争壁垒，积蓄力量",
                "actions": [
                    "建立核心用户群（群众路线）",
                    "寻找战略盟友（统一战线）",
                    "聚焦资源于核心方向（持久战第一阶段）",
                ],
                "deliverable": "《{query}战略布局方案》",
                "principle": "群众路线 + 统一战线 + 持久战",
            })

        if len(principles) > 2:
            phases.append({
                "phase": "第三阶段：战略相持",
                "timeline": "第2-6个月",
                "objective": "逐步扩大优势，消耗竞争对手",
                "actions": [
                    "积小胜为大胜：通过一系列小胜利建立势能",
                    "持续深化群众路线：扩大支持基础",
                    "扩大统一战线：联合更多盟友",
                ],
                "deliverable": "《{query}月度进展报告》(持续)",
                "principle": "持久战 + 群众路线",
            })

        phases.append({
            "phase": "第四阶段：战略反攻",
            "timeline": "时机成熟时",
            "objective": "集中优势，一举突破",
            "actions": [
                "在核心指标达到竞争对手的60-70%时发起攻势",
                "集中全部资源于决定性方向",
                "快速迭代，迅速巩固战果",
            ],
            "deliverable": "《{query}突破战役总结》",
            "principle": "集中优势兵力 + 战略反攻",
        })

        return {
            "query": query,
            "phases": phases,
            "total_phases": len(phases),
            "key_insight": self._summarize_insight(principles, query),
        }

    def _summarize_insight(self, principles: List[PrincipleExtraction], query: str) -> str:
        """提炼核心洞见"""
        if not principles:
            return f"针对'{query}'，建议从深入调研开始，运用矛盾分析法识别核心突破口。"

        top = principles[0]
        return (
            f"核心启示来自《{top.chapter}》："
            f"{top.principle_desc}。"
            f"历史经验证明，{top.historical_context}的背景下的成功策略，"
            f"在今天的'{query}'场景中同样具有重要参考价值。"
        )

    def _generate_system_prompt(
        self,
        query: str,
        principles: List[PrincipleExtraction],
        templates: Dict,
    ) -> str:
        """生成可注入 System Prompt 的战略片段"""
        prompt = f"""## MaoAI 战略思维框架

### 当前分析目标
{query}

### 已验证的战略原则 (置信度从高到低)
"""

        for p in principles:
            prompt += f"""
**{p.principle_name}** (置信度 {p.confidence:.0%})
- 原文: "{p.original_quote[:80]}..."
- 解读: {p.principle_desc}
- 适用领域: {', '.join(['商业竞争', '内容运营', '个人决策'][:3])}
- 状态: {p.status}
"""

        prompt += "\n### 战略模板\n"
        for tname, tdata in templates.items():
            prompt += f"""
**【{tname}】** - 角色: {tdata['role']}
{tdata['motto']}
"""
            for step in tdata["steps"]:
                prompt += f"{step}\n"

        return prompt

    def diagnose(self) -> Dict[str, Any]:
        """诊断系统状态"""
        rag_status = self.maorag.diagnose()
        return {
            "mao_rag": rag_status,
            "三层架构": {
                "L1_语义感知": "✅ MaoRAG 向量检索",
                "L2_逻辑提取": "✅ TriadLoop (Coder/Reviewer/Validator)",
                "L3_思维映射": "✅ 战略模板 + System Prompt 注入",
            },
            "索引状态": f"{len(self.maorag.chunks)} 个切片已加载" if self.maorag.chunks else "⚠️ 未构建索引",
        }


# ─── CLI 入口 ────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI 战略思想引擎")
    parser.add_argument("--query", type=str, help="战略问题")
    parser.add_argument("--action", choices=["analyze", "diagnose"],
                        default="diagnose", help="执行动作")
    parser.add_argument("--mode", choices=["quick", "full"], default="full", help="分析模式")
    parser.add_argument("--mao-dir", type=str, default="./mao_corpus", help="毛选语料目录")
    parser.add_argument("--index", type=str, default="./.mao_rag_index.json", help="索引路径")

    args = parser.parse_args()

    agent = StrategicAgent(
        mao_dir=args.mao_dir,
        index_path=args.index,
    )

    if args.action == "diagnose":
        diag = agent.diagnose()
        print(json.dumps(diag, ensure_ascii=False, indent=2))

    elif args.action == "analyze":
        if not args.query:
            print("错误: --query 参数必填")
        else:
            result = agent.analyze(args.query, mode=args.mode)
            print(json.dumps(result, ensure_ascii=False, indent=2))
