"use client";

import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="m-0 min-h-screen bg-slate-950 text-white">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
          <p className="text-sm font-semibold tracking-[0.24em] text-teal-300 uppercase">
            Application error
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            The application shell hit an unexpected failure.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Retry the render. If the issue persists, inspect the server logs and error digest.
          </p>
          {error.digest ? (
            <p className="mt-4 font-mono text-sm text-slate-400">Digest: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex w-fit items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
