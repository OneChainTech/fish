"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type AdminReplyButtonProps = {
  className?: string;
};

export function AdminReplyButton({ className }: AdminReplyButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300",
        className,
      )}
    >
      {pending ? "回复中..." : "回复"}
    </button>
  );
}
