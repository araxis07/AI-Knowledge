import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { asRoute } from "@/lib/utils/as-route";

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(asRoute("/app"));
  }

  return (
    <Container className="py-16 sm:py-20">
      <AuthPanel
        description="Create a real Supabase-backed account, confirm your email if required, and start from a clean multi-tenant workspace model."
        eyebrow="Get started"
        title="Create your account."
      >
        <SignUpForm />
      </AuthPanel>
    </Container>
  );
}
