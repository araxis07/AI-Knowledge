import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "min-h-12 w-full appearance-none rounded-[var(--app-radius-panel)] border border-[var(--app-border-strong)] bg-white px-4 text-sm text-slate-950 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.22)] outline-none transition placeholder:text-slate-400 focus:border-cyan-700/40 focus:bg-white focus:ring-4 focus:ring-cyan-700/10",
        className,
      )}
      {...props}
    />
  );
}
