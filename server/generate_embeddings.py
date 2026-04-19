#!/usr/bin/env python3
"""
为 mao_corpus 生成向量嵌入
使用 Ollama 本地模型 nomic-embed-text（无需 API key）
"""

import json
import os
import time
import sys
from pathlib import Path

# 向量化配置
EMBEDDING_MODEL = "nomic-embed-text"
INDEX_FILE = "/Users/daiyan/Desktop/mcmamoo-website/server/mao_corpus/.code_rag_index.json"
EMBEDDING_DIM = 768  # nomic-embed-text dimension

def get_embedding(text: str) -> list[float]:
    """通过 Ollama API 获取文本嵌入"""
    import urllib.request
    import urllib.error

    url = "http://localhost:11434/api/embeddings"
    payload = json.dumps({
        "model": EMBEDDING_MODEL,
        "prompt": text
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result["embedding"]
    except urllib.error.URLError as e:
        print(f"   [ERROR] Ollama 连接失败: {e}")
        print(f"   确保 Ollama 正在运行: ollama serve")
        sys.exit(1)

def main():
    print("🚀 MaoAI 语料库向量化开始")
    print("=" * 60)
    print(f"   模型: {EMBEDDING_MODEL}")
    print(f"   维度: {EMBEDDING_DIM}")
    print(f"   索引文件: {INDEX_FILE}")

    # 加载索引
    index_path = Path(INDEX_FILE)
    if not index_path.exists():
        print(f"❌ 索引文件不存在: {index_path}")
        return

    with open(index_path, "r", encoding="utf-8") as f:
        index = json.load(f)

    chunks = index.get("chunks", [])
    total = len(chunks)
    print(f"   总 Chunk 数: {total}")

    # 统计已有向量的数量
    existing = sum(1 for c in chunks if c.get("embedding"))
    print(f"   已有向量: {existing} / {total}")

    # 向量化缺失的 chunks
    new_count = 0
    batch_size = 10
    start_time = time.time()

    for i, chunk in enumerate(chunks):
        if chunk.get("embedding"):
            continue  # 跳过已向量化的

        try:
            emb = get_embedding(chunk["content"])
            chunk["embedding"] = emb
            new_count += 1

            # 每 50 个打印进度
            if new_count % 50 == 0 or new_count == 1:
                elapsed = time.time() - start_time
                rate = new_count / elapsed if elapsed > 0 else 0
                remaining = (total - existing - new_count) / rate if rate > 0 else 0
                print(f"✅ [{new_count}/{total - existing}] 向量化中... ({rate:.1f}/s, 预计剩余 {remaining/60:.1f}min)")

        except Exception as e:
            print(f"❌ 向量化失败 chunk {chunk.get('id', i)}: {e}")

    # 保存更新后的索引
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)

    elapsed = time.time() - start_time
    print()
    print("=" * 60)
    print(f"✅ 向量化完成！")
    print(f"   新增向量: {new_count}")
    print(f"   总向量数: {total}")
    print(f"   耗时: {elapsed/60:.1f} 分钟")
    print(f"   文件大小: {index_path.stat().st_size / 1024 / 1024:.1f} MB")

if __name__ == "__main__":
    main()
