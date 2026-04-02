import type { DocumentJobSummary } from "@/lib/types/documents";
import { cn } from "@/lib/utils/cn";
import { getDocumentJobProgressPercent } from "@/lib/utils/document-ingestion";

export function DocumentIngestionProgress({
  className,
  job,
}: {
  className?: string;
  job: DocumentJobSummary;
}) {
  const progressPercent = getDocumentJobProgressPercent(job);

  if (progressPercent === null && !job.progressMessage) {
    return null;
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
        <span>{job.progressMessage ?? "Processing document"}</span>
        {progressPercent !== null ? <span>{progressPercent}%</span> : null}
      </div>
      {progressPercent !== null ? (
        <div className="h-2 overflow-hidden rounded-full bg-[var(--app-panel-muted)]">
          <div
            aria-hidden="true"
            className="h-full rounded-full bg-[linear-gradient(135deg,#134e63,#0f766e)] transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
