"""
BrowserAgent - Manus Max级别的浏览器自动化引擎
支持：网页导航、表单填写、数据抓取、截图
"""

import asyncio
import json
import base64
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class BrowserMode(Enum):
    HEADLESS = "headless"
    HEADFUL = "headful"

@dataclass
class BrowserTask:
    """浏览器任务定义"""
    action: str  # navigate, click, fill, screenshot, scrape, submit
    url: Optional[str] = None
    selector: Optional[str] = None
    value: Optional[str] = None
    wait_for: Optional[str] = None
    timeout: int = 30

@dataclass
class BrowserResult:
    """浏览器执行结果"""
    success: bool
    data: Optional[Any] = None
    screenshot: Optional[str] = None  # base64
    error: Optional[str] = None
    metadata: Dict = None

class BrowserAgent:
    """
    Manus Max级别的浏览器自动化Agent
    
    能力矩阵:
    - 导航: 打开URL，等待加载
    - 点击: 元素定位与点击
    - 填写: 表单输入
    - 抓取: 页面内容提取
    - 截图: 全页面或元素截图
    - 滚动: 页面滚动
    - 执行JS: 自定义脚本
    """
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.browser = None
        self.context = None
        self.page = None
        
    async def _ensure_browser(self):
        """延迟初始化浏览器"""
        if self.browser is None:
            from playwright.async_api import async_playwright
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.headless
            )
            self.context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            )
            self.page = await self.context.new_page()
    
    async def execute(self, task: BrowserTask) -> BrowserResult:
        """执行浏览器任务"""
        try:
            await self._ensure_browser()
            
            if task.action == "navigate":
                return await self._navigate(task)
            elif task.action == "click":
                return await self._click(task)
            elif task.action == "fill":
                return await self._fill(task)
            elif task.action == "screenshot":
                return await self._screenshot(task)
            elif task.action == "scrape":
                return await self._scrape(task)
            elif task.action == "scroll":
                return await self._scroll(task)
            elif task.action == "evaluate":
                return await self._evaluate(task)
            else:
                return BrowserResult(success=False, error=f"未知动作: {task.action}")
                
        except Exception as e:
            return BrowserResult(success=False, error=str(e))
    
    async def _navigate(self, task: BrowserTask) -> BrowserResult:
        """导航到URL"""
        await self.page.goto(task.url, wait_until="domcontentloaded", timeout=task.timeout * 1000)
        if task.wait_for:
            await self.page.wait_for_selector(task.wait_for, timeout=task.timeout * 1000)
        return BrowserResult(success=True, data={"url": self.page.url, "title": await self.page.title()})
    
    async def _click(self, task: BrowserTask) -> BrowserResult:
        """点击元素"""
        await self.page.click(task.selector, timeout=task.timeout * 1000)
        return BrowserResult(success=True, data={"clicked": task.selector})
    
    async def _fill(self, task: BrowserTask) -> BrowserResult:
        """填写表单"""
        await self.page.fill(task.selector, task.value, timeout=task.timeout * 1000)
        return BrowserResult(success=True, data={"filled": {task.selector: task.value}})
    
    async def _screenshot(self, task: BrowserTask) -> BrowserResult:
        """截图"""
        if task.selector:
            element = await self.page.query_selector(task.selector)
            screenshot_bytes = await element.screenshot()
        else:
            screenshot_bytes = await self.page.screenshot(full_page=True)
        
        screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
        return BrowserResult(success=True, screenshot=screenshot_b64)
    
    async def _scrape(self, task: BrowserTask) -> BrowserResult:
        """抓取页面内容"""
        if task.selector:
            elements = await self.page.query_selector_all(task.selector)
            data = []
            for el in elements:
                text = await el.inner_text()
                data.append(text.strip())
        else:
            data = await self.page.content()
        
        return BrowserResult(success=True, data=data)
    
    async def _scroll(self, task: BrowserTask) -> BrowserResult:
        """滚动页面"""
        await self.page.evaluate(f"window.scrollBy(0, {task.value or 500})")
        return BrowserResult(success=True, data={"scrolled": task.value or 500})
    
    async def _evaluate(self, task: BrowserTask) -> BrowserResult:
        """执行JS"""
        result = await self.page.evaluate(task.value)
        return BrowserResult(success=True, data=result)
    
    async def close(self):
        """关闭浏览器"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()


# 便捷函数
async def quick_scrape(url: str, selector: str = "body") -> Dict:
    """快速抓取页面"""
    agent = BrowserAgent(headless=True)
    try:
        result = await agent.execute(BrowserTask(action="navigate", url=url))
        if result.success:
            result = await agent.execute(BrowserTask(action="scrape", selector=selector))
        return {"success": result.success, "data": result.data, "error": result.error}
    finally:
        await agent.close()


async def quick_screenshot(url: str, full_page: bool = True) -> Dict:
    """快速截图"""
    agent = BrowserAgent(headless=True)
    try:
        result = await agent.execute(BrowserTask(action="navigate", url=url))
        if result.success:
            result = await agent.execute(BrowserTask(action="screenshot"))
        return {"success": result.success, "screenshot": result.screenshot, "error": result.error}
    finally:
        await agent.close()


# 测试
if __name__ == "__main__":
    async def test():
        print("=== BrowserAgent 测试 ===")
        
        # 测试1: 抓取网页
        print("\n[测试1] 抓取GitHub首页...")
        result = await quick_scrape("https://github.com", "h1")
        print(f"标题: {result['data'][:3] if result['data'] else result['error']}")
        
        # 测试2: 截图
        print("\n[测试2] 截图百度首页...")
        result = await quick_screenshot("https://www.baidu.com")
        if result['success']:
            print(f"截图大小: {len(result['screenshot'])} bytes (base64)")
        else:
            print(f"错误: {result['error']}")
        
        print("\n✅ BrowserAgent 测试完成!")
    
    asyncio.run(test())
