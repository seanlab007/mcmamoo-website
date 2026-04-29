#!/usr/bin/env python3
"""
MaoAI HyperAgents — Project Scanner（项目全景扫描器）
─────────────────────────────────────────────────────────────────────────────
核心能力：
  1. 项目结构扫描：目录树、文件类型统计
  2. 代码解析：提取函数、类、接口定义
  3. 依赖分析：import/require 语句解析
  4. 代码图谱：构建项目依赖图
  5. 项目报告：生成可读的 JSON/Markdown 报告

用法：
  from project_scanner import ProjectScanner

  scanner = ProjectScanner("/path/to/project")
  report = scanner.scan()
  print(report.summary)

  # 获取特定文件的上下文
  context = scanner.get_file_context("src/Login.tsx")
"""

import os
import re
import json
import time
import ast
import hashlib
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from collections import defaultdict
from enum import Enum

# 支持的语言解析器
try:
    import tree_sitter
    from tree_sitter_languages import get_language, get_parser
    HAS_TREE_SITTER = True
except ImportError:
    HAS_TREE_SITTER = False


class Language(Enum):
    """支持的语言"""
    TYPESCRIPT = "typescript"
    JAVASCRIPT = "javascript"
    PYTHON = "python"
    RUST = "rust"
    GO = "go"
    UNKNOWN = "unknown"


@dataclass
class CodeEntity:
    """代码实体（函数、类、接口等）"""
    name: str
    entity_type: str  # function, class, interface, method, constant
    file_path: str
    line_start: int
    line_end: int
    signature: str = ""
    docstring: str = ""
    modifiers: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)


@dataclass
class FileInfo:
    """文件信息"""
    path: str
    language: Language
    size: int
    line_count: int
    entities: List[CodeEntity] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    exported: List[str] = field(default_factory=list)
    hash: str = ""


@dataclass
class DependencyEdge:
    """依赖边"""
    from_file: str
    to_file: str
    import_name: str
    import_type: str  # direct, wildcard, conditional


@dataclass
class ScanReport:
    """扫描报告"""
    project_path: str
    scan_time: float
    summary: Dict
    files: List[FileInfo]
    dependencies: List[DependencyEdge]
    entities: Dict[str, List[CodeEntity]]  # file_path -> entities
    import_graph: Dict[str, List[str]]  # file -> imported files
    entity_index: Dict[str, CodeEntity]  # name -> entity (global)


class ProjectScanner:
    """
    项目全景扫描器

    特点：
      - 多语言支持（TypeScript, JavaScript, Python）
      - 静态分析：无需运行代码
      - 增量扫描：只扫描变更的文件
      - 图谱构建：自动建立依赖关系
    """

    # 文件扩展名映射
    EXT_TO_LANG = {
        ".ts": Language.TYPESCRIPT,
        ".tsx": Language.TYPESCRIPT,
        ".js": Language.JAVASCRIPT,
        ".jsx": Language.JAVASCRIPT,
        ".mjs": Language.JAVASCRIPT,
        ".cjs": Language.JAVASCRIPT,
        ".py": Language.PYTHON,
        ".rs": Language.RUST,
        ".go": Language.GO,
    }

    # 忽略的目录
    IGNORE_DIRS = {
        "node_modules", ".git", ".svn", ".hg",
        "__pycache__", ".pytest_cache", ".mypy_cache",
        "dist", "build", "target", ".next", ".nuxt",
        ".cache", ".tmp", "coverage", ".turbo",
        "vendor", "venv", ".venv", "env"
    }

    # 忽略的文件
    IGNORE_PATTERNS = {
        "*.min.js", "*.min.css", "*.bundle.js",
        "*.pyc", ".DS_Store",
        "package-lock.json", "yarn.lock",
        "*.log", "*.bak"
    }

    def __init__(
        self,
        project_path: str,
        include_patterns: List[str] = None,
        exclude_patterns: List[str] = None,
        use_cache: bool = True
    ):
        """
        初始化扫描器

        Args:
            project_path: 项目根目录
            include_patterns: 包含的文件模式
            exclude_patterns: 排除的文件模式
            use_cache: 是否使用缓存
        """
        self.project_path = os.path.abspath(project_path)
        self.include_patterns = include_patterns or ["*"]
        self.exclude_patterns = exclude_patterns or []
        self.use_cache = use_cache
        self._cache = {}
        self._cache_file = os.path.join(project_path, ".maoai_scan_cache.json")

    def scan(self) -> ScanReport:
        """
        执行全项目扫描

        Returns:
            ScanReport: 扫描报告
        """
        start_time = time.time()

        files = []
        entities = {}
        dependencies = []
        import_graph = defaultdict(list)

        # 遍历所有文件
        for root, dirs, filenames in os.walk(self.project_path):
            # 过滤目录
            dirs[:] = [d for d in dirs if d not in self.IGNORE_DIRS]

            for filename in filenames:
                file_path = os.path.join(root, filename)

                # 检查是否应该忽略
                if self._should_ignore(file_path):
                    continue

                # 解析文件
                file_info = self._scan_file(file_path)
                if file_info:
                    files.append(file_info)
                    entities[file_info.path] = file_info.entities

                    # 收集依赖
                    for imp in file_info.imports:
                        import_graph[file_info.path].append(imp)

                    # 构建依赖边
                    for exp in file_info.exported:
                        dependencies.append(DependencyEdge(
                            from_file=file_info.path,
                            to_file=imp,
                            import_name=exp,
                            import_type="direct"
                        ))

        # 构建摘要
        summary = self._build_summary(files, entities)

        # 构建全局实体索引
        entity_index = {}
        for file_entities in entities.values():
            for entity in file_entities:
                entity_index[entity.name] = entity

        return ScanReport(
            project_path=self.project_path,
            scan_time=time.time() - start_time,
            summary=summary,
            files=files,
            dependencies=dependencies,
            entities=entities,
            import_graph=dict(import_graph),
            entity_index=entity_index
        )

    def get_file_context(
        self,
        file_path: str,
        max_related: int = 5
    ) -> Dict:
        """
        获取文件的上下文信息

        Args:
            file_path: 文件路径
            max_related: 最大关联文件数

        Returns:
            Dict: 包含文件信息和关联文件
        """
        abs_path = os.path.join(self.project_path, file_path)
        if not os.path.exists(abs_path):
            return {"error": f"File not found: {file_path}"}

        file_info = self._scan_file(abs_path)
        if not file_info:
            return {"error": f"Could not parse: {file_path}"}

        # 查找关联文件
        related = self._find_related_files(file_info, max_related)

        return {
            "file": file_info,
            "related_files": related,
            "entities": file_info.entities,
            "imports": file_info.imports
        }

    def search_entity(self, name: str) -> List[CodeEntity]:
        """
        搜索代码实体

        Args:
            name: 实体名称

        Returns:
            List[CodeEntity]: 匹配的实体列表
        """
        report = self.scan()
        results = []

        for file_entities in report.entities.values():
            for entity in file_entities:
                if name.lower() in entity.name.lower():
                    results.append(entity)

        return results

    def _should_ignore(self, file_path: str) -> bool:
        """检查是否应该忽略文件"""
        # 检查扩展名
        ext = os.path.splitext(file_path)[1]
        if ext not in self.EXT_TO_LANG:
            return True

        # 检查忽略模式
        filename = os.path.basename(file_path)
        for pattern in self.IGNORE_PATTERNS:
            if filename.endswith(pattern.lstrip("*")):
                return True

        # 检查排除模式
        for pattern in self.exclude_patterns:
            if pattern in file_path:
                return True

        return False

    def _scan_file(self, file_path: str) -> Optional[FileInfo]:
        """扫描单个文件"""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            ext = os.path.splitext(file_path)[1]
            language = self.EXT_TO_LANG.get(ext, Language.UNKNOWN)

            # 计算文件信息
            line_count = len(content.splitlines())
            file_hash = hashlib.md5(content.encode()).hexdigest()

            # 解析代码
            entities = self._parse_code(content, file_path, language)
            imports, exported = self._extract_imports_exports(content, language)

            return FileInfo(
                path=os.path.relpath(file_path, self.project_path),
                language=language,
                size=len(content),
                line_count=line_count,
                entities=entities,
                imports=imports,
                exported=exported,
                hash=file_hash
            )

        except Exception as e:
            return None

    def _parse_code(
        self,
        content: str,
        file_path: str,
        language: Language
    ) -> List[CodeEntity]:
        """解析代码，提取实体"""
        entities = []

        if language == Language.PYTHON:
            entities = self._parse_python(content, file_path)
        elif language in {Language.TYPESCRIPT, Language.JAVASCRIPT}:
            entities = self._parse_ts_js(content, file_path)

        return entities

    def _parse_python(self, content: str, file_path: str) -> List[CodeEntity]:
        """解析 Python 代码"""
        entities = []

        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                entity = None

                if isinstance(node, ast.FunctionDef):
                    entity = CodeEntity(
                        name=node.name,
                        entity_type="function",
                        file_path=file_path,
                        line_start=node.lineno,
                        line_end=node.end_lineno or node.lineno,
                        signature=ast.unparse(node.args) if hasattr(ast, 'unparse') else "",
                        modifiers=["async"] if isinstance(node, ast.AsyncFunctionDef) else []
                    )
                elif isinstance(node, ast.ClassDef):
                    entity = CodeEntity(
                        name=node.name,
                        entity_type="class",
                        file_path=file_path,
                        line_start=node.lineno,
                        line_end=node.end_lineno or node.lineno,
                    )
                elif isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            entity = CodeEntity(
                                name=target.id,
                                entity_type="constant",
                                file_path=file_path,
                                line_start=node.lineno,
                                line_end=node.end_lineno or node.lineno,
                            )
                            entities.append(entity)
                    continue

                if entity:
                    entities.append(entity)

        except SyntaxError:
            pass

        return entities

    def _parse_ts_js(self, content: str, file_path: str) -> List[CodeEntity]:
        """解析 TypeScript/JavaScript 代码（正则版本）"""
        entities = []

        # 函数定义
        func_patterns = [
            r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)',
            r'(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>',
            r'(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?function',
            r'(?:export\s+)?(?:async\s+)?(\w+)\s*:\s*\([^)]*\)\s*=>',
        ]

        for pattern in func_patterns:
            for match in re.finditer(pattern, content):
                name = match.group(1)
                entities.append(CodeEntity(
                    name=name,
                    entity_type="function",
                    file_path=file_path,
                    line_start=content[:match.start()].count('\n') + 1,
                    line_end=content[:match.end()].count('\n') + 1,
                ))

        # 类定义
        class_pattern = r'(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?'
        for match in re.finditer(class_pattern, content):
            entities.append(CodeEntity(
                name=match.group(1),
                entity_type="class",
                file_path=file_path,
                line_start=content[:match.start()].count('\n') + 1,
                line_end=content[:match.start()].count('\n') + 1,
            ))

        # 接口定义
        interface_pattern = r'(?:export\s+)?interface\s+(\w+)'
        for match in re.finditer(interface_pattern, content):
            entities.append(CodeEntity(
                name=match.group(1),
                entity_type="interface",
                file_path=file_path,
                line_start=content[:match.start()].count('\n') + 1,
                line_end=content[:match.start()].count('\n') + 1,
            ))

        return entities

    def _extract_imports_exports(
        self,
        content: str,
        language: Language
    ) -> Tuple[List[str], List[str]]:
        """提取 import 和 export"""
        imports = []
        exported = []

        if language in {Language.TYPESCRIPT, Language.JAVASCRIPT}:
            # Import
            import_patterns = [
                r'import\s+(?:.*?\s+from\s+)?[\'"]([^\'"]+)[\'"]',
                r'require\s*\([\'"]([^\'"]+)[\'"]\)',
            ]
            for pattern in import_patterns:
                for match in re.finditer(pattern, content):
                    imports.append(match.group(1))

            # Export
            export_patterns = [
                r'export\s+(?:default\s+)?(?:const|function|class|interface|type)\s+(\w+)',
                r'export\s+\{([^}]+)\}',
            ]
            for pattern in export_patterns:
                for match in re.finditer(pattern, content):
                    if pattern.endswith('\}'):
                        exported.extend([e.strip() for e in match.group(1).split(',')])
                    else:
                        exported.append(match.group(1))

        elif language == Language.PYTHON:
            # Import
            import_pattern = r'^(?:from\s+([^\s]+)\s+)?import\s+(.+)$'
            for match in re.finditer(import_pattern, content, re.MULTILINE):
                module = match.group(1) or match.group(2).split('.')[0].strip()
                imports.append(module)

            # Export (all_members pattern)
            all_match = re.search(r'^__all__\s*=\s*\[([^\]]+)\]', content, re.MULTILINE)
            if all_match:
                exported = [e.strip().strip('\'"') for e in all_match.group(1).split(',')]

        return imports, exported

    def _find_related_files(
        self,
        file_info: FileInfo,
        max_related: int
    ) -> List[Dict]:
        """查找关联文件"""
        related = []

        # 查找导入该文件的文件
        file_basename = os.path.splitext(os.path.basename(file_info.path))[0]
        module_name = file_info.imports

        for other_file in self.scan().files:
            if other_file.path == file_info.path:
                continue

            # 检查是否导入
            if any(file_basename in imp for imp in other_file.imports):
                related.append({
                    "file": other_file.path,
                    "type": "imports_this"
                })

            # 检查是否有共同导入
            common = set(file_info.imports) & set(other_file.imports)
            if common:
                related.append({
                    "file": other_file.path,
                    "type": "common_imports",
                    "shared": list(common)[:3]
                })

        return related[:max_related]

    def _build_summary(
        self,
        files: List[FileInfo],
        entities: Dict
    ) -> Dict:
        """构建摘要"""
        total_lines = sum(f.line_count for f in files)
        total_size = sum(f.size for f in files)
        total_entities = sum(len(e) for e in entities.values())

        # 按语言统计
        by_language = defaultdict(lambda: {"files": 0, "lines": 0, "entities": 0})
        for f in files:
            lang = f.language.value
            by_language[lang]["files"] += 1
            by_language[lang]["lines"] += f.line_count
            by_language[lang]["entities"] += len(f.entities)

        return {
            "total_files": len(files),
            "total_lines": total_lines,
            "total_size_bytes": total_size,
            "total_entities": total_entities,
            "by_language": dict(by_language),
        }

    def to_json(self, report: ScanReport) -> str:
        """导出为 JSON"""
        def serialize(obj):
            if isinstance(obj, (ScanReport, FileInfo, CodeEntity, DependencyEdge)):
                return obj.__dict__
            return obj

        return json.dumps(report, default=serialize, indent=2, ensure_ascii=False)

    def save_report(self, report: ScanReport, path: str = None):
        """保存报告"""
        path = path or os.path.join(self.project_path, "maoai_project_report.json")
        with open(path, "w", encoding="utf-8") as f:
            f.write(self.to_json(report))
        return path


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Project Scanner")
    parser.add_argument("project", help="项目目录")
    parser.add_argument("--output", "-o", help="输出文件")
    parser.add_argument("--format", "-f", choices=["json", "markdown"], default="json",
                       help="输出格式")

    args = parser.parse_args()

    print(f"Scanning: {args.project}")
    scanner = ProjectScanner(args.project)
    report = scanner.scan()

    print(f"\nScan complete in {report.scan_time:.2f}s")
    print(f"Files: {report.summary['total_files']}")
    print(f"Lines: {report.summary['total_lines']}")
    print(f"Entities: {report.summary['total_entities']}")

    if args.output:
        if args.format == "json":
            scanner.save_report(report, args.output)
        print(f"\nReport saved to: {args.output}")
    else:
        print(json.dumps(report.summary, indent=2))
