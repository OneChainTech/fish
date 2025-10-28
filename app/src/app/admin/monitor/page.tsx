import type { Metadata } from "next";
import { ensureAdminAuthenticated, logoutAdmin } from "@/lib/admin-auth.server";
import { getAllFeedback } from "@/lib/feedback-supabase";
import { respondToFeedback } from "../feedback/actions";
import { AdminReplyButton } from "@/components/admin/AdminReplyButton";

export const metadata: Metadata = {
  title: "用户反馈面板",
};

export const dynamic = "force-dynamic";

export default async function MonitorPage() {
  await ensureAdminAuthenticated();
  const feedbackRecords = await getAllFeedback();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">用户反馈面板</h1>
          <p className="mt-1 text-sm text-slate-500">集中查看用户反馈并快速回复。</p>
        </div>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
          >
            退出登录
          </button>
        </form>
      </header>

      {feedbackRecords.length === 0 ? (
        <p className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-10 text-center text-sm text-slate-500">
          暂无反馈记录。
        </p>
      ) : (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/85 px-6 py-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">全部反馈</h2>
          <div className="space-y-4">
            {feedbackRecords.map((item) => (
              <article
                key={item.id}
                className="space-y-3 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">用户 {item.user_id}</p>
                  <span
                    className={`rounded-full px-2 py-[2px] text-[11px] font-medium ${
                      item.reply_content ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {item.reply_content ? "已回复" : "待处理"}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p className="whitespace-pre-wrap leading-relaxed">{item.content}</p>
                </div>

                <form action={respondToFeedback} className="space-y-2">
                  <input type="hidden" name="feedbackId" value={item.id} />
                  <label className="text-xs font-medium text-slate-700" htmlFor={`reply-${item.id}`}>
                    回复内容
                  </label>
                  <textarea
                    id={`reply-${item.id}`}
                    name="reply"
                    rows={3}
                    defaultValue={item.reply_content ?? ""}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="输入要发送给用户的回复内容"
                  />
                  <div className="flex justify-end">
                    <AdminReplyButton className="rounded-full px-4 py-2" />
                  </div>
                </form>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
