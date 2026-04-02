import "server-only";

import { readServerEnv } from "@/lib/env";
import type { EmbeddingProvider } from "@/server/ingestion/types";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "text-embedding-3-small";
const DEFAULT_OPENAI_DIMENSIONS = 1536;
const SUPPORTED_VECTOR_DIMENSIONS = 1536;

type OpenAIEmbeddingResponse = {
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
};

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions: number;
  readonly key = "openai";
  readonly model: string;
  readonly #apiKey: string;
  readonly #baseUrl: string;

  constructor(input: {
    apiKey: string;
    baseUrl: string;
    dimensions: number;
    model: string;
  }) {
    this.#apiKey = input.apiKey;
    this.#baseUrl = input.baseUrl;
    this.dimensions = input.dimensions;
    this.model = input.model;
  }

  async embedTexts(input: string[]): Promise<number[][]> {
    if (input.length === 0) {
      return [];
    }

    const response = await fetch(`${this.#baseUrl}/embeddings`, {
      body: JSON.stringify({
        dimensions: this.model.startsWith("text-embedding-3") ? this.dimensions : undefined,
        encoding_format: "float",
        input,
        model: this.model,
      }),
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Embedding request failed with ${response.status}: ${body}`);
    }

    const payload = (await response.json()) as OpenAIEmbeddingResponse;
    const sorted = payload.data.sort((left, right) => left.index - right.index);

    return sorted.map((item) => {
      if (item.embedding.length !== this.dimensions) {
        throw new Error(
          `Embedding dimension mismatch. Expected ${this.dimensions}, received ${item.embedding.length}.`,
        );
      }

      return item.embedding;
    });
  }
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const env = readServerEnv();
  const providerKey = env.AI_EMBEDDING_PROVIDER ?? "openai";

  if (providerKey !== "openai") {
    throw new Error(`Unsupported embedding provider: ${providerKey}`);
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to generate embeddings.");
  }

  const dimensions = env.AI_OPENAI_EMBEDDING_DIMENSIONS ?? DEFAULT_OPENAI_DIMENSIONS;

  if (dimensions !== SUPPORTED_VECTOR_DIMENSIONS) {
    throw new Error(
      `Embedding dimension mismatch. This deployment expects ${SUPPORTED_VECTOR_DIMENSIONS} dimensions.`,
    );
  }

  return new OpenAIEmbeddingProvider({
    apiKey: env.OPENAI_API_KEY,
    baseUrl: env.AI_OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL,
    dimensions,
    model: env.AI_OPENAI_EMBEDDING_MODEL ?? DEFAULT_OPENAI_MODEL,
  });
}

export function toPgvectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}
