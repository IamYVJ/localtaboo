import { test, expect } from "@playwright/test";

test.describe("WORDLOCK smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./");
  });

  test("home renders the wordmark and both play modes", async ({ page }) => {
    await expect(page).toHaveTitle(/WORDLOCK/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /start pass & play/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /connect devices/i })).toBeVisible();
  });

  test("navigates into How to Play", async ({ page }) => {
    await page.getByRole("link", { name: /how to play/i }).first().click();
    await expect(page).toHaveURL(/#\/how-to-play/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("opens Pass & Play setup", async ({ page }) => {
    await page.getByRole("link", { name: /start pass & play/i }).click();
    await expect(page).toHaveURL(/#\/pass-and-play/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("opens the peer connection landing", async ({ page }) => {
    await page.getByRole("link", { name: /connect devices/i }).click();
    await expect(page).toHaveURL(/#\/peer/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows the starter deck in the deck manager", async ({ page }) => {
    await page.getByRole("link", { name: /manage decks/i }).click();
    await expect(page).toHaveURL(/#\/decks/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
