# 鱼类识别图鉴 H5 应用

基于 Next.js 14 构建的单页应用，支持拍照识鱼、匹配本地图鉴并记录匿名收集进度。识别能力由智谱多模态模型 **zai-org/GLM-4.5V** 提供。

## 快速开始

```bash
npm install
cp .env.local.example .env.local # 并写入实际的 SILICONFLOW_API_KEY（已填写可忽略）
npm run dev
```

默认运行在 http://localhost:3000，首页自动跳转到“拍照识鱼”模块。

## 目录结构

- `src/app/identify`：拍照识别页面，包含上传、预览与识别流程
- `src/app/encyclopedia`：图鉴展示页面及详情弹层
- `src/app/api/recognize`：服务端路由，封装对智谱 GLM-4.5V 的调用
- `src/app/api/user`：匿名用户收集进度读写接口（默认落地到 SQLite，可替换为其他数据库）
- `src/components`：通用 UI、布局与识别结果展示组件
- `src/data/fish-list.ts`：静态鱼种数据源（含图片、别名、描述等）
- `public/images/fish`：图鉴插画资源

## 环境变量

| 变量 | 说明 |
| ---- | ---- |
| `SILICONFLOW_API_KEY` | 智谱 SiliconFlow 平台的 API Key，用于访问 `zai-org/GLM-4.5V` 模型 |
| `SQLITE_PATH` (可选) | 指定 SQLite 数据库存储路径，默认 `var/fish.db` |

> 该变量仅在服务端使用，不会下发到浏览器。

## 调用流程

1. 前端将图片转换为 base64 字符串后，POST `/api/recognize`。
2. Serverless 路由构造智谱多模态聊天请求，强制模型返回 JSON。
3. 返回体示例：

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

- 当模型无法识别或置信度不足时，返回 `{ "status": "unrecognized", "reason": "…" }`。
- 前端根据 `confidence` 与图鉴别名匹配决定是否解锁（阈值 0.6，可在 `RecognitionSummary.tsx` 调整），并通过 `/api/user` 持久化最新进度。

## 匿名进度接口

- `GET /api/user?userId=xxx`：返回 `{ collectedFishIds: string[] }`，若无记录自动初始化为空数组。
- `POST /api/user`：请求体 `{ userId: string, collectedFishIds: string[] }`，服务端会去重并更新时间戳。
- 当前实现基于 SQLite 数据库（默认文件位于 `var/fish.db`），适合单机或本地开发。部署生产时，可将该模块替换为 Vercel KV、Supabase、PlanetScale 等托管存储方案。

## 错误处理

- **输入校验**：缺少图片或格式错误直接返回 400。
- **模型调用失败**：上游 HTTP 非 2xx 时返回 502，并在日志输出原始响应。
- **格式异常**：模型未按 JSON 格式输出时返回 500，便于后续优化提示词。
- **前端提示**：网络异常、低置信度与未匹配鱼种均有对应 UI 提示。

## 测试与质量保障

- `npm run lint`：执行 ESLint（默认随 CI 运行）。
- 建议补充以下自动化流程：
  - 使用 Playwright 模拟上传流程，验证识别成功与失败提示。
  - 为 `src/lib/fish-utils.ts` 编写单元测试，确保别名匹配准确。
  - 针对 `/api/recognize` 编写集成测试，Mock 智谱返回值覆盖多种状态。

## 部署建议

- 推荐部署至 Vercel，默认 Serverless 函数即可满足调用需求。
- 生产环境请开启 HTTPS、配置请求速率限制，避免滥用识别接口。
- 生产环境建议结合业务规模选择托管数据库或 KV 服务，并配合匿名 ID/登录体系实现跨设备同步。
