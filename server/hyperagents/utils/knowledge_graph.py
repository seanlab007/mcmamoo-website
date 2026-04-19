#!/usr/bin/env python3
"""
MaoAI HyperAgents — Knowledge Graph (项目知识图谱)
─────────────────────────────────────────────────────────────────────────────
功能：
  1. 扫描项目目录，构建函数调用链图谱
  2. 维护组件关系、API 依赖、数据流
  3. 支持按关键词检索相关代码片段

用法：
  from knowledge_graph import KnowledgeGraph
  kg = KnowledgeGraph("/path/to/project")
  kg.build()  # 构建图谱
  results = kg.search("用户认证")  # 搜索相关代码
  chains = kg.get_call_chain("login")  # 获取调用链
"""

import os
import re
import json
import time
from typing import Dict, List, Set, Any, Optional
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import hashlib


def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志"""
    entry = {"type": step_type, "message": message, "timestamp": time.time(), **kwargs}
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 数据结构 ────────────────────────────────────────────────────────────────

@dataclass
class FunctionNode:
    """函数节点"""
    name: str
    file_path: str
    line_number: int
    signature: str = ""
    docstring: str = ""
    imports: List[str] = field(default_factory=list)
    calls: List[str] = field(default_factory=list)  # 调用的函数
    called_by: List[str] = field(default_factory=list)  # 被谁调用
    complexity: int = 0  # 圈复杂度估算
    type: str = "function"  # function/class/method/hook


@dataclass
class ComponentEdge:
    """组件关系边"""
    from_node: str
    to_node: str
    relation_type: str  # imports/calls/uses/props
    file_path: str
    line_number: int = 0


# ─── Knowledge Graph ────────────────────────────────────────────────────────

class KnowledgeGraph:
    """
    项目级知识图谱

    维护：
    - nodes: 函数/类/组件节点
    - edges: 组件间关系
    - index: 关键词倒排索引
    """

    def __init__(self, workspace: str):
        self.workspace = workspace
        self.nodes: Dict[str, FunctionNode] = {}
        self.edges: List[ComponentEdge] = []
        self.index: Dict[str, List[str]] = defaultdict(list)  # keyword -> [node_name]
        self.file_cache: Dict[str, str] = {}  # path -> content

        # 支持的文件类型
        self.extensions = {
            ".ts", ".tsx", ".js", ".jsx",
            ".py", ".go", ".rs",
            ".java", ".cpp", ".c"
        }

        # 忽略的目录
        self.ignore_dirs = {
            "node_modules", "__pycache__", ".git", "dist", "build",
            ".next", "out", "target", ".venv", ".idea", ".vscode",
            "coverage", ".nyc_output"
        }

    def build(self, max_depth: int = 3) -> Dict[str, Any]:
        """
        构建项目知识图谱

        扫描所有支持的文件，提取：
        1. 函数/类定义
        2. 函数调用关系
        3. import 语句
        4. 组件 props
        """
        log_step("start", f"Knowledge Graph 开始构建: {self.workspace}")

        stats = {"files_scanned": 0, "functions_found": 0, "edges_found": 0}

        for root, dirs, files in os.walk(self.workspace):
            # 过滤忽略目录
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]

            # 限制深度
            depth = root[len(self.workspace):].count(os.sep)
            if depth > max_depth:
                continue

            for file in files:
                if not any(file.endswith(ext) for ext in self.extensions):
                    continue

                file_path = os.path.join(root, file)
                self._scan_file(file_path, stats)

        # 构建索引
        self._build_index()

        # 推断调用关系
        self._infer_call_relations()

        log_step("done", f"图谱构建完成",
                files=stats["files_scanned"],
                functions=stats["functions_found"],
                edges=stats["edges_found"])

        return {
            "node_count": len(self.nodes),
            "edge_count": len(self.edges),
            "index_size": len(self.index),
            "stats": stats
        }

    def _scan_file(self, file_path: str, stats: Dict):
        """扫描单个文件，提取节点和边"""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception:
            return

        rel_path = os.path.relpath(file_path, self.workspace)
        self.file_cache[rel_path] = content
        stats["files_scanned"] += 1

        # TypeScript/JavaScript 模式
        if file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
            self._scan_tsx_js(content, rel_path, stats)
        # Python 模式
        elif file_path.endswith(".py"):
            self._scan_python(content, rel_path, stats)

    def _scan_tsx_js(self, content: str, rel_path: str, stats: Dict):
        """扫描 TypeScript/JavaScript 文件"""

        # 函数定义
        func_patterns = [
            r"(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)",  # function xxx()
            r"(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>",  # const xxx = () =>
            r"(?:export\s+)?(?:async\s+)?(\w+)\s*:\s*(?:React\.)?(?:FC|Component)<[^>]+>",  # const xxx: FC
            r"class\s+(\w+)(?:\s+extends\s+\w+)?",  # class xxx
        ]

        lines = content.splitlines()
        for i, line in enumerate(lines, 1):
            for pattern in func_patterns:
                match = re.search(pattern, line)
                if match:
                    name = match.group(1)
                    if not name.startswith("_"):  # 忽略私有函数
                        node = FunctionNode(
                            name=name,
                            file_path=rel_path,
                            line_number=i,
                            signature=line.strip()[:100],
                            type="component" if "Component" in line else "function"
                        )
                        self.nodes[f"{rel_path}:{name}"] = node
                        stats["functions_found"] += 1

        # Import 语句
        import_pattern = r"import\s+(?:{\s*)?([\w,\s]+?)(?:\s*})?\s+from\s+['\"]([^'\"]+)['\"]"
        for match in re.finditer(import_pattern, content):
            imported = match.group(1)
            from_path = match.group(2)
            imports = [n.strip() for n in imported.split(",")]

            for name in imports:
                node_key = f"{rel_path}:{name}"
                if node_key in self.nodes:
                    self.nodes[node_key].imports.append(from_path)

        # 函数调用
        call_pattern = r"\b(\w+)\s*\("
        for match in re.finditer(call_pattern, content):
            caller = match.group(1)
            # 查找定义该调用的函数（简化处理）
            for node_key, node in self.nodes.items():
                if node.file_path == rel_path:
                    if caller not in node.calls:
                        node.calls.append(caller)

    def _scan_python(self, content: str, rel_path: str, stats: Dict):
        """扫描 Python 文件"""

        # 函数定义
        func_pattern = r"(?:def|async\s+def)\s+(\w+)\s*\([^)]*\):"
        for match in re.finditer(func_pattern, content):
            name = match.group(1)
            if not name.startswith("_"):
                line_num = content[:match.start()].count("\n") + 1
                node = FunctionNode(
                    name=name,
                    file_path=rel_path,
                    line_number=line_num,
                    type="function"
                )
                self.nodes[f"{rel_path}:{name}"] = node
                stats["functions_found"] += 1

        # 类定义
        class_pattern = r"class\s+(\w+)(?:\([^)]+\))?:"
        for match in re.finditer(class_pattern, content):
            name = match.group(1)
            line_num = content[:match.start()].count("\n") + 1
            node = FunctionNode(
                name=name,
                file_path=rel_path,
                line_number=line_num,
                type="class"
            )
            self.nodes[f"{rel_path}:{name}"] = node
            stats["functions_found"] += 1

    def _build_index(self):
        """构建关键词倒排索引"""
        log_step("action", "构建关键词索引...", component="knowledge_graph")

        for node_key, node in self.nodes.items():
            # 提取关键词
            keywords = set()

            # 从名称提取
            name_parts = re.findall(r"[A-Z][a-z]+|[a-z]+", node.name)
            keywords.update(name_parts)

            # 从路径提取
            path_parts = re.findall(r"[A-Z][a-z]+|[a-z]+", node.file_path)
            keywords.update(path_parts)

            # 从签名提取
            sig_parts = re.findall(r"\w+", node.signature)
            keywords.update(sig_parts)

            # 索引
            for kw in keywords:
                kw_lower = kw.lower()
                if kw_lower not in self.index:
                    self.index[kw_lower] = []
                self.index[kw_lower].append(node_key)

        log_step("done", f"索引构建完成，共 {len(self.index)} 个关键词")

    def _infer_call_relations(self):
        """根据导入关系推断调用关系"""
        for node_key, node in self.nodes.items():
            for imported in node.imports:
                # 尝试匹配被导入的模块
                for other_key, other_node in self.nodes.items():
                    if other_node.file_path.endswith(imported.replace(".", "/").split("/")[-1]):
                        edge = ComponentEdge(
                            from_node=node_key,
                            to_node=other_key,
                            relation_type="imports",
                            file_path=node.file_path
                        )
                        self.edges.append(edge)

    def search(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        语义搜索相关代码节点

        Args:
            query: 搜索关键词
            top_k: 返回前 k 个结果

        Returns:
            相关节点列表（按相关性排序）
        """
        log_step("action", f"知识图谱搜索: {query}", component="knowledge_graph", query=query)

        keywords = re.findall(r"\w+", query.lower())
        scores: Dict[str, float] = defaultdict(float)

        for kw in keywords:
            # 精确匹配
            if kw in self.index:
                for node_key in self.index[kw]:
                    scores[node_key] += 2.0
            # 前缀匹配
            for idx_kw, nodes in self.index.items():
                if idx_kw.startswith(kw) or kw.startswith(idx_kw):
                    for node_key in nodes:
                        scores[node_key] += 1.0

        # 排序
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        results = []
        for node_key, score in ranked:
            node = self.nodes.get(node_key)
            if node:
                results.append({
                    "score": score,
                    "name": node.name,
                    "file": node.file_path,
                    "line": node.line_number,
                    "type": node.type,
                    "signature": node.signature
                })

        log_step("done", f"搜索完成，找到 {len(results)} 个相关节点", results_count=len(results))

        return results

    def get_call_chain(self, function_name: str) -> Dict[str, Any]:
        """
        获取函数调用链

        Returns:
            {
                "upstream": [...],  # 调用该函数的函数
                "downstream": [...]  # 该函数调用的函数
            }
        """
        chain = {"upstream": [], "downstream": []}

        for node_key, node in self.nodes.items():
            if node.name == function_name or function_name in node_key:
                chain["downstream"] = [
                    {"name": n.name, "file": n.file_path}
                    for n in [self.nodes.get(k) for k in node.calls]
                    if n
                ]

        # 反向查找
        for node_key, node in self.nodes.items():
            if function_name in node.calls:
                chain["upstream"].append({
                    "name": node.name,
                    "file": node.file_path,
                    "line": node.line_number
                })

        return chain

    def get_related_components(self, component_name: str) -> List[Dict[str, str]]:
        """获取相关组件列表"""
        related = []

        for node_key, node in self.nodes.items():
            if node.name == component_name:
                # 同文件组件
                for other_key, other in self.nodes.items():
                    if other.file_path == node.file_path and other.name != node.name:
                        related.append({
                            "name": other.name,
                            "type": other.type,
                            "relation": "same_file"
                        })

                # 导入该组件的组件
                for edge in self.edges:
                    if edge.to_node == node_key:
                        from_node = self.nodes.get(edge.from_node)
                        if from_node:
                            related.append({
                                "name": from_node.name,
                                "type": from_node.type,
                                "relation": edge.relation_type
                            })

        return related

    def to_dict(self) -> Dict:
        """导出为字典（可序列化）"""
        return {
            "nodes": {k: asdict(v) for k, v in self.nodes.items()},
            "edges": [asdict(e) for e in self.edges],
            "index": dict(self.index),
            "metadata": {
                "workspace": self.workspace,
                "node_count": len(self.nodes),
                "edge_count": len(self.edges)
            }
        }

    def save(self, path: str = ".knowledge_graph.json"):
        """保存图谱到文件"""
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)
        log_step("done", f"图谱已保存: {path}", path=path)


# ─── Vector RAG (简易版) ─────────────────────────────────────────────────────

class VectorRAG:
    """
    简易向量检索系统

    使用 TF-IDF + 余弦相似度实现，无需外部向量库
    """

    def __init__(self, workspace: str):
        self.workspace = workspace
        self.documents: Dict[str, Dict[str, Any]] = {}  # doc_id -> {content, embedding, metadata}
        self.vocabulary: Dict[str, int] = {}  # word -> index
        self.idf: Dict[str, float] = {}  # word -> idf score

    def index_project(self) -> int:
        """索引整个项目"""
        kg = KnowledgeGraph(self.workspace)
        kg.build(max_depth=4)

        count = 0
        for node_key, node in kg.nodes.items():
            doc_id = f"{node.file_path}:{node.name}"
            self.documents[doc_id] = {
                "content": f"{node.name} {node.signature} {node.file_path}",
                "node": asdict(node),
                "type": node.type
            }
            count += 1

        self._compute_idf()
        log_step("done", f"Vector RAG 索引完成: {count} 个文档")

        return count

    def _compute_idf(self):
        """计算 IDF 分数"""
        N = len(self.documents)
        df = defaultdict(int)

        for doc in self.documents.values():
            words = set(doc["content"].lower().split())
            for w in words:
                df[w] += 1

        self.vocabulary = {w: i for i, w in enumerate(df.keys())}

        for w, d in df.items():
            self.idf[w] = log((N - d + 0.5) / (d + 0.5) + 1)

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """向量检索"""
        from math import sqrt, log

        # 构建查询向量
        query_words = query.lower().split()
        qv = [0.0] * len(self.vocabulary)
        q_len = 0

        for w in query_words:
            if w in self.vocabulary:
                idx = self.vocabulary[w]
                qv[idx] += 1
                q_len += 1

        q_len = sqrt(q_len)
        if q_len > 0:
            qv = [x / q_len for x in qv]

        # 计算相似度
        scores = []
        for doc_id, doc in self.documents.items():
            doc_words = doc["content"].lower().split()
            dv = [0.0] * len(self.vocabulary)
            d_len = 0

            for w in doc_words:
                if w in self.vocabulary:
                    idx = self.vocabulary[w]
                    dv[idx] += 1
                    d_len += 1

            d_len = sqrt(d_len)
            if d_len > 0:
                dv = [x / d_len for x in dv]

            # 余弦相似度
            sim = sum(q * d for q, d in zip(qv, dv) if q > 0 and d > 0)

            scores.append((doc_id, sim, doc))

        # 排序
        scores.sort(key=lambda x: x[1], reverse=True)

        return [
            {"doc_id": doc_id, "score": sim, **doc["node"]}
            for doc_id, sim, doc in scores[:top_k]
        ]


# ─── Experience Archive ─────────────────────────────────────────────────────

class ExperienceArchive:
    """
    经验池 - 跨任务记忆系统

    存储 Agent 历史修复经验，支持快速检索复用
    """

    def __init__(self, archive_path: str = ".experience_archive.json"):
        self.archive_path = archive_path
        self.experiences: List[Dict] = []
        self._load()

    def _load(self):
        """加载已有经验"""
        if os.path.exists(self.archive_path):
            try:
                with open(self.archive_path, "r", encoding="utf-8") as f:
                    self.experiences = json.load(f)
                log_step("done", f"经验池加载完成: {len(self.experiences)} 条经验")
            except Exception:
                self.experiences = []

    def save(self):
        """保存经验池"""
        with open(self.archive_path, "w", encoding="utf-8") as f:
            json.dump(self.experiences, f, ensure_ascii=False, indent=2)
        log_step("done", f"经验池已保存: {len(self.experiences)} 条经验")

    def add(self, task: str, solution: str, success: bool, metrics: Dict = None):
        """添加新经验"""
        experience = {
            "task": task,
            "solution": solution[:2000],
            "success": success,
            "metrics": metrics or {},
            "timestamp": time.time(),
            "task_hash": hashlib.md5(task.encode()).hexdigest()[:8]
        }
        self.experiences.append(experience)
        self.save()
        log_step("done", f"经验已添加: {task[:50]}", success=success)

    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        """搜索相似经验"""
        query_words = set(query.lower().split())

        scored = []
        for exp in self.experiences:
            exp_words = set(exp["task"].lower().split())
            # Jaccard 相似度
            intersection = len(query_words & exp_words)
            union = len(query_words | exp_words)
            sim = intersection / union if union > 0 else 0
            scored.append((exp, sim))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [exp for exp, _ in scored[:top_k]]

    def get_hint(self, task: str) -> Optional[str]:
        """获取任务提示（基于历史经验）"""
        similar = self.search(task, top_k=1)
        if similar and similar[0]["success"]:
            return f"💡 历史经验：类似任务曾成功解决 - {similar[0]['task'][:50]}..."
        return None


# ─── CLI 测试 ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    workspace = sys.argv[1] if len(sys.argv) > 1 else "."

    log_step("start", "初始化知识图谱...", workspace=workspace)

    # 构建图谱
    kg = KnowledgeGraph(workspace)
    stats = kg.build()
    kg.save()

    # 测试搜索
    if len(sys.argv) > 2:
        query = sys.argv[2]
        results = kg.search(query)
        print(f"\n🔍 搜索 '{query}' 的结果：")
        for r in results:
            print(f"  - {r['name']} ({r['file']}:{r['line']}) score={r['score']:.2f}")
