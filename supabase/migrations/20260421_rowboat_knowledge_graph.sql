-- ============================================================
-- Rowboat 知识图谱 + 语义记忆 Supabase Migration
-- ============================================================
-- 执行: npx supabase db push 或手动在 Supabase SQL Editor 执行
-- ============================================================

-- ── 1. 语义记忆表 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rowboat_memories (
  id          TEXT        PRIMARY KEY,
  user_id     TEXT        NOT NULL DEFAULT 'anonymous',
  session_id  TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  entities    JSONB       DEFAULT '[]',
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_rowboat_memories_user_id  ON public.rowboat_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_rowboat_memories_created ON public.rowboat_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rowboat_memories_content ON public.rowboat_memories USING gin(to_tsvector('zhconfig', content));

COMMENT ON TABLE public.rowboat_memories IS 'Rowboat 语义记忆存储表';
COMMENT ON COLUMN public.rowboat_memories.entities IS '提取的实体数组 [{id, name, type, confidence, context}]';

-- ── 2. 知识图谱节点表 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rowboat_graph (
  id           TEXT        PRIMARY KEY,
  user_id      TEXT        NOT NULL DEFAULT 'anonymous',
  name         TEXT        NOT NULL,
  entity_type  TEXT        NOT NULL,  -- person | organization | technology | date | concept | other
  properties   JSONB       DEFAULT '{}',
  weight       INTEGER     DEFAULT 1, -- 出现频次，影响节点大小
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rowboat_graph_user_id   ON public.rowboat_graph(user_id);
CREATE INDEX IF NOT EXISTS idx_rowboat_graph_type     ON public.rowboat_graph(entity_type);
CREATE INDEX IF NOT EXISTS idx_rowboat_graph_weight    ON public.rowboat_graph(weight DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rowboat_graph_user_name ON public.rowboat_graph(user_id, name);

COMMENT ON TABLE public.rowboat_graph IS 'Rowboat 知识图谱节点表';

-- ── 3. 知识图谱关系边表 ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rowboat_graph_edges (
  id          TEXT        PRIMARY KEY,
  user_id     TEXT        NOT NULL DEFAULT 'anonymous',
  source_id   TEXT        NOT NULL REFERENCES public.rowboat_graph(id) ON DELETE CASCADE,
  target_id   TEXT        NOT NULL REFERENCES public.rowboat_graph(id) ON DELETE CASCADE,
  edge_type   TEXT        NOT NULL DEFAULT 'relates_to',
  weight      INTEGER     DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rowboat_graph_edges_user    ON public.rowboat_graph_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_rowboat_graph_edges_source  ON public.rowboat_graph_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_rowboat_graph_edges_target  ON public.rowboat_graph_edges(target_id);

COMMENT ON TABLE public.rowboat_graph_edges IS 'Rowboat 知识图谱关系边表';

-- ── 4. RLS 策略 ───────────────────────────────────────────
ALTER TABLE public.rowboat_memories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rowboat_graph       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rowboat_graph_edges ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "rowboat_memories_user_policy" ON public.rowboat_memories
  FOR ALL USING (user_id = current_user_id() OR user_id = 'anonymous');

CREATE POLICY "rowboat_graph_user_policy" ON public.rowboat_graph
  FOR ALL USING (user_id = current_user_id() OR user_id = 'anonymous');

CREATE POLICY "rowboat_graph_edges_user_policy" ON public.rowboat_graph_edges
  FOR ALL USING (user_id = current_user_id() OR user_id = 'anonymous');

-- ── 5. 辅助函数 ───────────────────────────────────────────
-- 节点权重递增函数
CREATE OR REPLACE FUNCTION public.increment_node_weight(node_id TEXT, delta INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
  UPDATE public.rowboat_graph
  SET weight = weight + delta, updated_at = NOW()
  WHERE id = node_id
  RETURNING weight;
$$ LANGUAGE SQL SECURITY DEFINER;
