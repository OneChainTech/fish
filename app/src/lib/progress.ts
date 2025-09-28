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

export function parseCollectedFishIds(encoded: string | undefined) {
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

export function getCollectedFishIds(userId: string) {
  const record = selectStmt.get(userId);
  return parseCollectedFishIds(record?.collected_fish_ids);
}

export function saveCollectedFishIds(userId: string, payload: string, timestamp: string) {
  upsertStmt.run(userId, payload, timestamp);
}
