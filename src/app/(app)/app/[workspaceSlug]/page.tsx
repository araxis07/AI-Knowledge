import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { ArrowUpRightIcon, ChatIcon, FileStackIcon, SearchIcon, SparkIcon } from "@/components/ui/icons";
import { requireWorkspaceAccess, getWorkspaceRoleCopy } from "@/lib/workspaces";
import { asRoute } from "@/lib/utils/as-route";
import {
  formatConversationVisibilityLabel,
  formatSearchModeLabel,
  formatWorkspaceRoleLabel,
} from "@/lib/utils/workspace-labels";

type WorkspaceOverviewPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

export default async function WorkspaceOverviewPage({
  params,
}: WorkspaceOverviewPageProps) {
  const { workspaceSlug } = await params;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<SparkIcon />}
          label="Your role"
          note={getWorkspaceRoleCopy(access.role)}
          tone="tint"
          value={formatWorkspaceRoleLabel(access.role)}
        />
        <MetricCard
          icon={<SearchIcon />}
          label="Default search"
          note="How search will work here by default."
          value={formatSearchModeLabel(access.workspace.settings.defaultSearchMode)}
        />
        <MetricCard
          icon={<ChatIcon />}
          label="Chat visibility"
          note="Who can see new chats by default."
          value={formatConversationVisibilityLabel(
            access.workspace.settings.defaultConversationVisibility,
          )}
        />
        <MetricCard
          icon={<FileStackIcon />}
          label="Citations"
          note="Whether answers should cite sources by default."
          value={access.workspace.settings.citationsRequired ? "Required" : "Flexible"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-7 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase">
                Start here
              </p>
              <h2 className="mt-3 text-[var(--text-title)] leading-tight text-slate-950">
                Follow the workflow in order.
              </h2>
            </div>
            <Badge className="border-slate-300 bg-white text-slate-700">
              Workspace ready
            </Badge>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                copy: "Upload and manage the source files that power this workspace.",
                href: `/app/${access.workspace.slug}/documents`,
                icon: <FileStackIcon />,
                label: "Open document library",
              },
              {
                copy: "Search across uploaded files when the library is ready.",
                href: `/app/${access.workspace.slug}/search`,
                icon: <SearchIcon />,
                label: "Search this workspace",
              },
              {
                copy: "Ask grounded questions and keep answer threads in one place.",
                href: `/app/${access.workspace.slug}/conversations`,
                icon: <ChatIcon />,
                label: "Open chats",
              },
            ].map((item) => (
              <Link
                key={item.href}
                className="group rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow)]"
                href={asRoute(item.href)}
              >
                <div className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-panel-muted)] text-slate-800">
                  {item.icon}
                </div>
                <h3 className="mt-5 text-2xl leading-tight text-slate-950">{item.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.copy}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  Continue
                  <ArrowUpRightIcon />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <EmptyState
          actions={
            <Link
              className={buttonStyles({ size: "lg", variant: "accent" })}
              href={asRoute(`/app/${access.workspace.slug}/documents`)}
            >
              Upload the first document
              <ArrowUpRightIcon />
            </Link>
          }
          description="The simplest path is: add a document, wait for processing, then search or ask inside this same workspace."
          eyebrow="Next best action"
          icon={<FileStackIcon />}
          title="This workspace is waiting for its first document."
        />
      </section>
    </div>
  );
}
