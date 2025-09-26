"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { RecognitionSummary } from "@/components/identify/RecognitionSummary";
import { CameraIcon } from "@/components/ui/IconSet";
import { fishingTips } from "@/data/fishing-tips";
import { compressImage } from "@/lib/imageCompression";

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
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResponse | null>(null);
  const [currentTip, setCurrentTip] = useState<string | null>(null);

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
      setLoadingStep("正在上传图片...");
      setError(null);
      setResult(null);

      setLoadingStep("正在识别鱼类...");
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
        return;
      }

      setLoadingStep("正在分析结果...");
      const data = await response.json();
      const recognized: RecognitionResponse = data.result;
      setResult(recognized);
    } catch (err) {
      console.error(err);
      setError("识别请求异常，请检查网络后重试。");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("仅支持图片文件，请重新选择。");
      return;
    }
    setError(null);
    setResult(null);

    try {
      setIsLoading(true);
      setLoadingStep("正在压缩图片...");
      const { dataUrl, mimeType: processedType } = await compressImage(file, (progress) => {
        setLoadingStep(`正在压缩图片... ${progress}%`);
      });
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
    cameraInputRef.current?.click();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await recognizeImage(preview, mimeType);
  };

  return (
    <section className="flex flex-1 flex-col gap-6 pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">鱼眼</h1>
        <p className="text-xs text-slate-500">
          拍摄清晰图片，智能识别鱼类并同步解锁我的专属图鉴。
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* 图片预览区域 */}
        <div
          className={`relative h-56 w-full overflow-hidden rounded-xl text-center transition-colors ${
            preview ? "bg-slate-50" : "bg-sky-50"
          }`}
        >
          {preview ? (
            <Image
              src={preview}
              alt="待识别鱼类"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-500">
                <CameraIcon className="h-6 w-6" />
              </div>
              <p className="text-sm text-sky-600">拍摄后将自动开始识别</p>
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
            {isLoading ? (
              "正在识别..."
            ) : (
              <>
                <CameraIcon className="h-4 w-4" />
                拍照识别
              </>
            )}
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
  );
}
