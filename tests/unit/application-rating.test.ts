import { describe, expect, it } from "vitest";
import {
  calculateApplicationRating,
  calculateBachelorRating,
  calculateClass10Rating,
  calculateClass12Rating,
  calculateProfessionalPercentage,
  calculateWorkExRating,
  IIMA_CAT_2025_POLICY,
  SAMPLE_CANDIDATE,
} from "@/lib/iima";

describe("Class 10 rating", () => {
  it.each([
    [55, 1],
    [55.01, 2],
    [60, 2],
    [60.01, 3],
    [70, 3],
    [70.01, 5],
    [80, 5],
    [80.01, 8],
    [90, 8],
    [90.01, 10],
  ])("rates %s as %s", (percent, score) => {
    expect(calculateClass10Rating(percent, IIMA_CAT_2025_POLICY)).toBe(score);
  });
});

describe("Class 12 stream ratings", () => {
  it("uses different boundaries by stream", () => {
    expect(calculateClass12Rating(55, "SCIENCE", IIMA_CAT_2025_POLICY)).toBe(1);
    expect(calculateClass12Rating(55, "COMMERCE", IIMA_CAT_2025_POLICY)).toBe(2);
    expect(calculateClass12Rating(55, "ARTS_HUMANITIES", IIMA_CAT_2025_POLICY)).toBe(3);
    expect(calculateClass12Rating(85.01, "ARTS_HUMANITIES", IIMA_CAT_2025_POLICY)).toBe(10);
  });
});

describe("AC-specific bachelor ratings", () => {
  it.each([
    ["AC_1_PART_I", 70, 8],
    ["AC_1_PART_II", 70.01, 10],
    ["AC_2", 63, 8],
    ["AC_2", 63.01, 10],
    ["AC_3", 80, 8],
    ["AC_3", 80.01, 10],
    ["AC_4", 85, 8],
    ["AC_4", 85.01, 10],
    ["AC_5", 75, 8],
    ["AC_5", 75.01, 10],
    ["AC_6", 60, 1],
  ] as const)("rates %s at %s as %s", (category, percent, score) => {
    expect(calculateBachelorRating(percent, category, IIMA_CAT_2025_POLICY)).toBe(score);
  });

  it("calculates CA-family marks from Intermediate and Final averages", () => {
    expect(
      calculateProfessionalPercentage({
        ...SAMPLE_CANDIDATE,
        academicCategory: "AC_2",
        professionalQualification: "CA",
        professionalInterPercent: 62,
        professionalFinalPercent: 66,
      }),
    ).toBe(64);
  });
});

describe("work experience", () => {
  it.each([
    [0, 0],
    [11, 0],
    [12, 0.2],
    [24, 2.6],
    [36, 5],
    [37, 5],
    [48, 5],
  ])("rates %s months as %s", (months, score) => {
    expect(calculateWorkExRating(months, IIMA_CAT_2025_POLICY)).toBeCloseTo(score);
  });
});

describe("application rating", () => {
  it("returns a component breakdown and never exceeds 38", () => {
    const result = calculateApplicationRating(
      { ...SAMPLE_CANDIDATE, gender: "FEMALE", workExperienceMonths: 36 },
      IIMA_CAT_2025_POLICY,
    );
    expect(result).toMatchObject({
      class10: 10,
      class12: 8,
      bachelor: 10,
      workExperience: 5,
      gender: 3,
      total: 36,
    });
    expect(result.total).toBeLessThanOrEqual(38);
  });
});
