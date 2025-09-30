"use client";

import { useCallback, useEffect } from "react";
import { useFishStore, type LocationMark } from "@/store/useFishStore";

export type PendingMark = {
  id: string;
  fishId: string;
  address: string;
  recordedAt: string;
  isPending: boolean;
};

export function useGlobalMarksCache() {
  const userId = useFishStore((state) => state.userId);
  const isLoggedIn = useFishStore((state) => state.isLoggedIn);
  const marksCache = useFishStore((state) => state.marksCache);
  const marksCacheLoaded = useFishStore((state) => state.marksCacheLoaded);
  const setMarksCache = useFishStore((state) => state.setMarksCache);
  const setMarksCacheLoaded = useFishStore((state) => state.setMarksCacheLoaded);
  const clearMarksCache = useFishStore((state) => state.clearMarksCache);

  // 加载所有标记数据
  const loadAllMarks = useCallback(async (): Promise<void> => {
    if (!userId || !isLoggedIn || marksCacheLoaded) {
      return;
    }

    try {
      const response = await fetch(
        `/api/user/marks?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.marks)) {
          // 按 fishId 分组标记
          const marksByFish: Record<string, LocationMark[]> = {};
          
          data.marks.forEach((mark: { id: string; fish_id: string; address: string; recorded_at: string }) => {
            if (!marksByFish[mark.fish_id]) {
              marksByFish[mark.fish_id] = [];
            }
            marksByFish[mark.fish_id].push({
              id: mark.id,
              address: mark.address,
              recordedAt: mark.recorded_at
            });
          });

          // 按时间排序并限制每个鱼类最多3个标记
          Object.keys(marksByFish).forEach(fishId => {
            const sortedMarks = marksByFish[fishId]
              .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
              .slice(0, 3);
            setMarksCache(fishId, sortedMarks);
          });

          setMarksCacheLoaded(true);
        }
      }
    } catch (error) {
      console.warn("加载全局标记缓存失败", error);
    }
  }, [userId, isLoggedIn, marksCacheLoaded, setMarksCache, setMarksCacheLoaded]);

  // 获取特定鱼类的标记
  const getMarksForFish = useCallback((fishId: string): LocationMark[] => {
    return marksCache[fishId] || [];
  }, [marksCache]);

  // 添加标记到缓存
  const addMarkToCache = useCallback((fishId: string, mark: LocationMark) => {
    const existingMarks = marksCache[fishId] || [];
    const newMarks = [mark, ...existingMarks].slice(0, 3); // 保持最多3个
    setMarksCache(fishId, newMarks);
  }, [marksCache, setMarksCache]);

  // 用户登出时清空缓存
  useEffect(() => {
    if (!isLoggedIn) {
      clearMarksCache();
    }
  }, [isLoggedIn, clearMarksCache]);

  return {
    marksCache,
    marksCacheLoaded,
    loadAllMarks,
    getMarksForFish,
    addMarkToCache,
  };
}
