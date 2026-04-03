import { createHash, randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getRequiredSupabaseE2EEnv } from "./test-env";

type TestWorkspaceSettings = {
  citationsRequired: boolean;
  defaultConversationVisibility: "private" | "workspace";
  defaultSearchMode: "keyword" | "semantic" | "hybrid";
};

type CreatedUser = {
  email: string;
  fullName: string;
  id: string;
  password: string;
};

type CreatedWorkspace = {
  id: string;
  name: string;
  slug: string;
};

type SeedIndexedDocumentInput = {
  chunkContent: string;
  createdAt?: string;
  documentDescription?: string | null;
  documentTitle: string;
  ownerUserId: string;
  pageNumber?: number | null;
  summary?: string | null;
  tagName?: string;
  workspaceId: string;
};

type GenericTable = {
  Insert: Record<string, unknown>;
  Relationships: [];
  Row: Record<string, unknown>;
  Update: Record<string, unknown>;
};

type AdminDatabase = {
  public: {
    CompositeTypes: Record<string, never>;
    Enums: Record<string, string>;
    Functions: Record<string, never>;
    Tables: Record<string, GenericTable>;
    Views: Record<string, never>;
  };
};

let supabaseAdminClient: SupabaseClient<AdminDatabase> | null = null;

function getSupabaseAdminClient() {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const supabaseEnv = getRequiredSupabaseE2EEnv();
  supabaseAdminClient = createClient<AdminDatabase>(
    supabaseEnv.url,
    supabaseEnv.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        headers: {
          "X-Client-Info": "ai-knowledge-base/e2e",
        },
      },
    },
  );

  return supabaseAdminClient;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function shortToken() {
  return randomUUID().slice(0, 8);
}

export function createTestName(prefix: string) {
  return `${prefix}-${Date.now()}-${shortToken()}`;
}

export function createTestEmail(prefix: string) {
  return `${createTestName(prefix)}@example.com`;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function waitForProfile(userId: string) {
  const supabaseAdmin = getSupabaseAdminClient();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (data?.id) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Profile sync did not complete for user ${userId}.`);
}

export async function createConfirmedUser(prefix: string): Promise<CreatedUser> {
  const supabaseAdmin = getSupabaseAdminClient();
  const email = createTestEmail(prefix);
  const password = `Passw0rd!${shortToken()}${shortToken()}`;
  const fullName = `E2E ${prefix} ${shortToken()}`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create a confirmed test user.");
  }

  await waitForProfile(data.user.id);

  return {
    email,
    fullName,
    id: data.user.id,
    password,
  };
}

export async function deleteUser(userId: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

export async function deleteUserByEmail(email: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to resolve test user by email: ${error.message}`);
  }

  const resolvedProfile = (data ?? null) as { id: string } | null;

  if (resolvedProfile?.id) {
    await deleteUser(resolvedProfile.id);
  }
}

export async function createWorkspaceForUser(input: {
  name: string;
  ownerUserId: string;
  settings?: Partial<TestWorkspaceSettings>;
  slug?: string;
}) {
  const supabaseAdmin = getSupabaseAdminClient();
  const slug = input.slug ?? slugify(`${input.name}-${shortToken()}`);
  const settings: TestWorkspaceSettings = {
    citationsRequired: input.settings?.citationsRequired ?? true,
    defaultConversationVisibility:
      input.settings?.defaultConversationVisibility ?? "private",
    defaultSearchMode: input.settings?.defaultSearchMode ?? "hybrid",
  };

  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .insert({
      created_by: input.ownerUserId,
      name: input.name,
      settings,
      slug,
    })
    .select("id, name, slug")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create workspace for E2E.");
  }

  const resolvedWorkspace = data as CreatedWorkspace;

  await supabaseAdmin.from("workspace_members").upsert(
    {
      role: "owner",
      user_id: input.ownerUserId,
      workspace_id: resolvedWorkspace.id,
    },
    {
      onConflict: "workspace_id,user_id",
    },
  );

  return resolvedWorkspace;
}

export async function findWorkspaceBySlug(slug: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to resolve workspace by slug: ${error.message}`);
  }

  return data as CreatedWorkspace | null;
}

export async function addWorkspaceMember(input: {
  role: "viewer" | "editor" | "admin" | "owner";
  userId: string;
  workspaceId: string;
}) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("workspace_members").upsert(
    {
      role: input.role,
      user_id: input.userId,
      workspace_id: input.workspaceId,
    },
    {
      onConflict: "workspace_id,user_id",
    },
  );

  if (error) {
    throw new Error(`Unable to add workspace member: ${error.message}`);
  }
}

export async function seedIndexedDocument(input: SeedIndexedDocumentInput) {
  const supabaseAdmin = getSupabaseAdminClient();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const documentId = randomUUID();
  const chunkId = randomUUID();
  const storagePath = `${input.workspaceId}/${documentId}/seed.md`;
  const checksum = sha256(`${documentId}:${input.chunkContent}`);
  const chunkCount = 1;

  const { error: documentError } = await supabaseAdmin.from("documents").insert({
    checksum_sha256: checksum,
    chunk_count: chunkCount,
    created_at: createdAt,
    description: input.documentDescription ?? null,
    file_extension: "md",
    indexed_at: createdAt,
    last_ingested_at: createdAt,
    metadata: {
      seededBy: "playwright",
    },
    mime_type: "text/markdown",
    size_bytes: Buffer.byteLength(input.chunkContent, "utf8"),
    source_type: "upload",
    status: "indexed",
    storage_bucket: "documents",
    storage_path: storagePath,
    summary: input.summary ?? null,
    title: input.documentTitle,
    token_count: input.chunkContent.split(/\s+/).filter(Boolean).length,
    uploaded_by: input.ownerUserId,
    updated_at: createdAt,
    workspace_id: input.workspaceId,
  });

  if (documentError) {
    throw new Error(`Unable to seed document: ${documentError.message}`);
  }

  const { error: chunkError } = await supabaseAdmin.from("document_chunks").insert({
    chunk_index: 0,
    content: input.chunkContent,
    created_at: createdAt,
    document_id: documentId,
    heading: input.documentTitle,
    metadata: {
      seededBy: "playwright",
    },
    page_number: input.pageNumber ?? 1,
    token_count: input.chunkContent.split(/\s+/).filter(Boolean).length,
    updated_at: createdAt,
    workspace_id: input.workspaceId,
  });

  if (chunkError) {
    throw new Error(`Unable to seed document chunk: ${chunkError.message}`);
  }

  let tagId: string | null = null;

  if (input.tagName) {
    const normalizedTagSlug = slugify(input.tagName);
    const { data: tag, error: tagError } = await supabaseAdmin
      .from("document_tags")
      .upsert(
        {
          color: "teal",
          name: input.tagName,
          slug: normalizedTagSlug,
          workspace_id: input.workspaceId,
        },
        {
          onConflict: "workspace_id,slug",
        },
      )
      .select("id")
      .single();

    if (tagError || !tag) {
      throw new Error(`Unable to seed document tag: ${tagError?.message ?? "Unknown error"}`);
    }

    const resolvedTag = tag as { id: string } | null;

    tagId = resolvedTag?.id ?? null;

    if (!tagId) {
      throw new Error("Unable to seed document tag: no tag id was returned.");
    }

    const { error: linkError } = await supabaseAdmin.from("document_tag_links").upsert(
      {
        created_by: input.ownerUserId,
        document_id: documentId,
        tag_id: tagId,
        workspace_id: input.workspaceId,
      },
      {
        onConflict: "document_id,tag_id",
      },
    );

    if (linkError) {
      throw new Error(`Unable to seed document tag link: ${linkError.message}`);
    }
  }

  return {
    chunkId,
    documentId,
    tagId,
  };
}

export async function cleanupWorkspace(workspaceId: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data: documents, error: documentsError } = await supabaseAdmin
    .from("documents")
    .select("storage_bucket, storage_path")
    .eq("workspace_id", workspaceId);

  if (documentsError) {
    throw new Error(`Unable to load workspace documents for cleanup: ${documentsError.message}`);
  }

  const storageGroups = new Map<string, string[]>();
  const resolvedDocuments = (documents ?? []) as Array<{
    storage_bucket: string;
    storage_path: string;
  }>;

  for (const document of resolvedDocuments) {
    const paths = storageGroups.get(document.storage_bucket) ?? [];
    paths.push(document.storage_path);
    storageGroups.set(document.storage_bucket, paths);
  }

  for (const [bucket, paths] of storageGroups) {
    if (paths.length > 0) {
      await supabaseAdmin.storage.from(bucket).remove(paths);
    }
  }

  const { error } = await supabaseAdmin.from("workspaces").delete().eq("id", workspaceId);

  if (error) {
    throw new Error(`Unable to delete workspace during cleanup: ${error.message}`);
  }
}
