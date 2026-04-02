import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  actions?: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  icon?: ReactNode;
  title: string;
};

export function EmptyState({
  actions,
  className,
  description,
  eyebrow,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-7 sm:p-8",
        className,
      )}
    >
      <div className="app-shell-glow right-[-2rem] top-[-2rem] h-32 w-32 bg-teal-500/14" />
      <div className="relative flex flex-col gap-5">
        <div className="flex items-center gap-4">
          {icon ? (
            <div className="inline-flex size-12 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-panel-muted)] text-slate-900">
              {icon}
            </div>
          ) : null}
          <p className="text-sm font-semibold tracking-[0.22em] text-teal-700 uppercase">
            {eyebrow}
          </p>
        </div>
        <div>
          <h2 className="text-[var(--text-title)] leading-tight text-slate-950">{title}</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--app-foreground-soft)]">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </Card>
  );
}
