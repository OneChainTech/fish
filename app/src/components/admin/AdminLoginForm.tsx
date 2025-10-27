"use client";

import { useActionState } from "react";
import { authenticateAdmin } from "@/lib/admin-auth.server";

import type { AdminLoginState } from "@/lib/admin-auth";

const INITIAL_STATE: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(authenticateAdmin, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="mt-8 flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm"
    >
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-slate-600">
          用户名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          placeholder="请输入管理员账号"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-600">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          placeholder="请输入密码"
        />
      </div>
      {state.error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-500">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
      >
        {pending ? "正在登录..." : "登录"}
      </button>
    </form>
  );
}
