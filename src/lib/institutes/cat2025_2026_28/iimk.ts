import type { CandidateInput } from "@/types/iima";
import { component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, normalizedWatComponent, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, isEngineering, isFemaleOrTransgender, isProfessional } from "./formulas";

function iimKozhikodeCutoff(candidate: CandidateInput) {
  if (candidate.pwd || candidate.category === "ST") return cutoff(55, 45);
  if (candidate.category === "SC") return cutoff(65, 55);
  if (candidate.category === "EWS" || candidate.category === "NC_OBC") return cutoff(75, 65);
  return cutoff(85, 75);
}

function academicMinimum(candidate: CandidateInput): number {
  return candidate.pwd || candidate.category === "SC" || candidate.category === "ST" ? 55 : 60;
}

export const IIMK_ENGINE = createInstituteRuleEngine({
  key: "IIMK", instituteName: "IIM Kozhikode", programme: "PGP 2026-28", policyVersion: "IIMK-CAT2025-2026-28-v1",
  sourceUrl: "https://iimk.ac.in/academic-programmes/pgp/selection-process-pgp-adm",
  scoreLabel: "AIS shortlist score", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: true, groupDiscussion: false, directMerit: false },
  cutoff: iimKozhikodeCutoff, rawScoreRule: "POSITIVE", callBehavior: "RANKING",
  bachelorRequired: (candidate) => isProfessional(candidate) ? 50 : 60,
  extraEligibility: (candidate) => {
    const required = academicMinimum(candidate);
    const failures: string[] = [];
    if (candidate.class10Percent < required) failures.push(`Class 10 marks are below ${required}%.`);
    if (candidate.class12Percent < required) failures.push(`Class 12 marks are below ${required}%.`);
    return failures;
  },
  calculatePreInterview: (candidate, cycleData) => {
    const cat = ratioScore(candidate.catOverallScaledScore, valueFromRuntime(cycleData, "highest_CAT_scaled_score"), 50);
    const xDenominator = valueFromRuntime(cycleData, "board_highest_X_last3years");
    const xiiDenominator = valueFromRuntime(cycleData, "board_stream_highest_XII");
    const x = ratioScore(candidate.class10Percent, xDenominator, 15);
    const xii = ratioScore(candidate.class12Percent, xiiDenominator, 20);
    const diversity = isFemaleOrTransgender(candidate) ? 10 : isEngineering(candidate) ? 0 : 5;
    const work = valueFromRuntime(cycleData, "kozhikode_work_experience_score");
    return scoreResult([
      component({ key: "cat", label: "CAT", score: cat, maxScore: 50, formula: "CAT scaled / highest CAT scaled x 50", detail: cat == null ? "Runtime field required: highest_CAT_scaled_score." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "x", label: "Class 10", score: x, maxScore: 15, formula: "X% / board highest over past 3 years x 15", detail: x == null ? "Runtime field required: board_highest_X_last3years." : "Board-specific normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "xii", label: "Class 12", score: xii, maxScore: 20, formula: "XII% / board-stream highest x 20", detail: xii == null ? "Runtime field required: board_stream_highest_XII." : "Board and stream normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "diversity", label: "Diversity", score: diversity, maxScore: 10, formula: "max(gender 10, academic diversity 5)", detail: "The two diversity routes are not added." }),
      component({ key: "work", label: "Work experience", score: work, maxScore: 5, formula: "Official month-specific 0-5 table", detail: work == null ? "Runtime field required: kozhikode_work_experience_score." : "Uses the current official month table.", sourceType: cycleData.dataSourceType }),
    ], 100);
  },
  calculateFinalScore: (candidate, cycleData) => {
    const cat = ratioScore(candidate.catOverallScaledScore, valueFromRuntime(cycleData, "highest_CAT_scaled_score"), 35);
    const cfa = valueFromRuntime(cycleData, "cfa_resume_score");
    const resume = cfa == null ? null : Math.min(10, (isProfessional(candidate) ? 5 : 0) + cfa);
    return scoreResult([
      component({ key: "cat", label: "CAT", score: cat, maxScore: 35, formula: "CAT scaled / highest CAT scaled x 35", detail: cat == null ? "Runtime field required: highest_CAT_scaled_score." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      normalizedPiComponent(candidate, 35),
      normalizedWatComponent(candidate, 20),
      component({ key: "resume", label: "Resume", score: resume, maxScore: 10, formula: "Professional qualification 5 + CFA certification 5", detail: resume == null ? "Runtime field required: cfa_resume_score." : "Professional and CFA scores may add up to 10.", sourceType: cycleData.dataSourceType }),
    ], 100);
  },
});

export const IIMK_TEST_RUNTIME = modelRuntime({ values: { highest_CAT_scaled_score: 190, board_highest_X_last3years: 100, board_stream_highest_XII: 100, kozhikode_work_experience_score: 3.5, cfa_resume_score: 0 }, callBenchmark: 63, finalBenchmark: 64 });

