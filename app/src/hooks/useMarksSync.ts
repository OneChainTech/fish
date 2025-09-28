"use client";

import { useEffect, useState } from "react";
import { useFishStore } from "@/store/useFishStore";

export type LocationMark = {
  id: string;
  address: string;
  recordedAt: string;
};

function getLocalMarksKey(userId: string, fishId: string) {
  return `fish-marks-${userId}-${fishId}`;
}

export function useMarksSync(fishId: string) {
  const userId = useFishStore((state) => state.userId);
  const isLoggedIn = useFishStore((state) => state.isLoggedIn);
  const [marks, setMarks] = useState<LocationMark[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 从本地存储加载标点
  const loadLocalMarks = (uid: string, fid: string): LocationMark[] => {
    if (typeof window === "undefined") return [];
    try {
      const key = getLocalMarksKey(uid, fid);
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is LocationMark => 
          item && 
          typeof item.id === "string" && 
          typeof item.address === "string" && 
          typeof item.recordedAt === "string"
        );
      }
    } catch (e) {
      console.warn("读取本地标点失败", e);
    }
    return [];
  };

  // 保存到本地存储
  const saveLocalMarks = (uid: string, fid: string, newMarks: LocationMark[]) => {
    if (typeof window === "undefined") return;
    try {
      const key = getLocalMarksKey(uid, fid);
      window.localStorage.setItem(key, JSON.stringify(newMarks.slice(0, 2)));
    } catch (e) {
      console.warn("写入本地标点失败", e);
    }
  };

  // 从云端加载标点
  const loadRemoteMarks = async (uid: string, fid: string): Promise<LocationMark[]> => {
    try {
      const response = await fetch(
        `/api/user/marks?userId=${encodeURIComponent(uid)}&fishId=${encodeURIComponent(fid)}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.marks)) {
          return data.marks.map((mark: { id: string; address: string; recorded_at: string }) => ({
            id: mark.id,
            address: mark.address,
            recordedAt: mark.recorded_at
          }));
        }
      }
    } catch (error) {
      console.warn("从云端加载标点失败", error);
    }
    return [];
  };

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

  // 初始化加载
  useEffect(() => {
    if (!userId || !fishId) return;

    if (!isLoggedIn) {
      setMarks([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadMarks = async () => {
      setIsLoading(true);

      try {
        const localMarks = loadLocalMarks(userId, fishId);
        if (!cancelled && localMarks.length > 0) {
          setMarks(localMarks);
        }

        const remoteResponse = await loadRemoteMarks(userId, fishId);
        if (cancelled) return;

        if (remoteResponse.length > 0) {
          setMarks(remoteResponse);
          saveLocalMarks(userId, fishId, remoteResponse);
        } else if (localMarks.length > 0) {
          // 保留已有的本地缓存，避免覆盖掉离线记录
          saveLocalMarks(userId, fishId, localMarks);
        } else {
          setMarks([]);
          saveLocalMarks(userId, fishId, []);
        }
      } catch (error) {
        if (cancelled) return;
        console.warn("加载标点失败，回退到本地", error);
        const localMarks = loadLocalMarks(userId, fishId);
        setMarks(localMarks);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMarks();

    return () => {
      cancelled = true;
    };
  }, [userId, fishId, isLoggedIn]);

  // 添加标点
  const addMark = async (address: string): Promise<LocationMark | null> => {
    if (!userId || !isLoggedIn) return null;

    const tempMark: LocationMark = {
      id: `temp-${Date.now()}`,
      address,
      recordedAt: new Date().toISOString()
    };

    setMarks((prev) => {
      const next = [tempMark, ...prev].slice(0, 2);
      saveLocalMarks(userId, fishId, next);
      return next;
    });

    const remoteMark = await saveRemoteMark(userId, fishId, address);
    if (remoteMark) {
      setMarks((prev) => {
        const filtered = prev.filter((mark) => mark.id !== tempMark.id);
        const next = [remoteMark, ...filtered].slice(0, 2);
        saveLocalMarks(userId, fishId, next);
        return next;
      });
      return remoteMark;
    }

    return tempMark;
  };

  return {
    marks,
    isLoading,
    addMark
  };
}
