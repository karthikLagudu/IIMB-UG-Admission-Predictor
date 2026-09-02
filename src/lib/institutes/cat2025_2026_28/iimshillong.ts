import type { CandidateInput } from "@/types/iima";
import { booleanFromRuntime, component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, pointsAtLeast } from "./formulas";

function iimShillongCutoff(candidate: CandidateInput) {
  const each = candidate.pwd || candidate.category === "ST" ? 50 : candidate.category === "SC" ? 60 : 75;
  return cutoff(null, each);
}

export function iimShillongSchoolRating(percent: number): number {
  return pointsAtLeast(percent, [[95, 10], [90, 9], [85, 8], [80, 5], [75, 2]]);
}

export function iimShillongGraduationRating(percent: number): number {
  return pointsAtLeast(percent, [[95, 10], [90, 9], [85, 8], [80, 6], [75, 4], [70, 2]]);
}

export function iimShillongWorkExperienceRating(months: number): number {
  if (months < 7 || months >= 42) return 0;
  if (months < 12) return 6;
  if (months < 18) return 12;
  if (months < 24) return 14;
  if (months < 30) return 10;
  if (months < 36) return 6;
  return 2;
}

function ars(candidate: CandidateInput): number {
  return iimShillongSchoolRating(candidate.class10Percent) + iimShillongSchoolRating(candidate.class12Percent) + iimShillongGraduationRating(candidate.bachelorPercent) + iimShillongWorkExperienceRating(candidate.workExperienceMonths);
}

export const IIMSHILLONG_ENGINE = createInstituteRuleEngine({
  key: "IIMSHILLONG", instituteName: "IIM Shillong", programme: "PGP 2026-28", policyVersion: "IIMSHILLONG-CAT2025-2026-28-v1",
  sourceUrl: "https://www.iimshillong.ac.in/admission-process/",
  scoreLabel: "PI shortlist score", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: iimShillongCutoff, rawScoreRule: "NONE", callBehavior: "RANKING",
  calculatePreInterview: (candidate, cycleData) => {
    const average = valueFromRuntime(cycleData, "average_ARS_top50");
    const rankEligible = booleanFromRuntime(cycleData, "discipline_category_gender_rank_eligible");
    const nars = average == null || average <= 0 ? null : ars(candidate) / average;
    const result = scoreResult([
      component({ key: "cat", label: "CAT percentile", score: 0.65 * candidate.catOverallPercentile, maxScore: 65, formula: "0.65 x CAT total percentile", detail: "Published CAT contribution." }),
      component({ key: "nars", label: "Normalized academic rating", score: nars == null ? null : 0.35 * nars, maxScore: 35, formula: "0.35 x (candidate ARS / average ARS top 50)", detail: nars == null ? "Runtime field required: average_ARS_top50." : `Candidate ARS is ${ars(candidate).toFixed(2)}.`, sourceType: cycleData.dataSourceType }),
    ], 100);
    if (rankEligible == null) return { ...result, status: "DATA_REQUIRED", score: null, missingRuntimeData: [...result.missingRuntimeData, "discipline_category_gender_pool_ranks"] };
    if (!rankEligible) return { ...result, status: "NOT_REACHED", score: null, missingRuntimeData: [] };
    return result;
  },
  calculateFinalScore: (candidate, cycleData) => {
    const genderMode = cycleData.values?.applicant_pool_gender_mode;
    const communicationPass = booleanFromRuntime(cycleData, "communication_minimum_pass_flag");
    const piPass = booleanFromRuntime(cycleData, "pi_minimum_pass_flag");
    const cat = ratioScore(candidate.catOverallScaledScore, valueFromRuntime(cycleData, "CAT_scaled_denominator"), 40);
    const gender = typeof genderMode === "string" ? (candidate.gender === genderMode ? 0 : 10) : null;
    const result = scoreResult([
      component({ key: "ars", label: "Academic rating", score: ars(candidate) / 40 * 10, maxScore: 10, formula: "ARS / 40 x 10", detail: `Candidate ARS is ${ars(candidate).toFixed(2)} / 40.` }),
      component({ key: "gender", label: "Gender diversity", score: gender, maxScore: 10, formula: "10 except for modal CAT applicant-pool gender", detail: gender == null ? "Runtime field required: applicant_pool_gender_mode." : "Uses current applicant-pool modal gender.", sourceType: cycleData.dataSourceType }),
      normalizedPiComponent(candidate, 40),
      component({ key: "cat", label: "CAT scaled score", score: cat, maxScore: 40, formula: "Configured CAT scaled normalization x 40", detail: cat == null ? "Runtime field required: CAT_scaled_normalization." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
    ], 100);
    const missing = [communicationPass == null ? "communication_minimum_pass_flag" : null, piPass == null ? "pi_minimum_pass_flag" : null].filter((item): item is string => Boolean(item));
    if (missing.length) return { ...result, status: "DATA_REQUIRED", score: null, missingRuntimeData: [...result.missingRuntimeData, ...missing] };
    if (!communicationPass || !piPass) return { ...result, status: "NOT_REACHED", score: null, missingRuntimeData: [] };
    return result;
  },
});

export const IIMSHILLONG_TEST_RUNTIME = modelRuntime({ values: { average_ARS_top50: 30, discipline_category_gender_rank_eligible: true, applicant_pool_gender_mode: "MALE", communication_minimum_pass_flag: true, pi_minimum_pass_flag: true, CAT_scaled_denominator: 190 }, callBenchmark: 60, finalBenchmark: 64 });
