import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowUpRightIcon, SparkIcon } from "@/components/ui/icons";
import { asRoute } from "@/lib/utils/as-route";

type FeatureEmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  eyebrow: string;
  title: string;
  workspaceSlug: string;
};

export function FeatureEmptyState({
  actionHref,
  actionLabel,
  description,
  eyebrow,
  title,
  workspaceSlug,
}: FeatureEmptyStateProps) {
  const fallbackHref = asRoute(`/app/${workspaceSlug}`);

  return (
    <EmptyState
      actions={
        <>
          <Link
            className={buttonStyles({ size: "lg", variant: "accent" })}
            href={asRoute(actionHref ?? fallbackHref)}
          >
            {actionLabel ?? "Back to workspace overview"}
            <ArrowUpRightIcon />
          </Link>
          <p className="text-sm leading-6 text-slate-500">
            This route is intentionally frontend-only for now. Backend workflows land in later phases.
          </p>
        </>
      }
      description={description}
      eyebrow={eyebrow}
      icon={<SparkIcon />}
      title={title}
    />
  );
}
