"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ClientBootstrap } from "@/components/layout/ClientBootstrap";
import { useCollectionSync } from "@/hooks/useCollectionSync";
import { cn } from "@/lib/utils";

const desktopNav = [
  { href: "/identify", label: "识别" },
  { href: "/encyclopedia", label: "图鉴" },
];

function CollectionSyncGate() {
  useCollectionSync();
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const resolvedPath = !pathname || pathname === "/" ? "/identify" : pathname;

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_60%)]" />
      <ClientBootstrap />
      <CollectionSyncGate />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-24 pt-5 sm:px-6">
        <header className="mb-5 hidden items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-md md:flex">
          <Link href="/identify" className="text-base font-semibold text-sky-600">
            鱼类识别图鉴
          </Link>
          <nav className="flex gap-2 text-xs text-slate-500">
            {desktopNav.map((item) => {
              const active = resolvedPath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 transition",
                    active
                      ? "bg-sky-100 text-sky-700"
                      : "text-slate-500 hover:bg-sky-100 hover:text-sky-700"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
