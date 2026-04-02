import type { ProfileSummary } from "@/lib/types/workspaces";

export function getDisplayName(
  profile: ProfileSummary | null,
  fallbackEmail?: string | null,
): string {
  if (profile?.fullName) {
    return profile.fullName;
  }

  if (fallbackEmail) {
    return fallbackEmail;
  }

  return "Workspace user";
}
