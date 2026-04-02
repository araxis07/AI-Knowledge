import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeProps = ComponentPropsWithoutRef<"span">;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-700 uppercase shadow-[0_8px_18px_-14px_rgba(15,23,42,0.2)]",
        className,
      )}
      {...props}
    />
  );
}
