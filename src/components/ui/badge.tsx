import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeProps = ComponentPropsWithoutRef<"span">;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-700 uppercase",
        className,
      )}
      {...props}
    />
  );
}
