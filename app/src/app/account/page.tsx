"use client";

import { FormEvent, useEffect, useState } from "react";
import { useFishStore } from "@/store/useFishStore";

const PHONE_REGEX = /^1\d{10}$/;
const STORAGE_PHONE_KEY = "fish-bound-phone";
const STORAGE_USER_KEY = "fish-anon-id";

function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  return PHONE_REGEX.test(digits) ? digits : null;
}

export default function AccountPage() {
  const userId = useFishStore((state) => state.userId);
  const setUserId = useFishStore((state) => state.setUserId);
  const setCollection = useFishStore((state) => state.setCollection);

  const [currentPhone, setCurrentPhone] = useState<string | null>(null);
  const [bindPhone, setBindPhone] = useState("");
  const [bindPassword, setBindPassword] = useState("");
  const [bindLoading, setBindLoading] = useState(false);
  const [bindMessage, setBindMessage] = useState<string | null>(null);
  const [bindError, setBindError] = useState<string | null>(null);

  const [recoverPhone, setRecoverPhone] = useState("");
  const [recoverPassword, setRecoverPassword] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverMessage, setRecoverMessage] = useState<string | null>(null);
  const [recoverError, setRecoverError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_PHONE_KEY);
    if (saved) {
      setCurrentPhone(saved);
    }
  }, []);

  async function handleBind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBindError(null);
    setBindMessage(null);

    if (!userId) {
      setBindError("尚未生成用户身份，请先识鱼或浏览图鉴以初始化账户。");
      return;
    }

    const normalized = normalizePhone(bindPhone);
    const password = bindPassword.trim();
    if (!normalized) {
      setBindError("请输入 11 位大陆手机号。");
      return;
    }

    if (password.length < 6) {
      setBindError("密码需至少 6 位。");
      return;
    }

    setBindLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, userId, password }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || "绑定失败");
      }

      const data = await res.json();
      setCurrentPhone(data.phone);
      setBindMessage("绑定成功，后续可通过手机号恢复收藏进度。");
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_PHONE_KEY, data.phone);
      }
    } catch (error) {
      setBindError(error instanceof Error ? error.message : "绑定失败");
    } finally {
      setBindLoading(false);
    }
  }

  async function handleRecover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoverError(null);
    setRecoverMessage(null);

    const normalized = normalizePhone(recoverPhone);
    const password = recoverPassword.trim();
    if (!normalized) {
      setRecoverError("请输入 11 位大陆手机号。");
      return;
    }

    if (password.length < 6) {
      setRecoverError("密码需至少 6 位。");
      return;
    }

    setRecoverLoading(true);
    try {
      const res = await fetch(
        `/api/user/profile?phone=${encodeURIComponent(normalized)}&password=${encodeURIComponent(password)}`
      );
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || "未找到绑定记录");
      }

      const data = await res.json();
      setUserId(data.userId);
      if (Array.isArray(data.collectedFishIds)) {
        setCollection(data.collectedFishIds);
      }
      setCurrentPhone(data.phone);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_USER_KEY, data.userId);
        window.localStorage.setItem(STORAGE_PHONE_KEY, data.phone);
      }
      setRecoverMessage("恢复成功，已加载绑定账号的收藏进度。");
    } catch (error) {
      setRecoverError(error instanceof Error ? error.message : "恢复失败");
    } finally {
      setRecoverLoading(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-5 pb-4">
      <header>
        <h1 className="text-2xl font-semibold">我</h1>
      </header>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>用户 ID</span>
          <span className="truncate text-slate-900">
            {userId ?? "待生成"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>手机号</span>
          <span className="text-slate-900">
            {currentPhone ?? "未绑定"}
          </span>
        </div>
      </div>

      <form onSubmit={handleBind} className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">绑定手机号</h2>
        <input
          type="tel"
          value={bindPhone}
          onChange={(event) => setBindPhone(event.target.value)}
          placeholder="手机号"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <input
          type="password"
          value={bindPassword}
          onChange={(event) => setBindPassword(event.target.value)}
          placeholder="设置密码（至少 6 位）"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        {bindError && <p className="text-sm text-red-500">{bindError}</p>}
        {bindMessage && <p className="text-sm text-emerald-600">{bindMessage}</p>}
        <button
          type="submit"
          className="w-full rounded-2xl bg-sky-500 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
          disabled={bindLoading}
        >
          {bindLoading ? "绑定中..." : "完成绑定"}
        </button>
      </form>

      <form onSubmit={handleRecover} className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">恢复进度</h2>
        <input
          type="tel"
          value={recoverPhone}
          onChange={(event) => setRecoverPhone(event.target.value)}
          placeholder="手机号"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <input
          type="password"
          value={recoverPassword}
          onChange={(event) => setRecoverPassword(event.target.value)}
          placeholder="密码"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        {recoverError && <p className="text-sm text-red-500">{recoverError}</p>}
        {recoverMessage && <p className="text-sm text-emerald-600">{recoverMessage}</p>}
        <button
          type="submit"
          className="w-full rounded-2xl bg-emerald-500 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={recoverLoading}
        >
          {recoverLoading ? "恢复中..." : "加载账号"}
        </button>
      </form>
    </section>
  );
}
