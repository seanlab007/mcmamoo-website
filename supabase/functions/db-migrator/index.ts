/**
 * DB Migrator Edge Function
 * 直接使用 Deno 的 postgres 库执行 DDL，无需 DNS 解析
 * 
 * POST body: { "sql": "CREATE TABLE ..." } 或 { "migrations": ["sql1", "sql2"] }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const SUPABASE_DB_URL = Deno.env.get("SUPABASE_DB_URL") || 
  "postgresql://postgres:fczherphuixpdjuevzsh@db.fczherphuixpdjuevzsh.supabase.co:5432/postgres";
const ADMIN_TOKEN = "MAOAI_DB_MIGRATOR_ADMIN_TOKEN_2026"; // 简单验证

const MIGRATIONS = [
  // 0007: MPO 表
  `DO $$ BEGIN CREATE TYPE "mpo_status" AS ENUM ('running', 'completed', 'failed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE "mpo_mode" AS ENUM ('auto', 'serial', 'parallel', 'triad'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `CREATE TABLE IF NOT EXISTS "mpo_executions" ("id" SERIAL PRIMARY KEY, "execution_id" VARCHAR(64) NOT NULL UNIQUE, "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "task" TEXT NOT NULL, "mode" "mpo_mode" NOT NULL DEFAULT 'auto', "status" "mpo_status" NOT NULL DEFAULT 'running', "result" JSON, "error_message" TEXT, "context" JSON, "duration_ms" BIGINT, "started_at" TIMESTAMP NOT NULL DEFAULT NOW(), "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT NOW());`,
  `CREATE INDEX IF NOT EXISTS "idx_mpo_executions_user_id" ON "mpo_executions" ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_mpo_executions_status" ON "mpo_executions" ("status");`,
  `CREATE INDEX IF NOT EXISTS "idx_mpo_executions_started_at" ON "mpo_executions" ("started_at" DESC);`,
  `CREATE TABLE IF NOT EXISTS "mpo_decision_ledger" ("id" SERIAL PRIMARY KEY, "execution_id" VARCHAR(64) NOT NULL, "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "round" INTEGER NOT NULL DEFAULT 0, "agent_role" VARCHAR(64) NOT NULL, "action" VARCHAR(128) NOT NULL, "decision" TEXT NOT NULL, "score" INTEGER, "approved" BOOLEAN, "metadata" JSON, "timestamp" TIMESTAMP NOT NULL DEFAULT NOW());`,
  `CREATE INDEX IF NOT EXISTS "idx_mpo_ledger_execution_id" ON "mpo_decision_ledger" ("execution_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_mpo_ledger_user_id" ON "mpo_decision_ledger" ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_mpo_ledger_timestamp" ON "mpo_decision_ledger" ("timestamp" DESC);`,
  `CREATE INDEX IF NOT EXISTS "idx_mpo_ledger_agent_role" ON "mpo_decision_ledger" ("agent_role");`,
  `ALTER TABLE "mpo_executions" ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "mpo_executions_user_policy" ON "mpo_executions" FOR ALL USING ("user_id" = (SELECT id FROM "users" WHERE "openId" = auth.uid()::text LIMIT 1));`,
  `ALTER TABLE "mpo_decision_ledger" ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "mpo_ledger_user_policy" ON "mpo_decision_ledger" FOR ALL USING ("user_id" = (SELECT id FROM "users" WHERE "openId" = auth.uid()::text LIMIT 1));`,

  // 0008: 混合云队列
  `CREATE TABLE IF NOT EXISTS maoai_devices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), device_id TEXT UNIQUE NOT NULL, device_name TEXT, secret_hash TEXT NOT NULL, owner_uid TEXT, is_admin BOOLEAN DEFAULT false, last_seen_at TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now());`,
  `CREATE INDEX IF NOT EXISTS idx_devices_secret ON maoai_devices(secret_hash);`,
  `CREATE TABLE IF NOT EXISTS maoai_pending_commands (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), device_id TEXT NOT NULL, command_type TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}', priority INTEGER DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending', admin_uid TEXT NOT NULL, expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour'), created_at TIMESTAMPTZ DEFAULT now(), acknowledged_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, result_payload JSONB);`,
  `CREATE INDEX IF NOT EXISTS idx_commands_poll ON maoai_pending_commands(device_id, status, priority DESC, created_at ASC) WHERE status = 'pending';`,
  `CREATE INDEX IF NOT EXISTS idx_commands_expire ON maoai_pending_commands(expires_at) WHERE status = 'pending';`,
  `CREATE TABLE IF NOT EXISTS maoai_telemetry_log (id BIGSERIAL PRIMARY KEY, device_id TEXT NOT NULL, level TEXT NOT NULL DEFAULT 'INFO', message TEXT NOT NULL, metadata JSONB, created_at TIMESTAMPTZ DEFAULT now());`,
  `CREATE INDEX IF NOT EXISTS idx_telemetry_device ON maoai_telemetry_log(device_id, created_at DESC);`,
  `ALTER TABLE maoai_devices ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE maoai_pending_commands ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE maoai_telemetry_log ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "devices_service_write" ON maoai_devices FOR INSERT WITH CHECK (true);`,
  `CREATE POLICY "devices_auth_read" ON maoai_devices FOR SELECT USING (true);`,
  `CREATE POLICY "commands_admin_write" ON maoai_pending_commands FOR INSERT WITH CHECK (true);`,
  `CREATE POLICY "commands_device_read" ON maoai_pending_commands FOR SELECT USING (true);`,
  `CREATE POLICY "telemetry_device_write" ON maoai_telemetry_log FOR INSERT WITH CHECK (true);`,
  `CREATE POLICY "telemetry_auth_read" ON maoai_telemetry_log FOR SELECT USING (true);`,
  `CREATE OR REPLACE FUNCTION maoai_claim_command(p_device_id TEXT) RETURNS maoai_pending_commands AS $$ DECLARE claimed maoai_pending_commands; BEGIN UPDATE maoai_pending_commands SET status = 'acknowledged', acknowledged_at = now() WHERE id = (SELECT id FROM maoai_pending_commands WHERE (device_id = p_device_id OR device_id IS NULL) AND status = 'pending' AND expires_at > now() ORDER BY priority DESC, created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING * INTO claimed; RETURN claimed; END; $$ LANGUAGE plpgsql;`
];

async function runMigrations(): Promise<{ success: boolean; results: string[]; errors: string[] }> {
  const results: string[] = [];
  const errors: string[] = [];
  
  let client: any;
  try {
    // Edge Function 内部使用内网连接，无需 DNS
    client = new Client(SUPABASE_DB_URL);
    await client.connect();
    
    for (const sql of MIGRATIONS) {
      try {
        await client.queryObject(sql);
        const preview = sql.substring(0, 60).replace(/\s+/g, ' ');
        results.push(`OK: ${preview}...`);
      } catch (e: any) {
        // 忽略 duplicate_object 等无害错误
        if (e.code === '42710' || e.code === '42P07' || e.code === '23505' || 
            e.message?.includes('duplicate') || e.message?.includes('already exists')) {
          results.push(`SKIP (exists): ${sql.substring(0, 50)}...`);
        } else {
          errors.push(`ERROR [${e.code}]: ${sql.substring(0, 60)}... - ${e.message}`);
        }
      }
    }
  } catch (e: any) {
    errors.push(`Connection failed: ${e.message}`);
  } finally {
    try { client?.end(); } catch {}
  }
  
  return { 
    success: errors.length === 0, 
    results, 
    errors 
  };
}

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-admin-token"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 简单 Token 验证
  const adminToken = req.headers.get("x-admin-token") || "";
  if (adminToken !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const result = await runMigrations();
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
