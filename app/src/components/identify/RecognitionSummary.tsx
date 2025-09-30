"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findFishByName } from "@/lib/fish-utils";
import { useFishStore } from "@/store/useFishStore";
import { ConfettiCelebration } from "@/components/identify/ConfettiCelebration";
import { fishList } from "@/data/fish-list";

type Props = {
  result: {
    status: string;
    name_cn?: string;
    name_lat?: string;
    family?: string;
    description?: string;
    confidence?: number;
    reason?: string;
    unlock_fish_id?: string;
    unlock_confidence?: number;
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

    // 使用AI直接返回的解锁信息
    const payload = {
      name_cn: result.name_cn,
      name_lat: result.name_lat,
      family: result.family,
      description: result.description,
      confidence: result.confidence,
      matchedFishId: result.unlock_fish_id,
    };

    setCurrentRecognition(payload);

    // 使用AI判断的解锁逻辑
    if (result.unlock_fish_id) {
      const shouldUnlock = (result.unlock_confidence ?? 0) >= UNLOCK_THRESHOLD;
      const alreadyUnlocked = collectedFishIdsRef.current.includes(result.unlock_fish_id);

      if (shouldUnlock && !alreadyUnlocked) {
        unlockFish(result.unlock_fish_id);
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
    // 如果AI直接返回了匹配的鱼类ID，查找对应的鱼类信息
    if (result.unlock_fish_id) {
      const fish = fishList.find(f => f.id === result.unlock_fish_id);
      return fish;
    }
    // 否则使用原来的模糊匹配逻辑作为备选
    return findFishByName(result.name_cn);
  }, [result]);

  useEffect(() => {
    if (!result) {
      setShowCelebration(false);
      return;
    }

    if (justUnlocked) {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        const nav = navigator as Navigator & {
          vibrate?: (pattern: number | number[]) => boolean;
        };
        try {
          nav.vibrate?.([16, 12]);
        } catch {}
      }
      setShowCelebration(true);
    } else {
      setShowCelebration(false);
    }
  }, [result, justUnlocked]);

  if (!result) {
    if (isLoading && pendingTip) {
      return (
        <div className="rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-sky-900 mb-2">🎣 钓鱼小贴士</p>
          <p className="text-sm leading-relaxed text-slate-700">{pendingTip}</p>
        </div>
      );
    }
    return null;
  }

  if (result.status !== "ok") {
      return (
        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-red-50 p-4 shadow-sm border border-orange-100">
          <p className="text-sm font-semibold text-orange-900 mb-2">⚠️ 识别失败</p>
          <p className="text-sm leading-relaxed text-slate-700">
            {result.reason || "未能识别鱼种，请尝试拍摄更清晰的正面照片。"}
          </p>
        </div>
      );
  }

  const unlocked = match && result.unlock_fish_id && (result.unlock_confidence ?? 0) >= UNLOCK_THRESHOLD;

  return (
    <div className={`relative space-y-4 px-3 ${justUnlocked ? "animate-card-pop" : ""}`}>
      {showCelebration && (
        <ConfettiCelebration onComplete={() => setShowCelebration(false)} />
      )}
      
      {/* 主要识别结果 */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{result.name_cn}</h2>
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
          {unlocked ? null : (
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
