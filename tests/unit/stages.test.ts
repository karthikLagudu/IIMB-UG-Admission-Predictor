import { describe, expect, it } from "vitest";
import {
  calculateApplicationRating,
  evaluateCatEligibility,
  evaluateC2,
  evaluateStage1,
  evaluateStage2,
  IIMA_CAT_2025_POLICY,
  SAMPLE_CANDIDATE,
} from "@/lib/iima";

describe("Stage 1", () => {
  it("passes at the exact observed General AC-4 CS boundary", () => {
    const candidate = { ...SAMPLE_CANDIDATE, bachelorPercent: 84.9 };
    const cat = evaluateCatEligibility(candidate, IIMA_CAT_2025_POLICY);
    const ar = calculateApplicationRating(candidate, IIMA_CAT_2025_POLICY);
    const result = evaluateStage1({
      candidate,
      applicationRating: ar,
      catEligibility: cat,
      compositeScore: 0.6112,
      policy: IIMA_CAT_2025_POLICY,
    });
    expect(result.route).toBe("ACRC");
    expect(result.c3.passed).toBe(true);
    expect(result.predictedShortlist).toBe(true);
  });

  it("fails when C3 is below the observed boundary", () => {
    const candidate = { ...SAMPLE_CANDIDATE, bachelorPercent: 84.89 };
    const cat = evaluateCatEligibility(candidate, IIMA_CAT_2025_POLICY);
    const ar = calculateApplicationRating(candidate, IIMA_CAT_2025_POLICY);
    const result = evaluateStage1({
      candidate,
      applicationRating: ar,
      catEligibility: cat,
      compositeScore: 0.9,
      policy: IIMA_CAT_2025_POLICY,
    });
    expect(result.eligible).toBe(false);
    expect(result.predictedShortlist).toBe(false);
  });

  it("supports the small AC top-5% / top-100 rank route", () => {
    const candidate = {
      ...SAMPLE_CANDIDATE,
      academicCategory: "AC_2" as const,
      bachelorPercent: 65,
      class10Percent: 80,
      class12Percent: 80,
      class12Stream: "COMMERCE" as const,
    };
    const cat = evaluateCatEligibility(candidate, IIMA_CAT_2025_POLICY);
    const ar = calculateApplicationRating(candidate, IIMA_CAT_2025_POLICY);
    const result = evaluateStage1({
      candidate,
      applicationRating: ar,
      catEligibility: cat,
      compositeScore: 0.7,
      policy: IIMA_CAT_2025_POLICY,
      poolContext: { relevantGroupApplicantCount: 1000, estimatedRank: 50 },
    });
    expect(result.route).toBe("SMALL_AC");
    expect(result.selectionCapacity).toBe(50);
    expect(result.rankPass).toBe(true);
    expect(result.predictedShortlist).toBe(true);
  });
});

describe("Stage 2", () => {
  it.each([
    ["GENERAL", false, 0.605604],
    ["EWS", false, 0.529701],
    ["NC_OBC", false, 0.511349],
    ["SC", false, 0.453585],
    ["ST", false, 0.382786],
    ["GENERAL", true, 0.467209],
    ["EWS", true, 0.36525],
    ["NC_OBC", true, 0.31896],
    ["SC", true, 0.275773],
    ["ST", true, 0.588713],
  ] as const)("passes %s PwD=%s at exact threshold", (category, pwd, threshold) => {
    const candidate = { ...SAMPLE_CANDIDATE, category, pwd };
    const result = evaluateStage2({
      candidate,
      catEligibility: evaluateCatEligibility(candidate, IIMA_CAT_2025_POLICY),
      compositeScore: threshold,
      policy: IIMA_CAT_2025_POLICY,
      c2: evaluateC2(candidate, IIMA_CAT_2025_POLICY),
    });
    expect(result.predictedShortlist).toBe(true);
  });

  it("keeps 0.6056039 below the General cutoff", () => {
    const result = evaluateStage2({
      candidate: SAMPLE_CANDIDATE,
      catEligibility: evaluateCatEligibility(SAMPLE_CANDIDATE, IIMA_CAT_2025_POLICY),
      compositeScore: 0.6056039,
      policy: IIMA_CAT_2025_POLICY,
    });
    expect(result.predictedShortlist).toBe(false);
  });
});
