"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { fishList, type FishEntry } from "@/data/fish-list";
import { useFishStore } from "@/store/useFishStore";
import { FishDetailSheet } from "@/components/encyclopedia/FishDetailSheet";
import { cn } from "@/lib/utils";

const rarityTag: Record<FishEntry["rarity"], string> = {
  common: "常见",
  uncommon: "较稀有",
  rare: "稀有",
};

const rarityCardFrame: Record<FishEntry["rarity"], string> = {
  common: "border border-slate-200 shadow-sm",
  uncommon: "border-2 border-amber-300 shadow-[0_6px_18px_rgba(253,230,138,0.35)]",
  rare: "border-[3px] border-fuchsia-400 shadow-[0_10px_26px_rgba(217,70,239,0.45)]",
};

export default function EncyclopediaPage() {
  const collectedIds = useFishStore((state) => state.collectedFishIds);
  const collectedSet = useMemo(() => new Set(collectedIds), [collectedIds]);
  const collectedCount = collectedIds.length;
  const [selectedFish, setSelectedFish] = useState<FishEntry | null>(null);

  return (
    <section className="flex flex-1 flex-col gap-5 pb-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">图鉴</h1>
          <span className="rounded-full bg-sky-100/80 px-3 py-1 text-xs font-medium text-sky-600">
            {collectedCount} / {fishList.length}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          点击鱼卡查看详情与插画。未解锁的鱼会以半透明展示。
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {fishList.map((fish) => {
          const collected = collectedSet.has(fish.id);
          return (
            <article
              key={fish.id}
              onClick={() => setSelectedFish(fish)}
              className={cn(
                "group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white/90 transition hover:-translate-y-1",
                rarityCardFrame[fish.rarity],
                collected ? "hover:shadow-xl" : "border-opacity-70 bg-white/70"
              )}
            >
              <div
                className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-slate-50 ${
                  collected ? "" : "bg-slate-100"
                }`}
              >
                <Image
                  src={fish.image}
                  alt={fish.name_cn}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className={`object-contain transition duration-300 ${
                    collected ? "" : "opacity-45"
                  }`}
                />
                {!collected && <div className="absolute inset-0 bg-slate-900/10" />}
                <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-600">
                  {rarityTag[fish.rarity]}
                </div>
                {!collected && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-500">
                    待解锁
                  </div>
                )}
              </div>
              <div className="px-3 py-3">
                <h2 className="text-base font-medium text-slate-900">{fish.name_cn}</h2>
                <p className="text-xs text-slate-500">{fish.name_lat}</p>
              </div>
            </article>
          );
        })}
      </div>

      {selectedFish && (
        <FishDetailSheet
          fish={selectedFish}
          collected={collectedSet.has(selectedFish.id)}
          onClose={() => setSelectedFish(null)}
        />
      )}
    </section>
  );
}
