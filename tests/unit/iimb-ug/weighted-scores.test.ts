import { describe, expect, it } from "vitest";
import {
  calculateRequiredPi,
  iimbStyleStandardize,
  IIMB_UG_2027_POLICY,
  predictIimbUgAdmission,
  SAMPLE_IIMB_UG_CANDIDATE,
} from "@/lib/iimb-ug/2027_31";

describe("IIMB-style standardisation analogue", () => {
  it("maps mean and ±3 SD to half, maximum and zero", () => {
    expect(iimbStyleStandardize(80, 80, 10, 15)).toBe(7.5);
    expect(iimbStyleStandardize(110, 80, 10, 15)).toBe(15);
    expect(iimbStyleStandardize(120, 80, 10, 15)).toBe(15);
    expect(iimbStyleStandardize(50, 80, 10, 15)).toBe(0);
    expect(iimbStyleStandardize(40, 80, 10, 15)).toBe(0);
  });

  it("returns DATA_REQUIRED-compatible null for non-positive SD", () => {
    expect(iimbStyleStandardize(80, 80, 0, 15)).toBeNull();
    expect(iimbStyleStandardize(80, 80, -1, 15)).toBeNull();
  });
});

describe("weight totals and worked planning example", () => {
  it("keeps policy totals internally consistent", () => {
    const pre = IIMB_UG_2027_POLICY.prePi.weights;
    const post = IIMB_UG_2027_POLICY.postPi.weights;
    expect(pre.test + pre.class10Overall + pre.class10Math + pre.gender).toBe(100);
    expect(pre.testSections.VARC + pre.testSections.LR + pre.testSections.QADI).toBe(70);
    expect(post.class10Overall + post.class10Math + post.test + post.pi).toBe(100);
  });

  it("reproduces the documented raw and Pre-PI planning example", () => {
    const result = predictIimbUgAdmission(SAMPLE_IIMB_UG_CANDIDATE);
    expect(result.exam.varc.rawCanonical).toBe(34);
    expect(result.exam.lr.rawCanonical).toBe(30);
    expect(result.exam.qadi.rawCanonical).toBe(61);
    expect(result.exam.totalCanonical).toBe(125);
    expect(result.exam.totalUnit).toBeCloseTo(41.6666667, 6);
    expect(result.prePi.test70).toBeCloseTo(48.6666667, 6);
    expect(result.prePi.minimum).toBeCloseTo(72.2166667, 6);
    expect(result.prePi.maximum).toBeCloseTo(77.2166667, 6);
    expect(result.prePi.prePi).toBeNull();
  });
});

describe("required PI solver", () => {
  it.each([
    [50, 60, "ALREADY_ABOVE_TARGET"],
    [60, 60, "ALREADY_ABOVE_TARGET"],
    [80, 60, "REACHABLE"],
    [100, 60, "REACHABLE"],
    [101, 60, "UNREACHABLE"],
  ] as const)("solves target %s from fixed %s", (target, fixed, status) => {
    expect(calculateRequiredPi(target, fixed, 40).status).toBe(status);
  });

  it("returns exactly 50% and 100% at their boundaries", () => {
    expect(calculateRequiredPi(80, 60, 40).requiredPercent).toBe(50);
    expect(calculateRequiredPi(100, 60, 40).requiredPercent).toBe(100);
  });
});

