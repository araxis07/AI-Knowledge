"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createErrorState,
  formDataBoolean,
  formDataString,
  zodErrorToActionState,
} from "@/lib/action-utils";
import { requireAuthenticatedUser } from "@/lib/auth";
import type { FormActionState } from "@/lib/types/actions";
import { hasMinimumWorkspaceRole } from "@/lib/workspaces";
import { slugify } from "@/lib/utils/slugify";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createWorkspaceSchema,
  updateWorkspaceMemberRoleSchema,
  updateWorkspaceSettingsSchema,
} from "@/lib/validation/workspace";
import { asRoute } from "@/lib/utils/as-route";

function mapWorkspaceMutationError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("workspaces_slug_unique_idx")) {
    return "That workspace slug is already taken.";
  }

  if (normalized.includes("duplicate key")) {
    return "A workspace with those details already exists.";
  }

  return "Unable to save workspace changes right now.";
}

export async function createWorkspaceAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireAuthenticatedUser("/app");
  const rawName = formDataString(formData, "name");
  const rawSlug = formDataString(formData, "slug");
  const parsed = createWorkspaceSchema.safeParse({
    citationsRequired: formDataBoolean(formData, "citationsRequired"),
    defaultConversationVisibility: formDataString(formData, "defaultConversationVisibility"),
    defaultSearchMode: formDataString(formData, "defaultSearchMode"),
    description: formDataString(formData, "description"),
    name: rawName,
    slug: rawSlug || slugify(rawName),
  });

  if (!parsed.success) {
    return zodErrorToActionState(parsed.error);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      created_by: user.id,
      description: parsed.data.description || null,
      name: parsed.data.name,
      settings: {
        citationsRequired: parsed.data.citationsRequired,
        defaultConversationVisibility: parsed.data.defaultConversationVisibility,
        defaultSearchMode: parsed.data.defaultSearchMode,
      },
      slug: parsed.data.slug,
    })
    .select("slug")
    .single();

  if (error) {
    return createErrorState(mapWorkspaceMutationError(error.message));
  }

  revalidatePath("/app");
  redirect(asRoute(`/app/${data.slug}`));
}

export async function updateWorkspaceSettingsAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const rawName = formDataString(formData, "name");
  const rawSlug = formDataString(formData, "slug");
  const parsed = updateWorkspaceSettingsSchema.safeParse({
    citationsRequired: formDataBoolean(formData, "citationsRequired"),
    defaultConversationVisibility: formDataString(formData, "defaultConversationVisibility"),
    defaultSearchMode: formDataString(formData, "defaultSearchMode"),
    description: formDataString(formData, "description"),
    name: rawName,
    slug: rawSlug || slugify(rawName),
    workspaceId: formDataString(formData, "workspaceId"),
  });

  if (!parsed.success) {
    return zodErrorToActionState(parsed.error);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .update({
      description: parsed.data.description || null,
      name: parsed.data.name,
      settings: {
        citationsRequired: parsed.data.citationsRequired,
        defaultConversationVisibility: parsed.data.defaultConversationVisibility,
        defaultSearchMode: parsed.data.defaultSearchMode,
      },
      slug: parsed.data.slug,
    })
    .eq("id", parsed.data.workspaceId)
    .select("slug")
    .single();

  if (error) {
    return createErrorState(mapWorkspaceMutationError(error.message));
  }

  revalidatePath("/app");
  revalidatePath(`/app/${data.slug}`);
  revalidatePath(`/app/${data.slug}/settings`);
  redirect(asRoute(`/app/${data.slug}/settings?saved=workspace`));
}

export async function updateWorkspaceMemberRoleAction(formData: FormData) {
  const user = await requireAuthenticatedUser("/app");
  const parsed = updateWorkspaceMemberRoleSchema.safeParse({
    membershipId: formDataString(formData, "membershipId"),
    role: formDataString(formData, "role"),
    workspaceId: formDataString(formData, "workspaceId"),
    workspaceSlug: formDataString(formData, "workspaceSlug"),
  });

  if (!parsed.success) {
    redirect(asRoute(`/app/${formDataString(formData, "workspaceSlug")}/settings?members=invalid`));
  }

  const supabase = await createServerSupabaseClient();
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.data.workspaceId)
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    redirect(asRoute(`/app/${parsed.data.workspaceSlug}`));
  }

  const { data: targetMembership, error: targetError } = await supabase
    .from("workspace_members")
    .select("role, user_id")
    .eq("id", parsed.data.membershipId)
    .eq("workspace_id", parsed.data.workspaceId)
    .single();

  if (targetError || !targetMembership) {
    redirect(asRoute(`/app/${parsed.data.workspaceSlug}/settings?members=not-found`));
  }

  if (targetMembership.user_id === user.id) {
    redirect(asRoute(`/app/${parsed.data.workspaceSlug}/settings?members=self`));
  }

  const currentRole = membership.role;
  const targetRole = targetMembership.role;

  const canEditTarget =
    currentRole === "owner" ||
    (currentRole === "admin" && hasMinimumWorkspaceRole(targetRole, "viewer") && !hasMinimumWorkspaceRole(targetRole, "admin"));

  const canAssignRole =
    currentRole === "owner" ||
    (currentRole === "admin" && ["viewer", "editor"].includes(parsed.data.role));

  if (!canEditTarget || !canAssignRole) {
    redirect(asRoute(`/app/${parsed.data.workspaceSlug}/settings?members=forbidden`));
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({
      role: parsed.data.role,
    })
    .eq("id", parsed.data.membershipId)
    .eq("workspace_id", parsed.data.workspaceId);

  if (error) {
    redirect(asRoute(`/app/${parsed.data.workspaceSlug}/settings?members=save-error`));
  }

  revalidatePath(`/app/${parsed.data.workspaceSlug}/settings`);
  redirect(asRoute(`/app/${parsed.data.workspaceSlug}/settings?members=saved`));
}
