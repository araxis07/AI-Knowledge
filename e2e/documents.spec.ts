import path from "node:path";

import { expect, test } from "@playwright/test";

import { signInThroughUi, uploadDocumentThroughUi, waitForEitherText } from "./helpers/app";
import { hasSupabaseAdminE2EEnv } from "./helpers/test-env";
import {
  cleanupWorkspace,
  createConfirmedUser,
  createTestName,
  createWorkspaceForUser,
  deleteUser,
} from "./helpers/supabase-admin";

test("uploads a document and shows ingestion status visibility", async ({ page }) => {
  test.skip(!hasSupabaseAdminE2EEnv(), "Supabase service-role test env is required.");
  const owner = await createConfirmedUser("document-owner");
  const workspace = await createWorkspaceForUser({
    name: createTestName("Document Library"),
    ownerUserId: owner.id,
    slug: createTestName("document-library"),
  });
  const fixturePath = path.join(
    process.cwd(),
    "e2e/fixtures/documents/customer-ops-handbook.md",
  );

  try {
    await signInThroughUi(page, owner);
    await uploadDocumentThroughUi(page, {
      description: "Seed upload for the library flow.",
      filePath: fixturePath,
      title: "Customer Ops Handbook",
      workspaceSlug: workspace.slug,
    });

    await Promise.all([
      page.waitForURL(new RegExp(`/app/${workspace.slug}/documents/.+`)),
      page.getByRole("link", { name: "Open document" }).click(),
    ]);

    await expect(page.getByRole("heading", { name: "Customer Ops Handbook" })).toBeVisible();
    await expect(page.getByText("Latest job")).toBeVisible();
    await expect(page.getByText(/extract · (queued|running|completed|failed|cancelled)/i)).toBeVisible();

    const status = await waitForEitherText(page, ["Uploaded", "Processing", "Ready", "Failed"]);
    expect(["Uploaded", "Processing", "Ready", "Failed"]).toContain(status);
  } finally {
    await cleanupWorkspace(workspace.id).catch(() => undefined);
    await deleteUser(owner.id);
  }
});
