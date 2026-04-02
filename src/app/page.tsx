import { Container } from "@/components/ui/container";

const foundationItems = [
  "Next.js App Router base",
  "TypeScript strict mode",
  "Tailwind CSS v4",
  "Flat ESLint configuration",
  "Health endpoints",
  "GitHub Actions CI foundation",
];

const deferredItems = [
  "Auth and workspace multi-tenancy",
  "Document upload and ingestion",
  "Vector indexing and hybrid search",
  "Grounded AI chat with citations",
];

export default function HomePage() {
  return (
    <Container className="py-16 sm:py-20 lg:py-24">
      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold tracking-[0.24em] text-teal-700 uppercase">
            Phase 1 Foundation
          </p>
          <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-5xl">
            A clean scaffold for a serious AI document search product.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            This base intentionally focuses on operational fundamentals first: App Router,
            strict typing, linting, health checks, CI, and a lightweight shell that can grow
            into a multi-tenant knowledge platform without rework.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-panel)] p-6 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-slate-500 uppercase">
            System status
          </p>
          <dl className="mt-6 grid gap-5">
            <div>
              <dt className="text-sm text-slate-500">Current milestone</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">Scaffold complete</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Runtime target</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">Node.js 24 LTS+</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Health endpoints</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                <code className="rounded bg-slate-950 px-2 py-1 text-sm text-white">
                  /api/health/live
                </code>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-panel-strong)] p-7 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)]">
          <h2 className="text-xl font-semibold text-slate-950">Included now</h2>
          <ul className="mt-5 grid gap-3">
            {foundationItems.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-[var(--app-border)] bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-panel-strong)] p-7 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)]">
          <h2 className="text-xl font-semibold text-slate-950">Deferred to later phases</h2>
          <ul className="mt-5 grid gap-3">
            {deferredItems.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Container>
  );
}
