import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeProps = ComponentPropsWithoutRef<"span">;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--app-border)] bg-white/88 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-700 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        className,
      )}
      {...props}
    />
  );
}
