export const rawDocumentStatuses = [
  "uploaded",
  "queued",
  "processing",
  "indexed",
  "failed",
  "archived",
] as const;

export const ingestionJobStatuses = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export const ingestionJobKinds = ["extract", "chunk", "embed", "reindex", "delete"] as const;

export const libraryDocumentStatuses = [
  "uploaded",
  "processing",
  "ready",
  "failed",
  "archived",
] as const;

export const documentKinds = ["pdf", "markdown", "text"] as const;

export type RawDocumentStatus = (typeof rawDocumentStatuses)[number];
export type IngestionJobStatus = (typeof ingestionJobStatuses)[number];
export type IngestionJobKind = (typeof ingestionJobKinds)[number];
export type LibraryDocumentStatus = (typeof libraryDocumentStatuses)[number];
export type DocumentKind = (typeof documentKinds)[number];

export type DocumentJobSummary = {
  createdAt: string;
  errorCode: string | null;
  errorMessage: string | null;
  finishedAt: string | null;
  id: string;
  jobKind: IngestionJobKind;
  startedAt: string | null;
  status: IngestionJobStatus;
  updatedAt: string;
};

export type WorkspaceDocumentSummary = {
  checksumSha256: string | null;
  createdAt: string;
  description: string | null;
  displayStatus: LibraryDocumentStatus;
  fileExtension: string | null;
  id: string;
  kind: DocumentKind;
  latestJob: DocumentJobSummary | null;
  mimeType: string;
  pageCount: number | null;
  sizeBytes: number;
  status: RawDocumentStatus;
  storageBucket: string;
  storagePath: string;
  summary: string | null;
  title: string;
  tokenCount: number | null;
  updatedAt: string;
};

export type WorkspaceDocumentDetail = WorkspaceDocumentSummary & {
  downloadUrl: string | null;
  previewContent: string | null;
  previewLabel: string | null;
};
