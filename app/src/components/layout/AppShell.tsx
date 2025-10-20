"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ClientBootstrap } from "@/components/layout/ClientBootstrap";
import { BottomNav } from "@/components/navigation/BottomNav";
import { useCollectionSync } from "@/hooks/useCollectionSync";
import { navItems } from "@/components/navigation/navItems";
import { useFishStore } from "@/store/useFishStore";
import { cn } from "@/lib/utils";
import { AddToHomePrompt } from "@/components/pwa/AddToHomePrompt";

function CollectionSyncGate() {
  useCollectionSync();
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const resolvedPath = !pathname || pathname === "/" ? "/encyclopedia" : pathname;
  const isLoggedIn = useFishStore((state) => state.isLoggedIn);
  const userPhone = useFishStore((state) => state.userPhone);

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_60%)]" />
      <ClientBootstrap />
      <CollectionSyncGate />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-24 pt-5 sm:px-6">
        <header className="mb-5 hidden items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-md md:flex">
          <Link href="/identify" className="text-base font-semibold text-sky-600">
            有口
          </Link>
          <div className="flex items-center gap-4">
            {/* 用户状态指示器 */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                isLoggedIn ? "bg-emerald-500" : "bg-slate-300"
              )} />
              <span className="text-xs text-slate-500">
                {isLoggedIn
                  ? `已登录 ${userPhone?.slice(0, 3)}****${userPhone?.slice(-4)}`
                  : "未登录"}
              </span>
            </div>
            <nav className="flex items-center gap-3 text-xs text-slate-500">
              {navItems.map((item) => {
                const active = resolvedPath.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-sky-500/10 via-sky-500/20 to-sky-500/10 text-sky-700 shadow-[0_12px_30px_-22px_rgba(14,165,233,0.8)] scale-[1.04]"
                        : "text-slate-500 hover:bg-sky-500/10 hover:text-sky-700 hover:shadow-[0_10px_26px_-24px_rgba(14,165,233,0.85)] hover:scale-[1.03]"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
        {children}
      </main>
      <AddToHomePrompt />
      <BottomNav />
    </div>
  );
}
