"""
StrategicSentinel - 战略哨兵：24小时主动监控

功能:
- GitHub监控: 代码提交、PR、Issue
- 新闻监控: 行业动态、政策变动
- 指标监控: 业务指标偏离
- 竞品监控: 竞品动态
- 战略转折点识别: 主动预警
"""

import asyncio
import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import requests

class AlertLevel(Enum):
    LOW = "low"           # 日常信息
    MEDIUM = "medium"     # 需要关注
    HIGH = "high"        # 重要警报
    CRITICAL = "critical" # 战略转折点

@dataclass
class MonitorEvent:
    """监控事件"""
    source: str  # github, news, metrics, competitor
    event_type: str
    title: str
    content: str
    url: Optional[str] = None
    timestamp: str = None
    severity: float = 0.5  # 0-1
    tags: List[str] = field(default_factory=list)

@dataclass
class PivotAlert:
    """战略转折点警报"""
    event: MonitorEvent
    pivot_type: str  # tech_breakthrough, policy_change, competitor_action
    impact_assessment: str
    suggested_response: List[str]
    urgency: AlertLevel

class GitHubMonitor:
    """GitHub监控"""
    
    def __init__(self, repo: str, token: str = None):
        self.repo = repo
        self.token = token
        self.api_url = f"https://api.github.com/repos/{repo}"
        self.last_check = {}
    
    def _headers(self):
        headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers
    
    async def check_commits(self, since_hours: int = 24) -> List[MonitorEvent]:
        """检查最近提交"""
        since = datetime.now() - timedelta(hours=since_hours)
        url = f"{self.api_url}/commits"
        params = {"since": since.isoformat()}
        
        try:
            resp = requests.get(url, headers=self._headers(), params=params, timeout=10)
            if resp.status_code == 200:
                commits = resp.json()
                return [
                    MonitorEvent(
                        source="github",
                        event_type="commit",
                        title=f"提交: {c['commit']['message'].split(chr(10))[0][:50]}",
                        content=c['commit']['message'],
                        url=c['html_url'],
                        timestamp=c['commit']['committer']['date']
                    )
                    for c in commits[:5]
                ]
        except Exception as e:
            print(f"GitHub监控错误: {e}")
        return []
    
    async def check_issues(self, labels: List[str] = None) -> List[MonitorEvent]:
        """检查Issue"""
        url = f"{self.api_url}/issues"
        params = {"state": "open", "sort": "updated"}
        if labels:
            params["labels"] = ",".join(labels)
        
        try:
            resp = requests.get(url, headers=self._headers(), params=params, timeout=10)
            if resp.status_code == 200:
                issues = resp.json()
                return [
                    MonitorEvent(
                        source="github",
                        event_type="issue",
                        title=f"Issue: {i['title'][:50]}",
                        content=i.get('body', '')[:200],
                        url=i['html_url'],
                        timestamp=i['updated_at'],
                        tags=i.get('labels', [])
                    )
                    for i in issues[:5]
                ]
        except Exception as e:
            print(f"GitHub Issue监控错误: {e}")
        return []

class NewsMonitor:
    """新闻监控"""
    
    def __init__(self, keywords: List[str], api_key: str = None):
        self.keywords = keywords
        self.api_key = api_key
        self.last_hashes = set()
    
    async def check_news(self) -> List[MonitorEvent]:
        """检查新闻"""
        events = []
        
        # 模拟新闻检查（实际可用NewsAPI）
        # 这里实现模拟逻辑
        for keyword in self.keywords:
            # 模拟发现新闻
            event = MonitorEvent(
                source="news",
                event_type="article",
                title=f"[{keyword}] 相关新闻更新",
                content="检测到相关领域动态，请关注",
                timestamp=datetime.now().isoformat(),
                tags=[keyword]
            )
            events.append(event)
        
        return events[:3]

class MetricsMonitor:
    """指标监控"""
    
    def __init__(self, metrics_config: Dict):
        self.config = metrics_config
        self.baselines = {}
    
    async def check_metrics(self) -> List[MonitorEvent]:
        """检查业务指标"""
        events = []
        
        # 模拟指标检查
        for metric_name, config in self.config.items():
            # 检查是否偏离基线
            current_value = self._get_current_value(metric_name)
            baseline = self.baselines.get(metric_name, current_value * 0.9)
            
            deviation = abs(current_value - baseline) / baseline if baseline else 0
            
            if deviation > 0.1:  # 10%偏离阈值
                events.append(MonitorEvent(
                    source="metrics",
                    event_type="anomaly",
                    title=f"指标异常: {metric_name}",
                    content=f"当前值: {current_value:.2f}, 基线: {baseline:.2f}, 偏离: {deviation*100:.1f}%",
                    timestamp=datetime.now().isoformat(),
                    severity=min(deviation, 1.0)
                ))
        
        return events

    def _get_current_value(self, metric_name: str) -> float:
        """获取当前指标值"""
        import random
        base = self.config.get(metric_name, {}).get("baseline", 100)
        return base * (0.9 + random.random() * 0.2)

class StrategicSentinel:
    """
    战略哨兵 - 24小时主动监控
    
    监控维度:
    - GitHub: 代码变更、Issue、PR
    - 新闻: 行业动态、政策变动
    - 指标: 业务指标偏离
    - 竞品: 竞争对手动作
    
    发现战略转折点时主动上报
    """
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.monitors = {}
        self.alert_callbacks: List[Callable] = []
        self.last_events: List[MonitorEvent] = []
        self.running = False
        
        self._init_monitors()
        print("✅ StrategicSentinel 初始化完成")
    
    def _init_monitors(self):
        """初始化监控器"""
        # GitHub监控
        if "github" in self.config:
            self.monitors["github"] = GitHubMonitor(
                repo=self.config["github"].get("repo"),
                token=self.config["github"].get("token")
            )
        
        # 新闻监控
        if "news" in self.config:
            self.monitors["news"] = NewsMonitor(
                keywords=self.config["news"].get("keywords", [
                    "AI", "低空经济", "商业航天", "AI算力", "人形机器人", "具身智能", "马斯克", "毛泽东思想"
                ])
            )
        
        # 指标监控
        if "metrics" in self.config:
            self.monitors["metrics"] = MetricsMonitor(
                metrics_config=self.config["metrics"]
            )
    
    def register_alert_callback(self, callback: Callable):
        """注册警报回调"""
        self.alert_callbacks.append(callback)
    
    async def scan_all(self) -> List[MonitorEvent]:
        """全维度扫描"""
        all_events = []
        
        for name, monitor in self.monitors.items():
            try:
                if hasattr(monitor, "check_commits"):
                    events = await monitor.check_commits()
                elif hasattr(monitor, "check_news"):
                    events = await monitor.check_news()
                elif hasattr(monitor, "check_metrics"):
                    events = await monitor.check_metrics()
                else:
                    events = []
                
                all_events.extend(events)
            except Exception as e:
                print(f"监控 {name} 错误: {e}")
        
        # 去重
        new_events = self._deduplicate(all_events)
        self.last_events = new_events
        
        # 检查战略转折点
        pivots = self._detect_pivots(new_events)
        
        return new_events
    
    def _deduplicate(self, events: List[MonitorEvent]) -> List[MonitorEvent]:
        """去重"""
        seen = set()
        unique = []
        for e in events:
            h = hashlib.md5(f"{e.source}:{e.event_type}:{e.title}".encode()).hexdigest()
            if h not in seen:
                seen.add(h)
                unique.append(e)
        return unique
    
    def _detect_pivots(self, events: List[MonitorEvent]) -> List[PivotAlert]:
        """检测战略转折点"""
        pivots = []
        
        for event in events:
            if event.severity >= 0.8:  # 高严重度
                pivot = PivotAlert(
                    event=event,
                    pivot_type=self._classify_pivot(event),
                    impact_assessment=f"来自{event.source}的{event.event_type}可能影响业务",
                    suggested_response=["立即评估影响", "准备应对方案"],
                    urgency=AlertLevel.HIGH if event.severity < 0.9 else AlertLevel.CRITICAL
                )
                pivots.append(pivot)
                
                # 触发警报回调
                for callback in self.alert_callbacks:
                    asyncio.create_task(callback(pivot))
        
        return pivots
    
    def _classify_pivot(self, event: MonitorEvent) -> str:
        """分类转折点类型"""
        if event.source == "github":
            return "code_update"
        elif event.source == "news":
            if any(k in event.title.lower() for k in ["政策", "监管", "规定"]):
                return "policy_change"
            elif any(k in event.title.lower() for k in ["突破", "发布", "新品"]):
                return "tech_breakthrough"
            return "market_news"
        elif event.source == "competitor":
            return "competitor_action"
        return "general"
    
    async def start_monitoring(self, interval_seconds: int = 3600):
        """启动持续监控"""
        self.running = True
        print(f"🚀 哨兵启动，每 {interval_seconds} 秒扫描一次")
        
        while self.running:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 扫描中...")
            events = await self.scan_all()
            
            if events:
                print(f"  发现 {len(events)} 个事件")
                for e in events[:3]:
                    print(f"    - {e.title}")
            
            await asyncio.sleep(interval_seconds)
    
    def stop_monitoring(self):
        """停止监控"""
        self.running = False
        print("🛑 哨兵已停止")


# 测试
if __name__ == "__main__":
    async def test():
        print("=== StrategicSentinel 测试 ===\n")
        
        # 配置哨兵
        config = {
            "github": {"repo": "seanlab007/mcmamoo-website"},
            "news": {"keywords": ["低空经济", "AI"]},
            "metrics": {
                "active_users": {"baseline": 1000},
                "conversion_rate": {"baseline": 0.05}
            }
        }
        
        sentinel = StrategicSentinel(config)
        
        # 注册警报回调
        async def on_alert(pivot: PivotAlert):
            print(f"🚨 警报: {pivot.event.title}")
            print(f"   类型: {pivot.pivot_type}, 紧急度: {pivot.urgency.value}")
        
        sentinel.register_alert_callback(on_alert)
        
        # 执行一次扫描
        print("\n[执行扫描]")
        events = await sentinel.scan_all()
        
        print(f"\n发现 {len(events)} 个事件:")
        for e in events:
            print(f"  [{e.source}] {e.title}")
        
        print("\n✅ StrategicSentinel 测试完成!")
    
    asyncio.run(test())
