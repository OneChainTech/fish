"use client";

import { useCallback, useState } from "react";
import { useFishStore, type PendingMark } from "@/store/useFishStore";
import { useGlobalMarksCache } from "./useGlobalMarksCache";

export const MAX_MARKS_PER_FISH = 3;

export type LocationMark = {
  id: string;
  address: string;
  recordedAt: string;
};

export function useMarksSync(fishId: string) {
  const userId = useFishStore((state) => state.userId);
  const isLoggedIn = useFishStore((state) => state.isLoggedIn);
  const pendingMarks = useFishStore((state) => state.pendingMarks);
  const addPendingMark = useFishStore((state) => state.addPendingMark);
  const removePendingMark = useFishStore((state) => state.removePendingMark);
  const [marks, setMarks] = useState<LocationMark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 使用全局标记缓存
  const { getMarksForFish, addMarkToCache } = useGlobalMarksCache();

  // 从缓存或云端加载标点
  const loadMarks = useCallback(async (): Promise<LocationMark[]> => {
    if (!fishId) {
      return [];
    }

    if (!userId || !isLoggedIn) {
      setMarks([]);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);

    try {
      // 优先从缓存获取
      const cachedMarks = getMarksForFish(fishId);
      
      // 合并缓存标记和待保存标记
      const fishPendingMarks = pendingMarks
        .filter(mark => mark.fishId === fishId)
        .map(mark => ({
          id: mark.id,
          address: mark.address,
          recordedAt: mark.recordedAt
        }));
      
      // 去重：按地址去重，保留最新的
      const allMarksMap = new Map<string, LocationMark>();
      
      // 先添加缓存的标记
      cachedMarks.forEach(mark => {
        allMarksMap.set(mark.address, mark);
      });
      
      // 再添加待保存的标记（会覆盖重复地址的缓存标记）
      fishPendingMarks.forEach(mark => {
        allMarksMap.set(mark.address, mark);
      });
      
      const allMarks = Array.from(allMarksMap.values())
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
        .slice(0, MAX_MARKS_PER_FISH);
      
      if (allMarks.length > 0) {
        setMarks(allMarks);
        setIsLoading(false);
        return allMarks;
      }

      // 如果缓存中没有，从云端加载
      const response = await fetch(
        `/api/user/marks?userId=${encodeURIComponent(userId)}&fishId=${encodeURIComponent(fishId)}`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.marks)) {
          const mapped = data.marks.map((mark: { id: string; address: string; recorded_at: string }) => ({
            id: mark.id,
            address: mark.address,
            recordedAt: mark.recorded_at
          }));
          const sliced = mapped.slice(0, MAX_MARKS_PER_FISH);
          setMarks(sliced);
          return sliced;
        }
      }
    } catch (error) {
      console.warn("从云端加载标点失败", error);
    } finally {
      setIsLoading(false);
    }

    setMarks([]);
    return [];
  }, [fishId, isLoggedIn, userId, getMarksForFish]);

  // 保存标点到云端
  const saveRemoteMark = async (
    uid: string,
    fid: string,
    address: string
  ): Promise<LocationMark | null> => {
    try {
      const response = await fetch("/api/user/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, fishId: fid, address })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.mark && typeof data.mark.id === "string") {
          return {
            id: data.mark.id,
            address: data.mark.address,
            recordedAt: data.mark.recordedAt
          };
        }
      }
    } catch (error) {
      console.warn("保存标点到云端失败", error);
    }
    return null;
  };

  // 添加标点（本地操作）
  const addMark = async (address: string): Promise<LocationMark | null> => {
    if (!userId || !isLoggedIn) return null;

    const tempMark: LocationMark = {
      id: `temp-${Date.now()}`,
      address,
      recordedAt: new Date().toISOString()
    };

    // 创建待保存标记
    const pendingMark: PendingMark = {
      id: tempMark.id,
      fishId,
      address,
      recordedAt: tempMark.recordedAt,
      isPending: true
    };

    // 添加到待保存列表
    addPendingMark(pendingMark);

    // 更新本地显示
    setMarks((prev) => {
      const next = [tempMark, ...prev].slice(0, MAX_MARKS_PER_FISH);
      return next;
    });

    return tempMark;
  };

  return {
    marks,
    isLoading,
    loadMarks,
    addMark
  };
}
