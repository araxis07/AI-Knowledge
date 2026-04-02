import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { ArrowUpRightIcon, ChatIcon, FileStackIcon, SearchIcon, SparkIcon } from "@/components/ui/icons";
import { requireWorkspaceAccess, getWorkspaceRoleCopy } from "@/lib/workspaces";
import { asRoute } from "@/lib/utils/as-route";

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
          value={access.role}
        />
        <MetricCard
          icon={<SearchIcon />}
          label="Default search"
          note="Current retrieval default wired into workspace settings."
          value={access.workspace.settings.defaultSearchMode}
        />
        <MetricCard
          icon={<ChatIcon />}
          label="Conversation visibility"
          note="Default audience for future assistant threads."
          value={access.workspace.settings.defaultConversationVisibility}
        />
        <MetricCard
          icon={<FileStackIcon />}
          label="Citations policy"
          note="Whether grounded responses must cite sources by default."
          value={access.workspace.settings.citationsRequired ? "Required" : "Flexible"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-7 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase">
                Launch points
              </p>
              <h2 className="mt-3 text-[var(--text-title)] leading-tight text-slate-950">
                Move through the workspace with clear intent.
              </h2>
            </div>
            <Badge className="border-slate-300 bg-white text-slate-700">
              No fake content
            </Badge>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                copy: "Prepare the retrieval surface before semantic and hybrid search land.",
                href: `/app/${access.workspace.slug}/search`,
                icon: <SearchIcon />,
                label: "Search",
              },
              {
                copy: "Stage the corpus area for uploads, ingestion, and document governance.",
                href: `/app/${access.workspace.slug}/documents`,
                icon: <FileStackIcon />,
                label: "Documents",
              },
              {
                copy: "Reserve a dedicated surface for grounded Q&A threads and answer history.",
                href: `/app/${access.workspace.slug}/conversations`,
                icon: <ChatIcon />,
                label: "Conversations",
              },
            ].map((item) => (
              <Link
                key={item.href}
                className="group rounded-[1.6rem] border border-[var(--app-border)] bg-white/82 p-5 transition duration-200 hover:-translate-y-1 hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow)]"
                href={asRoute(item.href)}
              >
                <div className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-panel-muted)] text-slate-800">
                  {item.icon}
                </div>
                <h3 className="mt-5 text-2xl leading-tight text-slate-950">{item.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.copy}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  Open surface
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
              Visit documents
              <ArrowUpRightIcon />
            </Link>
          }
          description="There is no indexed corpus attached yet, which is exactly what this phase expects. The shell shows the future structure without pretending uploads, chunks, or embeddings already exist."
          eyebrow="Current state"
          icon={<FileStackIcon />}
          title="This workspace is waiting for its first document corpus."
        />
      </section>
    </div>
  );
}
