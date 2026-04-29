#!/usr/bin/env python3
"""
MaoAI HyperAgents — Search Code（代码搜索工具）
─────────────────────────────────────────────────────────────────────────────
核心能力：
  1. 基于 grep 的快速代码搜索
  2. 支持正则表达式搜索
  3. 按文件类型过滤
  4. 搜索结果高亮
  5. 支持多种输出格式

用法：
  from search_code import CodeSearcher, grep

  # 方式1：直接搜索
  results = grep("function.*login", path="src", regex=True)

  # 方式2：使用搜索器（更多选项）
  searcher = CodeSearcher(workspace="/path/to/project")
  results = searcher.search("useAuth", extensions=[".ts", ".tsx"])
  print(results)
"""

import os
import re
import subprocess
import fnmatch
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class SearchMode(Enum):
    """搜索模式"""
    LITERAL = "literal"      # 字面搜索
    REGEX = "regex"         # 正则搜索
    FUZZY = "fuzzy"        # 模糊搜索


@dataclass
class SearchResult:
    """搜索结果"""
    file_path: str
    line_number: int
    line_content: str
    match_start: int
    match_end: int
    context_before: List[str]
    context_after: List[str]


class CodeSearcher:
    """
    代码搜索引擎

    特点：
      - 基于 grep 的高速搜索
      - 智能文件类型识别
      - 上下文感知
      - 结果格式化
    """

    # 常见编程语言的文件扩展名
    EXTENSION_MAP = {
        "typescript": [".ts", ".tsx"],
        "javascript": [".js", ".jsx", ".mjs", ".cjs"],
        "python": [".py"],
        "rust": [".rs"],
        "go": [".go"],
        "java": [".java"],
        "cpp": [".cpp", ".cc", ".cxx", ".h", ".hpp"],
        "csharp": [".cs"],
        "ruby": [".rb"],
        "php": [".php"],
        "swift": [".swift"],
        "kotlin": [".kt", ".kts"],
        "html": [".html", ".htm"],
        "css": [".css", ".scss", ".sass", ".less"],
        "json": [".json"],
        "yaml": [".yaml", ".yml"],
        "markdown": [".md", ".mdx"],
    }

    # 默认忽略的目录
    IGNORE_DIRS = [
        "node_modules", ".git", ".svn", ".hg",
        "__pycache__", ".pytest_cache", ".mypy_cache",
        "dist", "build", "target", ".next",
        ".nuxt", ".cache", ".tmp", "coverage"
    ]

    # 默认忽略的文件
    IGNORE_FILES = [
        "*.min.js", "*.min.css", "*.bundle.js",
        "*.pyc", "__pycache__", ".DS_Store",
        "package-lock.json", "yarn.lock", "*.log"
    ]

    def __init__(
        self,
        workspace: str = None,
        ignore_dirs: List[str] = None,
        ignore_files: List[str] = None
    ):
        """
        初始化搜索器

        Args:
            workspace: 工作目录
            ignore_dirs: 忽略的目录列表
            ignore_files: 忽略的文件列表
        """
        self.workspace = workspace or os.getcwd()
        self.ignore_dirs = ignore_dirs or self.IGNORE_DIRS
        self.ignore_files = ignore_files or self.IGNORE_FILES

    def search(
        self,
        query: str,
        path: str = None,
        mode: SearchMode = SearchMode.LITERAL,
        extensions: List[str] = None,
        max_results: int = 100,
        context_lines: int = 2,
        case_sensitive: bool = False
    ) -> List[SearchResult]:
        """
        搜索代码

        Args:
            query: 搜索关键词
            path: 搜索路径（相对于 workspace）
            mode: 搜索模式
            extensions: 文件扩展名过滤
            max_results: 最大结果数
            context_lines: 上下文行数
            case_sensitive: 是否区分大小写

        Returns:
            List[SearchResult]: 搜索结果列表
        """
        search_path = os.path.join(self.workspace, path or ".")

        # 构建 grep 命令
        cmd = ["grep", "-n"]  # 显示行号

        if not case_sensitive:
            cmd.append("-i")

        if mode == SearchMode.REGEX:
            cmd.append("-E")
        else:
            cmd.append("-F")  # 字面搜索

        # 添加上下文
        cmd.extend(["-B", str(context_lines)])
        cmd.extend(["-A", str(context_lines)])

        # 构建忽略选项
        for ignore in self.ignore_dirs:
            cmd.extend(["--exclude-dir", ignore])
        for ignore in self.ignore_files:
            cmd.extend(["--exclude", ignore])

        # 添加文件类型过滤
        if extensions:
            patterns = [f"*.{ext.lstrip('.')}" for ext in extensions]
            cmd.extend(["--include=" + p for p in patterns])

        cmd.append(query)
        cmd.append(search_path)

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )

            return self._parse_grep_output(
                result.stdout,
                max_results,
                context_lines
            )

        except subprocess.TimeoutExpired:
            return []
        except Exception as e:
            print(f"Search error: {e}")
            return []

    def search_function(
        self,
        function_name: str,
        language: str = None,
        path: str = None
    ) -> List[SearchResult]:
        """
        搜索函数定义

        Args:
            function_name: 函数名
            language: 语言（用于构建正则）
            path: 搜索路径

        Returns:
            List[SearchResult]: 搜索结果
        """
        patterns = {
            "typescript": [
                rf"function\s+{re.escape(function_name)}\s*\(",
                rf"const\s+{re.escape(function_name)}\s*=",
                rf"async\s+function\s+{re.escape(function_name)}",
                rf"{re.escape(function_name)}\s*:\s*\([^)]*\)\s*=>",
            ],
            "python": [
                rf"def\s+{re.escape(function_name)}\s*\(",
                rf"async\s+def\s+{re.escape(function_name)}\s*\(",
                rf"class\s+{re.escape(function_name)}\s*[:\(]",
            ],
            "default": [
                rf"function\s+{re.escape(function_name)}\s*\(",
                rf"def\s+{re.escape(function_name)}\s*\(",
            ]
        }

        patterns = patterns.get(language, patterns["default"])
        all_results = []

        for pattern in patterns:
            results = self.search(
                pattern,
                path=path,
                mode=SearchMode.REGEX,
                max_results=20
            )
            all_results.extend(results)

        return self._deduplicate_results(all_results)

    def search_imports(
        self,
        module: str,
        path: str = None
    ) -> List[SearchResult]:
        """
        搜索 import 语句

        Args:
            module: 模块名（如 "react", "lodash"）
            path: 搜索路径

        Returns:
            List[SearchResult]: 搜索结果
        """
        patterns = [
            rf"import\s+.*{re.escape(module)}.*from",
            rf"import\s+['\"].*{re.escape(module)}",
            rf"require\s*\(['\"].*{re.escape(module)}",
            rf"from\s+['\"].*{re.escape(module)}",
        ]

        all_results = []
        for pattern in patterns:
            results = self.search(
                pattern,
                path=path,
                mode=SearchMode.REGEX,
                max_results=50
            )
            all_results.extend(results)

        return self._deduplicate_results(all_results)

    def find_files(
        self,
        pattern: str,
        path: str = None,
        extensions: List[str] = None
    ) -> List[str]:
        """
        查找匹配的文件

        Args:
            pattern: 文件名模式（如 "*.ts", "test*"）
            path: 搜索路径
            extensions: 扩展名过滤

        Returns:
            List[str]: 文件路径列表
        """
        search_path = os.path.join(self.workspace, path or ".")

        results = []
        for root, dirs, files in os.walk(search_path):
            # 过滤目录
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]

            for filename in files:
                # 检查文件名
                if not fnmatch.fnmatch(filename, pattern):
                    continue

                # 检查扩展名
                if extensions:
                    ext = os.path.splitext(filename)[1]
                    if ext not in extensions:
                        continue

                results.append(os.path.join(root, filename))

        return results

    def find_related_files(
        self,
        file_path: str
    ) -> Dict[str, List[str]]:
        """
        查找相关文件

        Args:
            file_path: 目标文件路径

        Returns:
            Dict: {
                "imports": [依赖的文件],
                "imported_by": [导入该文件的文件]
            }
        """
        file_path = os.path.join(self.workspace, file_path)
        filename = os.path.basename(file_path)
        module_name = os.path.splitext(filename)[0]

        # 查找导入该文件的文件
        imported_by = self.search_imports(module_name)
        imported_by = [r.file_path for r in imported_by]

        # 查找该文件导入的模块
        imports = []
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # 提取 import 语句
            import_patterns = [
                r"import\s+(?:.*?)\s+from\s+['\"]([^'\"]+)['\"]",
                r"import\s+['\"]([^'\"]+)['\"]",
                r"require\s*\(['\"]([^'\"]+)['\"]\)",
            ]

            for pattern in import_patterns:
                matches = re.findall(pattern, content)
                imports.extend(matches)

        except Exception:
            pass

        return {
            "imports": list(set(imports)),
            "imported_by": list(set(imported_by))
        }

    def _parse_grep_output(
        self,
        output: str,
        max_results: int,
        context_lines: int
    ) -> List[SearchResult]:
        """解析 grep 输出"""
        results = []
        current_file = None
        current_line = 0

        for line in output.splitlines():
            # 文件分隔行: file.ts:10:content
            if ":" not in line:
                continue

            parts = line.split(":", 2)
            if len(parts) < 3:
                continue

            file_path, line_num_str, content = parts
            line_num = int(line_num_str)

            if file_path != current_file:
                current_file = file_path
                current_line = line_num

            # 计算匹配位置
            match_start = content.find(parts[2]) if len(parts) > 2 else 0
            match_end = match_start + len(parts[2]) if len(parts) > 2 else len(content)

            results.append(SearchResult(
                file_path=file_path,
                line_number=line_num,
                line_content=content.strip(),
                match_start=match_start,
                match_end=match_end,
                context_before=[],
                context_after=[]
            ))

            if len(results) >= max_results:
                break

        return results

    def _deduplicate_results(
        self,
        results: List[SearchResult]
    ) -> List[SearchResult]:
        """去重搜索结果"""
        seen = set()
        unique = []

        for r in results:
            key = (r.file_path, r.line_number)
            if key not in seen:
                seen.add(key)
                unique.append(r)

        return unique


# ─── 便捷函数 ────────────────────────────────────────────────────────────────

def grep(
    pattern: str,
    path: str = ".",
    regex: bool = False,
    extensions: List[str] = None,
    ignore_dirs: List[str] = None,
    max_results: int = 100
) -> List[SearchResult]:
    """
    快速 grep 搜索

    Args:
        pattern: 搜索模式
        path: 搜索路径
        regex: 是否使用正则
        extensions: 文件扩展名过滤
        ignore_dirs: 忽略的目录
        max_results: 最大结果数

    Returns:
        List[SearchResult]: 搜索结果
    """
    mode = SearchMode.REGEX if regex else SearchMode.LITERAL
    searcher = CodeSearcher(
        workspace=path if os.path.isabs(path) else None,
        ignore_dirs=ignore_dirs
    )

    return searcher.search(
        query=pattern,
        path=path,
        mode=mode,
        extensions=extensions,
        max_results=max_results
    )


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="MaoAI Code Searcher")
    parser.add_argument("pattern", help="搜索模式")
    parser.add_argument("path", nargs="?", default=".", help="搜索路径")
    parser.add_argument("-r", "--regex", action="store_true", help="使用正则")
    parser.add_argument("-e", "--extension", action="append", help="文件扩展名")
    parser.add_argument("-m", "--max", type=int, default=50, help="最大结果数")
    parser.add_argument("--json", action="store_true", help="JSON 输出")

    args = parser.parse_args()

    results = grep(
        args.pattern,
        path=args.path,
        regex=args.regex,
        extensions=args.extension,
        max_results=args.max
    )

    if args.json:
        output = [
            {
                "file": r.file_path,
                "line": r.line_number,
                "content": r.line_content
            }
            for r in results
        ]
        print(json.dumps(output, ensure_ascii=False, indent=2))
    else:
        for r in results:
            print(f"{r.file_path}:{r.line_number}:{r.line_content}")
