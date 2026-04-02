"use client";

import { startTransition, useActionState, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createWorkspaceAction } from "@/app/actions/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { idleFormActionState } from "@/lib/types/actions";
import { slugify } from "@/lib/utils/slugify";
import {
  createWorkspaceSchema,
  type CreateWorkspaceInput,
} from "@/lib/validation/workspace";

export function CreateWorkspaceForm() {
  const [serverState, dispatch, isPending] = useActionState(
    createWorkspaceAction,
    idleFormActionState,
  );
  const [isSlugDirty, setIsSlugDirty] = useState(false);
  const form = useForm<CreateWorkspaceInput>({
    defaultValues: {
      citationsRequired: true,
      defaultConversationVisibility: "private",
      defaultSearchMode: "hybrid",
      description: "",
      name: "",
      slug: "",
    },
    resolver: zodResolver(createWorkspaceSchema),
  });

  const watchedName = useWatch({
    control: form.control,
    name: "name",
  });
  const suggestedSlug = slugify(watchedName ?? "");

  const errors = {
    description:
      form.formState.errors.description?.message ?? serverState.fieldErrors?.description?.[0],
    name: form.formState.errors.name?.message ?? serverState.fieldErrors?.name?.[0],
    slug: form.formState.errors.slug?.message ?? serverState.fieldErrors?.slug?.[0],
  };

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const formData = new FormData();
        formData.set("citationsRequired", values.citationsRequired ? "true" : "false");
        formData.set("defaultConversationVisibility", values.defaultConversationVisibility);
        formData.set("defaultSearchMode", values.defaultSearchMode);
        formData.set("description", values.description ?? "");
        formData.set("name", values.name);
        formData.set("slug", values.slug);

        startTransition(() => {
          dispatch(formData);
        });
      })}
    >
      {serverState.message && (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverState.message}
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="workspace-name">
          Workspace name
        </label>
        <Input
          id="workspace-name"
          placeholder="Product research"
          type="text"
          {...form.register("name", {
            onChange: (event) => {
              if (!isSlugDirty) {
                form.setValue("slug", slugify(event.target.value), {
                  shouldDirty: false,
                  shouldValidate: true,
                });
              }
            },
          })}
        />
        {errors.name && <p className="text-sm text-rose-600">{errors.name}</p>}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="workspace-slug">
          Workspace slug
        </label>
        <Input
          id="workspace-slug"
          placeholder="product-research"
          type="text"
          {...form.register("slug", {
            onChange: () => {
              setIsSlugDirty(true);
            },
          })}
        />
        <p className="text-sm text-slate-500">
          This becomes part of the URL. Suggested:{" "}
          <span className="font-semibold text-slate-900">{suggestedSlug || "product-research"}</span>
        </p>
        {errors.slug && <p className="text-sm text-rose-600">{errors.slug}</p>}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="workspace-description">
          Description
        </label>
        <Textarea
          id="workspace-description"
          placeholder="What this workspace is for, who it serves, and how answers should be grounded."
          {...form.register("description")}
        />
        {errors.description && <p className="text-sm text-rose-600">{errors.description}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="workspace-search-mode">
            Default search mode
          </label>
          <Select id="workspace-search-mode" {...form.register("defaultSearchMode")}>
            <option value="hybrid">Hybrid</option>
            <option value="semantic">Semantic</option>
            <option value="keyword">Keyword</option>
          </Select>
        </div>

        <div className="grid gap-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="workspace-conversation-visibility"
          >
            Default conversation visibility
          </label>
          <Select
            id="workspace-conversation-visibility"
            {...form.register("defaultConversationVisibility")}
          >
            <option value="private">Private</option>
            <option value="workspace">Workspace</option>
          </Select>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--app-border)] bg-white px-4 py-3 text-sm text-slate-700">
        <input
          className="mt-1 size-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          type="checkbox"
          {...form.register("citationsRequired")}
        />
        <span>
          Require citations by default for grounded answers in this workspace.
        </span>
      </label>

      <Button disabled={isPending} type="submit">
        {isPending ? "Creating workspace..." : "Create workspace"}
      </Button>
    </form>
  );
}
