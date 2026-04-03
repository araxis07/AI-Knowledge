import { expect, test } from "@playwright/test";

import { createWorkspaceThroughUi, signInThroughUi } from "./helpers/app";
import { hasSupabaseAdminE2EEnv } from "./helpers/test-env";
import {
  addWorkspaceMember,
  cleanupWorkspace,
  createConfirmedUser,
  createTestName,
  createWorkspaceForUser,
  deleteUser,
  findWorkspaceBySlug,
} from "./helpers/supabase-admin";

test("creates a workspace from the UI and switches between workspaces", async ({ page }) => {
  test.skip(!hasSupabaseAdminE2EEnv(), "Supabase service-role test env is required.");
  const owner = await createConfirmedUser("workspace-owner");
  let createdWorkspaceId: string | null = null;
  let secondWorkspaceId: string | null = null;

  try {
    await signInThroughUi(page, owner);

    const workspaceName = createTestName("Workspace Alpha");
    const workspaceSlug = createTestName("workspace-alpha");
    await createWorkspaceThroughUi(page, {
      description: "Primary workspace created through the UI.",
      name: workspaceName,
      slug: workspaceSlug,
    });

    const createdWorkspace = await findWorkspaceBySlug(workspaceSlug);
    createdWorkspaceId = createdWorkspace?.id ?? null;

    const secondWorkspace = await createWorkspaceForUser({
      name: createTestName("Workspace Beta"),
      ownerUserId: owner.id,
      slug: createTestName("workspace-beta"),
    });
    secondWorkspaceId = secondWorkspace.id;

    await page.reload();
    await page.getByLabel("Switch active workspace").first().selectOption(secondWorkspace.slug);
    await page.waitForURL(new RegExp(`/app/${secondWorkspace.slug}(?:\\?|$)`));
    await expect(page.getByLabel("Switch active workspace").first()).toHaveValue(
      secondWorkspace.slug,
    );
  } finally {
    if (createdWorkspaceId) {
      await cleanupWorkspace(createdWorkspaceId).catch(() => undefined);
    }
    if (secondWorkspaceId) {
      await cleanupWorkspace(secondWorkspaceId).catch(() => undefined);
    }
    await deleteUser(owner.id);
  }
});

test("lets an owner update and remove workspace members", async ({ page }) => {
  test.skip(!hasSupabaseAdminE2EEnv(), "Supabase service-role test env is required.");
  const owner = await createConfirmedUser("admin-owner");
  const collaborator = await createConfirmedUser("admin-collaborator");
  const workspace = await createWorkspaceForUser({
    name: createTestName("Admin Controls"),
    ownerUserId: owner.id,
    slug: createTestName("admin-controls"),
  });

  try {
    await addWorkspaceMember({
      role: "viewer",
      userId: collaborator.id,
      workspaceId: workspace.id,
    });

    await signInThroughUi(page, owner);
    await page.goto(`/app/${workspace.slug}/settings`);

    const memberRow = page.getByTestId(`workspace-member-row-${collaborator.id}`);
    await expect(memberRow).toContainText(collaborator.email);
    await memberRow.getByRole("combobox").selectOption("editor");
    await memberRow.getByRole("button", { name: "Save role" }).click();

    await page.waitForURL(/members=saved/);
    await expect(page.getByText("The member role was updated.")).toBeVisible();
    await expect(memberRow).toContainText("Editor");

    await memberRow.getByRole("button", { name: "Remove member" }).click();
    await page.waitForURL(/members=removed/);
    await expect(page.getByText("The member was removed from this workspace.")).toBeVisible();
    await expect(memberRow).toHaveCount(0);
  } finally {
    await cleanupWorkspace(workspace.id).catch(() => undefined);
    await deleteUser(collaborator.id);
    await deleteUser(owner.id);
  }
});
