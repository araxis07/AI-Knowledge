import { estimateTokenCount } from "@/server/ingestion/normalize";
import type { ChunkDraft, ChunkSource } from "@/server/ingestion/types";

const DEFAULT_MAX_CHARS = 1_200;
const DEFAULT_OVERLAP_CHARS = 180;

function splitOversizedText(text: string, maxChars: number): string[] {
  const sentences = text.match(/[^.!?\n]+(?:[.!?]+|\n|$)/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const normalized = current.trim();

    if (normalized) {
      chunks.push(normalized);
    }

    current = "";
  };

  for (const sentence of sentences) {
    const normalizedSentence = sentence.trim();

    if (!normalizedSentence) {
      continue;
    }

    if (normalizedSentence.length > maxChars) {
      pushCurrent();

      for (let start = 0; start < normalizedSentence.length; start += maxChars) {
        chunks.push(normalizedSentence.slice(start, start + maxChars).trim());
      }

      continue;
    }

    const nextValue = current ? `${current} ${normalizedSentence}` : normalizedSentence;

    if (nextValue.length > maxChars) {
      pushCurrent();
      current = normalizedSentence;
      continue;
    }

    current = nextValue;
  }

  pushCurrent();
  return chunks;
}

function createOverlap(content: string, overlapChars: number) {
  if (content.length <= overlapChars) {
    return content;
  }

  const tail = content.slice(-overlapChars).trimStart();
  const firstWhitespace = tail.search(/\s/);

  if (firstWhitespace > 0) {
    return tail.slice(firstWhitespace).trim();
  }

  return tail;
}

export function buildChunks(
  sources: ChunkSource[],
  options?: {
    maxChars?: number;
    overlapChars?: number;
  },
): ChunkDraft[] {
  const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS;
  const overlapChars = options?.overlapChars ?? DEFAULT_OVERLAP_CHARS;
  const chunks: ChunkDraft[] = [];
  let chunkIndex = 0;
  let carryOver = "";

  for (const source of sources) {
    const pieces =
      source.text.length > maxChars ? splitOversizedText(source.text, maxChars) : [source.text];

    let currentParts = carryOver ? [carryOver] : [];
    let currentHeading = source.heading;
    let currentLength = carryOver.length;
    let usedOverlap = carryOver.length > 0 ? carryOver.length : 0;

    const flushChunk = () => {
      const content = currentParts.join("\n\n").trim();

      if (!content) {
        currentParts = [];
        currentLength = 0;
        return;
      }

      chunks.push({
        chunkIndex,
        content,
        heading: currentHeading,
        metadata: {
          overlapChars: usedOverlap,
        },
        pageNumber: source.pageNumber,
        tokenCount: estimateTokenCount(content),
      });
      chunkIndex += 1;
      carryOver = createOverlap(content, overlapChars);
      currentParts = carryOver ? [carryOver] : [];
      currentLength = carryOver.length;
      usedOverlap = carryOver.length;
      currentHeading = source.heading;
    };

    for (const piece of pieces) {
      const nextLength = currentLength === 0 ? piece.length : currentLength + piece.length + 2;

      if (currentLength > 0 && nextLength > maxChars) {
        flushChunk();
      }

      currentParts.push(piece);
      currentLength = currentLength === 0 ? piece.length : currentLength + piece.length + 2;

      if (!currentHeading && source.heading) {
        currentHeading = source.heading;
      }
    }

    if (currentParts.length > 0) {
      flushChunk();
    }
  }

  return chunks;
}
