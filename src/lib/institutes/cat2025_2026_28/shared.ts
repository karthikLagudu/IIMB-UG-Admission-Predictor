import type { CandidateInput, SourceType } from "@/types/iima";
import type {
  BenchmarkType,
  InstituteCallResult,
  InstituteCallStatus,
  InstituteCatCutoff,
  InstituteEligibilityResult,
  InstituteKey,
  InstitutePredictionResult,
  InstituteScoreComponent,
  InstituteScoreResult,
  InstituteSelectionStages,
  PredictionBenchmark,
} from "@/types/institutes";
import { calculateInstituteSeatPrediction } from "@/lib/institutes/prediction";

export type RuntimeScalar = number | boolean | string | null;

export interface InstituteCycleRuntimeData {
  values?: Record<string, RuntimeScalar>;
  callBenchmark?: PredictionBenchmark;
  finalBenchmark?: PredictionBenchmark;
  logisticSlope?: number;
  dataSourceType?: SourceType;
}

export const EMPTY_CYCLE_RUNTIME: InstituteCycleRuntimeData = { values: {} };

export interface InstituteRuleEngine {
  key: Exclude<InstituteKey, "IIMA">;
  evaluateEligibility(candidate: CandidateInput): InstituteEligibilityResult;
  calculatePreInterview(candidate: CandidateInput, cycleData?: InstituteCycleRuntimeData): InstituteScoreResult;
  evaluateInterviewCall(candidate: CandidateInput, cycleData?: InstituteCycleRuntimeData, preInterview?: InstituteScoreResult): InstituteCallResult;
  calculateFinalScore(candidate: CandidateInput, cycleData?: InstituteCycleRuntimeData): InstituteScoreResult;
  predictSeat(candidate: CandidateInput, cycleData?: InstituteCycleRuntimeData): InstitutePredictionResult["prediction"];
  predict(candidate: CandidateInput, cycleData?: InstituteCycleRuntimeData): InstitutePredictionResult;
}

export interface InstituteRuleDefinition {
  key: Exclude<InstituteKey, "IIMA" | "IIMB" | "IIMC">;
  instituteName: string;
  programme: string;
  policyVersion: string;
  sourceUrl: string;
  scoreLabel: string;
  preInterviewMax: number;
  finalMax: number;
  stages: InstituteSelectionStages;
  cutoff: (candidate: CandidateInput) => InstituteCatCutoff;
  bachelorRequired?: (candidate: CandidateInput) => number;
  rawScoreRule?: "POSITIVE" | "NON_NEGATIVE" | "NONE";
  extraEligibility?: (candidate: CandidateInput) => string[];
  callBehavior?: "DIRECT_CALL" | "RANKING" | "DIRECT_MERIT";
  calculatePreInterview: (candidate: CandidateInput, cycleData: InstituteCycleRuntimeData) => InstituteScoreResult;
  calculateFinalScore: (candidate: CandidateInput, cycleData: InstituteCycleRuntimeData) => InstituteScoreResult;
}

export function valueFromRuntime(cycleData: InstituteCycleRuntimeData, key: string): number | null {
  const value = cycleData.values?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function booleanFromRuntime(cycleData: InstituteCycleRuntimeData, key: string): boolean | null {
  const value = cycleData.values?.[key];
  return typeof value === "boolean" ? value : null;
}

export function component(args: {
  key: string;
  label: string;
  score: number | null;
  maxScore: number;
  formula: string;
  detail: string;
  missingKey?: string;
  sourceType?: SourceType;
}): InstituteScoreComponent {
  return {
    key: args.key,
    label: args.label,
    score: args.score,
    maxScore: args.maxScore,
    status: args.score == null ? "DATA_REQUIRED" : "CALCULATED",
    formula: args.formula,
    detail: args.detail,
    sourceType: args.sourceType ?? "OFFICIAL_POLICY",
  };
}

export function runtimeComponent(args: {
  cycleData: InstituteCycleRuntimeData;
  runtimeKey: string;
  key: string;
  label: string;
  maxScore: number;
  formula: string;
  detail: string;
}): InstituteScoreComponent {
  const score = valueFromRuntime(args.cycleData, args.runtimeKey);
  return component({
    key: args.key,
    label: args.label,
    score,
    maxScore: args.maxScore,
    formula: args.formula,
    detail: score == null ? `${args.detail} Runtime field required: ${args.runtimeKey}.` : args.detail,
    missingKey: args.runtimeKey,
    sourceType: score == null ? "OFFICIAL_POLICY" : args.cycleData.dataSourceType ?? "USER_INPUT",
  });
}

export function normalizedPiComponent(candidate: CandidateInput, maxScore: number, label = "Personal Interview"): InstituteScoreComponent {
  const normalized = candidate.normalizedPi;
  const score = normalized != null && normalized >= 0 && normalized <= 1 ? normalized * maxScore : null;
  return component({
    key: "pi",
    label,
    score,
    maxScore,
    formula: `Normalized PI x ${maxScore}`,
    detail: score == null ? "A normalized PI value between 0 and 1 is required." : "Uses the candidate's normalized PI input.",
    sourceType: score == null ? "OFFICIAL_POLICY" : "USER_INPUT",
  });
}

export function normalizedWatComponent(candidate: CandidateInput, maxScore: number, label = "Written Ability Test"): InstituteScoreComponent {
  const normalized = candidate.normalizedAwt;
  const score = normalized != null && normalized >= 0 && normalized <= 1 ? normalized * maxScore : null;
  return component({
    key: "wat",
    label,
    score,
    maxScore,
    formula: `Normalized WAT x ${maxScore}`,
    detail: score == null ? "A normalized WAT value between 0 and 1 is required." : "Uses the candidate's normalized WAT input.",
    sourceType: score == null ? "OFFICIAL_POLICY" : "USER_INPUT",
  });
}

export function scoreResult(components: InstituteScoreComponent[], maxScore: number, extraMissing: string[] = []): InstituteScoreResult {
  const componentMissing = components
    .filter((item) => item.score == null)
    .map((item) => item.detail.match(/Runtime field required: ([^.]+)\./)?.[1])
    .filter((item): item is string => Boolean(item));
  const missingRuntimeData = Array.from(new Set([...extraMissing, ...componentMissing]));
  const complete = components.every((item) => item.score != null);
  return {
    status: complete ? "CALCULATED" : "DATA_REQUIRED",
    score: complete ? components.reduce((sum, item) => sum + (item.score ?? 0), 0) : null,
    maxScore,
    components,
    missingRuntimeData,
  };
}

export function dataRequiredScore(maxScore: number, missingRuntimeData: string[], components: InstituteScoreComponent[] = []): InstituteScoreResult {
  return { status: "DATA_REQUIRED", score: null, maxScore, components, missingRuntimeData };
}

export function notReachedScore(maxScore: number): InstituteScoreResult {
  return { status: "NOT_REACHED", score: null, maxScore, components: [], missingRuntimeData: [] };
}

export function ratioScore(value: number, denominator: number | null, weight: number): number | null {
  if (denominator == null || denominator <= 0) return null;
  return Math.max(0, Math.min(weight, value / denominator * weight));
}

export function rangeNormalized(value: number, minimum: number | null, maximum: number | null, weight: number): number | null {
  if (minimum == null || maximum == null || maximum <= minimum) return null;
  return Math.max(0, Math.min(weight, weight * (value - minimum) / (maximum - minimum)));
}

export function boundedStandardized(value: number, mean: number | null, sd: number | null, weight: number): number | null {
  if (mean == null || sd == null || sd <= 0) return null;
  return Math.max(0, Math.min(weight, weight / 2 + ((value - mean) / sd) * weight / 6));
}

export function linearInterpolate(points: Array<[number, number]>, value: number): number {
  if (value <= points[0][0]) return points[0][1];
  for (let index = 1; index < points.length; index += 1) {
    const [rightX, rightY] = points[index];
    const [leftX, leftY] = points[index - 1];
    if (value <= rightX) return leftY + (value - leftX) / (rightX - leftX) * (rightY - leftY);
  }
  return points[points.length - 1][1];
}

function defaultBachelorRequired(candidate: CandidateInput): number {
  return candidate.pwd || candidate.category === "SC" || candidate.category === "ST" ? 45 : 50;
}

function passThreshold(actual: number, required: number | null): boolean {
  return required == null || actual >= required;
}

export function createInstituteRuleEngine(definition: InstituteRuleDefinition): InstituteRuleEngine {
  const evaluateEligibility = (candidate: CandidateInput): InstituteEligibilityResult => {
    const cutoff = definition.cutoff(candidate);
    const bachelorRequired = definition.bachelorRequired?.(candidate) ?? defaultBachelorRequired(candidate);
    const bachelorPass = candidate.bachelorPercent >= bachelorRequired;
    const overallPass = passThreshold(candidate.catOverallPercentile, cutoff.overall);
    const varcPass = passThreshold(candidate.catVarcPercentile, cutoff.varc);
    const dilrPass = passThreshold(candidate.catDilrPercentile, cutoff.dilr);
    const qaPass = passThreshold(candidate.catQaPercentile, cutoff.qa);
    const rawScoreGatePass = definition.rawScoreRule === "NONE"
      ? true
      : candidate.positiveRawVarc && candidate.positiveRawDilr && candidate.positiveRawQa;
    const failedRules: string[] = [];
    if (!bachelorPass) failedRules.push(`Bachelor/professional marks are below the required ${bachelorRequired}%.`);
    if (!overallPass && cutoff.overall != null) failedRules.push(`Overall CAT percentile is below ${cutoff.overall}.`);
    if (!varcPass && cutoff.varc != null) failedRules.push(`VARC percentile is below ${cutoff.varc}.`);
    if (!dilrPass && cutoff.dilr != null) failedRules.push(`DILR percentile is below ${cutoff.dilr}.`);
    if (!qaPass && cutoff.qa != null) failedRules.push(`QA percentile is below ${cutoff.qa}.`);
    if (!rawScoreGatePass) failedRules.push("Every CAT section must satisfy the published raw/scaled-score condition.");
    failedRules.push(...(definition.extraEligibility?.(candidate) ?? []));
    return {
      passed: failedRules.length === 0,
      bachelorRequired,
      bachelorPass,
      cutoff,
      overallPass,
      varcPass,
      dilrPass,
      qaPass,
      rawScoreGatePass,
      failedRules,
    };
  };

  const calculatePreInterview = (candidate: CandidateInput, cycleData: InstituteCycleRuntimeData = EMPTY_CYCLE_RUNTIME) => (
    evaluateEligibility(candidate).passed ? definition.calculatePreInterview(candidate, cycleData) : notReachedScore(definition.preInterviewMax)
  );

  const evaluateInterviewCall = (
    candidate: CandidateInput,
    cycleData: InstituteCycleRuntimeData = EMPTY_CYCLE_RUNTIME,
    suppliedPreInterview?: InstituteScoreResult,
  ): InstituteCallResult => {
    const eligibility = evaluateEligibility(candidate);
    if (!eligibility.passed) {
      return { status: "NO_CALL", officialMinimumsPassed: false, benchmarkType: "NONE", benchmarkValue: null, margin: null, reason: "One or more official eligibility or CAT hard gates failed." };
    }
    const preInterview = suppliedPreInterview ?? calculatePreInterview(candidate, cycleData);
    if (preInterview.status === "SPECIAL_CASE_REVIEW_REQUIRED") {
      return { status: "SPECIAL_CASE_REVIEW_REQUIRED", officialMinimumsPassed: true, benchmarkType: "NONE", benchmarkValue: null, margin: null, reason: "The policy requires an institute/admin review for this special case." };
    }
    if (preInterview.status === "DATA_REQUIRED") {
      return { status: "DATA_REQUIRED", officialMinimumsPassed: true, benchmarkType: "NONE", benchmarkValue: null, margin: null, reason: `Official minimums pass, but the ${definition.scoreLabel.toLowerCase()} needs the listed runtime data.` };
    }
    if (cycleData.callBenchmark && preInterview.score != null) {
      const margin = preInterview.score - cycleData.callBenchmark.value;
      return {
        status: margin >= 0 ? "PREDICTED_CALL" : "NO_CALL",
        officialMinimumsPassed: true,
        benchmarkType: cycleData.callBenchmark.benchmarkType,
        benchmarkValue: cycleData.callBenchmark.value,
        margin,
        reason: `${cycleData.callBenchmark.label} is used as a clearly labelled ${cycleData.callBenchmark.benchmarkType.toLowerCase().replaceAll("_", " ")} comparison.`,
      };
    }
    if (definition.callBehavior === "DIRECT_CALL") {
      return { status: "PREDICTED_CALL", officialMinimumsPassed: true, benchmarkType: "OFFICIAL_RESULT", benchmarkValue: null, margin: null, reason: "The candidate clears the published current-cycle invitation threshold." };
    }
    if (definition.callBehavior === "DIRECT_MERIT") {
      return { status: "ELIGIBLE_FOR_RANKING", officialMinimumsPassed: true, benchmarkType: "OFFICIAL_POLICY_REFERENCE", benchmarkValue: null, margin: null, reason: "This institute has no PI/WAT/GD stage for this cycle; the candidate proceeds to direct category-wise merit ranking." };
    }
    return { status: "ELIGIBLE_FOR_RANKING", officialMinimumsPassed: true, benchmarkType: "OFFICIAL_POLICY_REFERENCE", benchmarkValue: null, margin: null, reason: "Official minimums pass, but no fixed current-cycle shortlist boundary is published in advance." };
  };

  const calculateFinalScore = (candidate: CandidateInput, cycleData: InstituteCycleRuntimeData = EMPTY_CYCLE_RUNTIME) => (
    evaluateEligibility(candidate).passed ? definition.calculateFinalScore(candidate, cycleData) : notReachedScore(definition.finalMax)
  );

  const predictSeat = (candidate: CandidateInput, cycleData: InstituteCycleRuntimeData = EMPTY_CYCLE_RUNTIME) => {
    const eligibility = evaluateEligibility(candidate);
    const preInterview = calculatePreInterview(candidate, cycleData);
    const call = evaluateInterviewCall(candidate, cycleData, preInterview);
    const final = calculateFinalScore(candidate, cycleData);
    return calculateInstituteSeatPrediction({
      eligibilityGate: eligibility.passed,
      callGate: call.status === "PREDICTED_CALL" || (definition.callBehavior === "DIRECT_MERIT" && eligibility.passed),
      finalScore: final.score,
      benchmark: cycleData.finalBenchmark,
      logisticSlope: cycleData.logisticSlope,
    });
  };

  const predict = (candidate: CandidateInput, cycleData: InstituteCycleRuntimeData = EMPTY_CYCLE_RUNTIME): InstitutePredictionResult => {
    const eligibility = evaluateEligibility(candidate);
    const preInterview = calculatePreInterview(candidate, cycleData);
    const call = evaluateInterviewCall(candidate, cycleData, preInterview);
    const final = calculateFinalScore(candidate, cycleData);
    const prediction = predictSeat(candidate, cycleData);
    const strengths: string[] = [];
    const gaps: string[] = [];
    if (eligibility.passed) strengths.push(`All published ${definition.instituteName} eligibility and CAT minimums are satisfied.`);
    else gaps.push(...eligibility.failedRules);
    if (preInterview.score != null) strengths.push(`${definition.scoreLabel} is ${preInterview.score.toFixed(2)} / ${preInterview.maxScore}.`);
    if (preInterview.status === "DATA_REQUIRED") gaps.push(`The ${definition.scoreLabel.toLowerCase()} needs: ${preInterview.missingRuntimeData.join(", ")}.`);
    if (final.status === "DATA_REQUIRED") gaps.push(`The final score needs: ${final.missingRuntimeData.join(", ")}.`);
    if (call.benchmarkType === "MODEL") gaps.push("Testing estimate only: the active call boundary is a mock planning benchmark, not an official institute cutoff.");
    const nextSteps = gaps.length > 0
      ? ["Review the listed failed gates or missing cycle fields before relying on later-stage predictions."]
      : [definition.stages.interview ? "Prepare for the institute's interview stage and update the PI input when available." : "Track the institute's category merit list; this cycle has no interview stage."];
    const explanation = [
      eligibility.passed ? "Published degree and CAT hard gates are satisfied." : "At least one published degree or CAT hard gate failed.",
      preInterview.score == null ? `${definition.scoreLabel} is not fully calculable.` : `${definition.scoreLabel}: ${preInterview.score.toFixed(2)} / ${preInterview.maxScore}.`,
      call.reason,
      final.score == null ? "Final score is not fully calculable; unavailable values were kept null." : `Final score: ${final.score.toFixed(2)} / ${final.maxScore}.`,
      prediction.probability == null ? "Seat probability is not shown without a defensible configured benchmark." : `Model seat probability: ${(prediction.probability * 100).toFixed(1)}%.`,
    ];
    return {
      institute: definition.key,
      instituteName: definition.instituteName,
      programme: definition.programme,
      examYear: 2025,
      admissionBatch: "2026-28",
      policyVersion: definition.policyVersion,
      sourceUrl: definition.sourceUrl,
      scoreLabel: definition.scoreLabel,
      selectionStages: definition.stages,
      eligibility,
      preInterview,
      call,
      final,
      prediction,
      strengths,
      gaps,
      nextSteps,
      explanation,
    };
  };

  return { key: definition.key, evaluateEligibility, calculatePreInterview, evaluateInterviewCall, calculateFinalScore, predictSeat, predict };
}

export function modelRuntime(args: {
  values?: Record<string, RuntimeScalar>;
  callBenchmark?: number;
  finalBenchmark?: number;
  callLabel?: string;
  finalLabel?: string;
}): InstituteCycleRuntimeData {
  return {
    values: args.values ?? {},
    callBenchmark: args.callBenchmark == null ? undefined : { value: args.callBenchmark, benchmarkType: "MODEL", label: args.callLabel ?? "Mock shortlist benchmark" },
    finalBenchmark: args.finalBenchmark == null ? undefined : { value: args.finalBenchmark, benchmarkType: "MODEL", label: args.finalLabel ?? "Mock final-merit benchmark" },
    logisticSlope: 0.2,
    dataSourceType: "MODEL_ASSUMPTION",
  };
}

export function benchmarkTypeToSourceType(type: BenchmarkType): SourceType {
  if (type === "MODEL") return "MODEL_ASSUMPTION";
  if (type === "HISTORICAL") return "HISTORICAL_RTI";
  if (type === "OFFICIAL_RESULT") return "OFFICIAL_OBSERVED_RESULT";
  return "OFFICIAL_POLICY";
}

export function callStatusLabel(status: InstituteCallStatus, directMerit = false): string {
  if (directMerit && status === "ELIGIBLE_FOR_RANKING") return "ELIGIBLE FOR DIRECT MERIT";
  if (status === "PREDICTED_CALL") return "CALL PREDICTED";
  if (status === "ELIGIBLE_FOR_RANKING") return "ELIGIBLE FOR RANKING";
  if (status === "DATA_REQUIRED") return "DATA REQUIRED";
  if (status === "SPECIAL_CASE_REVIEW_REQUIRED") return "REVIEW REQUIRED";
  return "LESS LIKELY";
}
