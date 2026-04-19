-- ============================================
-- FaceFusion 数据库架构
-- 猫眼内容平台 - AI 面部融合模块
-- ============================================

-- 1. 创建 facefusion_tasks 表
CREATE TABLE IF NOT EXISTS public.facefusion_tasks (
    id UUID DEFAULT gen_random_uuid(),
    task_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    mode VARCHAR(50) NOT NULL DEFAULT 'face_swap',
    status VARCHAR(50) NOT NULL DEFAULT 'idle',
    progress INTEGER DEFAULT 0,

    -- 输入文件
    source_image TEXT,
    target_image TEXT,
    target_video TEXT,

    -- 配置
    face_masker VARCHAR(50),
    face_enhancer_model VARCHAR(50),
    lip_syncer_model VARCHAR(50),

    -- 输出
    result_url TEXT,
    error TEXT,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- RLS
    created_by UUID REFERENCES auth.users(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ff_tasks_user_id ON public.facefusion_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ff_tasks_status ON public.facefusion_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ff_tasks_created_at ON public.facefusion_tasks(created_at DESC);

-- RLS 策略
ALTER TABLE public.facefusion_tasks ENABLE ROW LEVEL SECURITY;

-- 用户只能看自己的任务
CREATE POLICY "Users can view own tasks" ON public.facefusion_tasks
    FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

-- 用户只能创建自己的任务
CREATE POLICY "Users can create own tasks" ON public.facefusion_tasks
    FOR INSERT WITH CHECK (auth.uid() = created_by OR auth.uid() IS NULL);

-- 用户只能更新自己的任务
CREATE POLICY "Users can update own tasks" ON public.facefusion_tasks
    FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

-- 用户只能删除自己的任务
CREATE POLICY "Users can delete own tasks" ON public.facefusion_tasks
    FOR DELETE USING (auth.uid() = created_by);

-- 2. 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ff_tasks_updated_at
    BEFORE UPDATE ON public.facefusion_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. 创建保存任务的函数
CREATE OR REPLACE FUNCTION save_facefusion_task(
    p_task_id VARCHAR,
    p_user_id VARCHAR DEFAULT NULL,
    p_mode VARCHAR DEFAULT 'face_swap',
    p_source_image TEXT DEFAULT NULL,
    p_target_image TEXT DEFAULT NULL,
    p_target_video TEXT DEFAULT NULL,
    p_status VARCHAR DEFAULT 'idle',
    p_progress INTEGER DEFAULT 0,
    p_result_url TEXT DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_task_id_var VARCHAR;
BEGIN
    SELECT task_id INTO v_task_id_var FROM public.facefusion_tasks WHERE task_id = p_task_id;

    IF v_task_id_var IS NOT NULL THEN
        UPDATE public.facefusion_tasks SET
            status = COALESCE(p_status, status),
            progress = COALESCE(p_progress, progress),
            result_url = COALESCE(p_result_url, result_url),
            error = COALESCE(p_error, error),
            updated_at = NOW(),
            completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END
        WHERE task_id = p_task_id;
        RETURN NULL;
    ELSE
        INSERT INTO public.facefusion_tasks (
            task_id, user_id, mode, source_image, target_image, target_video,
            status, progress, result_url, error
        ) VALUES (
            p_task_id, p_user_id, p_mode, p_source_image, p_target_image, p_target_video,
            p_status, p_progress, p_result_url, p_error
        )
        RETURNING id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 授予权限
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.facefusion_tasks TO anon, authenticated, service_role;
GRANT ALL ON public.facefusion_tasks_id_seq TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION save_facefusion_task TO anon, authenticated, service_role;
