"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SparkIcon } from "@/components/ui/icons";
import { Textarea } from "@/components/ui/textarea";
import { asRoute } from "@/lib/utils/as-route";

export function ConversationComposer({
  conversationId,
  workspaceSlug,
}: {
  conversationId: string | null;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const isBusy = isSubmitting || isNavigating;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length < 3) {
      setError("Ask a question with at least 3 characters.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        asRoute(`/api/workspaces/${workspaceSlug}/conversations/ask`),
        {
          body: JSON.stringify({
            conversationId,
            question: trimmedQuestion,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | {
            conversationId?: string;
            message?: string;
          }
        | null;

      const nextConversationId = payload?.conversationId;

      if (!response.ok || !nextConversationId) {
        setError(payload?.message ?? "The grounded answer could not be generated right now.");
        return;
      }

      setQuestion("");
      startTransition(() => {
        router.replace(
          asRoute(
            `/app/${workspaceSlug}/conversations?conversation=${encodeURIComponent(nextConversationId)}`,
          ),
        );
        router.refresh();
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The grounded answer could not be generated right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white/84 text-slate-900">
          <SparkIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Ask with grounded citations
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Answers only use retrieved workspace context. If the context is too weak, the assistant will say so clearly instead of guessing.
          </p>
        </div>
      </div>

      <form className="mt-6 grid gap-4" noValidate onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="workspace-question">
            Question
          </label>
          <Textarea
            id="workspace-question"
            maxLength={3000}
            onChange={(event) => {
              setQuestion(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="Ask what the documents say, what is missing, or where the evidence lives."
            value={question}
          />
          <p className="text-xs leading-5 text-slate-500">
            {conversationId
              ? "This question will be added to the current thread."
              : "This starts a new conversation thread in the current workspace."}
          </p>
        </div>

        {error ? (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-slate-500">
            Citation cards appear under each grounded assistant reply.
          </p>
          <Button disabled={isBusy} type="submit" variant="accent">
            {isBusy ? "Grounding answer..." : "Ask workspace"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
