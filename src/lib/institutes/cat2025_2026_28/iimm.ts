import type { CandidateInput } from "@/types/iima";
import { component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, cutoffFrom, pointsAtMost, type CategoryCutoffTable } from "./formulas";

const cutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(85, 80, 80, 75), EWS: cutoff(75, 70, 65, 65), NC_OBC: cutoff(75, 70, 65, 65),
  SC: cutoff(70, 65, 60, 60), ST: cutoff(65, 55), PWD: cutoff(55, 45),
};

export function iimMumbaiClass10Rating(percent: number): number {
  return pointsAtMost(percent, [[55, 1], [60, 2], [70, 3], [80, 5], [90, 8], [100, 10]]);
}

export function iimMumbaiClass12Rating(candidate: CandidateInput): number {
  const bands = candidate.class12Stream === "COMMERCE"
    ? [[50, 1], [55, 2], [65, 3], [75, 5], [90, 8], [100, 10]]
    : candidate.class12Stream === "ARTS_HUMANITIES"
      ? [[45, 1], [50, 2], [60, 3], [70, 5], [85, 8], [100, 10]]
      : [[55, 1], [60, 2], [70, 3], [80, 5], [90, 8], [100, 10]];
  return pointsAtMost(candidate.class12Percent, bands as Array<[number, number]>);
}

export function iimMumbaiBachelorRating(candidate: CandidateInput): number {
  const bands = candidate.academicCategory === "AC_2"
    ? [[50, 1], [53, 2], [55, 3], [57, 5], [63, 8], [100, 10]]
    : candidate.academicCategory === "AC_3"
      ? [[55, 1], [60, 2], [65, 3], [70, 5], [80, 8], [100, 10]]
      : candidate.academicCategory === "AC_5"
        ? [[50, 1], [55, 2], [60, 3], [65, 5], [75, 8], [100, 10]]
        : candidate.academicCategory === "AC_4" || candidate.academicCategory === "AC_6"
          ? [[60, 1], [65, 2], [70, 3], [75, 5], [85, 8], [100, 10]]
          : [[55, 1], [60, 2], [62, 3], [65, 5], [70, 8], [100, 10]];
  return pointsAtMost(candidate.bachelorPercent, bands as Array<[number, number]>);
}

export function iimMumbaiRawProfile(candidate: CandidateInput): number {
  const work = candidate.workExperienceMonths < 12 ? 0 : candidate.workExperienceMonths <= 36 ? 0.2 * (candidate.workExperienceMonths - 11) : 5;
  return 0.7 * (iimMumbaiClass10Rating(candidate.class10Percent) + iimMumbaiClass12Rating(candidate) + iimMumbaiBachelorRating(candidate)) + 0.2 * work;
}

export const IIMM_ENGINE = createInstituteRuleEngine({
  key: "IIMM", instituteName: "IIM Mumbai", programme: "MBA 2026-28", policyVersion: "IIMM-CAT2025-2026-28-v1",
  sourceUrl: "https://iimmumbai.ac.in/mba-eligibility-criteria",
  scoreLabel: "CAT shortlist reference", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(cutoffs, candidate), rawScoreRule: "NONE", callBehavior: "RANKING",
  calculatePreInterview: (candidate) => scoreResult([component({ key: "cat", label: "CAT overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "Published CAT eligibility reference", detail: "Minimum CAT eligibility is not treated as a guaranteed call cutoff." })], 100),
  calculateFinalScore: (candidate, cycleData) => {
    const cat = ratioScore(candidate.catOverallScaledScore, valueFromRuntime(cycleData, "CAT60_scaled_score_denominator"), 60);
    const apwe = valueFromRuntime(cycleData, "APWE20_precomputed");
    const raw = iimMumbaiRawProfile(candidate);
    return scoreResult([
      component({ key: "cat", label: "CAT", score: cat, maxScore: 60, formula: "Configured scaled-score normalization x 60", detail: cat == null ? "Runtime field required: CAT60_scaled_score_normalization." : "Uses CAT scaled score.", sourceType: cycleData.dataSourceType }),
      normalizedPiComponent(candidate, 20),
      component({ key: "apwe", label: "Academic profile and work experience", score: apwe, maxScore: 20, formula: "Current-policy APWE raw-to-20 transformer", detail: apwe == null ? `Runtime field required: APWE_raw_to_20_transform. Candidate raw AR is ${raw.toFixed(2)} / 22.` : `Configured APWE transform applied; raw AR is ${raw.toFixed(2)} / 22.`, sourceType: cycleData.dataSourceType }),
    ], 100);
  },
});

export const IIMM_TEST_RUNTIME = modelRuntime({ values: { CAT60_scaled_score_denominator: 190, APWE20_precomputed: 15 }, callBenchmark: 84, finalBenchmark: 64 });
