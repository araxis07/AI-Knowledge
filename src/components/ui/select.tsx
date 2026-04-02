import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "min-h-12 w-full appearance-none rounded-[var(--app-radius-panel)] border border-[var(--app-border)] bg-white/88 px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-700/30 focus:bg-white focus:ring-4 focus:ring-cyan-700/8",
        className,
      )}
      {...props}
    />
  );
}
