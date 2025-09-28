"use client";

import { useEffect, useRef } from "react";
import { useFishStore } from "@/store/useFishStore";

export function useCollectionSync() {
  const userId = useFishStore((state) => state.userId);
  const collectedFishIds = useFishStore((state) => state.collectedFishIds);
  const setCollection = useFishStore((state) => state.setCollection);
  const hasLoadedRemote = useRef(false);

  // 初次加载：直接从远端拉取收藏进度
  useEffect(() => {
    if (!userId) return;

    const uid = userId;
    hasLoadedRemote.current = false;

    const controller = new AbortController();

    async function bootstrap() {
      try {
        const res = await fetch(`/api/user?userId=${encodeURIComponent(uid)}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.collectedFishIds)) {
            setCollection(
              data.collectedFishIds.filter((item: unknown) => typeof item === "string")
            );
            hasLoadedRemote.current = true;
            return;
          }
        }
        throw new Error("remote fetch failed");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("远程进度获取失败", error);
        hasLoadedRemote.current = true;
      }
    }

    bootstrap();

    return () => controller.abort();
  }, [userId, setCollection]);

  // 进度变更：同步远端
  useEffect(() => {
    if (!userId || !hasLoadedRemote.current) return;

    const uid = userId;

    const controller = new AbortController();

    async function persist() {
      try {
        await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid, collectedFishIds }),
          signal: controller.signal,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("远程进度同步失败", error);
      }
    }

    persist();

    return () => controller.abort();
  }, [userId, collectedFishIds]);
}
