"""
DecisionLedger - 决策日志图谱：记录战略演进史

从"说了什么"升级到"在什么背景下、基于什么矛盾、做出了什么决策、结果如何"
让AI具备真正的"历史感"和经验传承能力
"""

import json
import sqlite3
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class Decision:
    """决策记录"""
    decision_id: str
    timestamp: str
    task: str
    context: Dict[str, Any]
    contradiction: str  # 主要矛盾分析
    decision: str  # 决策内容
    outcome: Dict[str, Any]  # 执行结果
    lessons: List[str]  # 教训总结
    agents_involved: List[str]  # 参与的Agent
    scores: Dict[str, float]  # 评分
    status: str = "pending"  # pending/completed/failed
    parent_decision_id: Optional[str] = None  # 关联的历史决策

class DecisionLedger:
    """
    决策日志图谱 - 战略演进史管理器
    
    功能:
    - 记录: 每个重大决策的完整上下文
    - 检索: 基于语义相似性查找历史案例
    - 关联: 识别决策之间的因果链条
    - 传承: 提取经验教训供新任务参考
    """
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or "decision_ledger.db"
        self._init_db()
        print(f"✅ DecisionLedger 初始化: {self.db_path}")
    
    def _init_db(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                decision_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                task TEXT NOT NULL,
                context TEXT,  -- JSON
                contradiction TEXT,
                decision TEXT NOT NULL,
                outcome TEXT,  -- JSON
                lessons TEXT,  -- JSON list
                agents_involved TEXT,  -- JSON list
                scores TEXT,  -- JSON
                status TEXT DEFAULT 'pending',
                parent_decision_id TEXT,
                FOREIGN KEY (parent_decision_id) REFERENCES decisions(decision_id)
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_task ON decisions(task)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_timestamp ON decisions(timestamp)
        """)
        
        conn.commit()
        conn.close()
    
    def record(self, decision: Decision) -> str:
        """记录新决策"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO decisions 
            (decision_id, timestamp, task, context, contradiction, decision, outcome, lessons, agents_involved, scores, status, parent_decision_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            decision.decision_id,
            decision.timestamp,
            decision.task,
            json.dumps(decision.context, ensure_ascii=False),
            decision.contradiction,
            decision.decision,
            json.dumps(decision.outcome, ensure_ascii=False),
            json.dumps(decision.lessons, ensure_ascii=False),
            json.dumps(decision.agents_involved, ensure_ascii=False),
            json.dumps(decision.scores, ensure_ascii=False),
            decision.status,
            decision.parent_decision_id
        ))
        
        conn.commit()
        conn.close()
        return decision.decision_id
    
    def get(self, decision_id: str) -> Optional[Decision]:
        """获取单个决策"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM decisions WHERE decision_id = ?", (decision_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return self._row_to_decision(row)
        return None
    
    def query_by_task(self, task_keyword: str, limit: int = 10) -> List[Decision]:
        """按任务关键词查询"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM decisions WHERE task LIKE ? ORDER BY timestamp DESC LIMIT ?",
            (f"%{task_keyword}%", limit)
        )
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_decision(row) for row in rows]
    
    def query_recent(self, limit: int = 20) -> List[Decision]:
        """获取最近决策"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM decisions ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_decision(row) for row in rows]
    
    def get_lineage(self, decision_id: str) -> List[Decision]:
        """获取决策的完整血脉链"""
        lineage = []
        current_id = decision_id
        
        while current_id:
            decision = self.get(current_id)
            if decision:
                lineage.append(decision)
                current_id = decision.parent_decision_id
            else:
                break
        
        return lineage
    
    def _row_to_decision(self, row) -> Decision:
        """数据库行转决策对象"""
        return Decision(
            decision_id=row[0],
            timestamp=row[1],
            task=row[2],
            context=json.loads(row[3]) if row[3] else {},
            contradiction=row[4] or "",
            decision=row[5],
            outcome=json.loads(row[6]) if row[6] else {},
            lessons=json.loads(row[7]) if row[7] else [],
            agents_involved=json.loads(row[8]) if row[8] else [],
            scores=json.loads(row[9]) if row[9] else {},
            status=row[10] if len(row) > 10 else "pending",
            parent_decision_id=row[11] if len(row) > 11 else None
        )
    
    def update_outcome(self, decision_id: str, outcome: Dict, status: str = "completed"):
        """更新决策结果"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE decisions SET outcome = ?, status = ? WHERE decision_id = ?",
            (json.dumps(outcome, ensure_ascii=False), status, decision_id)
        )
        conn.commit()
        conn.close()
    
    def get_statistics(self) -> Dict:
        """获取统计信息"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM decisions")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM decisions WHERE status = 'completed'")
        completed = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(scores) FROM decisions WHERE scores != '{}'")
        avg_score = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return {"total": total, "completed": completed, "avg_score": avg_score}


# 经验传承引擎
class ExperienceInheritance:
    """
    经验传承 - 让AI具备"历史感"
    
    当遇到新任务时，自动检索历史类似案例，
    提取成功经验和失败教训
    """
    
    def __init__(self, ledger: DecisionLedger = None):
        self.ledger = ledger or DecisionLedger()
    
    async def get_relevant_experience(self, new_task: str, contradiction_hint: str = None) -> Dict:
        """
        获取相关经验
        
        1. 分析新任务的核心矛盾
        2. 在决策图谱中检索相似案例
        3. 提取成功经验和失败教训
        4. 生成"历史参考"上下文
        """
        # 检索相关历史案例
        similar_cases = self.ledger.query_by_task(new_task, limit=5)
        
        if not similar_cases:
            return {
                "has_history": False,
                "context": "无相关历史记录，从头开始"
            }
        
        # 分析历史案例
        successful = [c for c in similar_cases if c.status == "completed" and c.scores.get("final", 0) > 80]
        failed = [c for c in similar_cases if c.status == "failed"]
        
        lessons = []
        for case in successful + failed:
            lessons.extend(case.lessons)
        
        return {
            "has_history": True,
            "similar_cases_count": len(similar_cases),
            "success_rate": len(successful) / len(similar_cases) if similar_cases else 0,
            "successful_cases": [
                {"task": c.task, "scores": c.scores, "decision": c.decision[:100]}
                for c in successful[:3]
            ],
            "lessons_learned": list(set(lessons))[:5],
            "recommendation": self._generate_recommendation(successful, failed)
        }
    
    def _generate_recommendation(self, successful: List[Decision], failed: List[Decision]) -> str:
        """生成推荐建议"""
        if successful and not failed:
            return f"历史上类似任务成功率较高({len(successful)}个成功案例)，建议沿用成功模式"
        elif failed and not successful:
            return "历史上类似任务均未成功，建议重新审视核心矛盾或寻求创新方案"
        elif successful and failed:
            return "历史上类似任务结果参半，需要仔细分析成功与失败案例的差异点"
        return "历史案例不足，建议谨慎推进"


# 初始化
if __name__ == "__main__":
    print("=== DecisionLedger 测试 ===\n")
    
    ledger = DecisionLedger("test_ledger.db")
    
    # 测试记录
    decision = Decision(
        decision_id=str(uuid.uuid4()),
        timestamp=datetime.now().isoformat(),
        task="低空经济动态定价算法",
        context={"market": "中国低空经济", "competitors": ["大疆", "亿航"]},
        contradiction="价格战 vs 利润率",
        decision="基于利用率的弹性定价模型",
        outcome={"margin_improved": "+8%", "utilization_improved": "+22%"},
        lessons=["弹性定价需考虑多维度因子", "博弈均衡点需要实时计算"],
        agents_involved=["Coder", "Reviewer", "Validator"],
        scores={"final": 92.5, "coders": 88, "reviewer": 95, "validator": 94}
    )
    
    print(f"[记录决策] {decision.decision_id[:8]}...")
    ledger.record(decision)
    
    # 查询
    print("\n[查询] 低空经济相关...")
    results = ledger.query_by_task("低空经济")
    for d in results:
        print(f"  - {d.task}: {d.status} (score: {d.scores.get('final', 'N/A')})")
    
    # 统计
    stats = ledger.get_statistics()
    print(f"\n[统计] 总计: {stats['total']}, 完成: {stats['completed']}, 平均分: {stats['avg_score']:.1f}")
    
    # 经验传承
    exp = ExperienceInheritance(ledger)
    import asyncio
    experience = asyncio.run(exp.get_relevant_experience("低空经济"))
    print(f"\n[经验传承] {experience}")
    
    print("\n✅ DecisionLedger 测试完成!")
