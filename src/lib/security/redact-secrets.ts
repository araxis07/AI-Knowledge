const SECRET_REPLACEMENTS: Array<[pattern: RegExp, replacement: string]> = [
  [/sk-proj-[A-Za-z0-9_-]+/g, "sk-proj-[redacted]"],
  [/sb_publishable_[A-Za-z0-9_-]+/g, "sb_publishable_[redacted]"],
  [/\beyJ[A-Za-z0-9._-]{20,}\b/g, "[redacted-token]"],
  [/https:\/\/[a-z0-9-]+\.supabase\.co/gi, "https://[redacted].supabase.co"],
];

function redactObject(
  value: Record<string, unknown>,
  depth: number,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      redactSensitiveValue(nestedValue, depth + 1),
    ]),
  );
}

export function redactSensitiveText(value: string): string {
  let sanitized = value;

  for (const [pattern, replacement] of SECRET_REPLACEMENTS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}

export function redactSensitiveValue(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return "[redacted-depth]";
  }

  if (typeof value === "string") {
    return redactSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveValue(entry, depth + 1));
  }

  if (value && typeof value === "object") {
    if (value instanceof Error) {
      return {
        message: redactSensitiveText(value.message),
        name: value.name,
        stack: value.stack ? redactSensitiveText(value.stack) : undefined,
      };
    }

    return redactObject(value as Record<string, unknown>, depth);
  }

  return value;
}
