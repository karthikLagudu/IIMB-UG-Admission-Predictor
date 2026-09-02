import { booleanFromRuntime, component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, scoreResult } from "./shared";
import { cutoff, cutoffFrom, isFemaleOrTransgender, pointsAtLeast, type CategoryCutoffTable } from "./formulas";

const japCutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(96.25, 75), EWS: cutoff(89, 60), NC_OBC: cutoff(88.5, 60),
  SC: cutoff(75, 45), ST: cutoff(44, 25), PWD: cutoff(30, 25),
};

export function iimRaipurAcademicScore(percent: number): number {
  return pointsAtLeast(percent, [[95, 15], [90, 12], [85, 10], [80, 8], [75, 6], [70, 4.5], [65, 3], [60, 1.5]]);
}

export function iimRaipurWorkExperienceScore(months: number): number {
  if (months < 12) return 0;
  if (months <= 35) return 0.6 * (months - 11);
  if (months <= 42) return 15;
  if (months <= 48) return 10;
  return 5;
}

export const IIMRAIPUR_ENGINE = createInstituteRuleEngine({
  key: "IIMRAIPUR", instituteName: "IIM Raipur", programme: "MBA 2026-28", policyVersion: "IIMRAIPUR-JAP2026-v1",
  sourceUrl: "https://iimraipur.ac.in/admission-policy-4/",
  scoreLabel: "JAP 2026 PI threshold score", preInterviewMax: 100, finalMax: 150,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(japCutoffs, candidate), rawScoreRule: "POSITIVE", callBehavior: "DIRECT_CALL",
  bachelorRequired: (candidate) => candidate.pwd || candidate.category === "ST" ? 45 : candidate.category === "SC" ? 50 : 60,
  calculatePreInterview: (candidate) => scoreResult([component({ key: "cat", label: "CAT overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "JAP 2026 actual PI threshold", detail: "Uses the shared current-cycle JAP threshold." })], 100),
  calculateFinalScore: (candidate, cycleData) => {
    const top10 = booleanFromRuntime(cycleData, "top10_nirf_2025_eligible");
    const cfa = booleanFromRuntime(cycleData, "cfa_level_completed");
    const academicEligible = booleanFromRuntime(cycleData, "academic_diversity_eligible");
    const profile = top10 == null || cfa == null ? null : (top10 ? 4 : 0) + (cfa ? 1 : 0);
    const gender = isFemaleOrTransgender(candidate) ? 8 : 0;
    const academic = isFemaleOrTransgender(candidate) ? 0 : academicEligible == null ? null : academicEligible ? 2 : 0;
    return scoreResult([
      component({ key: "cat", label: "CAT index", score: 0.125 * (candidate.catVarcPercentile + candidate.catDilrPercentile + candidate.catQaPercentile + candidate.catOverallPercentile), maxScore: 50, formula: "0.125 x (VARC + DILR + QA + Overall percentiles)", detail: "Each of the four percentile measures has equal weight." }),
      normalizedPiComponent(candidate, 40),
      component({ key: "x", label: "Class 10", score: iimRaipurAcademicScore(candidate.class10Percent), maxScore: 15, formula: "Published nine-band academic table", detail: "Class 10 slab score." }),
      component({ key: "xii", label: "Class 12", score: iimRaipurAcademicScore(candidate.class12Percent), maxScore: 15, formula: "Published nine-band academic table", detail: "Class 12 slab score." }),
      component({ key: "work", label: "Work experience", score: iimRaipurWorkExperienceScore(candidate.workExperienceMonths), maxScore: 15, formula: "Published completed-month function", detail: `${candidate.workExperienceMonths} months are evaluated.` }),
      component({ key: "gender", label: "Gender diversity", score: gender, maxScore: 8, formula: "Female/transgender = 8", detail: "Gender and academic diversity are mutually exclusive." }),
      component({ key: "profile", label: "Profile", score: profile, maxScore: 5, formula: "Top-10 NIRF 4 + CFA 1", detail: profile == null ? "Runtime fields required: top10_nirf_2025_eligible and cfa_level_completed." : "Uses the two published profile flags.", sourceType: cycleData.dataSourceType }),
      component({ key: "academic_diversity", label: "Academic diversity", score: academic, maxScore: 2, formula: "Official Annexure degree list, only when gender score does not apply", detail: academic == null ? "Runtime field required: academic_diversity_eligible." : "Mutual exclusivity is enforced.", sourceType: cycleData.dataSourceType }),
    ], 150);
  },
});

export const IIMRAIPUR_TEST_RUNTIME = modelRuntime({ values: { top10_nirf_2025_eligible: false, cfa_level_completed: false, academic_diversity_eligible: false }, finalBenchmark: 96 });
