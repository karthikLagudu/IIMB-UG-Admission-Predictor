import { describe, expect, it } from "vitest";
import {
  calculateAccuracy,
  calculateRequiredAccuracy,
  calculateScoreFromAccuracy,
  calculateSectionRawScore,
  evaluatePositiveSectionGate,
} from "@/lib/iimb-ug/2027_31";

describe("IIMB UG test scoring", () => {
  it("calculates the worked VARC example exactly", () => {
    const result = calculateSectionRawScore(12, 2);
    expect(result.rawCanonical).toBe(34);
    expect(result.rawUnit).toBeCloseTo(12 - 2 / 3, 12);
    expect(result.rawCanonical).toBeCloseTo(result.rawUnit * 3, 12);
  });

  it.each([
    [-1, false],
    [0, false],
    [1, true],
  ] as const)("treats canonical score %s as positive=%s", (score, expected) => {
    const section = {
      key: "VARC" as const, label: "VARC", correct: null, wrong: null, unattempted: null,
      attempted: null, accuracyPercent: null, rawUnit: score / 3, rawCanonical: score,
      maxUnit: 15, maxCanonical: 45, positive: score > 0, status: "CALCULATED" as const,
      sourceType: "USER_INPUT" as const,
    };
    expect(evaluatePositiveSectionGate([section])).toBe(expected);
  });

  it("does not divide accuracy by zero", () => {
    expect(calculateAccuracy(0, 0)).toBeNull();
    expect(calculateAccuracy(8, 2)).toBe(80);
  });

  it("implements score and required-accuracy planning formulas", () => {
    expect(calculateScoreFromAccuracy(20, 0.75)).toBe(40);
    expect(calculateRequiredAccuracy(40, 20)).toBe(0.75);
  });
});

