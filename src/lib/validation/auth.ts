import { z } from "zod";

const nextPathSchema = z
  .string()
  .trim()
  .max(1024);

const emailSchema = z.email("Enter a valid email address.").transform((value) =>
  value.trim().toLowerCase(),
);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

export const signInSchema = z.object({
  email: emailSchema,
  next: nextPathSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm your password."),
    email: emailSchema,
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(120, "Full name must be 120 characters or fewer."),
    next: nextPathSchema,
    password: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
