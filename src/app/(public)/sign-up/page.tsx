import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { asRoute } from "@/lib/utils/as-route";
import { getSearchParamValue } from "@/lib/utils/search-param-value";
import { sanitizeRedirectPath } from "@/lib/utils/sanitize-redirect-path";

type SignUpPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect(asRoute("/app"));
  }

  const resolvedSearchParams = await searchParams;
  const next = sanitizeRedirectPath(getSearchParamValue(resolvedSearchParams.next), "/app");

  return (
    <Container className="py-16 sm:py-20">
      <AuthPanel
        description="Create a real Supabase-backed account, confirm your email if required, and start from a clean multi-tenant workspace model."
        eyebrow="Get started"
        title="Create your account."
      >
        <SignUpForm next={next} />
      </AuthPanel>
    </Container>
  );
}
