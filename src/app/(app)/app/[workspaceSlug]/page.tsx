import { Card } from "@/components/ui/card";
import { requireWorkspaceAccess, getWorkspaceRoleCopy } from "@/lib/workspaces";

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
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-7">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          Role-aware workspace overview
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          This route is protected on the server. Access is decided from your authenticated
          workspace membership before the page renders, so the UI never needs to guess about
          tenancy or role scope.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Your role</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{access.role}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Default search</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {access.workspace.settings.defaultSearchMode}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Conversation visibility</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {access.workspace.settings.defaultConversationVisibility}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-7">
        <h2 className="text-xl font-semibold text-slate-950">What your role allows</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {getWorkspaceRoleCopy(access.role)}
        </p>
        <div className="mt-6 rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5">
          <p className="text-sm font-semibold tracking-[0.16em] text-slate-500 uppercase">
            Settings defaults
          </p>
          <ul className="mt-4 grid gap-3 text-sm text-slate-700">
            <li>
              Search mode:{" "}
              <span className="font-semibold text-slate-950">
                {access.workspace.settings.defaultSearchMode}
              </span>
            </li>
            <li>
              Conversation visibility:{" "}
              <span className="font-semibold text-slate-950">
                {access.workspace.settings.defaultConversationVisibility}
              </span>
            </li>
            <li>
              Citations required:{" "}
              <span className="font-semibold text-slate-950">
                {access.workspace.settings.citationsRequired ? "Yes" : "No"}
              </span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
