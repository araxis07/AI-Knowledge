"use client";

import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { asRoute } from "@/lib/utils/as-route";

type WorkspaceErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkspaceError({ error, reset }: WorkspaceErrorProps) {
  return (
    <ErrorState
      actions={
        <>
          <Button onClick={reset} type="button" variant="accent">
            Retry workspace
          </Button>
          <Link className={buttonStyles({ variant: "secondary" })} href={asRoute("/app")}>
            Back to dashboard
          </Link>
        </>
      }
      description="The workspace shell failed while rendering this route. Access control is still enforced server-side; this is a rendering failure, not a tenancy leak."
      digest={error.digest}
      eyebrow="Workspace error"
      title="The workspace surface hit an unexpected issue."
    />
  );
}
