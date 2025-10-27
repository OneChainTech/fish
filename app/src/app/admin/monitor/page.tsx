import type { Metadata } from "next";
import { ensureAdminAuthenticated, logoutAdmin } from "@/lib/admin-auth";
import { getUsageStats } from "@/lib/admin-stats";

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
  ensureAdminAuthenticated();
  const stats = await getUsageStats();

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
    </div>
  );
}
