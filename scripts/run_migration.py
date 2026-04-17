#!/usr/bin/env python3
"""
Supabase DDL Executor
用法: python scripts/run_migration.py <sql_file>
"""
import sys
import os
import psycopg2

# Supabase 连接参数
DB_CONFIG = {
    "host": "db.fczherphuixpdjuevzsh.supabase.co",
    "port": 5432,
    "dbname": "postgres",
    "user": "postgres.fczherphuixpdjuevzsh",
    "password": "Sb@7002005_12345",
    "sslmode": "require",
}

def run_sql_file(filepath):
    with open(filepath, "r") as f:
        sql = f.read()
    
    # 分割 SQL 语句
    statements = []
    current = ""
    for line in sql.split("\n"):
        stripped = line.strip()
        if stripped.startswith("--") or stripped == "":
            continue  # 跳过注释和空行
        current += " " + line
        if stripped.endswith(";"):
            statements.append(current.strip())
            current = ""
    
    if current.strip():
        statements.append(current.strip())
    
    print(f"📊 共 {len(statements)} 条 SQL 语句")
    
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True  # 每条单独提交
    cur = conn.cursor()
    
    success, failed = 0, []
    for i, stmt in enumerate(statements, 1):
        # 跳过纯注释行
        stmt_clean = "\n".join(l for l in stmt.split("\n") if not l.strip().startswith("--"))
        if not stmt_clean.strip():
            continue
        try:
            cur.execute(stmt_clean)
            # 提取前30字符作为描述
            desc = stmt_clean[:60].replace("\n", " ").strip()
            print(f"  ✅ [{i}/{len(statements)}] {desc}...")
            success += 1
        except psycopg2.errors.lookup('42P07') as e:  # 42P07 = duplicate_table
            print(f"  ⚠️  [{i}/{len(statements)}] 表已存在，跳过")
            success += 1
        except psycopg2.errors.lookup('42710') as e:  # duplicate_object
            print(f"  ⚠️  [{i}/{len(statements)}] 对象已存在，跳过")
            success += 1
        except psycopg2.errors.lookup('23505') as e:  # unique_violation
            print(f"  ⚠️  [{i}/{len(statements)}] 唯一约束冲突，跳过")
            success += 1
        except Exception as e:
            print(f"  ❌ [{i}/{len(statements)}] {str(e)[:80]}")
            failed.append((stmt_clean[:80], str(e)[:100]))
    
    cur.close()
    conn.close()
    
    print(f"\n{'='*50}")
    print(f"完成: {success} 成功, {len(failed)} 失败")
    if failed:
        print("失败详情:")
        for desc, err in failed:
            print(f"  - {desc}: {err}")
    return len(failed) == 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        # 默认执行 0008
        sql_file = "drizzle/0008_hybrid_cloud_queue.sql"
    else:
        sql_file = sys.argv[1]
    
    print(f"🚀 开始执行: {sql_file}")
    print(f"🔗 连接: {DB_CONFIG['host']}")
    ok = run_sql_file(sql_file)
    sys.exit(0 if ok else 1)
