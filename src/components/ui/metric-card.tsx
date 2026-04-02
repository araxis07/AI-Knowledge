import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type MetricCardProps = {
  icon?: ReactNode;
  label: string;
  note?: string;
  tone?: "default" | "muted" | "tint";
  value: string;
};

export function MetricCard({
  icon,
  label,
  note,
  tone = "default",
  value,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "p-5 sm:p-6",
        tone === "muted" && "bg-[var(--app-panel-muted)]",
        tone === "tint" &&
          "bg-[linear-gradient(145deg,rgba(21,94,117,0.08),rgba(15,118,110,0.08),rgba(255,255,255,0.9))]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl leading-none font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        {icon ? (
          <div className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white/80 text-slate-700">
            {icon}
          </div>
        ) : null}
      </div>
      {note ? <p className="mt-4 text-sm leading-6 text-slate-600">{note}</p> : null}
    </Card>
  );
}
