-- OpenClaw × MaoAI 协同架构：扩展 ai_nodes 表 + 新建 node_skills 表
-- Migration: 20260325234100_openclaw_node_skills
-- Date: 2026-03-25

-- 给 ai_nodes 表添加 OpenClaw 注册协同字段
ALTER TABLE ai_nodes 
  ADD COLUMN IF NOT EXISTS token VARCHAR(128) DEFAULT '',
  ADD COLUMN IF NOT EXISTS "skillsChecksum" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "lastHeartbeatAt" TIMESTAMP DEFAULT NOW();

-- 创建 node_skills 表（存储从 OpenClaw 同步过来的技能元数据）
CREATE TABLE IF NOT EXISTS node_skills (
  id SERIAL PRIMARY KEY,
  "nodeId" INTEGER NOT NULL REFERENCES ai_nodes(id) ON DELETE CASCADE,
  "skillId" VARCHAR(128) NOT NULL,
  name VARCHAR(256) NOT NULL,
  version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  description TEXT,
  triggers JSONB DEFAULT '[]',
  category VARCHAR(64) NOT NULL DEFAULT 'custom',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_node_skill UNIQUE ("nodeId", "skillId")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_node_skills_node ON node_skills ("nodeId");
CREATE INDEX IF NOT EXISTS idx_node_skills_category ON node_skills (category);
CREATE INDEX IF NOT EXISTS idx_node_skills_active ON node_skills ("isActive");

-- 添加 updatedAt 自动更新触发器
CREATE OR REPLACE FUNCTION update_node_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_node_skills_updated_at ON node_skills;
CREATE TRIGGER trg_node_skills_updated_at
  BEFORE UPDATE ON node_skills
  FOR EACH ROW EXECUTE FUNCTION update_node_skills_updated_at();
