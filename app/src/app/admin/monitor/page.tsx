import Link from "next/link";
import type { Metadata } from "next";
import { ensureAdminAuthenticated, logoutAdmin } from "@/lib/admin-auth.server";
import { getUsageStats } from "@/lib/admin-stats";
import { getAllFeedback } from "@/lib/feedback-supabase";
import { respondToFeedback } from "../feedback/actions";

export const metadata: Metadata = {
  title: "应用监控面板",
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

export default async function MonitorPage() {
  await ensureAdminAuthenticated();
  const [stats, feedbackRecords] = await Promise.all([getUsageStats(), getAllFeedback()]);
  const recentFeedback = feedbackRecords.slice(0, 5);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">监控总览</h1>
          <p className="mt-1 text-sm text-slate-500">查看应用的用户规模、图鉴解锁进度与标记活动</p>
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

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white/80 px-5 py-6 shadow-sm">
          <p className="text-sm text-slate-500">注册用户</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalUsers}</p>
          <p className="mt-1 text-xs text-slate-400">user_profile 表统计</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 px-5 py-6 shadow-sm">
          <p className="text-sm text-slate-500">图鉴进度记录</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalProgressRecords}</p>
          <p className="mt-1 text-xs text-slate-400">user_progress 表中的用户数</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 px-5 py-6 shadow-sm">
          <p className="text-sm text-slate-500">钓点/标记数量</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalMarks}</p>
          <p className="mt-1 text-xs text-slate-400">user_marks 表总计</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">收藏量 Top 6</h2>
            <span className="text-xs text-slate-400">按解锁次数排序</span>
          </div>
          <div className="mt-5 space-y-4">
            {stats.topCollectedFish.length === 0 && (
              <p className="rounded-2xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">暂无收藏数据</p>
            )}
            {stats.topCollectedFish.map((item) => (
              <div
                key={item.fishId}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-400">ID: {item.fishId} · 稀有度：{item.rarity}</p>
                </div>
                <span className="text-lg font-semibold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">最新钓点标记</h2>
            <span className="text-xs text-slate-400">最近 10 条</span>
          </div>
          <div className="mt-5 space-y-3">
            {stats.recentMarks.length === 0 && (
              <p className="rounded-2xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">暂无标记数据</p>
            )}
            {stats.recentMarks.map((mark) => (
              <div key={`${mark.user_id}-${mark.fish_id}-${mark.recorded_at}`} className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-slate-900">用户 {mark.user_id}</p>
                <p className="mt-1 text-xs text-slate-500">鱼 ID：{mark.fish_id}</p>
                <p className="mt-1 text-xs text-slate-500">地点：{mark.address}</p>
                <p className="mt-1 text-xs text-slate-400">记录时间：{formatTime(mark.recorded_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">最新图鉴进度</h2>
          <span className="text-xs text-slate-400">最近 8 名用户</span>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">用户 ID</th>
                <th className="px-4 py-3 font-medium text-slate-500">收藏数量</th>
                <th className="px-4 py-3 font-medium text-slate-500">最近更新时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/70">
              {stats.recentProgress.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                    暂无进度数据
                  </td>
                </tr>
              )}
              {stats.recentProgress.map((item) => (
                <tr key={`${item.userId}-${item.updatedAt ?? "na"}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.userId}</td>
                  <td className="px-4 py-3 text-slate-600">{item.collectedCount}</td>
                  <td className="px-4 py-3 text-slate-600">{formatTime(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">最新用户反馈</h2>
          <Link href="/admin/feedback" className="text-xs font-medium text-sky-600 hover:text-sky-700">
            查看全部
          </Link>
        </div>
        {recentFeedback.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">
            暂无反馈记录。
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {recentFeedback.map((item) => (
              <article
                key={item.id}
                className="space-y-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">用户 {item.user_id}</p>
                    <p className="text-xs text-slate-400">反馈 ID：{item.id}</p>
                  </div>
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
                    {item.reply_content ? "更新回复" : "填写回复"}
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
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-700"
                    >
                      保存
                    </button>
                  </div>
                </form>

                {item.reply_content && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <p className="whitespace-pre-wrap">{item.reply_content}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
