import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { asRoute } from "@/lib/utils/as-route";

type SiteHeaderProps = {
  actions?: ReactNode;
  caption?: string;
};

export function SiteHeader({ actions, caption }: SiteHeaderProps) {
  return (
    <header className="border-b border-black/8 bg-white/80 backdrop-blur-xl">
      <Container className="flex min-h-16 items-center justify-between gap-6">
        <Link
          href={asRoute("/")}
          className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-slate-900 uppercase"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-teal-700 text-xs font-bold tracking-[0.2em] text-white">
            AK
          </span>
          AI Knowledge Base
        </Link>

        {actions ?? (
          <p className="hidden text-sm text-slate-600 md:block">
            {caption ?? "Grounded document search platform foundation"}
          </p>
        )}
      </Container>
    </header>
  );
}
