import type {
  DocumentKind,
  DocumentJobSummary,
  LibraryDocumentStatus,
  RawDocumentStatus,
} from "@/lib/types/documents";

const documentKindConfig: Record<
  DocumentKind,
  {
    extensions: readonly string[];
    label: string;
    mimeTypes: readonly string[];
  }
> = {
  markdown: {
    extensions: ["md", "markdown"],
    label: "Markdown",
    mimeTypes: ["text/markdown", "text/x-markdown", "text/plain", ""],
  },
  pdf: {
    extensions: ["pdf"],
    label: "PDF",
    mimeTypes: ["application/pdf", ""],
  },
  text: {
    extensions: ["txt", "text"],
    label: "Plain text",
    mimeTypes: ["text/plain", ""],
  },
};

export const documentAcceptAttribute = ".pdf,.md,.markdown,.txt";
export const maxDocumentUploadSizeBytes = 25 * 1024 * 1024;
export const supportedDocumentMimeLabels = [
  "PDF (.pdf)",
  "Markdown (.md, .markdown)",
  "Plain text (.txt)",
];

export function normalizeFileExtension(value: string): string | null {
  const extension = value.split(".").pop()?.trim().toLowerCase() ?? "";

  return extension.length > 0 ? extension : null;
}

export function getDocumentKind(
  fileExtension: string | null,
  mimeType: string,
): DocumentKind {
  const normalizedExtension = fileExtension?.toLowerCase() ?? null;
  const normalizedMimeType = mimeType.toLowerCase();

  for (const [kind, config] of Object.entries(documentKindConfig) as Array<
    [DocumentKind, (typeof documentKindConfig)[DocumentKind]]
  >) {
    if (normalizedExtension && config.extensions.includes(normalizedExtension)) {
      return kind;
    }

    if (config.mimeTypes.includes(normalizedMimeType)) {
      return kind;
    }
  }

  return "text";
}

export function getDocumentKindLabel(kind: DocumentKind): string {
  return documentKindConfig[kind].label;
}

export function validateDocumentFile(fileName: string, mimeType: string) {
  const extension = normalizeFileExtension(fileName);

  if (!extension) {
    return null;
  }

  for (const [kind, config] of Object.entries(documentKindConfig) as Array<
    [DocumentKind, (typeof documentKindConfig)[DocumentKind]]
  >) {
    if (!config.extensions.includes(extension)) {
      continue;
    }

    const normalizedMimeType = mimeType.toLowerCase();

    if (normalizedMimeType && !config.mimeTypes.includes(normalizedMimeType)) {
      return null;
    }

    return {
      contentType: normalizedMimeType || config.mimeTypes.find(Boolean) || "text/plain",
      extension,
      kind,
      label: config.label,
    };
  }

  return null;
}

export function createDocumentStoragePath(
  workspaceId: string,
  documentId: string,
  extension: string | null,
) {
  const normalizedExtension = extension ? `.${extension}` : "";

  return `${workspaceId}/${documentId}/source${normalizedExtension}`;
}

export function deriveDocumentTitle(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").trim() || "Untitled document";
}

export function deriveLibraryDocumentStatus(
  status: RawDocumentStatus,
  latestJob: DocumentJobSummary | null,
): LibraryDocumentStatus {
  if (status === "archived") {
    return "archived";
  }

  if (status === "failed" || latestJob?.status === "failed") {
    return "failed";
  }

  if (
    status === "queued" ||
    status === "processing" ||
    latestJob?.status === "queued" ||
    latestJob?.status === "running"
  ) {
    return "processing";
  }

  if (status === "indexed") {
    return "ready";
  }

  return "uploaded";
}
