import type { DocumentJobSummary } from "@/lib/types/documents";

export function getDocumentJobProgressPercent(job: DocumentJobSummary | null): number | null {
  if (!job || job.stepsTotal <= 0) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round((job.stepsCompleted / job.stepsTotal) * 100)));
}

export function isDocumentJobActive(job: DocumentJobSummary | null): boolean {
  return job?.status === "queued" || job?.status === "running";
}
