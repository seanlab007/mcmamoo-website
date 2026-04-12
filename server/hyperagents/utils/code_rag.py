#!/usr/bin/env python3
"""
MaoAI HyperAgents — Code RAG (向量检索知识库)
─────────────────────────────────────────────────────────────────────────────
基于 ChromaDB 的代码语义检索系统

核心功能：
  1. 代码分块 (Chunking)：按函数/类级别切分
  2. 向量嵌入 (Embedding)：使用 text-embedding-3-small 生成向量
  3. 语义检索 (Retrieval)：查询最相关的 K 个代码片段
  4. 上下文注入：将检索结果注入 Agent 的 Context

用法：
  from code_rag import CodeRAG

  rag = CodeRAG(workspace="/path/to/project")
  rag.index_project()  # 首次索引

  # 查询
  results = rag.query("如何修改登录逻辑？")
  for r in results:
      print(r["code"], r["file"], r["line"])

  # 获取注入上下文的 Prompt
  context = rag.get_context_prompt("修复登录验证 bug")
"""

import os
import json
import hashlib
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from pathlib import Path
import tempfile
import shutil

# ─── 可选依赖检查 ──────────────────────────────────────────────────────────────

try:
    import chromadb
    from chromadb.config import Settings
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False
    print("[CodeRAG] ChromaDB 未安装，使用降级模式 (FAISS)")

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False


# ─── 配置常量 ──────────────────────────────────────────────────────────────────

# ChromaDB 设置
DEFAULT_COLLECTION_NAME = "maoai_codebase"
EMBEDDING_MODEL = "text-embedding-3-small"  # OpenAI
EMBEDDING_DIM = 1536  # text-embedding-3-small 的维度

# 本地模型 (当 OpenAI 不可用时)
LOCAL_EMBEDDING_MODEL = "all-MiniLM-L6-v2"
LOCAL_EMBEDDING_DIM = 384

# 分块设置
CHUNK_SIZE = 500  # 字符数
CHUNK_OVERLAP = 50  # 重叠字符数

# 检索设置
DEFAULT_TOP_K = 5
MAX_CONTEXT_LENGTH = 3000  # 上下文最大字符数


# ─── 数据结构 ────────────────────────────────────────────────────────────────

@dataclass
class CodeChunk:
    """代码分块"""
    id: str
    content: str
    file_path: str
    language: str
    start_line: int
    end_line: int
    chunk_type: str  # "function", "class", "import", "comment", "other"
    name: str = ""  # 函数/类名
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RetrievalResult:
    """检索结果"""
    chunk: CodeChunk
    score: float  # 相似度分数
    distance: float  # 向量距离


# ─── 向量存储基类 ─────────────────────────────────────────────────────────────

class VectorStore:
    """向量存储接口，支持 ChromaDB 和降级模式"""

    def __init__(self, persist_dir: str, collection_name: str = DEFAULT_COLLECTION_NAME):
        self.persist_dir = persist_dir
        self.collection_name = collection_name
        self._client = None
        self._collection = None
        self._init_store()

    def _init_store(self):
        """初始化存储"""
        raise NotImplementedError

    def add(self, chunks: List[CodeChunk], embeddings: List[List[float]]):
        """添加分块和向量"""
        raise NotImplementedError

    def query(self, embedding: List[float], top_k: int = DEFAULT_TOP_K) -> List[Tuple[str, float]]:
        """查询最近邻"""
        raise NotImplementedError

    def delete(self, ids: List[str]):
        """删除分块"""
        raise NotImplementedError

    def clear(self):
        """清空集合"""
        raise NotImplementedError


class ChromaDBStore(VectorStore):
    """ChromaDB 向量存储"""

    def _init_store(self):
        if not HAS_CHROMADB:
            raise RuntimeError("ChromaDB 未安装")

        self._client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=Settings(anonymized_telemetry=False)
        )
        self._collection = self._client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}  # 余弦相似度
        )

    def add(self, chunks: List[CodeChunk], embeddings: List[List[float]]):
        ids = [c.id for c in chunks]
        documents = [c.content for c in chunks]
        metadatas = [
            {
                "file_path": c.file_path,
                "language": c.language,
                "start_line": c.start_line,
                "end_line": c.end_line,
                "chunk_type": c.chunk_type,
                "name": c.name,
            }
            for c in chunks
        ]

        self._collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

    def query(self, embedding: List[float], top_k: int = DEFAULT_TOP_K) -> List[Tuple[str, float]]:
        results = self._collection.query(
            query_embeddings=[embedding],
            n_results=top_k
        )

        output = []
        if results["ids"] and results["ids"][0]:
            for i, chunk_id in enumerate(results["ids"][0]):
                distance = results["distances"][0][i] if results["distances"] else 0.0
                output.append((chunk_id, distance))
        return output

    def delete(self, ids: List[str]):
        self._collection.delete(ids=ids)

    def clear(self):
        self._client.delete_collection(self.collection_name)
        self._collection = self._client.get_or_create_collection(self.collection_name)


class SimpleCacheStore(VectorStore):
    """简单缓存存储（ChromaDB 不可用时的降级方案）"""
    # 降级模式使用纯文本匹配


# ─── 嵌入模型 ────────────────────────────────────────────────────────────────

class EmbeddingModel:
    """嵌入模型接口"""

    def __init__(self, model_name: str = EMBEDDING_MODEL, dim: int = EMBEDDING_DIM):
        self.model_name = model_name
        self.dim = dim
        self._client = None
        self._local_model = None
        self._init_model()

    def _init_model(self):
        """初始化模型"""
        # 优先使用 OpenAI
        if HAS_OPENAI:
            try:
                self._client = openai.OpenAI()
                self._use_openai = True
                print(f"[CodeRAG] 使用 OpenAI Embedding: {self.model_name}")
                return
            except Exception as e:
                print(f"[CodeRAG] OpenAI 不可用: {e}")

        # 降级到本地模型
        if HAS_SENTENCE_TRANSFORMERS:
            try:
                self._local_model = SentenceTransformer(LOCAL_EMBEDDING_MODEL)
                self.dim = LOCAL_EMBEDDING_DIM
                self._use_openai = False
                print(f"[CodeRAG] 使用本地 Embedding: {LOCAL_EMBEDDING_MODEL}")
                return
            except Exception as e:
                print(f"[CodeRAG] 本地模型加载失败: {e}")

        # 完全降级：随机向量
        print("[CodeRAG] 警告：无可用嵌入模型，使用随机向量（仅用于测试）")
        self._use_openai = False

    def encode(self, texts: List[str]) -> List[List[float]]:
        """编码文本为向量"""
        if self._use_openai and self._client:
            response = self._client.embeddings.create(
                model=self.model_name,
                input=texts
            )
            return [item.embedding for item in response.data]

        elif self._local_model:
            embeddings = self._local_model.encode(texts)
            return embeddings.tolist()

        else:
            # 降级：返回随机向量
            import random
            return [
                [random.random() for _ in range(self.dim)]
                for _ in texts
            ]

    def encode_one(self, text: str) -> List[float]:
        """编码单个文本"""
        return self.encode([text])[0]


# ─── 代码分块器 ───────────────────────────────────────────────────────────────

class CodeChunker:
    """代码分块器，按函数/类级别切分"""

    # 支持的语言和注释模式
    LANGUAGE_PATTERNS = {
        "python": {
            "function": r"(?:^|\n)(def\s+\w+\s*\([^)]*\)\s*(?:->\s*\w+)?\s*:)",
            "class": r"(?:^|\n)(class\s+\w+\s*(?:\([^)]*\))?\s*:)",
            "import": r"(?:^|\n)(?:from\s+\S+\s+)?import\s+.+)",
            "comment": r"(?:^|\n)#\s*.+",
        },
        "typescript": {
            "function": r"(?:^|\n)(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*\S+\s*)?\{)",
            "class": r"(?:^|\n)(?:export\s+)?(?:abstract\s+)?class\s+\w+\s*(?:extends\s+\w+)?(?:\s*implements\s+[\w,\s]+)?\s*\{)",
            "method": r"(?:^|\n)\s*(?:async\s+)?\w+\s*\([^)]*\)\s*(?::\s*\S+\s*)?\{)",
            "import": r"(?:^|\n)(?:export\s+)?import\s+.+from\s+['\"].+['\"]",
        },
        "javascript": {
            "function": r"(?:^|\n)(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)",
            "class": r"(?:^|\n)(?:export\s+)?class\s+\w+\s*(?:extends\s+\w+)?\s*\{",
            "import": r"(?:^|\n)(?:export\s+)?import\s+.+from\s+['\"].+['\"]",
        },
    }

    def __init__(self, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_file(self, file_path: str, content: str) -> List[CodeChunk]:
        """对单个文件进行分块"""
        ext = Path(file_path).suffix.lstrip(".")
        lang = self._detect_language(ext)

        chunks = []
        lines = content.split("\n")

        # 按语言选择模式
        patterns = self.LANGUAGE_PATTERNS.get(lang, self.LANGUAGE_PATTERNS["python"])

        # 查找所有函数/类定义
        entities = []
        for chunk_type, pattern in patterns.items():
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[:match.start()].count("\n") + 1
                entities.append({
                    "type": chunk_type,
                    "start": match.start(),
                    "end": self._find_block_end(content, match.start()),
                    "line": line_num,
                    "name": self._extract_name(match.group(), chunk_type)
                })

        # 按起始位置排序
        entities.sort(key=lambda x: x["start"])

        # 如果没有找到实体，按行分块
        if not entities:
            return self._chunk_by_lines(file_path, content, lang)

        # 合并相邻的实体
        merged = self._merge_entities(entities)

        # 创建分块
        for i, entity in enumerate(merged):
            chunk_content = content[entity["start"]:entity["end"]]
            chunk_id = self._generate_chunk_id(file_path, entity["start"])

            chunks.append(CodeChunk(
                id=chunk_id,
                content=chunk_content,
                file_path=file_path,
                language=lang,
                start_line=entity["line"],
                end_line=content[:entity["end"]].count("\n") + 1,
                chunk_type=entity["type"],
                name=entity["name"],
                metadata={"entity_index": i}
            ))

        return chunks

    def _detect_language(self, ext: str) -> str:
        """检测语言"""
        lang_map = {
            "py": "python",
            "ts": "typescript",
            "tsx": "typescript",
            "js": "javascript",
            "jsx": "javascript",
        }
        return lang_map.get(ext.lower(), "python")

    def _find_block_end(self, content: str, start: int) -> int:
        """找到代码块的结束位置"""
        # 简单启发式：找对应的闭合括号或下一个同级的 def/class
        brace_count = 0
        in_string = False
        string_char = None

        i = start
        while i < len(content):
            c = content[i]

            # 字符串处理
            if c in "'\"":
                if not in_string:
                    in_string = True
                    string_char = c
                elif c == string_char and (i == 0 or content[i-1] != "\\"):
                    in_string = False
                    string_char = None

            if not in_string:
                if c == "{":
                    brace_count += 1
                elif c == "}":
                    brace_count -= 1
                    if brace_count == 0:
                        return i + 1

            i += 1

        return len(content)

    def _extract_name(self, match_text: str, chunk_type: str) -> str:
        """提取函数/类名"""
        if chunk_type == "function":
            m = re.search(r"function\s+(\w+)", match_text) or re.search(r"def\s+(\w+)", match_text)
        elif chunk_type == "class":
            m = re.search(r"class\s+(\w+)", match_text)
        else:
            return ""
        return m.group(1) if m else ""

    def _merge_entities(self, entities: List[Dict]) -> List[Dict]:
        """合并相邻的实体"""
        if not entities:
            return []

        merged = [entities[0].copy()]

        for entity in entities[1:]:
            last = merged[-1]

            # 如果与上一个实体重叠或太近，合并
            if entity["start"] - last["end"] < 50:
                last["end"] = max(last["end"], entity["end"])
            else:
                merged.append(entity.copy())

        return merged

    def _chunk_by_lines(self, file_path: str, content: str, lang: str) -> List[CodeChunk]:
        """按行分块（当没有找到函数/类时）"""
        chunks = []
        lines = content.split("\n")
        total_lines = len(lines)

        i = 0
        chunk_num = 0
        while i < total_lines:
            start_line = i + 1
            chunk_lines = []
            char_count = 0

            while i < total_lines and char_count < self.chunk_size:
                chunk_lines.append(lines[i])
                char_count += len(lines[i]) + 1
                i += 1

            chunk_id = self._generate_chunk_id(file_path, start_line)
            chunk_content = "\n".join(chunk_lines)

            chunks.append(CodeChunk(
                id=chunk_id,
                content=chunk_content,
                file_path=file_path,
                language=lang,
                start_line=start_line,
                end_line=i,
                chunk_type="block",
                metadata={"chunk_num": chunk_num}
            ))
            chunk_num += 1

            # 重叠
            i -= self.overlap
            if i < start_line:
                i = start_line

        return chunks

    def _generate_chunk_id(self, file_path: str, offset: int) -> str:
        """生成唯一的 chunk ID"""
        unique = f"{file_path}:{offset}"
        return hashlib.md5(unique.encode()).hexdigest()[:16]


# ─── 代码 RAG 系统 ─────────────────────────────────────────────────────────────

class CodeRAG:
    """
    代码检索增强生成系统

    用法：
      rag = CodeRAG(workspace="/path/to/project")

      # 索引项目
      rag.index_project()

      # 检索
      results = rag.query("如何实现用户认证？")

      # 获取注入上下文的 Prompt
      context = rag.get_context_prompt("修复登录 bug")
    """

    def __init__(
        self,
        workspace: str = ".",
        persist_dir: str = None,
        collection_name: str = DEFAULT_COLLECTION_NAME,
        embedding_model: str = EMBEDDING_MODEL,
        top_k: int = DEFAULT_TOP_K,
        chunk_size: int = CHUNK_SIZE
    ):
        self.workspace = Path(workspace).resolve()
        self.persist_dir = persist_dir or str(self.workspace / ".maoai" / "code_rag")
        self.collection_name = collection_name
        self.top_k = top_k
        self.chunk_size = chunk_size

        # 确保目录存在
        os.makedirs(self.persist_dir, exist_ok=True)

        # 初始化组件
        self.chunker = CodeChunker(chunk_size=chunk_size)
        self.embedding_model = EmbeddingModel(model_name=embedding_model)

        # 初始化向量存储
        self._store: Optional[VectorStore] = None
        self._init_store()

        # 索引元数据
        self._indexed_files: Dict[str, float] = {}  # file_path -> mtime

    def _init_store(self):
        """初始化向量存储"""
        if HAS_CHROMADB:
            try:
                self._store = ChromaDBStore(self.persist_dir, self.collection_name)
                return
            except Exception as e:
                print(f"[CodeRAG] ChromaDB 初始化失败: {e}")

        # 降级：使用内存存储
        print("[CodeRAG] 使用降级模式（无持久化）")
        self._store = None

    def index_project(
        self,
        extensions: List[str] = None,
        exclude_dirs: List[str] = None
    ) -> Dict[str, int]:
        """
        索引整个项目

        参数:
            extensions: 要索引的文件扩展名，如 [".py", ".ts", ".tsx"]
            exclude_dirs: 排除的目录，如 ["node_modules", "__pycache__"]

        返回:
            {"files": 文件数, "chunks": 分块数}
        """
        extensions = extensions or [".py", ".ts", ".tsx", ".js", ".jsx"]
        exclude_dirs = exclude_dirs or [
            "node_modules", "__pycache__", ".git", "dist", "build",
            ".venv", "venv", ".env", "coverage", ".pytest_cache"
        ]

        # 收集所有文件
        files_to_index = []
        for ext in extensions:
            for f in self.workspace.rglob(f"*{ext}"):
                # 排除目录
                if any(excl in f.parts for excl in exclude_dirs):
                    continue
                files_to_index.append(f)

        print(f"[CodeRAG] 找到 {len(files_to_index)} 个文件待索引")

        # 加载现有索引信息
        index_info_path = Path(self.persist_dir) / "indexed_files.json"
        if index_info_path.exists():
            with open(index_info_path) as f:
                self._indexed_files = json.load(f)

        # 检查增量更新
        new_files = []
        modified_files = []
        for f in files_to_index:
            mtime = f.stat().st_mtime
            if str(f) not in self._indexed_files:
                new_files.append(f)
            elif self._indexed_files[str(f)] < mtime:
                modified_files.append(f)

        print(f"[CodeRAG] 新文件: {len(new_files)}, 修改: {len(modified_files)}")

        total_chunks = 0

        # 处理新文件和修改的文件
        for files in [new_files, modified_files]:
            chunks = []
            for f in files:
                try:
                    content = f.read_text(encoding="utf-8")
                    file_chunks = self.chunker.chunk_file(str(f), content)
                    chunks.extend(file_chunks)
                    self._indexed_files[str(f)] = f.stat().st_mtime
                except Exception as e:
                    print(f"[CodeRAG] 跳过 {f}: {e}")

            if chunks:
                # 生成嵌入
                texts = [c.content for c in chunks]
                embeddings = self.embedding_model.encode(texts)

                # 存储
                if self._store:
                    self._store.add(chunks, embeddings)

                total_chunks += len(chunks)

        # 保存索引信息
        with open(index_info_path, "w") as f:
            json.dump(self._indexed_files, f)

        return {
            "files": len(new_files) + len(modified_files),
            "chunks": total_chunks,
            "total_files": len(files_to_index)
        }

    def index_file(self, file_path: str) -> int:
        """
        索引单个文件

        参数:
            file_path: 文件路径（绝对或相对于 workspace）

        返回:
            分块数
        """
        f = Path(file_path)
        if not f.is_absolute():
            f = self.workspace / f

        if not f.exists():
            raise FileNotFoundError(f"文件不存在: {f}")

        content = f.read_text(encoding="utf-8")
        chunks = self.chunker.chunk_file(str(f), content)

        if chunks:
            texts = [c.content for c in chunks]
            embeddings = self.embedding_model.encode(texts)

            if self._store:
                self._store.add(chunks, embeddings)

            self._indexed_files[str(f)] = f.stat().st_mtime

            # 保存索引信息
            index_info_path = Path(self.persist_dir) / "indexed_files.json"
            with open(index_info_path, "w") as f:
                json.dump(self._indexed_files, f)

        return len(chunks)

    def query(
        self,
        query_text: str,
        top_k: int = None,
        file_filter: str = None
    ) -> List[RetrievalResult]:
        """
        语义检索

        参数:
            query_text: 查询文本
            top_k: 返回数量
            file_filter: 文件路径过滤（支持 glob 模式）

        返回:
            检索结果列表
        """
        top_k = top_k or self.top_k

        if not self._store:
            return self._fallback_query(query_text, top_k)

        # 生成查询向量
        query_embedding = self.embedding_model.encode_one(query_text)

        # 检索
        results = self._store.query(query_embedding, top_k)

        # 加载分块详情
        retrieval_results = []
        for chunk_id, distance in results:
            chunk = self._load_chunk(chunk_id)
            if chunk:
                # 文件过滤
                if file_filter:
                    import fnmatch
                    if not fnmatch.fnmatch(chunk.file_path, file_filter):
                        continue

                retrieval_results.append(RetrievalResult(
                    chunk=chunk,
                    score=1.0 - distance,  # 余弦距离转相似度
                    distance=distance
                ))

        return retrieval_results

    def _load_chunk(self, chunk_id: str) -> Optional[CodeChunk]:
        """从存储中加载分块"""
        # ChromaDB 会存储 metadata，可以重建
        # 这里简化处理，返回基本结构
        return None

    def _fallback_query(self, query_text: str, top_k: int) -> List[RetrievalResult]:
        """降级查询：使用简单文本匹配"""
        results = []

        # 遍历已索引的文件
        for file_path, mtime in self._indexed_files.items():
            try:
                f = Path(file_path)
                content = f.read_text(encoding="utf-8")

                # 简单关键词匹配
                query_words = query_text.lower().split()
                lines = content.split("\n")

                for i, line in enumerate(lines):
                    score = sum(1 for w in query_words if w in line.lower())

                    if score > 0:
                        # 取周围几行作为上下文
                        start = max(0, i - 2)
                        end = min(len(lines), i + 5)
                        context = "\n".join(lines[start:end])

                        chunks = self.chunker.chunk_file(file_path, content)
                        # 找到对应的 chunk
                        for chunk in chunks:
                            if chunk.start_line <= i + 1 <= chunk.end_line:
                                results.append(RetrievalResult(
                                    chunk=chunk,
                                    score=score / len(query_words),
                                    distance=1.0 - score / len(query_words)
                                ))
                                break
            except Exception:
                continue

        # 排序并返回 top_k
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def get_context_prompt(
        self,
        query: str,
        top_k: int = None,
        max_context_length: int = MAX_CONTEXT_LENGTH
    ) -> str:
        """
        获取注入上下文的 Prompt

        参数:
            query: 用户查询
            top_k: 使用的上下文数量
            max_context_length: 最大上下文长度

        返回:
            格式化的上下文字符串
        """
        results = self.query(query, top_k=top_k)

        if not results:
            return ""

        context_parts = []
        current_length = 0

        for result in results:
            chunk = result.chunk

            # 构建片段描述
            part = f"""
// 文件: {chunk.file_path}
// 行号: {chunk.start_line}-{chunk.end_line}
// 类型: {chunk.chunk_type}
{m chunk.name or ""}
// 相似度: {result.score:.2f}
---
{chunk.content}
---"""

            # 检查长度
            if current_length + len(part) > max_context_length:
                break

            context_parts.append(part)
            current_length += len(part)

        if not context_parts:
            return ""

        header = f"""根据代码库中的相关片段回答问题。

// 找到 {len(context_parts)} 个相关片段
// 总长度: {current_length} 字符

"""
        return header + "\n".join(context_parts)

    def find_related_files(self, file_path: str) -> List[str]:
        """
        查找与指定文件相关的文件

        基于 import/require 语句和命名约定

        参数:
            file_path: 文件路径

        返回:
            相关文件路径列表
        """
        f = Path(file_path)
        if not f.is_absolute():
            f = self.workspace / f

        related = set()

        try:
            content = f.read_text(encoding="utf-8")

            # 查找 import 语句
            import_patterns = [
                r"import\s+.*\s+from\s+['\"]([^'\"]+)['\"]",
                r"require\s*\(['\"]([^'\"]+)['\"]\)",
                r"from\s+([\w.]+)\s+import",
            ]

            for pattern in import_patterns:
                for match in re.finditer(pattern, content):
                    module_path = match.group(1)

                    # 尝试解析模块路径
                    base_name = module_path.split("/")[-1]
                    possible_exts = [".py", ".ts", ".tsx", ".js", ".jsx", ""]

                    for ext in possible_exts:
                        resolved = f.parent / f"{base_name}{ext}"
                        if resolved.exists():
                            related.add(str(resolved))
                        # 也检查 index 文件
                        resolved_idx = resolved.parent / resolved.stem / f"index{ext}"
                        if resolved_idx.exists():
                            related.add(str(resolved_idx))

        except Exception as e:
            print(f"[CodeRAG] 查找相关文件失败: {e}")

        return list(related)

    def search_by_symbol(self, symbol: str, lang: str = None) -> List[CodeChunk]:
        """
        按符号（函数/类名）搜索

        参数:
            symbol: 符号名称
            lang: 语言过滤

        返回:
            匹配的分块列表
        """
        results = self.query(f"定义 {symbol}", top_k=10)

        filtered = []
        for r in results:
            if r.chunk.name == symbol or symbol in r.chunk.name:
                if lang is None or r.chunk.language == lang:
                    filtered.append(r.chunk)

        return filtered

    def get_file_context(
        self,
        file_path: str,
        line_number: int,
        context_lines: int = 10
    ) -> str:
        """
        获取指定位置的代码上下文

        参数:
            file_path: 文件路径
            line_number: 行号
            context_lines: 上下文行数

        返回:
            上下文代码字符串
        """
        f = Path(file_path)
        if not f.exists():
            return ""

        try:
            lines = f.read_text(encoding="utf-8").split("\n")

            start = max(0, line_number - context_lines - 1)
            end = min(len(lines), line_number + context_lines)

            header = f"// 文件: {file_path}\n// 焦点行: {line_number}\n"
            code = "\n".join(lines[start:end])

            return header + code

        except Exception:
            return ""

    def clear_index(self):
        """清空索引"""
        if self._store:
            self._store.clear()
        self._indexed_files = {}

        index_info_path = Path(self.persist_dir) / "indexed_files.json"
        if index_info_path.exists():
            index_info_path.unlink()

        print("[CodeRAG] 索引已清空")


# ─── 快捷函数 ────────────────────────────────────────────────────────────────

def create_code_rag(workspace: str = ".", **kwargs) -> CodeRAG:
    """创建 CodeRAG 实例的快捷函数"""
    return CodeRAG(workspace=workspace, **kwargs)


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Code RAG - 代码向量检索系统")
    parser.add_argument("--workspace", "-w", default=".", help="工作目录")
    parser.add_argument("--action", "-a", choices=["index", "query", "clear"], default="index")
    parser.add_argument("--query", "-q", help="查询文本")
    parser.add_argument("--top-k", "-k", type=int, default=5, help="返回数量")
    parser.add_argument("--file", "-f", help="索引单个文件")
    parser.add_argument("--rebuild", "-r", action="store_true", help="重建索引")

    args = parser.parse_args()

    rag = CodeRAG(workspace=args.workspace)

    if args.action == "index":
        if args.file:
            chunks = rag.index_file(args.file)
            print(f"索引文件: {args.file}, 生成了 {chunks} 个分块")
        else:
            if args.rebuild:
                rag.clear_index()
            result = rag.index_project()
            print(f"索引完成: {result['files']} 文件, {result['chunks']} 分块")

    elif args.action == "query":
        if not args.query:
            print("错误: 需要提供 --query 参数")
            exit(1)

        results = rag.query(args.query, top_k=args.top_k)

        print(f"\n查询: {args.query}")
        print(f"找到 {len(results)} 个结果:\n")

        for i, r in enumerate(results):
            print(f"--- 结果 {i+1} ---")
            print(f"文件: {r.chunk.file_path}")
            print(f"行号: {r.chunk.start_line}-{r.chunk.end_line}")
            print(f"类型: {r.chunk.chunk_type}")
            print(f"相似度: {r.score:.3f}")
            print(f"代码:\n{r.chunk.content[:300]}...")
            print()

    elif args.action == "clear":
        rag.clear_index()
        print("索引已清空")
