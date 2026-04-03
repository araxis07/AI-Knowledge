import { expect, test } from "@playwright/test";

import { signInThroughUi } from "./helpers/app";
import { hasSupabaseAdminE2EEnv } from "./helpers/test-env";
import {
  createConfirmedUser,
  createTestEmail,
  deleteUser,
  deleteUserByEmail,
} from "./helpers/supabase-admin";

test("redirects unauthenticated visitors away from protected routes", async ({ page }) => {
  await page.goto("/app");

  await page.waitForURL(/\/sign-in(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Access your workspace." })).toBeVisible();
});

test("signs in and signs out with a confirmed Supabase account", async ({ page }) => {
  test.skip(!hasSupabaseAdminE2EEnv(), "Supabase service-role test env is required.");
  const user = await createConfirmedUser("auth-signin");

  try {
    await signInThroughUi(page, user);
    await expect(page.getByRole("heading", { name: "Choose a workspace and keep moving." })).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/$/),
      page.getByRole("button", { name: "Sign out" }).click(),
    ]);

    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
  } finally {
    await deleteUser(user.id);
  }
});

test("supports the public sign-up flow", async ({ page }) => {
  test.skip(!hasSupabaseAdminE2EEnv(), "Supabase service-role test env is required.");
  const email = createTestEmail("auth-signup");
  const password = "Passw0rd!SignupFlow";

  try {
    await page.goto("/sign-up");
    await page.getByLabel("Full name").fill("E2E Signup User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await page.waitForURL((url) => {
      return url.pathname === "/app" || url.pathname === "/sign-in";
    });

    if (page.url().includes("/sign-in")) {
      await expect(
        page.getByText("Check your email to confirm your account, then sign in."),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    }
  } finally {
    await deleteUserByEmail(email);
  }
});
