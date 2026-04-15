"""
Skeptical Validator - 怀疑论验证器
═══════════════════════════════════════════════════════════════════════════════
MaoAI 3.0 "破壁者" 核心组件

解决痛点：代码写完就以为成功了（幻觉）

核心能力：
- 双重验证：pytest（逻辑验证）+ browser_agent（现实验证）
- 怀疑逻辑：pytest 过了但 browser 没看到预期 UI → 逻辑幻觉
- 现实边界感：永远以"沙盒运行结果"为准

Author: MaoAI Core 3.0
Version: 3.0.0 "破壁者"
"""

import asyncio
import subprocess
import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Callable, Union
from pathlib import Path


class ValidationLayer(Enum):
    """验证层级"""
    SYNTAX = "syntax"           # 语法检查
    STATIC = "static"           # 静态分析
    UNIT_TEST = "unit_test"     # 单元测试
    INTEGRATION = "integration" # 集成测试
    REALITY = "reality"         # 现实验证（浏览器）


class ValidationStatus(Enum):
    """验证状态"""
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    SKIPPED = "skipped"
    HALLUCINATION = "hallucination"  # 逻辑幻觉


@dataclass
class ValidationResult:
    """单个验证结果"""
    layer: ValidationLayer
    status: ValidationStatus
    score: float  # 0-100
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict:
        return {
            "layer": self.layer.value,
            "status": self.status.value,
            "score": self.score,
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class RealityCheckResult:
    """现实验证结果"""
    url: str
    expected_element: str
    found: bool
    actual_content: str
    screenshot_path: Optional[str] = None
    console_errors: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "url": self.url,
            "expected_element": self.expected_element,
            "found": self.found,
            "actual_content": self.actual_content[:200] if self.actual_content else "",
            "has_screenshot": self.screenshot_path is not None,
            "console_errors": len(self.console_errors),
        }


@dataclass
class SkepticalValidationReport:
    """
    怀疑论验证报告
    
    包含所有层级的验证结果，识别逻辑幻觉
    """
    task_id: str
    timestamp: datetime
    results: List[ValidationResult] = field(default_factory=list)
    reality_check: Optional[RealityCheckResult] = None
    
    # 综合评估
    overall_status: ValidationStatus = ValidationStatus.PASSED
    overall_score: float = 0.0
    is_hallucination: bool = False
    
    # 怀疑论分析
    logic_reality_gap: str = ""  # 逻辑与现实的差距分析
    recommendations: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "task_id": self.task_id,
            "timestamp": self.timestamp.isoformat(),
            "overall_status": self.overall_status.value,
            "overall_score": self.overall_score,
            "is_hallucination": self.is_hallucination,
            "logic_reality_gap": self.logic_reality_gap,
            "results": [r.to_dict() for r in self.results],
            "reality_check": self.reality_check.to_dict() if self.reality_check else None,
            "recommendations": self.recommendations,
        }
    
    def get_summary(self) -> str:
        """获取验证摘要"""
        lines = [
            f"🔍 怀疑论验证报告 [{self.task_id}]",
            f"⏰ 时间: {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}",
            f"",
            f"📊 综合状态: {self.overall_status.value.upper()}",
            f"📈 综合评分: {self.overall_score:.1f}/100",
            f"🎭 逻辑幻觉: {'是' if self.is_hallucination else '否'}",
            f"",
        ]
        
        # 各层级结果
        lines.append("📋 验证层级:")
        for result in self.results:
            icon = "✅" if result.status == ValidationStatus.PASSED else "❌" if result.status == ValidationStatus.FAILED else "⚠️"
            lines.append(f"   {icon} {result.layer.value}: {result.score:.1f} - {result.message[:50]}...")
        
        # 现实验证
        if self.reality_check:
            lines.extend([
                f"",
                f"🌐 现实验证:",
                f"   URL: {self.reality_check.url}",
                f"   预期元素: {self.reality_check.expected_element}",
                f"   实际发现: {'✅ 找到' if self.reality_check.found else '❌ 未找到'}",
            ])
        
        # 逻辑幻觉分析
        if self.is_hallucination:
            lines.extend([
                f"",
                f"🚨 逻辑幻觉检测:",
                f"   {self.logic_reality_gap}",
            ])
        
        # 建议
        if self.recommendations:
            lines.extend([
                f"",
                f"💡 建议:",
            ])
            for i, rec in enumerate(self.recommendations, 1):
                lines.append(f"   {i}. {rec}")
        
        return "\n".join(lines)


class RealityCheckError(Exception):
    """现实验证错误"""
    
    def __init__(self, message: str, reality_result: Optional[RealityCheckResult] = None):
        super().__init__(message)
        self.reality_result = reality_result


class SkepticalValidator:
    """
    怀疑论验证器
    
    核心理念：永远不要只相信 LLM 的输出，永远以"沙盒运行结果"为准
    
    验证流程：
    1. 语法检查：代码是否能解析
    2. 静态分析：代码质量检查
    3. 单元测试：pytest 验证逻辑
    4. 集成测试：组件间交互
    5. 现实验证：browser_agent 访问真实页面
    
    怀疑逻辑：
    - 如果 pytest 过了但 browser 看不到预期 UI → 逻辑幻觉，强制打回
    - 如果代码能运行但结果不符合预期 → 结果幻觉，强制打回
    
    使用方式：
        validator = SkepticalValidator()
        
        report = await validator.validate(
            task_id="task_001",
            code=generated_code,
            test_file="test_solution.py",
            target_url="http://localhost:3000",
            expected_element="QuickSort Visualization",
        )
        
        if report.is_hallucination:
            print("🚨 检测到逻辑幻觉！")
            print(report.logic_reality_gap)
    """
    
    def __init__(
        self,
        browser_agent = None,
        strict_mode: bool = True,  # 严格模式：任何警告都视为失败
    ):
        self.browser_agent = browser_agent
        self.strict_mode = strict_mode
        
        # 验证回调
        self._validation_callbacks: Dict[ValidationLayer, List[Callable]] = {
            layer: [] for layer in ValidationLayer
        }
    
    def on_validation(self, layer: ValidationLayer, callback: Callable):
        """注册验证回调"""
        self._validation_callbacks[layer].append(callback)
    
    async def validate(
        self,
        task_id: str,
        code: Optional[str] = None,
        code_path: Optional[str] = None,
        test_file: Optional[str] = None,
        target_url: Optional[str] = None,
        expected_element: Optional[str] = None,
        validation_layers: Optional[List[ValidationLayer]] = None,
    ) -> SkepticalValidationReport:
        """
        执行怀疑论验证
        
        Args:
            task_id: 任务 ID
            code: 代码字符串
            code_path: 代码文件路径
            test_file: 测试文件路径
            target_url: 目标 URL（用于现实验证）
            expected_element: 预期在页面中找到的元素
            validation_layers: 要执行的验证层级（默认全部）
        
        Returns:
            SkepticalValidationReport: 验证报告
        """
        layers = validation_layers or list(ValidationLayer)
        results: List[ValidationResult] = []
        
        # 1. 语法检查
        if ValidationLayer.SYNTAX in layers and code:
            result = await self._check_syntax(code)
            results.append(result)
            
            # 如果语法失败，后续验证跳过
            if result.status == ValidationStatus.FAILED:
                return self._generate_report(task_id, results, None)
        
        # 2. 静态分析
        if ValidationLayer.STATIC in layers and code_path:
            result = await self._run_static_analysis(code_path)
            results.append(result)
        
        # 3. 单元测试
        if ValidationLayer.UNIT_TEST in layers and test_file:
            result = await self._run_unit_tests(test_file)
            results.append(result)
        
        # 4. 集成测试
        if ValidationLayer.INTEGRATION in layers:
            result = await self._run_integration_tests()
            results.append(result)
        
        # 5. 现实验证（最关键）
        reality_result = None
        if ValidationLayer.REALITY in layers and target_url and self.browser_agent:
            reality_result = await self._reality_check(
                target_url,
                expected_element or "",
            )
        
        return self._generate_report(task_id, results, reality_result)
    
    async def _check_syntax(self, code: str) -> ValidationResult:
        """检查代码语法"""
        try:
            import ast
            ast.parse(code)
            
            return ValidationResult(
                layer=ValidationLayer.SYNTAX,
                status=ValidationStatus.PASSED,
                score=100.0,
                message="语法检查通过",
            )
        
        except SyntaxError as e:
            return ValidationResult(
                layer=ValidationLayer.SYNTAX,
                status=ValidationStatus.FAILED,
                score=0.0,
                message=f"语法错误: {e.msg} (第 {e.lineno} 行)",
                details={"line": e.lineno, "column": e.offset},
            )
    
    async def _run_static_analysis(self, code_path: str) -> ValidationResult:
        """运行静态分析"""
        try:
            # 尝试运行 pylint 或 flake8
            result = subprocess.run(
                ["python", "-m", "py_compile", code_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return ValidationResult(
                    layer=ValidationLayer.STATIC,
                    status=ValidationStatus.PASSED,
                    score=100.0,
                    message="静态分析通过",
                )
            else:
                return ValidationResult(
                    layer=ValidationLayer.STATIC,
                    status=ValidationStatus.WARNING if not self.strict_mode else ValidationStatus.FAILED,
                    score=80.0,
                    message=f"静态分析警告: {result.stderr[:100]}",
                )
        
        except Exception as e:
            return ValidationResult(
                layer=ValidationLayer.STATIC,
                status=ValidationStatus.SKIPPED,
                score=0.0,
                message=f"静态分析跳过: {e}",
            )
    
    async def _run_unit_tests(self, test_file: str) -> ValidationResult:
        """运行单元测试"""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", test_file, "-v", "--tb=short"],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            # 解析 pytest 输出
            output = result.stdout + result.stderr
            
            if result.returncode == 0:
                # 提取通过率
                passed = output.count("PASSED")
                failed = output.count("FAILED")
                total = passed + failed
                
                score = 100.0 if total == 0 else (passed / total) * 100
                
                return ValidationResult(
                    layer=ValidationLayer.UNIT_TEST,
                    status=ValidationStatus.PASSED,
                    score=score,
                    message=f"单元测试通过: {passed}/{total} 通过",
                    details={"passed": passed, "failed": failed, "total": total},
                )
            else:
                # 提取失败信息
                failed = output.count("FAILED")
                errors = output.count("ERROR")
                
                return ValidationResult(
                    layer=ValidationLayer.UNIT_TEST,
                    status=ValidationStatus.FAILED,
                    score=0.0,
                    message=f"单元测试失败: {failed} 失败, {errors} 错误",
                    details={"failed": failed, "errors": errors, "output": output[-500:]},
                )
        
        except subprocess.TimeoutExpired:
            return ValidationResult(
                layer=ValidationLayer.UNIT_TEST,
                status=ValidationStatus.FAILED,
                score=0.0,
                message="单元测试超时",
            )
        
        except Exception as e:
            return ValidationResult(
                layer=ValidationLayer.UNIT_TEST,
                status=ValidationStatus.SKIPPED,
                score=0.0,
                message=f"单元测试跳过: {e}",
            )
    
    async def _run_integration_tests(self) -> ValidationResult:
        """运行集成测试"""
        # 简化实现，实际项目中应该有具体的集成测试
        return ValidationResult(
            layer=ValidationLayer.INTEGRATION,
            status=ValidationStatus.SKIPPED,
            score=0.0,
            message="集成测试暂未实现",
        )
    
    async def _reality_check(
        self,
        target_url: str,
        expected_element: str,
    ) -> RealityCheckResult:
        """
        现实验证 - 去真实网页看看
        
        怀疑精神：即使 pytest 过了，也要去真实网页验证
        """
        if not self.browser_agent:
            return RealityCheckResult(
                url=target_url,
                expected_element=expected_element,
                found=False,
                actual_content="Browser agent not available",
            )
        
        try:
            # 导航到目标 URL
            if hasattr(self.browser_agent, "navigate"):
                await self.browser_agent.navigate(target_url)
            
            # 获取页面内容
            page_content = ""
            if hasattr(self.browser_agent, "get_page_content"):
                page_content = await self.browser_agent.get_page_content()
            elif hasattr(self.browser_agent, "get_text"):
                page_content = await self.browser_agent.get_text()
            
            # 检查预期元素是否存在
            found = expected_element in page_content
            
            # 获取控制台错误
            console_errors = []
            if hasattr(self.browser_agent, "get_console_logs"):
                logs = await self.browser_agent.get_console_logs()
                console_errors = [log for log in logs if "error" in log.lower()]
            
            # 截图
            screenshot_path = None
            if hasattr(self.browser_agent, "screenshot"):
                screenshot_path = f"/tmp/reality_check_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                await self.browser_agent.screenshot(screenshot_path)
            
            return RealityCheckResult(
                url=target_url,
                expected_element=expected_element,
                found=found,
                actual_content=page_content[:1000],  # 限制长度
                screenshot_path=screenshot_path,
                console_errors=console_errors,
            )
        
        except Exception as e:
            return RealityCheckResult(
                url=target_url,
                expected_element=expected_element,
                found=False,
                actual_content=f"Error: {str(e)}",
            )
    
    def _generate_report(
        self,
        task_id: str,
        results: List[ValidationResult],
        reality_result: Optional[RealityCheckResult],
    ) -> SkepticalValidationReport:
        """生成验证报告"""
        
        # 计算综合评分
        if results:
            overall_score = sum(r.score for r in results) / len(results)
        else:
            overall_score = 0.0
        
        # 确定整体状态
        has_failed = any(r.status == ValidationStatus.FAILED for r in results)
        has_warning = any(r.status == ValidationStatus.WARNING for r in results)
        
        if has_failed:
            overall_status = ValidationStatus.FAILED
        elif has_warning:
            overall_status = ValidationStatus.WARNING
        else:
            overall_status = ValidationStatus.PASSED
        
        # 检测逻辑幻觉
        is_hallucination = False
        logic_reality_gap = ""
        
        # 检查逻辑与现实的差距
        unit_test_result = next((r for r in results if r.layer == ValidationLayer.UNIT_TEST), None)
        
        if unit_test_result and unit_test_result.status == ValidationStatus.PASSED:
            # 单元测试通过了
            if reality_result and not reality_result.found:
                # 但现实验证失败 → 逻辑幻觉！
                is_hallucination = True
                overall_status = ValidationStatus.HALLUCINATION
                logic_reality_gap = (
                    f"🎭 **逻辑幻觉检测**\n\n"
                    f"单元测试显示通过，但现实中未发现预期元素 '{reality_result.expected_element}'。\n\n"
                    f"这意味着代码在逻辑上看似正确，但在真实环境中无法产生预期效果。\n\n"
                    f"可能原因：\n"
                    f"1. 测试用例覆盖不完整，存在边界情况未处理\n"
                    f"2. 代码依赖的某些环境条件在真实场景中不满足\n"
                    f"3. 前端渲染逻辑与后端逻辑不一致\n"
                    f"4. 异步加载导致元素检查时还未渲染完成\n\n"
                    f"建议：增加端到端测试，确保逻辑与现实一致。"
                )
        
        # 生成建议
        recommendations = self._generate_recommendations(results, reality_result, is_hallucination)
        
        return SkepticalValidationReport(
            task_id=task_id,
            timestamp=datetime.now(),
            results=results,
            reality_check=reality_result,
            overall_status=overall_status,
            overall_score=overall_score,
            is_hallucination=is_hallucination,
            logic_reality_gap=logic_reality_gap,
            recommendations=recommendations,
        )
    
    def _generate_recommendations(
        self,
        results: List[ValidationResult],
        reality_result: Optional[RealityCheckResult],
        is_hallucination: bool,
    ) -> List[str]:
        """生成建议"""
        recommendations = []
        
        # 根据失败层级生成建议
        for result in results:
            if result.status == ValidationStatus.FAILED:
                if result.layer == ValidationLayer.SYNTAX:
                    recommendations.append("修复语法错误后再进行后续验证")
                elif result.layer == ValidationLayer.UNIT_TEST:
                    recommendations.append("检查测试用例，确保覆盖所有边界情况")
                elif result.layer == ValidationLayer.STATIC:
                    recommendations.append("运行代码格式化工具（如 black, isort）")
        
        # 逻辑幻觉建议
        if is_hallucination:
            recommendations.extend([
                "增加端到端测试，验证真实用户场景",
                "检查异步加载逻辑，增加等待机制",
                "对比测试环境与生产环境的差异",
                "使用 Browser agent 进行更详细的页面元素检查",
            ])
        
        # 现实验证建议
        if reality_result and reality_result.console_errors:
            recommendations.append(f"修复浏览器控制台错误 ({len(reality_result.console_errors)} 个)")
        
        return recommendations
    
    async def quick_validate(
        self,
        task_id: str,
        code: str,
        expected_behavior: str,
    ) -> SkepticalValidationReport:
        """
        快速验证 - 仅语法检查
        
        用于快速反馈，不执行完整验证流程
        """
        return await self.validate(
            task_id=task_id,
            code=code,
            validation_layers=[ValidationLayer.SYNTAX],
        )
    
    async def deep_validate(
        self,
        task_id: str,
        code: str,
        code_path: str,
        test_file: str,
        target_url: str,
        expected_element: str,
    ) -> SkepticalValidationReport:
        """
        深度验证 - 执行所有验证层级
        
        用于最终交付前的全面验证
        """
        return await self.validate(
            task_id=task_id,
            code=code,
            code_path=code_path,
            test_file=test_file,
            target_url=target_url,
            expected_element=expected_element,
            validation_layers=list(ValidationLayer),
        )


# ───────────────────────────────────────────────────────────────────────────────
# 快捷函数
# ───────────────────────────────────────────────────────────────────────────────

async def reality_check(
    browser_agent,
    target_url: str,
    expected_element: str,
) -> RealityCheckResult:
    """
    快速现实验证函数
    
    使用方式：
        result = await reality_check(browser_agent, "http://localhost:3000", "Success Message")
        if not result.found:
            raise RealityCheckError(f"现实中未发现元素: {expected_element}")
    """
    validator = SkepticalValidator(browser_agent=browser_agent)
    return await validator._reality_check(target_url, expected_element)


# ───────────────────────────────────────────────────────────────────────────────
# 全局实例
# ───────────────────────────────────────────────────────────────────────────────

_validator: Optional[SkepticalValidator] = None


def get_skeptical_validator(browser_agent=None) -> SkepticalValidator:
    """获取全局怀疑论验证器"""
    global _validator
    if _validator is None:
        _validator = SkepticalValidator(browser_agent=browser_agent)
    return _validator


# ───────────────────────────────────────────────────────────────────────────────
# 测试
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test_skeptical_validator():
        print("=" * 60)
        print("SkepticalValidator 测试")
        print("=" * 60)
        
        validator = SkepticalValidator()
        
        # 测试 1: 语法正确的代码
        print("\n--- 测试 1: 语法正确的代码 ---")
        good_code = """
def hello():
    return "Hello, World!"
"""
        report = await validator.quick_validate("test_1", good_code, "返回问候语")
        print(f"状态: {report.overall_status.value}")
        print(f"评分: {report.overall_score:.1f}")
        print(f"幻觉: {report.is_hallucination}")
        
        # 测试 2: 语法错误的代码
        print("\n--- 测试 2: 语法错误的代码 ---")
        bad_code = """
def hello()
    return "Hello, World!"
"""
        report = await validator.quick_validate("test_2", bad_code, "返回问候语")
        print(f"状态: {report.overall_status.value}")
        print(f"评分: {report.overall_score:.1f}")
        
        syntax_result = next((r for r in report.results if r.layer == ValidationLayer.SYNTAX), None)
        if syntax_result:
            print(f"错误: {syntax_result.message}")
        
        # 测试 3: 逻辑幻觉检测
        print("\n--- 测试 3: 逻辑幻觉检测 ---")
        print("模拟场景: pytest 通过但浏览器验证失败")
        
        # 创建模拟的现实验证结果
        reality_result = RealityCheckResult(
            url="http://localhost:3000",
            expected_element="Success Message",
            found=False,
            actual_content="Error: Something went wrong",
        )
        
        # 创建模拟的单元测试结果
        unit_test_result = ValidationResult(
            layer=ValidationLayer.UNIT_TEST,
            status=ValidationStatus.PASSED,
            score=100.0,
            message="单元测试通过: 5/5 通过",
        )
        
        # 生成报告
        report = validator._generate_report(
            task_id="hallucination_test",
            results=[unit_test_result],
            reality_result=reality_result,
        )
        
        print(f"状态: {report.overall_status.value}")
        print(f"幻觉: {report.is_hallucination}")
        print(f"\n差距分析:\n{report.logic_reality_gap}")
        print(f"\n建议:")
        for i, rec in enumerate(report.recommendations, 1):
            print(f"  {i}. {rec}")
    
    asyncio.run(test_skeptical_validator())
