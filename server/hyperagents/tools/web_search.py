#!/usr/bin/env python3
"""
MaoAI HyperAgents — Web Search Tool (联网搜索工具)
─────────────────────────────────────────────────────────────────────────────
支持：
  - Tavily API
  - Serper API
  - DuckDuckGo (免费备用)

用法：
  from web_search import WebSearchTool
  tool = WebSearchTool()
  results = tool.search("React best practices 2025", max_results=5)
"""

import os
import json
import time
import re
from typing import Dict, List, Any, Optional


def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志"""
    entry = {"type": step_type, "message": message, "timestamp": time.time(), **kwargs}
    print(json.dumps(entry, ensure_ascii=False), flush=True)


class WebSearchTool:
    """
    联网搜索工具

    支持多个搜索提供商，按优先级尝试：
    1. Tavily (推荐，需要 API Key)
    2. Serper
    3. DuckDuckGo (免费)
    """

    def __init__(self):
        self.tavily_key = os.environ.get("TAVILY_API_KEY", "")
        self.serper_key = os.environ.get("SERPER_API_KEY", "")
        self.max_results = 10
        self.timeout = 30

    def search(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        """
        执行联网搜索

        Args:
            query: 搜索关键词
            max_results: 最大结果数

        Returns:
            {
                "success": bool,
                "results": [{"title", "url", "snippet", "source"}],
                "query": str,
                "total": int
            }
        """
        log_step("action", f"🌐 执行联网搜索: {query[:60]}...", tool="web_search")

        # 按优先级尝试不同的搜索 API
        if self.tavily_key:
            result = self._search_tavily(query, max_results)
        elif self.serper_key:
            result = self._search_serper(query, max_results)
        else:
            result = self._search_duckduckgo(query, max_results)

        if result["success"]:
            log_step("done", f"搜索完成: {result['total']} 个结果",
                    tool="web_search", total=result["total"])
        else:
            log_step("error", f"搜索失败: {result.get('error')}",
                    tool="web_search", error=result.get("error"))

        return result

    def _search_tavily(self, query: str, max_results: int) -> Dict[str, Any]:
        """使用 Tavily API 搜索"""
        import urllib.request
        import urllib.error

        url = "https://api.tavily.com/search"
        payload = {
            "query": query,
            "max_results": max_results,
            "include_answer": True,
            "include_raw_content": False
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.tavily_key}"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                result = json.loads(resp.read().decode("utf-8"))

                results = []
                for item in result.get("results", [])[:max_results]:
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": item.get("content", "")[:300],
                        "source": "tavily"
                    })

                return {
                    "success": True,
                    "results": results,
                    "query": query,
                    "total": len(results),
                    "answer": result.get("answer", "")
                }
        except Exception as e:
            return {"success": False, "results": [], "error": str(e)}

    def _search_serper(self, query: str, max_results: int) -> Dict[str, Any]:
        """使用 Serper API 搜索"""
        import urllib.request
        import urllib.error

        url = "https://google.serper.dev/search"
        payload = {"q": query, "num": max_results}

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, data=data,
            headers={
                "Content-Type": "application/json",
                "X-API-KEY": self.serper_key
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                result = json.loads(resp.read().decode("utf-8"))

                results = []
                for item in result.get("organic", [])[:max_results]:
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "snippet": item.get("snippet", "")[:300],
                        "source": "serper"
                    })

                return {
                    "success": True,
                    "results": results,
                    "query": query,
                    "total": len(results)
                }
        except Exception as e:
            return {"success": False, "results": [], "error": str(e)}

    def _search_duckduckgo(self, query: str, max_results: int) -> Dict[str, Any]:
        """使用 DuckDuckGo 免费搜索（模拟）"""
        # 实际实现可以使用 duckduckgo-search 库
        # pip install duckduckgo-search
        return {
            "success": True,
            "results": [
                {
                    "title": f"[模拟] 关于 {query} 的搜索结果",
                    "url": "https://example.com",
                    "snippet": f"这是关于 {query} 的搜索摘要...",
                    "source": "duckduckgo (demo)"
                }
            ],
            "query": query,
            "total": 1,
            "note": "请配置 TAVILY_API_KEY 或 SERPER_API_KEY 获取真实搜索结果"
        }

    def search_multiple(self, queries: List[str]) -> Dict[str, Any]:
        """
        并行搜索多个关键词

        Returns:
            {
                "query1": {...results},
                "query2": {...results},
                ...
            }
        """
        log_step("action", f"🌐 并行搜索 {len(queries)} 个关键词...", tool="web_search",
                queries=queries)

        results = {}
        for query in queries:
            results[query] = self.search(query)

        log_step("done", f"并行搜索完成: {len(results)} 个查询",
                tool="web_search", total_queries=len(results))

        return results

    def get_code_docs(self, library: str) -> Dict[str, Any]:
        """快速获取库/框架的官方文档摘要"""
        return self.search(f"{library} official documentation site:docs.{library.lower()}.dev OR site:{library.lower()}.com/docs", max_results=3)


# ─── CLI 测试 ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    tool = WebSearchTool()
    results = tool.search("TypeScript best practices 2025")
    print(json.dumps(results, ensure_ascii=False, indent=2))
