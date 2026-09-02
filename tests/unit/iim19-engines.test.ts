import { describe, expect, it } from "vitest";
import type { CandidateInput, Category } from "@/types/iima";
import type { InstituteKey } from "@/types/institutes";
import { SAMPLE_CANDIDATE } from "@/lib/iima";
import { NON_IIMA_INSTITUTE_KEYS, predictAllNonIimaInstitutes, predictInstituteAdmission } from "@/lib/institutes";
import { iimBgAcademicScore, iimBgWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iimbg";
import { iimGuwahatiBachelorRating, iimGuwahatiSchoolRating, iimGuwahatiWorkExperienceRating } from "@/lib/institutes/cat2025_2026_28/iimg";
import { iimJammuWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iimj";
import { iimKashipurGraduationScore, iimKashipurWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iimkashipur";
import { iimLucknowWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iiml";
import { iimMumbaiClass10Rating, iimMumbaiRawProfile } from "@/lib/institutes/cat2025_2026_28/iimm";
import { iimRaipurAcademicScore, iimRaipurWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iimraipur";
import { iimRanchiWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iimranchi";
import { iimSambalpurWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iimsambalpur";
import { iimShillongGraduationRating, iimShillongSchoolRating, iimShillongWorkExperienceRating } from "@/lib/institutes/cat2025_2026_28/iimshillong";
import { iimSirmaurWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iimsirmaur";
import { iimTrichyWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iimtrichy";
import { iimVisakhapatnamWorkExperienceScore } from "@/lib/institutes/cat2025_2026_28/iimv";

type NonIimaKey = Exclude<InstituteKey, "IIMA">;
type Cutoff = { overall: number | null; varc: number | null; dilr: number | null; qa: number | null };

const expectedGeneralCutoffs: Partial<Record<NonIimaKey, Cutoff>> = {
  IIMBG: { overall: 90, varc: 65, dilr: 65, qa: 65 },
  IIMG: { overall: 85, varc: 75, dilr: 75, qa: 75 },
  IIMI: { overall: 90, varc: 80, dilr: 80, qa: 80 },
  IIMJ: { overall: 91, varc: 72, dilr: 72, qa: 72 },
  IIMKASHIPUR: { overall: 96.25, varc: 75, dilr: 75, qa: 75 },
  IIMK: { overall: 85, varc: 75, dilr: 75, qa: 75 },
  IIML: { overall: 90, varc: 85, dilr: 85, qa: 85 },
  IIMM: { overall: 85, varc: 80, dilr: 80, qa: 75 },
  IIMN: { overall: 95, varc: 70, dilr: 70, qa: 70 },
  IIMRAIPUR: { overall: 96.25, varc: 75, dilr: 75, qa: 75 },
  IIMRANCHI: { overall: 96.25, varc: 75, dilr: 75, qa: 75 },
  IIMROHTAK: { overall: 97, varc: null, dilr: null, qa: null },
  IIMSAMBALPUR: { overall: 85, varc: null, dilr: null, qa: null },
  IIMSHILLONG: { overall: null, varc: 75, dilr: 75, qa: 75 },
  IIMSIRMAUR: { overall: 90, varc: 65, dilr: 65, qa: 65 },
  IIMTRICHY: { overall: 95.25, varc: 75, dilr: 75, qa: 75 },
  IIMUDAIPUR: { overall: 94, varc: 75, dilr: 75, qa: 75 },
  IIMV: { overall: 82, varc: 70, dilr: 70, qa: 70 },
};

const categoryTables: Array<{
  institute: NonIimaKey;
  rows: Array<[Category | "PWD", number, number, number?, number?]>;
}> = [
  { institute: "IIMI", rows: [["GENERAL", 90, 80], ["EWS", 90, 80], ["NC_OBC", 80, 70], ["SC", 60, 55], ["ST", 45, 40], ["PWD", 45, 40]] },
  { institute: "IIMKASHIPUR", rows: [["GENERAL", 96.25, 75], ["EWS", 89, 60], ["NC_OBC", 88.5, 60], ["SC", 75, 45], ["ST", 44, 25], ["PWD", 30, 25]] },
  { institute: "IIML", rows: [["GENERAL", 90, 85], ["EWS", 82, 77], ["NC_OBC", 82, 77], ["SC", 65, 55], ["ST", 60, 50], ["PWD", 60, 50]] },
  { institute: "IIMN", rows: [["GENERAL", 95, 70], ["EWS", 85, 55], ["NC_OBC", 85, 55], ["SC", 65, 40], ["ST", 40, 30], ["PWD", 40, 25]] },
  { institute: "IIMRAIPUR", rows: [["GENERAL", 96.25, 75], ["EWS", 89, 60], ["NC_OBC", 88.5, 60], ["SC", 75, 45], ["ST", 44, 25], ["PWD", 30, 25]] },
  { institute: "IIMRANCHI", rows: [["GENERAL", 96.25, 75], ["EWS", 89, 60], ["NC_OBC", 88.5, 60], ["SC", 75, 45], ["ST", 44, 25], ["PWD", 30, 25]] },
  { institute: "IIMTRICHY", rows: [["GENERAL", 95.25, 75], ["EWS", 89, 60], ["NC_OBC", 88.5, 60], ["SC", 75, 45], ["ST", 44, 25], ["PWD", 30, 25]] },
  { institute: "IIMUDAIPUR", rows: [["GENERAL", 94, 75], ["EWS", 81, 55], ["NC_OBC", 81, 52], ["SC", 66, 45], ["ST", 42, 25, 25, 30], ["PWD", 42, 25, 25, 30]] },
  { institute: "IIMV", rows: [["GENERAL", 82, 70], ["EWS", 72, 63], ["NC_OBC", 72, 63], ["SC", 50, 40], ["ST", 40, 30], ["PWD", 40, 30]] },
];

function atBoundary(category: Category | "PWD", overall: number, varc: number, dilr = varc, qa = varc): CandidateInput {
  return {
    ...SAMPLE_CANDIDATE,
    category: category === "PWD" ? "GENERAL" : category,
    pwd: category === "PWD",
    bachelorPercent: 100,
    class10Percent: 100,
    class12Percent: 100,
    catOverallPercentile: overall,
    catVarcPercentile: varc,
    catDilrPercentile: dilr,
    catQaPercentile: qa,
    positiveRawVarc: true,
    positiveRawDilr: true,
    positiveRawQa: true,
  };
}

describe("CAT 2025 / 2026-28 multi-IIM registry", () => {
  it("contains one unique engine result for every non-IIMA institute", () => {
    const results = predictAllNonIimaInstitutes(SAMPLE_CANDIDATE, true);
    expect(results).toHaveLength(20);
    expect(new Set(results.map((result) => result.institute)).size).toBe(20);
    expect(new Set(NON_IIMA_INSTITUTE_KEYS).size).toBe(20);
  });

  it("keeps every institute cycle-versioned and source-linked", () => {
    for (const result of predictAllNonIimaInstitutes(SAMPLE_CANDIDATE, true)) {
      expect(result.examYear).toBe(2025);
      expect(result.admissionBatch).toBe("2026-28");
      expect(result.policyVersion).toContain("2026");
      expect(result.sourceUrl).toMatch(/^https:\/\//);
      expect(result.preInterview.score).not.toBeNull();
    }
  });

  it.each(Object.entries(expectedGeneralCutoffs))("uses the exact General cutoff for %s", (institute, expected) => {
    const result = predictInstituteAdmission(institute as NonIimaKey, SAMPLE_CANDIDATE, false);
    expect(result.eligibility.cutoff).toEqual(expected);
  });

  for (const table of categoryTables) {
    it.each(table.rows)(`${table.institute} passes %s at exact CAT boundaries`, (category, overall, varc, dilr = varc, qa = varc) => {
      const result = predictInstituteAdmission(table.institute, atBoundary(category, overall, varc, dilr, qa), false);
      expect(result.eligibility.passed).toBe(true);
      const below = predictInstituteAdmission(table.institute, atBoundary(category, overall, varc - 0.01, dilr, qa), false);
      expect(below.eligibility.varcPass).toBe(false);
    });
  }

  it("preserves gender-specific Jammu and Sirmaur boundaries", () => {
    const jammu = predictInstituteAdmission("IIMJ", { ...atBoundary("GENERAL", 89, 71), gender: "FEMALE" }, false);
    const sirmaur = predictInstituteAdmission("IIMSIRMAUR", { ...atBoundary("GENERAL", 85, 65), gender: "TRANSGENDER" }, false);
    expect(jammu.eligibility.passed).toBe(true);
    expect(sirmaur.eligibility.passed).toBe(true);
  });

  it("implements IIM Guwahati as a no-PI/no-WAT/no-GD direct-merit process", () => {
    const result = predictInstituteAdmission("IIMG", SAMPLE_CANDIDATE, true);
    expect(result.selectionStages).toEqual({ interview: false, wat: false, groupDiscussion: false, directMerit: true });
    expect(result.call.status).toBe("ELIGIBLE_FOR_RANKING");
    expect(result.final.components.some((item) => /interview|WAT|group discussion/i.test(item.label))).toBe(false);
  });

  it("keeps unavailable current-cycle inputs null outside mock mode", () => {
    const runtimeDependent: NonIimaKey[] = ["IIMBG", "IIMI", "IIMKASHIPUR", "IIMK", "IIML", "IIMM", "IIMN", "IIMRAIPUR", "IIMRANCHI", "IIMROHTAK", "IIMSAMBALPUR", "IIMSHILLONG", "IIMSIRMAUR", "IIMTRICHY", "IIMUDAIPUR", "IIMV"];
    for (const institute of runtimeDependent) {
      const result = predictInstituteAdmission(institute, SAMPLE_CANDIDATE, false);
      expect(result.final.score, institute).toBeNull();
      expect(["DATA_REQUIRED", "NOT_REACHED"], institute).toContain(result.final.status);
    }
  });
});

describe("published academic and work-experience boundaries", () => {
  it("uses IIM Bodh Gaya academic and work-experience boundaries", () => {
    expect(iimBgAcademicScore({ ...SAMPLE_CANDIDATE, class10Percent: 69.99, class12Percent: 69.99, bachelorPercent: 59.99 })).toBe(0);
    expect(iimBgAcademicScore({ ...SAMPLE_CANDIDATE, class10Percent: 70, class12Percent: 70, bachelorPercent: 60 })).toBe(15);
    expect([11, 12, 23, 24, 48, 49].map(iimBgWorkExperienceScore)).toEqual([0, 5, 5, 10, 10, 5]);
  });

  it("uses IIM Guwahati rating and triangular work-experience functions", () => {
    expect([55, 55.01, 60.01, 70.01, 80.01, 90.01].map(iimGuwahatiSchoolRating)).toEqual([1, 2, 3, 5, 8, 10]);
    expect([60, 60.01, 65.01, 70.01, 75.01, 85.01].map(iimGuwahatiBachelorRating)).toEqual([1, 2, 3, 5, 8, 10]);
    expect(iimGuwahatiWorkExperienceRating(12)).toBe(0);
    expect(iimGuwahatiWorkExperienceRating(36)).toBe(5);
    expect(iimGuwahatiWorkExperienceRating(60)).toBe(0);
  });

  it("uses the published Jammu and Kashipur month slabs", () => {
    expect([12, 13, 19, 25, 37, 49, 61].map(iimJammuWorkExperienceScore)).toEqual([0, 4, 7, 10, 7, 4, 0]);
    expect([5, 6, 12, 13, 18, 19, 30, 31, 36, 37].map(iimKashipurWorkExperienceScore)).toEqual([0, 3, 3, 7, 7, 15, 15, 5, 5, 0]);
    expect([49.99, 50, 60, 60.01, 70.01, 75.01, 80.01].map(iimKashipurGraduationScore)).toEqual([0, 1, 1, 2, 3, 4, 5]);
  });

  it("uses Lucknow, Raipur and Ranchi piecewise functions", () => {
    expect([6, 7, 26, 60].map((month) => iimLucknowWorkExperienceScore(month))).toEqual([0, 0.5, 10, 10]);
    expect([59.99, 60, 65, 70, 75, 80, 85, 90, 95].map(iimRaipurAcademicScore)).toEqual([0, 1.5, 3, 4.5, 6, 8, 10, 12, 15]);
    expect([11, 12, 35, 36, 42, 43, 48, 49].map((month) => Number(iimRaipurWorkExperienceScore(month).toFixed(2)))).toEqual([0, 0.6, 14.4, 15, 15, 10, 10, 5]);
    expect([12, 13, 24, 25, 36, 37, 48, 49].map(iimRanchiWorkExperienceScore)).toEqual([0, 5, 5, 10, 10, 5, 5, 0]);
  });

  it("uses Sambalpur, Shillong, Sirmaur, Trichy and Visakhapatnam boundaries", () => {
    expect([11, 12, 18, 24, 30, 36, 42, 48, 49].map(iimSambalpurWorkExperienceScore)).toEqual([0, 5, 10, 15, 20, 15, 10, 5, 0]);
    expect([74.99, 75, 80, 85, 90, 95].map(iimShillongSchoolRating)).toEqual([0, 2, 5, 8, 9, 10]);
    expect([69.99, 70, 75, 80, 85, 90, 95].map(iimShillongGraduationRating)).toEqual([0, 2, 4, 6, 8, 9, 10]);
    expect([6, 7, 12, 18, 24, 30, 36, 42].map(iimShillongWorkExperienceRating)).toEqual([0, 6, 12, 14, 10, 6, 2, 0]);
    expect([11, 12, 17, 18, 23, 24, 35, 36, 41, 42, 53, 54].map(iimSirmaurWorkExperienceScore)).toEqual([0, 10, 10, 15, 15, 20, 20, 15, 15, 10, 10, 5]);
    expect([5, 6, 12, 18, 24, 30, 36, 42, 48].map(iimTrichyWorkExperienceScore)).toEqual([0, 2, 4, 7, 10, 7, 4, 2, 0]);
    expect([11, 12, 24, 25, 36, 37, 48, 49].map(iimVisakhapatnamWorkExperienceScore)).toEqual([0, 2.5, 10, 10, 10, 9.375, 2.5, 2.5]);
  });

  it("calculates Mumbai profile inputs without assuming the APWE transformer", () => {
    expect([55, 55.01, 60.01, 70.01, 80.01, 90.01].map(iimMumbaiClass10Rating)).toEqual([1, 2, 3, 5, 8, 10]);
    expect(iimMumbaiRawProfile(SAMPLE_CANDIDATE)).toBeGreaterThan(0);
    const result = predictInstituteAdmission("IIMM", SAMPLE_CANDIDATE, false);
    expect(result.final.score).toBeNull();
    expect(result.final.missingRuntimeData.join(" ")).toContain("APWE");
  });
});
