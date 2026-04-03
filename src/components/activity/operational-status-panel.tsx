import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircleIcon, ClockIcon, RefreshIcon } from "@/components/ui/icons";
import type { WorkspaceOperationalJob } from "@/server/operations/workspace-operations";
import { asRoute } from "@/lib/utils/as-route";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getJobTone(status: string) {
  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "queued" || status === "running") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function OperationalStatusPanel({
  jobs,
  workspaceSlug,
}: {
  jobs: WorkspaceOperationalJob[];
  workspaceSlug: string;
}) {
  const activeCount = jobs.filter((job) => job.status === "queued" || job.status === "running").length;
  const failedCount = jobs.filter((job) => job.status === "failed").length;

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Operational status
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Recent ingestion jobs, queue pressure, and failures across the workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
            {activeCount} active
          </Badge>
          <Badge className="border-rose-200 bg-rose-50 text-rose-700">
            {failedCount} failed
          </Badge>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-panel-muted)] p-5 text-sm leading-7 text-slate-600">
          No operational jobs are visible yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {jobs.map((job) => (
            <div
              className="rounded-[1.5rem] border border-[var(--app-border)] bg-white/84 p-4"
              key={job.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{job.documentTitle}</p>
                    <Badge className={getJobTone(job.status)}>{job.status}</Badge>
                    <Badge>{job.jobKind}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {job.progressMessage ?? "No progress message yet."}
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-cyan-800 hover:text-cyan-900"
                  href={asRoute(`/app/${workspaceSlug}/documents/${job.documentId}`)}
                >
                  Open document
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <ClockIcon className="size-4" />
                  Updated {formatTimestamp(job.updatedAt)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <RefreshIcon className="size-4" />
                  Started {formatTimestamp(job.startedAt)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircleIcon className="size-4" />
                  Finished {formatTimestamp(job.finishedAt)}
                </span>
                {job.stepsCompleted !== null && job.stepsTotal !== null ? (
                  <span>
                    {job.stepsCompleted}/{job.stepsTotal} steps
                  </span>
                ) : null}
              </div>

              {job.errorMessage ? (
                <p className="mt-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {job.errorMessage}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
