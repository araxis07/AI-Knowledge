export type FieldErrors = Partial<Record<string, string[]>>;

export type FormActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
};

export const idleFormActionState: FormActionState = {
  status: "idle",
};
