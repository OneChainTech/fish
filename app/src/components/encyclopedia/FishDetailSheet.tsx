"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { FishEntry } from "@/data/fish-list";
import { cn } from "@/lib/utils";
import { useFishStore } from "@/store/useFishStore";

// 移除稀有度显示，相关常量删除

type Props = {
  fish: FishEntry;
  collected: boolean;
  onClose: () => void;
};

type LocationMark = {
  id: string;
  address: string;
  recordedAt: string;
};

function getMarksStorageKey(userId: string, fishId: string) {
  return `fish-marks-${userId}-${fishId}`;
}

export function FishDetailSheet({ fish, collected, onClose }: Props) {
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [marks, setMarks] = useState<LocationMark[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const userId = useFishStore((state) => state.userId);

  // 初次加载：读取本地持久化的标点
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(
        getMarksStorageKey(userId, fish.id)
      );
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized: LocationMark[] = parsed
          .filter((item: unknown) =>
            item && typeof item === "object" &&
            typeof (item as any).id === "string" &&
            typeof (item as any).address === "string" &&
            typeof (item as any).recordedAt === "string"
          )
          .slice(0, 3) as LocationMark[];
        if (sanitized.length > 0) {
          setMarks(sanitized);
        }
      }
    } catch (e) {
      // 解析失败时忽略
      console.warn("读取本地标点失败", e);
    }
  }, [userId, fish.id]);

  // 标点变更时：写回本地
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    try {
      const payload = JSON.stringify(marks.slice(0, 3));
      window.localStorage.setItem(
        getMarksStorageKey(userId, fish.id),
        payload
      );
    } catch (e) {
      console.warn("写入本地标点失败", e);
    }
  }, [userId, fish.id, marks]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setErrorMessage("当前设备不支持定位");
      return;
    }

    setLocationStatus("loading");
    setErrorMessage("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch("/api/location/reverse-geocode", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fishId: fish.id,
              latitude,
              longitude,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const message =
              typeof errorBody.error === "string"
                ? errorBody.error
                : "逆地理解析失败";
            setLocationStatus("error");
            setErrorMessage(message);
            return;
          }

          const data = await response.json();
          const nextAddress = data.address || data.formattedAddress || "未知地点";
          setMarks((prev) => {
            const entry: LocationMark = {
              id: `${Date.now()}`,
              address: nextAddress,
              recordedAt: new Date().toISOString(),
            };
            const nextMarks = [entry, ...prev];
            return nextMarks.slice(0, 3);
          });
          setErrorMessage("");
          setLocationStatus("success");
        } catch (error) {
          console.error("逆地理信息获取失败", error);
          setLocationStatus("error");
          setErrorMessage("请求地址信息失败");
        }
      },
      (error) => {
        let message = "无法获取定位";
        if (error.code === error.PERMISSION_DENIED) {
          message = "用户拒绝了定位授权";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "定位服务不可用";
        } else if (error.code === error.TIMEOUT) {
          message = "定位超时，请重试";
        }
        setLocationStatus("error");
        setErrorMessage(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, [fish.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3 py-6">
      <div className="relative flex w-full max-w-md max-h-[85vh] flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="relative h-48 w-full bg-slate-100">
          <Image
            src={fish.image}
            alt={fish.name_cn}
            fill
            sizes="(max-width: 768px) 90vw, 400px"
            className="object-contain"
          />
          <button
            onClick={handleLocate}
            disabled={locationStatus === "loading"}
            aria-label="记录当前钓点"
            title={
              locationStatus === "success"
                ? `已记录（共${marks.length}条）`
                : locationStatus === "error"
                ? "重试定位"
                : "记录钓点"
            }
            className={cn(
              "absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-600 shadow",
              locationStatus === "success"
                ? "bg-emerald-500 text-white"
                : locationStatus === "error"
                ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                : "bg-white/90 hover:bg-white"
            )}
          >
            {locationStatus === "loading" ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
            ) : (
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 6.03 11.23 6.29 11.49a1 1 0 0 0 1.42 0C12.97 20.23 19 14.25 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z" />
              </svg>
            )}
            <span className="sr-only">
              {locationStatus === "success"
                ? "已记录钓点"
                : locationStatus === "error"
                ? "定位失败，请重试"
                : "记录当前钓点"}
            </span>
          </button>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-white"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{fish.name_cn}</h2>
              <p className="text-xs text-slate-500">{fish.name_lat}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                collected ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500"
              )}
            >
              {collected ? "已解锁" : "待解锁"}
            </span>
          </div>
          <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-sky-50 to-slate-100 p-5">
            <p className="text-sm text-slate-600">拉丁学名：{fish.name_lat}</p>
            <p className="text-sm text-slate-600">所属科目：{fish.family}</p>
            <p className="text-sm text-slate-600">典型体长：{fish.length}</p>
            <p className="text-sm text-slate-600">栖息环境：{fish.habitat}</p>
          </div>
          <p className="mb-4 text-sm leading-6 text-slate-600">{fish.description}</p>
          {/* 稀有度区块已根据需求去除 */}
          <div className="mt-6 space-y-3">
            {marks.length > 0 && (
              <div className="rounded-2xl bg-emerald-50 px-5 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 6.03 11.23 6.29 11.49a1 1 0 0 0 1.42 0C12.97 20.23 19 14.25 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z" />
                  </svg>
                  标点
                </h3>
                <div className="mt-2 space-y-2 text-sm text-emerald-700">
                  {marks.map((mark) => (
                    <p
                      key={mark.id}
                      className="border-t border-emerald-100 pt-2 first:border-t-0 first:pt-0"
                    >
                      {mark.address}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {locationStatus === "error" && errorMessage && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-xs text-rose-600">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
