import os
import json
import requests
import numpy as np
from typing import List, Dict, Any, Optional

class CodeRAG:
    def __init__(self, workspace_root: str, index_file: str = ".code_rag_index.json"):
        self.workspace_root = workspace_root
        self.index_path = os.path.join(workspace_root, index_file)
        self.index_data = self._load_index()
        # 默认使用本地 all-minilm 模型，适配旧版 Ollama
        self.ollama_url = "http://localhost:11434/api/embeddings"
        self.model = "nomic-embed-text"

    def _load_index(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading index: {e}")
        return []

    def _get_embedding(self, text: str) -> Optional[List[float]]:
        """获取文本的 Embedding，包含自动截断和重试逻辑"""
        # 针对旧版 Ollama 的激进截断：限制在 300 个字符以内
        truncated_text = text[:300]
        
        try:
            response = requests.post(
                self.ollama_url,
                json={"model": self.model, "prompt": truncated_text},
                timeout=10
            )
            if response.status_code == 200:
                return response.json().get("embedding")
            else:
                print(f"Ollama Error {response.status_code}: {response.text}")
                return None
        except Exception as e:
            print(f"Embedding request failed: {e}")
            return None

    def query(self, query_text: str, top_k: int = 3) -> str:
        """查询 RAG 索引"""
        query_embedding = self._get_embedding(query_text)
        
        if not query_embedding:
            # 如果 Embedding 失败，回退到简单的关键词匹配
            print("Embedding failed, falling back to keyword search...")
            results = []
            query_words = set(query_text.lower().split())
            for item in self.index_data:
                content_lower = item["content"].lower()
                score = sum(1 for word in query_words if word in content_lower)
                if score > 0:
                    results.append((score, item["content"]))
            results.sort(key=lambda x: x[0], reverse=True)
            return "\n---\n".join([r[1] for r in results[:top_k]])

        # 向量相似度计算 (余弦相似度)
        scored_results = []
        for item in self.index_data:
            if "embedding" in item and item["embedding"]:
                sim = self._cosine_similarity(query_embedding, item["embedding"])
                scored_results.append((sim, item["content"]))
        
        scored_results.sort(key=lambda x: x[0], reverse=True)
        return "\n---\n".join([r[1] for r in scored_results[:top_k]])

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        v1 = np.array(v1)
        v2 = np.array(v2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    def build_index(self, corpus_dir: str):
        """构建索引并保存"""
        new_index = []
        for root, _, files in os.walk(corpus_dir):
            for file in files:
                if file.endswith((".txt", ".md")):
                    path = os.path.join(root, file)
                    print(f"Indexing {path}...")
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                        # 简单切片逻辑
                        chunks = [content[i:i+500] for i in range(0, len(content), 400)]
                        for chunk in chunks:
                            emb = self._get_embedding(chunk)
                            new_index.append({
                                "path": path,
                                "content": chunk,
                                "embedding": emb
                            })
        
        self.index_data = new_index
        with open(self.index_path, "w", encoding="utf-8") as f:
            json.dump(new_index, f, ensure_ascii=False)
        print(f"Index built and saved to {self.index_path}")

if __name__ == "__main__":
    # 默认索引毛泽东语料库
    rag = CodeRAG("/home/ubuntu/mcmamoo-website")
    rag.build_index("/home/ubuntu/mcmamoo-website/server/mao_corpus")
