import Link from "next/link";
import type { ReactNode } from "react";

import { RoleBadge } from "@/components/workspaces/role-badge";
import { Container } from "@/components/ui/container";
import { hasMinimumWorkspaceRole, requireWorkspaceAccess } from "@/lib/workspaces";
import { asRoute } from "@/lib/utils/as-route";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    workspaceSlug: string;
  }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceSlug } = await params;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");

  return (
    <Container className="py-10 sm:py-12">
      <div className="rounded-[2rem] border border-[var(--app-border)] bg-white/70 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase">
              Workspace
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {access.workspace.name}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              {access.workspace.description ??
                "This workspace is ready for protected documents, grounded search, and role-aware collaboration."}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <RoleBadge role={access.role} />
              <span className="rounded-full border border-[var(--app-border)] bg-slate-50 px-3 py-1 text-sm text-slate-600">
                /{access.workspace.slug}
              </span>
            </div>
          </div>

          <nav className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              href={asRoute(`/app/${access.workspace.slug}`)}
            >
              Overview
            </Link>
            {hasMinimumWorkspaceRole(access.role, "admin") && (
              <Link
                className="rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                href={asRoute(`/app/${access.workspace.slug}/settings`)}
              >
                Settings
              </Link>
            )}
          </nav>
        </div>
      </div>

      <div className="mt-8">{children}</div>
    </Container>
  );
}
