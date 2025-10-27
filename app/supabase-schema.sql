-- Supabase 数据库表结构
-- 请在 Supabase Dashboard 的 SQL Editor 中执行这些语句

-- 创建 user_profile 表
CREATE TABLE IF NOT EXISTS user_profile (
  phone TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建 user_progress 表
CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT PRIMARY KEY,
  collected_fish_ids TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建 user_marks 表
CREATE TABLE IF NOT EXISTS user_marks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  fish_id TEXT NOT NULL,
  address TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, fish_id, address)
);

-- 创建 user_feedback 表
CREATE TABLE IF NOT EXISTS user_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 300),
  reply_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replied_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_marks_user_fish ON user_marks(user_id, fish_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(user_id);

-- 启用行级安全策略 (RLS)
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略 - 允许所有操作（根据您的需求调整）
CREATE POLICY "Allow all operations on user_profile" ON user_profile FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_progress" ON user_progress FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_marks" ON user_marks FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_feedback" ON user_feedback FOR ALL USING (true);
