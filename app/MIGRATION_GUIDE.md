# 数据库迁移指南：从 SQLite 到 Supabase

## 概述

本指南将帮助您将应用程序从 SQLite 数据库迁移到 Supabase PostgreSQL 数据库。

## 迁移步骤

### 1. 在 Supabase 中创建数据库表

1. 登录到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 **SQL Editor**
4. 执行以下 SQL 脚本：

```sql
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_marks_user_fish ON user_marks(user_id, fish_id);

-- 启用行级安全策略 (RLS)
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_marks ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略 - 允许所有操作（根据您的需求调整）
CREATE POLICY "Allow all operations on user_profile" ON user_profile FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_progress" ON user_progress FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_marks" ON user_marks FOR ALL USING (true);
```

### 2. 设置环境变量

在您的部署环境中设置以下环境变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://yaxnoxulndieokgcprbx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheG5veHVsbmRpZW9rZ2NwcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTExNzgsImV4cCI6MjA3NDY4NzE3OH0.IVtY6KCRubhty9l2HBHVOmfkOGaS6Fa0DLiexNsdsIs

# 启用 Supabase（可选，默认为 true）
USE_SUPABASE=true
```

### 3. 数据迁移（可选）

如果您有现有的 SQLite 数据需要迁移，可以：

1. 导出 SQLite 数据
2. 转换为 Supabase 格式
3. 使用 Supabase API 或 Dashboard 导入数据

### 4. 测试迁移

1. 启动应用程序
2. 测试用户注册和登录
3. 测试鱼类收集功能
4. 测试标记功能
5. 验证数据持久化

## 迁移后的优势

- ✅ **云托管**：无需管理数据库服务器
- ✅ **自动备份**：Supabase 提供自动备份
- ✅ **扩展性**：支持高并发访问
- ✅ **安全性**：内置行级安全策略
- ✅ **实时功能**：支持实时数据同步
- ✅ **监控**：内置性能监控

## 回滚计划

如果需要回滚到 SQLite：

1. 设置环境变量 `USE_SUPABASE=false`
2. 确保 SQLite 数据库文件存在
3. 重启应用程序

## 注意事项

- 确保 Supabase 项目的 RLS 策略配置正确
- 监控数据库使用量和性能
- 定期备份重要数据
- 考虑设置适当的 API 限制

## 支持

如果遇到问题，请检查：
1. 环境变量是否正确设置
2. Supabase 项目是否正常运行
3. 网络连接是否正常
4. 查看应用程序日志获取详细错误信息
