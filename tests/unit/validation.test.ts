import { describe, expect, it } from "vitest";
import { IIMA_CAT_2025_POLICY, SAMPLE_CANDIDATE } from "@/lib/iima";
import { candidateInputSchema, policyConfigSchema } from "@/lib/validation/iima";

describe("input validation", () => {
  it.each([
    { class10Percent: -0.01 },
    { class12Percent: 100.01 },
    { catOverallPercentile: 101 },
    { catOverallScaledScore: 204.01 },
    { workExperienceMonths: -1 },
  ])("rejects impossible input %o", (override) => {
    expect(candidateInputSchema.safeParse({ ...SAMPLE_CANDIDATE, ...override }).success).toBe(false);
  });

  it("accepts the complete sample", () => {
    expect(candidateInputSchema.safeParse(SAMPLE_CANDIDATE).success).toBe(true);
  });

  it("rejects an overall CAT score that does not equal the three sectional scores", () => {
    expect(candidateInputSchema.safeParse({ ...SAMPLE_CANDIDATE, catOverallScaledScore: 149 }).success).toBe(false);
  });

  it("rejects a manually supplied overall percentile that differs from the score estimate", () => {
    expect(candidateInputSchema.safeParse({ ...SAMPLE_CANDIDATE, catOverallPercentile: 90 }).success).toBe(false);
  });

  it("accepts the calibrated three-cycle policy", () => {
    expect(policyConfigSchema.safeParse(IIMA_CAT_2025_POLICY).success).toBe(true);
  });

  it("rejects a calibration with no positive benchmark weight", () => {
    expect(
      policyConfigSchema.safeParse({
        ...IIMA_CAT_2025_POLICY,
        model: { ...IIMA_CAT_2025_POLICY.model, benchmarkRecencyWeights: [0, 0, 0] },
      }).success,
    ).toBe(false);
  });
});
