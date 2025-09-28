"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/navigation/navItems";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const resolvedPath = !pathname || pathname === "/" ? "/encyclopedia" : pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/80 bg-white/90 backdrop-blur-sm md:hidden">
      <ul className="mx-auto flex max-w-md items-center justify-around px-6 py-2">
        {navItems.map((item) => {
          const active = resolvedPath.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-3xl px-5 py-3 text-xs font-medium transition-all duration-200",
                  active
                    ? "text-sky-600"
                    : "text-neutral-500 hover:bg-sky-50/80 hover:text-sky-600"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "text-base transition-transform duration-200",
                    active ? "scale-[1.05]" : "group-hover:scale-105"
                  )}
                >
                  {item.label}
                </span>
                <span
                  className={cn(
                    "h-1 w-8 origin-center rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-sky-400 transition-all duration-200",
                    active ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
