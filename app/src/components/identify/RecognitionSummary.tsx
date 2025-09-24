"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findFishByName } from "@/lib/fish-utils";
import { useFishStore } from "@/store/useFishStore";
import { ConfettiCelebration } from "@/components/identify/ConfettiCelebration";

type Props = {
  result: {
    status: string;
    name_cn?: string;
    name_lat?: string;
    family?: string;
    description?: string;
    confidence?: number;
    reason?: string;
  } | null;
  isLoading: boolean;
  pendingTip: string | null;
};

const UNLOCK_THRESHOLD = 0.6;

export function RecognitionSummary({ result, isLoading, pendingTip }: Props) {
  const setCurrentRecognition = useFishStore((state) => state.setCurrentRecognition);
  const unlockFish = useFishStore((state) => state.unlockFish);
  const collectedFishIds = useFishStore((state) => state.collectedFishIds);
  const [showCelebration, setShowCelebration] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const collectedFishIdsRef = useRef(collectedFishIds);

  useEffect(() => {
    collectedFishIdsRef.current = collectedFishIds;
  }, [collectedFishIds]);

  useEffect(() => {
    if (!result || result.status !== "ok" || !result.name_cn) {
      setCurrentRecognition(null);
      setJustUnlocked(false);
      return;
    }

    const match = findFishByName(result.name_cn);
    const payload = {
      name_cn: result.name_cn,
      name_lat: result.name_lat,
      family: result.family,
      description: result.description,
      confidence: result.confidence,
      matchedFishId: match?.id,
    };

    setCurrentRecognition(payload);

    if (match) {
      const shouldUnlock = (result.confidence ?? 0) >= UNLOCK_THRESHOLD;
      const alreadyUnlocked = collectedFishIdsRef.current.includes(match.id);

      if (shouldUnlock && !alreadyUnlocked) {
        unlockFish(match.id);
        setJustUnlocked(true);
      } else {
        setJustUnlocked(false);
      }
    } else {
      setJustUnlocked(false);
    }
  }, [result, setCurrentRecognition, unlockFish]);

  const match = useMemo(() => {
    if (!result || result.status !== "ok" || !result.name_cn) return undefined;
    return findFishByName(result.name_cn);
  }, [result]);

  useEffect(() => {
    if (!result) {
      setShowCelebration(false);
      return;
    }

    if (justUnlocked) {
      setShowCelebration(true);
      // mobile light haptic
      try {
        if (typeof window !== "undefined" && (navigator as any)?.vibrate) {
          (navigator as any).vibrate(18);
        }
      } catch {}
    } else {
      setShowCelebration(false);
    }
  }, [result, justUnlocked]);

  if (!result) {
    if (isLoading && pendingTip) {
      return (
        <div className="rounded-3xl border border-sky-100 bg-white/85 p-6 text-sm text-sky-700 shadow-sm">
          <p className="text-base font-medium leading-relaxed text-sky-600">
            钓鱼小贴士：{pendingTip}
          </p>
        </div>
      );
    }
    return null;
  }

  if (result.status !== "ok") {
    return (
      <div className="space-y-2 rounded-3xl border border-orange-200 bg-orange-50 p-6 text-sm text-orange-700">
        <h2 className="text-base font-semibold text-orange-600">识别失败</h2>
        <p>{result.reason || "未能识别鱼种，请尝试拍摄更清晰的正面照片。"}</p>
      </div>
    );
  }

  const unlocked = match && (result.confidence ?? 0) >= UNLOCK_THRESHOLD;

  return (
    <div className={`relative space-y-5 rounded-3xl border border-sky-200 bg-white p-6 shadow-sm ${justUnlocked ? "animate-card-pop" : ""}`}>
      {showCelebration && (
        <ConfettiCelebration onComplete={() => setShowCelebration(false)} />
      )}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-slate-900">{result.name_cn}</h2>
        <div className="grid gap-1 text-xs text-slate-500">
          <span>拉丁学名：{result.name_lat || "暂缺"}</span>
          <span>所属科目：{result.family || "暂缺"}</span>
        </div>
      </div>
      <p className="text-sm text-slate-600">{result.description || "暂无更多描述。"}</p>
      {match ? (
        unlocked ? (
          justUnlocked ? (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <h3 className="font-semibold">成功解锁：{match.name_cn}</h3>
              <p className="mt-1">已同步至图鉴，快去查看详细插画与资料吧！</p>
              <span className="pointer-events-none absolute inset-0 animate-success-sheen bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.9),transparent)] opacity-0" />
            </div>
          ) : null
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-600">
            置信度偏低，已保留识别信息但暂未解锁。可尝试拍摄更清晰的照片。
          </div>
        )
      ) : null}
    </div>
  );
}
