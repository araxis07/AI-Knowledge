import Link from "next/link";

import { CreateWorkspaceForm } from "@/components/workspaces/create-workspace-form";
import { RoleBadge } from "@/components/workspaces/role-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { asRoute } from "@/lib/utils/as-route";
import { getDisplayName, listCurrentUserWorkspaces } from "@/lib/workspaces";
import { ActivityIcon, ArrowUpRightIcon, SparkIcon, UserIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { formatSearchModeLabel } from "@/lib/utils/workspace-labels";

export default async function AppHomePage() {
  const [user, workspaces] = await Promise.all([getCurrentUser(), listCurrentUserWorkspaces()]);
  const adminCount = workspaces.filter(
    (workspace) => workspace.role === "admin" || workspace.role === "owner",
  ).length;
  const citationStrictCount = workspaces.filter(
    (workspace) => workspace.settings.citationsRequired,
  ).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        actions={
          workspaces[0] ? (
            <Link
              className={buttonStyles({ size: "lg", variant: "accent" })}
              href={asRoute(`/app/${workspaces[0].slug}`)}
            >
              Open latest workspace
              <ArrowUpRightIcon />
            </Link>
          ) : undefined
        }
        description="Every workspace keeps its own library, search, chats, and settings. Open one below or create a new space for the next project, team, or client."
        eyebrow="Workspace hub"
        kicker={
          <>
            <Badge className="border-cyan-700/14 bg-cyan-700/8 text-cyan-900">
              Signed in as {getDisplayName(null, user?.email)}
            </Badge>
            <Badge className="border-slate-300 bg-white text-slate-700">
              {workspaces.length > 0 ? "Ready to continue" : "Create the first workspace"}
            </Badge>
          </>
        }
        title={
          workspaces.length > 0
            ? "Choose a workspace and keep moving."
            : "Create your first workspace."
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<SparkIcon />}
          label="Your workspaces"
          note="Spaces you can enter right now."
          tone="tint"
          value={`${workspaces.length}`}
        />
        <MetricCard
          icon={<UserIcon />}
          label="Can manage"
          note="Workspaces where you can change settings or member roles."
          value={`${adminCount}`}
        />
        <MetricCard
          icon={<ActivityIcon />}
          label="Citations on"
          note="Workspaces that require source citations by default."
          value={`${citationStrictCount}`}
        />
        <MetricCard
          icon={<ArrowUpRightIcon />}
          label="Next step"
          note="Open a workspace or create a new one."
          value="Ready"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="p-7 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase">
                Your workspaces
              </p>
              <h2 className="mt-3 text-[var(--text-title)] leading-tight text-slate-950">
                Open the space you want to work in.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--app-foreground-soft)]">
              Each workspace keeps its own documents, search, chats, and settings.
            </p>
          </div>

          {workspaces.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  className="group rounded-[1.75rem] border border-[var(--app-border)] bg-white p-5 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.24)] transition duration-200 hover:-translate-y-1 hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow)]"
                  href={asRoute(`/app/${workspace.slug}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl leading-tight text-slate-950">{workspace.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {workspace.description ??
                          "Ready for document uploads, search, and grounded answers."}
                      </p>
                    </div>
                    <RoleBadge role={workspace.role} />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Badge className="border-slate-300 bg-slate-50 text-slate-700">
                      /{workspace.slug}
                    </Badge>
                    <Badge className="border-teal-700/16 bg-teal-700/8 text-teal-800">
                      {formatSearchModeLabel(workspace.settings.defaultSearchMode)}
                    </Badge>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Open workspace
                    <ArrowUpRightIcon />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                description="Create a workspace to give one team or project its own document library, search, chats, and settings."
                eyebrow="No workspace yet"
                icon={<SparkIcon />}
                title="Nothing is in the workspace list yet."
              />
            </div>
          )}
        </Card>

        <div className="grid gap-6">
          <Card className="p-7 sm:p-8">
            <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase">
              New workspace
            </p>
            <h2 className="mt-3 text-[var(--text-title)] leading-tight text-slate-950">
              Create a clean starting point.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--app-foreground-soft)]">
              Pick a clear name, a stable URL slug, and defaults that fit how your team will search and share answers.
            </p>
            <div className="mt-6">
              <CreateWorkspaceForm />
            </div>
          </Card>

          <Card className="p-7 sm:p-8">
            <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
              Quick start
            </p>
            <h2 className="mt-3 text-[var(--text-title)] leading-tight text-slate-950">
              How the app works
            </h2>
            <div className="mt-6 grid gap-4">
              {[
                "Create one workspace for each project, client, or team.",
                "Upload source files into that workspace's document library.",
                "Use search and chat inside the same workspace once documents are ready.",
              ].map((item, index) => (
                <div
                  className="flex items-start gap-4 rounded-[1.4rem] border border-[var(--app-border)] bg-white px-4 py-4"
                  key={item}
                >
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-panel-muted)] text-sm font-semibold text-slate-900">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[var(--app-foreground-soft)]">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
