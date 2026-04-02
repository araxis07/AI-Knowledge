"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signUpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { idleFormActionState } from "@/lib/types/actions";
import { asRoute } from "@/lib/utils/as-route";
import { sanitizeRedirectPath } from "@/lib/utils/sanitize-redirect-path";
import { signUpSchema, type SignUpInput } from "@/lib/validation/auth";

type SignUpFormProps = {
  next: string;
};

export function SignUpForm({ next }: SignUpFormProps) {
  const [serverState, dispatch, isPending] = useActionState(signUpAction, idleFormActionState);
  const form = useForm<SignUpInput>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      fullName: "",
      next,
      password: "",
    },
    resolver: zodResolver(signUpSchema),
  });

  const errors = {
    confirmPassword:
      form.formState.errors.confirmPassword?.message ??
      serverState.fieldErrors?.confirmPassword?.[0],
    email: form.formState.errors.email?.message ?? serverState.fieldErrors?.email?.[0],
    fullName: form.formState.errors.fullName?.message ?? serverState.fieldErrors?.fullName?.[0],
    password: form.formState.errors.password?.message ?? serverState.fieldErrors?.password?.[0],
  };

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const formData = new FormData();
        formData.set("confirmPassword", values.confirmPassword);
        formData.set("email", values.email);
        formData.set("fullName", values.fullName);
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

      {serverState.message && (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverState.message}
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="sign-up-full-name">
          Full name
        </label>
        <Input
          autoComplete="name"
          id="sign-up-full-name"
          placeholder="Your name"
          type="text"
          {...form.register("fullName")}
        />
        {errors.fullName && <p className="text-sm text-rose-600">{errors.fullName}</p>}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="sign-up-email">
          Email
        </label>
        <Input
          autoComplete="email"
          id="sign-up-email"
          placeholder="you@company.com"
          type="email"
          {...form.register("email")}
        />
        {errors.email && <p className="text-sm text-rose-600">{errors.email}</p>}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="sign-up-password">
            Password
          </label>
          <Input
            autoComplete="new-password"
            id="sign-up-password"
            placeholder="Minimum 8 characters"
            type="password"
            {...form.register("password")}
          />
          {errors.password && <p className="text-sm text-rose-600">{errors.password}</p>}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="sign-up-confirm-password">
            Confirm password
          </label>
          <Input
            autoComplete="new-password"
            id="sign-up-confirm-password"
            placeholder="Repeat your password"
            type="password"
            {...form.register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-rose-600">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <Button disabled={isPending} type="submit">
        {isPending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          className="font-semibold text-slate-950 underline decoration-teal-500/40 underline-offset-4"
          href={asRoute(`/sign-in?next=${encodeURIComponent(next)}`)}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
