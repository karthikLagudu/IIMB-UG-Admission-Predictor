import type { CandidateInput } from "@/types/iima";
import { component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, isFemaleOrTransgender, isProfessional, pointsAtLeast } from "./formulas";

function iimSirmaurCutoff(candidate: CandidateInput) {
  const female = isFemaleOrTransgender(candidate);
  const table = {
    GENERAL: [cutoff(90, 65), cutoff(85, 65)], EWS: [cutoff(75, 50), cutoff(70, 50)], NC_OBC: [cutoff(75, 45), cutoff(70, 45)],
    SC: [cutoff(60, 40), cutoff(55, 40)], ST: [cutoff(38, 25, 30, 30), cutoff(35, 25, 30, 30)], PWD: [cutoff(38, 25, 30, 30), cutoff(35, 25, 30, 30)],
  } as const;
  return table[candidate.pwd ? "PWD" : candidate.category][female ? 1 : 0];
}

export function iimSirmaurWorkExperienceScore(months: number): number {
  if (months < 12) return 0;
  if (months <= 17) return 10;
  if (months <= 23) return 15;
  if (months <= 35) return 20;
  if (months <= 41) return 15;
  if (months <= 53) return 10;
  return 5;
}

function trailblazer(candidate: CandidateInput): number {
  return isProfessional(candidate) || /engineer|technology|MBBS|BAMS|BHMS|BDS|BVSC|design|architecture|planning|pharmacy/i.test(candidate.degreeName) ? 5 : 0;
}

export const IIMSIRMAUR_ENGINE = createInstituteRuleEngine({
  key: "IIMSIRMAUR", instituteName: "IIM Sirmaur", programme: "MBA 2026-28", policyVersion: "IIMSIRMAUR-CAT2025-2026-28-v1",
  sourceUrl: "https://admissions.iimsirmaur.ac.in/mba-admissions-policy-2026",
  scoreLabel: "CAP shortlist percentile", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: iimSirmaurCutoff, rawScoreRule: "NONE", callBehavior: "DIRECT_CALL",
  calculatePreInterview: (candidate) => scoreResult([component({ key: "cat", label: "CAT overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "Category and gender CAP threshold", detail: "Uses the published current-cycle table." })], 100),
  calculateFinalScore: (candidate, cycleData) => {
    const varc = ratioScore(candidate.catVarcScaledScore, valueFromRuntime(cycleData, "highest_VARC_scaled"), 12.25);
    const dilr = ratioScore(candidate.catDilrScaledScore, valueFromRuntime(cycleData, "highest_DILR_scaled"), 10.5);
    const qa = ratioScore(candidate.catQaScaledScore, valueFromRuntime(cycleData, "highest_QA_scaled"), 12.25);
    const academic = pointsAtLeast(candidate.class10Percent, [[95.000001, 3], [85.000001, 2], [75, 1]])
      + pointsAtLeast(candidate.class12Percent, [[95.000001, 4], [85.000001, 2], [75, 1]])
      + pointsAtLeast(candidate.bachelorPercent, [[90.000001, 8], [80.000001, 6], [70.000001, 4], [60, 2]]);
    return scoreResult([
      component({ key: "varc", label: "CAT VARC", score: varc, maxScore: 12.25, formula: "35 x 0.35 x VARC/highest VARC", detail: varc == null ? "Runtime field required: highest_VARC_scaled." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "dilr", label: "CAT DILR", score: dilr, maxScore: 10.5, formula: "35 x 0.30 x DILR/highest DILR", detail: dilr == null ? "Runtime field required: highest_DILR_scaled." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "qa", label: "CAT QA", score: qa, maxScore: 12.25, formula: "35 x 0.35 x QA/highest QA", detail: qa == null ? "Runtime field required: highest_QA_scaled." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      normalizedPiComponent(candidate, 20),
      component({ key: "academic", label: "Academic profile", score: academic, maxScore: 15, formula: "Published X, XII and graduation slabs", detail: "Strict > boundaries are preserved." }),
      component({ key: "work", label: "Work experience", score: iimSirmaurWorkExperienceScore(candidate.workExperienceMonths), maxScore: 20, formula: "Published month slabs", detail: `${candidate.workExperienceMonths} months are evaluated.` }),
      component({ key: "gender", label: "Gender diversity", score: isFemaleOrTransgender(candidate) ? 5 : 0, maxScore: 5, formula: "Female/transgender = 5", detail: "Published diversity component." }),
      component({ key: "trailblazer", label: "Trailblazer", score: trailblazer(candidate), maxScore: 5, formula: "Published eligible qualification groups", detail: "Based on the selected qualification text/category." }),
    ], 100);
  },
});

export const IIMSIRMAUR_TEST_RUNTIME = modelRuntime({ values: { highest_VARC_scaled: 60, highest_DILR_scaled: 60, highest_QA_scaled: 60 }, finalBenchmark: 64 });

