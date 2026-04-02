import { Badge } from "@/components/ui/badge";
import type { LibraryDocumentStatus } from "@/lib/types/documents";
import { cn } from "@/lib/utils/cn";

const labels: Record<LibraryDocumentStatus, string> = {
  archived: "Archived",
  failed: "Failed",
  processing: "Processing",
  ready: "Ready",
  uploaded: "Uploaded",
};

export function DocumentStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: LibraryDocumentStatus;
}) {
  return (
    <Badge
      className={cn(
        status === "ready" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "processing" && "border-amber-200 bg-amber-50 text-amber-800",
        status === "uploaded" && "border-slate-200 bg-slate-100 text-slate-700",
        status === "failed" && "border-rose-200 bg-rose-50 text-rose-700",
        status === "archived" && "border-slate-300 bg-white text-slate-500",
        className,
      )}
    >
      {labels[status]}
    </Badge>
  );
}
