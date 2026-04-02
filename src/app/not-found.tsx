import Link from "next/link";

import { Container } from "@/components/ui/container";
import { asRoute } from "@/lib/utils/as-route";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-start justify-center py-16">
      <p className="text-sm font-semibold tracking-[0.24em] text-teal-700 uppercase">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
        This page does not exist.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-600">
        The current scaffold only exposes a small foundation surface. Use the homepage to
        verify the app shell and health routes.
      </p>
      <Link
        href={asRoute("/")}
        className="mt-8 inline-flex items-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
      >
        Return home
      </Link>
    </Container>
  );
}
