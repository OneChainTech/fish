import { fishList } from "@/data/fish-list";
import { parseCollectedFishIds } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

type ProgressRow = {
  user_id: string;
  collected_fish_ids: string | null;
  updated_at: string | null;
};

type MarkRow = {
  user_id: string;
  fish_id: string;
  address: string;
  recorded_at: string;
};

export type UsageStats = {
  totalUsers: number;
  totalProgressRecords: number;
  totalMarks: number;
  topCollectedFish: {
    fishId: string;
    name: string;
    count: number;
    rarity: string;
  }[];
  recentProgress: {
    userId: string;
    collectedCount: number;
    updatedAt: string | null;
  }[];
  recentMarks: MarkRow[];
};

function mapFishName(fishId: string): { name: string; rarity: string } {
  const fish = fishList.find((item) => item.id === fishId);
  if (!fish) {
    return { name: fishId, rarity: "未知" };
  }
  return { name: fish.name_cn, rarity: fish.rarity };
}

export async function getUsageStats(): Promise<UsageStats> {
  try {
    const [usersCountRes, progressRes, marksCountRes, recentMarksRes] = await Promise.all([
      supabase.from("user_profile").select("phone", { count: "exact", head: true }),
      supabase
        .from("user_progress")
        .select("user_id, collected_fish_ids, updated_at", { count: "exact" })
        .order("updated_at", { ascending: false }),
      supabase.from("user_marks").select("id", { count: "exact", head: true }),
      supabase
        .from("user_marks")
        .select("user_id, fish_id, address, recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(10),
    ]);

    const progressRows = (progressRes.data as ProgressRow[] | null) ?? [];
    const progressCount = progressRes.count ?? progressRows.length;

    const fishCounter = new Map<string, number>();
    const recentProgress = progressRows
      .map((row) => {
        const collected = parseCollectedFishIds(row.collected_fish_ids ?? undefined);
        collected.forEach((fishId) => {
          fishCounter.set(fishId, (fishCounter.get(fishId) ?? 0) + 1);
        });
        return {
          userId: row.user_id,
          collectedCount: collected.length,
          updatedAt: row.updated_at,
        };
      })
      .sort((a, b) => {
        const timeA = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const timeB = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return timeB - timeA;
      })
      .slice(0, 8);

    const topCollectedFish = Array.from(fishCounter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([fishId, count]) => {
        const meta = mapFishName(fishId);
        return {
          fishId,
          name: meta.name,
          rarity: meta.rarity,
          count,
        };
      });

    return {
      totalUsers: usersCountRes.count ?? 0,
      totalProgressRecords: progressCount,
      totalMarks: marksCountRes.count ?? 0,
      topCollectedFish,
      recentProgress,
      recentMarks: (recentMarksRes.data as MarkRow[] | null) ?? [],
    };
  } catch (error) {
    console.error("获取监控数据失败", error);
    return {
      totalUsers: 0,
      totalProgressRecords: 0,
      totalMarks: 0,
      topCollectedFish: [],
      recentProgress: [],
      recentMarks: [],
    };
  }
}
