"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { fishList, type FishEntry } from "@/data/fish-list";

interface FishCarouselProps {
  isAnimating: boolean;
  targetFishId?: string;
  onAnimationComplete?: () => void;
}

export function FishCarousel({ isAnimating, targetFishId, onAnimationComplete }: FishCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isStopped, setIsStopped] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 找到目标鱼类的索引
  const targetIndex = targetFishId ? fishList.findIndex(fish => fish.id === targetFishId) : -1;

  useEffect(() => {
    if (!isAnimating) {
      // 停止动画
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsStopped(true);
      return;
    }

    // 开始横向滚动动画
    setIsStopped(false);
    setScrollPosition(0);

    intervalRef.current = setInterval(() => {
      setScrollPosition(prev => prev + 1);
    }, 2000); // 每2秒移动一次

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAnimating]);

  // 当识别成功时，停止在目标鱼类
  useEffect(() => {
    if (targetFishId && targetIndex !== -1 && isAnimating) {
      // 停止轮播
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // 延迟一点时间后停止在目标鱼类
      setTimeout(() => {
        setScrollPosition(targetIndex);
        setIsStopped(true);
        onAnimationComplete?.();
      }, 500);
    }
  }, [targetFishId, targetIndex, isAnimating, onAnimationComplete]);

  // 计算当前显示的鱼类
  const currentIndex = scrollPosition % fishList.length;
  const currentFish = fishList[currentIndex];

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl bg-white">
      {/* 横向滚动的鱼类列表 */}
      <div 
        ref={containerRef}
        className="flex h-full w-full items-center overflow-x-hidden"
      >
        <div 
          className="flex items-center space-x-8 transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${(scrollPosition % fishList.length) * 200}px)`,
            width: `${fishList.length * 200}px`
          }}
        >
          {fishList.map((fish, index) => (
            <div 
              key={fish.id}
              className={`flex-shrink-0 flex flex-col items-center justify-center transition-all duration-500 ${
                index === currentIndex && isStopped && targetFishId ? 'scale-110' : 'scale-100'
              }`}
            >
              {/* 鱼类图片 - 放大到与识别区域一致 */}
              <div className="relative h-48 w-48">
                <Image
                  src={fish.image}
                  alt={fish.name_cn}
                  fill
                  sizes="192px"
                  className="object-contain"
                  unoptimized
                />
                
                {/* 识别成功时的特效 */}
                {index === currentIndex && isStopped && targetFishId && (
                  <div className="absolute inset-0 bg-emerald-500/20 animate-pulse rounded-lg" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
