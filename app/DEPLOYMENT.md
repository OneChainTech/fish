# 部署配置指南

## 数据库配置

### 环境变量设置

在部署环境中，建议设置以下环境变量：

```bash
# 生产环境数据库路径
SQLITE_PATH=/tmp/fish.db

# 或者使用其他可写目录
SQLITE_PATH=/var/lib/fish/fish.db
```

### 部署平台特定配置

#### Vercel
```bash
# 在 Vercel 环境变量中设置
SQLITE_PATH=/tmp/fish.db
```

#### Railway
```bash
# 在 Railway 环境变量中设置
SQLITE_PATH=/tmp/fish.db
```

#### Docker
```dockerfile
# 在 Dockerfile 中创建数据目录
RUN mkdir -p /var/lib/fish
ENV SQLITE_PATH=/var/lib/fish/fish.db
```

### 备用方案

如果无法创建文件数据库，系统会自动降级到内存数据库：
- ✅ 功能正常，但数据不会持久化
- ✅ 适合临时部署或测试环境
- ⚠️ 重启后数据会丢失

### 推荐的生产环境配置

1. **使用外部数据库**（推荐）：
   - PostgreSQL
   - MySQL
   - MongoDB

2. **使用持久化存储**：
   - 设置 `SQLITE_PATH` 到可写目录
   - 确保目录权限正确

3. **监控和备份**：
   - 定期备份数据库文件
   - 监控磁盘空间使用
