import { describe, expect, it } from "vitest";
import {
  calculateAcademicEligibility,
  calculateAgeEligibility,
  IIMB_UG_2027_POLICY,
  SAMPLE_IIMB_UG_CANDIDATE,
} from "@/lib/iimb-ug/2027_31";

describe("IIMB UG age eligibility", () => {
  it.each([
    ["2006-08-01", "FAIL"],
    ["2006-08-02", "PASS"],
    ["2007-08-01", "PASS"],
    ["2007-08-02", "PASS"],
  ] as const)("evaluates %s without birth-year shortcuts", (dob, expected) => {
    expect(calculateAgeEligibility(dob, IIMB_UG_2027_POLICY).status).toBe(expected);
  });
});

describe("IIMB UG academic source conflict", () => {
  it("uses 60% Class X overall plus Mathematics XI/XII as the primary procedure interpretation", () => {
    expect(calculateAcademicEligibility({ ...SAMPLE_IIMB_UG_CANDIDATE, class10OverallPercent: 59.99 }, IIMB_UG_2027_POLICY).primaryEligibility).toBe(false);
    expect(calculateAcademicEligibility({ ...SAMPLE_IIMB_UG_CANDIDATE, class10OverallPercent: 60 }, IIMB_UG_2027_POLICY).primaryEligibility).toBe(true);
    expect(calculateAcademicEligibility({ ...SAMPLE_IIMB_UG_CANDIDATE, studiedMathClass11: false }, IIMB_UG_2027_POLICY).primaryEligibility).toBe(false);
    expect(calculateAcademicEligibility({ ...SAMPLE_IIMB_UG_CANDIDATE, studiedMathClass12: false }, IIMB_UG_2027_POLICY).primaryEligibility).toBe(false);
  });

  it("preserves the FAQ Class X Mathematics interpretation independently", () => {
    const result = calculateAcademicEligibility({
      ...SAMPLE_IIMB_UG_CANDIDATE,
      class10OverallPercent: 80,
      class10MathPercent: 59.99,
    }, IIMB_UG_2027_POLICY);
    expect(result.primaryEligibility).toBe(true);
    expect(result.alternateEligibility).toBe(false);
    expect(result.sourceConflict).toBe(true);
  });

  it("returns an unknown alternate result when Class X Mathematics marks are absent", () => {
    const result = calculateAcademicEligibility({ ...SAMPLE_IIMB_UG_CANDIDATE, class10MathPercent: undefined }, IIMB_UG_2027_POLICY);
    expect(result.primaryEligibility).toBe(true);
    expect(result.alternateEligibility).toBeNull();
    expect(result.alternateRules[0].status).toBe("DATA_REQUIRED");
  });
});

