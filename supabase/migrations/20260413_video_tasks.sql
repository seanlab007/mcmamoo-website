-- MaoAI 内容平台视频任务表
-- 用于持久化存储视频合成任务状态，支持离线查询

CREATE TABLE IF NOT EXISTS video_tasks (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(100) UNIQUE NOT NULL,
  user_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- 任务参数
  image_paths TEXT[],          -- JSON 数组存储图片路径
  audio_path VARCHAR(500),
  srt_path VARCHAR(500),
  bgm_path VARCHAR(500),
  output_path VARCHAR(500),
  
  -- 执行结果
  result_url VARCHAR(500),     -- 合成后视频 URL
  error_message TEXT,
  
  -- 元数据
  trigger_type VARCHAR(20) DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'api')),
  triggered_by VARCHAR(100),
  
  -- 时间戳
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_video_tasks_task_id ON video_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_video_tasks_user_id ON video_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON video_tasks(status);
CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at ON video_tasks(created_at DESC);

-- RLS 策略
ALTER TABLE video_tasks ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的任务
CREATE POLICY "users_view_own_tasks" ON video_tasks
  FOR SELECT USING (
    triggered_by = auth.uid()::text 
    OR auth.jwt()->>'role' = 'admin'
  );

-- 服务端可插入任务
CREATE POLICY "service_insert_tasks" ON video_tasks
  FOR INSERT WITH CHECK (true);

-- 服务端可更新任务
CREATE POLICY "service_update_tasks" ON video_tasks
  FOR UPDATE USING (true);
