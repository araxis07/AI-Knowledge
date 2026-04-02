import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { ProfileSummary } from "@/lib/types/workspaces";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOptionalSupabasePublicConfig } from "@/lib/supabase/config";
import { asRoute } from "@/lib/utils/as-route";
import { sanitizeRedirectPath } from "@/lib/utils/sanitize-redirect-path";

type UserMetadata = {
  avatar_url?: string;
  full_name?: string;
  name?: string;
  picture?: string;
};

function getUserMetadata(user: User): UserMetadata {
  const metadata = user.user_metadata;

  return metadata && typeof metadata === "object" ? (metadata as UserMetadata) : {};
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!getOptionalSupabasePublicConfig()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
});

export async function requireAuthenticatedUser(next = "/app"): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(asRoute(`/sign-in?next=${encodeURIComponent(sanitizeRedirectPath(next))}`));
  }

  return user;
}

export async function syncCurrentUserProfile(user: User): Promise<ProfileSummary> {
  const supabase = await createServerSupabaseClient();
  const metadata = getUserMetadata(user);

  const profilePayload = {
    avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
    email: user.email ?? null,
    full_name: metadata.full_name ?? metadata.name ?? null,
    id: user.id,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(profilePayload, {
      onConflict: "id",
    })
    .select("id, email, full_name, avatar_url")
    .single();

  if (error) {
    throw new Error(`Unable to sync profile: ${error.message}`);
  }

  return {
    avatarUrl: data.avatar_url,
    email: data.email,
    fullName: data.full_name,
    id: data.id,
  };
}
