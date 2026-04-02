export function sanitizeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/app",
): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}
