import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-panel)] shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
