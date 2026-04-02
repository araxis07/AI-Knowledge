import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  ActivityIcon,
  FileStackIcon,
  SettingsIcon,
  SparkIcon,
  UserIcon,
} from "@/components/ui/icons";
import { requireAuthenticatedUser, syncCurrentUserProfile } from "@/lib/auth";
import { getDisplayName, listCurrentUserWorkspaces } from "@/lib/workspaces";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AccountPage() {
  const user = await requireAuthenticatedUser("/app/account");
  const [profile, workspaces] = await Promise.all([
    syncCurrentUserProfile(user),
    listCurrentUserWorkspaces(),
  ]);

  const displayName = getDisplayName(profile, user.email);
  const initials = getInitials(displayName || "AK");
  const ownedCount = workspaces.filter((workspace) => workspace.role === "owner").length;
  const adminCount = workspaces.filter(
    (workspace) => workspace.role === "owner" || workspace.role === "admin",
  ).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        description="Identity, access posture, and workspace coverage live here. This page stays intentionally lean until richer profile editing and account security flows are added."
        eyebrow="Account"
        kicker={
          <>
            <Badge className="border-cyan-700/16 bg-cyan-700/8 text-cyan-900">
              Authenticated via Supabase
            </Badge>
            <Badge className="border-slate-300 bg-white text-slate-700">
              Profile sync active
            </Badge>
          </>
        }
        title={displayName}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<SparkIcon />}
          label="Workspace footprint"
          note="Total workspaces visible from this account."
          tone="tint"
          value={`${workspaces.length}`}
        />
        <MetricCard
          icon={<SettingsIcon />}
          label="Admin surfaces"
          note="Workspaces where you can manage defaults or collaborators."
          value={`${adminCount}`}
        />
        <MetricCard
          icon={<UserIcon />}
          label="Ownership"
          note="Workspaces owned directly by this profile."
          value={`${ownedCount}`}
        />
        <MetricCard
          icon={<ActivityIcon />}
          label="Session posture"
          note="Public auth flow wired, role guards enforced on the server."
          value="Stable"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden p-7 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="inline-flex size-24 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,#155e75,#0f766e)] text-3xl font-semibold text-white shadow-[0_20px_46px_-20px_rgba(21,94,117,0.72)]">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase">
                Profile snapshot
              </p>
              <h2 className="mt-3 text-[var(--text-title)] leading-tight text-slate-950">
                {displayName}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {profile.email ?? "No email on file"}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="border-teal-700/16 bg-teal-700/8 text-teal-800">
                  Account surface ready
                </Badge>
                <Badge className="border-slate-300 bg-white text-slate-700">
                  Editing deferred to later phase
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-white/78 p-5">
              <p className="text-sm font-medium text-slate-500">Auth user ID</p>
              <p className="mt-3 break-all font-[var(--font-mono)] text-sm text-slate-800">
                {user.id}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-white/78 p-5">
              <p className="text-sm font-medium text-slate-500">Security note</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Session cookies are handled server-side and route access is gated before page render.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-7 sm:p-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
            Workspace access map
          </p>
          <div className="mt-5 grid gap-3">
            {workspaces.length > 0 ? (
              workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-[var(--app-border)] bg-white/76 px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-slate-950">{workspace.name}</p>
                    <p className="mt-1 text-sm text-slate-600">/{workspace.slug}</p>
                  </div>
                  <Badge>{workspace.role}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[var(--app-border-strong)] bg-white/70 px-4 py-5 text-sm leading-6 text-slate-600">
                No workspaces yet. Create one from the dashboard home to start shaping your knowledge base.
              </div>
            )}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-5">
            <div className="flex items-center gap-3 text-slate-900">
              <FileStackIcon />
              <p className="font-medium">Next account-layer additions</p>
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
              <li>Profile editing</li>
              <li>Avatar management</li>
              <li>Security sessions and recent sign-ins</li>
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}
