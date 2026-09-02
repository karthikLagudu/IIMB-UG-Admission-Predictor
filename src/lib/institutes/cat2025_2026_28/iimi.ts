import type { CandidateInput } from "@/types/iima";
import { component, createInstituteRuleEngine, modelRuntime, normalizedPiComponent, rangeNormalized, ratioScore, scoreResult, valueFromRuntime } from "./shared";
import { cutoff, cutoffFrom, type CategoryCutoffTable } from "./formulas";

const cutoffs: CategoryCutoffTable = {
  GENERAL: cutoff(90, 80), EWS: cutoff(90, 80), NC_OBC: cutoff(80, 70),
  SC: cutoff(60, 55), ST: cutoff(45, 40), PWD: cutoff(45, 40),
};

function normalizedAcademic(candidate: CandidateInput, cycleData: Parameters<typeof valueFromRuntime>[0], level: "X" | "XII", weight: number) {
  const value = level === "X" ? candidate.class10Percent : candidate.class12Percent;
  return rangeNormalized(value, valueFromRuntime(cycleData, `${level}_zmin`), valueFromRuntime(cycleData, `${level}_zmax`), weight);
}

function catComponent(candidate: CandidateInput, cycleData: Parameters<typeof valueFromRuntime>[0], section: "VARC" | "DILR" | "QA", weight: number) {
  const score = section === "VARC" ? candidate.catVarcScaledScore : section === "DILR" ? candidate.catDilrScaledScore : candidate.catQaScaledScore;
  return ratioScore(score, valueFromRuntime(cycleData, `highest_${section}_scaled`), weight);
}

export const IIMI_ENGINE = createInstituteRuleEngine({
  key: "IIMI", instituteName: "IIM Indore", programme: "PGP 2026-28", policyVersion: "IIMI-CAT2025-2026-28-v1",
  sourceUrl: "https://iimidr.ac.in/wp-content/uploads/2025/12/Admissions-Procedure-PGP-2026-28-Batch.pdf",
  scoreLabel: "PI shortlist composite", preInterviewMax: 100, finalMax: 100,
  stages: { interview: true, wat: false, groupDiscussion: false, directMerit: false },
  cutoff: (candidate) => cutoffFrom(cutoffs, candidate), rawScoreRule: "NONE", callBehavior: "RANKING",
  calculatePreInterview: (candidate, cycleData) => {
    const scores = {
      x: normalizedAcademic(candidate, cycleData, "X", 10), xii: normalizedAcademic(candidate, cycleData, "XII", 25),
      varc: catComponent(candidate, cycleData, "VARC", 16), dilr: catComponent(candidate, cycleData, "DILR", 16), qa: catComponent(candidate, cycleData, "QA", 23),
      df: valueFromRuntime(cycleData, "current_DF7"), we: valueFromRuntime(cycleData, "current_prePI_WE3"),
    };
    const components = [
      component({ key: "x", label: "Class 10", score: scores.x, maxScore: 10, formula: "Range-normalized X marks", detail: scores.x == null ? "Runtime fields required: X_zmin and X_zmax." : "Uses the current applicant-pool range.", sourceType: cycleData.dataSourceType }),
      component({ key: "xii", label: "Class 12", score: scores.xii, maxScore: 25, formula: "Range-normalized XII marks", detail: scores.xii == null ? "Runtime fields required: XII_zmin and XII_zmax." : "Uses the current applicant-pool range.", sourceType: cycleData.dataSourceType }),
      ...(["VARC", "DILR", "QA"] as const).map((section) => component({ key: section.toLowerCase(), label: `CAT ${section}`, score: scores[section.toLowerCase() as "varc" | "dilr" | "qa"], maxScore: section === "QA" ? 23 : 16, formula: `Candidate ${section} scaled / highest ${section} scaled x weight`, detail: scores[section.toLowerCase() as "varc" | "dilr" | "qa"] == null ? `Runtime field required: highest_${section}_scaled.` : "Uses current qualifying-pool maximum.", sourceType: cycleData.dataSourceType })),
      component({ key: "df", label: "Diversity factor", score: scores.df, maxScore: 7, formula: "Current-cycle DF mapping", detail: scores.df == null ? "Runtime field required: current_DF_mapping." : "Uses the configured current-cycle mapping.", sourceType: cycleData.dataSourceType }),
      component({ key: "we", label: "Work experience", score: scores.we, maxScore: 3, formula: "Current-cycle WE mapping", detail: scores.we == null ? "Runtime field required: current_prePI_WE_mapping." : "Uses the configured current-cycle mapping.", sourceType: cycleData.dataSourceType }),
    ];
    return scoreResult(components, 100, components.filter((item) => item.score == null).map((item) => item.key));
  },
  calculateFinalScore: (candidate, cycleData) => {
    const x = normalizedAcademic(candidate, cycleData, "X", 5);
    const xii = normalizedAcademic(candidate, cycleData, "XII", 5);
    const varc = catComponent(candidate, cycleData, "VARC", 20);
    const dilr = catComponent(candidate, cycleData, "DILR", 10);
    const qa = catComponent(candidate, cycleData, "QA", 10);
    const df = valueFromRuntime(cycleData, "current_DF5");
    const components = [
      component({ key: "x", label: "Class 10", score: x, maxScore: 5, formula: "Range-normalized X marks", detail: x == null ? "Runtime fields required: X_zmin and X_zmax." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "xii", label: "Class 12", score: xii, maxScore: 5, formula: "Range-normalized XII marks", detail: xii == null ? "Runtime fields required: XII_zmin and XII_zmax." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "varc", label: "CAT VARC", score: varc, maxScore: 20, formula: "Section scaled / highest scaled x 20", detail: varc == null ? "Runtime field required: highest_VARC_scaled." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "dilr", label: "CAT DILR", score: dilr, maxScore: 10, formula: "Section scaled / highest scaled x 10", detail: dilr == null ? "Runtime field required: highest_DILR_scaled." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      component({ key: "qa", label: "CAT QA", score: qa, maxScore: 10, formula: "Section scaled / highest scaled x 10", detail: qa == null ? "Runtime field required: highest_QA_scaled." : "Current-cycle normalization.", sourceType: cycleData.dataSourceType }),
      normalizedPiComponent(candidate, 45),
      component({ key: "df", label: "Diversity factor", score: df, maxScore: 5, formula: "Current-cycle DF mapping", detail: df == null ? "Runtime field required: current_DF_mapping." : "Current-cycle mapping.", sourceType: cycleData.dataSourceType }),
    ];
    return scoreResult(components, 100);
  },
});

export const IIMI_TEST_RUNTIME = modelRuntime({
  values: { X_zmin: 50, X_zmax: 100, XII_zmin: 50, XII_zmax: 100, highest_VARC_scaled: 60, highest_DILR_scaled: 60, highest_QA_scaled: 60, current_DF7: 4, current_prePI_WE3: 2, current_DF5: 3 },
  callBenchmark: 60, finalBenchmark: 62,
});

