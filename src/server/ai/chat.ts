import "server-only";

import { readServerEnv } from "@/lib/env";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_CHAT_MODEL = "gpt-5.2";

type GroundedAnswerSource = {
  content: string;
  documentTitle: string;
  heading: string | null;
  pageNumber: number | null;
  sourceId: string;
};

export type GroundedAnswerProviderInput = {
  history: Array<{
    content: string;
    role: "assistant" | "user";
  }>;
  question: string;
  sources: GroundedAnswerSource[];
};

export type GroundedAnswerProviderOutput = {
  answer: string;
  citations: Array<{
    quote: string;
    sourceId: string;
  }>;
  completionTokens: number | null;
  insufficientContext: boolean;
  model: string;
  promptTokens: number | null;
  provider: string;
};

export interface ChatProvider {
  readonly key: string;
  readonly model: string;

  generateGroundedAnswer(
    input: GroundedAnswerProviderInput,
  ): Promise<GroundedAnswerProviderOutput>;
}

type OpenAIResponsePayload = {
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  output_text?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

const groundedAnswerSchema = {
  additionalProperties: false,
  properties: {
    answer: {
      type: "string",
    },
    citations: {
      items: {
        additionalProperties: false,
        properties: {
          quote: {
            type: "string",
          },
          sourceId: {
            type: "string",
          },
        },
        required: ["sourceId", "quote"],
        type: "object",
      },
      type: "array",
    },
    insufficientContext: {
      type: "boolean",
    },
  },
  required: ["answer", "insufficientContext", "citations"],
  type: "object",
} as const;

function getOpenAIResponseText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  for (const outputItem of payload.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (typeof contentItem.text === "string" && contentItem.text.trim()) {
        return contentItem.text;
      }
    }
  }

  throw new Error("The chat provider returned no text output.");
}

function buildSystemPrompt() {
  return [
    "You answer questions for a workspace knowledge base.",
    "Use only the supplied sources and conversation history.",
    "Never invent facts or cite a source that was not provided.",
    "If the sources do not support a reliable answer, set insufficientContext to true and leave the answer concise.",
    "When the answer is supported, keep it concise and practical.",
    "Return citations only for sourceIds you actually used.",
    "Each citation quote must be a short verbatim excerpt copied from the cited source.",
  ].join(" ");
}

function buildUserPayload(input: GroundedAnswerProviderInput) {
  return JSON.stringify(
    {
      history: input.history,
      question: input.question,
      responseContract: {
        answerStyle: "concise_grounded_answer",
        citeOnlyProvidedSources: true,
      },
      sources: input.sources.map((source) => ({
        content: source.content,
        documentTitle: source.documentTitle,
        heading: source.heading,
        pageNumber: source.pageNumber,
        sourceId: source.sourceId,
      })),
    },
    null,
    2,
  );
}

class OpenAIChatProvider implements ChatProvider {
  readonly key = "openai";
  readonly model: string;
  readonly #apiKey: string;
  readonly #baseUrl: string;

  constructor(input: {
    apiKey: string;
    baseUrl: string;
    model: string;
  }) {
    this.#apiKey = input.apiKey;
    this.#baseUrl = input.baseUrl;
    this.model = input.model;
  }

  async generateGroundedAnswer(
    input: GroundedAnswerProviderInput,
  ): Promise<GroundedAnswerProviderOutput> {
    const response = await fetch(`${this.#baseUrl}/responses`, {
      body: JSON.stringify({
        input: [
          {
            content: [
              {
                text: buildSystemPrompt(),
                type: "input_text",
              },
            ],
            role: "system",
          },
          {
            content: [
              {
                text: buildUserPayload(input),
                type: "input_text",
              },
            ],
            role: "user",
          },
        ],
        model: this.model,
        text: {
          format: {
            name: "grounded_answer",
            schema: groundedAnswerSchema,
            strict: true,
            type: "json_schema",
          },
        },
      }),
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Chat request failed with ${response.status}: ${body}`);
    }

    const payload = (await response.json()) as OpenAIResponsePayload;
    const text = getOpenAIResponseText(payload);
    const parsed = JSON.parse(text) as {
      answer?: unknown;
      citations?: unknown;
      insufficientContext?: unknown;
    };

    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    const insufficientContext = parsed.insufficientContext === true;
    const citations = Array.isArray(parsed.citations)
      ? parsed.citations.flatMap((citation) => {
          if (!citation || typeof citation !== "object") {
            return [];
          }

          const sourceId =
            "sourceId" in citation && typeof citation.sourceId === "string"
              ? citation.sourceId.trim()
              : "";
          const quote =
            "quote" in citation && typeof citation.quote === "string"
              ? citation.quote.trim()
              : "";

          if (!sourceId || !quote) {
            return [];
          }

          return [
            {
              quote,
              sourceId,
            },
          ];
        })
      : [];

    return {
      answer,
      citations,
      completionTokens: payload.usage?.output_tokens ?? null,
      insufficientContext,
      model: this.model,
      promptTokens: payload.usage?.input_tokens ?? null,
      provider: this.key,
    };
  }
}

export function createChatProvider(): ChatProvider {
  const env = readServerEnv();
  const providerKey = env.AI_CHAT_PROVIDER ?? "openai";

  if (providerKey !== "openai") {
    throw new Error(`Unsupported chat provider: ${providerKey}`);
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to generate grounded answers.");
  }

  return new OpenAIChatProvider({
    apiKey: env.OPENAI_API_KEY,
    baseUrl: env.AI_OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL,
    model: env.AI_OPENAI_CHAT_MODEL ?? DEFAULT_OPENAI_CHAT_MODEL,
  });
}
