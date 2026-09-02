import type { CandidateInput } from "@/types/iima";
import { booleanFromRuntime, component, createInstituteRuleEngine, linearInterpolate, modelRuntime, normalizedPiComponent, scoreResult } from "./shared";
import { cutoff, isFemaleOrTransgender, pointsAtLeast } from "./formulas";

function iimSambalpurCutoff(candidate: CandidateInput) {
  if (candidate.pwd) return cutoff(40, null, null, null);
  if (candidate.category === "ST") return cutoff(40, null, null, null);
  if (candidate.category === "SC") return cutoff(55, null, null, null);
  if (candidate.category === "NC_OBC") return cutoff(75, null, null, null);
  if (candidate.category === "EWS") return cutoff(80, null, null, null);
  const reduced = candidate.gender === "FEMALE" || (candidate.gender === "MALE" && candidate.workExperienceMonths >= 12);
  return cutoff(reduced ? 85 : 90, null, null, null);
}

function academics(candidate: CandidateInput) {
  const x = pointsAtLeast(candidate.class10Percent, [[90, 3], [85, 2.25], [80, 1.5], [75, 0.75]]);
  const xii = pointsAtLeast(candidate.class12Percent, [[90, 3], [85, 2.25], [80, 1.5], [75, 0.75]]);
  const grad = pointsAtLeast(candidate.bachelorPercent, [[90, 4], [85, 3], [80, 2], [75, 1]]);
  return { x, xii, grad };
}

export function iimSambalpurWorkExperienceScore(months: number): number {
  if (months < 12 || months > 48) return 0;
  return linearInterpolate([[12, 5], [18, 10], [24, 15], [30, 20], [36, 15], [42, 10], [48, 5]], months);
}

function preComponents(candidate: CandidateInput) {
  const academic = academics(candidate);
  return [
    component({ key: "cat", label: "CAT", score: 0.31 * candidate.catOverallPercentile + 0.03 * candidate.catVarcPercentile + 0.03 * candidate.catDilrPercentile + 0.03 * candidate.catQaPercentile, maxScore: 40, formula: "0.31 Overall + 0.03 VARC + 0.03 DILR + 0.03 QA", detail: "Uses CAT percentiles." }),
    component({ key: "x", label: "Class 10", score: academic.x, maxScore: 3, formula: "Published five-band table", detail: "Class 10 profile score." }),
    component({ key: "xii", label: "Class 12", score: academic.xii, maxScore: 3, formula: "Published five-band table", detail: "Class 12 profile score." }),
    component({ key: "grad", label: "Graduation", score: academic.grad, maxScore: 4, formula: "Published five-band table", detail: "Graduation profile score." }),
    component({ key: "work", label: "Work experience", score: iimSambalpurWorkExperienceScore(candidate.workExperienceMonths), maxScore: 20, formula: "Piecewise-linear published month curve", detail: `${candidate.workExperienceMonths} months are evaluated.` }),
    component({ key: "gender", label: "Gender diversity", score: isFemaleOrTransgender(candidate) ? 5 : 0, maxScore: 5, formula: "Female/transgender = 5", detail: "Published diversity component." }),
  ];
}

export const IIMSAMBALPUR_ENGINE = createInstituteRuleEngine({
  key: "IIMSAMBALPUR", instituteName: "IIM Sambalpur", programme: "MBA 2026-28", policyVersion: "IIMSAMBALPUR-CAT2025-2026-28-v1",
  sourceUrl: "https://registration.iimsambalpur.ac.in/portal/SignIn/mba",
  scoreLabel: "Pre-PI composite", preInterviewMax: 75, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: iimSambalpurCutoff, rawScoreRule: "POSITIVE", callBehavior: "RANKING",
  calculatePreInterview: (candidate) => scoreResult(preComponents(candidate), 75),
  calculateFinalScore: (candidate, cycleData) => {
    const passFlag = booleanFromRuntime(cycleData, "pi_minimum_pass_flag");
    const result = scoreResult([...preComponents(candidate), normalizedPiComponent(candidate, 25)], 100);
    if (passFlag == null) return { ...result, status: "DATA_REQUIRED", score: null, missingRuntimeData: ["PI_normalization_or_minimum_pass_flag"] };
    if (!passFlag) return { ...result, status: "NOT_REACHED", score: null, missingRuntimeData: [] };
    return result;
  },
});

export const IIMSAMBALPUR_TEST_RUNTIME = modelRuntime({ values: { pi_minimum_pass_flag: true }, callBenchmark: 55, finalBenchmark: 64 });

