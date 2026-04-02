import Link from "next/link";
import type { ReactNode } from "react";

import { RoleBadge } from "@/components/workspaces/role-badge";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { hasMinimumWorkspaceRole, requireWorkspaceAccess } from "@/lib/workspaces";
import { asRoute } from "@/lib/utils/as-route";
import { ArrowUpRightIcon, SparkIcon } from "@/components/ui/icons";

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
    <div className="grid gap-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              className={buttonStyles({ variant: "secondary" })}
              href={asRoute(`/app/${access.workspace.slug}`)}
            >
              Workspace overview
            </Link>
            {hasMinimumWorkspaceRole(access.role, "admin") ? (
              <Link
                className={buttonStyles({ size: "lg", variant: "accent" })}
                href={asRoute(`/app/${access.workspace.slug}/settings`)}
              >
                Open settings
                <ArrowUpRightIcon />
              </Link>
            ) : null}
          </div>
        }
        description={
          access.workspace.description ??
          "This workspace shell is ready for protected documents, grounded search, and role-aware collaboration."
        }
        eyebrow="Workspace"
        kicker={
          <>
            <RoleBadge role={access.role} />
            <Badge className="border-slate-300 bg-white text-slate-700">
              /{access.workspace.slug}
            </Badge>
            <Badge className="border-teal-700/16 bg-teal-700/8 text-teal-800">
              {access.workspace.settings.defaultSearchMode}
            </Badge>
            <Badge className="border-cyan-700/16 bg-cyan-700/8 text-cyan-900">
              <span className="mr-1 inline-flex"><SparkIcon width={14} height={14} /></span>
              {access.workspace.settings.citationsRequired ? "Citations on" : "Citations optional"}
            </Badge>
          </>
        }
        title={access.workspace.name}
      />

      <div>{children}</div>
    </div>
  );
}
