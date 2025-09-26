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
      // mobile light haptic (typed refinement, no any)
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        const nav = navigator as Navigator & {
          vibrate?: (pattern: number | number[]) => boolean;
        };
        try {
          nav.vibrate?.(18);
        } catch {}
      }
    } else {
      setShowCelebration(false);
    }
  }, [result, justUnlocked]);

  if (!result) {
    if (isLoading && pendingTip) {
      return (
        <div className="rounded-xl bg-sky-50 p-4">
          <p className="text-sm font-medium text-sky-800">钓鱼小贴士</p>
          <p className="mt-1 text-sm leading-relaxed text-sky-700">{pendingTip}</p>
        </div>
      );
    }
    return null;
  }

  if (result.status !== "ok") {
      return (
        <div className="rounded-xl bg-orange-50 p-4">
          <p className="text-sm font-medium text-orange-800">识别失败</p>
          <p className="mt-1 text-sm leading-relaxed text-orange-700">
            {result.reason || "未能识别鱼种，请尝试拍摄更清晰的正面照片。"}
          </p>
        </div>
      );
  }

  const unlocked = match && (result.confidence ?? 0) >= UNLOCK_THRESHOLD;

  return (
    <div className={`relative space-y-4 ${justUnlocked ? "animate-card-pop" : ""}`}>
      {showCelebration && (
        <ConfettiCelebration onComplete={() => setShowCelebration(false)} />
      )}
      
      {/* 主要识别结果 */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{result.name_cn}</h2>
          <div className="mt-2 space-y-1 text-sm text-slate-500">
            <div>拉丁学名：{result.name_lat || "暂缺"}</div>
            <div>所属科目：{result.family || "暂缺"}</div>
          </div>
        </div>
        
        {result.description && (
          <p className="text-sm leading-relaxed text-slate-600">{result.description}</p>
        )}
      </div>

      {/* 状态提示 */}
      {match && (
        <div className="space-y-2">
          {unlocked ? (
            justUnlocked ? (
              <div className="relative overflow-hidden rounded-xl bg-emerald-50 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="font-medium text-emerald-800">成功解锁：{match.name_cn}</span>
                </div>
                <p className="mt-2 text-emerald-700">已同步至图鉴，快去查看详细插画与资料吧！</p>
                <span className="pointer-events-none absolute inset-0 animate-success-sheen bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.9),transparent)] opacity-0" />
              </div>
            ) : null
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
              <span className="text-amber-700">置信度偏低，已保留识别信息但暂未解锁。可尝试拍摄更清晰的照片。</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
