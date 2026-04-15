-- MPO (Multi-Party Orchestration) 表迁移
-- 版本: 0007
-- 创建时间: 2026-04-15

-- ─── 枚举类型 ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "mpo_status" AS ENUM ('running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "mpo_mode" AS ENUM ('auto', 'serial', 'parallel', 'triad');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── MPO 执行记录表 ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "mpo_executions" (
  "id"            SERIAL PRIMARY KEY,
  "execution_id"  VARCHAR(64) NOT NULL UNIQUE,
  "user_id"       INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "task"          TEXT NOT NULL,
  "mode"          "mpo_mode" NOT NULL DEFAULT 'auto',
  "status"        "mpo_status" NOT NULL DEFAULT 'running',
  "result"        JSON,
  "error_message" TEXT,
  "context"       JSON,
  "duration_ms"   BIGINT,
  "started_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "completed_at"  TIMESTAMP,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS "idx_mpo_executions_user_id"    ON "mpo_executions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_mpo_executions_status"     ON "mpo_executions" ("status");
CREATE INDEX IF NOT EXISTS "idx_mpo_executions_started_at" ON "mpo_executions" ("started_at" DESC);

-- ─── MPO DecisionLedger 表 ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "mpo_decision_ledger" (
  "id"           SERIAL PRIMARY KEY,
  "execution_id" VARCHAR(64) NOT NULL,
  "user_id"      INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "round"        INTEGER NOT NULL DEFAULT 0,
  "agent_role"   VARCHAR(64) NOT NULL,
  "action"       VARCHAR(128) NOT NULL,
  "decision"     TEXT NOT NULL,
  "score"        INTEGER,
  "approved"     BOOLEAN,
  "metadata"     JSON,
  "timestamp"    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS "idx_mpo_ledger_execution_id" ON "mpo_decision_ledger" ("execution_id");
CREATE INDEX IF NOT EXISTS "idx_mpo_ledger_user_id"      ON "mpo_decision_ledger" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_mpo_ledger_timestamp"    ON "mpo_decision_ledger" ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_mpo_ledger_agent_role"   ON "mpo_decision_ledger" ("agent_role");

-- ─── RLS 策略（Supabase）──────────────────────────────────────────────────────

-- mpo_executions: 用户只能看到自己的记录
ALTER TABLE "mpo_executions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mpo_executions_user_policy" ON "mpo_executions"
  FOR ALL USING (
    "user_id" = (SELECT id FROM "users" WHERE "openId" = auth.uid()::text LIMIT 1)
  );

-- mpo_decision_ledger: 同上
ALTER TABLE "mpo_decision_ledger" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mpo_ledger_user_policy" ON "mpo_decision_ledger"
  FOR ALL USING (
    "user_id" = (SELECT id FROM "users" WHERE "openId" = auth.uid()::text LIMIT 1)
  );
