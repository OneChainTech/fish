"use client";

import Image from "next/image";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";

export function AddToHomePrompt() {
  const { isVisible, variant, dismiss } = usePwaInstallPrompt();

  if (!isVisible || !variant) {
    return null;
  }

  const handleClose = () => {
    dismiss();
  };

  return (
    <div className="pointer-events-auto fixed inset-x-4 bottom-24 z-[60] rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-lg backdrop-blur-md transition-all duration-300 md:inset-auto md:bottom-8 md:right-8 md:w-80">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">添加到主屏幕</p>
          <p className="mt-1 text-xs text-slate-500">
            将有口保存到桌面，下次打开更快捷。
          </p>
          {variant === "android" && (
            <div className="mt-3 space-y-3">
              <div className="rounded-xl bg-sky-50/70 px-3 py-2 text-xs leading-5 text-sky-700">
                在 Chrome 浏览器中，先打开右上角菜单，再选择“添加到主屏幕”，按照提示确认即可完成安装。
              </div>
              <div className="grid grid-cols-2 gap-3">
                <figure className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white/60 p-2 shadow-sm">
                  <Image
                    src="/pwa/s1.png"
                    alt="步骤 1：在 Chrome 右上角打开菜单"
                    width={180}
                    height={320}
                    className="h-auto w-full rounded-lg object-cover"
                    priority
                  />
                  <figcaption className="text-center text-[10px] text-slate-500">步骤 1</figcaption>
                </figure>
                <figure className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white/60 p-2 shadow-sm">
                  <Image
                    src="/pwa/s2.png"
                    alt="步骤 2：选择添加到主屏幕并确认"
                    width={180}
                    height={320}
                    className="h-auto w-full rounded-lg object-cover"
                    priority
                  />
                  <figcaption className="text-center text-[10px] text-slate-500">步骤 2</figcaption>
                </figure>
              </div>
            </div>
          )}
          {variant === "ios" && (
            <div className="mt-3 rounded-xl bg-sky-50/70 px-3 py-2 text-xs leading-5 text-sky-700">
              在 Safari 底部或地址栏旁点击分享按钮，选择“添加到主屏幕”即可完成安装。
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
      <div className="mt-3 text-xs text-slate-400">按照上方步骤操作即可完成安装。</div>
    </div>
  );
}
