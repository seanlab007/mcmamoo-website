"""
毛泽东选集1-5卷完整版向量库加载器
独立引用，不替换 corpus.py
云端可通过相对路径访问
"""

import os
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class MaoFullSearchResult:
    """完整版搜索结果"""
    title: str
    content: str
    source: str
    score: float = 0.0
    metadata: Dict[str, Any] = None


class MaoCorpusFull:
    """
    毛泽东选集1-5卷完整版向量库

    包含:
    - 331个分块文本文件
    - 3178个可检索chunks
    - 完整原文内容

    路径: maoai-core/vector_db/mao_corpus_full/
    """

    def __init__(self, data_dir: str = None):
        """
        初始化完整版向量库

        Args:
            data_dir: 向量库目录，默认使用相对路径
        """
        if data_dir is None:
            # 绝对路径：maoai-core/vector_db/mao_corpus_full
            data_dir = os.path.expanduser('~/.workbuddy/maoai-core/vector_db/mao_corpus_full')

        self.data_dir = data_dir
        self.index_file = os.path.join(data_dir, '.code_rag_index.json')
        self.texts_dir = os.path.join(data_dir, 'full_texts')

        self.chunks = []
        self._load_index()

    def _load_index(self):
        """加载索引文件"""
        if os.path.exists(self.index_file):
            with open(self.index_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.chunks = data.get('chunks', [])
                self.metadata = {
                    'version': data.get('version', 'unknown'),
                    'total_files': data.get('total_files', 0),
                    'total_chunks': data.get('total_chunks', 0)
                }
        else:
            self.chunks = []
            self.metadata = {'version': 'not_found', 'total_files': 0, 'total_chunks': 0}

    def query(self, query: str, top_k: int = 5) -> List[MaoFullSearchResult]:
        """
        关键词检索（简化版，无嵌入模型时使用）

        Args:
            query: 查询文本
            top_k: 返回结果数量

        Returns:
            搜索结果列表
        """
        query_words = set(query.lower())
        results = []

        for chunk in self.chunks:
            text = f"{chunk.get('title', '')} {chunk.get('content', '')}".lower()
            score = len(query_words & set(text.split()))

            if score > 0:
                results.append(MaoFullSearchResult(
                    title=chunk.get('title', ''),
                    content=chunk.get('content', ''),
                    source=chunk.get('id', ''),
                    score=score,
                    metadata=chunk.get('metadata', {})
                ))

        # 按分数排序
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        return {
            'data_dir': self.data_dir,
            'total_chunks': len(self.chunks),
            'metadata': self.metadata,
            'has_index': os.path.exists(self.index_file),
            'has_texts': os.path.exists(self.texts_dir)
        }

    def list_titles(self) -> List[str]:
        """列出所有文档标题"""
        seen = set()
        titles = []
        for chunk in self.chunks:
            title = chunk.get('title', '')
            if title and title not in seen:
                seen.add(title)
                titles.append(title)
        return titles


# 全局实例（延迟加载）
_instance = None


def get_mao_corpus_full() -> MaoCorpusFull:
    """获取完整版向量库实例"""
    global _instance
    if _instance is None:
        _instance = MaoCorpusFull()
    return _instance


if __name__ == '__main__':
    # 测试加载
    corpus = MaoCorpusFull()
    stats = corpus.get_stats()
    print(f"✅ MaoCorpusFull 加载成功!")
    print(f"   数据目录: {stats['data_dir']}")
    print(f"   总chunks: {stats['total_chunks']}")
    print(f"   版本: {stats['metadata'].get('version', 'N/A')}")
    print(f"   文件数: {stats['metadata'].get('total_files', 'N/A')}")

    # 测试查询
    print("\n📖 测试查询 '实事求是':")
    results = corpus.query('实事求是', top_k=3)
    for i, r in enumerate(results, 1):
        print(f"  [{i}] {r.title}")
        print(f"      {r.content[:80]}...")
