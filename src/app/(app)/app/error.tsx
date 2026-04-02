"use client";

import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { asRoute } from "@/lib/utils/as-route";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <ErrorState
      actions={
        <>
          <Button onClick={reset} type="button" variant="accent">
            Try again
          </Button>
          <Link className={buttonStyles({ variant: "secondary" })} href={asRoute("/app")}>
            Back to dashboard
          </Link>
        </>
      }
      description="The protected product shell hit an unexpected rendering problem. Retry this segment first; if it continues, inspect the server logs and the digest."
      digest={error.digest}
      eyebrow="App error"
      title="This product surface could not be rendered."
    />
  );
}
