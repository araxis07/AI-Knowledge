import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type ErrorStateProps = {
  actions?: ReactNode;
  description: string;
  digest?: string | undefined;
  eyebrow: string;
  title: string;
};

export function ErrorState({
  actions,
  description,
  digest,
  eyebrow,
  title,
}: ErrorStateProps) {
  return (
    <Card className="overflow-hidden border-rose-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,241,242,0.94))] p-7 sm:p-8">
      <p className="text-sm font-semibold tracking-[0.24em] text-rose-700 uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-[var(--text-title)] leading-tight text-slate-950">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">{description}</p>
      {digest ? (
        <p className="mt-5 font-[var(--font-mono)] text-xs text-slate-500">Digest: {digest}</p>
      ) : null}
      {actions ? <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div> : null}
    </Card>
  );
}
