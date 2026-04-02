import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "min-h-11 w-full appearance-none rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10",
        className,
      )}
      {...props}
    />
  );
}
