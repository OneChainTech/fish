/**
 * 监控采集逻辑已停用，保留占位用于后续扩展。
 *
 * 如需恢复，请参考历史版本恢复 Supabase 统计查询。
 */

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
  recentMarks: Array<{
    user_id: string;
    fish_id: string;
    address: string;
    recorded_at: string;
  }>;
};

export async function getUsageStats(): Promise<UsageStats> {
  console.warn("自建监控采集已停用，返回空数据。");
  return {
    totalUsers: 0,
    totalProgressRecords: 0,
    totalMarks: 0,
    topCollectedFish: [],
    recentProgress: [],
    recentMarks: [],
  };
}
