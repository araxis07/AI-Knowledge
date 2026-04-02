"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpRightIcon, UploadIcon } from "@/components/ui/icons";
import { documentAcceptAttribute, supportedDocumentMimeLabels } from "@/lib/document-format";
import { formatBytes } from "@/lib/utils/format-bytes";
import { asRoute } from "@/lib/utils/as-route";

type UploadResponse = {
  documentId?: string;
  message?: string;
  title?: string;
};

export function DocumentUploadPanel({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);
  const acceptedFormats = useMemo(() => supportedDocumentMimeLabels.join(" • "), []);

  async function handleSubmit(formData: FormData) {
    const response = await fetch(`/api/workspaces/${workspaceSlug}/documents`, {
      body: formData,
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as UploadResponse;

    if (!response.ok) {
      setUploadedDocumentId(null);
      setMessage(null);
      setError(payload.message ?? "Unable to upload this document right now.");
      return;
    }

    setError(null);
    setMessage(payload.message ?? "The document uploaded successfully.");
    setUploadedDocumentId(payload.documentId ?? null);
    setSelectedFile(null);

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white/84 text-slate-900">
          <UploadIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Upload document</h2>
          <p className="mt-1 text-sm text-slate-600">
            Store the original file in Supabase Storage and register it in the workspace library.
          </p>
        </div>
      </div>

      <form
        className="mt-6 grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);

          const formData = new FormData(event.currentTarget);

          startTransition(() => {
            void handleSubmit(formData);
          });
        }}
      >
        {error ? (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div className="flex flex-wrap items-center gap-3">
              <span>{message}</span>
              {uploadedDocumentId ? (
                <Link
                  className={buttonStyles({ size: "sm", variant: "ghost" })}
                  href={asRoute(`/app/${workspaceSlug}/documents/${uploadedDocumentId}`)}
                >
                  Open document
                  <ArrowUpRightIcon />
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <label
          className="group relative flex cursor-pointer flex-col gap-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(241,245,249,0.9))] p-5 transition hover:border-teal-400/50 hover:bg-white"
          htmlFor="document-file"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-slate-950">Supported formats</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{acceptedFormats}</p>
            </div>
            <div className="inline-flex size-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_16px_34px_-20px_rgba(15,23,42,0.65)]">
              <UploadIcon />
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-white/84 px-4 py-4 text-sm text-slate-600">
            {selectedFile ? (
              <div className="space-y-1">
                <p className="font-medium text-slate-950">{selectedFile.name}</p>
                <p>{formatBytes(selectedFile.size)}</p>
              </div>
            ) : (
              <p>Select one file to upload into this workspace.</p>
            )}
          </div>
          <Input
            accept={documentAcceptAttribute}
            id="document-file"
            name="file"
            onChange={(event) => {
              setSelectedFile(event.currentTarget.files?.[0] ?? null);
              setError(null);
            }}
            required
            type="file"
          />
        </label>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="document-title">
            Title override
          </label>
          <Input
            id="document-title"
            name="title"
            placeholder="Optional. Defaults to the filename."
            type="text"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="document-description">
            Description
          </label>
          <Textarea
            id="document-description"
            name="description"
            placeholder="Optional context for the library and future retrieval behavior."
          />
        </div>

        <Button disabled={isPending} type="submit">
          {isPending ? "Uploading..." : "Upload to library"}
        </Button>
      </form>
    </Card>
  );
}
