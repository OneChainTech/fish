import type { Metadata } from "next";
import { ensureAdminAuthenticated } from "@/lib/admin-auth.server";
import { getAllFeedback } from "@/lib/feedback-supabase";
import { respondToFeedback } from "./actions";
import { AdminReplyButton } from "@/components/admin/AdminReplyButton";

export const metadata: Metadata = {
  title: "用户反馈管理",
};

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  await ensureAdminAuthenticated();
  const records = await getAllFeedback();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">用户反馈管理</h1>
        <p className="mt-1 text-sm text-slate-500">集中查看用户反馈并快速回复。</p>
      </header>

      {records.length === 0 ? (
        <p className="rounded-3xl border border-slate-200 bg-white/70 px-6 py-10 text-center text-sm text-slate-500">
          暂无反馈记录。
        </p>
      ) : (
        <section className="space-y-4">
          {records.map((item) => (
            <article
              key={item.id}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white/85 px-5 py-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">用户 {item.user_id}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-[2px] text-[11px] font-medium ${
                    item.reply_content ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {item.reply_content ? "已回复" : "待处理"}
                </span>
              </div>

              <div className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <p className="whitespace-pre-wrap leading-relaxed">{item.content}</p>
              </div>

              <div className="space-y-2 rounded-md border border-slate-200 bg-white px-3 py-3">
                <form action={respondToFeedback} className="space-y-2 text-sm text-slate-700">
                  <input type="hidden" name="feedbackId" value={item.id} />
                  <label className="text-xs font-medium text-slate-500" htmlFor={`reply-${item.id}`}>
                    回复内容
                  </label>
                  <textarea
                    id={`reply-${item.id}`}
                    name="reply"
                    rows={3}
                    defaultValue={item.reply_content ?? ""}
                    style={{ fontSize: "16px" }}
                    className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="输入要发送的回复，最多 300 字"
                  />
                  <div className="flex justify-end">
                    <AdminReplyButton />
                  </div>
                </form>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
