#!/usr/bin/env python3
"""
《资治通鉴》RAG 检索模块
加载已有的向量数据，提供语义搜索功能
"""

import os
import json
import math
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class Config:
    """配置类"""
    # 向量文件路径 (相对于 server/mao_corpus/)
    vector_file: Path = Path(__file__).parent / "zizhitongjian_vectors.json"
    
    # Ollama配置
    ollama_base_url: str = "http://localhost:11434"
    embedding_model: str = "ollama"  # ollama, openai, mock
    
    # OpenAI配置
    openai_api_key: Optional[str] = None


class ZiZhiTongJianRAG:
    """《资治通鉴》RAG 检索器"""
    
    def __init__(self, config: Config = None):
        self.config = config or Config()
        self.documents: List[Dict] = []
        self.metadata: Dict = {}
        self._load_vectors()
    
    def _load_vectors(self):
        """加载向量数据"""
        vector_file = self.config.vector_file
        
        # 尝试多个可能的位置
        possible_paths = [
            vector_file,
            Path(__file__).parent / "zizhitongjian_vectors.json",
            Path(__file__).parent.parent.parent / "zizhitongjian" / "vector_store" / "zizhitongjian_vectors.json",
        ]
        
        for path in possible_paths:
            if path.exists():
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.metadata = data.get('metadata', {})
                    self.documents = data.get('documents', [])
                return
        
        print(f"⚠️  未找到向量文件: {vector_file}")
    
    def _get_query_embedding(self, text: str) -> Optional[List[float]]:
        """获取查询文本的嵌入向量"""
        if self.config.embedding_model == "ollama":
            return self._get_ollama_embedding(text)
        elif self.config.embedding_model == "openai":
            return self._get_openai_embedding(text)
        else:
            return self._get_mock_embedding(text)
    
    def _get_ollama_embedding(self, text: str) -> Optional[List[float]]:
        """通过Ollama获取嵌入"""
        try:
            import requests
            response = requests.post(
                f"{self.config.ollama_base_url}/api/embeddings",
                json={"model": "nomic-embed-text", "prompt": text},
                timeout=60
            )
            if response.status_code == 200:
                return response.json().get('embedding')
        except Exception as e:
            print(f"⚠️  Ollama请求失败: {e}")
        return self._get_mock_embedding(text)
    
    def _get_openai_embedding(self, text: str) -> Optional[List[float]]:
        """通过OpenAI获取嵌入"""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.config.openai_api_key)
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"⚠️  OpenAI请求失败: {e}")
        return self._get_mock_embedding(text)
    
    def _get_mock_embedding(self, text: str) -> List[float]:
        """生成模拟嵌入向量"""
        import hashlib
        text_hash = hashlib.md5(text.encode()).digest()
        import random
        random.seed(int.from_bytes(text_hash[:4], 'big') % (2**32))
        dim = self.metadata.get('embedding_dimensions', 768)
        embedding = [random.gauss(0, 1) for _ in range(dim)]
        norm = math.sqrt(sum(x**2 for x in embedding))
        return [x / norm for x in embedding]
    
    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """计算余弦相似度"""
        dot = sum(x * y for x, y in zip(a, b))
        return dot
    
    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        """搜索最相关的文本块"""
        if not self.documents:
            return []
        
        # 获取查询嵌入
        query_embedding = self._get_query_embedding(query)
        if not query_embedding:
            return []
        
        # 计算相似度
        results = []
        for doc in self.documents:
            embedding = doc.get('embedding', [])
            if not embedding:
                continue
            
            similarity = self.cosine_similarity(query_embedding, embedding)
            results.append({
                'text': doc.get('text', ''),
                'metadata': doc.get('metadata', {}),
                'score': round(similarity, 4),
                'source': f"《{doc['metadata'].get('title', '资治通鉴')}》"
            })
        
        # 按相似度排序
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]
    
    def get_stats(self) -> Dict:
        """获取语料库统计"""
        with_vectors = sum(1 for d in self.documents if d.get('embedding'))
        return {
            'source': self.metadata.get('source', '资治通鉴'),
            'total_chunks': len(self.documents),
            'with_vectors': with_vectors,
            'embedding_model': self.metadata.get('embedding_model', 'unknown'),
            'embedding_dimensions': self.metadata.get('embedding_dimensions', 768),
            'created_at': self.metadata.get('created_at', 'unknown')
        }


def get_query_embedding(text: str) -> List[float]:
    """便捷函数：获取查询嵌入"""
    rag = ZiZhiTongJianRAG()
    return rag._get_query_embedding(text)


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """便捷函数：计算余弦相似度"""
    return sum(x * y for x, y in zip(a, b))


# CLI 测试
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(f"🔍 搜索: {query}\n")
        
        rag = ZiZhiTongJianRAG()
        results = rag.search(query, top_k=3)
        
        print(f"📊 统计: {rag.get_stats()['total_chunks']} 个文档\n")
        print("📋 结果:")
        for i, r in enumerate(results, 1):
            print(f"\n--- 结果 {i} (相似度: {r['score']}) ---")
            print(f"来源: {r['source']}")
            print(f"内容: {r['text'][:150]}...")
    else:
        rag = ZiZhiTongJianRAG()
        print(json.dumps(rag.get_stats(), ensure_ascii=False, indent=2))
