import Link from "next/link";

import { CreateWorkspaceForm } from "@/components/workspaces/create-workspace-form";
import { RoleBadge } from "@/components/workspaces/role-badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { asRoute } from "@/lib/utils/as-route";
import { getDisplayName, listCurrentUserWorkspaces } from "@/lib/workspaces";

export default async function AppHomePage() {
  const [user, workspaces] = await Promise.all([getCurrentUser(), listCurrentUserWorkspaces()]);

  return (
    <Container className="py-10 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-7 sm:p-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase">
            Workspace launcher
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {workspaces.length > 0
              ? `Welcome back, ${getDisplayName(null, user?.email)}.`
              : "Create your first workspace."}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Keep tenants isolated at the workspace level, keep collaborator roles explicit,
            and use settings as the base for future retrieval and grounded-answer behavior.
          </p>

          {workspaces.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  className="rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5 transition hover:border-slate-300 hover:shadow-[0_18px_44px_-30px_rgba(15,23,42,0.4)]"
                  href={asRoute(`/app/${workspace.slug}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{workspace.name}</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {workspace.description ?? "No description yet."}
                      </p>
                    </div>
                    <RoleBadge role={workspace.role} />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">/{workspace.slug}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-600">
              No workspace exists yet for this account. Create one to unlock protected routes
              and role-aware navigation.
            </div>
          )}
        </Card>

        <Card className="p-7 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            New workspace
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Start with a stable URL slug, pick sensible search defaults, and make citations
            required from day one if grounded answers are mandatory for your team.
          </p>
          <div className="mt-6">
            <CreateWorkspaceForm />
          </div>
        </Card>
      </section>
    </Container>
  );
}
