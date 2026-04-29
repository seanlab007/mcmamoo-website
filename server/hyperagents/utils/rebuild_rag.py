import os
import json
import requests
import sys

# 确保可以导入 code_rag
sys.path.insert(0, os.path.dirname(__file__))
from code_rag import CodeRAG

INDEX_FILE = ".code_rag_index.json"
OLLAMA_EMBEDDING_MODEL = "all-minilm"
OLLAMA_URL = "http://localhost:11434/api/embeddings"

def check_ollama_status():
    """检查 Ollama 服务是否运行，以及 embedding 模型是否可用"""
    try:
        # 检查 Ollama 服务是否可达
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        response.raise_for_status()
        print("[INFO] Ollama service is running.")
        
        # 检查 nomic-embed-text 模型是否已下载
        models = [m["name"] for m in response.json()["models"]]
        if f"{OLLAMA_EMBEDDING_MODEL}:latest" in models or OLLAMA_EMBEDDING_MODEL in models:
            print(f"[INFO] Ollama model \'{OLLAMA_EMBEDDING_MODEL}\' is available.")
            return True
        else:
            print(f"[WARNING] Ollama model \'{OLLAMA_EMBEDDING_MODEL}\' not found. Please run \"ollama pull {OLLAMA_EMBEDDING_MODEL}\".")
            return False
    except requests.exceptions.ConnectionError:
        print("[ERROR] Ollama service is not running. Please start Ollama.")
        return False
    except Exception as e:
        print(f"[ERROR] Failed to check Ollama status: {e}")
        return False

def rebuild_index(workspace_path: str):
    """
    删除旧索引并重建新的 RAG 索引
    """
    index_full_path = os.path.join(workspace_path, INDEX_FILE)
    
    print(f"[STEP 1/3] Checking Ollama status...")
    if not check_ollama_status():
        print("[ERROR] Ollama is not ready. Aborting RAG index rebuild.")
        sys.exit(1)

    print(f"[STEP 2/3] Deleting old index file: {index_full_path}")
    if os.path.exists(index_full_path):
        os.remove(index_full_path)
        print("[INFO] Old index deleted successfully.")
    else:
        print("[INFO] No old index file found, skipping deletion.")

    print(f"[STEP 3/3] Starting new RAG index build for workspace: {workspace_path}")
    try:
        rag = CodeRAG(workspace_path)
        # 确保使用 Ollama 的 get_embedding
        rag.get_embedding = lambda text, model=OLLAMA_EMBEDDING_MODEL: rag._get_ollama_embedding(text, model)
        rag.scan_and_index()
        print(f"[SUCCESS] RAG index rebuilt successfully. Total items: {len(rag.store.data)}")
    except Exception as e:
        print(f"[ERROR] Failed to rebuild RAG index: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # 假设脚本在 server/hyperagents/utils/ 目录下运行
    # 那么 workspace_path 应该是 mcmamoo-website 的根目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
    print(f"[INFO] Detected workspace root: {workspace_root}")
    rebuild_index(workspace_root)
