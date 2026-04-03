import { expect, test } from "@playwright/test";

import { hasProviderTestEnv, hasSupabaseAdminE2EEnv } from "./helpers/test-env";
import { signInThroughUi } from "./helpers/app";
import {
  cleanupWorkspace,
  createConfirmedUser,
  createTestName,
  createWorkspaceForUser,
  deleteUser,
  seedIndexedDocument,
} from "./helpers/supabase-admin";

test.skip(
  !hasSupabaseAdminE2EEnv() || !hasProviderTestEnv(),
  "Provider-backed Q&A tests require Supabase service-role env, PLAYWRIGHT_ENABLE_PROVIDER_TESTS=true, and OPENAI_API_KEY.",
);

test("answers a grounded workspace question with visible citations @provider", async ({ page }) => {
  const owner = await createConfirmedUser("qa-owner");
  const workspace = await createWorkspaceForUser({
    name: createTestName("Grounded Answers"),
    ownerUserId: owner.id,
    settings: {
      citationsRequired: true,
      defaultConversationVisibility: "private",
      defaultSearchMode: "hybrid",
    },
    slug: createTestName("grounded-answers"),
  });

  try {
    await seedIndexedDocument({
      chunkContent:
        "The Aurora enterprise renewal target is 95% this quarter. Escalate failed payments within 24 hours.",
      documentTitle: "Aurora Customer Handbook",
      ownerUserId: owner.id,
      summary: "Grounding source for customer operations.",
      workspaceId: workspace.id,
    });

    await signInThroughUi(page, owner);
    await page.goto(`/app/${workspace.slug}/conversations`);
    await page.getByLabel("Question").fill(
      "What renewal target is set for Aurora enterprise accounts?",
    );
    await page.getByRole("button", { name: "Ask workspace" }).click();

    await page.waitForURL(/conversation=/, { timeout: 90_000 });
    await expect(page.getByText("Citations")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId("conversation-citation-card")).toContainText(
      "Aurora Customer Handbook",
    );
    await expect(page.getByText("95%")).toBeVisible();
  } finally {
    await cleanupWorkspace(workspace.id).catch(() => undefined);
    await deleteUser(owner.id);
  }
});
