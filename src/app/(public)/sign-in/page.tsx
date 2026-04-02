import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { asRoute } from "@/lib/utils/as-route";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(asRoute("/app"));
  }

  return (
    <Container className="py-16 sm:py-20">
      <AuthPanel
        description="Sign in to your knowledge workspaces, switch contexts safely, and keep document access scoped by role."
        eyebrow="Authentication"
        title="Access your workspace."
      >
        <SignInForm />
      </AuthPanel>
    </Container>
  );
}
