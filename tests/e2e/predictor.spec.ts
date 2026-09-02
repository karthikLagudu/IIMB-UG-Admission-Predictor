import { expect, test } from "@playwright/test";

test("home routes candidates to both independent products", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Which IIM will you land/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Predict my IIM calls/ })).toHaveAttribute("href", "/predictor");
  await expect(page.getByRole("link", { name: /Explore IIMB UG/ })).toHaveAttribute("href", "/iimb-ug");
});

test("the existing CAT predictor still completes its primary flow", async ({ page }) => {
  await page.goto("/predictor");
  await expect(page.getByRole("heading", { name: "Candidate profile" })).toBeVisible();
  await page.getByRole("button", { name: "Analyze all 21 IIM Chances" }).click();
  await expect(page.getByRole("heading", { name: "Your IIM results" })).toBeAttached();
  await expect(page.getByRole("button", { name: "View more details for IIM Ahmedabad" })).toBeVisible();
  await expect(page.getByRole("button", { name: "View more details for IIM Bangalore" })).toBeVisible();
  await expect(page.getByRole("button", { name: "View more details for IIM Calcutta" })).toBeVisible();
});

test("UG product header keeps the requested minimal branding", async ({ page }) => {
  await page.goto("/iimb-ug");
  await expect(page.getByRole("link", { name: "CAT IIM Predictor home" })).toBeVisible();
  await expect(page.getByText("IIMB UG · 2027–31", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "CAT predictor" })).toHaveCount(0);
});

test("existing and UG admin APIs reject missing authorization", async ({ request }) => {
  expect((await request.get("/api/iima/policy")).status()).toBe(401);
  expect((await request.get("/api/iimb-ug/policy")).status()).toBe(401);
  expect((await request.get("/api/iimb-ug/runtime")).status()).toBe(401);
});
