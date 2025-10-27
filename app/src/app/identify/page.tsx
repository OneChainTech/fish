"use client";

import NextImage from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { RecognitionSummary } from "@/components/identify/RecognitionSummary";
import { FishCarousel } from "@/components/identify/FishCarousel";
import { useFishStore } from "@/store/useFishStore";
import { CameraIcon } from "@/components/ui/IconSet";
import { fishingTips } from "@/data/fishing-tips";
import { fishList, type FishEntry } from "@/data/fish-list";
import { compressImage } from "@/lib/imageCompression";
import { useRouter } from "next/navigation";

type RecognitionResponse = {
  status: string;
  name_cn?: string;
  name_lat?: string;
  family?: string;
  description?: string;
  confidence?: number;
  reason?: string;
};

export default function IdentifyPage() {
  const isLoggedIn = useFishStore((s) => s.isLoggedIn);
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResponse | null>(null);
  const [currentTip, setCurrentTip] = useState<string | null>(null);
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselReady, setCarouselReady] = useState(false);
  const [recognizedFish, setRecognizedFish] = useState<FishEntry | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setCurrentTip(null);
      return;
    }

    let previousTip: string | null = null;

    const pickTip = () => {
      if (fishingTips.length === 0) return;
      let nextTip = fishingTips[Math.floor(Math.random() * fishingTips.length)];
      if (fishingTips.length > 1) {
        while (nextTip === previousTip) {
          nextTip = fishingTips[Math.floor(Math.random() * fishingTips.length)];
        }
      }
      previousTip = nextTip;
      setCurrentTip(nextTip);
    };

    pickTip();
    const interval = window.setInterval(pickTip, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isLoading]);

  const recognizeImage = async (
    imageDataUrl: string | null,
    type: string | null,
  ) => {
    if (!isLoggedIn) {
      router.push("/account");
      return;
    }

    if (!imageDataUrl || !type) {
      setError("请先拍摄照片或选择图片。");
      return;
    }

    const base64 = imageDataUrl.split(",")[1];
    if (!base64) {
      setError("图片数据无效，请重新拍摄或选择。");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setShowCarousel(true);
      setCarouselReady(false);
      setRecognizedFish(null);
      
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: base64, mimeType: type }),
      });

      if (!response.ok) {
        const { error: message } = await response
          .json()
          .catch(() => ({ error: "识别失败，请稍后再试。" }));
        setError(message || "识别失败，请稍后再试。");
        setShowCarousel(false);
        return;
      }

      const data = await response.json();
      const recognized: RecognitionResponse = data.result;
      
      // 如果识别成功，设置目标鱼类ID
      if (recognized.status === "ok" && recognized.name_cn) {
        // 根据识别结果找到对应的鱼类ID
        const matchedFish = fishList.find(fish => fish.name_cn === recognized.name_cn);
        if (matchedFish) {
          setRecognizedFish(matchedFish);
          // 在隐藏轮播前预加载目标图片，避免切换瞬间空白
          try {
            if (typeof window !== "undefined") {
              await new Promise<void>((resolve) => {
                const img: HTMLImageElement = new window.Image();
                img.src = matchedFish.image;
                const timer = window.setTimeout(() => resolve(), 1200);
                const settle = () => {
                  window.clearTimeout(timer);
                  resolve();
                };
                // 优先使用 decode，失败则退化到 onload/onerror
                if (typeof img.decode === "function") {
                  img.decode().then(settle).catch(settle);
                } else {
                  img.onload = settle;
                  img.onerror = settle;
                }
              });
            }
          } catch {}
          // 预加载完成后再收起轮播
          setShowCarousel(false);
        }
      }
      
      setResult(recognized);
      // 注意：隐藏轮播的操作已在成功分支中按预加载后处理
    } catch (err) {
      console.error(err);
      setError("识别请求异常，请检查网络后重试。");
      setShowCarousel(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!isLoggedIn) {
      router.push("/account");
      return;
    }

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("仅支持图片文件，请重新选择。");
      return;
    }
    setError(null);
    setResult(null);

    try {
      setIsLoading(true);
      const { dataUrl, mimeType: processedType } = await compressImage(file);
      setPreview(dataUrl);
      setMimeType(processedType);
      await recognizeImage(dataUrl, processedType);
    } catch (err) {
      console.error(err);
      setError("图片处理失败，请重试或选择另一张照片。");
      setIsLoading(false);
    } finally {
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
    }
  };

  const handleOpenCamera = () => {
    if (!isLoggedIn) {
      router.push("/account");
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoggedIn) {
      router.push("/account");
      return;
    }

    await recognizeImage(preview, mimeType);
  };

  return (
    <>
      <section className="flex flex-1 flex-col gap-6 pb-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">识鱼</h1>
          <p className="text-xs text-slate-500">
            拍摄清晰图片，智能识别鱼类并同步解锁我的专属图鉴。
          </p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* 图片预览区域 */}
          <div
            className={`relative h-56 w-full overflow-hidden rounded-xl text-center transition-colors ${
              showCarousel || recognizedFish
                ? "bg-white"
                : preview
                  ? "bg-slate-50"
                  : "bg-slate-100"
            }`}
          >
            {showCarousel ? (
              <div className="relative h-full w-full">
                {/* 活动效果准备阶段的柔和底色，避免出现空白 */}
                <div
                  className={`absolute inset-0 z-0 transition-opacity duration-450 ease-out ${
                    carouselReady ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-slate-100 via-white to-slate-100">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                    <p className="text-xs text-slate-400">正在准备识别动画...</p>
                  </div>
                </div>
                {/* 预览图站位，直到轮播 ready，淡出 */}
                {preview && (
                  <NextImage
                    src={preview}
                    alt="预览站位"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className={`absolute inset-0 z-10 object-cover transition-opacity duration-450 ease-out ${
                      carouselReady ? "opacity-0" : "opacity-100"
                    }`}
                    unoptimized
                    priority
                  />
                )}
                {/* 轮播容器，淡入 */}
                <div
                  className={`absolute inset-0 z-20 transition-opacity duration-450 ease-out ${
                    carouselReady ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <FishCarousel
                    isAnimating={isLoading}
                    onReady={() => setCarouselReady(true)}
                  />
                </div>
              </div>
            ) : recognizedFish ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
              <div className="relative h-52 w-52 sm:h-60 sm:w-60">
                <NextImage
                  src={recognizedFish.image}
                  alt={recognizedFish.name_cn}
                  fill
                  sizes="(max-width: 768px) 208px, 240px"
                  priority
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="space-y-1 text-slate-700">
                <p className="text-base sm:text-lg font-semibold text-slate-900">{recognizedFish.name_cn}</p>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-slate-500">{recognizedFish.name_lat}</p>
              </div>
            </div>
          ) : preview ? (
            <NextImage
              src={preview}
              alt="待识别鱼类"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <CameraIcon className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-600">拍摄后将自动开始识别</p>
            </div>
          )}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
            />
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleOpenCamera}
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? "正在识别..." : "拍照识别"}
            </button>
            
            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 p-4 text-sm text-red-600"
              >
                {error}
              </div>
            )}
          </div>
        </form>

        <RecognitionSummary result={result} isLoading={isLoading} pendingTip={currentTip} />
      </section>
      <Link
        href="/feedback"
        aria-label="意见反馈入口"
        draggable
        className="group fixed right-0 z-40 flex translate-x-4 select-none items-center rounded-full bg-white pl-3 pr-1.5 shadow-lg shadow-slate-300/50 ring-1 ring-white/80 transition-[transform,box-shadow] duration-200 hover:translate-x-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 active:translate-x-0"
        style={{ top: "calc(100vh - 220px)" }}
        onDragStart={(event) => {
          if (typeof window === "undefined" || !event.dataTransfer) return;
          const placeholder = document.createElement("div");
          placeholder.style.width = "1px";
          placeholder.style.height = "1px";
          event.dataTransfer.setDragImage(placeholder, 0, 0);
        }}
        onDrag={(event) => {
          if (event.clientY <= 0 || typeof window === "undefined") return;
          const container = event.currentTarget;
          const viewportHeight = window.innerHeight;
          const clampedTop = Math.min(
            viewportHeight - 48,
            Math.max(48, event.clientY),
          );
          container.style.top = `${clampedTop}px`;
        }}
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-inner shadow-slate-200">
          <NextImage
            src="/icons/robotfish.png"
            alt="意见反馈"
            width={28}
            height={28}
            className="h-7 w-7"
            priority
          />
        </span>
      </Link>
    </>
  );
}
