import type { CandidateInput } from "@/types/iima";
import { component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff } from "./formulas";

const policy = {
  GENERAL: { GN: cutoff(90, 65), SNG: cutoff(85, 65) },
  EWS: { GN: cutoff(75, 50), SNG: cutoff(70, 50) },
  NC_OBC: { GN: cutoff(75, 45), SNG: cutoff(70, 45) },
  SC: { GN: cutoff(60, 40), SNG: cutoff(55, 40) },
  ST: { GN: cutoff(38, 25, 30, 30), SNG: cutoff(35, 25, 30, 30) },
  PWD: { GN: cutoff(38, 25, 30, 30), SNG: cutoff(35, 25, 30, 30) },
} as const;

export function iimBgAcademicScore(candidate: CandidateInput): number {
  return (candidate.class10Percent >= 70 ? 4 : 0)
    + (candidate.class12Percent >= 70 ? 5 : 0)
    + (candidate.bachelorPercent >= 60 || ["CA", "CS", "CMA", "ICWA"].includes(candidate.professionalQualification) ? 6 : 0);
}

export function iimBgWorkExperienceScore(months: number): number {
  if (months < 12) return 0;
  if (months < 24) return 5;
  if (months <= 48) return 10;
  return 5;
}

export const IIMBG_ENGINE = createInstituteRuleEngine({
  key: "IIMBG",
  instituteName: "IIM Bodh Gaya",
  programme: "MBA 2026-28",
  policyVersion: "IIMBG-CAT2025-2026-28-v1",
  sourceUrl: "https://iimbg.ac.in/wp-content/uploads/2026/04/IIMBG_MBA_Admission-Policy_2026-28.pdf",
  scoreLabel: "EOI CAT percentile",
  preInterviewMax: 100,
  finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => policy[candidate.pwd ? "PWD" : candidate.category][candidate.gender === "FEMALE" ? "SNG" : "GN"],
  rawScoreRule: "NONE",
  callBehavior: "DIRECT_CALL",
  calculatePreInterview: (candidate) => scoreResult([
    component({ key: "cat_overall", label: "CAT 2025 overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "Published 2026 EOI invitation gate", detail: "This is the candidate's CAT percentile, not a fabricated composite score." }),
  ], 100),
  calculateFinalScore: (candidate, cycleData) => {
    const denominator = valueFromRuntime(cycleData, "cat_scaled_to_50_denominator");
    const cat = ratioScore(candidate.catOverallScaledScore, denominator, 50);
    const components = [
      component({ key: "cat", label: "CAT scaled score", score: cat, maxScore: 50, formula: "CAT total scaled / configured cycle denominator x 50", detail: cat == null ? "Runtime field required: cat_scaled_to_50_denominator." : "Uses CAT scaled score, never percentile.", sourceType: cat == null ? "OFFICIAL_POLICY" : cycleData.dataSourceType }),
      normalizedPiComponent(candidate, 25),
      component({ key: "academic", label: "Academic profile", score: iimBgAcademicScore(candidate), maxScore: 15, formula: "X4 + XII5 + UG6 threshold rules", detail: "Uses the published 70%, 70% and 60% boundaries." }),
      component({ key: "work", label: "Work experience", score: iimBgWorkExperienceScore(candidate.workExperienceMonths), maxScore: 10, formula: "Published completed-month slabs", detail: `${candidate.workExperienceMonths} months are evaluated.` }),
    ];
    return scoreResult(components, 100, cat == null ? ["cat_scaled_to_50_normalization"] : []);
  },
});

export const IIMBG_TEST_RUNTIME = modelRuntime({
  values: { cat_scaled_to_50_denominator: 204 },
  finalBenchmark: 64,
});
