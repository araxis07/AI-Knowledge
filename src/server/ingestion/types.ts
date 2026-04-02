export type ExtractedDocumentPage = {
  pageNumber: number;
  text: string;
};

export type ExtractedDocument = {
  pageCount: number | null;
  pages: ExtractedDocumentPage[];
  text: string;
};

export type ChunkSource = {
  heading: string | null;
  pageNumber: number | null;
  text: string;
};

export type ChunkDraft = {
  chunkIndex: number;
  content: string;
  heading: string | null;
  metadata: Record<string, unknown>;
  pageNumber: number | null;
  tokenCount: number;
};

export type EmbeddingProvider = {
  dimensions: number;
  key: string;
  model: string;
  embedTexts(input: string[]): Promise<number[][]>;
};
