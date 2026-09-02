import type { CandidateInput } from "@/types/iima";
import { boundedStandardized, component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, normalizedWatComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, cutoffFrom, isEngineering, type CategoryCutoffTable } from "./formulas";

const cutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(90, 85), EWS: cutoff(82, 77), NC_OBC: cutoff(82, 77),
  SC: cutoff(65, 55), ST: cutoff(60, 50), PWD: cutoff(60, 50),
};

export function iimLucknowWorkExperienceScore(months: number, maxScore = 10): number {
  return months <= 6 ? 0 : Math.min((months - 6) * 0.5, maxScore);
}

function preScores(candidate: CandidateInput, cycleData: Parameters<typeof valueFromRuntime>[0]) {
  const cat = ratioScore(candidate.catOverallScaledScore, valueFromRuntime(cycleData, "highest_CAT2025_scaled_score"), 60);
  const p = valueFromRuntime(cycleData, "XII_percentile_P");
  const xii = p == null ? null : Math.max(0, Math.min(10, ((Math.max(p, 80) - 80) / 20) * 10));
  const grad = boundedStandardized(candidate.bachelorPercent, valueFromRuntime(cycleData, "graduation_discipline_mean"), valueFromRuntime(cycleData, "graduation_discipline_sd"), 10);
  return { cat, xii, grad };
}

export const IIML_ENGINE = createInstituteRuleEngine({
  key: "IIML", instituteName: "IIM Lucknow", programme: "MBA 2026-28", policyVersion: "IIML-CAT2025-2026-28-v1",
  sourceUrl: "https://www.iiml.ac.in/master-business-administration",
  scoreLabel: "WAT/PI shortlist score", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: true, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(cutoffs, candidate), rawScoreRule: "NONE", callBehavior: "RANKING",
  calculatePreInterview: (candidate, cycleData) => {
    const scores = preScores(candidate, cycleData);
    return scoreResult([
      component({ key: "cat", label: "CAT", score: scores.cat, maxScore: 60, formula: "CAT scaled / highest CAT 2025 scaled x 60", detail: scores.cat == null ? "Runtime field required: highest_CAT2025_scaled_score." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "xii", label: "Class 12", score: scores.xii, maxScore: 10, formula: "((max(P,80)-80)/20) x 10", detail: scores.xii == null ? "Runtime field required: XII_percentile_P." : "P is the official normalized XII percentile.", sourceType: cycleData.dataSourceType }),
      component({ key: "grad", label: "Graduation", score: scores.grad, maxScore: 10, formula: "Bounded discipline mean/SD standardization", detail: scores.grad == null ? "Runtime fields required: graduation_discipline_mean and graduation_discipline_sd." : "Discipline-normalized graduation score.", sourceType: cycleData.dataSourceType }),
      component({ key: "work", label: "Work experience", score: iimLucknowWorkExperienceScore(candidate.workExperienceMonths), maxScore: 10, formula: "months<=6 ? 0 : min((months-6)x0.5,10)", detail: "Uses completed eligible months." }),
      component({ key: "academic_diversity", label: "Academic diversity", score: isEngineering(candidate) ? 0 : 5, maxScore: 5, formula: "Non-engineering = 5", detail: "Engineering status is derived from the selected degree category." }),
      component({ key: "gender", label: "Gender diversity", score: candidate.gender === "FEMALE" ? 5 : 0, maxScore: 5, formula: "Female = 5", detail: "Published shortlist diversity component." }),
    ], 100);
  },
  calculateFinalScore: (candidate, cycleData) => {
    const scores = preScores(candidate, cycleData);
    const pi = normalizedPiComponent(candidate, 40);
    const result = scoreResult([
      component({ key: "cat", label: "CAT", score: scores.cat == null ? null : scores.cat / 2, maxScore: 30, formula: "CAT shortlist component scaled to 30", detail: "Same current-cycle CAT denominator.", sourceType: cycleData.dataSourceType }),
      component({ key: "xii", label: "Class 12", score: scores.xii == null ? null : scores.xii / 2, maxScore: 5, formula: "Normalized XII score scaled to 5", detail: "Same official P input.", sourceType: cycleData.dataSourceType }),
      component({ key: "grad", label: "Graduation", score: scores.grad == null ? null : scores.grad / 2, maxScore: 5, formula: "Normalized graduation score scaled to 5", detail: "Same discipline statistics.", sourceType: cycleData.dataSourceType }),
      component({ key: "diversity", label: "Diversity", score: candidate.gender === "FEMALE" || !isEngineering(candidate) ? 5 : 0, maxScore: 5, formula: "Applicable diversity route, max 5", detail: "Diversity is capped at the published final weight." }),
      component({ key: "work", label: "Work experience", score: iimLucknowWorkExperienceScore(candidate.workExperienceMonths, 10) / 2, maxScore: 5, formula: "Shortlist WE score scaled to 5", detail: "Uses the published month rule." }),
      normalizedWatComponent(candidate, 10),
      pi,
    ], 100);
    if (pi.score != null && pi.score < 12) return { ...result, status: "NOT_REACHED", score: null, missingRuntimeData: [] };
    return result;
  },
});

export const IIML_TEST_RUNTIME = modelRuntime({ values: { highest_CAT2025_scaled_score: 190, XII_percentile_P: 94, graduation_discipline_mean: 72, graduation_discipline_sd: 10 }, callBenchmark: 63, finalBenchmark: 64 });

