"""
SkillRegistry - 进化技能系统
═══════════════════════════════════════════════════════════════════════════════
"技能实验室"的核心实现：动态加载、卸载、自动蒸馏开源技能。

核心哲学：
- 核心保持轻盈，能力通过技能扩展
- 技能即插件，热插拔
- 自动从开源项目蒸馏新技能

Author: MaoAI Core 2.0
Version: 3.0.0 "破壁者"
"""

import ast
import hashlib
import importlib
import importlib.util
import inspect
import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Protocol, Type, Union
import asyncio
import aiohttp


# ───────────────────────────────────────────────────────────────────────────────
# 数据模型
# ───────────────────────────────────────────────────────────────────────────────

class SkillStatus(Enum):
    """技能状态"""
    REGISTERED = "registered"       # 已注册
    LOADED = "loaded"               # 已加载
    ACTIVE = "active"               # 运行中
    ERROR = "error"                 # 错误
    DISABLED = "disabled"           # 已禁用


class SkillSource(Enum):
    """技能来源"""
    BUILTIN = "builtin"             # 内置
    MANUAL = "manual"               # 手动编写
    DISTILLED = "distilled"         # 自动蒸馏
    MARKETPLACE = "marketplace"     # 市场下载


@dataclass
class SkillManifest:
    """技能清单"""
    skill_id: str
    name: str
    version: str
    description: str
    author: str
    source: SkillSource
    entry_point: str                # 入口函数/类
    dependencies: List[str] = field(default_factory=list)
    permissions: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    
    # 元数据
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    usage_count: int = 0
    success_rate: float = 1.0
    
    @property
    def skill_hash(self) -> str:
        """技能指纹"""
        content = f"{self.name}:{self.version}:{self.author}"
        return hashlib.md5(content.encode()).hexdigest()[:8]


@dataclass
class SkillInstance:
    """技能实例"""
    manifest: SkillManifest
    module: Any                     # 加载的模块
    instance: Any                   # 实例化对象
    status: SkillStatus = SkillStatus.REGISTERED
    error_message: Optional[str] = None
    loaded_at: Optional[datetime] = None


# ───────────────────────────────────────────────────────────────────────────────
# 技能接口协议
# ───────────────────────────────────────────────────────────────────────────────

class SkillProtocol(Protocol):
    """技能必须实现的接口"""
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """执行技能任务"""
        ...
    
    async def health_check(self) -> bool:
        """健康检查"""
        ...
    
    def get_manifest(self) -> SkillManifest:
        """获取技能清单"""
        ...


# ───────────────────────────────────────────────────────────────────────────────
# 技能注册表
# ───────────────────────────────────────────────────────────────────────────────

class SkillRegistry:
    """
    技能注册表 - 进化技能系统的核心
    
    功能：
    1. 注册/加载/卸载技能
    2. 技能发现与匹配
    3. 自动蒸馏开源项目
    4. 技能依赖管理
    
    使用方式：
        registry = SkillRegistry()
        
        # 注册内置技能
        registry.register_builtin("browser_use", BrowserUseSkill())
        
        # 动态加载技能文件
        registry.load_from_file("skills/my_skill.py")
        
        # 执行技能
        result = await registry.execute("browser_use", {"url": "https://example.com"})
    """
    
    def __init__(self, skills_dir: Optional[str] = None):
        self.skills_dir = skills_dir or os.path.join(
            os.path.dirname(__file__), "..", "skills"
        )
        self.skills: Dict[str, SkillInstance] = {}
        self.builtin_skills: Dict[str, Type] = {}
        
        # 统计
        self.load_history: List[Dict] = []
        self.distillation_queue: List[Dict] = []
    
    # ───────────────────────────────────────────────────────────────────────────
    # 注册与加载
    # ───────────────────────────────────────────────────────────────────────────
    
    def register_builtin(self, skill_id: str, skill_class: Type):
        """注册内置技能类"""
        self.builtin_skills[skill_id] = skill_class
        
        # 创建 manifest
        manifest = SkillManifest(
            skill_id=skill_id,
            name=skill_class.__name__,
            version="1.0.0",
            description=skill_class.__doc__ or "",
            author="MaoAI",
            source=SkillSource.BUILTIN,
            entry_point=skill_class.__name__,
        )
        
        instance = SkillInstance(
            manifest=manifest,
            module=None,
            instance=None,
            status=SkillStatus.REGISTERED,
        )
        
        self.skills[skill_id] = instance
    
    def load(self, skill_id: str) -> bool:
        """加载技能"""
        if skill_id not in self.skills:
            return False
        
        skill = self.skills[skill_id]
        
        try:
            if skill.manifest.source == SkillSource.BUILTIN:
                # 实例化内置技能
                skill_class = self.builtin_skills[skill_id]
                skill.instance = skill_class()
            else:
                # 动态加载模块
                if skill.module is None:
                    return False
                
                entry_class = getattr(skill.module, skill.manifest.entry_point)
                skill.instance = entry_class()
            
            skill.status = SkillStatus.LOADED
            skill.loaded_at = datetime.now()
            
            # 健康检查
            if asyncio.iscoroutinefunction(skill.instance.health_check):
                asyncio.create_task(skill.instance.health_check())
            
            self.load_history.append({
                "skill_id": skill_id,
                "action": "load",
                "status": "success",
                "timestamp": datetime.now().isoformat(),
            })
            
            return True
            
        except Exception as e:
            skill.status = SkillStatus.ERROR
            skill.error_message = str(e)
            return False
    
    def unload(self, skill_id: str) -> bool:
        """卸载技能"""
        if skill_id not in self.skills:
            return False
        
        skill = self.skills[skill_id]
        skill.instance = None
        skill.status = SkillStatus.DISABLED
        
        self.load_history.append({
            "skill_id": skill_id,
            "action": "unload",
            "timestamp": datetime.now().isoformat(),
        })
        
        return True
    
    def load_from_file(self, file_path: str) -> Optional[str]:
        """
        从文件加载技能
        
        返回 skill_id 如果成功
        """
        try:
            # 解析文件获取 manifest
            manifest = self._parse_manifest_from_file(file_path)
            
            # 动态加载模块
            spec = importlib.util.spec_from_file_location(
                manifest.skill_id, file_path
            )
            module = importlib.util.module_from_spec(spec)
            sys.modules[manifest.skill_id] = module
            spec.loader.exec_module(module)
            
            # 创建实例
            instance = SkillInstance(
                manifest=manifest,
                module=module,
                instance=None,
                status=SkillStatus.REGISTERED,
            )
            
            self.skills[manifest.skill_id] = instance
            
            # 自动加载
            self.load(manifest.skill_id)
            
            return manifest.skill_id
            
        except Exception as e:
            print(f"加载技能失败: {e}")
            return None
    
    def _parse_manifest_from_file(self, file_path: str) -> SkillManifest:
        """从文件解析技能清单"""
        with open(file_path, 'r') as f:
            content = f.read()
        
        # 尝试从 docstring 或 __manifest__ 变量解析
        manifest_data = {
            "skill_id": Path(file_path).stem,
            "name": Path(file_path).stem,
            "version": "1.0.0",
            "description": "",
            "author": "unknown",
            "source": SkillSource.MANUAL,
            "entry_point": "Skill",
        }
        
        # 查找 __manifest__ 变量
        match = re.search(r'__manifest__\s*=\s*(\{[^}]+\})', content, re.DOTALL)
        if match:
            try:
                manifest_data.update(eval(match.group(1)))
            except:
                pass
        
        return SkillManifest(**manifest_data)
    
    # ───────────────────────────────────────────────────────────────────────────
    # 执行
    # ───────────────────────────────────────────────────────────────────────────
    
    async def execute(self, skill_id: str, task: Dict[str, Any]) -> Dict[str, Any]:
        """执行技能任务"""
        if skill_id not in self.skills:
            return {
                "success": False,
                "error": f"Skill not found: {skill_id}",
            }
        
        skill = self.skills[skill_id]
        
        # 自动加载
        if skill.status != SkillStatus.LOADED and skill.status != SkillStatus.ACTIVE:
            if not self.load(skill_id):
                return {
                    "success": False,
                    "error": f"Failed to load skill: {skill_id}",
                }
        
        try:
            skill.status = SkillStatus.ACTIVE
            skill.manifest.usage_count += 1
            
            result = await skill.instance.execute(task)
            
            # 更新成功率
            if result.get("success"):
                skill.manifest.success_rate = (
                    skill.manifest.success_rate * (skill.manifest.usage_count - 1) + 1
                ) / skill.manifest.usage_count
            else:
                skill.manifest.success_rate = (
                    skill.manifest.success_rate * (skill.manifest.usage_count - 1)
                ) / skill.manifest.usage_count
            
            skill.status = SkillStatus.LOADED
            return result
            
        except Exception as e:
            skill.status = SkillStatus.ERROR
            skill.error_message = str(e)
            return {
                "success": False,
                "error": str(e),
            }
    
    def find_skill(self, capability: str) -> List[SkillManifest]:
        """根据能力描述查找技能"""
        matches = []
        
        for skill_id, instance in self.skills.items():
            manifest = instance.manifest
            
            # 匹配标签
            if capability.lower() in [t.lower() for t in manifest.tags]:
                matches.append(manifest)
                continue
            
            # 匹配描述
            if capability.lower() in manifest.description.lower():
                matches.append(manifest)
                continue
            
            # 匹配名称
            if capability.lower() in manifest.name.lower():
                matches.append(manifest)
        
        # 按成功率排序
        matches.sort(key=lambda m: m.success_rate, reverse=True)
        return matches
    
    # ───────────────────────────────────────────────────────────────────────────
    # 自动蒸馏
    # ───────────────────────────────────────────────────────────────────────────
    
    async def distill_from_github(
        self,
        repo_url: str,
        skill_name: Optional[str] = None,
    ) -> Optional[str]:
        """
        从 GitHub 仓库自动蒸馏技能
        
        流程：
        1. 获取仓库 README 和核心代码
        2. 分析核心功能
        3. 生成 MaoAI Skill 包装器
        4. 保存到 skills 目录
        """
        try:
            # 解析仓库信息
            match = re.match(r'https?://github\.com/([^/]+)/([^/]+)', repo_url)
            if not match:
                return None
            
            owner, repo = match.groups()
            skill_name = skill_name or repo.lower().replace('-', '_')
            
            # 添加到队列
            task = {
                "repo_url": repo_url,
                "owner": owner,
                "repo": repo,
                "skill_name": skill_name,
                "status": "queued",
                "queued_at": datetime.now().isoformat(),
            }
            self.distillation_queue.append(task)
            
            # 异步执行蒸馏
            asyncio.create_task(self._do_distill(task))
            
            return skill_name
            
        except Exception as e:
            print(f"蒸馏失败: {e}")
            return None
    
    async def _do_distill(self, task: Dict):
        """执行蒸馏"""
        task["status"] = "distilling"
        
        try:
            # 获取 README
            readme = await self._fetch_readme(task["owner"], task["repo"])
            
            # 生成技能代码
            skill_code = self._generate_skill_code(
                task["skill_name"],
                task["repo_url"],
                readme,
            )
            
            # 保存文件
            skill_path = os.path.join(self.skills_dir, f"{task['skill_name']}.py")
            os.makedirs(self.skills_dir, exist_ok=True)
            
            with open(skill_path, 'w') as f:
                f.write(skill_code)
            
            # 加载新技能
            self.load_from_file(skill_path)
            
            task["status"] = "completed"
            task["skill_path"] = skill_path
            
        except Exception as e:
            task["status"] = "failed"
            task["error"] = str(e)
    
    async def _fetch_readme(self, owner: str, repo: str) -> str:
        """获取 GitHub README"""
        url = f"https://raw.githubusercontent.com/{owner}/{repo}/main/README.md"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.text()
                
                # 尝试 master 分支
                url = f"https://raw.githubusercontent.com/{owner}/{repo}/master/README.md"
                async with session.get(url) as response:
                    if response.status == 200:
                        return await response.text()
                    return ""
    
    def _generate_skill_code(
        self,
        skill_name: str,
        repo_url: str,
        readme: str,
    ) -> str:
        """生成技能代码模板"""
        
        # 提取描述（前200字符）
        description = readme[:200].replace('"', '\\"').replace('\n', ' ')
        
        code = f'''"""
{skill_name} - 自动蒸馏技能
═══════════════════════════════════════════════════════════════════════════════
从 {repo_url} 自动蒸馏生成

{description}...

Auto-generated by MaoAI Skill Distiller
"""

from typing import Any, Dict
import asyncio

__manifest__ = {{
    "skill_id": "{skill_name}",
    "name": "{skill_name}",
    "version": "1.0.0",
    "description": "{description}...",
    "author": "Auto-Distilled",
    "source": "distilled",
    "entry_point": "{skill_name.title()}Skill",
    "tags": ["auto-generated"],
}}


class {skill_name.title()}Skill:
    """
    {skill_name} 技能实现
    """
    
    def __init__(self):
        self.name = "{skill_name}"
        self.source = "{repo_url}"
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行任务
        
        Args:
            task: 任务参数
            
        Returns:
            执行结果
        """
        # TODO: 实现具体逻辑
        # 参考: {repo_url}
        
        return {{
            "success": True,
            "message": "Skill executed (template)",
            "task": task,
        }}
    
    async def health_check(self) -> bool:
        """健康检查"""
        return True
    
    def get_manifest(self):
        """获取清单"""
        return __manifest__
'''
        return code
    
    # ───────────────────────────────────────────────────────────────────────────
    # 查询与统计
    # ───────────────────────────────────────────────────────────────────────────
    
    def list_skills(self) -> List[Dict]:
        """列出所有技能"""
        return [
            {
                "skill_id": skill_id,
                "name": instance.manifest.name,
                "version": instance.manifest.version,
                "status": instance.status.value,
                "source": instance.manifest.source.value,
                "usage_count": instance.manifest.usage_count,
                "success_rate": instance.manifest.success_rate,
            }
            for skill_id, instance in self.skills.items()
        ]
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        return {
            "total_skills": len(self.skills),
            "active_skills": sum(
                1 for s in self.skills.values()
                if s.status == SkillStatus.ACTIVE or s.status == SkillStatus.LOADED
            ),
            "builtin_skills": sum(
                1 for s in self.skills.values()
                if s.manifest.source == SkillSource.BUILTIN
            ),
            "distilled_skills": sum(
                1 for s in self.skills.values()
                if s.manifest.source == SkillSource.DISTILLED
            ),
            "distillation_queue": len(self.distillation_queue),
            "load_history": self.load_history[-10:],
        }


# ───────────────────────────────────────────────────────────────────────────────
# 全局实例
# ───────────────────────────────────────────────────────────────────────────────

_registry: Optional[SkillRegistry] = None


def get_skill_registry() -> SkillRegistry:
    """获取全局 SkillRegistry"""
    global _registry
    if _registry is None:
        _registry = SkillRegistry()
    return _registry


# ───────────────────────────────────────────────────────────────────────────────
# 测试
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test_registry():
        registry = SkillRegistry()
        
        # 测试内置技能注册
        class TestSkill:
            async def execute(self, task):
                return {"success": True, "result": "test"}
            async def health_check(self):
                return True
        
        registry.register_builtin("test", TestSkill)
        
        # 测试执行
        result = await registry.execute("test", {"input": "hello"})
        print(f"执行结果: {result}")
        
        # 测试统计
        print(f"统计: {json.dumps(registry.get_stats(), indent=2)}")
    
    asyncio.run(test_registry())
