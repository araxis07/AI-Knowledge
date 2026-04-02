import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type PageHeaderProps = {
  actions?: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  kicker?: ReactNode;
  title: string;
};

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  kicker,
  title,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[calc(var(--app-radius-card)+0.25rem)] border border-[var(--app-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(245,239,231,0.76))] p-7 shadow-[var(--app-shadow)] sm:p-9",
        className,
      )}
    >
      <div className="app-shell-glow left-[-5rem] top-[-3rem] h-40 w-40 bg-teal-500/18" />
      <div className="app-shell-glow bottom-[-4rem] right-[-3rem] h-44 w-44 bg-amber-400/16" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.26em] text-teal-700 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-[var(--text-display)] leading-[0.94] text-slate-950">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-[var(--text-subtitle)] leading-8 text-[var(--app-foreground-soft)]">
            {description}
          </p>
          {kicker ? <div className="mt-6 flex flex-wrap items-center gap-3">{kicker}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
