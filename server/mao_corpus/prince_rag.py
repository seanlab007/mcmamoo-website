#!/usr/bin/env python3
"""
《君主论》(The Prince) RAG 检索模块
加载已有的向量数据，提供语义搜索功能

作者: 尼科洛·马基雅维利 (Niccolò Machiavelli), 1513 (公版作品)
"""

import os
import json
import math
from pathlib import Path
from typing import List, Dict, Optional


class Config:
    """配置类"""
    # 向量文件路径（外部向量化工作区）
    vector_file: Path = Path(
        "/Users/daiyan/WorkBuddy/20260424055943/the-prince-vectorization/the_prince_vectors.json"
    )
    chunks_file: Path = Path(
        "/Users/daiyan/WorkBuddy/20260424055943/the-prince-vectorization/the_prince_chunks.json"
    )
    
    # Ollama 配置
    ollama_base_url: str = "http://localhost:11434"
    embedding_model: str = "nomic-embed-text"


class PrinceRAG:
    """《君主论》RAG 检索器"""
    
    def __init__(self, config: Config = None):
        self.config = config or Config()
        self.documents: List[Dict] = []
        self.metadata: Dict = {}
        self._load_vectors()
    
    def _load_vectors(self):
        """加载向量数据"""
        vector_file = self.config.vector_file
        chunks_file = self.config.chunks_file
        
        if not vector_file.exists():
            print(f"⚠️  向量文件不存在: {vector_file}")
            return
        
        if not chunks_file.exists():
            print(f"⚠️  分块文件不存在: {chunks_file}")
            return
        
        with open(chunks_file, 'r', encoding='utf-8') as f:
            chunks_data = json.load(f)
        
        with open(vector_file, 'r', encoding='utf-8') as f:
            vectors_data = json.load(f)
        
        # 合并 chunks + vectors
        for i, vec_entry in enumerate(vectors_data):
            chunk_info = chunks_data[i] if i < len(chunks_data) else {}
            
            self.documents.append({
                'text': chunk_info.get('content', vec_entry.get('content', '')),
                'embedding': vec_entry.get('embedding', []),
                'metadata': {
                    'source': 'The Prince',
                    'title': chunk_info.get('title', ''),
                    'chapter': self._detect_chapter(chunk_info.get('content', '')),
                    'chunk_id': i,
                    'char_count': chunk_info.get('char_count', 0),
                }
            })
        
        print(
            f"📖 《君主论》语料库加载完成: "
            f"{len(self.documents)} chunks, "
            f"向量维度: {len(self.documents[0]['embedding']) if self.documents and self.documents[0].get('embedding') else 0}"
        )
    
    def _detect_chapter(self, text: str) -> str:
        """从文本中检测章节信息"""
        import re
        # 匹配 CHAPTER XX 或 Chapter I 等格式
        m = re.search(r'(?:CHAPTER|Chapter)\s+([IVXLCD]+|\d+)', text[:200], re.IGNORECASE)
        if m:
            return f"Chapter {m.group(1)}"
        return ""
    
    def _get_query_embedding(self, text: str) -> Optional[List[float]]:
        """通过 Ollama 获取查询文本的嵌入向量"""
        try:
            import urllib.request
            url = f"{self.config.ollama_base_url}/api/embeddings"
            payload = json.dumps({
                "model": self.config.embedding_model,
                "prompt": text,
            }).encode("utf-8")
            
            req = urllib.request.Request(url, data=payload, headers={
                "Content-Type": "application/json",
            }, method="POST")
            
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result["embedding"]
        except Exception as e:
            print(f"⚠️  Ollama 请求失败: {e}")
            return None
    
    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """计算余弦相似度"""
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)
    
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """搜索最相关的文本块"""
        if not self.documents:
            return []
        
        query_embedding = self._get_query_embedding(query)
        if not query_embedding:
            return []
        
        results = []
        for doc in self.documents:
            embedding = doc.get('embedding')
            if not embedding:
                continue
            
            similarity = self.cosine_similarity(query_embedding, embedding)
            results.append({
                'text': doc['text'],
                'metadata': doc['metadata'],
                'score': round(similarity, 4),
                'source': f"《{doc['metadata'].get('source', 'The Prince')}》{doc['metadata'].get('chapter', '')}",
            })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]
    
    def get_stats(self) -> Dict:
        """获取语料库统计"""
        with_vectors = sum(1 for d in self.documents if d.get('embedding'))
        return {
            'source': 'The Prince (君主论)',
            'author': 'Niccolò Machiavelli',
            'year': 1513,
            'total_chunks': len(self.documents),
            'with_vectors': with_vectors,
            'embedding_model': self.config.embedding_model,
            'embedding_dimensions': (
                len(self.documents[0]['embedding'])
                if self.documents and self.documents[0].get('embedding')
                else 0
            ),
        }


# ── 便捷函数 ──────────────────────────────────────────────────────

def get_query_embedding(text: str) -> List[float]:
    """便捷函数：获取查询嵌入"""
    rag = PrinceRAG()
    return rag._get_query_embedding(text)


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """便捷函数：计算余弦相似度"""
    return sum(x * y for x, y in zip(a, b))


# ── CLI 测试 ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(f"🔍 搜索: {query}\n")
        
        rag = PrinceRAG()
        results = rag.search(query, top_k=3)
        
        print(f"📊 统计: {rag.get_stats()['total_chunks']} 个文档\n")
        print("📋 结果:")
        for i, r in enumerate(results, 1):
            print(f"\n--- 结果 {i} (相似度: {r['score']}) ---")
            print(f"来源: {r['source']}")
            print(f"内容: {r['text'][:300]}...")
    else:
        rag = PrinceRAG()
        print(json.dumps(rag.get_stats(), ensure_ascii=False, indent=2))
