import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

const db = getDb();
const selectStmt = db.prepare<
  [string],
  { collected_fish_ids: string } | undefined
>("SELECT collected_fish_ids FROM user_progress WHERE user_id = ?");

const upsertStmt = db.prepare<
  [string, string, string]
>(
  `INSERT INTO user_progress (user_id, collected_fish_ids, updated_at)
   VALUES (?, ?, ?)
   ON CONFLICT(user_id) DO UPDATE SET
     collected_fish_ids = excluded.collected_fish_ids,
     updated_at = excluded.updated_at`
);

function parseIds(encoded: string | undefined) {
  if (!encoded) return [] as string[];
  try {
    const parsed = JSON.parse(encoded);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string");
    }
  } catch (error) {
    console.warn("解析数据库收藏数据失败", error);
  }
  return [] as string[];
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "缺少 userId 参数" }, { status: 400 });
  }

  const record = selectStmt.get(userId);
  const collected = parseIds(record?.collected_fish_ids);

  return Response.json({ collectedFishIds: collected });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const userId = data?.userId;
    const collectedFishIds = Array.isArray(data?.collectedFishIds)
      ? (data.collectedFishIds as string[])
      : null;

    if (!userId || !collectedFishIds) {
      return Response.json(
        { error: "请求需包含 userId 与 collectedFishIds[]" },
        { status: 400 }
      );
    }

    const sanitized = Array.from(
      new Set(collectedFishIds.filter((item: string) => typeof item === "string" && item.trim().length > 0))
    );

    const payload = JSON.stringify(sanitized);
    const now = new Date().toISOString();

    upsertStmt.run(userId, payload, now);

    return Response.json({ success: true });
  } catch (error) {
    console.error("更新用户进度失败", error);
    return Response.json({ error: "更新失败" }, { status: 500 });
  }
}
