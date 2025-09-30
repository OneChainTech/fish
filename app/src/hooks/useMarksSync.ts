"use client";

import { useCallback, useState } from "react";
import { useFishStore } from "@/store/useFishStore";

export const MAX_MARKS_PER_FISH = 3;

export type LocationMark = {
  id: string;
  address: string;
  recordedAt: string;
};

export function useMarksSync(fishId: string) {
  const userId = useFishStore((state) => state.userId);
  const isLoggedIn = useFishStore((state) => state.isLoggedIn);
  const [marks, setMarks] = useState<LocationMark[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 从云端加载标点
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
  }, [fishId, isLoggedIn, userId]);

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

  // 添加标点
  const addMark = async (address: string): Promise<LocationMark | null> => {
    if (!userId || !isLoggedIn) return null;

    const tempMark: LocationMark = {
      id: `temp-${Date.now()}`,
      address,
      recordedAt: new Date().toISOString()
    };

    // 先更新本地状态，如果超过限制则自动删除最旧的
    setMarks((prev) => {
      const next = [tempMark, ...prev].slice(0, MAX_MARKS_PER_FISH);
      return next;
    });

    const remoteMark = await saveRemoteMark(userId, fishId, address);
    if (remoteMark) {
      setMarks((prev) => {
        const filtered = prev.filter((mark) => mark.id !== tempMark.id);
        const next = [remoteMark, ...filtered].slice(0, MAX_MARKS_PER_FISH);
        return next;
      });
      return remoteMark;
    }

    return tempMark;
  };

  return {
    marks,
    isLoading,
    loadMarks,
    addMark
  };
}
