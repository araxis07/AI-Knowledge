"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signInAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { idleFormActionState } from "@/lib/types/actions";
import { asRoute } from "@/lib/utils/as-route";
import { sanitizeRedirectPath } from "@/lib/utils/sanitize-redirect-path";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";

type SignInFormProps = {
  authError?: string | null;
  message?: string | null;
  next: string;
};

export function SignInForm({ authError = null, message = null, next }: SignInFormProps) {
  const [serverState, dispatch, isPending] = useActionState(signInAction, idleFormActionState);
  const form = useForm<SignInInput>({
    defaultValues: {
      email: "",
      next,
      password: "",
    },
    resolver: zodResolver(signInSchema),
  });

  const fieldErrors = {
    email: form.formState.errors.email?.message ?? serverState.fieldErrors?.email?.[0],
    password: form.formState.errors.password?.message ?? serverState.fieldErrors?.password?.[0],
  };

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const formData = new FormData();
        formData.set("email", values.email);
        formData.set("next", values.next);
        formData.set("password", values.password);

        startTransition(() => {
          dispatch(formData);
        });
      })}
    >
      <input
        type="hidden"
        {...form.register("next")}
        value={sanitizeRedirectPath(next, "/app")}
      />

      {(message === "check-email" || authError === "callback_exchange_failed" || serverState.message) && (
        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {serverState.message ??
            (authError === "callback_exchange_failed"
              ? "We could not complete email confirmation. Please try the link again."
              : "Check your email to confirm your account, then sign in.")}
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="sign-in-email">
          Email
        </label>
        <Input
          autoComplete="email"
          id="sign-in-email"
          placeholder="you@company.com"
          type="email"
          {...form.register("email")}
        />
        {fieldErrors.email && <p className="text-sm text-rose-600">{fieldErrors.email}</p>}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="sign-in-password">
          Password
        </label>
        <Input
          autoComplete="current-password"
          id="sign-in-password"
          placeholder="Enter your password"
          type="password"
          {...form.register("password")}
        />
        {fieldErrors.password && <p className="text-sm text-rose-600">{fieldErrors.password}</p>}
      </div>

      <Button disabled={isPending} type="submit">
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-sm text-slate-600">
        New here?{" "}
        <Link
          className="font-semibold text-slate-950 underline decoration-teal-500/40 underline-offset-4"
          href={asRoute(`/sign-up?next=${encodeURIComponent(next)}`)}
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
