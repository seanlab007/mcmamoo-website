#!/usr/bin/env python3
"""
毛泽东选集向量库生成器
- 500字以内一个Chunk
- 使用本地 Ollama 生成向量
"""
import json
import os
import glob
from openai import OpenAI

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434/v1")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma4:latest")

client = OpenAI(base_url=OLLAMA_URL, api_key="ollama")

CORPUS_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(CORPUS_DIR, ".code_rag_index.json")

CHUNK_SIZE = 500  # 每chunk字数

def chunk_text(text: str, max_chars: int = 500) -> list:
    """按标点和段落切分，保持语义完整"""
    chunks = []
    paragraphs = text.split("\n")
    current = ""
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(current) + len(para) <= max_chars:
            current += para + "\n"
        else:
            if current.strip():
                chunks.append(current.strip())
            # 如果单段超过max_chars，按句子切
            while len(para) > max_chars:
                chunks.append(para[:max_chars])
                para = para[max_chars:]
            current = para + "\n"
    
    if current.strip():
        chunks.append(current.strip())
    
    return chunks

def get_embedding(text: str) -> list:
    """调用 Ollama 生成向量"""
    try:
        response = client.embeddings.create(
            model=OLLAMA_MODEL,
            input=text[:2000]  # 限制输入长度
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"⚠️ 向量生成失败: {e}")
        return [0] * 1024  # fallback

def main():
    print("🚀 毛泽东选集向量库生成器")
    print(f"📁 语料目录: {CORPUS_DIR}")
    print(f"🤖 Ollama: {OLLAMA_URL}")
    print(f"📊 模型: {OLLAMA_MODEL}")
    
    all_chunks = []
    files = sorted(glob.glob(os.path.join(CORPUS_DIR, "vol*.txt")))
    
    print(f"\n📖 发现 {len(files)} 个文件")
    
    for filepath in files:
        filename = os.path.basename(filepath)
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()
        
        chunks = chunk_text(text, CHUNK_SIZE)
        print(f"  📄 {filename}: {len(chunks)} chunks")
        
        for i, chunk in enumerate(chunks):
            all_chunks.append({
                "text": f"【{filename}】\n{chunk}",
                "source": filename,
                "chunk_index": i
            })
    
    print(f"\n✂️ 共 {len(all_chunks)} 个 Chunk，开始生成向量...")
    
    # 批量生成向量
    for i, chunk in enumerate(all_chunks):
        if i % 10 == 0:
            print(f"  进度: {i}/{len(all_chunks)}")
        chunk["vector"] = get_embedding(chunk["text"])
    
    # 保存
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False)
    
    print(f"\n✅ 完成! 已保存到 {OUTPUT_FILE}")
    print(f"📊 文件大小: {os.path.getsize(OUTPUT_FILE) / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    main()
