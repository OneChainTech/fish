import { supabase, type UserProgress } from "@/lib/supabase";

export function parseCollectedFishIds(encoded: string | undefined): string[] {
  if (!encoded) return [];
  try {
    const parsed = JSON.parse(encoded);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string");
    }
  } catch (error) {
    console.warn("解析数据库收藏数据失败", error);
  }
  return [];
}

export async function getCollectedFishIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('collected_fish_ids')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return [];
      }
      throw error;
    }

    return parseCollectedFishIds(data?.collected_fish_ids);
  } catch (error) {
    console.error('获取用户进度失败:', error);
    return [];
  }
}

export async function saveCollectedFishIds(userId: string, payload: string, timestamp: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        collected_fish_ids: payload,
        updated_at: timestamp
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('保存用户进度失败:', error);
    throw error;
  }
}
