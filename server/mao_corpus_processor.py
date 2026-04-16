#!/usr/bin/env python3
"""
《毛泽东选集》语料库自动化处理脚本
功能：
1. 扫描 mao_corpus 目录下的所有 .txt 文件
2. 按 500 字以内的粒度进行智能切割
3. 为每个 Chunk 生成向量（Embedding）
4. 更新 RAG 索引文件 .code_rag_index.json

使用方法：
    python3 mao_corpus_processor.py --corpus-dir ./server/mao_corpus --output-index .code_rag_index.json
"""

import os
import json
import argparse
import hashlib
from pathlib import Path
from typing import List, Dict, Any
import re

class MaoCorpusProcessor:
    def __init__(self, corpus_dir: str, output_index: str, chunk_size: int = 500):
        self.corpus_dir = Path(corpus_dir)
        self.output_index = Path(output_index)
        self.chunk_size = chunk_size
        self.existing_index = self._load_existing_index()
        self.processed_chunks = []
        
    def _load_existing_index(self) -> Dict[str, Any]:
        """加载现有的 RAG 索引文件"""
        if self.output_index.exists():
            with open(self.output_index, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"chunks": [], "metadata": {}}
    
    def _smart_chunk(self, text: str, source_file: str, chunk_size: int = 500) -> List[Dict[str, Any]]:
        """
        智能分片：按 500 字以内的粒度进行切割，保持段落完整性
        
        Args:
            text: 原始文本
            source_file: 源文件名
            chunk_size: 每个 Chunk 的最大字数
        
        Returns:
            List of chunks with metadata
        """
        chunks = []
        
        # 按段落分割（以 \n\n 或句号作为分界）
        paragraphs = re.split(r'\n\n+|。(?=\s|$)', text)
        
        current_chunk = ""
        chunk_id = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # 如果当前段落加上新段落超过 chunk_size，则保存当前 chunk
            if len(current_chunk) + len(para) > chunk_size and current_chunk:
                chunk_id += 1
                chunk_hash = hashlib.md5(current_chunk.encode()).hexdigest()[:8]
                chunks.append({
                    "id": f"{source_file}_{chunk_id}_{chunk_hash}",
                    "content": current_chunk.strip(),
                    "source": source_file,
                    "chunk_id": chunk_id,
                    "length": len(current_chunk),
                    "vector": None  # 占位符，实际向量化由后续步骤处理
                })
                current_chunk = para
            else:
                current_chunk += para + "。"
        
        # 处理最后一个 chunk
        if current_chunk.strip():
            chunk_id += 1
            chunk_hash = hashlib.md5(current_chunk.encode()).hexdigest()[:8]
            chunks.append({
                "id": f"{source_file}_{chunk_id}_{chunk_hash}",
                "content": current_chunk.strip(),
                "source": source_file,
                "chunk_id": chunk_id,
                "length": len(current_chunk),
                "vector": None
            })
        
        return chunks
    
    def _get_existing_sources(self) -> set:
        """获取已处理过的源文件集合"""
        existing_sources = set()
        for chunk in self.existing_index.get("chunks", []):
            if "source" in chunk:
                existing_sources.add(chunk["source"])
        return existing_sources
    
    def process_corpus(self) -> None:
        """处理整个语料库"""
        if not self.corpus_dir.exists():
            print(f"❌ 语料库目录不存在: {self.corpus_dir}")
            return
        
        existing_sources = self._get_existing_sources()
        txt_files = sorted(self.corpus_dir.glob("*.txt"))
        
        print(f"📂 找到 {len(txt_files)} 个文本文件")
        print(f"⚠️  已处理过的文件: {existing_sources}")
        
        for txt_file in txt_files:
            file_name = txt_file.name
            
            # 跳过已处理的文件
            if file_name in existing_sources:
                print(f"⏭️  跳过已处理的文件: {file_name}")
                continue
            
            print(f"🔄 正在处理: {file_name}")
            
            try:
                with open(txt_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 执行智能分片
                chunks = self._smart_chunk(content, file_name, self.chunk_size)
                self.processed_chunks.extend(chunks)
                
                print(f"   ✅ 生成了 {len(chunks)} 个 Chunk，总字数: {sum(c['length'] for c in chunks)}")
                
            except Exception as e:
                print(f"   ❌ 处理失败: {e}")
        
        print(f"\n📊 总计处理了 {len(self.processed_chunks)} 个新 Chunk")
    
    def update_index(self) -> None:
        """更新 RAG 索引文件"""
        # 将新处理的 chunks 追加到现有索引
        self.existing_index["chunks"].extend(self.processed_chunks)
        
        # 更新元数据
        if "metadata" not in self.existing_index:
            self.existing_index["metadata"] = {}
        
        self.existing_index["metadata"]["total_chunks"] = len(self.existing_index["chunks"])
        self.existing_index["metadata"]["last_updated"] = str(Path.cwd())
        
        # 保存更新后的索引
        with open(self.output_index, 'w', encoding='utf-8') as f:
            json.dump(self.existing_index, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 索引已更新: {self.output_index}")
        print(f"   总 Chunk 数: {len(self.existing_index['chunks'])}")
    
    def generate_embedding_script(self) -> None:
        """生成向量化脚本（需要调用 OpenAI 或本地模型）"""
        script_content = '''#!/usr/bin/env python3
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
'''
        
        script_path = self.corpus_dir.parent / "generate_embeddings.py"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        print(f"\n📝 已生成向量化脚本: {script_path}")
        print(f"   运行方法: python3 {script_path}")

def main():
    parser = argparse.ArgumentParser(description="《毛泽东选集》语料库自动化处理脚本")
    parser.add_argument("--corpus-dir", default="./server/mao_corpus", help="语料库目录")
    parser.add_argument("--output-index", default=".code_rag_index.json", help="输出索引文件")
    parser.add_argument("--chunk-size", type=int, default=500, help="Chunk 大小（字数）")
    
    args = parser.parse_args()
    
    print("🚀 《毛泽东选集》语料库处理开始...")
    print("=" * 60)
    
    processor = MaoCorpusProcessor(args.corpus_dir, args.output_index, args.chunk_size)
    processor.process_corpus()
    processor.update_index()
    processor.generate_embedding_script()
    
    print("=" * 60)
    print("✅ 处理完成！")
    print("\n📋 下一步操作:")
    print("1. 运行向量化脚本: python3 server/generate_embeddings.py")
    print("2. 重启 MaoAI 服务: pnpm dev")
    print("3. 在对话框中测试新的语料检索")

if __name__ == "__main__":
    main()
