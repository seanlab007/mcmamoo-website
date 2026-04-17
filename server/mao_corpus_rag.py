#!/usr/bin/env python3
"""
mao_corpus RAG 向量检索服务
功能：
1. 加载 .code_rag_index.json 向量索引
2. 根据用户查询检索最相关的语料块
3. 提供 JSON API 供 Node.js 服务调用
"""

import json
import math
import os
from typing import List, Dict, Any, Optional
from pathlib import Path

# 配置
INDEX_FILE = os.path.join(os.path.dirname(__file__), "mao_corpus/.code_rag_index.json")
TOP_K = 5  # 返回最相关的 5 个结果


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """计算余弦相似度"""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def get_query_embedding(query: str) -> List[float]:
    """通过 Ollama API 获取查询的向量嵌入"""
    import urllib.request
    import urllib.error

    url = "http://localhost:11434/api/embeddings"
    payload = json.dumps({
        "model": "nomic-embed-text",
        "prompt": query
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result["embedding"]
    except urllib.error.URLError as e:
        raise RuntimeError(f"Ollama 连接失败: {e}")


class MaoCorpusRAG:
    def __init__(self, index_file: str = INDEX_FILE):
        self.index_file = index_file
        self.chunks: List[Dict[str, Any]] = []
        self._load_index()

    def _load_index(self):
        """加载向量索引"""
        if not os.path.exists(self.index_file):
            raise FileNotFoundError(f"索引文件不存在: {self.index_file}")

        with open(self.index_file, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)

        # 检查向量是否存在
        with_vectors = sum(1 for c in self.chunks if c.get("vector"))
        print(f"📚 加载语料库: {len(self.chunks)} chunks, {with_vectors} 个已向量化")

    def search(self, query: str, top_k: int = TOP_K) -> List[Dict[str, Any]]:
        """
        检索最相关的语料块

        Args:
            query: 用户查询文本
            top_k: 返回数量

        Returns:
            最相关的 top_k 个结果，每个包含 text, metadata, score
        """
        if not self.chunks:
            return []

        # 获取查询向量
        query_emb = get_query_embedding(query)

        # 计算相似度并排序
        results = []
        for chunk in self.chunks:
            vec = chunk.get("vector")
            if not vec:
                continue
            score = cosine_similarity(query_emb, vec)
            results.append({
                "text": chunk.get("text", ""),
                "metadata": chunk.get("metadata", {}),
                "score": round(score, 4),
                "source": chunk.get("metadata", {}).get("source", "unknown")
            })

        # 按相似度降序排列
        results.sort(key=lambda x: x["score"], reverse=True)

        return results[:top_k]

    def format_for_prompt(self, results: List[Dict[str, Any]]) -> str:
        """将检索结果格式化为可注入 system prompt 的文本"""
        if not results:
            return ""

        lines = ["【相关语料引用】"]
        for i, r in enumerate(results, 1):
            lines.append(f"\n--- 引用 {i} (相关度: {r['score']:.2%}) ---")
            lines.append(r["text"])

        return "\n".join(lines)

    def get_stats(self) -> Dict[str, Any]:
        """获取语料库统计信息"""
        return {
            "total_chunks": len(self.chunks),
            "with_vectors": sum(1 for c in self.chunks if c.get("vector")),
            "sources": list(set(
                c.get("metadata", {}).get("source", "unknown")
                for c in self.chunks
            ))
        }


# 全局实例
_rag_instance: Optional[MaoCorpusRAG] = None


def get_rag() -> MaoCorpusRAG:
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = MaoCorpusRAG()
    return _rag_instance


def search_corpus(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """快捷函数：搜索语料库"""
    return get_rag().search(query, top_k)


if __name__ == "__main__":
    # 测试：交互式检索
    import sys

    print("🔍 MaoAI 语料库检索测试")
    print("=" * 60)

    rag = get_rag()
    print(f"统计: {rag.get_stats()}")

    while True:
        try:
            query = input("\n请输入查询 (输入 q 退出): ").strip()
            if query.lower() == "q":
                break
            if not query:
                continue

            results = rag.search(query)
            print(f"\n找到 {len(results)} 条相关结果:\n")
            print(rag.format_for_prompt(results))

        except KeyboardInterrupt:
            print("\n\n退出")
            break
