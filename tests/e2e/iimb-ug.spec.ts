import { expect, test } from "@playwright/test";

test("worked example produces a complete, source-aware UG report", async ({ page }) => {
  await page.goto("/iimb-ug");
  await expect(page.getByRole("heading", { name: "IIM Bangalore UG Admission Predictor" })).toBeVisible();
  await expect(page.getByText("Independent planning tool · Not affiliated with IIM Bangalore")).toBeVisible();
  await page.getByRole("button", { name: "Analyse my profile" }).click();
  await expect(page.getByRole("heading", { name: "Academic eligibility" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "UG Test score" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Historical cutoff benchmark" })).toBeVisible();
  await expect(page.getByText("125.00").first()).toBeVisible();
  await expect(page.getByText("Previous first-shortlist benchmark", { exact: true })).toBeVisible();
  await expect(page.getByText(/This does not mean the candidate has cleared the 2027 cutoff/)).toBeVisible();
  await expect(page.getByText("Not yet available")).toBeVisible();
  await expect(page.getByText(/No admission probability is shown/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Final score simulator" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Programme preference" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Application readiness" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Assumptions & sources" })).toBeVisible();
  await expect(page.getByRole("link", { name: "IIMB UG Admission Procedure 2027–31" })).toBeVisible();
  await expect(page.getByText(/Historical benchmarks and planning estimates do not guarantee/)).toBeVisible();
});

test("failed eligibility and zero sectional performance remain explicit", async ({ page }) => {
  await page.goto("/iimb-ug");
  await page.getByLabel("Class X overall %").fill("59.99");
  await page.getByLabel("VARC correct").fill("0");
  await page.getByLabel("VARC wrong").fill("0");
  await page.getByRole("button", { name: "Analyse my profile" }).click();
  await expect(page.getByText("INELIGIBLE", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("SECTION GATE FAILED", { exact: true })).toBeVisible();
  await expect(page.getByText(/formal 2027–31 procedure requires at least 60%/)).toBeVisible();
});

test("invalid attempt totals return field-level validation", async ({ page }) => {
  await page.goto("/iimb-ug");
  await page.getByLabel("LR correct").fill("15");
  await page.getByLabel("LR wrong").fill("1");
  await page.getByRole("button", { name: "Analyse my profile" }).click();
  const validationAlert = page.locator(".ug-form-error");
  await expect(validationAlert).toContainText("Validation failed");
  await expect(validationAlert).toContainText("LR correct + wrong + unattempted must equal 15");
});

test("PI presets update the final scenario instantly", async ({ page }) => {
  await page.goto("/iimb-ug");
  await page.getByRole("button", { name: "Analyse my profile" }).click();
  const slider = page.getByLabel("PI performance scenario");
  await expect(slider).toHaveValue("70");
  await page.getByRole("button", { name: "90%" }).click();
  await expect(slider).toHaveValue("90");
  await expect(page.getByText("90% · 36.00 / 40")).toBeVisible();
});

for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
  test(`UG workbench has no document overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.goto("/iimb-ug");
    await expect(page.getByRole("button", { name: "Analyse my profile" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
