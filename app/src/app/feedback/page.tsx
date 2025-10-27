"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFishStore } from "@/store/useFishStore";

export type FeedbackItem = {
  id: string;
  content: string;
  reply_content: string | null;
  created_at: string;
  replied_at: string | null;
};

function formatTime(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value ?? "-";
  }
}

export default function FeedbackPage() {
  const router = useRouter();
  const isLoggedIn = useFishStore((state) => state.isLoggedIn);
  const userId = useFishStore((state) => state.userId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const activeUserId = userId;

    let cancelled = false;
    async function loadFeedback() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/user/feedback?userId=${encodeURIComponent(activeUserId)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "获取反馈失败");
        }
        const data = await res.json();
        if (!cancelled) {
          setRecords(Array.isArray(data.feedback) ? data.feedback : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "获取反馈失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, userId]);

  if (!isLoggedIn || !userId) {
    return (
      <section className="flex flex-1 flex-col gap-4 pb-4">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">我的反馈</h1>
          <p className="text-xs text-slate-500">登录后可查看历史反馈与管理员回复。</p>
        </header>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 px-6 py-8 text-center text-sm text-slate-600">
          <p>暂未登录，无法查看反馈记录。</p>
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="w-full rounded-full bg-sky-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            前往登录
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-5 pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">我的反馈</h1>
        <p className="text-xs text-slate-500">
          在识鱼页提交的反馈将显示于此，可随时查看管理员回复。
        </p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white/90 px-6 py-4 text-sm text-slate-600">
        <p>
          如需提交新反馈，可返回<Link href="/identify" className="text-sky-600 underline">识鱼</Link>页面点击反馈按钮。
        </p>
      </div>

      {loading && (
        <p className="rounded-3xl border border-slate-200 bg-white/90 px-6 py-4 text-center text-sm text-slate-500">
          正在加载反馈...
        </p>
      )}

      {error && (
        <p className="rounded-3xl border border-red-100 bg-red-50 px-6 py-4 text-center text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && records.length === 0 && (
        <p className="rounded-3xl border border-slate-200 bg-white/90 px-6 py-10 text-center text-sm text-slate-500">
          暂无反馈记录。
        </p>
      )}

      <div className="space-y-4">
        {records.map((item) => (
          <article
            key={item.id}
            className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 px-6 py-6 shadow-sm"
          >
            <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">提交于 {formatTime(item.created_at)}</p>
                <p className="text-xs text-slate-500">
                  状态：{item.reply_content ? "已回复" : "待处理"}
                </p>
              </div>
            </header>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">反馈内容</p>
              <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{item.content}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">管理员回复</p>
              {item.reply_content ? (
                <div className="space-y-1 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <p className="whitespace-pre-wrap">{item.reply_content}</p>
                  <p className="text-right text-xs text-emerald-600">{formatTime(item.replied_at)}</p>
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  管理员收到后会尽快回复，请耐心等待。
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
