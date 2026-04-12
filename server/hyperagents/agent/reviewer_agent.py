#!/usr/bin/env python3
"""
MaoAI HyperAgents — Reviewer Agent（审查员 Agent）
─────────────────────────────────────────────────────────────────────────────
核心职责：
  1. 代码审查：严格审查 Coder 输出的代码
  2. 漏洞检测：识别潜在 Bug、安全漏洞、性能问题
  3. 质量评分：给出明确的通过/拒绝理由
  4. 红蓝对抗：与 Coder 进行博弈式评审

审查维度：
  1. 正确性：逻辑是否正确？边界条件是否处理？
  2. 安全性：是否有注入风险？权限控制是否到位？
  3. 性能：是否有 O(n²) 或更差复杂度？资源泄漏？
  4. 可维护性：命名是否清晰？结构是否合理？
  5. 测试覆盖：核心逻辑是否有测试？

用法：
  from reviewer_agent import ReviewerAgent

  reviewer = ReviewerAgent(api_key="...", workspace="/path/to/project")
  result = reviewer.review(code="...", context={"task": "优化登录"})
  if not result.approved:
      print(f"需修复: {result.issues}")
"""

import sys
import json
import time
import os
import re
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum

# ─── 日志工具 ────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志到标准输出（flush=True 确保实时性）"""
    entry = {
        "type": step_type,
        "agent": "reviewer",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 审查维度 ────────────────────────────────────────────────────────────────

class ReviewDimension(Enum):
    """审查维度"""
    CORRECTNESS = "correctness"        # 正确性
    SECURITY = "security"              # 安全性
    PERFORMANCE = "performance"        # 性能
    MAINTAINABILITY = "maintainability" # 可维护性
    TEST_COVERAGE = "test_coverage"    # 测试覆盖
    ERROR_HANDLING = "error_handling"  # 错误处理
    CODE_STYLE = "code_style"          # 代码风格


@dataclass
class ReviewIssue:
    """审查问题"""
    dimension: ReviewDimension
    severity: str  # critical, major, minor
    location: str   # 文件:行号
    line_number: int = 0  # 新增：具体行号
    column_start: int = 0  # 新增：列起始位置
    column_end: int = 0  # 新增：列结束位置
    description: str
    suggestion: str
    code_snippet: str = ""


@dataclass
class ReviewResult:
    """审查结果"""
    approved: bool
    score: float  # 0.0-1.0
    overall_score: float = 0.0
    dimension_scores: Dict[str, float] = field(default_factory=dict)
    issues: List[ReviewIssue] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    praise: List[str] = field(default_factory=list)  # 做得好的地方
    review_time: float = 0.0


# ─── 静态分析规则 ────────────────────────────────────────────────────────────

class StaticAnalysisRules:
    """静态分析规则库"""

    # 安全风险模式
    SECURITY_PATTERNS = [
        (r"eval\s*\(", "使用 eval() 可能导致代码注入攻击", ReviewDimension.SECURITY),
        (r"exec\s*\(", "使用 exec() 可能导致代码注入攻击", ReviewDimension.SECURITY),
        (r"document\.write\s*\(", "使用 document.write() 可能导致 XSS 攻击", ReviewDimension.SECURITY),
        (r"innerHTML\s*=", "直接设置 innerHTML 可能导致 XSS 攻击", ReviewDimension.SECURITY),
        (r"SQL\s*=\s*[\"'].*?%s", "SQL 查询中直接使用字符串拼接", ReviewDimension.SECURITY),
        (r"password\s*=\s*['\"][^'\"]{0,20}['\"]", "硬编码密码存在安全风险", ReviewDimension.SECURITY),
        (r"api[_-]?key\s*=\s*['\"][^'\"]{10,}", "硬编码 API Key 存在安全风险", ReviewDimension.SECURITY),
        (r"secret\s*=\s*['\"][^'\"]{10,}", "硬编码密钥存在安全风险", ReviewDimension.SECURITY),
        (r"crypto\.createCipher", "使用不安全的加密算法", ReviewDimension.SECURITY),
        (r"Math\.random\s*\(\)", "使用 Math.random() 生成安全随机数", ReviewDimension.SECURITY),
        (r"\.(?:json|yaml)\.load\s*\(\s*.*\)\s*;?\s*$", "不安全的反序列化", ReviewDimension.SECURITY),
    ]

    # 性能风险模式
    PERFORMANCE_PATTERNS = [
        (r"for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{", "嵌套循环可能导致 O(n²) 复杂度", ReviewDimension.PERFORMANCE),
        (r"\.forEach\s*\([^)]*\)\s*\{[^}]*\.forEach", "嵌套 forEach 可能导致性能问题", ReviewDimension.PERFORMANCE),
        (r"Array\([^)]+\)", "使用 Array 构造函数可能导致性能问题", ReviewDimension.PERFORMANCE),
        (r"new\s+Array\s*\(\s*\d+\s*\)", "预分配大数组可能导致内存问题", ReviewDimension.PERFORMANCE),
        (r"string\s*\+\s*=.*(?:string\s*\+=|for|while)", "字符串拼接在循环中可能导致性能问题", ReviewDimension.PERFORMANCE),
        (r"document\.querySelectorAll.*\n.*forEach", "频繁 DOM 查询可能影响性能", ReviewDimension.PERFORMANCE),
        (r"setTimeout.*\n.*setTimeout", "嵌套 setTimeout 可能导致回调地狱", ReviewDimension.PERFORMANCE),
    ]

    # 代码风格问题
    STYLE_PATTERNS = [
        (r"var\s+\w+", "使用 var 而不是 let/const", ReviewDimension.CODE_STYLE),
        (r"==(?!=)", "使用 == 而不是 ===", ReviewDimension.CODE_STYLE),
        (r"!=(?!=)", "使用 != 而非 !==", ReviewDimension.CODE_STYLE),
        (r"catch\s*\(\s*\w+\s*\)\s*\{\s*\}", "空的 catch 块可能吞掉错误", ReviewDimension.ERROR_HANDLING),
        (r"console\.log\s*\(\s*\)", "空的 console.log", ReviewDimension.CODE_STYLE),
        (r"// TODO:", "存在未完成的 TODO 注释", ReviewDimension.MAINTAINABILITY),
        (r"// FIXME:", "存在需要修复的问题", ReviewDimension.MAINTAINABILITY),
        (r"// HACK:", "存在临时解决方案", ReviewDimension.MAINTAINABILITY),
        (r"\s{2,}\n", "存在多余的空行", ReviewDimension.CODE_STYLE),
        (r"function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}\s*$", "过长的函数", ReviewDimension.MAINTAINABILITY),
    ]

    # 正确性问题
    CORRECTNESS_PATTERNS = [
        (r"if\s*\([^)]*\)\s*return[^;]*;\s*if", "条件判断后缺少 else", ReviewDimension.CORRECTNESS),
        (r"undefined\s*==", "与 undefined 比较应使用 ===", ReviewDimension.CORRECTNESS),
        (r"null\s*==", "与 null 比较应使用 ===", ReviewDimension.CORRECTNESS),
        (r"\w+\s*\.\s*length\s*==\s*0", "检查空数组应使用 .length === 0", ReviewDimension.CORRECTNESS),
        (r"return\s+[^;{]+(?<!return)\s*$", "return 语句后缺少分号", ReviewDimension.CORRECTNESS),
        (r"for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\w+\.length", "for 循环未缓存 length 属性", ReviewDimension.PERFORMANCE),
        (r"try\s*\{[^}]*\}\s*catch[^}]*\{[^}]*\}\s*finally\s*\{[^}]*$", "try-catch-finally 结构不完整", ReviewDimension.CORRECTNESS),
    ]

    ALL_PATTERNS = (
        SECURITY_PATTERNS + PERFORMANCE_PATTERNS +
        STYLE_PATTERNS + CORRECTNESS_PATTERNS
    )


# ─── Reviewer Agent ──────────────────────────────────────────────────────────

class ReviewerAgent:
    """
    审查员 Agent - 博弈式代码审查

    特点：
      1. 多维度审查：正确性、安全、性能、可维护性等
      2. 静态分析：自动检测常见代码问题
      3. LLM 辅助审查：利用大模型进行深度审查
      4. 红蓝对抗：像攻击者一样思考问题
    """

    def __init__(
        self,
        api_key: str = None,
        model: str = "gpt-4o",
        workspace: str = None,
        strict_mode: bool = False
    ):
        """
        初始化审查员

        Args:
            api_key: OpenAI API Key
            model: 使用的模型
            workspace: 工作目录
            strict_mode: 严格模式（降低通过阈值）
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = model
        self.workspace = workspace or os.getcwd()
        self.strict_mode = strict_mode
        self.review_history: List[ReviewResult] = []

        # 评分权重
        self.dimension_weights = {
            ReviewDimension.CORRECTNESS: 0.30,
            ReviewDimension.SECURITY: 0.25,
            ReviewDimension.PERFORMANCE: 0.15,
            ReviewDimension.MAINTAINABILITY: 0.15,
            ReviewDimension.TEST_COVERAGE: 0.10,
            ReviewDimension.ERROR_HANDLING: 0.05,
            ReviewDimension.CODE_STYLE: 0.00,
        }

    def review(
        self,
        code: str,
        context: Dict = None,
        dimensions: List[ReviewDimension] = None
    ) -> ReviewResult:
        """
        审查代码

        Args:
            code: 要审查的代码
            context: 上下文信息（任务描述、文件路径等）
            dimensions: 要审查的维度，默认全部

        Returns:
            ReviewResult: 审查结果
        """
        start_time = time.time()
        log_step("start", f"开始代码审查，代码长度: {len(code)} 字符",
                code_length=len(code))

        if dimensions is None:
            dimensions = list(ReviewDimension)

        result = ReviewResult(approved=False, score=0.0)

        # 1. 静态分析
        log_step("thought", "执行静态分析...", agent="reviewer")
        static_issues = self._static_analysis(code)
        result.issues.extend(static_issues)

        # 2. 维度评分
        log_step("thought", "评估各维度分数...", agent="reviewer")
        for dim in dimensions:
            score = self._evaluate_dimension(code, dim, static_issues)
            result.dimension_scores[dim.value] = score

        # 3. LLM 辅助审查（如果有 API Key）
        if self.api_key:
            log_step("thought", "调用 LLM 进行深度审查...", agent="reviewer")
            llm_issues = self._llm_review(code, context, dimensions)
            result.issues.extend(llm_issues)

        # 4. 计算总分
        result.overall_score = self._calculate_overall_score(result.dimension_scores)
        result.score = result.overall_score

        # 5. 生成建议
        result.suggestions = self._generate_suggestions(result.issues)

        # 6. 生成表扬
        result.praise = self._generate_praise(code, result.dimension_scores)

        # 7. 判断是否通过
        threshold = 0.6 if not self.strict_mode else 0.8
        critical_issues = [i for i in result.issues if i.severity == "critical"]

        result.approved = (
            result.overall_score >= threshold and
            len(critical_issues) == 0
        )

        result.review_time = time.time() - start_time

        # 记录历史
        self.review_history.append(result)

        # 输出结果
        log_step("score", f"审查完成，评分: {result.overall_score:.2f}, {'通过' if result.approved else '拒绝'}",
                approved=result.approved,
                score=result.overall_score,
                issues_count=len(result.issues),
                critical_count=len(critical_issues),
                review_time=f"{result.review_time:.2f}s")

        return result

    def _static_analysis(self, code: str) -> List[ReviewIssue]:
        """静态分析代码（带行号定位）"""
        issues = []
        lines = code.splitlines()

        for pattern, message, dimension in StaticAnalysisRules.ALL_PATTERNS:
            matches = list(re.finditer(pattern, code, re.MULTILINE | re.DOTALL))
            for match in matches:
                # 计算严重程度
                severity = "minor"
                if dimension == ReviewDimension.SECURITY:
                    severity = "critical"
                elif dimension == ReviewDimension.PERFORMANCE:
                    if "O(n" in message or "嵌套" in message:
                        severity = "major"
                elif dimension == ReviewDimension.CORRECTNESS:
                    severity = "major"

                # 计算行号
                line_number = code[:match.start()].count('\n') + 1
                
                # 计算列位置
                line_start = code.rfind('\n', 0, match.start()) + 1
                col_start = match.start() - line_start
                col_end = col_start + len(match.group())

                # 提取代码片段（当前行）
                line_idx = line_number - 1
                if 0 <= line_idx < len(lines):
                    snippet = lines[line_idx].strip()[:100]
                else:
                    snippet = match.group()[:100]

                issues.append(ReviewIssue(
                    dimension=dimension,
                    severity=severity,
                    location=f"行 {line_number}",
                    line_number=line_number,
                    column_start=col_start,
                    column_end=col_end,
                    description=message,
                    suggestion=f"建议重构以解决: {message}",
                    code_snippet=snippet
                ))

        log_step("observation", f"静态分析发现 {len(issues)} 个问题",
                issues_count=len(issues))

        return issues

    def _evaluate_dimension(
        self,
        code: str,
        dimension: ReviewDimension,
        static_issues: List[ReviewIssue]
    ) -> float:
        """评估单个维度"""
        score = 1.0

        # 扣除静态分析发现的问题
        dim_issues = [i for i in static_issues if i.dimension == dimension]
        for issue in dim_issues:
            if issue.severity == "critical":
                score -= 0.3
            elif issue.severity == "major":
                score -= 0.1
            else:
                score -= 0.02

        # 特定维度的额外检查
        if dimension == ReviewDimension.CORRECTNESS:
            # 检查是否有 TODO/FIXME
            if "// TODO" in code or "// FIXME" in code:
                score -= 0.05

        elif dimension == ReviewDimension.SECURITY:
            # 检查是否有明显的安全风险
            dangerous_patterns = ["eval(", "exec(", "innerHTML", "document.write"]
            for pattern in dangerous_patterns:
                if pattern in code:
                    score -= 0.2

        elif dimension == ReviewDimension.TEST_COVERAGE:
            # 检查是否有测试
            has_tests = any(kw in code.lower() for kw in ["test", "spec", "describe", "it(", "expect", "assert"])
            if not has_tests:
                score -= 0.3

        elif dimension == ReviewDimension.ERROR_HANDLING:
            # 检查是否有 try-catch
            has_try = "try {" in code
            has_catch = "catch" in code
            if has_try and not has_catch:
                score -= 0.3

        return max(0.0, min(1.0, score))

    def _llm_review(
        self,
        code: str,
        context: Dict = None,
        dimensions: List[ReviewDimension] = None
    ) -> List[ReviewIssue]:
        """使用 LLM 进行深度审查"""
        if not self.api_key:
            return []

        prompt = self._build_review_prompt(code, context, dimensions)

        try:
            response = self._call_llm(prompt)
            return self._parse_llm_response(response)
        except Exception as e:
            log_step("error", f"LLM 审查失败: {e}", agent="reviewer")
            return []

    def _build_review_prompt(
        self,
        code: str,
        context: Dict = None,
        dimensions: List[ReviewDimension] = None
    ) -> str:
        """构建审查提示词"""
        context_str = ""
        if context:
            context_str = f"\n任务描述: {context.get('task', 'N/A')}\n"
            context_str += f"文件路径: {context.get('file', 'N/A')}\n"

        dimensions_str = ", ".join([d.value for d in dimensions]) if dimensions else "all"

        prompt = f"""你是 **Reviewer Agent（审查员）**，负责对代码进行严格审查。

审查代码:
```
{code[:2000]}
```
{context_str}

请审查以下维度: {dimensions_str}

你的审查需要包括：
1. 发现的问题（具体位置、严重程度、修复建议）
2. 做得好的地方
3. 总体评分（0-10）

输出格式（严格遵守 JSON）:
```json
{{
  "issues": [
    {{
      "dimension": "correctness|security|performance|maintainability",
      "severity": "critical|major|minor",
      "location": "文件:行号",
      "description": "问题描述",
      "suggestion": "修复建议"
    }}
  ],
  "praise": ["做得好的地方1", "做得好的地方2"],
  "overall_score": 7.5
}}
```

注意：
- 严格评估，不放过任何问题
- 严重问题（安全性、正确性）必须标记为 critical
- 如果代码质量很高，评分可以是 9-10"""
        return prompt

    def _call_llm(self, prompt: str) -> str:
        """调用 LLM API"""
        import urllib.request
        import urllib.error

        base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
        url = f"{base_url}/chat/completions"

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2048,
            "temperature": 0.0,
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result["choices"][0]["message"]["content"]
        except Exception as e:
            log_step("error", f"LLM 调用失败: {e}", agent="reviewer")
            return '{"issues": [], "praise": [], "overall_score": 5.0}'

    def _parse_llm_response(self, response: str) -> List[ReviewIssue]:
        """解析 LLM 响应"""
        issues = []

        # 提取 JSON
        json_match = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group(1))
                for issue_data in data.get("issues", []):
                    dimension_str = issue_data.get("dimension", "correctness")
                    try:
                        dimension = ReviewDimension(dimension_str)
                    except ValueError:
                        dimension = ReviewDimension.CORRECTNESS

                    issues.append(ReviewIssue(
                        dimension=dimension,
                        severity=issue_data.get("severity", "minor"),
                        location=issue_data.get("location", "未知"),
                        description=issue_data.get("description", ""),
                        suggestion=issue_data.get("suggestion", "")
                    ))
            except json.JSONDecodeError:
                log_step("error", "LLM 响应 JSON 解析失败", agent="reviewer")

        return issues

    def _calculate_overall_score(self, dimension_scores: Dict[str, float]) -> float:
        """计算总分"""
        total = 0.0
        for dim_str, score in dimension_scores.items():
            try:
                dim = ReviewDimension(dim_str)
                weight = self.dimension_weights.get(dim, 0.1)
                total += score * weight
            except ValueError:
                total += score * 0.1

        return round(total, 2)

    def _generate_suggestions(self, issues: List[ReviewIssue]) -> List[str]:
        """生成修复建议"""
        suggestions = []
        for issue in issues:
            if issue.severity in ["critical", "major"]:
                suggestions.append(f"[{issue.severity}] {issue.description}: {issue.suggestion}")
        return suggestions

    def _generate_praise(self, code: str, dimension_scores: Dict[str, float]) -> List[str]:
        """生成做得好的地方"""
        praise = []

        for dim_str, score in dimension_scores.items():
            if score >= 0.9:
                if dim_str == "correctness":
                    praise.append("代码逻辑正确，边界条件处理得当")
                elif dim_str == "security":
                    praise.append("代码安全性良好，无明显安全风险")
                elif dim_str == "performance":
                    praise.append("性能优化到位，算法复杂度合理")
                elif dim_str == "maintainability":
                    praise.append("代码结构清晰，可维护性好")
                elif dim_str == "test_coverage":
                    praise.append("有完善的测试覆盖")

        return praise

    def review_and_suggest(
        self,
        code: str,
        context: Dict = None
    ) -> Tuple[ReviewResult, str]:
        """
        审查并返回修复后的代码

        Returns:
            (ReviewResult, suggested_fix): 审查结果和建议修复
        """
        result = self.review(code, context)

        if result.approved:
            return result, code

        # 生成修复建议
        prompt = f"""请根据以下审查意见修复代码：

审查结果:
- 评分: {result.overall_score:.2f}
- 问题数量: {len(result.issues)}

问题列表:
{chr(10).join([f"- [{i.severity}] {i.description}" for i in result.issues[:5]])}

原始代码:
```
{code[:2000]}
```

请提供修复后的代码（只返回代码，不要解释）：
```python
# 修复后的代码
```"""

        suggested_fix = ""
        if self.api_key:
            try:
                response = self._call_llm(prompt)
                match = re.search(r"```(?:python|typescript|javascript)?\s*(.*?)\s*```", response, re.DOTALL)
                if match:
                    suggested_fix = match.group(1).strip()
            except Exception:
                suggested_fix = ""

        return result, suggested_fix

    def adversarial_review(
        self,
        code: str,
        context: Dict = None
    ) -> ReviewResult:
        """
        红蓝对抗式审查 - 像攻击者一样思考

        模拟攻击者视角：
        1. 如果这是恶意代码，我能利用哪些漏洞？
        2. 哪些输入会导致系统崩溃？
        3. 是否有权限提升的风险？
        """
        log_step("thought", "启动红蓝对抗模式，像攻击者一样思考...",
                agent="reviewer", mode="adversarial")

        # 正常的审查
        result = self.review(code, context)

        # 添加攻击者视角的额外检查
        attack_perspectives = [
            ("注入攻击", self._check_injection_risks),
            ("拒绝服务", self._check_dos_risks),
            ("权限问题", self._check_permission_risks),
        ]

        for perspective_name, check_func in attack_perspectives:
            log_step("thought", f"检查 {perspective_name} 风险...", agent="reviewer")
            risks = check_func(code)
            if risks:
                result.issues.extend(risks)
                log_step("observation", f"发现 {perspective_name} 风险: {len(risks)} 个",
                        agent="reviewer", perspective=perspective_name)

        # 重新评分
        result.overall_score = self._calculate_overall_score(result.dimension_scores)
        result.score = result.overall_score
        result.approved = result.overall_score >= 0.7 and \
                        not any(i.severity == "critical" for i in result.issues)

        return result

    def _check_injection_risks(self, code: str) -> List[ReviewIssue]:
        """检查注入攻击风险"""
        risks = []

        injection_patterns = [
            (r"exec\s*\(|eval\s*\(", "代码执行注入"),
            (r"innerHTML\s*=", "XSS 注入"),
            (r"document\.write\s*\(", "XSS 注入"),
            (r"\.(?:append|before|after)\s*\(\s*\w+", "DOM 注入"),
            (r"subprocess\.run\s*\(\s*.*\+", "命令注入"),
            (r"shell=True", "命令注入"),
        ]

        for pattern, risk_type in injection_patterns:
            if re.search(pattern, code):
                risks.append(ReviewIssue(
                    dimension=ReviewDimension.SECURITY,
                    severity="critical",
                    location="安全审查",
                    description=f"存在 {risk_type} 风险",
                    suggestion="使用安全的 API 或进行输入验证"
                ))

        return risks

    def _check_dos_risks(self, code: str) -> List[ReviewIssue]:
        """检查拒绝服务风险"""
        risks = []

        dos_patterns = [
            (r"while\s*True\s*:", "无限循环可能导致 CPU 占用"),
            (r"for\s*.*\s+in\s+.*:\s*for\s+", "嵌套循环可能导致性能问题"),
            (r"re\.compile\s*\([^)]+\)\s*in\s+", "正则表达式 ReDoS 风险"),
            (r"\.read\s*\(\s*\)", "大文件读取可能导致内存溢出"),
            (r"json\.loads\s*\([^)]+\.read", "大 JSON 解析可能导致内存问题"),
        ]

        for pattern, risk_type in dos_patterns:
            if re.search(pattern, code):
                risks.append(ReviewIssue(
                    dimension=ReviewDimension.PERFORMANCE,
                    severity="major",
                    location="性能审查",
                    description=f"存在 {risk_type}",
                    suggestion="添加超时或大小限制"
                ))

        return risks

    def _check_permission_risks(self, code: str) -> List[ReviewIssue]:
        """检查权限问题"""
        risks = []

        perm_patterns = [
            (r"chmod\s+777|chmod\s+0o777", "过宽的文件权限"),
            (r"os\.chmod\s*\([^,]+,\s*0o777", "过宽的文件权限"),
            (r"sudo|os\.system\s*\(\s*.*sudo", "不必要的 sudo 执行"),
        ]

        for pattern, risk_type in perm_patterns:
            if re.search(pattern, code):
                risks.append(ReviewIssue(
                    dimension=ReviewDimension.SECURITY,
                    severity="major",
                    location="权限审查",
                    description=f"存在 {risk_type}",
                    suggestion="使用最小权限原则"
                ))

        return risks

    def generate_test_cases(
        self,
        task: str,
        code: str,
        language: str = "typescript"
    ) -> Dict[str, Any]:
        """
        生成针对代码问题的测试用例

        这是"超越 Manus Max"的关键能力：
        Reviewer 不仅找茬，还要写出能证明问题存在的测试。

        Args:
            task: 任务描述
            code: 待测试的代码
            language: 编程语言

        Returns:
            {
                "test_cases": List[测试用例],
                "reproducer_code": str,  # 完整的测试文件
                "success": bool
            }
        """
        log_step("thought", "Reviewer 正在生成测试用例...", agent="reviewer")

        prompt = f"""作为代码审查员，请为以下代码生成验证测试用例：

任务：{task}

代码：
```
{code[:2000]}
```

请生成 2-3 个测试用例，用于：
1. **复现测试**：能证明当前代码存在问题的测试（修复前应失败）
2. **边界测试**：边界条件和异常输入的测试
3. **回归测试**：确保修复后不会引入新问题的测试

输出格式（严格 JSON）：
```json
{{
  "test_cases": [
    {{
      "name": "test_xxx",
      "description": "测试描述",
      "code": "实际可执行的测试代码",
      "expected": "期望结果",
      "should_fail_before_fix": true
    }}
  ]
}}
```

注意：
- 测试代码必须可执行
- 大部分测试 should_fail_before_fix 应为 true（证明问题存在）"""

        try:
            response = self._call_llm(prompt)
            # 解析 JSON
            json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(1))
                test_cases = data.get("test_cases", [])
                
                # 构建完整的测试文件
                reproducer_code = self._build_reproducer_template(
                    task, test_cases, language
                )
                
                log_step("done", f"生成 {len(test_cases)} 个测试用例",
                        agent="reviewer", test_count=len(test_cases))
                
                return {
                    "test_cases": test_cases,
                    "reproducer_code": reproducer_code,
                    "success": True
                }
        except Exception as e:
            log_step("error", f"测试用例生成失败: {e}", agent="reviewer")

        return {"test_cases": [], "reproducer_code": "", "success": False}

    def _build_reproducer_template(
        self,
        task: str,
        test_cases: List[Dict],
        language: str
    ) -> str:
        """构建 Reproducer 测试模板"""
        if language == "typescript":
            test_blocks = "\n".join([
                f"  it('{tc.get('name', 'test')}', () => {{\n    // {tc.get('description', '')}\n    {tc.get('code', '')}\n  }});"
                for tc in test_cases
            ])
            return f'''// ─── Auto-Generated Reproducer ───────────────────────────────────────────
// Task: {task}
// Generated: {time.strftime("%Y-%m-%d %H:%M:%S")}

import {{ describe, it, expect }} from 'vitest';

describe('Reproducer', () => {{
{test_blocks}
}});
'''
        else:  # Python
            test_blocks = "\n".join([
                f"    def {tc.get('name', 'test')}(self):\n        # {tc.get('description', '')}\n        {tc.get('code', '')}"
                for tc in test_cases
            ])
            return f'''# ─── Auto-Generated Reproducer ───────────────────────────────────────────
# Task: {task}
# Generated: {time.strftime("%Y-%m-%d %H:%M:%S")}

import unittest

class TestReproducer(unittest.TestCase):
{test_blocks}

if __name__ == '__main__':
    unittest.main()
'''

    def structured_feedback(self, issues: List[ReviewIssue]) -> str:
        """
        生成结构化反馈（面向 Coder 的可执行指令）

        关键改进：将 Reviewer 的反馈转换为 Coder 可直接执行的修复指令
        """
        if not issues:
            return "代码审查通过，无问题。"

        feedback_lines = [
            "=== Reviewer 审查反馈 ===",
            "",
            "发现以下问题，请修复：",
            ""
        ]

        # 按严重程度和行号排序
        sorted_issues = sorted(
            issues,
            key=lambda x: (
                0 if x.severity == "critical" else 1 if x.severity == "major" else 2,
                x.line_number or 999
            )
        )

        for i, issue in enumerate(sorted_issues, 1):
            feedback_lines.append(f"【问题 {i}】")
            feedback_lines.append(f"  维度: {issue.dimension.value}")
            feedback_lines.append(f"  严重性: {issue.severity}")
            feedback_lines.append(f"  位置: {issue.location}" + 
                                (f" (第 {issue.line_number} 行)" if issue.line_number else ""))
            feedback_lines.append(f"  问题: {issue.description}")
            feedback_lines.append(f"  建议: {issue.suggestion}")
            if issue.code_snippet:
                feedback_lines.append(f"  代码: {issue.code_snippet}")
            feedback_lines.append("")

        feedback_lines.append("请根据以上反馈修复代码，确保：")
        feedback_lines.append("1. 所有 critical 问题必须解决")
        feedback_lines.append("2. major 问题尽量解决")
        feedback_lines.append("3. 不要引入新的问题")

        return "\n".join(feedback_lines)


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Reviewer Agent")
    parser.add_argument("--code", type=str, default="", help="要审查的代码")
    parser.add_argument("--file", type=str, default="", help="要审查的文件路径")
    parser.add_argument("--mode", type=str, choices=["normal", "adversarial"],
                       default="normal", help="审查模式")
    parser.add_argument("--strict", action="store_true", help="严格模式")
    parser.add_argument("--api-key", type=str, default=os.environ.get("OPENAI_API_KEY", ""),
                       help="API Key")
    parser.add_argument("--model", type=str, default="gpt-4o", help="模型")
    args = parser.parse()

    # 读取代码
    code = args.code
    if args.file:
        with open(args.file, "r", encoding="utf-8", errors="ignore") as f:
            code = f.read()

    if not code:
        print("错误：未提供代码或文件路径")
        sys.exit(1)

    reviewer = ReviewerAgent(
        api_key=args.api_key,
        model=args.model,
        strict_mode=args.strict
    )

    if args.mode == "adversarial":
        result = reviewer.adversarial_review(code)
    else:
        result = reviewer.review(code)

    print(json.dumps({
        "approved": result.approved,
        "score": result.overall_score,
        "dimension_scores": result.dimension_scores,
        "issues_count": len(result.issues),
        "issues": [
            {
                "dimension": i.dimension.value,
                "severity": i.severity,
                "description": i.description,
                "suggestion": i.suggestion
            }
            for i in result.issues
        ],
        "praise": result.praise,
        "suggestions": result.suggestions,
        "review_time": f"{result.review_time:.2f}s"
    }, ensure_ascii=False, indent=2))
