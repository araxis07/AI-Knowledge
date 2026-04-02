import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";

type SiteShellProps = {
  children: ReactNode;
  actions?: ReactNode;
  caption?: string;
};

export function SiteShell({ actions, caption, children }: SiteShellProps) {
  return (
    <div className="min-h-screen bg-[var(--app-background)] text-[var(--app-foreground)]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_58%)]" />
        <div className="absolute right-[-10rem] top-28 h-80 w-80 rounded-full bg-teal-400/12 blur-3xl" />
        <div className="absolute left-[-8rem] top-72 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>
      <SiteHeader actions={actions} {...(caption ? { caption } : {})} />
      <main>{children}</main>
    </div>
  );
}
