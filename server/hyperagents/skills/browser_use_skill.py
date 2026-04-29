"""
BrowserUseSkill - 视觉驱动的浏览器自动化
═══════════════════════════════════════════════════════════════════════════════
基于 Playwright 的高级浏览器自动化技能，支持视觉感知和自主决策。

核心能力：
- 视觉感知：截图分析页面状态
- 自主导航：基于目标的 URL 导航
- 智能交互：点击、填写、滚动等操作
- 数据提取：结构化数据抓取

Author: MaoAI Core 2.0
Version: 3.0.0 "破壁者"
"""

import asyncio
import base64
import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Callable
from urllib.parse import urljoin, urlparse

try:
    from playwright.async_api import async_playwright, Page, Browser, BrowserContext
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


# ───────────────────────────────────────────────────────────────────────────────
# 数据模型
# ───────────────────────────────────────────────────────────────────────────────

class BrowserAction(Enum):
    """浏览器动作类型"""
    NAVIGATE = "navigate"           # 导航到URL
    CLICK = "click"                 # 点击元素
    FILL = "fill"                   # 填写输入框
    SCROLL = "scroll"               # 滚动页面
    SCREENSHOT = "screenshot"       # 截图
    EXTRACT = "extract"             # 提取数据
    WAIT = "wait"                   # 等待
    HOVER = "hover"                 # 悬停
    SELECT = "select"               # 选择下拉框
    UPLOAD = "upload"               # 上传文件


@dataclass
class ActionResult:
    """动作执行结果"""
    action: BrowserAction
    success: bool
    data: Any = None
    screenshot: Optional[str] = None  # base64 encoded
    error: Optional[str] = None
    duration_ms: int = 0
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class BrowserState:
    """浏览器状态快照"""
    url: str
    title: str
    screenshot: Optional[str] = None
    elements: List[Dict] = field(default_factory=list)
    scroll_position: Dict[str, int] = field(default_factory=lambda: {"x": 0, "y": 0})
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class TaskPlan:
    """任务执行计划"""
    goal: str
    steps: List[Dict[str, Any]]
    current_step: int = 0
    context: Dict[str, Any] = field(default_factory=dict)


# ───────────────────────────────────────────────────────────────────────────────
# BrowserUseSkill 主类
# ───────────────────────────────────────────────────────────────────────────────

class BrowserUseSkill:
    """
    视觉驱动的浏览器自动化技能
    
    使用方式：
        skill = BrowserUseSkill()
        
        # 执行简单任务
        result = await skill.execute({
            "action": "navigate",
            "url": "https://example.com"
        })
        
        # 执行复杂任务流
        result = await skill.execute_task({
            "goal": "在知乎搜索'AI发展趋势'并提取前3个回答",
            "steps": [
                {"action": "navigate", "url": "https://zhihu.com"},
                {"action": "fill", "selector": "input[name='q']", "value": "AI发展趋势"},
                {"action": "click", "selector": "button[type='submit']"},
                {"action": "extract", "selector": ".ContentItem", "limit": 3}
            ]
        })
    """
    
    def __init__(
        self,
        headless: bool = True,
        slow_mo: int = 0,
        viewport: Optional[Dict[str, int]] = None,
        user_data_dir: Optional[str] = None,
    ):
        self.headless = headless
        self.slow_mo = slow_mo
        self.viewport = viewport or {"width": 1280, "height": 720}
        self.user_data_dir = user_data_dir
        
        # 运行时状态
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None
        
        # 历史记录
        self.action_history: List[ActionResult] = []
        self.screenshots_dir = Path("./screenshots")
        self.screenshots_dir.mkdir(exist_ok=True)
    
    # ───────────────────────────────────────────────────────────────────────────
    # 生命周期管理
    # ───────────────────────────────────────────────────────────────────────────
    
    async def initialize(self):
        """初始化浏览器"""
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright not installed. Run: pip install playwright && playwright install")
        
        self.playwright = await async_playwright().start()
        
        browser_args = {
            "headless": self.headless,
            "slow_mo": self.slow_mo,
        }
        
        if self.user_data_dir:
            browser_args["user_data_dir"] = self.user_data_dir
        
        self.browser = await self.playwright.chromium.launch(**browser_args)
        
        self.context = await self.browser.new_context(
            viewport=self.viewport,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        
        self.page = await self.context.new_page()
        
        # 设置默认超时
        self.page.set_default_timeout(30000)
    
    async def close(self):
        """关闭浏览器"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def health_check(self) -> bool:
        """健康检查"""
        try:
            if not self.browser or not self.page:
                await self.initialize()
            return True
        except Exception as e:
            print(f"Browser health check failed: {e}")
            return False
    
    # ───────────────────────────────────────────────────────────────────────────
    # 核心执行接口
    # ───────────────────────────────────────────────────────────────────────────
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行单个浏览器任务
        
        Args:
            task: {
                "action": "navigate|click|fill|scroll|screenshot|extract|wait",
                ...action-specific params
            }
        """
        if not self.page:
            await self.initialize()
        
        action = task.get("action")
        if not action:
            return {"success": False, "error": "Missing action"}
        
        try:
            result = await self._execute_action(action, task)
            return {
                "success": result.success,
                "data": result.data,
                "screenshot": result.screenshot,
                "error": result.error,
                "duration_ms": result.duration_ms,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def execute_task(self, task_plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行复杂任务计划
        
        Args:
            task_plan: {
                "goal": "任务目标描述",
                "steps": [
                    {"action": "...", ...},
                    ...
                ]
            }
        """
        goal = task_plan.get("goal", "")
        steps = task_plan.get("steps", [])
        
        if not steps:
            return {"success": False, "error": "No steps provided"}
        
        results = []
        context = {}
        
        for i, step in enumerate(steps):
            print(f"[Step {i+1}/{len(steps)}] {step.get('action', 'unknown')}")
            
            # 替换上下文变量
            step = self._resolve_context(step, context)
            
            result = await self.execute(step)
            results.append(result)
            
            # 更新上下文
            if result.get("success") and "extracted_data" in result.get("data", {}):
                context.update(result["data"]["extracted_data"])
            
            if not result.get("success"):
                return {
                    "success": False,
                    "error": f"Step {i+1} failed: {result.get('error')}",
                    "results": results,
                    "completed_steps": i,
                }
        
        return {
            "success": True,
            "goal": goal,
            "results": results,
            "context": context,
        }
    
    def _resolve_context(self, step: Dict, context: Dict) -> Dict:
        """解析步骤中的上下文变量"""
        step_str = json.dumps(step)
        
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            if placeholder in step_str:
                step_str = step_str.replace(placeholder, str(value))
        
        return json.loads(step_str)
    
    # ───────────────────────────────────────────────────────────────────────────
    # 动作执行
    # ───────────────────────────────────────────────────────────────────────────
    
    async def _execute_action(self, action: str, params: Dict) -> ActionResult:
        """执行具体动作"""
        import time
        start_time = time.time()
        
        try:
            if action == "navigate":
                result = await self._action_navigate(params)
            elif action == "click":
                result = await self._action_click(params)
            elif action == "fill":
                result = await self._action_fill(params)
            elif action == "scroll":
                result = await self._action_scroll(params)
            elif action == "screenshot":
                result = await self._action_screenshot(params)
            elif action == "extract":
                result = await self._action_extract(params)
            elif action == "wait":
                result = await self._action_wait(params)
            elif action == "hover":
                result = await self._action_hover(params)
            elif action == "select":
                result = await self._action_select(params)
            else:
                result = ActionResult(
                    action=BrowserAction(action),
                    success=False,
                    error=f"Unknown action: {action}",
                )
            
            result.duration_ms = int((time.time() - start_time) * 1000)
            self.action_history.append(result)
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            result = ActionResult(
                action=BrowserAction(action),
                success=False,
                error=str(e),
                duration_ms=duration_ms,
            )
            self.action_history.append(result)
            return result
    
    async def _action_navigate(self, params: Dict) -> ActionResult:
        """导航到URL"""
        url = params.get("url")
        if not url:
            return ActionResult(action=BrowserAction.NAVIGATE, success=False, error="Missing URL")
        
        await self.page.goto(url, wait_until="networkidle")
        
        screenshot = await self._capture_screenshot() if params.get("screenshot") else None
        
        return ActionResult(
            action=BrowserAction.NAVIGATE,
            success=True,
            data={"url": self.page.url, "title": await self.page.title()},
            screenshot=screenshot,
        )
    
    async def _action_click(self, params: Dict) -> ActionResult:
        """点击元素"""
        selector = params.get("selector")
        text = params.get("text")  # 通过文本内容点击
        
        if text:
            # 通过文本点击
            await self.page.get_by_text(text).click()
        elif selector:
            await self.page.click(selector)
        else:
            return ActionResult(action=BrowserAction.CLICK, success=False, error="Missing selector or text")
        
        # 等待页面稳定
        await self.page.wait_for_load_state("networkidle")
        
        screenshot = await self._capture_screenshot() if params.get("screenshot") else None
        
        return ActionResult(
            action=BrowserAction.CLICK,
            success=True,
            data={"url": self.page.url},
            screenshot=screenshot,
        )
    
    async def _action_fill(self, params: Dict) -> ActionResult:
        """填写输入框"""
        selector = params.get("selector")
        value = params.get("value", "")
        
        if not selector:
            return ActionResult(action=BrowserAction.FILL, success=False, error="Missing selector")
        
        await self.page.fill(selector, value)
        
        return ActionResult(
            action=BrowserAction.FILL,
            success=True,
            data={"selector": selector, "value": value},
        )
    
    async def _action_scroll(self, params: Dict) -> ActionResult:
        """滚动页面"""
        direction = params.get("direction", "down")
        amount = params.get("amount", 500)
        
        if direction == "down":
            await self.page.evaluate(f"window.scrollBy(0, {amount})")
        elif direction == "up":
            await self.page.evaluate(f"window.scrollBy(0, -{amount})")
        elif direction == "bottom":
            await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        elif direction == "top":
            await self.page.evaluate("window.scrollTo(0, 0)")
        elif direction == "element":
            selector = params.get("selector")
            if selector:
                await self.page.evaluate(f"document.querySelector('{selector}').scrollIntoView()")
        
        scroll_y = await self.page.evaluate("window.scrollY")
        
        return ActionResult(
            action=BrowserAction.SCROLL,
            success=True,
            data={"scroll_y": scroll_y},
        )
    
    async def _action_screenshot(self, params: Dict) -> ActionResult:
        """截图"""
        full_page = params.get("full_page", False)
        selector = params.get("selector")
        
        if selector:
            element = await self.page.query_selector(selector)
            if element:
                screenshot_bytes = await element.screenshot()
            else:
                return ActionResult(action=BrowserAction.SCREENSHOT, success=False, error=f"Element not found: {selector}")
        else:
            screenshot_bytes = await self.page.screenshot(full_page=full_page)
        
        # 保存文件
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"screenshot_{timestamp}.png"
        filepath = self.screenshots_dir / filename
        
        with open(filepath, "wb") as f:
            f.write(screenshot_bytes)
        
        # base64编码用于返回
        screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
        
        return ActionResult(
            action=BrowserAction.SCREENSHOT,
            success=True,
            data={"filepath": str(filepath), "filename": filename},
            screenshot=screenshot_b64,
        )
    
    async def _action_extract(self, params: Dict) -> ActionResult:
        """提取数据"""
        selector = params.get("selector")
        attribute = params.get("attribute", "textContent")
        multiple = params.get("multiple", True)
        limit = params.get("limit")
        
        if not selector:
            return ActionResult(action=BrowserAction.EXTRACT, success=False, error="Missing selector")
        
        if multiple:
            elements = await self.page.query_selector_all(selector)
            data = []
            
            for i, element in enumerate(elements):
                if limit and i >= limit:
                    break
                
                if attribute == "textContent":
                    text = await element.text_content()
                    data.append(text.strip() if text else "")
                elif attribute == "innerHTML":
                    html = await element.inner_html()
                    data.append(html)
                else:
                    attr_value = await element.get_attribute(attribute)
                    data.append(attr_value)
            
            # 尝试提取结构化数据
            structured_data = await self._extract_structured_data(elements[:limit] if limit else elements)
        else:
            element = await self.page.query_selector(selector)
            if not element:
                return ActionResult(action=BrowserAction.EXTRACT, success=False, error=f"Element not found: {selector}")
            
            if attribute == "textContent":
                data = await element.text_content()
            elif attribute == "innerHTML":
                data = await element.inner_html()
            else:
                data = await element.get_attribute(attribute)
            
            structured_data = {}
        
        return ActionResult(
            action=BrowserAction.EXTRACT,
            success=True,
            data={
                "extracted": data,
                "count": len(data) if isinstance(data, list) else 1,
                "extracted_data": structured_data,
            },
        )
    
    async def _extract_structured_data(self, elements: List) -> Dict:
        """提取结构化数据（链接、图片等）"""
        data = {"links": [], "images": [], "texts": []}
        
        for element in elements:
            # 提取链接
            href = await element.get_attribute("href")
            if href:
                data["links"].append(href)
            
            # 提取图片
            src = await element.get_attribute("src")
            if src:
                data["images"].append(src)
            
            # 提取文本
            text = await element.text_content()
            if text:
                data["texts"].append(text.strip())
        
        return data
    
    async def _action_wait(self, params: Dict) -> ActionResult:
        """等待"""
        ms = params.get("ms", 1000)
        selector = params.get("selector")
        state = params.get("state", "visible")  # visible, hidden, attached, detached
        
        if selector:
            await self.page.wait_for_selector(selector, state=state)
        else:
            await asyncio.sleep(ms / 1000)
        
        return ActionResult(
            action=BrowserAction.WAIT,
            success=True,
            data={"waited_ms": ms},
        )
    
    async def _action_hover(self, params: Dict) -> ActionResult:
        """悬停"""
        selector = params.get("selector")
        if not selector:
            return ActionResult(action=BrowserAction.HOVER, success=False, error="Missing selector")
        
        await self.page.hover(selector)
        return ActionResult(action=BrowserAction.HOVER, success=True)
    
    async def _action_select(self, params: Dict) -> ActionResult:
        """选择下拉框"""
        selector = params.get("selector")
        value = params.get("value")
        label = params.get("label")
        index = params.get("index")
        
        if not selector:
            return ActionResult(action=BrowserAction.SELECT, success=False, error="Missing selector")
        
        if value:
            await self.page.select_option(selector, value=value)
        elif label:
            await self.page.select_option(selector, label=label)
        elif index is not None:
            await self.page.select_option(selector, index=index)
        
        return ActionResult(action=BrowserAction.SELECT, success=True)
    
    # ───────────────────────────────────────────────────────────────────────────
    # 辅助方法
    # ───────────────────────────────────────────────────────────────────────────
    
    async def _capture_screenshot(self) -> str:
        """捕获截图并返回base64"""
        screenshot_bytes = await self.page.screenshot()
        return base64.b64encode(screenshot_bytes).decode()
    
    async def get_state(self) -> BrowserState:
        """获取当前浏览器状态"""
        return BrowserState(
            url=self.page.url,
            title=await self.page.title(),
            scroll_position=await self.page.evaluate("() => ({ x: window.scrollX, y: window.scrollY })"),
        )
    
    def get_history(self) -> List[Dict]:
        """获取执行历史"""
        return [
            {
                "action": r.action.value,
                "success": r.success,
                "duration_ms": r.duration_ms,
                "timestamp": r.timestamp.isoformat(),
                "error": r.error,
            }
            for r in self.action_history
        ]
    
    def get_manifest(self) -> Dict:
        """获取技能清单"""
        return {
            "skill_id": "browser_use",
            "name": "Browser Use",
            "version": "3.0.0",
            "description": "视觉驱动的浏览器自动化技能",
            "author": "MaoAI",
            "source": "builtin",
            "entry_point": "BrowserUseSkill",
            "tags": ["browser", "automation", "web", "visual"],
        }


# ───────────────────────────────────────────────────────────────────────────────
# 快捷函数
# ───────────────────────────────────────────────────────────────────────────────

async def browse(url: str, actions: List[Dict] = None) -> Dict:
    """
    快捷浏览函数
    
    Args:
        url: 起始URL
        actions: 要执行的动作列表
    
    Returns:
        执行结果
    """
    skill = BrowserUseSkill()
    
    try:
        await skill.initialize()
        
        # 导航到URL
        result = await skill.execute({"action": "navigate", "url": url, "screenshot": True})
        
        if not result.get("success"):
            return result
        
        # 执行后续动作
        if actions:
            for action in actions:
                action_result = await skill.execute(action)
                if not action_result.get("success"):
                    return action_result
        
        return {
            "success": True,
            "url": skill.page.url if skill.page else url,
            "history": skill.get_history(),
        }
        
    finally:
        await skill.close()


# ───────────────────────────────────────────────────────────────────────────────
# 测试
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test_browser():
        """测试浏览器技能"""
        skill = BrowserUseSkill(headless=False)  # 可视化模式便于调试
        
        try:
            await skill.initialize()
            
            # 测试导航
            result = await skill.execute({
                "action": "navigate",
                "url": "https://example.com",
                "screenshot": True,
            })
            print(f"导航结果: {result}")
            
            # 测试截图
            result = await skill.execute({"action": "screenshot", "full_page": True})
            print(f"截图结果: {result.get('data', {}).get('filename')}")
            
            # 测试提取
            result = await skill.execute({
                "action": "extract",
                "selector": "p",
                "multiple": True,
            })
            print(f"提取结果: {result.get('data', {}).get('extracted', [])[:2]}")
            
        finally:
            await skill.close()
    
    # 运行测试
    asyncio.run(test_browser())
