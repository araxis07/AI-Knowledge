import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Container } from "@/components/ui/container";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import type { ProfileSummary, WorkspaceSummary } from "@/lib/types/workspaces";
import { asRoute } from "@/lib/utils/as-route";
import { getDisplayName } from "@/lib/workspaces";

type AppShellProps = {
  children: ReactNode;
  profile: ProfileSummary;
  workspaces: WorkspaceSummary[];
};

export function AppShell({ children, profile, workspaces }: AppShellProps) {
  const displayName = getDisplayName(profile, profile.email);

  return (
    <div className="min-h-screen bg-[var(--app-background)] text-[var(--app-foreground)]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,164,0.22),_transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.14),_transparent_58%)]" />
        <div className="absolute left-[-6rem] top-72 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-20 h-80 w-80 rounded-full bg-teal-400/12 blur-3xl" />
      </div>

      <header className="border-b border-black/8 bg-white/80 backdrop-blur-xl">
        <Container className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-slate-900 uppercase"
              href={asRoute("/app")}
            >
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-teal-700 text-xs font-bold tracking-[0.2em] text-white">
                AK
              </span>
              AI Knowledge Base
            </Link>
            <div className="w-full sm:w-auto">
              <WorkspaceSwitcher workspaces={workspaces} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{displayName}</p>
              <p>{profile.email}</p>
            </div>
            <SignOutButton />
          </div>
        </Container>
      </header>

      <main>{children}</main>
    </div>
  );
}
