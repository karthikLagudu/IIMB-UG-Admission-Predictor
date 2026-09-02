import type { CandidateInput } from "@/types/iima";
import { component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, scoreResult } from "./shared";
import { cutoff, isFemaleOrTransgender } from "./formulas";

function iimJammuCutoff(candidate: CandidateInput) {
  const female = isFemaleOrTransgender(candidate);
  const table = {
    GENERAL: [cutoff(91, 72), cutoff(89, 71)], EWS: [cutoff(74, 48), cutoff(72, 47)], NC_OBC: [cutoff(74, 48), cutoff(72, 47)],
    SC: [cutoff(54, 42), cutoff(52, 41)], ST: [cutoff(32, 24, 24, 29), cutoff(30, 23, 23, 28)], PWD: [cutoff(32, 24, 24, 29), cutoff(30, 23, 23, 28)],
  } as const;
  return table[candidate.pwd ? "PWD" : candidate.category][female ? 1 : 0];
}

function academic(candidate: CandidateInput): number {
  const x = candidate.class10Percent > 90 ? 2 : candidate.class10Percent > 80 ? 1.5 : candidate.class10Percent > 70 ? 1 : candidate.class10Percent > 60 ? 0.5 : 0;
  const xii = candidate.class12Percent > 95 ? 3 : candidate.class12Percent > 90 ? 2.5 : candidate.class12Percent > 80 ? 2 : candidate.class12Percent > 70 ? 1.5 : candidate.class12Percent > 60 ? 1 : 0;
  const ug = candidate.bachelorPercent > 95 ? 5 : candidate.bachelorPercent > 90 ? 4 : candidate.bachelorPercent > 85 ? 3 : candidate.bachelorPercent > 80 ? 2 : candidate.bachelorPercent > 70 ? 1.5 : candidate.bachelorPercent > 60 ? 1 : 0;
  return x + xii + ug;
}

export function iimJammuWorkExperienceScore(months: number): number {
  if (months <= 12 || months > 60) return 0;
  if (months <= 18) return 4;
  if (months <= 24) return 7;
  if (months <= 36) return 10;
  if (months <= 48) return 7;
  return 4;
}

export const IIMJ_ENGINE = createInstituteRuleEngine({
  key: "IIMJ", instituteName: "IIM Jammu", programme: "MBA 2026-28", policyVersion: "IIMJ-CAT2025-2026-28-v1",
  sourceUrl: "https://www.iimj.ac.in/programs/post-graduate-program-pgp/admission-policy.php",
  scoreLabel: "CAT shortlist reference", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: iimJammuCutoff, rawScoreRule: "NONE", callBehavior: "RANKING",
  calculatePreInterview: (candidate) => scoreResult([component({ key: "cat", label: "CAT overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "Category and gender CAT reference screen", detail: "The institute may adjust the published reference after CAT results." })], 100),
  calculateFinalScore: (candidate) => scoreResult([
    component({ key: "cat", label: "CAT percentile", score: 0.42 * candidate.catOverallPercentile, maxScore: 42, formula: "0.42 x absolute CAT percentile", detail: "Uses absolute CAT percentile." }),
    normalizedPiComponent(candidate, 30),
    component({ key: "academic", label: "Academic profile", score: academic(candidate), maxScore: 10, formula: "Published X, XII and UG slabs", detail: "School and graduation ratings sum to 10." }),
    component({ key: "work", label: "Work experience", score: iimJammuWorkExperienceScore(candidate.workExperienceMonths), maxScore: 10, formula: "Published month slabs", detail: `${candidate.workExperienceMonths} months are evaluated.` }),
    component({ key: "gender", label: "Gender diversity", score: isFemaleOrTransgender(candidate) ? 8 : 0, maxScore: 8, formula: "Female/transgender 8; male 0", detail: "No WAT component exists in this formula." }),
  ], 100),
});

export const IIMJ_TEST_RUNTIME = modelRuntime({ callBenchmark: 88, finalBenchmark: 64 });
