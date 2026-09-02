import { booleanFromRuntime, component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, cutoffFrom, isFemaleOrTransgender, type CategoryCutoffTable } from "./formulas";

const cutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(95, 70), EWS: cutoff(85, 55), NC_OBC: cutoff(85, 55),
  SC: cutoff(65, 40), ST: cutoff(40, 30), PWD: cutoff(40, 25),
};

export const IIMN_ENGINE = createInstituteRuleEngine({
  key: "IIMN", instituteName: "IIM Nagpur", programme: "MBA 2026-28", policyVersion: "IIMN-CAT2025-2026-28-v1",
  sourceUrl: "https://www.iimnagpur.ac.in/admissions/mba/admissions-policy/",
  scoreLabel: "CAT shortlist percentile", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(cutoffs, candidate), rawScoreRule: "POSITIVE", callBehavior: "DIRECT_CALL",
  calculatePreInterview: (candidate) => scoreResult([component({ key: "cat", label: "CAT overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "CAT-only shortlist screen", detail: "CAT is the single published shortlist criterion at this stage." })], 100),
  calculateFinalScore: (candidate, cycleData) => {
    const cat = ratioScore(candidate.catOverallScaledScore, valueFromRuntime(cycleData, "highest_CAT_scaled_score"), 45);
    const pap = valueFromRuntime(cycleData, "nagpur_PAP6");
    const work = valueFromRuntime(cycleData, "nagpur_WE9");
    const academic = booleanFromRuntime(cycleData, "academic_diversity_eligible");
    return scoreResult([
      component({ key: "cat", label: "CAT", score: cat, maxScore: 45, formula: "CAT scaled / configured current maximum x 45", detail: cat == null ? "Runtime field required: highest_CAT_scaled_score." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      normalizedPiComponent(candidate, 25),
      component({ key: "pap", label: "Past academic performance", score: pap, maxScore: 6, formula: "Current 2026 PAP table", detail: pap == null ? "Runtime field required: nagpur_PAP_2026_rating_table_or_precomputed_PAP6." : "No older PAP table is silently imported.", sourceType: cycleData.dataSourceType }),
      component({ key: "work", label: "Work experience", score: work, maxScore: 9, formula: "Current 2026 work-experience table", detail: work == null ? "Runtime field required: nagpur_work_experience_2026_rating_table_or_precomputed_WE9." : "No older work table is silently imported.", sourceType: cycleData.dataSourceType }),
      component({ key: "academic_diversity", label: "Academic diversity", score: academic == null ? null : academic ? 5 : 0, maxScore: 5, formula: "Official eligible-degree list", detail: academic == null ? "Runtime field required: academic_diversity_eligible." : "Uses the configured official list.", sourceType: cycleData.dataSourceType }),
      component({ key: "gender", label: "Gender diversity", score: isFemaleOrTransgender(candidate) ? 10 : 0, maxScore: 10, formula: "Female/transgender = 10", detail: "Published final diversity weight." }),
    ], 100);
  },
});

export const IIMN_TEST_RUNTIME = modelRuntime({ values: { highest_CAT_scaled_score: 190, nagpur_PAP6: 4.5, nagpur_WE9: 6, academic_diversity_eligible: false }, finalBenchmark: 64 });
