# 鱼眼 · 图鉴识鱼应用

基于 Next.js 15 与 React 19 打造的移动优先 Web 应用，通过拍照识鱼、自动匹配图鉴并记录匿名收藏进度，帮助垂钓或自然爱好者构建个人水域图谱。识别能力由智谱多模态模型 **zai-org/GLM-4.5V** 提供，静态图鉴涵盖淡水与海水鱼类（含河豚、鲅鱼等常见品种）。

## 功能亮点

- `鱼眼` 拍照识别：上传或拍摄图片后自动调用 AI 模型输出鱼种、置信度与科属简介。
- 图鉴收集体系：浏览插画化鱼类卡片，成功识别即可解锁条目并获得庆祝动画反馈。
- 匿名进度同步：以用户 ID 记录收藏列表，默认使用 SQLite，可无缝替换任意持久化方案。
- 友好本地化体验：全量中文界面，提供钓鱼小贴士、低置信度提示等场景化文案。

## 技术栈

- Next.js 15（App Router、Server Components）
- React 19 + Turbopack 开发预览
- Tailwind CSS 4（原子化样式）
- Zustand 轻量状态管理
- better-sqlite3 存储匿名收藏进度

## 快速开始

```bash
npm install
cp .env.local.example .env.local # 写入实际的 SILICONFLOW_API_KEY（若已存在可跳过）
npm run dev
```

开发服务器默认监听 <http://localhost:3000> ，首页自动进入"鱼眼"拍照识别页。

## 目录结构速览

- `src/app/identify`：识别流程、拍照/上传 UI、结果展示
- `src/app/encyclopedia`：图鉴列表、详情弹层与收集进度
- `src/app/api/recognize`：封装智谱模型调用的服务端路由
- `src/app/api/user`：匿名用户收藏进度增删改查接口
- `src/components`：布局、导航与通用交互组件
- `src/data/fish-list.ts`：静态鱼类数据源（含学名、体长、栖息地等）
- `public/images/fish`：图鉴插画资源，文件名与 `fish-list` 的 `image` 字段保持一致

## 环境变量

| 变量 | 说明 |
| ---- | ---- |
| `SILICONFLOW_API_KEY` | 智谱 SiliconFlow 平台 API Key，用于访问 `zai-org/GLM-4.5V` 模型 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |

> 以上变量仅在服务端使用，不会被注入客户端。

## 数据库配置

### Supabase 设置

本应用使用 Supabase PostgreSQL 数据库进行数据存储，提供云端同步和自动备份功能。

#### 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目
3. 获取项目 URL 和匿名密钥

#### 2. 创建数据库表

在 Supabase SQL Editor 中执行以下脚本：

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

-- 创建 RLS 策略
CREATE POLICY "Allow all operations on user_profile" ON user_profile FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_progress" ON user_progress FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_marks" ON user_marks FOR ALL USING (true);
```

#### 3. 部署平台配置

##### Vercel

```bash
# 在 Vercel 环境变量中设置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

##### Railway

```bash
# 在 Railway 环境变量中设置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

##### Docker

```dockerfile
# 在 Dockerfile 中设置环境变量
ENV NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 核心识别流程

1. 前端将图片转换为 base64 字符串，向 `/api/recognize` 发起 POST 请求。
2. Serverless 路由封装智谱多模态调用，强制模型返回结构化 JSON。
3. 典型响应：

```json
{
  "status": "ok",
  "name_cn": "大口黑鲈",
  "name_lat": "Micropterus salmoides",
  "family": "太阳鱼科",
  "description": "掠食性鱼类……",
  "confidence": 0.86
}
```

- 识别失败或置信度不足时返回 `{ "status": "unrecognized", "reason": "…" }`。
- 前端依据 `confidence`（默认阈值 0.6，可在 `components/identify/RecognitionSummary.tsx` 调整）及鱼种别名匹配判断是否解锁，并通过 `/api/user` 写入最新收藏列表。

## 图鉴数据维护

- 新增鱼类时，将插画放入 `public/images/fish`，并在 `src/data/fish-list.ts` 添加条目（`id`、学名、科属、典型体长、栖息地、稀有度等）。
- 典型体长与描述基于公开资料，可按需调整；若模型识别出了新的鱼种，记得同步更新列表以确保匹配成功。
- 如需拓展多语言或更多字段，可在 `FishEntry` 类型中扩展属性。

## 进度同步接口

- `GET /api/user?userId=xxx`：返回 `{ collectedFishIds: string[] }`，若不存在则自动初始化。
- `POST /api/user`：请求体 `{ userId: string, collectedFishIds: string[] }`，服务端会去重后存储。
- 使用 Supabase PostgreSQL 存储，支持云端同步和自动备份。

## 错误处理与用户提示

- 输入校验：缺少图片或格式不合法直接返回 400。
- 模型调用失败：若上游返回非 2xx，将响应 502 并输出详细日志。
- JSON 解析失败：返回 500，便于调试提示词或格式化逻辑。
- 前端 UI：对网络异常、低置信度与未匹配鱼种提供显著提示与重试引导。

## 调试与测试

- `npm run lint`：执行 ESLint 代码规范检查。
- 建议补充：
  - 使用 Playwright/Cypress 覆盖上传、识别、解锁的完整用户路径。
  - 为 `src/lib/fish-utils.ts` 编写单元测试，校验别名匹配与大小写处理。
  - Mock 智谱接口，对 `/api/recognize` 进行集成测试，覆盖成功、失败与格式异常场景。

## 部署建议

- 推荐部署至 Vercel，默认 Serverless 函数即可承载识别请求。
- 生产环境需开启 HTTPS、请求限流与缓存策略，避免接口被滥用。
- Supabase 提供自动备份、扩展性和实时功能，适合生产环境使用。
- 监控数据库性能，设置适当的 RLS 策略确保数据安全。
