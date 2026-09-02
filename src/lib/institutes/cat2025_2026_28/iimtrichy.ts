import { booleanFromRuntime, component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, cutoffFrom, isEngineering, type CategoryCutoffTable } from "./formulas";

const japCutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(95.25, 75), EWS: cutoff(89, 60), NC_OBC: cutoff(88.5, 60),
  SC: cutoff(75, 45), ST: cutoff(44, 25), PWD: cutoff(30, 25),
};

export function iimTrichyWorkExperienceScore(months: number): number {
  if (months < 6 || months >= 48) return 0;
  if (months < 12) return 2;
  if (months < 18) return 4;
  if (months < 24) return 7;
  if (months < 30) return 10;
  if (months < 36) return 7;
  if (months < 42) return 4;
  return 2;
}

export const IIMTRICHY_ENGINE = createInstituteRuleEngine({
  key: "IIMTRICHY", instituteName: "IIM Tiruchirappalli", programme: "PGPM 2026-28", policyVersion: "IIMTRICHY-JAP2026-v1",
  sourceUrl: "https://www.iimtrichy.ac.in/en/pgpm-admin-criteria",
  scoreLabel: "JAP 2026 PI threshold score", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(japCutoffs, candidate), rawScoreRule: "POSITIVE", callBehavior: "DIRECT_CALL",
  calculatePreInterview: (candidate) => scoreResult([component({ key: "cat", label: "CAT overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "JAP 2026 actual PI threshold", detail: "Uses the shared current-cycle JAP threshold." })], 100),
  calculateFinalScore: (candidate, cycleData) => {
    const academicDiversity = booleanFromRuntime(cycleData, "academic_diversity_eligible_first_class");
    const x = valueFromRuntime(cycleData, "normalized_X2");
    const xii = valueFromRuntime(cycleData, "normalized_XII3");
    const ug = valueFromRuntime(cycleData, "normalized_UG5");
    return scoreResult([
      component({ key: "cat", label: "CAT percentile", score: candidate.catOverallPercentile * 0.52, maxScore: 52, formula: "Overall CAT percentile x 0.52", detail: "Uses CAT percentile." }),
      normalizedPiComponent(candidate, 20),
      component({ key: "work", label: "Work experience", score: iimTrichyWorkExperienceScore(candidate.workExperienceMonths), maxScore: 10, formula: "Published completed-month slabs", detail: `${candidate.workExperienceMonths} months are evaluated.` }),
      component({ key: "x", label: "Normalized Class 10", score: x, maxScore: 2, formula: "Current official normalization", detail: x == null ? "Runtime field required: current formula for Normalized_X2." : "Configured current-cycle formula.", sourceType: cycleData.dataSourceType }),
      component({ key: "xii", label: "Normalized Class 12", score: xii, maxScore: 3, formula: "Current official normalization", detail: xii == null ? "Runtime field required: current formula for Normalized_XII3." : "Configured current-cycle formula.", sourceType: cycleData.dataSourceType }),
      component({ key: "ug", label: "Undergraduate score", score: ug, maxScore: 5, formula: "Current official UG mapping", detail: ug == null ? "Runtime field required: current formula for UG5." : "Configured current-cycle formula.", sourceType: cycleData.dataSourceType }),
      component({ key: "gender", label: "Gender diversity", score: candidate.gender === "FEMALE" ? 6 : 0, maxScore: 6, formula: "Female = 6", detail: "Published final diversity component." }),
      component({ key: "academic_diversity", label: "Academic diversity", score: academicDiversity == null ? null : academicDiversity && !isEngineering(candidate) ? 2 : 0, maxScore: 2, formula: "Non-engineering UG with First Class or above = 2", detail: academicDiversity == null ? "Runtime field required: academic_diversity_eligible_first_class." : "Uses configured First Class eligibility.", sourceType: cycleData.dataSourceType }),
    ], 100);
  },
});

export const IIMTRICHY_TEST_RUNTIME = modelRuntime({ values: { normalized_X2: 1.7, normalized_XII3: 2.7, normalized_UG5: 4.3, academic_diversity_eligible_first_class: false }, finalBenchmark: 64 });
