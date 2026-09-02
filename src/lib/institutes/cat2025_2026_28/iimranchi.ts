import type { CandidateInput } from "@/types/iima";
import { component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, cutoffFrom, isFemaleOrTransgender, type CategoryCutoffTable } from "./formulas";

const japCutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(96.25, 75), EWS: cutoff(89, 60), NC_OBC: cutoff(88.5, 60),
  SC: cutoff(75, 45), ST: cutoff(44, 25), PWD: cutoff(30, 25),
};

export function iimRanchiWorkExperienceScore(months: number): number {
  if (months <= 12 || months > 48) return 0;
  if (months <= 24) return 5;
  if (months <= 36) return 10;
  return 5;
}

function academic(candidate: CandidateInput): number {
  const x = candidate.class10Percent >= 95 ? 2 : candidate.class10Percent >= 85 ? 1 : 0;
  const xii = candidate.class12Percent >= 95 ? 4 : candidate.class12Percent >= 85 ? 2 : 0;
  const grad = candidate.bachelorPercent >= 85 ? 4 : candidate.bachelorPercent >= 70 ? 2 : 0;
  return x + xii + grad;
}

export const IIMRANCHI_ENGINE = createInstituteRuleEngine({
  key: "IIMRANCHI", instituteName: "IIM Ranchi", programme: "MBA 2026-28", policyVersion: "IIMRANCHI-JAP2026-v1",
  sourceUrl: "https://iimranchi.ac.in/admissions/",
  scoreLabel: "JAP 2026 PI threshold score", preInterviewMax: 100, finalMax: 105,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(japCutoffs, candidate), rawScoreRule: "POSITIVE", callBehavior: "DIRECT_CALL",
  calculatePreInterview: (candidate) => scoreResult([component({ key: "cat", label: "CAT overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "JAP 2026 actual PI threshold", detail: "Uses the shared current-cycle JAP threshold." })], 100),
  calculateFinalScore: (candidate, cycleData) => {
    const varc = ratioScore(candidate.catVarcScaledScore, valueFromRuntime(cycleData, "max_VARC_scaled"), 15);
    const dilr = ratioScore(candidate.catDilrScaledScore, valueFromRuntime(cycleData, "max_DILR_scaled"), 15);
    const qa = ratioScore(candidate.catQaScaledScore, valueFromRuntime(cycleData, "max_QA_scaled"), 35);
    return scoreResult([
      component({ key: "varc", label: "CAT VARC", score: varc, maxScore: 15, formula: "VARC scaled / max VARC scaled x 15", detail: varc == null ? "Runtime field required: max_VARC_scaled." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "dilr", label: "CAT DILR", score: dilr, maxScore: 15, formula: "DILR scaled / max DILR scaled x 15", detail: dilr == null ? "Runtime field required: max_DILR_scaled." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "qa", label: "CAT QA", score: qa, maxScore: 35, formula: "QA scaled / max QA scaled x 35", detail: qa == null ? "Runtime field required: max_QA_scaled." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "academic", label: "Academics", score: academic(candidate), maxScore: 10, formula: "Published X, XII and graduation slabs", detail: "Academic profile is capped at 10." }),
      component({ key: "work", label: "Work experience", score: iimRanchiWorkExperienceScore(candidate.workExperienceMonths), maxScore: 10, formula: "Published completed-month slabs", detail: `${candidate.workExperienceMonths} months are evaluated.` }),
      normalizedPiComponent(candidate, 15),
      component({ key: "gender_bonus", label: "Gender post-score bonus", score: isFemaleOrTransgender(candidate) ? 5 : 0, maxScore: 5, formula: "Female/transgender = +5 after base score", detail: "This is a post-score bonus above the 100-point base." }),
    ], 105);
  },
});

export const IIMRANCHI_TEST_RUNTIME = modelRuntime({ values: { max_VARC_scaled: 60, max_DILR_scaled: 60, max_QA_scaled: 60 }, finalBenchmark: 66 });

