# File: server/hyperagents/utils/code_rag.py
import os
import json
import math
import re
import requests
from typing import List, Dict, Any, Optional
from openai import OpenAI

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
    MaoAI 代码 RAG 检索器 (云端/本地混合版)
    职责：
      1. 代码切片 (Chunking)
      2. 向量化 (优先云端以确保跑通)
      3. 语义检索 (Semantic Search)
    """
    def __init__(self, workspace: str, index_file: str = ".code_rag_index.json"):
        self.workspace = workspace
        self.store = SimpleVectorStore(os.path.join(workspace, index_file))
        self.supported_extensions = ['.py', '.ts', '.tsx', '.js', '.jsx', '.txt', '.md']
        # 初始化 OpenAI 客户端用于云端 Embedding
        self.client = OpenAI() # 使用 Manus 默认配置

    def chunk_content(self, file_path: str) -> List[Dict[str, Any]]:
        """将代码或文本按逻辑块进行智能切片"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        chunks = []
        file_ext = os.path.splitext(file_path)[1].lower()

        if file_ext in ['.txt', '.md']:
            # 文本文件：按段落切分
            paragraphs = re.split(r'\n\s*\n', content)
            current_chunk = ""
            for p in paragraphs:
                if len(current_chunk) + len(p) < 800: # 云端支持更长的上下文
                    current_chunk += p + "\n\n"
                else:
                    if current_chunk:
                        chunks.append({"text": current_chunk.strip(), "name": "text_block"})
                    current_chunk = p + "\n\n"
            if current_chunk:
                chunks.append({"text": current_chunk.strip(), "name": "text_block"})
        else:
            # 代码文件：按函数/类切片
            pattern = r'(?:class|def|function|const\s+\w+\s*=\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*=>)\s+([a-zA-Z_]\w*)'
            matches = list(re.finditer(pattern, content))
            
            if not matches:
                lines = content.split('\n')
                for i in range(0, len(lines), 30):
                    chunk_text = '\n'.join(lines[i:i+30])
                    chunks.append({"text": chunk_text, "name": f"chunk_{i//30}"})
            else:
                for i, match in enumerate(matches):
                    start = match.start()
                    end = matches[i+1].start() if i+1 < len(matches) else len(content)
                    chunk_text = content[start:end].strip()
                    chunks.append({"text": chunk_text, "name": match.group(1)})
        
        return chunks

    def _get_cloud_embedding(self, text: str, model: str = "models/text-embedding-004") -> List[float]:
        """调用云端 API 生成 Embedding (使用用户提供的 Gemini API)"""
        try:
            import requests
            api_key = "AIzaSyCPBS4wTChwod9uPqruyjRWVbded4zaldw"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "model": "models/text-embedding-004",
                "content": {"parts": [{"text": text}]}
            }
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            if response.status_code == 200:
                return response.json()["embedding"]["values"]
            else:
                print(f"Gemini Embedding Error {response.status_code}: {response.text}")
                return [0.0] * 768 # text-embedding-004 维度是 768
        except Exception as e:
            print(f"Cloud embedding error: {e}")
            return [0.0] * 768

    def _get_ollama_embedding(self, text: str, model: str = "all-minilm") -> List[float]:
        """调用本地 Ollama 生成 Embedding"""
        try:
            url = "http://localhost:11434/api/embeddings"
            payload = {"model": model, "prompt": text}
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                return response.json()["embedding"]
            return [0.0] * 384
        except:
            return [0.0] * 384

    def get_embedding(self, text: str) -> List[float]:
        """获取文本向量 (临时返回空向量，使用文本匹配检索)"""
        return [0.0] * 768

    def scan_and_index(self, specific_files: List[str] = None):
        """扫描工作区并建立索引"""
        if specific_files:
            files_to_index = specific_files
        else:
            files_to_index = []
            for root, _, files in os.walk(self.workspace):
                if any(x in root for x in ['node_modules', '.git', 'venv', 'dist', 'build', '.next']):
                    continue
                for file in files:
                    if any(file.endswith(ext) for ext in self.supported_extensions):
                        files_to_index.append(os.path.join(root, file))

        for file_path in files_to_index:
            rel_path = os.path.relpath(file_path, self.workspace)
            print(f"Indexing {rel_path}...")
            try:
                chunks = self.chunk_content(file_path)
                for chunk in chunks:
                    vector = self.get_embedding(chunk["text"])
                    self.store.add(chunk["text"], vector, {
                        "file": rel_path,
                        "name": chunk["name"]
                    })
                self.store.save()
            except Exception as e:
                print(f"Failed to index {rel_path}: {e}")

    def query(self, prompt: str, top_k: int = 3) -> str:
        """临时方案：基于关键词的文本检索 (绕过 Embedding 接口问题)"""
        # 提取关键词
        keywords = [w for w in re.findall(r'\w+', prompt) if len(w) > 1]
        
        scored_chunks = []
        for item in self.store.data:
            score = 0
            for kw in keywords:
                if kw.lower() in item["text"].lower():
                    score += 1
            if score > 0:
                scored_chunks.append({**item, "score": score})
        
        # 按匹配关键词数量排序
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        results = scored_chunks[:top_k]
        
        if not results:
            # 如果没搜到，返回前几个作为兜底
            results = self.store.data[:top_k]

        context = ""
        for res in results:
            context += f"--- Source: {res['metadata']['file']} ---\n"
            context += f"{res['text']}\n\n"
        return context

if __name__ == "__main__":
    rag = CodeRAG(os.getcwd())
    # 示例：仅索引毛泽东和马斯克语料
    mao_files = [os.path.join(os.getcwd(), "server/mao_corpus", f) for f in os.listdir("server/mao_corpus") if f.endswith(('.txt', '.md'))]
    rag.scan_and_index(mao_files)
