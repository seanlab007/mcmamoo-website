# File: server/hyperagents/utils/code_rag.py
import os
import json
import math
import re
from typing import List, Dict, Any, Optional

class SimpleVectorStore:
    """
    零依赖向量存储器 (使用余弦相似度)
    支持将代码片段及其向量索引持久化到本地 JSON。
    """
    def __init__(self, storage_path: str = ".code_rag_index.json"):
        self.storage_path = storage_path
        self.data: List[Dict[str, Any]] = []
        self.load()

    def load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    self.data = json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load RAG index: {e}")
                self.data = []

    def save(self):
        with open(self.storage_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)

    def add(self, text: str, vector: List[float], metadata: Dict[str, Any]):
        self.data.append({
            "text": text,
            "vector": vector,
            "metadata": metadata
        })

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude1 = math.sqrt(sum(a * a for a in v1))
        magnitude2 = math.sqrt(sum(a * a for a in v2))
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        return dot_product / (magnitude1 * magnitude2)

    def search(self, query_vector: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        results = []
        for item in self.data:
            score = self.cosine_similarity(query_vector, item["vector"])
            results.append({**item, "score": score})
        
        # 按分数降序排列
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

class CodeRAG:
    """
    MaoAI 代码 RAG 检索器 (零依赖版)
    职责：
      1. 代码切片 (Chunking)
      2. 向量化 (使用 OpenAI/DeepSeek API 或本地 Ollama)
      3. 语义检索 (Semantic Search)
    """
    def __init__(self, workspace: str, index_file: str = ".code_rag_index.json"):
        self.workspace = workspace
        self.store = SimpleVectorStore(os.path.join(workspace, index_file))
        self.supported_extensions = ['.py', '.ts', '.tsx', '.js', '.jsx']

    def chunk_code(self, file_path: str) -> List[Dict[str, Any]]:
        """将代码按函数/类进行智能切片"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        chunks = []
        # 简单的正则切片逻辑 (支持 Python/TS)
        # 匹配 class 或 function 定义
        pattern = r'(?:class|def|function|const\s+\w+\s*=\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*=>)\s+([a-zA-Z_]\w*)'
        matches = list(re.finditer(pattern, content))
        
        if not matches:
            # 如果没匹配到，按行数切片
            lines = content.split('\n')
            for i in range(0, len(lines), 50):
                chunk_text = '\n'.join(lines[i:i+50])
                chunks.append({"text": chunk_text, "name": f"chunk_{i//50}"})
        else:
            for i, match in enumerate(matches):
                start = match.start()
                end = matches[i+1].start() if i+1 < len(matches) else len(content)
                chunk_text = content[start:end].strip()
                chunks.append({"text": chunk_text, "name": match.group(1)})
        
        return chunks

    def _get_ollama_embedding(self, text: str, model: str = "nomic-embed-text") -> List[float]:
        """
        使用本地 Ollama 获取文本向量 (100% 离线)
        """
        import requests
        
        # Ollama 默认本地地址
        url = "http://localhost:11434/api/embeddings"
        payload = {
            "model": model,
            "prompt": text
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            # Ollama 返回格式: {"embedding": [0.1, 0.2, ...]}
            return response.json()["embedding"]
        except Exception as e:
            print(f"Ollama Embedding Error: {e}")
            # 兜底：如果 Ollama 没启动，返回全零向量
            return [0.0] * 768 # nomic-embed-text 的维度是 768

    def get_embedding(self, text: str, model: str = "text-embedding-3-small") -> List[float]:
        """
        获取文本向量。
        优先使用 Ollama，如果 Ollama 不可用则回退到 API。
        """
        # 尝试使用 Ollama
        ollama_embedding = self._get_ollama_embedding(text, "nomic-embed-text")
        if any(x != 0.0 for x in ollama_embedding): # 检查是否是全零向量 (Ollama 失败的标志)
            return ollama_embedding

        # 如果 Ollama 失败，回退到 API
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            return [0.0] * 1536 # 如果没有 API Key，返回全零向量
            
        import requests
        try:
            url = "https://api.openai.com/v1/embeddings"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {"input": text, "model": model}
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            return response.json()["data"][0]["embedding"]
        except Exception as e:
            print(f"API Embedding error: {e}")
            return [0.0] * 1536

    def scan_and_index(self):
        """扫描工作区并建立索引"""
        for root, _, files in os.walk(self.workspace):
            if 'node_modules' in root or '.git' in root or 'venv' in root:
                continue
            for file in files:
                if any(file.endswith(ext) for ext in self.supported_extensions):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, self.workspace)
                    print(f"Indexing {rel_path}...")
                    chunks = self.chunk_code(file_path)
                    for chunk in chunks:
                        vector = self.get_embedding(chunk["text"])
                        self.store.add(chunk["text"], vector, {
                            "file": rel_path,
                            "name": chunk["name"]
                        })
        self.store.save()

    def query(self, prompt: str, top_k: int = 3) -> str:
        """根据提示词检索相关代码上下文"""
        query_vector = self.get_embedding(prompt)
        results = self.store.search(query_vector, top_k)
        
        context = "Relevant code context found:\n\n"
        for res in results:
            context += f"--- File: {res['metadata']['file']} (Score: {res['score']:.4f}) ---\n"
            context += f"{res['text']}\n\n"
        return context

if __name__ == "__main__":
    # 简单测试
    rag = CodeRAG(os.getcwd())
    # rag.scan_and_index() # 首次运行需取消注释
    # print(rag.query("如何实现登录逻辑？"))
