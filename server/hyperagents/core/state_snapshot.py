"""
State Snapshot - 环境状态锚点机制
═══════════════════════════════════════════════════════════════════════════════
MaoAI 3.0 "破壁者" 核心组件

解决痛点：上下文断层、忘记任务目标、执行中间死机

核心能力：
- 物理环境快照：Git Diff、Terminal Output、Browser Screenshot
- 断点续传：进程崩溃后从上次状态恢复
- 防断层：给 LLM 的 Prompt 包含真实环境状态摘要

Author: MaoAI Core 3.0
Version: 3.0.0 "破壁者"
"""

import asyncio
import hashlib
import json
import os
import subprocess
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
import base64


@dataclass
class GitState:
    """Git 状态"""
    branch: str = ""
    commit_hash: str = ""
    diff: str = ""  # 当前未提交的变更
    untracked_files: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "branch": self.branch,
            "commit_hash": self.commit_hash[:8] if self.commit_hash else "",
            "diff_length": len(self.diff),
            "untracked_count": len(self.untracked_files),
        }


@dataclass
class TerminalState:
    """终端状态"""
    last_command: str = ""
    last_output: str = ""
    exit_code: int = 0
    working_directory: str = ""
    environment_vars: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            "last_command": self.last_command[:100] if self.last_command else "",
            "exit_code": self.exit_code,
            "working_directory": self.working_directory,
        }


@dataclass
class BrowserState:
    """浏览器状态"""
    current_url: str = ""
    page_title: str = ""
    screenshot_path: Optional[str] = None
    screenshot_base64: Optional[str] = None  # 用于序列化
    visible_elements: List[str] = field(default_factory=list)
    console_logs: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "current_url": self.current_url,
            "page_title": self.page_title,
            "has_screenshot": self.screenshot_path is not None,
            "visible_elements_count": len(self.visible_elements),
            "console_errors": len([l for l in self.console_logs if "error" in l.lower()]),
        }


@dataclass
class FileSystemState:
    """文件系统状态"""
    modified_files: List[str] = field(default_factory=list)
    new_files: List[str] = field(default_factory=list)
    deleted_files: List[str] = field(default_factory=list)
    file_checksums: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            "modified": len(self.modified_files),
            "new": len(self.new_files),
            "deleted": len(self.deleted_files),
        }


@dataclass
class TaskContext:
    """任务上下文"""
    task_id: str = ""
    goal: str = ""
    current_phase: str = ""
    iteration: int = 0
    accumulated_output: str = ""  # 累积的输出
    key_decisions: List[str] = field(default_factory=list)
    open_issues: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "task_id": self.task_id,
            "goal": self.goal[:100] + "..." if len(self.goal) > 100 else self.goal,
            "current_phase": self.current_phase,
            "iteration": self.iteration,
            "key_decisions_count": len(self.key_decisions),
            "open_issues_count": len(self.open_issues),
        }


@dataclass
class StateSnapshot:
    """
    完整状态快照
    
    包含任务执行的所有物理环境状态，支持断点续传
    """
    snapshot_id: str
    timestamp: datetime
    task_context: TaskContext
    git_state: GitState
    terminal_state: TerminalState
    browser_state: Optional[BrowserState] = None
    filesystem_state: FileSystemState = field(default_factory=FileSystemState)
    
    # 序列化的原始数据（用于恢复）
    raw_data: Dict[str, Any] = field(default_factory=dict)
    
    # 元数据
    tags: List[str] = field(default_factory=list)
    notes: str = ""
    
    def to_dict(self) -> Dict:
        """转换为字典（用于 JSON 序列化）"""
        return {
            "snapshot_id": self.snapshot_id,
            "timestamp": self.timestamp.isoformat(),
            "task_context": self.task_context.to_dict(),
            "git_state": self.git_state.to_dict(),
            "terminal_state": self.terminal_state.to_dict(),
            "browser_state": self.browser_state.to_dict() if self.browser_state else None,
            "filesystem_state": self.filesystem_state.to_dict(),
            "tags": self.tags,
            "notes": self.notes,
        }
    
    def to_json(self) -> str:
        """转换为 JSON 字符串"""
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)
    
    def get_summary(self) -> str:
        """获取状态摘要（用于 Prompt）"""
        lines = [
            f"📸 状态快照 [{self.snapshot_id}]",
            f"⏰ 时间: {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}",
            f"",
            f"🎯 任务: {self.task_context.goal[:80]}..." if len(self.task_context.goal) > 80 else f"🎯 任务: {self.task_context.goal}",
            f"📍 阶段: {self.task_context.current_phase} (第 {self.task_context.iteration} 轮)",
            f"",
            f"🌿 Git: {self.git_state.branch} @ {self.git_state.commit_hash[:8]}",
            f"   未提交变更: {len(self.git_state.diff)} 字符",
            f"",
            f"💻 终端: {self.terminal_state.working_directory}",
            f"   最后命令: {self.terminal_state.last_command[:60]}..." if len(self.terminal_state.last_command) > 60 else f"   最后命令: {self.terminal_state.last_command}",
            f"   退出码: {self.terminal_state.exit_code}",
            f"",
        ]
        
        if self.browser_state:
            lines.extend([
                f"🌐 浏览器: {self.browser_state.page_title}",
                f"   URL: {self.browser_state.current_url[:60]}..." if len(self.browser_state.current_url) > 60 else f"   URL: {self.browser_state.current_url}",
                f"   可见元素: {len(self.browser_state.visible_elements)} 个",
                f"",
            ])
        
        lines.extend([
            f"📁 文件变更: +{len(self.filesystem_state.new_files)} ~{len(self.filesystem_state.modified_files)} -{len(self.filesystem_state.deleted_files)}",
        ])
        
        if self.task_context.key_decisions:
            lines.extend([
                f"",
                f"💡 关键决策:",
            ])
            for i, decision in enumerate(self.task_context.key_decisions[-3:], 1):
                lines.append(f"   {i}. {decision[:80]}..." if len(decision) > 80 else f"   {i}. {decision}")
        
        if self.task_context.open_issues:
            lines.extend([
                f"",
                f"⚠️ 待解决问题:",
            ])
            for i, issue in enumerate(self.task_context.open_issues[-3:], 1):
                lines.append(f"   {i}. {issue[:80]}..." if len(issue) > 80 else f"   {i}. {issue}")
        
        return "\n".join(lines)


class StateSnapshotManager:
    """
    状态快照管理器
    
    负责捕获、存储和恢复状态快照
    """
    
    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = Path(storage_dir) if storage_dir else Path.home() / ".maoai" / "snapshots"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        self.snapshots: Dict[str, StateSnapshot] = {}
        self._load_existing_snapshots()
    
    def _load_existing_snapshots(self):
        """加载已存在的快照"""
        for snapshot_file in self.storage_dir.glob("*.json"):
            try:
                with open(snapshot_file, "r") as f:
                    data = json.load(f)
                    # 简化：不恢复完整对象，只记录存在
                    self.snapshots[data.get("snapshot_id", snapshot_file.stem)] = None
            except Exception:
                pass
    
    async def capture(
        self,
        task_context: TaskContext,
        capture_browser: bool = False,
        browser_agent = None,
        tags: Optional[List[str]] = None,
        notes: str = "",
    ) -> StateSnapshot:
        """
        捕获当前状态快照
        
        Args:
            task_context: 任务上下文
            capture_browser: 是否捕获浏览器状态
            browser_agent: 浏览器代理实例
            tags: 标签
            notes: 备注
        
        Returns:
            StateSnapshot: 状态快照
        """
        snapshot_id = self._generate_snapshot_id(task_context.task_id)
        
        # 并行捕获各种状态
        git_state = await self._capture_git_state()
        terminal_state = await self._capture_terminal_state()
        filesystem_state = await self._capture_filesystem_state()
        
        browser_state = None
        if capture_browser and browser_agent:
            browser_state = await self._capture_browser_state(browser_agent)
        
        snapshot = StateSnapshot(
            snapshot_id=snapshot_id,
            timestamp=datetime.now(),
            task_context=task_context,
            git_state=git_state,
            terminal_state=terminal_state,
            browser_state=browser_state,
            filesystem_state=filesystem_state,
            tags=tags or [],
            notes=notes,
        )
        
        # 保存快照
        await self._save_snapshot(snapshot)
        self.snapshots[snapshot_id] = snapshot
        
        return snapshot
    
    async def _capture_git_state(self) -> GitState:
        """捕获 Git 状态"""
        state = GitState()
        
        try:
            # 获取当前分支
            result = subprocess.run(
                ["git", "branch", "--show-current"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                state.branch = result.stdout.strip()
            
            # 获取最新 commit hash
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                state.commit_hash = result.stdout.strip()
            
            # 获取 diff
            result = subprocess.run(
                ["git", "diff"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                state.diff = result.stdout
            
            # 获取未跟踪文件
            result = subprocess.run(
                ["git", "ls-files", "--others", "--exclude-standard"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                state.untracked_files = [f.strip() for f in result.stdout.split("\n") if f.strip()]
        
        except Exception as e:
            state.branch = f"error: {e}"
        
        return state
    
    async def _capture_terminal_state(self) -> TerminalState:
        """捕获终端状态"""
        state = TerminalState()
        
        try:
            # 获取当前工作目录
            state.working_directory = os.getcwd()
            
            # 获取关键环境变量
            for key in ["PATH", "HOME", "USER", "VIRTUAL_ENV", "NODE_ENV"]:
                if key in os.environ:
                    state.environment_vars[key] = os.environ[key]
        
        except Exception as e:
            state.working_directory = f"error: {e}"
        
        return state
    
    async def _capture_browser_state(self, browser_agent) -> Optional[BrowserState]:
        """捕获浏览器状态"""
        state = BrowserState()
        
        try:
            # 获取当前 URL 和标题
            if hasattr(browser_agent, "get_current_url"):
                state.current_url = await browser_agent.get_current_url()
            
            if hasattr(browser_agent, "get_page_title"):
                state.page_title = await browser_agent.get_page_title()
            
            # 截图
            if hasattr(browser_agent, "screenshot"):
                screenshot_path = f"/tmp/maoai_screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                await browser_agent.screenshot(screenshot_path)
                state.screenshot_path = screenshot_path
                
                # 转换为 base64
                try:
                    with open(screenshot_path, "rb") as f:
                        state.screenshot_base64 = base64.b64encode(f.read()).decode("utf-8")
                except Exception:
                    pass
            
            # 获取可见元素
            if hasattr(browser_agent, "get_visible_elements"):
                state.visible_elements = await browser_agent.get_visible_elements()
            
            # 获取控制台日志
            if hasattr(browser_agent, "get_console_logs"):
                state.console_logs = await browser_agent.get_console_logs()
        
        except Exception as e:
            state.page_title = f"error: {e}"
        
        return state
    
    async def _capture_filesystem_state(self) -> FileSystemState:
        """捕获文件系统状态"""
        state = FileSystemState()
        
        try:
            # 获取 Git 状态中的文件变更
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                for line in result.stdout.split("\n"):
                    if not line.strip():
                        continue
                    
                    status = line[:2]
                    filepath = line[3:].strip()
                    
                    if status.startswith("M") or status.endswith("M"):
                        state.modified_files.append(filepath)
                    elif status.startswith("A") or status.endswith("A"):
                        state.new_files.append(filepath)
                    elif status.startswith("D") or status.endswith("D"):
                        state.deleted_files.append(filepath)
                    elif status.startswith("??"):
                        state.new_files.append(filepath)
        
        except Exception:
            pass
        
        return state
    
    async def _save_snapshot(self, snapshot: StateSnapshot):
        """保存快照到磁盘"""
        filepath = self.storage_dir / f"{snapshot.snapshot_id}.json"
        
        with open(filepath, "w") as f:
            json.dump(snapshot.to_dict(), f, indent=2, ensure_ascii=False)
    
    def _generate_snapshot_id(self, task_id: str) -> str:
        """生成快照 ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        hash_input = f"{task_id}_{timestamp}_{len(self.snapshots)}"
        hash_suffix = hashlib.md5(hash_input.encode()).hexdigest()[:8]
        return f"{task_id}_{timestamp}_{hash_suffix}"
    
    async def restore(self, snapshot_id: str) -> Optional[StateSnapshot]:
        """
        从快照恢复状态
        
        注意：这只会恢复上下文信息，不会自动恢复物理环境
        物理环境的恢复需要额外的逻辑
        """
        if snapshot_id in self.snapshots and self.snapshots[snapshot_id]:
            return self.snapshots[snapshot_id]
        
        # 从磁盘加载
        filepath = self.storage_dir / f"{snapshot_id}.json"
        if not filepath.exists():
            return None
        
        try:
            with open(filepath, "r") as f:
                data = json.load(f)
            
            # 重建对象（简化版）
            task_context = TaskContext(**data.get("task_context", {}))
            git_state = GitState(**data.get("git_state", {}))
            terminal_state = TerminalState(**data.get("terminal_state", {}))
            filesystem_state = FileSystemState(**data.get("filesystem_state", {}))
            
            browser_data = data.get("browser_state")
            browser_state = BrowserState(**browser_data) if browser_data else None
            
            snapshot = StateSnapshot(
                snapshot_id=data["snapshot_id"],
                timestamp=datetime.fromisoformat(data["timestamp"]),
                task_context=task_context,
                git_state=git_state,
                terminal_state=terminal_state,
                browser_state=browser_state,
                filesystem_state=filesystem_state,
                tags=data.get("tags", []),
                notes=data.get("notes", ""),
            )
            
            self.snapshots[snapshot_id] = snapshot
            return snapshot
        
        except Exception as e:
            print(f"恢复快照失败: {e}")
            return None
    
    def get_latest_snapshot(self, task_id: Optional[str] = None) -> Optional[StateSnapshot]:
        """获取最新的快照"""
        matching = []
        for snapshot_id, snapshot in self.snapshots.items():
            if snapshot and (task_id is None or snapshot.task_context.task_id == task_id):
                matching.append(snapshot)
        
        if not matching:
            return None
        
        return max(matching, key=lambda s: s.timestamp)
    
    def list_snapshots(self, task_id: Optional[str] = None) -> List[Dict]:
        """列出所有快照"""
        result = []
        for snapshot_id, snapshot in self.snapshots.items():
            if snapshot and (task_id is None or snapshot.task_context.task_id == task_id):
                result.append(snapshot.to_dict())
        
        return sorted(result, key=lambda x: x["timestamp"], reverse=True)
    
    def clear_old_snapshots(self, keep_count: int = 10):
        """清理旧快照"""
        all_snapshots = sorted(
            self.snapshots.items(),
            key=lambda x: x[1].timestamp if x[1] else datetime.min,
            reverse=True
        )
        
        for snapshot_id, _ in all_snapshots[keep_count:]:
            filepath = self.storage_dir / f"{snapshot_id}.json"
            if filepath.exists():
                filepath.unlink()
            del self.snapshots[snapshot_id]


class ResumeManager:
    """
    断点续传管理器
    
    处理进程崩溃后的状态恢复
    """
    
    def __init__(self, snapshot_manager: StateSnapshotManager):
        self.snapshot_manager = snapshot_manager
        self._recovery_callbacks: List[Callable[[StateSnapshot], Any]] = []
    
    def on_recovery(self, callback: Callable[[StateSnapshot], Any]):
        """注册恢复回调"""
        self._recovery_callbacks.append(callback)
    
    async def check_and_resume(self, task_id: Optional[str] = None) -> Optional[StateSnapshot]:
        """
        检查并恢复之前的任务
        
        Returns:
            如果有可恢复的状态，返回快照；否则返回 None
        """
        latest = self.snapshot_manager.get_latest_snapshot(task_id)
        
        if not latest:
            return None
        
        # 检查快照是否足够新（1小时内）
        time_diff = (datetime.now() - latest.timestamp).total_seconds()
        if time_diff > 3600:  # 1小时
            return None
        
        # 触发恢复回调
        for callback in self._recovery_callbacks:
            try:
                callback(latest)
            except Exception:
                pass
        
        return latest
    
    def generate_recovery_prompt(self, snapshot: StateSnapshot) -> str:
        """生成恢复提示词"""
        return f"""
⚠️ **断点续传模式激活**

检测到之前的任务被中断，正在从断点恢复...

{snapshot.get_summary()}

---

**恢复指令：**
1. 首先检查当前物理环境是否与快照一致
2. 确认 Git 状态：分支 {snapshot.git_state.branch}，commit {snapshot.git_state.commit_hash[:8]}
3. 检查未完成的变更：{len(snapshot.git_state.diff)} 字符的 diff
4. 回顾关键决策和待解决问题
5. 从中断的阶段继续执行

**注意：** 不要重复已经完成的步骤，专注于推进任务。
"""


# ───────────────────────────────────────────────────────────────────────────────
# 全局实例
# ───────────────────────────────────────────────────────────────────────────────

_snapshot_manager: Optional[StateSnapshotManager] = None


def get_snapshot_manager() -> StateSnapshotManager:
    """获取全局快照管理器"""
    global _snapshot_manager
    if _snapshot_manager is None:
        _snapshot_manager = StateSnapshotManager()
    return _snapshot_manager


# ───────────────────────────────────────────────────────────────────────────────
# 测试
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test_state_snapshot():
        print("=" * 60)
        print("StateSnapshot 测试")
        print("=" * 60)
        
        manager = StateSnapshotManager()
        
        # 创建任务上下文
        task_context = TaskContext(
            task_id="test_task_001",
            goal="实现一个快速排序算法",
            current_phase="coder",
            iteration=2,
            key_decisions=["使用递归实现", "选择最后一个元素作为 pivot"],
            open_issues=["需要处理重复元素的情况"],
        )
        
        # 捕获快照
        print("\n📸 捕获状态快照...")
        snapshot = await manager.capture(
            task_context=task_context,
            capture_browser=False,
            tags=["test", "quicksort"],
            notes="第二轮迭代后的状态",
        )
        
        print(f"✅ 快照已保存: {snapshot.snapshot_id}")
        
        # 显示摘要
        print("\n" + "=" * 60)
        print("状态摘要:")
        print("=" * 60)
        print(snapshot.get_summary())
        
        # 测试恢复
        print("\n" + "=" * 60)
        print("测试恢复...")
        print("=" * 60)
        
        resume_manager = ResumeManager(manager)
        recovered = await resume_manager.check_and_resume("test_task_001")
        
        if recovered:
            print("✅ 找到可恢复的状态")
            print(f"   时间: {recovered.timestamp}")
            print(f"   阶段: {recovered.task_context.current_phase}")
            
            # 生成恢复提示词
            print("\n📝 恢复提示词:")
            print(resume_manager.generate_recovery_prompt(recovered))
        else:
            print("❌ 没有可恢复的状态")
    
    asyncio.run(test_state_snapshot())
