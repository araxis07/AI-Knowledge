import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { asRoute } from "@/lib/utils/as-route";
import { getSearchParamValue } from "@/lib/utils/search-param-value";
import { sanitizeRedirectPath } from "@/lib/utils/sanitize-redirect-path";

type SignInPageProps = {
  searchParams: Promise<{
    auth_error?: string | string[];
    message?: string | string[];
    next?: string | string[];
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect(asRoute("/app"));
  }

  const resolvedSearchParams = await searchParams;
  const next = sanitizeRedirectPath(getSearchParamValue(resolvedSearchParams.next), "/app");
  const message = getSearchParamValue(resolvedSearchParams.message) ?? null;
  const authError = getSearchParamValue(resolvedSearchParams.auth_error) ?? null;

  return (
    <Container className="py-16 sm:py-20">
      <AuthPanel
        description="Sign in to your knowledge workspaces, switch contexts safely, and keep document access scoped by role."
        eyebrow="Authentication"
        title="Access your workspace."
      >
        <SignInForm authError={authError} message={message} next={next} />
      </AuthPanel>
    </Container>
  );
}
