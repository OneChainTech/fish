import type { Metadata } from "next";
import { ensureAdminAuthenticated } from "@/lib/admin-auth.server";
import { getAllFeedback } from "@/lib/feedback-supabase";
import { respondToFeedback } from "./actions";

export const metadata: Metadata = {
  title: "用户反馈管理",
};

export const dynamic = "force-dynamic";

function formatTime(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AdminFeedbackPage() {
  await ensureAdminAuthenticated();
  const records = await getAllFeedback();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">用户反馈管理</h1>
        <p className="mt-1 text-sm text-slate-500">
          查看用户反馈并进行回复，回复结果将同步到用户反馈列表。
        </p>
      </header>

      <section className="space-y-4">
        {records.length === 0 && (
          <p className="rounded-3xl border border-slate-200 bg-white/70 px-6 py-10 text-center text-sm text-slate-500">
            暂无反馈记录。
          </p>
        )}

        {records.map((item) => (
          <article
            key={item.id}
            className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 px-6 py-6 shadow-sm"
          >
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">用户 {item.user_id}</h2>
                <p className="text-xs text-slate-500">提交时间：{formatTime(item.created_at)}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  item.reply_content
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {item.reply_content ? "已回复" : "待处理"}
              </span>
            </header>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">反馈内容</p>
              <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {item.content}
              </p>
            </div>

            {item.reply_content && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-800">管理员回复（{formatTime(item.replied_at)}）</p>
                <p className="whitespace-pre-wrap rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {item.reply_content}
                </p>
              </div>
            )}

            <form action={respondToFeedback} className="space-y-3">
              <input type="hidden" name="feedbackId" value={item.id} />
              <label className="block text-sm font-medium text-slate-700" htmlFor={`reply-${item.id}`}>
                回复内容
              </label>
              <textarea
                id={`reply-${item.id}`}
                name="reply"
                rows={3}
                defaultValue={item.reply_content ?? ""}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="请输入回复内容"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                >
                  保存回复
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
