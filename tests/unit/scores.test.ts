import { describe, expect, it } from "vitest";
import {
  calculateCompositeScore,
  calculateCalibratedSeatProbability,
  calculateFinalCompositeScore,
  calculateSeatProbability,
  IIMA_CAT_2025_POLICY,
  logisticProbability,
  predictionBand,
  requiredCatScaledScore,
  requiredNormalizedPi,
} from "@/lib/iima";
import { formatScoreOutOf100, normalizeScoreOutOf100 } from "@/lib/utils";

describe("100-point score display", () => {
  it("normalizes scores from different institute scales", () => {
    expect(normalizeScoreOutOf100(0.813982, 1)).toBeCloseTo(81.3982, 6);
    expect(normalizeScoreOutOf100(70.85, 85)).toBeCloseTo(83.352941, 6);
    expect(formatScoreOutOf100(73.54, 100)).toBe("73.54 / 100");
  });
});

describe("shortlist composite score", () => {
  it("uses the CAT-2025 38 and 204 denominators", () => {
    const score = calculateCompositeScore(30, 150, IIMA_CAT_2025_POLICY);
    expect(score).toBeCloseTo(0.7542569659, 9);
  });

  it("solves the required CAT score", () => {
    const result = requiredCatScaledScore(30, 0.605604, 100, IIMA_CAT_2025_POLICY);
    expect(result.required).toBeCloseTo(103.345838, 6);
    expect(result.gap).toBeCloseTo(-3.345838, 6);
  });

  it("clamps the displayed requirement but preserves impossible raw requirements", () => {
    const result = requiredCatScaledScore(0, 1, 150, IIMA_CAT_2025_POLICY);
    expect(result.required).toBe(204);
    expect(result.rawRequired).toBeGreaterThan(204);
    expect(result.achievable).toBe(false);
  });
});

describe("final score and probability", () => {
  it("calculates the official FCS weights", () => {
    const fcs = calculateFinalCompositeScore(
      { normalizedPi: 0.8, normalizedAwt: 0.7, normalizedCat: 0.75, normalizedAr: 0.8 },
      IIMA_CAT_2025_POLICY,
    );
    expect(fcs).toBeCloseTo(0.7775, 10);
  });

  it("solves the PI score required for a target", () => {
    const pi = requiredNormalizedPi({
      target: 0.672374,
      normalizedAwt: 0.75,
      normalizedCat: 150 / 204,
      normalizedAr: 30 / 38,
      policy: IIMA_CAT_2025_POLICY,
    });
    expect(pi).toBeCloseTo(0.590258, 5);
  });

  it("sets probability to 50% at the planning target", () => {
    expect(logisticProbability(0.67, 0.67, 20)).toBe(0.5);
  });

  it("multiplies the model by hard eligibility and call gates", () => {
    expect(
      calculateSeatProbability({
        eligibilityGate: true,
        callGate: false,
        finalCompositeScore: 1,
        planningTarget: 0.6,
        logisticSlope: 20,
      }),
    ).toBe(0);
  });

  it("calibrates probability across three completed cycles", () => {
    const calibrated = calculateCalibratedSeatProbability({
      eligibilityGate: true,
      callGate: true,
      finalCompositeScore: 0.75,
      benchmarks: IIMA_CAT_2025_POLICY.historicalFinalBenchmarkSeries.GENERAL,
      safetyMargin: IIMA_CAT_2025_POLICY.model.safetyMargin,
      logisticSlope: IIMA_CAT_2025_POLICY.model.logisticSlope,
      recencyWeights: IIMA_CAT_2025_POLICY.model.benchmarkRecencyWeights,
    });
    const expected = [0.5, 0.3, 0.2].reduce((sum, weight, index) => {
      const benchmark = IIMA_CAT_2025_POLICY.historicalFinalBenchmarkSeries.GENERAL[index];
      return sum + weight * logisticProbability(0.75, benchmark.benchmark + 0.02, 20);
    }, 0);
    expect(calibrated.probability).toBeCloseTo(expected, 12);
    expect(calibrated.calibration.cycles).toHaveLength(3);
    expect(calibrated.calibration.cycles.reduce((sum, cycle) => sum + cycle.weight, 0)).toBeCloseTo(1, 12);
    expect(calibrated.probability).toBeGreaterThanOrEqual(calibrated.calibration.probabilityLow);
    expect(calibrated.probability).toBeLessThanOrEqual(calibrated.calibration.probabilityHigh);
  });

  it("keeps calibrated probability monotonic and hard-gated", () => {
    const args = {
      eligibilityGate: true,
      callGate: true,
      benchmarks: IIMA_CAT_2025_POLICY.historicalFinalBenchmarkSeries.SC,
      safetyMargin: IIMA_CAT_2025_POLICY.model.safetyMargin,
      logisticSlope: IIMA_CAT_2025_POLICY.model.logisticSlope,
      recencyWeights: IIMA_CAT_2025_POLICY.model.benchmarkRecencyWeights,
    };
    const lower = calculateCalibratedSeatProbability({ ...args, finalCompositeScore: 0.45 });
    const higher = calculateCalibratedSeatProbability({ ...args, finalCompositeScore: 0.55 });
    const gated = calculateCalibratedSeatProbability({
      ...args,
      callGate: false,
      finalCompositeScore: 1,
    });
    expect(higher.probability).toBeGreaterThan(lower.probability);
    expect(gated.probability).toBe(0);
    expect(gated.calibration.probabilityHigh).toBe(0);
  });

  it.each([
    [0.199999, "VERY_LOW"],
    [0.2, "LOW"],
    [0.4, "BORDERLINE"],
    [0.6, "GOOD"],
    [0.75, "STRONG"],
    [0.9, "VERY_STRONG"],
  ] as const)("maps %s to %s", (probability, band) => {
    expect(predictionBand(probability, IIMA_CAT_2025_POLICY)).toBe(band);
  });
});
