import type { ChunkSource } from "@/server/ingestion/types";

function normalizeWhitespace(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitPlainTextBlocks(text: string, pageNumber: number | null): ChunkSource[] {
  return text
    .split(/\n{2,}/)
    .map((block) => normalizeWhitespace(block))
    .filter((block) => block.length > 0)
    .map((block) => ({
      heading: null,
      pageNumber,
      text: block,
    }));
}

function splitMarkdownBlocks(text: string): ChunkSource[] {
  const blocks: ChunkSource[] = [];
  const lines = text.split("\n");
  let activeHeading: string | null = null;
  let buffer: string[] = [];

  const flushBuffer = () => {
    const block = normalizeWhitespace(buffer.join("\n"));

    if (!block) {
      buffer = [];
      return;
    }

    blocks.push({
      heading: activeHeading,
      pageNumber: null,
      text: block,
    });
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);

    if (headingMatch) {
      flushBuffer();
      activeHeading = normalizeWhitespace(headingMatch[1] ?? "") || null;
      continue;
    }

    if (line.trim().length === 0) {
      flushBuffer();
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();

  return blocks.length > 0
    ? blocks
    : [
        {
          heading: null,
          pageNumber: null,
          text: normalizeWhitespace(text),
        },
      ].filter((block) => block.text.length > 0);
}

export function normalizeExtractedText(text: string) {
  return normalizeWhitespace(text);
}

export function createChunkSources(input: {
  kind: "markdown" | "pdf" | "text";
  pages: Array<{ pageNumber: number; text: string }>;
  text: string;
}): ChunkSource[] {
  if (input.kind === "markdown") {
    return splitMarkdownBlocks(input.text);
  }

  if (input.kind === "pdf") {
    return input.pages.flatMap((page) => splitPlainTextBlocks(page.text, page.pageNumber));
  }

  return splitPlainTextBlocks(input.text, null);
}

export function estimateTokenCount(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function createDocumentSummary(text: string) {
  const normalized = normalizeWhitespace(text);

  if (normalized.length <= 280) {
    return normalized;
  }

  const clipped = normalized.slice(0, 280);
  const sentenceBoundary = clipped.lastIndexOf(".");

  if (sentenceBoundary >= 120) {
    return clipped.slice(0, sentenceBoundary + 1).trim();
  }

  return `${clipped.trimEnd()}…`;
}
