import type { CandidateInput } from "@/types/iima";
import { component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, scoreResult, valueFromRuntime } from "./shared";
import { cutoff } from "./formulas";

function iimRohtakCutoff(candidate: CandidateInput) {
  const standard = { GENERAL: 97, EWS: 93, NC_OBC: 83, SC: 60, ST: 50 } as const;
  const dap = { GENERAL: 87, EWS: 83, NC_OBC: 73, SC: 50, ST: 40 } as const;
  return cutoff((candidate.pwd ? dap : standard)[candidate.category], null, null, null);
}

export const IIMROHTAK_ENGINE = createInstituteRuleEngine({
  key: "IIMROHTAK", instituteName: "IIM Rohtak", programme: "PGP 2026-28", policyVersion: "IIMROHTAK-CAT2025-2026-28-v1",
  sourceUrl: "https://www.iimrohtak.ac.in/panel/assets/images/admission-policy/pgpadmissionpolicy2026-28.pdf",
  scoreLabel: "Overall CAT shortlist score", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: iimRohtakCutoff, rawScoreRule: "NONE", callBehavior: "DIRECT_CALL",
  calculatePreInterview: (candidate) => scoreResult([component({ key: "cat", label: "CAT overall percentile", score: candidate.catOverallPercentile, maxScore: 100, formula: "Overall-only category reference", detail: "No sectional percentile cutoff is invented." })], 100),
  calculateFinalScore: (candidate, cycleData) => {
    const profile = valueFromRuntime(cycleData, "rohtak_academic_gender_diversity_20");
    return scoreResult([
      component({ key: "cat", label: "CAT percentile", score: candidate.catOverallPercentile * 0.6, maxScore: 60, formula: "CAT percentile x 0.60", detail: "Uses overall CAT percentile." }),
      normalizedPiComponent(candidate, 20),
      component({ key: "profile", label: "Academic and gender diversity", score: profile, maxScore: 20, formula: "Current-cycle 20-point rule table", detail: profile == null ? "Runtime field required: rohtak_academic_gender_diversity_20_current_cycle_rule_table." : "Uses the current configured mapping.", sourceType: cycleData.dataSourceType }),
    ], 100);
  },
});

export const IIMROHTAK_TEST_RUNTIME = modelRuntime({ values: { rohtak_academic_gender_diversity_20: 12 }, finalBenchmark: 64 });
