"use client";

import { FormEvent, useState } from "react";
import { useFishStore } from "@/store/useFishStore";
import { useRouter } from "next/navigation";

const PHONE_REGEX = /^1\d{10}$/;
const STORAGE_PHONE_KEY = "fish-user-phone";
const STORAGE_USER_KEY = "fish-user-id";

function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  return PHONE_REGEX.test(digits) ? digits : null;
}

export default function AccountPage() {
  const userPhone = useFishStore((state) => state.userPhone);
  const isLoggedIn = useFishStore((state) => state.isLoggedIn);
  const setUserId = useFishStore((state) => state.setUserId);
  const setUserPhone = useFishStore((state) => state.setUserPhone);
  const setIsLoggedIn = useFishStore((state) => state.setIsLoggedIn);
  const setCollection = useFishStore((state) => state.setCollection);
  const resetUser = useFishStore((state) => state.resetUser);
  const resetCollection = useFishStore((state) => state.resetCollection);
  const router = useRouter();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalized = normalizePhone(phone);
    const passwordTrimmed = password.trim();
    
    if (!normalized) {
      setError("请输入 11 位大陆手机号。");
      return;
    }

    if (passwordTrimmed.length < 6) {
      setError("密码需至少 6 位。");
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        const res = await fetch(
          `/api/user/profile?phone=${encodeURIComponent(normalized)}&password=${encodeURIComponent(passwordTrimmed)}`
        );
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error?.error || "登录失败");
        }

        const data = await res.json();
        setUserId(data.userId);
        setUserPhone(data.phone);
        setIsLoggedIn(true);
        if (Array.isArray(data.collectedFishIds)) {
          setCollection(data.collectedFishIds);
        }
        
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_USER_KEY, data.userId);
          window.localStorage.setItem(STORAGE_PHONE_KEY, data.phone);
        }
        
        setMessage("登录成功！");
        // 登录完成后返回识鱼页
        router.replace("/identify");
      } else {
        const res = await fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: normalized,
            password: passwordTrimmed
          }),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error?.error || "注册失败");
        }

        const data = await res.json();
        setUserId(data.userId);
        setUserPhone(data.phone);
        setIsLoggedIn(true);
        if (Array.isArray(data.collectedFishIds)) {
          setCollection(data.collectedFishIds);
        }
        
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_USER_KEY, data.userId);
          window.localStorage.setItem(STORAGE_PHONE_KEY, data.phone);
        }
        
        setMessage("注册成功！已导入您的图鉴数据。");
        // 注册完成后直接视为登录并返回识鱼页
        router.replace("/identify");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setPhone("");
    setPassword("");
    setMessage(null);
    setError(null);
    
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_PHONE_KEY);
      window.localStorage.removeItem(STORAGE_USER_KEY);
    }

    resetCollection();
    resetUser();
  }

  const header = (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold">登录</h1>
      <p className="text-xs text-slate-500">
        登录后可同步识鱼结果、图鉴收藏与钓点记录，方便在多端持续体验。
      </p>
    </header>
  );

  if (isLoggedIn) {
    return (
      <section className="flex flex-1 flex-col gap-5 pb-4">
        {header}
        <div className="space-y-5 border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="text-sm">
            <div className="font-medium text-slate-900">{userPhone}</div>
            <div className="text-slate-500">已登录</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-sky-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            退出登录
          </button>
        </div>
      </section>
    );
  }

  const inputClassName =
    "w-full border border-slate-200 px-4 py-3 text-[16px] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-base";

  return (
    <section className="flex flex-1 flex-col gap-5 pb-4">
      {header}

      <div className="flex border border-slate-200 bg-white/90 p-1">
        <button
          type="button"
          onClick={() => setIsLoginMode(true)}
          className={`flex-1 py-2 text-sm font-medium transition ${
            isLoginMode
              ? "bg-sky-600 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          登录
        </button>
        <button
          type="button"
          onClick={() => setIsLoginMode(false)}
          className={`flex-1 py-2 text-sm font-medium transition ${
            !isLoginMode
              ? "bg-sky-600 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          注册
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 border border-slate-200 bg-white/90 p-5 shadow-sm">
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="手机号"
          className={inputClassName}
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={isLoginMode ? "密码" : "设置密码（至少 6 位）"}
          className={inputClassName}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <button
          type="submit"
          className="w-full bg-sky-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          disabled={loading}
        >
          {loading ? (isLoginMode ? "登录中..." : "注册中...") : (isLoginMode ? "登录" : "注册")}
        </button>
      </form>

      <div className="space-y-1 rounded-2xl bg-slate-50 px-5 py-4 text-xs text-slate-500">
        <p>· 使用手机号登录即可同步识鱼记录与图鉴收藏。</p>
        <p>· 登录后支持记录钓点、保存识别历史。</p>
        <p>· 如需找回密码，请联系管理员协助处理。</p>
      </div>
    </section>
  );
}
