import Link from "next/link";

import { Container } from "@/components/ui/container";

export function SiteHeader() {
  return (
    <header className="border-b border-black/8 bg-white/80 backdrop-blur-xl">
      <Container className="flex min-h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-slate-900 uppercase"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-teal-700 text-xs font-bold tracking-[0.2em] text-white">
            AK
          </span>
          AI Knowledge Base
        </Link>
        <p className="hidden text-sm text-slate-600 md:block">
          Phase 1 scaffold for a grounded document search platform
        </p>
      </Container>
    </header>
  );
}
