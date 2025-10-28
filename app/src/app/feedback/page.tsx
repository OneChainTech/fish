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

  const handleDelete = async (feedbackId: string) => {
    if (!isLoggedIn || !userId) return;

    try {
      const response = await fetch(
        `/api/user/feedback?userId=${encodeURIComponent(userId)}&feedbackId=${encodeURIComponent(feedbackId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "删除反馈失败，请稍后再试。");
      }
      await loadFeedback({ withLoading: false });
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "删除反馈失败，请稍后再试。");
    }
  };

  if (!isLoggedIn || !userId) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-0 py-6 sm:px-0">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-slate-900">我的反馈</h1>
          <p className="text-sm text-slate-500">登录后即可提交反馈并查看历史处理进度。</p>
        </header>
        <div className="border border-slate-200 px-4 py-7 text-center text-base text-slate-600">
          <p>暂未登录，无法查看反馈记录。</p>
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            前往登录
          </button>
        </div>
      </section>
    );
  }

  const canSubmit = records.length < maxFeedback;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-0 py-6 sm:px-0">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-slate-900">我的反馈</h1>
        <p className="text-sm text-slate-500">反馈记录与管理员回复将同步显示在此页面。</p>
      </header>

      {feedbackMessage && (
        <p className="border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm text-emerald-700 shadow-sm">
          {feedbackMessage} 可在下方列表查看处理进度。
        </p>
      )}

      {feedbackError && (
        <p className="border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-600 shadow-sm">
          {feedbackError}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-3xl bg-white px-6 py-8 shadow-sm"
        noValidate
      >
        <div className="relative">
          <textarea
            id="feedback-content"
            name="feedback"
            rows={6}
            value={feedbackContent}
            maxLength={300}
            onChange={(event) => {
              const value = event.target.value.slice(0, 300);
              setFeedbackContent(value);
              if (feedbackError) setFeedbackError(null);
            }}
            disabled={!canSubmit || submitting}
            style={{ fontSize: "16px" }}
            className="w-full min-h-[220px] resize-none border border-slate-200 px-5 pb-12 pr-32 text-base text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
            placeholder="请描述遇到的问题或建议，最多 300 字"
          />
          <span className="pointer-events-none absolute bottom-3 right-5 text-xs text-slate-400">
            {canSubmit ? `还可输入 ${remaining} 字` : "已达到反馈上限"}
          </span>
        </div>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="flex h-12 w-full items-center justify-center gap-2 bg-sky-600 text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "提交中..." : canSubmit ? "提交反馈" : "请等待处理"}
        </button>
        {!canSubmit && (
          <p className="text-xs text-slate-400">
            您已提交 3 条反馈，请耐心等待处理后再尝试。
          </p>
        )}
      </form>

      {loading && (
        <p className="border border-white/70 bg-white/95 px-6 py-4 text-center text-sm text-slate-500">
          正在加载反馈...
        </p>
      )}

      {error && (
        <p className="border border-red-100 bg-red-50 px-6 py-4 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && records.length === 0 && (
        <p className="border border-white/70 bg-white/95 px-6 py-12 text-center text-base text-slate-500">
          暂无反馈记录。
        </p>
      )}

      {records.length > 0 && (
        <div className="space-y-5">
          {records.map((item) => (
            <article
              key={item.id}
              className="border border-white/70 bg-white/95 px-7 py-7 text-base text-slate-700 shadow-sm"
            >
              <header className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex h-3 w-3 rounded-full ${
                    item.reply_content ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                  role="status"
                  aria-label={item.reply_content ? "已回复" : "待处理"}
                  title={item.reply_content ? "已回复" : "待处理"}
                />
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-sm text-slate-400 underline underline-offset-4 transition hover:text-slate-600"
                >
                  关闭反馈
                </button>
              </header>

              <section className="mt-4">
                <p className="whitespace-pre-wrap bg-slate-50 px-4 py-4 leading-relaxed text-slate-800">
                  {item.content}
                </p>
              </section>

              {item.reply_content && (
                <section className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-slate-500">管理员回复</p>
                  <p className="whitespace-pre-wrap bg-emerald-50 px-4 py-4 text-slate-700">
                    {item.reply_content}
                  </p>
                </section>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
