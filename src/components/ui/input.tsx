import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-[var(--app-radius-panel)] border border-[var(--app-border)] bg-white/88 px-4 text-sm text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition placeholder:text-slate-400 focus:border-cyan-700/30 focus:bg-white focus:ring-4 focus:ring-cyan-700/8",
        className,
      )}
      {...props}
    />
  );
}
