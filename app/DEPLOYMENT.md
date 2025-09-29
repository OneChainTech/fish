# 部署配置指南

## 数据库配置

### 环境变量设置

在部署环境中，建议设置以下环境变量：

```bash
# Supabase 配置（推荐用于生产环境）
NEXT_PUBLIC_SUPABASE_URL=https://yaxnoxulndieokgcprbx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheG5veHVsbmRpZW9rZ2NwcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTExNzgsImV4cCI6MjA3NDY4NzE3OH0.IVtY6KCRubhty9l2HBHVOmfkOGaS6Fa0DLiexNsdsIs

# 数据库选择（可选，默认为 Supabase）
USE_SUPABASE=true

# 传统 SQLite 配置（已弃用，仅用于开发环境）
SQLITE_PATH=/tmp/fish.db
```

### 部署平台特定配置

#### Vercel
```bash
# 在 Vercel 环境变量中设置
NEXT_PUBLIC_SUPABASE_URL=https://yaxnoxulndieokgcprbx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheG5veHVsbmRpZW9rZ2NwcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTExNzgsImV4cCI6MjA3NDY4NzE3OH0.IVtY6KCRubhty9l2HBHVOmfkOGaS6Fa0DLiexNsdsIs
USE_SUPABASE=true
```

#### Railway
```bash
# 在 Railway 环境变量中设置
NEXT_PUBLIC_SUPABASE_URL=https://yaxnoxulndieokgcprbx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheG5veHVsbmRpZW9rZ2NwcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTExNzgsImV4cCI6MjA3NDY4NzE3OH0.IVtY6KCRubhty9l2HBHVOmfkOGaS6Fa0DLiexNsdsIs
USE_SUPABASE=true
```

#### Docker
```dockerfile
# 在 Dockerfile 中设置环境变量
ENV NEXT_PUBLIC_SUPABASE_URL=https://yaxnoxulndieokgcprbx.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheG5veHVsbmRpZW9rZ2NwcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTExNzgsImV4cCI6MjA3NDY4NzE3OH0.IVtY6KCRubhty9l2HBHVOmfkOGaS6Fa0DLiexNsdsIs
ENV USE_SUPABASE=true
```

### 备用方案

如果无法创建文件数据库，系统会自动降级到内存数据库：
- ✅ 功能正常，但数据不会持久化
- ✅ 适合临时部署或测试环境
- ⚠️ 重启后数据会丢失

### 推荐的生产环境配置

1. **使用 Supabase**（推荐）：
   - 云托管的 PostgreSQL 数据库
   - 自动备份和扩展
   - 内置认证和实时功能
   - 设置环境变量 `USE_SUPABASE=true`

2. **使用传统 SQLite**（仅开发环境）：
   - 设置 `SQLITE_PATH` 到可写目录
   - 确保目录权限正确
   - 定期备份数据库文件

3. **监控和备份**：
   - Supabase 提供自动备份
   - 监控数据库性能
   - 设置适当的 RLS 策略
