import { z } from "zod";

import { workspaceRoles } from "@/lib/types/workspaces";

const workspaceSlugSchema = z
  .string()
  .trim()
  .min(2, "Workspace slug must be at least 2 characters.")
  .max(64, "Workspace slug must be 64 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Use lowercase letters, numbers, and hyphens only.",
  });

const nullableDescriptionSchema = z
  .string()
  .trim()
  .max(320, "Description must be 320 characters or fewer.");

export const workspaceSettingsSchema = z.object({
  citationsRequired: z.boolean(),
  defaultConversationVisibility: z.enum(["private", "workspace"]),
  defaultSearchMode: z.enum(["keyword", "semantic", "hybrid"]),
});

export const createWorkspaceSchema = z.object({
  citationsRequired: z.boolean(),
  defaultConversationVisibility: z.enum(["private", "workspace"]),
  defaultSearchMode: z.enum(["keyword", "semantic", "hybrid"]),
  description: nullableDescriptionSchema,
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(120, "Workspace name must be 120 characters or fewer."),
  slug: workspaceSlugSchema,
});

export const updateWorkspaceSettingsSchema = createWorkspaceSchema.extend({
  workspaceId: z.uuid("Workspace ID is invalid."),
});

export const updateWorkspaceMemberRoleSchema = z.object({
  membershipId: z.uuid("Membership ID is invalid."),
  role: z.enum(workspaceRoles),
  workspaceId: z.uuid("Workspace ID is invalid."),
  workspaceSlug: workspaceSlugSchema,
});

export const removeWorkspaceMemberSchema = z.object({
  membershipId: z.uuid("Membership ID is invalid."),
  workspaceId: z.uuid("Workspace ID is invalid."),
  workspaceSlug: workspaceSlugSchema,
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceMemberRoleInput = z.infer<typeof updateWorkspaceMemberRoleSchema>;
export type UpdateWorkspaceSettingsInput = z.infer<typeof updateWorkspaceSettingsSchema>;
export type RemoveWorkspaceMemberInput = z.infer<typeof removeWorkspaceMemberSchema>;
