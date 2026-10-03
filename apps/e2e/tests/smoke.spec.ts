import { expect, test } from "@playwright/test";

test("homepage loads and counter works", async ({ page }) => {
  await page.goto("./");

  await expect(
    page.getByRole("heading", { name: "Nix + Vite + React" }),
  ).toBeVisible();

  const button = page.getByRole("button", { name: /count is \d+/ });
  await expect(button).toBeVisible();
  await expect(button).toHaveText("count is 0");

  await button.click();
  await expect(button).toHaveText("count is 1");
});
