import { ZodError } from "zod";

import type { FieldErrors, FormActionState } from "@/lib/types/actions";

export function createErrorState(
  message: string,
  fieldErrors?: FieldErrors,
): FormActionState {
  return {
    status: "error",
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

export function formDataString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function formDataBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);

  return value === "on" || value === "true" || value === "1";
}

export function zodErrorToActionState(
  error: ZodError,
  message = "Please correct the highlighted fields.",
): FormActionState {
  return createErrorState(message, error.flatten().fieldErrors);
}
