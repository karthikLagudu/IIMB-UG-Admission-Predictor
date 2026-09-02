import { booleanFromRuntime, component, createInstituteRuleEngine, dataRequiredScore, modelRuntime, normalizedPiComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, cutoffFrom, type CategoryCutoffTable } from "./formulas";

const cutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(94, 75), EWS: cutoff(81, 55), NC_OBC: cutoff(81, 52),
  SC: cutoff(66, 45), ST: cutoff(42, 25, 25, 30), PWD: cutoff(42, 25, 25, 30),
};

export const IIMUDAIPUR_ENGINE = createInstituteRuleEngine({
  key: "IIMUDAIPUR", instituteName: "IIM Udaipur", programme: "MBA 2026-28", policyVersion: "IIMUDAIPUR-CAT2025-2026-28-v1",
  sourceUrl: "https://mba.iimu.ac.in/admissions/",
  scoreLabel: "CAT + profile PI shortlist score", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(cutoffs, candidate), rawScoreRule: "NONE", callBehavior: "RANKING",
  calculatePreInterview: (_candidate, cycleData) => {
    const score = valueFromRuntime(cycleData, "pre_pi_cat_profile_score");
    if (score == null) return dataRequiredScore(100, ["current pre-PI CAT/profile subweights and boundary"], [component({ key: "pre_pi", label: "CAT + profile shortlist", score: null, maxScore: 100, formula: "Current-cycle CAT score + X + XII + graduation + work experience + gender", detail: "Runtime field required: pre_pi_cat_profile_score." })]);
    return scoreResult([component({ key: "pre_pi", label: "CAT + profile shortlist", score, maxScore: 100, formula: "Configured current-cycle CAT/profile formula", detail: "The public page does not expose fixed numeric subweights; this value is cycle-configured.", sourceType: cycleData.dataSourceType })], 100);
  },
  calculateFinalScore: (candidate, cycleData) => {
    const cat = ratioScore(candidate.catOverallScaledScore, valueFromRuntime(cycleData, "max_CAT_score_applied_and_PI_attended"), 55);
    const profile = valueFromRuntime(cycleData, "profile20_score");
    const piPass = booleanFromRuntime(cycleData, "pi_minimum_pass_flag");
    const result = scoreResult([
      component({ key: "cat", label: "Normalized CAT", score: cat, maxScore: 55, formula: "Candidate CAT score / maximum among applied and PI-attended candidates x 55", detail: cat == null ? "Runtime field required: max_CAT_score_applied_and_PI_attended." : "Uses CAT score, never percentile.", sourceType: cycleData.dataSourceType }),
      normalizedPiComponent(candidate, 25),
      component({ key: "profile", label: "Profile", score: profile, maxScore: 20, formula: "Academic6 + WorkEx6 + Diversity8", detail: profile == null ? "Runtime field required: Profile20 subcomponent score tables or precomputed profile20_score." : "Uses the configured current-cycle profile tables.", sourceType: cycleData.dataSourceType }),
    ], 100);
    if (piPass == null) return { ...result, status: "DATA_REQUIRED", score: null, missingRuntimeData: [...result.missingRuntimeData, "PI minimum pass flag"] };
    if (!piPass) return { ...result, status: "NOT_REACHED", score: null, missingRuntimeData: [] };
    return result;
  },
});

export const IIMUDAIPUR_TEST_RUNTIME = modelRuntime({ values: { pre_pi_cat_profile_score: 70, max_CAT_score_applied_and_PI_attended: 190, profile20_score: 15, pi_minimum_pass_flag: true }, callBenchmark: 62, finalBenchmark: 64 });

