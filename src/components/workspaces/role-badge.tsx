import { Badge } from "@/components/ui/badge";
import type { WorkspaceRole } from "@/lib/types/workspaces";

const roleTheme: Record<WorkspaceRole, string> = {
  admin: "border-cyan-200 bg-cyan-50 text-cyan-800",
  editor: "border-emerald-200 bg-emerald-50 text-emerald-800",
  owner: "border-amber-200 bg-amber-50 text-amber-900",
  viewer: "border-slate-200 bg-slate-50 text-slate-700",
};

export function RoleBadge({ role }: { role: WorkspaceRole }) {
  return <Badge className={roleTheme[role]}>{role}</Badge>;
}
