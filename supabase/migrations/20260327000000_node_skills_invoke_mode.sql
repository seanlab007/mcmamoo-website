-- node_skills 扩展：支持 systemPrompt 注入 & invokeMode 分发
-- Migration: 20260327000000_node_skills_invoke_mode
-- Date: 2026-03-27

-- invokeMode:
--   'prompt'  (默认) — 命中后将 systemPrompt 注入到 MaoAI 对话的 system 消息，由 LLM 回答
--   'invoke'  — 命中后直接调用节点的 /skill/invoke，把执行结果 stream 给用户
-- systemPrompt: 当 invokeMode='prompt' 时，注入到对话的 system 指令
-- inputSchema:  JSON Schema，描述 skill 需要的参数（用于 invokeMode='invoke' 时 LLM 提取参数）

ALTER TABLE node_skills
  ADD COLUMN IF NOT EXISTS "invokeMode" VARCHAR(16) NOT NULL DEFAULT 'prompt',
  ADD COLUMN IF NOT EXISTS "systemPrompt" TEXT,
  ADD COLUMN IF NOT EXISTS "inputSchema" JSONB;

COMMENT ON COLUMN node_skills."invokeMode" IS 'prompt=注入系统提示词 | invoke=调用节点执行';
COMMENT ON COLUMN node_skills."systemPrompt" IS '命中时注入到 MaoAI system 消息的提示词（invokeMode=prompt 时生效）';
COMMENT ON COLUMN node_skills."inputSchema" IS 'JSON Schema describing skill parameters（invokeMode=invoke 时使用）';
