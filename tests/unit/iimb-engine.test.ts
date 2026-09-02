import { describe, expect, it } from "vitest";
import { SAMPLE_CANDIDATE } from "@/lib/iima";
import {
  calculateIimbPostPiWorkExperience,
  calculateIimbPreWorkExperience,
  calculatePreInterview,
  evaluateEligibility,
  evaluateInterviewCall,
  standardizeIimbScore,
  IIMB_TEST_RUNTIME_DATA,
  predictIimbAdmission,
  type IimbCycleRuntimeData,
} from "@/lib/institutes/iimb/cat2025_2026_28";

describe("IIMB CAT 2025 / PGP 2026-28 engine", () => {
  it("passes the General CAT floors at their exact boundaries", () => {
    const result = evaluateEligibility({
      ...SAMPLE_CANDIDATE,
      catVarcPercentile: 80,
      catDilrPercentile: 75,
      catQaPercentile: 75,
      catOverallPercentile: 85,
    });
    expect(result.passed).toBe(true);
  });

  it("fails when one General sectional floor is missed", () => {
    const result = evaluateEligibility({ ...SAMPLE_CANDIDATE, catDilrPercentile: 74.99 });
    expect(result.passed).toBe(false);
    expect(result.failedRules.join(" ")).toContain("DILR");
  });

  it("uses the official CAT 2025 SC VARC floor of 65", () => {
    const result = evaluateEligibility({
      ...SAMPLE_CANDIDATE,
      category: "SC",
      catOverallPercentile: 70,
      catVarcPercentile: 64.99,
      catDilrPercentile: 60,
      catQaPercentile: 60,
    });
    expect(result.varcPass).toBe(false);
    expect(result.cutoff.varc).toBe(65);
  });

  it.each([
    [0, 0],
    [18, 5],
    [36, 10],
    [60, 10],
  ])("calculates the pre-PI work-experience score at %i months", (months, expected) => {
    expect(calculateIimbPreWorkExperience(months)).toBe(expected);
  });

  it("applies the post-PI quality multiplier after scaling work experience to five", () => {
    expect(calculateIimbPostPiWorkExperience(10, 1.5)).toBe(7.5);
  });

  it("uses the bounded official standardization function", () => {
    expect(standardizeIimbScore(50, { mean: 50, sd: 10 }, 10)).toBe(5);
    expect(standardizeIimbScore(500, { mean: 50, sd: 10 }, 10)).toBe(10);
    expect(standardizeIimbScore(-500, { mean: 50, sd: 10 }, 10)).toBe(0);
    expect(standardizeIimbScore(50, { mean: 50, sd: 0 }, 10)).toBeNull();
  });

  it("returns DATA_REQUIRED when board and pool normalization data is missing", () => {
    const result = calculatePreInterview(SAMPLE_CANDIDATE);
    expect(result.status).toBe("DATA_REQUIRED");
    expect(result.score).toBeNull();
    expect(result.missingRuntimeData).toContain("board_percentile_90:CBSE:10");
    expect(result.missingRuntimeData).toContain("bachelor_stats:ENGINEERING_TECHNOLOGY");
  });

  it("calculates the official pre-PI total when every required runtime statistic is supplied", () => {
    const runtime: IimbCycleRuntimeData = {
      boardPercentile90: { "10": { CBSE: 90 }, "12": { CBSE: 90 } },
      boardAdjustedStats: { "10": { mean: 1, sd: 0.1 }, "12": { mean: 1, sd: 0.1 } },
      bachelorStats: { ENGINEERING_TECHNOLOGY: { mean: 80, sd: 10 } },
      catSectionStats: {
        VARC: { mean: 40, sd: 10 },
        DILR: { mean: 40, sd: 10 },
        QA: { mean: 40, sd: 10 },
      },
      genderDiversityEligible: ["FEMALE", "TRANSGENDER"],
    };
    const result = calculatePreInterview(SAMPLE_CANDIDATE, runtime);
    expect(result.status).toBe("CALCULATED");
    expect(result.score).not.toBeNull();
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("does not guess top-10 qualification, but accepts an external verified flag", () => {
    const result = evaluateInterviewCall({ ...SAMPLE_CANDIDATE, iimbAutomaticPiQualification: "QUALIFIED" });
    expect(result.status).toBe("PREDICTED_CALL");
    expect(result.reason).toContain("external/admin");
  });

  it("runs the full Bangalore flow with the explicitly labelled test model", () => {
    const result = predictIimbAdmission(SAMPLE_CANDIDATE, IIMB_TEST_RUNTIME_DATA);
    expect(result.preInterview.status).toBe("CALCULATED");
    expect(result.preInterview.score).not.toBeNull();
    expect(result.preInterview.components.some((component) => component.sourceType === "MODEL_ASSUMPTION")).toBe(true);
    expect(result.call.status).toBe("PREDICTED_CALL");
    expect(result.call.benchmarkType).toBe("MODEL");
    expect(result.prediction.probability).not.toBeNull();
    expect(result.gaps.join(" ")).toContain("Testing estimate only");
  });
});
