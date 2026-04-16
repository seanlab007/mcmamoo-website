#!/usr/bin/env python3
"""
向量化脚本：为所有 Chunk 生成 Embedding
需要配置 OPENAI_API_KEY 环境变量
"""
import json
import os
from openai import OpenAI

client = OpenAI()

# 加载索引
with open('.code_rag_index.json', 'r', encoding='utf-8') as f:
    index = json.load(f)

# 为每个 Chunk 生成向量
for i, chunk in enumerate(index['chunks']):
    if chunk['vector'] is not None:
        continue  # 跳过已向量化的
    
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=chunk['content']
        )
        chunk['vector'] = response.data[0].embedding
        print(f"✅ [{i+1}/{len(index['chunks'])}] 已向量化: {chunk['id']}")
    except Exception as e:
        print(f"❌ 向量化失败: {e}")

# 保存更新后的索引
with open('.code_rag_index.json', 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False)

print(f"✅ 向量化完成！")
