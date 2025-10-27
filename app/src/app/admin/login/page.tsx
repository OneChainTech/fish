import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "管理员登录",
};

export default function AdminLoginPage() {
  if (isAdminAuthenticated()) {
    redirect("/admin/monitor");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 px-4 py-10">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <h1 className="text-2xl font-semibold text-slate-900">有口 · 管理员控制台</h1>
        <p className="mt-2 text-sm text-slate-500">请使用管理员账号登录以查看监控数据</p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
