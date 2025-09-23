"use client";

import { useEffect, useMemo } from "react";
import { findFishByName } from "@/lib/fish-utils";
import { useFishStore } from "@/store/useFishStore";

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
};

const UNLOCK_THRESHOLD = 0.6;

export function RecognitionSummary({ result }: Props) {
  const setCurrentRecognition = useFishStore((state) => state.setCurrentRecognition);
  const unlockFish = useFishStore((state) => state.unlockFish);

  useEffect(() => {
    if (!result || result.status !== "ok" || !result.name_cn) {
      setCurrentRecognition(null);
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

    if (match && (result.confidence ?? 0) >= UNLOCK_THRESHOLD) {
      unlockFish(match.id);
    }
  }, [result, setCurrentRecognition, unlockFish]);

  const match = useMemo(() => {
    if (!result || result.status !== "ok" || !result.name_cn) return undefined;
    return findFishByName(result.name_cn);
  }, [result]);

  if (!result) {
    return null;
  }

  if (result.status !== "ok") {
    return (
      <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-sm text-orange-700">
        <h2 className="text-base font-semibold">识别失败</h2>
        <p className="mt-2">
          {result.reason || "未能识别鱼种，请尝试上传更清晰的正面照片。"}
        </p>
      </div>
    );
  }

  const unlocked = match && (result.confidence ?? 0) >= UNLOCK_THRESHOLD;

  return (
    <div className="space-y-4 rounded-3xl border border-sky-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-sky-500">识别结果</span>
        <h2 className="text-2xl font-semibold text-slate-900">{result.name_cn}</h2>
      </div>
      <div className="grid gap-3 text-sm text-slate-600">
        <p>拉丁学名：{result.name_lat || "暂缺"}</p>
        <p>所属科目：{result.family || "暂缺"}</p>
        <p>{result.description || "暂无更多描述。"}</p>
      </div>
      {match ? (
        unlocked ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <h3 className="font-semibold">成功解锁：{match.name_cn}</h3>
            <p className="mt-1">已同步至图鉴，快去查看详细插画与资料吧！</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-600">
            置信度偏低，已保留识别信息但暂未解锁。可尝试拍摄更清晰的照片。
          </div>
        )
      ) : null}
    </div>
  );
}
