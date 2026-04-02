import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-[var(--app-radius-panel)] border border-[var(--app-border)] bg-white/88 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700/30 focus:bg-white focus:ring-4 focus:ring-cyan-700/8",
        className,
      )}
      {...props}
    />
  );
}
