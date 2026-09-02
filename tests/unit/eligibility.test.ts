import { describe, expect, it } from "vitest";
import { IIMA_CAT_2025_POLICY, SAMPLE_CANDIDATE } from "@/lib/iima";
import {
  calculateAgeOnDate,
  evaluateBasicEligibility,
  evaluateCatEligibility,
} from "@/lib/iima/eligibility";

describe("basic eligibility", () => {
  it("uses 50% for standard categories and 45% for SC/ST/PwD", () => {
    expect(
      evaluateBasicEligibility(
        { ...SAMPLE_CANDIDATE, category: "GENERAL", bachelorPercent: 49.99 },
        IIMA_CAT_2025_POLICY,
      ).passed,
    ).toBe(false);
    expect(
      evaluateBasicEligibility(
        { ...SAMPLE_CANDIDATE, category: "SC", bachelorPercent: 45 },
        IIMA_CAT_2025_POLICY,
      ).passed,
    ).toBe(true);
    expect(
      evaluateBasicEligibility(
        { ...SAMPLE_CANDIDATE, category: "GENERAL", pwd: true, bachelorPercent: 45 },
        IIMA_CAT_2025_POLICY,
      ).passed,
    ).toBe(true);
  });

  it("checks age on the official cutoff date", () => {
    expect(calculateAgeOnDate("2007-06-30", "2026-06-30")).toBe(19);
    expect(calculateAgeOnDate("2007-07-01", "2026-06-30")).toBe(18);
  });

  it("enforces degree duration when it is provided", () => {
    const result = evaluateBasicEligibility(
      { ...SAMPLE_CANDIDATE, degreeDurationYears: 2 },
      IIMA_CAT_2025_POLICY,
    );
    expect(result.degreeDurationPass).toBe(false);
    expect(result.passed).toBe(false);
  });
});

describe("CAT eligibility", () => {
  it("honours exact General boundaries without early rounding", () => {
    const failedOverall = evaluateCatEligibility(
      { ...SAMPLE_CANDIDATE, catOverallPercentile: 94.99 },
      IIMA_CAT_2025_POLICY,
    );
    expect(failedOverall.overallPass).toBe(false);
    expect(
      evaluateCatEligibility(
        {
          ...SAMPLE_CANDIDATE,
          catOverallPercentile: 95,
          catVarcPercentile: 85,
          catDilrPercentile: 85,
          catQaPercentile: 85,
        },
        IIMA_CAT_2025_POLICY,
      ).catEligible,
    ).toBe(true);
    expect(
      evaluateCatEligibility(
        { ...SAMPLE_CANDIDATE, catVarcPercentile: 84.99 },
        IIMA_CAT_2025_POLICY,
      ).varcPass,
    ).toBe(false);
  });

  it.each([
    ["GENERAL", false, 95, 85],
    ["EWS", false, 95, 85],
    ["NC_OBC", false, 90, 80],
    ["SC", false, 85, 75],
    ["ST", false, 75, 65],
    ["GENERAL", true, 85, 75],
    ["EWS", true, 85, 75],
    ["NC_OBC", true, 80, 70],
    ["SC", true, 75, 65],
    ["ST", true, 65, 55],
  ] as const)("passes %s PwD=%s at the exact floor", (category, pwd, overall, sectional) => {
    const result = evaluateCatEligibility(
      {
        ...SAMPLE_CANDIDATE,
        category,
        pwd,
        catOverallPercentile: overall,
        catVarcPercentile: sectional,
        catDilrPercentile: sectional,
        catQaPercentile: sectional,
      },
      IIMA_CAT_2025_POLICY,
    );
    expect(result.catEligible).toBe(true);
  });

  it("requires positive raw scores in every section", () => {
    const result = evaluateCatEligibility(
      { ...SAMPLE_CANDIDATE, positiveRawDilr: false },
      IIMA_CAT_2025_POLICY,
    );
    expect(result.positiveRawScoresPass).toBe(false);
    expect(result.catEligible).toBe(false);
  });

  it("maps a General transgender candidate to NC-OBC CAT minima", () => {
    const result = evaluateCatEligibility(
      {
        ...SAMPLE_CANDIDATE,
        gender: "TRANSGENDER",
        catOverallPercentile: 90,
        catVarcPercentile: 80,
        catDilrPercentile: 80,
        catQaPercentile: 80,
      },
      IIMA_CAT_2025_POLICY,
    );
    expect(result.transgenderMappingApplied).toBe(true);
    expect(result.cutoffKey).toBe("NC_OBC");
    expect(result.catEligible).toBe(true);
  });
});
