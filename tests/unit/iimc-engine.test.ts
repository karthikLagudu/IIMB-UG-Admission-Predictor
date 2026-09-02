import { describe, expect, it } from "vitest";
import { SAMPLE_CANDIDATE } from "@/lib/iima";
import {
  IIMC_TEST_CYCLE_DATA,
  calculateFinalScore,
  calculateIimcWorkExperience,
  calculatePreInterview,
  evaluateEligibility,
  evaluateInterviewCall,
  iimcClass10Points,
  iimcClass12Points,
  predictIimcAdmission,
} from "@/lib/institutes/iimc/cat2025_2026_28";

describe("IIMC CAT 2025 / MBA 2026-28 engine", () => {
  it("passes the OPEN CAT floors at their exact boundaries", () => {
    const result = evaluateEligibility({
      ...SAMPLE_CANDIDATE,
      catVarcPercentile: 80,
      catDilrPercentile: 80,
      catQaPercentile: 75,
      catOverallPercentile: 85,
    });
    expect(result.passed).toBe(true);
  });

  it("fails when the OPEN QA floor is missed", () => {
    const result = evaluateEligibility({ ...SAMPLE_CANDIDATE, catQaPercentile: 74.99 });
    expect(result.passed).toBe(false);
    expect(result.failedRules.join(" ")).toContain("QA");
  });

  it.each([
    [59.99, 0],
    [60, 2],
    [65, 4],
    [70, 6],
    [75, 8],
    [80, 10],
  ])("maps Class 10 %.2f to the official slab", (percentage, expected) => {
    expect(iimcClass10Points(percentage)).toBe(expected);
  });

  it.each([
    [59.99, 0],
    [60, 3],
    [65, 6],
    [70, 9],
    [75, 12],
    [80, 15],
  ])("maps Class 12 %.2f to the official slab", (percentage, expected) => {
    expect(iimcClass12Points(percentage)).toBe(expected);
  });

  it.each([
    [6, 0],
    [18, 6],
    [24, 8],
    [30, 8],
    [36, 8],
    [42, 5],
    [48, 2],
    [60, 2],
  ])("calculates work-experience points at %i months", (months, expected) => {
    expect(calculateIimcWorkExperience(months)).toBe(expected);
  });

  it("calculates the deterministic 85-point shortlist score", () => {
    const result = calculatePreInterview(SAMPLE_CANDIDATE);
    expect(result.status).toBe("CALCULATED");
    expect(result.score).toBeCloseTo((150 / 204) * 56 + 10 + 15, 10);
  });

  it("returns ELIGIBLE_FOR_RANKING when no Stage-II cutoff is configured", () => {
    const preInterview = calculatePreInterview(SAMPLE_CANDIDATE);
    const result = evaluateInterviewCall(SAMPLE_CANDIDATE, {}, preInterview);
    expect(result.status).toBe("ELIGIBLE_FOR_RANKING");
    expect(result.benchmarkValue).toBeNull();
  });

  it("calculates the final composite from CAT, PI, WAT, diversity and work experience", () => {
    const result = calculateFinalScore(SAMPLE_CANDIDATE);
    expect(result.status).toBe("CALCULATED");
    expect(result.score).toBeCloseTo((150 / 204) * 30 + 0.75 * 48 + 0.75 * 8 + 8, 10);
  });

  it("does not show seat probability without a defensible benchmark and call gate", () => {
    const result = predictIimcAdmission(SAMPLE_CANDIDATE);
    expect(result.prediction.probability).toBeNull();
    expect(result.call.status).toBe("ELIGIBLE_FOR_RANKING");
  });

  it("shows a clearly labelled model seat chance when mock-mode benchmarks are supplied", () => {
    const result = predictIimcAdmission(SAMPLE_CANDIDATE, IIMC_TEST_CYCLE_DATA);

    expect(result.call.status).toBe("PREDICTED_CALL");
    expect(result.call.benchmarkType).toBe("MODEL");
    expect(result.call.benchmarkValue).toBe(62);
    expect(result.prediction.benchmarkType).toBe("MODEL");
    expect(result.prediction.benchmarkValue).toBe(68);
    expect(result.prediction.probability).not.toBeNull();
    expect(result.prediction.probability).toBeGreaterThan(0);
    expect(result.prediction.probability).toBeLessThan(1);
    expect(result.prediction.disclaimer).toMatch(/not an official admission probability/i);
  });
});
