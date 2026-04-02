import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { asRoute } from "@/lib/utils/as-route";

const foundations = [
  "Real Supabase Auth session flow",
  "Workspace-based tenancy with role guards",
  "Profile sync wired to authenticated users",
  "Server-side validation for account and workspace mutations",
];

const nextMilestones = [
  "Document ingestion and storage workflows",
  "Hybrid search across keywords and embeddings",
  "Grounded chat with citations and conversations",
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <Container className="py-16 sm:py-20 lg:py-24">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold tracking-[0.24em] text-teal-700 uppercase">
            Phase 2 Foundation
          </p>
          <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Multi-tenant auth and workspace management for a serious AI knowledge base.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            The app now has real Supabase Auth integration, protected application routes,
            workspace creation, role-aware navigation, and a settings foundation that can
            scale into document ingestion and grounded AI answers without rewiring.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className={buttonStyles({})}
              href={asRoute(user ? "/app" : "/sign-up")}
            >
              {user ? "Open your workspaces" : "Create account"}
            </Link>
            <Link
              className={buttonStyles({ variant: "secondary" })}
              href={asRoute("/sign-in")}
            >
              Sign in
            </Link>
          </div>
        </div>

        <Card className="p-6">
          <p className="text-sm font-semibold tracking-[0.18em] text-slate-500 uppercase">
            System status
          </p>
          <dl className="mt-6 grid gap-5">
            <div>
              <dt className="text-sm text-slate-500">Current milestone</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                Auth + workspaces live
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Tenant model</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                Workspace-scoped with RLS
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Ready next for</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                Upload, indexing, and retrieval
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="p-7">
          <h2 className="text-xl font-semibold text-slate-950">Implemented now</h2>
          <ul className="mt-5 grid gap-3">
            {foundations.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-[var(--app-border)] bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-7">
          <h2 className="text-xl font-semibold text-slate-950">Queued next</h2>
          <ul className="mt-5 grid gap-3">
            {nextMilestones.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </Container>
  );
}
