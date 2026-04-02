"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";

import { Select } from "@/components/ui/select";
import type { WorkspaceSummary } from "@/lib/types/workspaces";
import { asRoute } from "@/lib/utils/as-route";

function buildWorkspaceDestination(pathname: string, nextSlug: string) {
  const segments = pathname.split("/");

  if (segments[1] !== "app") {
    return `/app/${nextSlug}`;
  }

  if (!segments[2]) {
    return `/app/${nextSlug}`;
  }

  segments[2] = nextSlug;

  return segments.join("/");
}

export function WorkspaceSwitcher({ workspaces }: { workspaces: WorkspaceSummary[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startNavigation] = useTransition();
  const currentSlug = useMemo(() => pathname.split("/")[2] ?? "", [pathname]);

  if (workspaces.length === 0) {
    return (
      <Select defaultValue="" disabled>
        <option value="">No workspaces yet</option>
      </Select>
    );
  }

  return (
    <Select
      aria-label="Switch workspace"
      className="min-w-[13rem] bg-white/90"
      defaultValue={currentSlug || workspaces[0]?.slug}
      disabled={isPending}
      onChange={(event) => {
        const nextSlug = event.currentTarget.value;

        startNavigation(() => {
          router.push(asRoute(buildWorkspaceDestination(pathname, nextSlug)));
        });
      }}
    >
      {workspaces.map((workspace) => (
        <option key={workspace.id} value={workspace.slug}>
          {workspace.name} · {workspace.role}
        </option>
      ))}
    </Select>
  );
}
