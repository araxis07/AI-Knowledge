import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireAuthenticatedUser, syncCurrentUserProfile } from "@/lib/auth";
import { listCurrentUserWorkspaces } from "@/lib/workspaces";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const user = await requireAuthenticatedUser("/app");
  const [profile, workspaces] = await Promise.all([
    syncCurrentUserProfile(user),
    listCurrentUserWorkspaces(),
  ]);

  return (
    <AppShell profile={profile} workspaces={workspaces}>
      {children}
    </AppShell>
  );
}
