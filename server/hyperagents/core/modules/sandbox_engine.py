"""
SandboxEngine - 云端实验室：Docker/Subprocess隔离执行环境
支持：代码执行、测试运行、临时文件管理
"""

import asyncio
import subprocess
import tempfile
import os
import shutil
import json
import uuid
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pathlib import Path
import hashlib

@dataclass
class SandboxTask:
    """沙箱任务定义"""
    code: str
    language: str  # python, javascript, bash
    timeout: int = 60
    dependencies: List[str] = None
    stdin: str = ""
    work_dir: Optional[str] = None

@dataclass
class SandboxResult:
    """沙箱执行结果"""
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float
    error: Optional[str] = None

class SandboxEngine:
    """
    隔离执行引擎 - 代码编写-测试-部署流水线
    
    能力:
    - 多语言执行: Python, JavaScript, Bash
    - 依赖管理: 自动安装依赖包
    - 超时控制: 防止无限循环
    - 临时隔离: 独立工作目录
    - 结果复用: 缓存常用执行结果
    """
    
    def __init__(self, base_dir: str = None):
        self.base_dir = base_dir or tempfile.mkdtemp(prefix="maoai_sandbox_")
        self.cache = {}
        print(f"✅ SandboxEngine 初始化: {self.base_dir}")
    
    def _get_cache_key(self, task: SandboxTask) -> str:
        content = f"{task.language}:{task.code}:{tuple(task.dependencies or [])}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def run(self, task: SandboxTask) -> SandboxResult:
        import time
        start_time = time.time()
        
        cache_key = self._get_cache_key(task)
        if cache_key in self.cache:
            print(f"📦 使用缓存结果")
            return self.cache[cache_key]
        
        try:
            work_id = str(uuid.uuid4())[:8]
            work_dir = os.path.join(self.base_dir, f"task_{work_id}")
            os.makedirs(work_dir, exist_ok=True)
            
            if task.language == "python":
                result = await self._run_python(task, work_dir)
            elif task.language == "javascript":
                result = await self._run_javascript(task, work_dir)
            elif task.language == "bash":
                result = await self._run_bash(task, work_dir)
            else:
                result = SandboxResult(success=False, stdout="", stderr=f"不支持: {task.language}", exit_code=-1, execution_time=0)
            
            result.execution_time = time.time() - start_time
            self.cache[cache_key] = result
            shutil.rmtree(work_dir, ignore_errors=True)
            return result
            
        except asyncio.TimeoutError:
            return SandboxResult(success=False, stdout="", stderr="执行超时", exit_code=-1, execution_time=time.time()-start_time, error="Timeout")
        except Exception as e:
            return SandboxResult(success=False, stdout="", stderr=str(e), exit_code=-1, execution_time=time.time()-start_time, error=str(e))
    
    async def _run_python(self, task: SandboxTask, work_dir: str) -> SandboxResult:
        code_file = os.path.join(work_dir, "main.py")
        with open(code_file, "w") as f:
            f.write(task.code)
        
        if task.dependencies:
            for dep in task.dependencies:
                subprocess.run(["pip3", "install", dep, "--quiet", "--break-system-packages"], 
                             capture_output=True, timeout=60)
        
        cmd = ["python3", code_file]
        process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=task.timeout)
        
        return SandboxResult(success=process.returncode == 0, stdout=stdout.decode(), stderr=stderr.decode(), exit_code=process.returncode)
    
    async def _run_javascript(self, task: SandboxTask, work_dir: str) -> SandboxResult:
        code_file = os.path.join(work_dir, "main.js")
        with open(code_file, "w") as f:
            f.write(task.code)
        process = await asyncio.create_subprocess_exec("node", code_file, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=task.timeout)
        return SandboxResult(success=process.returncode == 0, stdout=stdout.decode(), stderr=stderr.decode(), exit_code=process.returncode)
    
    async def _run_bash(self, task: SandboxTask, work_dir: str) -> SandboxResult:
        process = await asyncio.create_subprocess_exec("bash", "-c", task.code, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=task.timeout)
        return SandboxResult(success=process.returncode == 0, stdout=stdout.decode(), stderr=stderr.decode(), exit_code=process.returncode)
    
    def clear_cache(self):
        self.cache.clear()
    
    def cleanup(self):
        shutil.rmtree(self.base_dir, ignore_errors=True)


# 工具注册表
TOOL_REGISTRY = {"browser": None, "sandbox": None}

def get_browser_agent():
    if TOOL_REGISTRY["browser"] is None:
        from .browser_agent import BrowserAgent
        TOOL_REGISTRY["browser"] = BrowserAgent()
    return TOOL_REGISTRY["browser"]

def get_sandbox_engine():
    if TOOL_REGISTRY["sandbox"] is None:
        TOOL_REGISTRY["sandbox"] = SandboxEngine()
    return TOOL_REGISTRY["sandbox"]


if __name__ == "__main__":
    async def test():
        print("=== SandboxEngine 测试 ===\n")
        engine = SandboxEngine()
        
        print("[测试1] Python代码...")
        result = await engine.run(SandboxTask(code="print('Hello!')\nprint(2**10)", language="python"))
        print(f"结果: {result.stdout.strip()}")
        
        print("\n[测试2] Bash命令...")
        result = await engine.run(SandboxTask(code="echo $USER && pwd", language="bash"))
        print(f"结果: {result.stdout.strip()}")
        
        engine.cleanup()
        print("\n✅ SandboxEngine 测试完成!")
    
    asyncio.run(test())
