import { z } from "zod";

export const uploadDocumentSchema = z.object({
  description: z
    .string()
    .trim()
    .max(320, "Description must be 320 characters or fewer.")
    .optional()
    .transform((value) => value ?? ""),
  title: z
    .string()
    .trim()
    .max(160, "Title must be 160 characters or fewer.")
    .optional()
    .transform((value) => value ?? ""),
});

export const mutateDocumentSchema = z.object({
  documentId: z.uuid("Document ID is invalid."),
  workspaceId: z.uuid("Workspace ID is invalid."),
  workspaceSlug: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Workspace slug is invalid.",
    }),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type MutateDocumentInput = z.infer<typeof mutateDocumentSchema>;
