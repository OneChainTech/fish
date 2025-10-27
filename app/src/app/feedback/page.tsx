"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFishStore } from "@/store/useFishStore";

export type FeedbackItem = {
  id: string;
  content: string;
  reply_content: string | null;
  created_at: string;
  replied_at: string | null;
};

export default function FeedbackPage() {
  const router = useRouter();
  const isLoggedIn = useFishStore((state) => state.isLoggedIn);
  const userId = useFishStore((state) => state.userId);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<FeedbackItem[]>([]);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackContent, setFeedbackContent] = useState("");

  const remaining = Math.max(0, 300 - feedbackContent.length);
  const maxFeedback = 3;

  type LoadOptions = { signal?: AbortSignal; withLoading?: boolean };

  const loadFeedback = useCallback(async ({ signal, withLoading = true }: LoadOptions = {}) => {
    if (!isLoggedIn || !userId) return;

    if (signal?.aborted) return;

    if (withLoading) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/feedback?userId=${encodeURIComponent(userId)}`, {
        signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "获取反馈失败");
      }
      const data = await res.json();
      if (signal?.aborted) return;
      setRecords(Array.isArray(data.feedback) ? data.feedback : []);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : "获取反馈失败");
    } finally {
      if (withLoading && !signal?.aborted) {
        setLoading(false);
      }
    }
  }, [isLoggedIn, userId]);

  useEffect(() => {
    const controller = new AbortController();
    loadFeedback({ signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [loadFeedback]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoggedIn) {
      router.push("/account");
      return;
    }

    if (!userId) {
      setFeedbackError("请重新登录后再试。");
      return;
    }

    const trimmed = feedbackContent.trim();
    if (!trimmed) {
      setFeedbackError("请输入反馈内容。");
      return;
    }

    setSubmitting(true);
    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      const response = await fetch("/api/user/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "提交反馈失败，请稍后再试。");
      }

      setFeedbackContent("");
      setFeedbackMessage("反馈已提交，我们会尽快处理。");
      await loadFeedback({ withLoading: false });
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "提交反馈失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn || !userId) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">我的反馈</h1>
          <p className="text-xs text-slate-500">登录后即可提交反馈并查看历史处理进度。</p>
        </header>
        <div className="rounded-lg border border-slate-200 px-4 py-6 text-center text-sm text-slate-600">
          <p>暂未登录，无法查看反馈记录。</p>
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            前往登录
          </button>
        </div>
      </section>
    );
  }

  const canSubmit = records.length < maxFeedback;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">我的反馈</h1>
        <p className="text-xs text-slate-500">反馈记录与管理员回复将同步显示在此页面。</p>
      </header>

      {feedbackMessage && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {feedbackMessage} 可在下方列表查看处理进度。
        </p>
      )}

      {feedbackError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{feedbackError}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-4" noValidate>
        <div className="relative">
          <textarea
            id="feedback-content"
            name="feedback"
            rows={4}
            value={feedbackContent}
            maxLength={300}
            onChange={(event) => {
              const value = event.target.value.slice(0, 300);
              setFeedbackContent(value);
              if (feedbackError) setFeedbackError(null);
            }}
            disabled={!canSubmit || submitting}
            className="w-full resize-none rounded-md border border-slate-200 px-3 pb-8 pr-24 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
            placeholder="请描述遇到的问题或建议，最多 300 字"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-slate-400">
            {canSubmit ? `还可输入 ${remaining} 字` : "已达到反馈上限"}
          </span>
        </div>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "提交中..." : canSubmit ? "提交反馈" : "请等待处理"}
        </button>
        {!canSubmit && (
          <p className="text-[11px] text-slate-400">
            您已提交 3 条反馈，请耐心等待处理后再尝试。
          </p>
        )}
      </form>

      {loading && (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-3 text-center text-xs text-slate-500">
          正在加载反馈...
        </p>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-center text-xs text-red-600">{error}</p>
      )}

      {!loading && !error && records.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-8 text-center text-sm text-slate-500">
          暂无反馈记录。
        </p>
      )}

      {records.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-200">
            {records.map((item) => (
              <li key={item.id} className="space-y-3 px-4 py-4 text-sm text-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-slate-900">反馈内容</span>
                  <span
                    className={`rounded-full px-2 py-[2px] text-[11px] font-medium ${
                      item.reply_content ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {item.reply_content ? "已回复" : "待处理"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{item.content}</p>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {item.reply_content ? (
                    <>
                      <p className="whitespace-pre-wrap text-slate-700">{item.reply_content}</p>
                    </>
                  ) : (
                    <p>管理员收到后会尽快回复，请耐心等待。</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
