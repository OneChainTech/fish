"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import { RecognitionSummary } from "@/components/identify/RecognitionSummary";
import { CameraIcon, PhotoIcon } from "@/components/ui/IconSet";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResponse | null>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("仅支持图片文件，请重新选择。");
      return;
    }
    setError(null);
    setResult(null);
    setMimeType(file.type || "image/jpeg");

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview(reader.result);
      }
    };
    reader.onerror = () => {
      setError("图片读取失败，请重试。");
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!preview || !mimeType) {
      setError("请先拍照或上传图片。");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const base64 = preview.split(",")[1];
      if (!base64) {
        setError("图片数据无效，请重新上传。");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!response.ok) {
        const { error: message } = await response
          .json()
          .catch(() => ({ error: "识别失败，请稍后再试。" }));
        setError(message || "识别失败，请稍后再试。");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const recognized: RecognitionResponse = data.result;
      setResult(recognized);
    } catch (err) {
      console.error(err);
      setError("识别请求异常，请检查网络后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex flex-1 flex-col gap-6 pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">鱼类识别</h1>
        <p className="text-xs text-slate-500">
          拍照或上传清晰图片，智能识别鱼类并同步解锁我的专属图鉴。
        </p>
      </header>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-white/60 bg-white/90 p-5 shadow-lg shadow-sky-100/60 backdrop-blur"
        noValidate
      >
        <fieldset className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-4 py-6 text-center">
          <legend className="sr-only">上传或拍摄鱼类照片</legend>
          {preview ? (
            <div className="relative h-48 w-full overflow-hidden rounded-2xl">
              <Image
                src={preview}
                alt="待识别鱼类"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-500">
              <CameraIcon className="h-7 w-7" />
            </div>
          )}
          {!preview && (
            <p className="text-sm text-sky-600/80">轻点按钮拍摄或上传</p>
          )}
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              onClick={handleOpenCamera}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition active:scale-[0.98] sm:text-base"
              type="button"
            >
              <CameraIcon className="h-4 w-4" />
              拍照识别
            </button>
            <button
              onClick={handleOpenFilePicker}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-sky-200 px-5 py-3 text-sm font-medium text-sky-600 transition active:scale-[0.98] sm:text-base"
              type="button"
            >
              <PhotoIcon className="h-4 w-4" />
              上传图片
            </button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
          />
        </fieldset>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={isLoading || !preview}
            className="flex h-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? "正在识别..." : "开始识别"}
          </button>
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
            >
              {error}
            </div>
          )}
        </div>
      </form>

      <RecognitionSummary result={result} />
    </section>
  );
}
