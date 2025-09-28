"use client";

import { FormEvent, useState } from "react";
import { useFishStore } from "@/store/useFishStore";
import { useRouter } from "next/navigation";

const PHONE_REGEX = /^1\d{10}$/;
const STORAGE_PHONE_KEY = "fish-user-phone";
const STORAGE_USER_KEY = "fish-anon-id";

function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  return PHONE_REGEX.test(digits) ? digits : null;
}

export default function AccountPage() {
  const userId = useFishStore((state) => state.userId);
  const userPhone = useFishStore((state) => state.userPhone);
  const isLoggedIn = useFishStore((state) => state.isLoggedIn);
  const setUserId = useFishStore((state) => state.setUserId);
  const setUserPhone = useFishStore((state) => state.setUserPhone);
  const setIsLoggedIn = useFishStore((state) => state.setIsLoggedIn);
  const setCollection = useFishStore((state) => state.setCollection);
  const resetUser = useFishStore((state) => state.resetUser);
  const router = useRouter();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function migrateLocalMarks(fromId: string | null | undefined, toId: string) {
    if (typeof window === "undefined") return;
    if (!fromId || fromId === toId) return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        keys.push(k);
      }
      const prefix = `fish-marks-${fromId}-`;
      
      // 迁移本地标点并同步到云端
      for (const k of keys) {
        if (k.startsWith(prefix)) {
          const payload = window.localStorage.getItem(k);
          if (!payload) continue;
          
          try {
            const marks = JSON.parse(payload);
            if (Array.isArray(marks)) {
              const fishId = k.slice(prefix.length);
              
              // 将每个标点同步到云端
              for (const mark of marks) {
                if (mark.address) {
                  try {
                    await fetch("/api/user/marks", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        userId: toId, 
                        fishId, 
                        address: mark.address 
                      })
                    });
                  } catch (error) {
                    console.warn("同步标点到云端失败", error);
                  }
                }
              }
            }
          } catch (error) {
            console.warn("解析标点数据失败", error);
          }
          
          // 删除旧的本地标点
          window.localStorage.removeItem(k);
        }
      }
    } catch (error) {
      console.warn("迁移标点失败", error);
    }
  }

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
        // 登录
        const res = await fetch(
          `/api/user/profile?phone=${encodeURIComponent(normalized)}&password=${encodeURIComponent(passwordTrimmed)}`
        );
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error?.error || "登录失败");
        }

        const data = await res.json();
        // 迁移本地标点（匿名ID -> 手机号）
        const prevAnonId = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_USER_KEY) : null;
        await migrateLocalMarks(prevAnonId, data.userId);
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
        // 注册
        const res = await fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            phone: normalized, 
            password: passwordTrimmed,
            anonUserId: userId // 导入当前匿名用户的数据
          }),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error?.error || "注册失败");
        }

        const data = await res.json();
        // 迁移本地标点（匿名ID -> 手机号）
        const prevAnonId = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_USER_KEY) : null;
        await migrateLocalMarks(prevAnonId, data.userId);
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
    
    // 清除登录状态，回到匿名用户模式
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_PHONE_KEY);
      // 重新生成匿名用户ID
      const newAnonId = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_USER_KEY, newAnonId);
      setUserId(newAnonId);
    }
    
    // 重置用户状态
    resetUser();
  }

  if (isLoggedIn) {
    return (
      <section className="flex flex-1 flex-col gap-5 pb-4">
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

  return (
    <section className="flex flex-1 flex-col gap-5 pb-4">
      {/* 移除当前状态显示区域，保持简洁 */}

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
        <h2 className="text-lg font-medium text-slate-900">
          {isLoginMode ? "登录账号" : "注册账号"}
        </h2>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="手机号"
          className="w-full border border-slate-200 px-4 py-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={isLoginMode ? "密码" : "设置密码（至少 6 位）"}
          className="w-full border border-slate-200 px-4 py-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
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

      {!isLoginMode && (
        <div className="border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            💡 注册后将自动导入您当前的图鉴收藏，实现多终端数据同步
          </p>
        </div>
      )}
    </section>
  );
}
