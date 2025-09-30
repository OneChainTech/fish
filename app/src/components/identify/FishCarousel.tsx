"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { fishList } from "@/data/fish-list";

interface FishCarouselProps {
  isAnimating: boolean;
  onAnimationComplete?: () => void;
  onReady?: () => void;
}

export function FishCarousel({ isAnimating, onAnimationComplete, onReady }: FishCarouselProps) {
  const [positionPx, setPositionPx] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const readySignaledRef = useRef(false);
  const movedAccumRef = useRef(0);

  const ITEM_WIDTH = 200; // 与布局保持一致
  const speedPxPerSec = 60; // 流动速度（可调）

  useEffect(() => {
    if (!isAnimating) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = null;
      movedAccumRef.current = 0;
      readySignaledRef.current = false;
      return;
    }

    // 重置位置
    setPositionPx(0);
    movedAccumRef.current = 0;
    readySignaledRef.current = false;

    const tick = (ts: number) => {
      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
      }
      const deltaMs = ts - lastTsRef.current;
      lastTsRef.current = ts;
      const deltaPx = (speedPxPerSec * deltaMs) / 1000;
      movedAccumRef.current += deltaPx;
      // 只有当累计位移超过阈值后才宣布就绪，确保视觉上已“动起来”
      if (!readySignaledRef.current && movedAccumRef.current >= 4) {
        readySignaledRef.current = true;
        onReady?.();
      }
      setPositionPx(prev => prev + deltaPx);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = null;
    };
  }, [isAnimating, speedPxPerSec, onAnimationComplete]);

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl bg-transparent">
      {/* 横向滚动的鱼类列表 */}
      <div 
        ref={containerRef}
        className="flex h-full w-full items-center overflow-x-hidden"
      >
        {(() => {
          const totalWidth = fishList.length * ITEM_WIDTH;
          const x = -(positionPx % totalWidth);
          return (
            <div
              className="flex items-center"
              style={{ transform: `translateX(${x}px)` }}
            >
              {[0, 1].map(rep => (
                <div key={rep} className="flex items-center" style={{ width: `${totalWidth}px` }}>
                  {fishList.map((fish, index) => {
                    const isPriority = rep === 0 && index < 5; // 提前加载前5张
                    return (
                      <div
                        key={`${rep}-${fish.id}`}
                        className="flex-shrink-0 flex flex-col items-center justify-center"
                        style={{ width: `${ITEM_WIDTH}px` }}
                      >
                        <div className="relative h-48 w-48">
                          <Image
                            src={fish.image}
                            alt={fish.name_cn}
                            fill
                            sizes="192px"
                            className="object-contain opacity-70"
                            priority={isPriority}
                            loading={isPriority ? undefined : "lazy"}
                            unoptimized
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
