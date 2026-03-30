-- ============================================================
-- Supabase Migration: RBAC 权限系统 + 私密笔记表
-- ============================================================

-- 1. 扩展 auth.users 表，添加用户角色和订阅状态
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'vip', 'admin'));
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'vip', 'admin'));
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. 创建用户资料表（profiles）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'vip', 'admin')),
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'vip', 'admin')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建私密笔记表（notes）
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. 创建笔记分享表（note_shares）- 用于管理员共享笔记给其他用户
CREATE TABLE IF NOT EXISTS note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建 MaoAI 功能表（maoai_features）
CREATE TABLE IF NOT EXISTS maoai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_data JSONB,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建内容平台表（content_platform）
CREATE TABLE IF NOT EXISTS content_platform (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_title TEXT NOT NULL,
  content_body TEXT,
  content_type TEXT DEFAULT 'article',
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 创建 RLS 策略（行级安全）

-- 7.1 profiles 表的 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- 7.2 notes 表的 RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notes"
  ON notes FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- 7.3 note_shares 表的 RLS
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares of their notes"
  ON note_shares FOR SELECT
  USING (
    auth.uid() = shared_by_user_id OR 
    auth.uid() = shared_with_user_id
  );

CREATE POLICY "Users can create shares for their notes"
  ON note_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by_user_id);

-- 7.4 maoai_features 表的 RLS
ALTER TABLE maoai_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own features"
  ON maoai_features FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own features"
  ON maoai_features FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own features"
  ON maoai_features FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all features"
  ON maoai_features FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- 7.5 content_platform 表的 RLS
ALTER TABLE content_platform ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content"
  ON content_platform FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create content"
  ON content_platform FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content"
  ON content_platform FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "VIP and admin users can view published content"
  ON content_platform FOR SELECT
  USING (
    is_published = TRUE AND 
    (
      (SELECT subscription_status FROM profiles WHERE id = auth.uid()) IN ('vip', 'admin')
    )
  );

-- 8. 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maoai_features_user_id ON maoai_features(user_id);
CREATE INDEX IF NOT EXISTS idx_content_platform_user_id ON content_platform(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 9. 创建触发器自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maoai_features_updated_at
  BEFORE UPDATE ON maoai_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_platform_updated_at
  BEFORE UPDATE ON content_platform
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
