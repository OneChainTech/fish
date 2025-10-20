"use client";

import { useState } from "react";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";

export function AddToHomePrompt() {
  const { isVisible, variant, triggerInstall, dismiss } = usePwaInstallPrompt();
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (!isVisible || !variant) {
    return null;
  }

  const handleInstallClick = async () => {
    if (variant === "android") {
      await triggerInstall();
    } else {
      setShowIosGuide(true);
    }
  };

  const handleClose = () => {
    dismiss();
    setShowIosGuide(false);
  };

  return (
    <div className="pointer-events-auto fixed inset-x-4 bottom-24 z-[60] rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-lg backdrop-blur-md transition-all duration-300 md:inset-auto md:bottom-8 md:right-8 md:w-80">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">添加到主屏幕</p>
          <p className="mt-1 text-xs text-slate-500">
            将有口保存到桌面，下次打开更快捷，还能离线查看基础信息。
          </p>
          {variant === "ios" && showIosGuide && (
            <div className="mt-3 rounded-xl bg-sky-50/70 px-3 py-2 text-xs leading-5 text-sky-700">
              在 Safari 浏览器底部或地址栏旁点击分享按钮，选择“添加到主屏幕”即可完成安装。
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 transition hover:bg-slate-200"
          aria-label="关闭添加到主屏幕提示"
        >
          ×
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex-1 rounded-full bg-gradient-to-r from-sky-500 via-sky-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-sky-700"
        >
          添加到主屏幕
        </button>
        {variant === "ios" && !showIosGuide && (
          <button
            type="button"
            onClick={() => setShowIosGuide(true)}
            className="text-xs font-medium text-sky-600 underline-offset-4 transition hover:underline"
          >
            如何操作？
          </button>
        )}
      </div>
    </div>
  );
}
