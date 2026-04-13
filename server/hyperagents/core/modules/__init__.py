"""
Core Modules - MaoAI核心能力模块

包含:
- browser_agent: 浏览器自动化引擎 (Manus Max级别)
- sandbox_engine: 隔离执行环境 (代码执行/测试/部署)
"""

from .browser_agent import BrowserAgent, BrowserTask, BrowserResult, quick_scrape, quick_screenshot
from .sandbox_engine import SandboxEngine, SandboxTask, SandboxResult, get_browser_agent, get_sandbox_engine

__all__ = [
    "BrowserAgent", "BrowserTask", "BrowserResult", "quick_scrape", "quick_screenshot",
    "SandboxEngine", "SandboxTask", "SandboxResult", "get_browser_agent", "get_sandbox_engine"
]
