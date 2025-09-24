"use client";

import Image from "next/image";
import { FishEntry } from "@/data/fish-list";
import { cn } from "@/lib/utils";

const rarityLabel: Record<FishEntry["rarity"], string> = {
  common: "常见",
  uncommon: "较稀有",
  rare: "稀有",
};

const rarityColor: Record<FishEntry["rarity"], string> = {
  common: "bg-emerald-50 text-emerald-600",
  uncommon: "bg-blue-50 text-blue-600",
  rare: "bg-purple-50 text-purple-600",
};

type Props = {
  fish: FishEntry;
  collected: boolean;
  onClose: () => void;
};

export function FishDetailSheet({ fish, collected, onClose }: Props) {
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
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className={cn("rounded-full px-3 py-1", rarityColor[fish.rarity])}>
              稀有度：{rarityLabel[fish.rarity]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
