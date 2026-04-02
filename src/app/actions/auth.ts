"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createErrorState,
  formDataString,
  zodErrorToActionState,
} from "@/lib/action-utils";
import type { FormActionState } from "@/lib/types/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readPublicEnv } from "@/lib/env";
import { asRoute } from "@/lib/utils/as-route";
import { sanitizeRedirectPath } from "@/lib/utils/sanitize-redirect-path";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

function mapAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (normalized.includes("user already registered")) {
    return "An account already exists for this email.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Check your email to confirm your account before signing in.";
  }

  return "Unable to complete authentication right now.";
}

export async function signInAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = signInSchema.safeParse({
    email: formDataString(formData, "email"),
    next: sanitizeRedirectPath(formDataString(formData, "next"), "/app"),
    password: formDataString(formData, "password"),
  });

  if (!parsed.success) {
    return zodErrorToActionState(parsed.error);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return createErrorState(mapAuthErrorMessage(error.message));
  }

  revalidatePath("/");
  redirect(asRoute(parsed.data.next));
}

export async function signUpAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = signUpSchema.safeParse({
    confirmPassword: formDataString(formData, "confirmPassword"),
    email: formDataString(formData, "email"),
    fullName: formDataString(formData, "fullName"),
    next: sanitizeRedirectPath(formDataString(formData, "next"), "/app"),
    password: formDataString(formData, "password"),
  });

  if (!parsed.success) {
    return zodErrorToActionState(parsed.error);
  }

  const env = readPublicEnv();
  const emailRedirectTo = new URL("/auth/callback", env.NEXT_PUBLIC_APP_URL);
  emailRedirectTo.searchParams.set("next", parsed.data.next);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: emailRedirectTo.toString(),
    },
    password: parsed.data.password,
  });

  if (error) {
    return createErrorState(mapAuthErrorMessage(error.message));
  }

  revalidatePath("/");

  if (data.session) {
    redirect(asRoute(parsed.data.next));
  }

  redirect(asRoute(`/sign-in?message=check-email&next=${encodeURIComponent(parsed.data.next)}`));
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  revalidatePath("/");
  redirect(asRoute("/"));
}
