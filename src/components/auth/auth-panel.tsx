import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type AuthPanelProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function AuthPanel({ children, description, eyebrow, title }: AuthPanelProps) {
  return (
    <Card className="grid overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
      <div className="border-b border-[var(--app-border)] bg-slate-950 px-8 py-10 text-white lg:border-r lg:border-b-0 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold tracking-[0.24em] text-teal-200 uppercase">{eyebrow}</p>
        <h1 className="mt-5 max-w-md text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-slate-300">{description}</p>
      </div>

      <div className="px-8 py-10 lg:px-10 lg:py-12">{children}</div>
    </Card>
  );
}
