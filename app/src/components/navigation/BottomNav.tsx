"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/identify", label: "识别" },
  { href: "/encyclopedia", label: "图鉴" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/80 bg-white/90 backdrop-blur-sm md:hidden">
      <ul className="mx-auto flex max-w-md items-center justify-around px-6 py-2">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-sm",
                  active
                    ? "text-sky-600"
                    : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <span className="text-base">{item.label}</span>
                <span
                  className={cn(
                    "h-0.5 w-6 rounded-full transition-opacity",
                    active ? "bg-sky-600 opacity-100" : "opacity-0"
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
