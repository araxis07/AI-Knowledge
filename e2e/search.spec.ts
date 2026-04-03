import { expect, test } from "@playwright/test";

import { signInThroughUi } from "./helpers/app";
import { hasSupabaseAdminE2EEnv } from "./helpers/test-env";
import {
  cleanupWorkspace,
  createConfirmedUser,
  createTestName,
  createWorkspaceForUser,
  deleteUser,
  seedIndexedDocument,
} from "./helpers/supabase-admin";

test("runs keyword search with workspace filters and snippet previews", async ({ page }) => {
  test.skip(!hasSupabaseAdminE2EEnv(), "Supabase service-role test env is required.");
  const owner = await createConfirmedUser("search-owner");
  const workspace = await createWorkspaceForUser({
    name: createTestName("Search Workspace"),
    ownerUserId: owner.id,
    settings: {
      defaultSearchMode: "hybrid",
    },
    slug: createTestName("search-workspace"),
  });

  try {
    await seedIndexedDocument({
      chunkContent:
        "Escalate failed payments within 24 hours. The Aurora enterprise renewal target is 95%.",
      documentTitle: "Aurora Operations Handbook",
      ownerUserId: owner.id,
      summary: "Searchable handbook for billing and renewal operations.",
      tagName: "Billing",
      workspaceId: workspace.id,
    });

    await signInThroughUi(page, owner);
    await page.goto(`/app/${workspace.slug}/search`);

    await page.getByLabel("Search query").fill("failed payments");
    await page.getByLabel("Mode").selectOption("keyword");
    await page.getByLabel("Tag").selectOption({ label: "Billing" });
    await page.getByRole("button", { name: "Run search" }).click();

    await page.waitForURL(/q=failed\+payments|q=failed%20payments/);
    await expect(page.getByRole("heading", { name: "Search results" })).toBeVisible();
    await expect(page.getByTestId("workspace-search-result-card")).toContainText(
      "Aurora Operations Handbook",
    );
    await expect(page.getByText("Escalate failed payments within 24 hours")).toBeVisible();
  } finally {
    await cleanupWorkspace(workspace.id).catch(() => undefined);
    await deleteUser(owner.id);
  }
});
