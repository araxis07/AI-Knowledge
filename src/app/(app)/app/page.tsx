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
        description="This dashboard is the operating layer above your workspaces. It keeps tenant boundaries clear, reflects access posture, and gives the product a premium control-center feel without inventing fake business data."
        eyebrow="Dashboard home"
        kicker={
          <>
            <Badge className="border-cyan-700/14 bg-cyan-700/8 text-cyan-900">
              Welcome, {getDisplayName(null, user?.email)}
            </Badge>
            <Badge className="border-slate-300 bg-white text-slate-700">
              {workspaces.length > 0 ? "Workspace-ready" : "Awaiting first workspace"}
            </Badge>
          </>
        }
        title={workspaces.length > 0 ? "Everything is staged for the next build-out." : "Create the first workspace and shape the product surface."}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<SparkIcon />}
          label="Visible workspaces"
          note="Tenant surfaces currently accessible from this account."
          tone="tint"
          value={`${workspaces.length}`}
        />
        <MetricCard
          icon={<UserIcon />}
          label="Admin-grade access"
          note="Workspaces where you can manage settings or collaborators."
          value={`${adminCount}`}
        />
        <MetricCard
          icon={<ActivityIcon />}
          label="Citation default"
          note="Workspaces already configured to require grounded answers."
          value={`${citationStrictCount}`}
        />
        <MetricCard
          icon={<ArrowUpRightIcon />}
          label="Shell readiness"
          note="Frontend shell, navigation, and state surfaces are production-oriented."
          value="Live"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-7 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase">
                Workspace roster
              </p>
              <h2 className="mt-3 text-[var(--text-title)] leading-tight text-slate-950">
                Navigate by tenant, not by clutter.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-600">
              Each card below preserves role context and points into a scoped workspace shell.
            </p>
          </div>

          {workspaces.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  className="group rounded-[1.75rem] border border-[var(--app-border)] bg-white/82 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition duration-200 hover:-translate-y-1 hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow)]"
                  href={asRoute(`/app/${workspace.slug}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl leading-tight text-slate-950">{workspace.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {workspace.description ??
                          "A clean workspace foundation ready for corpus, search, and grounded AI flows."}
                      </p>
                    </div>
                    <RoleBadge role={workspace.role} />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Badge className="border-slate-300 bg-slate-50 text-slate-700">
                      /{workspace.slug}
                    </Badge>
                    <Badge className="border-teal-700/16 bg-teal-700/8 text-teal-800">
                      {workspace.settings.defaultSearchMode}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                description="Once the first workspace exists, this dashboard will become the switchboard for documents, search, activity, and grounded conversations."
                eyebrow="Empty state"
                icon={<SparkIcon />}
                title="No workspace exists yet."
              />
            </div>
          )}
        </Card>

        <Card className="p-7 sm:p-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
            New workspace
          </p>
          <h2 className="mt-3 text-[var(--text-title)] leading-tight text-slate-950">
            Shape the next tenant.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose a stable slug, make retrieval defaults intentional, and keep the surface clean from day one.
          </p>
          <div className="mt-6">
            <CreateWorkspaceForm />
          </div>
        </Card>
      </section>
    </div>
  );
}
