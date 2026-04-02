import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--app-radius-card)] border border-[var(--app-border)] bg-[var(--app-panel)] shadow-[var(--app-shadow)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
