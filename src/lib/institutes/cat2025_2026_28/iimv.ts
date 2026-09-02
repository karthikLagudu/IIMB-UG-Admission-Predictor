import type { CandidateInput } from "@/types/iima";
import { boundedStandardized, component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, cutoffFrom, isFemaleOrTransgender, isProfessional, type CategoryCutoffTable } from "./formulas";

const cutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(82, 70), EWS: cutoff(72, 63), NC_OBC: cutoff(72, 63),
  SC: cutoff(50, 40), ST: cutoff(40, 30), PWD: cutoff(40, 30),
};

export function iimVisakhapatnamWorkExperienceScore(months: number): number {
  if (months < 12) return 0;
  if (months <= 24) return 10 - 0.625 * (24 - months);
  if (months <= 36) return 10;
  if (months <= 48) return 10 - 0.625 * (months - 36);
  return 2.5;
}

function standardComponent(candidateValue: number, cycleData: Parameters<typeof valueFromRuntime>[0], key: string, weight: number) {
  return boundedStandardized(candidateValue, valueFromRuntime(cycleData, `${key}_mean`), valueFromRuntime(cycleData, `${key}_sd`), weight);
}

function boardAdjusted(candidate: CandidateInput, cycleData: Parameters<typeof valueFromRuntime>[0], level: "X" | "XII", weight: number) {
  const p90 = valueFromRuntime(cycleData, `${level}_board_p90`);
  if (p90 == null || p90 <= 0) return null;
  const percent = level === "X" ? candidate.class10Percent : candidate.class12Percent;
  return standardComponent(percent / p90, cycleData, `${level}_adjusted`, weight);
}

export const IIMV_ENGINE = createInstituteRuleEngine({
  key: "IIMV", instituteName: "IIM Visakhapatnam", programme: "PGP 2026-28", policyVersion: "IIMV-CAT2025-2026-28-v1",
  sourceUrl: "https://www.iimv.ac.in/programs/pgp/admissions/pgp-adms-adm-prcs-crtra",
  scoreLabel: "Normalized pre-PI score", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(cutoffs, candidate), rawScoreRule: "POSITIVE", callBehavior: "RANKING",
  calculatePreInterview: (candidate, cycleData) => {
    const varc = standardComponent(candidate.catVarcScaledScore, cycleData, "VARC", 18);
    const dilr = standardComponent(candidate.catDilrScaledScore, cycleData, "DILR", 14);
    const qa = standardComponent(candidate.catQaScaledScore, cycleData, "QA", 18);
    const x = boardAdjusted(candidate, cycleData, "X", 10);
    const xii = boardAdjusted(candidate, cycleData, "XII", 10);
    const bachelor = standardComponent(candidate.bachelorPercent, cycleData, "Bachelor", 10);
    const professional = isProfessional(candidate) ? valueFromRuntime(cycleData, "professional_standardized_score") : 0;
    const work = professional == null ? null : Math.max(iimVisakhapatnamWorkExperienceScore(candidate.workExperienceMonths), professional);
    return scoreResult([
      component({ key: "varc", label: "CAT VARC", score: varc, maxScore: 18, formula: "Bounded standardized CAT VARC", detail: varc == null ? "Runtime fields required: VARC_mean and VARC_sd." : "Current-cycle standardization.", sourceType: cycleData.dataSourceType }),
      component({ key: "dilr", label: "CAT DILR", score: dilr, maxScore: 14, formula: "Bounded standardized CAT DILR", detail: dilr == null ? "Runtime fields required: DILR_mean and DILR_sd." : "Current-cycle standardization.", sourceType: cycleData.dataSourceType }),
      component({ key: "qa", label: "CAT QA", score: qa, maxScore: 18, formula: "Bounded standardized CAT QA", detail: qa == null ? "Runtime fields required: QA_mean and QA_sd." : "Current-cycle standardization.", sourceType: cycleData.dataSourceType }),
      component({ key: "x", label: "Class 10", score: x, maxScore: 10, formula: "Board-p90 adjustment then bounded standardization", detail: x == null ? "Runtime fields required: X_board_p90, X_adjusted_mean and X_adjusted_sd." : "Uses past-two-year board statistics.", sourceType: cycleData.dataSourceType }),
      component({ key: "xii", label: "Class 12", score: xii, maxScore: 10, formula: "Board-p90 adjustment then bounded standardization", detail: xii == null ? "Runtime fields required: XII_board_p90, XII_adjusted_mean and XII_adjusted_sd." : "Uses past-two-year board statistics.", sourceType: cycleData.dataSourceType }),
      component({ key: "bachelor", label: "Bachelor's", score: bachelor, maxScore: 10, formula: "Graduation-stream bounded standardization", detail: bachelor == null ? "Runtime fields required: Bachelor_mean and Bachelor_sd." : "Uses graduation-stream statistics.", sourceType: cycleData.dataSourceType }),
      component({ key: "gender", label: "Gender diversity", score: isFemaleOrTransgender(candidate) ? 10 : 0, maxScore: 10, formula: "Applicable gender diversity = 10", detail: "Published pre-PI weight." }),
      component({ key: "work_professional", label: "Work experience / professional", score: work, maxScore: 10, formula: "Higher of WE score or standardized professional score", detail: work == null ? "Runtime field required: professional_standardized_score." : "The two routes are never added.", sourceType: cycleData.dataSourceType }),
    ], 100);
  },
  calculateFinalScore: (candidate, cycleData) => {
    const cat = ratioScore(candidate.catOverallScaledScore, valueFromRuntime(cycleData, "CAT_total_normalization_denominator"), 25);
    const x = boardAdjusted(candidate, cycleData, "X", 4);
    const xii = boardAdjusted(candidate, cycleData, "XII", 4);
    const bachelor = standardComponent(candidate.bachelorPercent, cycleData, "Bachelor", 4);
    return scoreResult([
      normalizedPiComponent(candidate, 48),
      component({ key: "cat", label: "CAT", score: cat, maxScore: 25, formula: "Configured CAT section/total normalization x 25", detail: cat == null ? "Runtime field required: CAT section normalization data." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "x", label: "Class 10", score: x, maxScore: 4, formula: "Board-adjusted standardized X score", detail: x == null ? "Runtime board and component statistics required." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "xii", label: "Class 12", score: xii, maxScore: 4, formula: "Board-adjusted standardized XII score", detail: xii == null ? "Runtime board and component statistics required." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "bachelor", label: "Bachelor's", score: bachelor, maxScore: 4, formula: "Graduation-stream standardization", detail: bachelor == null ? "Runtime component mean/SD required." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "gender", label: "Gender diversity", score: isFemaleOrTransgender(candidate) ? 5 : 0, maxScore: 5, formula: "Applicable gender diversity = 5", detail: "Published final weight." }),
      component({ key: "work", label: "Work experience", score: iimVisakhapatnamWorkExperienceScore(candidate.workExperienceMonths), maxScore: 10, formula: "Published piecewise month function", detail: `${candidate.workExperienceMonths} months are evaluated.` }),
    ], 100);
  },
});

export const IIMV_TEST_RUNTIME = modelRuntime({ values: { VARC_mean: 38, VARC_sd: 8, DILR_mean: 36, DILR_sd: 8, QA_mean: 37, QA_sd: 8, X_board_p90: 92, X_adjusted_mean: 0.95, X_adjusted_sd: 0.08, XII_board_p90: 92, XII_adjusted_mean: 0.93, XII_adjusted_sd: 0.08, Bachelor_mean: 75, Bachelor_sd: 10, professional_standardized_score: 0, CAT_total_normalization_denominator: 190 }, callBenchmark: 62, finalBenchmark: 64 });
