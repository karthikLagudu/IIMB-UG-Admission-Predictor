import type { CandidateInput } from "@/types/iima";
import { component, createInstituteRuleEngine, modelRuntime, scoreResult } from "./shared";
import { ageOn, cutoff } from "./formulas";

function iimGuwahatiCutoff(candidate: CandidateInput) {
  const group = candidate.category === "GENERAL" || candidate.category === "EWS" ? "GENERAL_EWS" : candidate.category;
  const table = {
    GENERAL_EWS: { nonPwd: cutoff(85, 75), pwd: cutoff(75, 65) },
    NC_OBC: { nonPwd: cutoff(80, 70), pwd: cutoff(70, 60) },
    SC: { nonPwd: cutoff(75, 65), pwd: cutoff(65, 55) },
    ST: { nonPwd: cutoff(65, 55), pwd: cutoff(55, 45) },
  } as const;
  return table[group][candidate.pwd ? "pwd" : "nonPwd"];
}

export function iimGuwahatiSchoolRating(percent: number): number {
  if (percent <= 55) return 1;
  if (percent <= 60) return 2;
  if (percent <= 70) return 3;
  if (percent <= 80) return 5;
  if (percent <= 90) return 8;
  return 10;
}

export function iimGuwahatiBachelorRating(percent: number): number {
  if (percent <= 60) return 1;
  if (percent <= 65) return 2;
  if (percent <= 70) return 3;
  if (percent <= 75) return 5;
  if (percent <= 85) return 8;
  return 10;
}

export function iimGuwahatiWorkExperienceRating(months: number): number {
  if (months < 12 || months > 60) return 0;
  if (months <= 36) return 5 * (months - 12) / 24;
  return 5 * (60 - months) / 24;
}

function directMeritScore(candidate: CandidateInput) {
  const academicRating = iimGuwahatiSchoolRating(candidate.class10Percent)
    + iimGuwahatiSchoolRating(candidate.class12Percent)
    + iimGuwahatiBachelorRating(candidate.bachelorPercent)
    + iimGuwahatiWorkExperienceRating(candidate.workExperienceMonths);
  const ncat = Math.max(0, Math.min(1, candidate.catOverallScaledScore / 204));
  const nar = academicRating / 35;
  return scoreResult([
    component({ key: "ncat", label: "Normalized CAT", score: 0.65 * ncat, maxScore: 0.65, formula: "0.65 x CAT total scaled / CAT maximum", detail: "CAT contributes 65% of the direct-merit composite." }),
    component({ key: "nar", label: "Normalized academic rating", score: 0.35 * nar, maxScore: 0.35, formula: "0.35 x AR / 35", detail: `Academic rating is ${academicRating.toFixed(2)} / 35.` }),
  ], 1);
}

export const IIMG_ENGINE = createInstituteRuleEngine({
  key: "IIMG",
  instituteName: "IIM Guwahati",
  programme: "MBA 2026-28",
  policyVersion: "IIMG-CAT2025-2026-28-v1",
  sourceUrl: "https://www.iimg.ac.in/admission-process/",
  scoreLabel: "Direct merit composite",
  preInterviewMax: 1,
  finalMax: 1,
  stages: { interview: false, wat: false, groupDiscussion: false, directMerit: true },
  cutoff: iimGuwahatiCutoff,
  rawScoreRule: "POSITIVE",
  extraEligibility: (candidate) => {
    const age = candidate.ageOnCutoffDate ?? ageOn(candidate.dateOfBirth, "2026-06-30");
    if (age == null) return ["Date of birth or age on 30-Jun-2026 is required."];
    return age >= 19 ? [] : ["Candidate must be at least 19 years old on 30-Jun-2026."];
  },
  callBehavior: "DIRECT_MERIT",
  calculatePreInterview: directMeritScore,
  calculateFinalScore: directMeritScore,
});

export const IIMG_TEST_RUNTIME = modelRuntime({ finalBenchmark: 0.48 });

