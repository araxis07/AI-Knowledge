import { expect, type Page } from "@playwright/test";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function signInThroughUi(
  page: Page,
  credentials: { email: string; password: string },
) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);

  await Promise.all([
    page.waitForURL(/\/app(?:\/|$)/),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);

  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

export async function createWorkspaceThroughUi(
  page: Page,
  workspace: {
    description?: string;
    name: string;
    slug: string;
  },
) {
  await page.goto("/app");
  await page.getByLabel("Workspace name").fill(workspace.name);
  await page.getByLabel("Workspace slug").fill(workspace.slug);

  if (workspace.description) {
    await page.getByLabel("Description").fill(workspace.description);
  }

  await Promise.all([
    page.waitForURL(new RegExp(`/app/${escapeRegex(workspace.slug)}(?:\\?|$)`)),
    page.getByRole("button", { name: "Create workspace" }).click(),
  ]);

  await expect(page.getByLabel("Switch active workspace").first()).toHaveValue(workspace.slug);
}

export async function uploadDocumentThroughUi(
  page: Page,
  input: {
    description?: string;
    filePath: string;
    title?: string;
    workspaceSlug: string;
  },
) {
  await page.goto(`/app/${input.workspaceSlug}/documents`);
  await page.getByLabel("Document file").setInputFiles(input.filePath);

  if (input.title) {
    await page.getByLabel("Custom title").fill(input.title);
  }

  if (input.description) {
    await page.getByLabel("Description").fill(input.description);
  }

  await page.getByRole("button", { name: "Upload to library" }).click();
  await expect(page.getByText(/The document uploaded successfully/i)).toBeVisible();
}

export async function waitForEitherText(
  page: Page,
  candidates: string[],
  timeout = 30_000,
) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const candidate of candidates) {
      if (await page.getByText(candidate, { exact: false }).isVisible().catch(() => false)) {
        return candidate;
      }
    }

    await page.waitForTimeout(500);
  }

  throw new Error(`Timed out waiting for one of: ${candidates.join(", ")}`);
}
