"""
mao_rag.py - 《毛泽东选集》专属语义检索系统
=============================================
三层架构:
  L1 语义感知层 (Semantic Perception): 向量检索 + 历史上下文注入
  L2 逻辑提取层 (Logic Extraction): TriadLoop 思想提纯
  L3 思维映射层 (Thinking Mapping): 战略模板生成

设计原则:
  - 大段论证优先 (1000-1500字切片)
  - 历史上下文元数据 (敌我力量对比、主要矛盾)
  - 矛盾论 / 持久战 / 群众路线 三大框架索引
  - Ollama nomic-embed-text 本地向量 (768维)
"""

import os
import re
import json
import math
import time
import requests
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict, field
from datetime import datetime
from pathlib import Path
from .code_rag import SimpleVectorStore


# ─── 毛选元数据结构 ───────────────────────────────────────────
@dataclass
class MaoChunk:
    """语义切片单元"""
    chunk_id: str
    volume: int          # 第几卷 (1-5)
    chapter: str         # 章节标题
    section: str         # 小节/段落标题
    raw_text: str        # 原文
    summary: str         # 核心论点摘要
    keywords: List[str]  # 关键词标签
    strategic_type: str  # 战略类型: "矛盾论" | "持久战" | "群众路线" | "统一战线" | "实践论" | "其他"
    historical_context: str  # 历史背景描述
    force_balance: str   # 敌我力量对比
    main_contradiction: str  # 主要矛盾
    embedding: Optional[List[float]] = None


@dataclass
class StrategicPrinciple:
    """从原文中提取的战略原则"""
    principle_id: str
    source_chunk_id: str
    original_text: str    # 原文引用
    principle_name: str  # 原则名称
    principle_desc: str  # 原则解释
    applicable_domains: List[str]  # 适用领域: "军事" | "商业" | "内容创作" | "个人成长"
    cross_domain_logic: str  # 跨领域迁移逻辑
    confidence: float  # 置信度 (TriadLoop 验证后)


# ─── MaoRAG 主类 ─────────────────────────────────────────────
class MaoRAG:
    """
    《毛选》专属 RAG 检索器
    三层架构: 语义感知 → 逻辑提取 → 思维映射
    """

    def __init__(
        self,
        mao_text_dir: str = "./mao_corpus",
        index_path: str = "./.mao_rag_index.json",
        embedding_model: str = "nomic-embed-text",
        embedding_dim: int = 768,
        ollama_base: str = "http://localhost:11434",
        chunk_size: int = 1200,  # 1200字/切片，保持论证完整性
        chunk_overlap: int = 200,  # 200字重叠，避免断层
    ):
        self.workspace = os.path.abspath(mao_text_dir)
        self.index_path = index_path
        self.embedding_model = embedding_model
        self.embedding_dim = embedding_dim
        self.ollama_base = ollama_base
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.store = SimpleVectorStore(
            storage_path=index_path,
            embedding_dim=embedding_dim,
            embedding_model=embedding_model,
        )
        self.chunks: Dict[str, MaoChunk] = {}

        # 战略类型映射表 (关键词 → 类型)
        self.strategic_type_map = {
            "矛盾": "矛盾论",
            "持久战": "持久战",
            "游击战": "持久战",
            "人民战争": "群众路线",
            "群众": "群众路线",
            "统一战线": "统一战线",
            "实践": "实践论",
            "认识": "实践论",
            "调查研究": "调查研究",
            "实事求是": "调查研究",
            "战略": "战略思想",
            "战术": "战略思想",
            "进攻": "战略思想",
            "防守": "战略思想",
            "持久": "持久战",
            "速决": "持久战",
        }

        # 预加载索引
        self._load_index()

    # ─── L1: 语义感知层 ─────────────────────────────────────

    def get_embedding(self, text: str, model: str = None) -> List[float]:
        """调用 Ollama 获取文本向量"""
        model = model or self.embedding_model
        url = f"{self.ollama_base}/api/embeddings"
        payload = {"model": model, "prompt": text}

        try:
            resp = requests.post(url, json=payload, timeout=60)
            resp.raise_for_status()
            return resp.json()["embedding"]
        except Exception as e:
            print(f"[Ollama Embedding Error] {e}，使用随机向量")
            import random
            return [random.uniform(-1, 1) for _ in range(self.embedding_dim)]

    def _classify_strategic_type(self, text: str) -> str:
        """根据关键词判断战略类型"""
        scores: Dict[str, int] = {}
        for keyword, stype in self.strategic_type_map.items():
            if keyword in text:
                scores[stype] = scores.get(stype, 0) + 1
        if not scores:
            return "其他"
        return max(scores, key=scores.get)

    def _extract_keywords(self, text: str) -> List[str]:
        """提取关键词"""
        # 停用词
        stopwords = {"的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都",
                     "一", "一个", "上", "也", "很", "到", "说", "要", "去", "你",
                     "会", "着", "没有", "看", "好", "自己", "这", "那", "个", "能",
                     "对", "他", "她", "它", "们", "中", "而", "与", "以", "为",
                     "之", "于", "及", "或", "等", "其", "所", "被", "将", "把"}

        # 提取2-4字词组
        words = re.findall(r'[\u4e00-\u9fff]{2,4}', text)
        freq = {}
        for w in words:
            if w not in stopwords and len(w) >= 2:
                freq[w] = freq.get(w, 0) + 1

        # 排序取TOP8
        sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [w for w, _ in sorted_words[:8]]

    def _smart_chunk(self, text: str, volume: int, chapter: str) -> List[MaoChunk]:
        """
        智能切片算法：
        1. 先按段落分割
        2. 按句子合并 (保持论证连贯)
        3. 超过阈值时截断并标注接续
        """
        # 按换行分割段落
        paragraphs = [p.strip() for p in text.split('\n') if p.strip() and len(p.strip()) > 20]
        chunks = []
        current_text = ""
        current_start = 0

        for para in paragraphs:
            if len(current_text) + len(para) <= self.chunk_size:
                current_text += para + "\n\n"
            else:
                if current_text.strip():
                    chunk = self._build_chunk(
                        current_text.strip(), volume, chapter, len(chunks), current_start
                    )
                    chunks.append(chunk)
                    current_start += len(current_text)
                # 重叠处理
                overlap_text = current_text[-self.chunk_overlap:]
                current_text = overlap_text + para + "\n\n"

        # 最后一个chunk
        if current_text.strip():
            chunk = self._build_chunk(
                current_text.strip(), volume, chapter, len(chunks), current_start
            )
            chunks.append(chunk)

        return chunks

    def _build_chunk(
        self, text: str, volume: int, chapter: str, idx: int, char_offset: int
    ) -> MaoChunk:
        """构建单个切片"""
        chunk_id = f"v{volume}_{chapter[:8]}_{idx:03d}"

        # 提取摘要 (取前80字)
        summary = text[:80].strip() + "..."

        # 分类战略类型
        strategic_type = self._classify_strategic_type(text)

        # 提取关键词
        keywords = self._extract_keywords(text)

        return MaoChunk(
            chunk_id=chunk_id,
            volume=volume,
            chapter=chapter,
            section="",
            raw_text=text,
            summary=summary,
            keywords=keywords,
            strategic_type=strategic_type,
            historical_context=self._infer_historical_context(volume, chapter, text),
            force_balance=self._infer_force_balance(text),
            main_contradiction=self._extract_contradiction(text),
            embedding=None,  # 延迟计算
        )

    def _infer_historical_context(self, volume: int, chapter: str, text: str) -> str:
        """根据卷/章推断历史背景"""
        context_map = {
            (1, "中国社会各阶级的分析"): "1925年，国共合作，阶级矛盾尖锐",
            (1, "湖南农民运动考察报告"): "1927年，农民运动兴起，革命道路探索",
            (1, "星星之火，可以燎原"): "1930年，农村革命根据地，红军初创",
            (2, "论持久战"): "1938年，抗日战争，亡国论/速胜论盛行",
            (2, "战争和战略问题"): "1938年，抗日游击战战略地位",
            (3, "改造我们的学习"): "1941年，延安整风，主观主义盛行",
            (3, "整顿党的作风"): "1942年，延安整风，宗派主义问题",
            (3, "反对党八股"): "1942年，延安整风，文风问题",
            (4, "论人民民主专政"): "1949年，革命胜利，向社会主义过渡",
            (5, "论十大关系"): "1956年，苏联教训，探索中国道路",
        }

        key = (volume, chapter)
        if key in context_map:
            return context_map[key]

        volume_contexts = {
            1: "土地革命战争时期 (1927-1937)",
            2: "抗日战争时期 (1937-1945)",
            3: "延安时期 (1941-1945)",
            4: "解放战争时期 (1945-1949)",
            5: "社会主义建设探索时期 (1949-1957)",
        }
        return volume_contexts.get(volume, "未知历史时期")

    def _infer_force_balance(self, text: str) -> str:
        """推断敌我力量对比"""
        if any(k in text for k in ["敌强我弱", "力量悬殊", "劣势"]):
            return "敌强我弱"
        elif any(k in text for k in ["敌弱我强", "优势在我", "力量对比"]):
            return "敌弱我强"
        elif any(k in text for k in ["相持", "平衡", "胶着"]):
            return "战略相持"
        return "力量对比待分析"

    def _extract_contradiction(self, text: str) -> str:
        """提取主要矛盾"""
        patterns = [
            r"主要矛盾是?(.+?)[。；]",
            r"当前的矛盾(.+?)[。；]",
            r"矛盾在于(.+?)[。；]",
        ]
        for pat in patterns:
            m = re.search(pat, text)
            if m:
                return m.group(1).strip()[:50]
        return "待分析"

    def load_mao_texts(self, text_dir: str = None) -> List[Tuple[int, str, str]]:
        """
        加载毛选文本文件。
        期望目录结构:
          mao_corpus/
            vol1_中国社会各阶级的分析.txt
            vol1_湖南农民运动考察报告.txt
            vol2_论持久战.txt
            ...

        返回: [(卷号, 章节名, 全文), ...]
        """
        text_dir = text_dir or self.workspace
        texts = []

        if not os.path.exists(text_dir):
            print(f"[警告] 毛选语料目录不存在: {text_dir}")
            print("请创建 mao_corpus/ 目录并放入毛选文本文件")
            return texts

        for fname in sorted(os.listdir(text_dir)):
            if not fname.endswith('.txt'):
                continue
            fpath = os.path.join(text_dir, fname)
            # 解析卷号和章节名: vol1_中国社会各阶级的分析.txt
            m = re.match(r'vol(\d+)_(.+)\.txt', fname)
            if m:
                vol = int(m.group(1))
                chapter = m.group(2)
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                texts.append((vol, chapter, content))
                print(f"  加载: 卷{vol}《{chapter}》({len(content)}字)")

        return texts

    def build_index(self, text_dir: str = None) -> int:
        """构建索引 (L1 语义感知层)"""
        texts = self.load_mao_texts(text_dir)
        if not texts:
            print("[错误] 未找到毛选文本文件，请先准备语料")
            return 0

        all_chunks = []
        total_chars = 0

        for vol, chapter, content in texts:
            chunks = self._smart_chunk(content, vol, chapter)
            print(f"  《{chapter}》→ {len(chunks)} 个切片")
            all_chunks.extend(chunks)
            total_chars += len(content)

        print(f"\n开始向量计算 ({len(all_chunks)} 切片 × {self.embedding_dim} 维)...")

        for i, chunk in enumerate(all_chunks):
            # 显示进度 (每50个打印一次)
            if i % 20 == 0:
                print(f"  向量化进度: {i}/{len(all_chunks)} ({100*i//len(all_chunks)}%)")

            chunk.embedding = self.get_embedding(chunk.raw_text)
            self.chunks[chunk.chunk_id] = chunk
            self.store.add(chunk.chunk_id, chunk.embedding, asdict(chunk))

        self.store.save()
        print(f"\n✅ 索引完成: {len(all_chunks)} 切片, {total_chars} 字")
        print(f"   存储位置: {self.index_path}")
        return len(all_chunks)

    # ─── L2: 逻辑提取层 (TriadLoop 思想提纯) ─────────────────

    def retrieve(self, query: str, top_k: int = 5, strategic_type: str = None) -> List[MaoChunk]:
        """
        语义检索 (L1 输出)
        - 向量相似度匹配
        - 可按战略类型过滤
        - 历史上下文自动注入
        """
        query_emb = self.get_embedding(query)
        results = self.store.search(query_emb, top_k=top_k * 3)  # 多取一些

        retrieved = []
        seen_vol_chapter = set()

        for chunk_id, similarity, _ in results:
            chunk_dict = self.store.data['chunks'].get(chunk_id, {})
            chunk = MaoChunk(**chunk_dict)
            chunk.embedding = query_emb  # 补充

            # 去重 (同章节只取最相关的一个)
            key = (chunk.volume, chunk.chapter)
            if key in seen_vol_chapter:
                continue

            # 战略类型过滤
            if strategic_type and chunk.strategic_type != strategic_type:
                continue

            retrieved.append(chunk)
            seen_vol_chapter.add(key)

            if len(retrieved) >= top_k:
                break

        return retrieved

    def extract_principles(self, query: str, context: List[MaoChunk] = None) -> List[StrategicPrinciple]:
        """
        逻辑提取 (L2 输出)
        从检索结果中提取战略原则

        提取框架:
        1. 原文引用 → 原则名称
        2. 历史语境 → 现代类比
        3. 置信度评分
        """
        if context is None:
            context = self.retrieve(query, top_k=5)

        principles = []

        # 预定义原则映射 (从毛选经典篇章中提取)
        principle_templates = [
            {
                "keywords": ["矛盾", "主要矛盾", "次要矛盾"],
                "name": "矛盾分析法",
                "desc": "在任何事物中都存在主要矛盾和次要矛盾，抓住主要矛盾就抓住了问题的关键。",
                "domain": ["商业竞争", "个人决策", "内容运营"],
            },
            {
                "keywords": ["持久战", "相持", "战略阶段"],
                "name": "持久战思想",
                "desc": "面对强敌，不求速胜，通过三个阶段(战略防御、战略相持、战略反攻)逐步消耗对方。",
                "domain": ["市场竞争", "品牌建设", "内容矩阵"],
            },
            {
                "keywords": ["群众", "人民", "依靠"],
                "name": "群众路线",
                "desc": "一切为了群众，一切依靠群众，从群众中来，到群众中去。",
                "domain": ["用户运营", "社群运营", "内容创作"],
            },
            {
                "keywords": ["统一战线", "同盟", "联合"],
                "name": "统一战线策略",
                "desc": "在不同的历史阶段，团结一切可以团结的力量，孤立主要敌人。",
                "domain": ["合作战略", "品牌联名", "资源整合"],
            },
            {
                "keywords": ["实践", "认识", "实事求是"],
                "name": "实践-认识循环",
                "desc": "通过实践获得认识，认识的深化再指导新的实践，形成螺旋上升。",
                "domain": ["产品迭代", "内容测试", "市场验证"],
            },
            {
                "keywords": ["调查研究", "实地", "考察"],
                "name": "调查研究方法",
                "desc": "没有调查就没有发言权，深入一线才能掌握真实情况。",
                "domain": ["市场调研", "竞品分析", "用户洞察"],
            },
            {
                "keywords": ["战略", "全局", "局部"],
                "name": "全局-局部辩证法",
                "desc": "照顾全局，局部服从全局；同时关注关键局部对全局的决定性影响。",
                "domain": ["战略规划", "资源配置", "优先级决策"],
            },
        ]

        for chunk in context:
            for tmpl in principle_templates:
                score = sum(1 for kw in tmpl["keywords"] if kw in chunk.raw_text)
                if score > 0:
                    principle = StrategicPrinciple(
                        principle_id=f"p{len(principles)+1}_{tmpl['name']}",
                        source_chunk_id=chunk.chunk_id,
                        original_text=chunk.raw_text[:200],
                        principle_name=tmpl["name"],
                        principle_desc=tmpl["desc"],
                        applicable_domains=tmpl["domain"],
                        cross_domain_logic=f"历史情境: {chunk.historical_context} | 力量对比: {chunk.force_balance}",
                        confidence=min(0.95, 0.6 + 0.1 * score),
                    )
                    principles.append(principle)

        # 去重
        seen = set()
        unique = []
        for p in principles:
            if p.principle_name not in seen:
                seen.add(p.principle_name)
                unique.append(p)

        return unique

    # ─── L3: 思维映射层 ───────────────────────────────────────

    def generate_strategic_report(
        self,
        query: str,
        mode: str = "full"
    ) -> Dict[str, Any]:
        """
        生成战略分析报告 (L3 思维映射输出)

        mode:
          "quick" - 快速分析 (top3切片 + top3原则)
          "full"  - 完整分析 (top5切片 + 全部原则 + 历史映射)
        """
        top_k = 3 if mode == "quick" else 5

        print(f"[MaoRAG] 检索相关战略文献 (k={top_k})...")
        relevant_chunks = self.retrieve(query, top_k=top_k)

        print(f"[MaoRAG] 提取战略原则...")
        principles = self.extract_principles(query, relevant_chunks)

        # 构建历史情境映射
        historical_maps = []
        for chunk in relevant_chunks:
            historical_maps.append({
                "volume": chunk.volume,
                "chapter": chunk.chapter,
                "context": chunk.historical_context,
                "force_balance": chunk.force_balance,
                "main_contradiction": chunk.main_contradiction,
                "strategic_type": chunk.strategic_type,
                "key_quote": chunk.raw_text[:150] + "...",
            })

        report = {
            "query": query,
            "generated_at": datetime.now().isoformat(),
            "layer": "L3_思维映射",
            "relevant_chunks": historical_maps,
            "extracted_principles": [asdict(p) for p in principles],
            "strategic_types_covered": list(set(c.strategic_type for c in relevant_chunks)),
            "total_chunks_analyzed": len(relevant_chunks),
            "total_principles_extracted": len(principles),

            # L3 核心输出: 可直接注入 System Prompt 的战略模板
            "strategic_templates": {
                "矛盾分析模板": {
                    "role": "战略分析师",
                    "prompt": f"当分析{query}时，先识别主要矛盾(核心问题)和次要矛盾(影响因素)，"
                              "然后制定针对主要矛盾的解决方案，次要矛盾随主要矛盾解决而自然消解。",
                    "principles": ["矛盾分析法", "全局-局部辩证法"],
                    "source": "《矛盾论》《实践论》",
                },
                "持久战模板": {
                    "role": "持久战略家",
                    "prompt": f"面对{query}的复杂局面，采用三阶段策略："
                              "第一阶段(战略防御): 积蓄力量，避免硬碰硬；"
                              "第二阶段(战略相持): 逐步消耗对方优势；"
                              "第三阶段(战略反攻): 抓住时机一举突破。",
                    "principles": ["持久战思想", "群众路线"],
                    "source": "《论持久战》",
                },
                "调查研究模板": {
                    "role": "实地研究者",
                    "prompt": f"分析{query}前，先实地调研："
                              "1) 深入一线获取一手信息；"
                              "2) 分析各方力量对比；"
                              "3) 识别核心矛盾；"
                              "4) 制定切实可行的行动方案。",
                    "principles": ["调查研究方法", "实践-认识循环"],
                    "source": "《反对本本主义》《湖南农民运动考察报告》",
                },
            },

            # 核心行动纲领
            "action_plan": self._generate_action_plan(query, principles, relevant_chunks),
        }

        return report

    def _generate_action_plan(
        self,
        query: str,
        principles: List[StrategicPrinciple],
        chunks: List[MaoChunk]
    ) -> Dict[str, Any]:
        """生成基于毛选思想的行动纲领"""
        strategic_types = set(c.strategic_type for c in chunks)

        phases = []

        if "矛盾论" in strategic_types or "实践论" in strategic_types:
            phases.append({
                "phase": "第一阶段：矛盾诊断",
                "duration": "1-2周",
                "actions": [
                    "深入调研当前局面，收集一手数据",
                    "运用矛盾分析法识别主要矛盾和次要矛盾",
                    "明确核心问题和关键突破口",
                ],
                "motto": "没有调查就没有发言权",
                "source": "《反对本本主义》",
            })

        if "持久战" in strategic_types:
            phases.append({
                "phase": "第二阶段：战略布局",
                "duration": "1-3个月",
                "actions": [
                    "确定战略相持期的核心策略",
                    "建立统一战线，团结潜在盟友",
                    "持续积累资源和能力，避免硬碰硬",
                ],
                "motto": "战略上藐视敌人，战术上重视敌人",
                "source": "《论持久战》",
            })

        if "群众路线" in strategic_types:
            phases.append({
                "phase": "第三阶段：群众发动",
                "duration": "持续进行",
                "actions": [
                    "深入群众，了解真实需求",
                    "建立用户/社群参与机制",
                    "让群众成为行动的参与者和推动者",
                ],
                "motto": "一切为了群众，一切依靠群众",
                "source": "《关于领导方法的若干问题》",
            })

        phases.append({
            "phase": "第四阶段：战略反攻",
            "duration": "时机成熟时",
            "actions": [
                "在积累足够力量后抓住战略窗口期",
                "集中优势兵力(资源)打歼灭战(核心问题)",
                "一举建立竞争优势",
            ],
            "motto": "集中优势兵力，各个歼灭敌人",
            "source": "《集中优势兵力各个歼灭敌人》",
        })

        return {
            "phases": phases,
            "query": query,
            "key_insight": self._summarize_key_insight(principles, chunks),
        }

    def _summarize_key_insight(
        self,
        principles: List[StrategicPrinciple],
        chunks: List[MaoChunk]
    ) -> str:
        """提炼核心洞见"""
        if not principles:
            return "未匹配到明确的战略框架，建议深入调研后重新分析。"

        top_principle = max(principles, key=lambda p: p.confidence)
        top_chunk = next((c for c in chunks if c.chunk_id == top_principle.source_chunk_id), chunks[0])

        return (
            f"核心启示来自《{top_chunk.chapter}》："
            f"{top_principle.principle_desc}。"
            f"该原则源自{top_chunk.historical_context}历史背景，"
            f"可迁移应用于当前'{top_principle.applicable_domains[0]}'领域。"
        )

    # ─── 工具方法 ─────────────────────────────────────────────

    def _load_index(self):
        """加载已有索引"""
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                chunk_data = data.get('chunks', {})
                for cid, cdict in chunk_data.items():
                    self.chunks[cid] = MaoChunk(**cdict)
                print(f"[MaoRAG] 加载索引: {len(self.chunks)} 切片 ({self.index_path})")
            except Exception as e:
                print(f"[MaoRAG] 索引加载失败: {e}，将重新构建")

    def interactive_query(self):
        """交互式查询 (用于终端调试)"""
        print("\n" + "="*60)
        print("  MaoAI 战略思想检索系统 - 交互模式")
        print("  输入您的战略问题，按回车分析，按 q 退出")
        print("="*60)

        while True:
            try:
                query = input("\n🗡️ 您的问题: ").strip()
                if query.lower() in ('q', 'quit', 'exit'):
                    break
                if not query:
                    continue

                print("\n" + "-"*60)
                report = self.generate_strategic_report(query, mode="full")

                print(f"\n📚 相关文献 ({report['total_chunks_analyzed']}篇):")
                for i, c in enumerate(report['relevant_chunks'], 1):
                    print(f"  {i}. 卷{c['volume']}《{c['chapter']}》| {c['strategic_type']} | {c['context']}")
                    print(f"     力量对比: {c['force_balance']} | 主要矛盾: {c['main_contradiction']}")

                print(f"\n💡 提取原则 ({report['total_principles_extracted']}条):")
                for p in report['extracted_principles']:
                    print(f"  → {p['principle_name']} (置信度 {p['confidence']:.0%})")
                    print(f"    {p['principle_desc']}")
                    print(f"    适用: {', '.join(p['applicable_domains'])}")

                print("\n📋 行动纲领:")
                for phase in report['action_plan']['phases']:
                    print(f"  【{phase['phase']}】{phase['duration']}")
                    for action in phase['actions']:
                        print(f"    · {action}")
                    print(f"    📌 {phase['motto']} — {phase['source']}")

                print(f"\n🎯 核心洞见:\n  {report['action_plan']['key_insight']}")

                print("\n" + "-"*60)
            except (EOFError, KeyboardInterrupt):
                break

        print("\n再见！")

    def diagnose(self) -> Dict[str, Any]:
        """诊断系统状态"""
        status = {
            "embedding_model": self.embedding_model,
            "embedding_dim": self.embedding_dim,
            "ollama_status": "unknown",
            "indexed_chunks": len(self.chunks),
            "chunk_size": self.chunk_size,
            "storage_path": self.index_path,
        }

        # 检测 Ollama
        try:
            resp = requests.get(f"{self.ollama_base}/api/tags", timeout=5)
            if resp.status_code == 200:
                models = resp.json().get('models', [])
                model_names = [m.get('name', '') for m in models]
                status["ollama_status"] = "running"
                status["available_models"] = model_names
                status["embedding_model_available"] = self.embedding_model in model_names
            else:
                status["ollama_status"] = f"error ({resp.status_code})"
        except Exception as e:
            status["ollama_status"] = f"offline ({e})"

        return status


# ─── CLI 入口 ────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI 战略思想 RAG 系统")
    parser.add_argument("--action", choices=["index", "query", "diagnose", "report"],
                        default="diagnose", help="执行动作")
    parser.add_argument("--query", type=str, help="查询内容")
    parser.add_argument("--top-k", type=int, default=5, help="检索片段数")
    parser.add_argument("--mode", choices=["quick", "full"], default="full", help="分析模式")
    parser.add_argument("--index-path", type=str, default="./.mao_rag_index.json", help="索引路径")
    parser.add_argument("--mao-dir", type=str, default="./mao_corpus", help="毛选语料目录")

    args = parser.parse_args()

    rag = MaoRAG(index_path=args.index_path, mao_text_dir=args.mao_dir)

    if args.action == "diagnose":
        diag = rag.diagnose()
        print(json.dumps(diag, ensure_ascii=False, indent=2))

    elif args.action == "index":
        rag.build_index()

    elif args.action == "query":
        if not args.query:
            print("错误: --query 参数必填")
        else:
            results = rag.retrieve(args.query, top_k=args.top_k)
            for c in results:
                print(f"[{c.chunk_id}] {c.chapter} | {c.strategic_type} | 相似度(内积)")

    elif args.action == "report":
        if not args.query:
            print("错误: --query 参数必填")
        else:
            report = rag.generate_strategic_report(args.query, mode=args.mode)
            print(json.dumps(report, ensure_ascii=False, indent=2))
