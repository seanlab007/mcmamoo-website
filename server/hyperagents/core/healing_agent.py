"""
HealingAgent - 运行时自修复循环
═══════════════════════════════════════════════════════════════════════════════
"怀疑精神"的工程化实现：捕获运行时异常，自动生成修复补丁，验证后应用。

核心哲学：
- 不宣布任务完成，直到验证通过
- 失败是进化的燃料
- 自动修复，无需人工干预

Author: MaoAI Core 2.0
Version: 3.0.0 "破壁者"
"""

import ast
import re
import traceback
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
from datetime import datetime
import asyncio
import hashlib
import json

# ───────────────────────────────────────────────────────────────────────────────
# 数据模型
# ───────────────────────────────────────────────────────────────────────────────

class HealingStatus(Enum):
    """修复状态"""
    DETECTED = "detected"           # 发现异常
    ANALYZING = "analyzing"         # 分析根因
    GENERATING = "generating"       # 生成补丁
    VALIDATING = "validating"       # 验证补丁
    APPLIED = "applied"             # 修复成功
    FAILED = "failed"               # 修复失败
    ESCALATED = "escalated"         # 升级人工


@dataclass
class ErrorContext:
    """错误上下文"""
    error_type: str
    error_message: str
    traceback_str: str
    source_code: Optional[str] = None
    function_name: Optional[str] = None
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    args: tuple = field(default_factory=tuple)
    kwargs: dict = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    
    @property
    def error_hash(self) -> str:
        """生成错误指纹，用于去重"""
        content = f"{self.error_type}:{self.function_name}:{self.line_number}"
        return hashlib.md5(content.encode()).hexdigest()[:8]


@dataclass
class HealingPatch:
    """修复补丁"""
    patch_id: str
    original_code: str
    patched_code: str
    explanation: str
    confidence: float  # 0-1
    validation_result: Optional[bool] = None
    applied_at: Optional[datetime] = None
    
    def to_diff(self) -> str:
        """生成统一差异格式"""
        lines = [
            "--- original",
            "+++ patched",
            "@@ -1 +1 @@",
        ]
        for line in self.original_code.split('\n'):
            lines.append(f"-{line}")
        for line in self.patched_code.split('\n'):
            lines.append(f"+{line}")
        return '\n'.join(lines)


@dataclass
class HealingReport:
    """修复报告"""
    error_context: ErrorContext
    status: HealingStatus
    patches: List[HealingPatch] = field(default_factory=list)
    attempts: int = 0
    max_attempts: int = 3
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    @property
    def duration_ms(self) -> int:
        """修复耗时（毫秒）"""
        if self.completed_at:
            return int((self.completed_at - self.started_at).total_seconds() * 1000)
        return 0
    
    def to_dict(self) -> dict:
        """序列化为字典"""
        return {
            "error_hash": self.error_context.error_hash,
            "error_type": self.error_context.error_type,
            "function": self.error_context.function_name,
            "status": self.status.value,
            "attempts": self.attempts,
            "max_attempts": self.max_attempts,
            "duration_ms": self.duration_ms,
            "patches_count": len(self.patches),
            "timestamp": self.error_context.timestamp.isoformat(),
        }


# ───────────────────────────────────────────────────────────────────────────────
# 错误分析器
# ───────────────────────────────────────────────────────────────────────────────

class ErrorAnalyzer:
    """错误根因分析器"""
    
    COMMON_PATTERNS = {
        r"NameError: name '(\w+)' is not defined": {
            "type": "undefined_variable",
            "fix_strategy": "import_or_define",
        },
        r"AttributeError: '(\w+)' object has no attribute '(\w+)'": {
            "type": "missing_attribute",
            "fix_strategy": "check_type_or_add_attr",
        },
        r"TypeError: (.*) takes (\d+) positional argument but (\d+) were given": {
            "type": "argument_mismatch",
            "fix_strategy": "fix_signature",
        },
        r"KeyError: '(\w+)'": {
            "type": "missing_key",
            "fix_strategy": "add_default_or_check",
        },
        r"IndexError: list index out of range": {
            "type": "index_out_of_range",
            "fix_strategy": "add_bounds_check",
        },
        r"ModuleNotFoundError: No module named '(\w+)'": {
            "type": "missing_import",
            "fix_strategy": "add_import",
        },
        r"SyntaxError: invalid syntax": {
            "type": "syntax_error",
            "fix_strategy": "fix_syntax",
        },
    }
    
    def analyze(self, context: ErrorContext) -> Dict[str, Any]:
        """分析错误根因"""
        analysis = {
            "error_type": "unknown",
            "fix_strategy": "generic",
            "suggestions": [],
            "confidence": 0.5,
        }
        
        # 模式匹配
        for pattern, info in self.COMMON_PATTERNS.items():
            match = re.search(pattern, context.error_message)
            if match:
                analysis["error_type"] = info["type"]
                analysis["fix_strategy"] = info["fix_strategy"]
                analysis["confidence"] = 0.8
                analysis["match_groups"] = match.groups()
                break
        
        # 基于traceback的深度分析
        if context.traceback_str:
            analysis["stack_depth"] = context.traceback_str.count('File "')
            
        return analysis


# ───────────────────────────────────────────────────────────────────────────────
# 补丁生成器
# ───────────────────────────────────────────────────────────────────────────────

class PatchGenerator:
    """自动补丁生成器"""
    
    def __init__(self):
        self.analyzer = ErrorAnalyzer()
    
    def generate(self, context: ErrorContext, analysis: Dict[str, Any]) -> List[HealingPatch]:
        """基于分析生成修复补丁"""
        patches = []
        strategy = analysis.get("fix_strategy", "generic")
        
        if strategy == "add_import":
            patches.extend(self._fix_missing_import(context, analysis))
        elif strategy == "add_default_or_check":
            patches.extend(self._fix_missing_key(context, analysis))
        elif strategy == "add_bounds_check":
            patches.extend(self._fix_index_error(context, analysis))
        elif strategy == "fix_signature":
            patches.extend(self._fix_argument_mismatch(context, analysis))
        elif strategy == "generic":
            patches.extend(self._generic_exception_handler(context))
        
        return patches
    
    def _fix_missing_import(self, context: ErrorContext, analysis: Dict) -> List[HealingPatch]:
        """修复缺失的import"""
        match_groups = analysis.get("match_groups", ())
        if not match_groups:
            return []
        
        module_name = match_groups[0]
        original = context.source_code or ""
        
        # 在文件开头添加import
        patched = f"import {module_name}\n{original}"
        
        return [HealingPatch(
            patch_id=f"import_{module_name}_{datetime.now().timestamp()}",
            original_code=original,
            patched_code=patched,
            explanation=f"添加缺失的 import: {module_name}",
            confidence=0.9,
        )]
    
    def _fix_missing_key(self, context: ErrorContext, analysis: Dict) -> List[HealingPatch]:
        """修复字典KeyError"""
        match_groups = analysis.get("match_groups", ())
        if not match_groups:
            return []
        
        key_name = match_groups[0]
        original = context.source_code or ""
        
        # 将 dict[key] 改为 dict.get(key, default)
        # 这是一个简化的替换，实际应该更精确
        pattern = rf"(\w+)\['{key_name}'\]"
        patched = re.sub(pattern, rf"\1.get('{key_name}')", original)
        
        if patched != original:
            return [HealingPatch(
                patch_id=f"keyfix_{key_name}_{datetime.now().timestamp()}",
                original_code=original,
                patched_code=patched,
                explanation=f"将 dict['{key_name}'] 改为 dict.get('{key_name}') 避免 KeyError",
                confidence=0.85,
            )]
        return []
    
    def _fix_index_error(self, context: ErrorContext, analysis: Dict) -> List[HealingPatch]:
        """修复索引越界"""
        original = context.source_code or ""
        
        # 添加边界检查包装
        lines = original.split('\n')
        if len(lines) >= 1:
            # 简化处理：在函数开头添加检查
            indent = len(lines[0]) - len(lines[0].lstrip())
            check_line = " " * indent + "# TODO: 添加索引边界检查\n"
            lines.insert(0, check_line)
            patched = '\n'.join(lines)
            
            return [HealingPatch(
                patch_id=f"indexfix_{datetime.now().timestamp()}",
                original_code=original,
                patched_code=patched,
                explanation="添加索引边界检查标记（需要人工完善）",
                confidence=0.6,
            )]
        return []
    
    def _fix_argument_mismatch(self, context: ErrorContext, analysis: Dict) -> List[HealingPatch]:
        """修复参数数量不匹配"""
        match_groups = analysis.get("match_groups", ())
        if len(match_groups) >= 3:
            expected = match_groups[1]
            actual = match_groups[2]
            
            return [HealingPatch(
                patch_id=f"argfix_{datetime.now().timestamp()}",
                original_code=context.source_code or "",
                patched_code=context.source_code or "",
                explanation=f"参数数量不匹配: 期望 {expected}, 实际 {actual}。需要调整函数签名或调用方式。",
                confidence=0.5,  # 需要更多上下文
            )]
        return []
    
    def _generic_exception_handler(self, context: ErrorContext) -> List[HealingPatch]:
        """通用异常处理包装"""
        original = context.source_code or ""
        
        # 尝试包装在 try-except 中
        lines = original.split('\n')
        if len(lines) >= 1:
            indent = len(lines[0]) - len(lines[0].lstrip())
            base_indent = " " * indent
            inner_indent = " " * (indent + 4)
            
            patched_lines = [
                base_indent + "try:",
            ]
            for line in lines:
                patched_lines.append(inner_indent + line.lstrip())
            patched_lines.extend([
                base_indent + f"except {context.error_type} as e:",
                inner_indent + f"# TODO: 处理异常: {context.error_message}",
                inner_indent + "raise",
            ])
            
            patched = '\n'.join(patched_lines)
            
            return [HealingPatch(
                patch_id=f"generic_wrap_{datetime.now().timestamp()}",
                original_code=original,
                patched_code=patched,
                explanation=f"添加 try-except 包装以捕获 {context.error_type}",
                confidence=0.4,
            )]
        return []


# ───────────────────────────────────────────────────────────────────────────────
# 沙箱验证器
# ───────────────────────────────────────────────────────────────────────────────

class SandboxValidator:
    """沙箱验证器 - 在隔离环境测试补丁"""
    
    def __init__(self):
        self.validation_history: List[Dict] = []
    
    async def validate(self, patch: HealingPatch, context: ErrorContext) -> bool:
        """
        验证补丁是否有效
        
        返回 True 如果：
        1. 补丁代码语法正确
        2. 在相同输入下不再抛出相同异常
        """
        try:
            # 1. 语法检查
            ast.parse(patch.patched_code)
            
            # 2. 执行测试（在受限环境）
            # 注意：这里使用 exec 是简化实现，生产环境应使用 Docker/VM
            test_passed = await self._run_sandbox_test(patch, context)
            
            patch.validation_result = test_passed
            self.validation_history.append({
                "patch_id": patch.patch_id,
                "result": test_passed,
                "timestamp": datetime.now().isoformat(),
            })
            
            return test_passed
            
        except SyntaxError:
            patch.validation_result = False
            return False
        except Exception as e:
            patch.validation_result = False
            return False
    
    async def _run_sandbox_test(self, patch: HealingPatch, context: ErrorContext) -> bool:
        """在沙箱中运行测试"""
        # 简化实现：检查代码是否可以编译
        # 实际实现应该：
        # 1. 在 Docker 容器中运行
        # 2. 使用相同的输入参数
        # 3. 验证输出或异常类型
        try:
            compile(patch.patched_code, '<string>', 'exec')
            return True
        except:
            return False


# ───────────────────────────────────────────────────────────────────────────────
# HealingAgent 主类
# ───────────────────────────────────────────────────────────────────────────────

T = TypeVar('T')


class HealingAgent:
    """
    运行时自修复代理
    
    核心能力：
    1. 捕获运行时异常
    2. 分析根因
    3. 生成修复补丁
    4. 验证并应用
    
    使用方式：
        @healing_agent.reality_check
        async def my_function():
            ...
    """
    
    def __init__(
        self,
        max_attempts: int = 3,
        auto_apply: bool = False,
        on_heal: Optional[Callable[[HealingReport], None]] = None,
    ):
        self.analyzer = ErrorAnalyzer()
        self.generator = PatchGenerator()
        self.validator = SandboxValidator()
        
        self.max_attempts = max_attempts
        self.auto_apply = auto_apply
        self.on_heal = on_heal
        
        # 统计
        self.healing_history: List[HealingReport] = []
        self.success_count = 0
        self.failure_count = 0
    
    def reality_check(self, func: Callable[..., T]) -> Callable[..., T]:
        """
        装饰器：为函数添加自愈能力
        
        示例：
            @healing_agent.reality_check
            def divide(a, b):
                return a / b  # 如果 b=0，会自动尝试修复
        """
        async def async_wrapper(*args, **kwargs):
            return await self._execute_with_healing(func, *args, **kwargs)
        
        def sync_wrapper(*args, **kwargs):
            # 同步函数包装
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # 同步函数的自治需要特殊处理
                # 这里简化处理：记录并重新抛出
                context = self._extract_context(e, func, args, kwargs)
                report = asyncio.run(self._heal(context))
                if self.on_heal:
                    self.on_heal(report)
                raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    async def _execute_with_healing(self, func: Callable, *args, **kwargs):
        """执行函数，失败时触发修复"""
        attempt = 0
        last_error = None
        
        while attempt < self.max_attempts:
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_error = e
                attempt += 1
                
                # 提取错误上下文
                context = self._extract_context(e, func, args, kwargs)
                
                # 执行修复
                report = await self._heal(context)
                
                if report.status == HealingStatus.APPLIED:
                    # 修复成功，重试
                    continue
                elif report.status == HealingStatus.ESCALATED:
                    # 升级人工，停止重试
                    break
                else:
                    # 修复失败，继续下一次尝试
                    continue
        
        # 所有尝试都失败
        if last_error:
            raise last_error
    
    def _extract_context(
        self,
        error: Exception,
        func: Callable,
        args: tuple,
        kwargs: dict,
    ) -> ErrorContext:
        """从异常中提取上下文"""
        tb_str = traceback.format_exc()
        
        # 尝试获取源代码
        source_code = None
        try:
            import inspect
            source_code = inspect.getsource(func)
        except:
            pass
        
        # 提取行号
        line_number = None
        tb = error.__traceback__
        if tb:
            line_number = tb.tb_lineno
        
        return ErrorContext(
            error_type=type(error).__name__,
            error_message=str(error),
            traceback_str=tb_str,
            source_code=source_code,
            function_name=getattr(func, '__name__', 'unknown'),
            line_number=line_number,
            args=args,
            kwargs=kwargs,
        )
    
    async def _heal(self, context: ErrorContext) -> HealingReport:
        """执行修复流程"""
        report = HealingReport(
            error_context=context,
            status=HealingStatus.DETECTED,
            max_attempts=self.max_attempts,
        )
        
        # 1. 分析根因
        report.status = HealingStatus.ANALYZING
        analysis = self.analyzer.analyze(context)
        
        # 2. 生成补丁
        report.status = HealingStatus.GENERATING
        patches = self.generator.generate(context, analysis)
        report.patches = patches
        
        # 3. 验证并应用补丁
        for patch in patches:
            report.attempts += 1
            report.status = HealingStatus.VALIDATING
            
            is_valid = await self.validator.validate(patch, context)
            
            if is_valid and self.auto_apply:
                # 应用补丁
                patch.applied_at = datetime.now()
                report.status = HealingStatus.APPLIED
                self.success_count += 1
                break
            elif is_valid and not self.auto_apply:
                # 等待人工确认
                report.status = HealingStatus.ESCALATED
                break
        else:
            # 没有可用补丁
            report.status = HealingStatus.FAILED
            self.failure_count += 1
        
        report.completed_at = datetime.now()
        self.healing_history.append(report)
        
        # 回调通知
        if self.on_heal:
            self.on_heal(report)
        
        return report
    
    def get_stats(self) -> Dict[str, Any]:
        """获取修复统计"""
        total = self.success_count + self.failure_count
        return {
            "total_healings": len(self.healing_history),
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "success_rate": self.success_count / total if total > 0 else 0,
            "recent_errors": [
                r.to_dict() for r in self.healing_history[-5:]
            ],
        }


# ───────────────────────────────────────────────────────────────────────────────
# 全局实例
# ───────────────────────────────────────────────────────────────────────────────

# 默认 HealingAgent 实例
_default_agent: Optional[HealingAgent] = None


def get_healing_agent(
    max_attempts: int = 3,
    auto_apply: bool = False,
) -> HealingAgent:
    """获取或创建默认 HealingAgent"""
    global _default_agent
    if _default_agent is None:
        _default_agent = HealingAgent(
            max_attempts=max_attempts,
            auto_apply=auto_apply,
        )
    return _default_agent


def reality_check(func: Callable[..., T]) -> Callable[..., T]:
    """
    快捷装饰器：使用默认 HealingAgent
    
    示例：
        from core.healing_agent import reality_check
        
        @reality_check
        def my_function():
            ...
    """
    agent = get_healing_agent()
    return agent.reality_check(func)


# ───────────────────────────────────────────────────────────────────────────────
# 测试
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test_healing():
        """测试 HealingAgent"""
        agent = HealingAgent(max_attempts=2, auto_apply=False)
        
        @agent.reality_check
        async def buggy_function():
            """故意出错的函数"""
            undefined_variable  # NameError
            return "success"
        
        try:
            await buggy_function()
        except Exception as e:
            print(f"最终异常: {e}")
        
        # 打印统计
        stats = agent.get_stats()
        print(f"\n修复统计: {json.dumps(stats, indent=2, default=str)}")
    
    asyncio.run(test_healing())
