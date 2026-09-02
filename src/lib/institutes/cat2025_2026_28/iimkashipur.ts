import { booleanFromRuntime, component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, cutoffFrom, isFemaleOrTransgender, isProfessional, type CategoryCutoffTable } from "./formulas";

const japCutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(96.25, 75), EWS: cutoff(89, 60), NC_OBC: cutoff(88.5, 60),
  SC: cutoff(75, 45), ST: cutoff(44, 25), PWD: cutoff(30, 25),
};

export function iimKashipurGraduationScore(percent: number): number {
  if (percent < 50) return 0;
  if (percent <= 60) return 1;
  if (percent <= 70) return 2;
  if (percent <= 75) return 3;
  if (percent <= 80) return 4;
  return 5;
}

export function iimKashipurWorkExperienceScore(months: number): number {
  if (months < 6 || months > 36) return 0;
  if (months <= 12) return 3;
  if (months <= 18) return 7;
  if (months <= 30) return 15;
  return 5;
}

export const IIMKASHIPUR_ENGINE = createInstituteRuleEngine({
  key: "IIMKASHIPUR", instituteName: "IIM Kashipur", programme: "MBA 2026-28", policyVersion: "IIMKASHIPUR-JAP2026-v1",
  sourceUrl: "https://www.iimkashipur.ac.in/academics/mba/mba-admission",
  scoreLabel: "JAP 2026 PI threshold score", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(japCutoffs, candidate), rawScoreRule: "POSITIVE", callBehavior: "DIRECT_CALL",
  calculatePreInterview: (candidate) => scoreResult([component({ key: "cat", label: "CAT overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "JAP 2026 actual PI threshold", detail: "The CAT-2024 Kashipur table is not reused." })], 100),
  calculateFinalScore: (candidate, cycleData) => {
    const denominator = valueFromRuntime(cycleData, "highest_CAT_scaled_score");
    const cat = ratioScore(candidate.catOverallScaledScore, denominator, 41);
    const academicDiversity = booleanFromRuntime(cycleData, "academic_diversity_eligible");
    const components = [
      normalizedPiComponent(candidate, 25),
      component({ key: "cat", label: "CAT scaled score", score: cat, maxScore: 41, formula: "Candidate CAT scaled / highest CAT scaled x 41", detail: cat == null ? "Runtime field required: highest_CAT_scaled_score." : "Uses CAT scaled score, not percentile.", sourceType: cycleData.dataSourceType }),
      component({ key: "x", label: "Class 10", score: candidate.class10Percent / 100 * 2, maxScore: 2, formula: "X% / 100 x 2", detail: "Direct percentage scaling." }),
      component({ key: "xii", label: "Class 12", score: candidate.class12Percent / 100 * 2, maxScore: 2, formula: "XII% / 100 x 2", detail: "Direct percentage scaling." }),
      component({ key: "grad", label: "Graduation", score: iimKashipurGraduationScore(candidate.bachelorPercent), maxScore: 5, formula: "Published graduation slabs", detail: `${candidate.bachelorPercent.toFixed(2)}% is mapped to the official slab.` }),
      component({ key: "professional", label: "Professional qualification", score: isProfessional(candidate) ? 2 : 0, maxScore: 2, formula: "Completed CA/CS/ICWA(CMA) = 2", detail: "Professional qualification is not inferred beyond the selected input." }),
      component({ key: "work", label: "Work experience", score: iimKashipurWorkExperienceScore(candidate.workExperienceMonths), maxScore: 15, formula: "Published completed-month slabs", detail: `${candidate.workExperienceMonths} months are evaluated.` }),
      component({ key: "academic_diversity", label: "Academic diversity", score: academicDiversity == null ? null : academicDiversity ? 2 : 0, maxScore: 2, formula: "Official eligible-degree list", detail: academicDiversity == null ? "Runtime field required: academic_diversity_eligible." : "Uses the configured official-list eligibility.", sourceType: cycleData.dataSourceType }),
      component({ key: "gender", label: "Gender diversity", score: isFemaleOrTransgender(candidate) ? 6 : 0, maxScore: 6, formula: "Female/transgender = 6", detail: "Published diversity component." }),
    ];
    return scoreResult(components, 100);
  },
});

export const IIMKASHIPUR_TEST_RUNTIME = modelRuntime({ values: { highest_CAT_scaled_score: 190, academic_diversity_eligible: false }, finalBenchmark: 64 });
