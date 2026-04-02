"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
          <ErrorState
            actions={
              <Button onClick={reset} type="button" variant="accent">
                Try again
              </Button>
            }
            description="A failure escaped the segment-level boundaries. Retry the render first; if it persists, inspect the server logs and the error digest."
            digest={error.digest}
            eyebrow="Application error"
            title="The application shell hit an unexpected failure."
          />
        </main>
      </body>
    </html>
  );
}
