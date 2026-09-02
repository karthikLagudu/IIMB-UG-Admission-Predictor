import type { CandidateInput, CatCutoff, ProfessionalQualification, SourceType } from "@/types/iima";
import type {
  InstituteCallResult,
  InstituteEligibilityResult,
  InstitutePredictionResult,
  InstituteScoreComponent,
  InstituteScoreResult,
} from "@/types/institutes";
import { calculateInstituteSeatPrediction } from "@/lib/institutes/prediction";
import {
  IIMB_CAT_2025_CONFIG,
  IIMB_EMPTY_RUNTIME_DATA,
  type IimbCycleRuntimeData,
  type MeanSd,
} from "./constants";

const config = IIMB_CAT_2025_CONFIG;

function addMissing(missing: string[], key: string) {
  if (!missing.includes(key)) missing.push(key);
}

function scoreComponent(args: Omit<InstituteScoreComponent, "sourceType"> & { sourceType?: InstituteScoreComponent["sourceType"] }): InstituteScoreComponent {
  return { ...args, sourceType: args.sourceType ?? "OFFICIAL_POLICY" };
}

export function standardizeIimbScore(
  value: number,
  stats: MeanSd | undefined,
  weight: number,
): number | null {
  if (!stats || !Number.isFinite(stats.mean) || !Number.isFinite(stats.sd) || stats.sd <= 0) return null;
  return Math.max(0, Math.min(weight, weight / 2 + ((value - stats.mean) / stats.sd) * weight / 6));
}

export function calculateIimbPreWorkExperience(months: number): number {
  if (months <= 0) return 0;
  if (months >= 36) return 10;
  return (10 * months) / 36;
}

export function calculateIimbPostPiWorkExperience(
  preWorkExperienceScore: number,
  qualityMultiplier: 0.25 | 0.5 | 1 | 1.5 | 2,
): number {
  return Math.min(10, preWorkExperienceScore * 0.5 * qualityMultiplier);
}

function cutoffFor(candidate: CandidateInput): CatCutoff {
  return config.catCutoffs[candidate.pwd ? "PWD" : candidate.category];
}

export function evaluateEligibility(candidate: CandidateInput): InstituteEligibilityResult {
  const cutoff = cutoffFor(candidate);
  const bachelorRequired = candidate.pwd || candidate.category === "SC" || candidate.category === "ST"
    ? config.degreeEligibility.RELAXED
    : config.degreeEligibility.STANDARD;
  const professionalRoute = config.professionalQualifications.includes(candidate.professionalQualification);
  const effectiveQualificationPercent = professionalRoute
    ? (candidate.professionalAggregatePercent ?? candidate.bachelorPercent)
    : candidate.bachelorPercent;
  const bachelorPass = effectiveQualificationPercent >= bachelorRequired;
  const overallPass = candidate.catOverallPercentile >= cutoff.overall;
  const varcPass = candidate.catVarcPercentile >= cutoff.varc;
  const dilrPass = candidate.catDilrPercentile >= cutoff.dilr;
  const qaPass = candidate.catQaPercentile >= cutoff.qa;
  const rawScoreGatePass = candidate.positiveRawVarc && candidate.positiveRawDilr && candidate.positiveRawQa;
  const failedRules: string[] = [];
  if (!bachelorPass) failedRules.push(`Bachelor/professional marks are below the required ${bachelorRequired}%.`);
  if (!overallPass) failedRules.push(`Overall CAT percentile is below ${cutoff.overall}.`);
  if (!varcPass) failedRules.push(`VARC percentile is below ${cutoff.varc}.`);
  if (!dilrPass) failedRules.push(`DILR percentile is below ${cutoff.dilr}.`);
  if (!qaPass) failedRules.push(`QA percentile is below ${cutoff.qa}.`);
  if (!rawScoreGatePass) failedRules.push("Every CAT section must have a positive raw score.");
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
}

function standardizedComponent(args: {
  key: string;
  label: string;
  value: number;
  stats: MeanSd | undefined;
  weight: number;
  formula: string;
  detail: string;
  missingKey: string;
  missing: string[];
  sourceType?: SourceType;
}): InstituteScoreComponent {
  const score = standardizeIimbScore(args.value, args.stats, args.weight);
  if (score == null) addMissing(args.missing, args.missingKey);
  return scoreComponent({
    key: args.key,
    label: args.label,
    score,
    maxScore: args.weight,
    status: score == null ? "DATA_REQUIRED" : "CALCULATED",
    formula: args.formula,
    detail: score == null ? `${args.detail} The qualifying-pool mean and SD are required.` : args.detail,
    sourceType: args.sourceType,
  });
}

function catComponents(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData,
  weights: { VARC: number; DILR: number; QA: number },
  missing: string[],
): InstituteScoreComponent[] {
  const values = {
    VARC: candidate.catVarcScaledScore,
    DILR: candidate.catDilrScaledScore,
    QA: candidate.catQaScaledScore,
  };
  return (Object.keys(weights) as Array<keyof typeof weights>).map((section) => standardizedComponent({
    key: `cat_${section.toLowerCase()}`,
    label: `CAT ${section}`,
    value: values[section],
    stats: runtime.catSectionStats?.[section],
    weight: weights[section],
    formula: `Std(${section} scaled score, mean, SD, ${weights[section]})`,
    detail: `${section} is standardized within the qualifying first-shortlist population.`,
    missingKey: `cat_section_stats:${section}`,
    missing,
    sourceType: runtime.dataSourceType,
  }));
}

function boardComponent(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData,
  level: "10" | "12",
  weight: number,
  missing: string[],
): InstituteScoreComponent {
  const board = level === "10" ? candidate.class10Board : candidate.class12Board;
  const percentage = level === "10" ? candidate.class10Percent : candidate.class12Percent;
  const label = `Class ${level}`;
  if (!board) {
    addMissing(missing, `candidate_input:class${level}Board`);
    return scoreComponent({
      key: `class${level}`,
      label,
      score: null,
      maxScore: weight,
      status: "DATA_REQUIRED",
      formula: `Std(percentage / board p90, mean, SD, ${weight})`,
      detail: "Select the applicable board before this component can be calculated.",
    });
  }
  const p90 = runtime.boardPercentile90?.[level]?.[board];
  if (p90 == null || p90 <= 0) {
    addMissing(missing, `board_percentile_90:${board}:${level}`);
    return scoreComponent({
      key: `class${level}`,
      label,
      score: null,
      maxScore: weight,
      status: "DATA_REQUIRED",
      formula: `Std(percentage / board p90, mean, SD, ${weight})`,
      detail: `The CAT 2025 applicant-pool 90th percentile for ${board} Class ${level} is not configured.`,
    });
  }
  return standardizedComponent({
    key: `class${level}`,
    label,
    value: percentage / p90,
    stats: runtime.boardAdjustedStats?.[level],
    weight,
    formula: `Std(${percentage.toFixed(2)} / ${p90.toFixed(2)}, mean, SD, ${weight})`,
    detail: `Board-adjusted score uses the configured ${board} 90th-percentile value.`,
    missingKey: `board_adjusted_stats:${level}`,
    missing,
    sourceType: runtime.dataSourceType,
  });
}

function bachelorComponent(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData,
  weight: number,
  missing: string[],
): InstituteScoreComponent {
  const discipline = candidate.iimbAcademicDiscipline;
  if (!discipline) {
    addMissing(missing, "candidate_input:iimbAcademicDiscipline");
    return scoreComponent({
      key: "bachelor",
      label: "Bachelor's",
      score: null,
      maxScore: weight,
      status: "DATA_REQUIRED",
      formula: `Std(bachelor %, discipline mean, SD, ${weight})`,
      detail: "Select the IIMB academic-discipline pool.",
    });
  }
  return standardizedComponent({
    key: "bachelor",
    label: "Bachelor's",
    value: candidate.bachelorPercent,
    stats: runtime.bachelorStats?.[discipline],
    weight,
    formula: `Std(${candidate.bachelorPercent.toFixed(2)}, ${discipline} mean, SD, ${weight})`,
    detail: "Bachelor marks are standardized within the configured academic-discipline pool.",
    missingKey: `bachelor_stats:${discipline}`,
    missing,
    sourceType: runtime.dataSourceType,
  });
}

function professionalScore(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData,
  weight: number,
  missing: string[],
): number | null {
  const qualification = candidate.professionalQualification;
  if (!config.professionalQualifications.includes(qualification)) return null;
  const raw = candidate.professionalAggregatePercent ?? candidate.bachelorPercent;
  const score = standardizeIimbScore(raw, runtime.professionalStats?.[qualification], weight);
  if (score == null) addMissing(missing, `professional_stats:${qualification}`);
  return score;
}

function workProfessionalComponent(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData,
  mode: "PRE" | "FINAL",
  missing: string[],
): InstituteScoreComponent {
  const preWorkScore = calculateIimbPreWorkExperience(candidate.workExperienceMonths);
  let workScore: number | null = preWorkScore;
  if (mode === "FINAL") {
    const quality = candidate.iimbWorkExperienceQuality;
    if (preWorkScore === 0) {
      workScore = 0;
    } else if (quality == null) {
      addMissing(missing, "candidate_input:iimbWorkExperienceQuality");
      workScore = null;
    } else {
      workScore = calculateIimbPostPiWorkExperience(preWorkScore, quality);
    }
  }
  const professional = professionalScore(candidate, runtime, 10, missing);
  const hasProfessional = config.professionalQualifications.includes(candidate.professionalQualification);
  const score = hasProfessional
    ? (professional == null || workScore == null ? null : Math.max(workScore, professional))
    : workScore;
  return scoreComponent({
    key: "work_professional",
    label: "Work experience / professional course",
    score,
    maxScore: 10,
    status: score == null ? "DATA_REQUIRED" : "CALCULATED",
    formula: mode === "PRE"
      ? "max(WE_pre, standardized professional score)"
      : "max(WE_pre x 0.5 x quality, standardized professional score)",
    detail: hasProfessional
      ? "The higher applicable work-experience or professional-course score is used; they are never added."
      : `Eligible work experience contributes ${score?.toFixed(2) ?? "an unavailable"} points.`,
    sourceType: hasProfessional ? runtime.dataSourceType : undefined,
  });
}

function genderComponent(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData,
  missing: string[],
): InstituteScoreComponent {
  if (!runtime.genderDiversityEligible) {
    addMissing(missing, "gender_diversity_eligible_mapping");
    return scoreComponent({
      key: "gender",
      label: "Gender diversity",
      score: null,
      maxScore: 5,
      status: "DATA_REQUIRED",
      formula: "Cycle-configured eligible gender mapping",
      detail: "The policy names this component but the supplied material does not define the eligible-gender mapping.",
    });
  }
  const score = runtime.genderDiversityEligible.includes(candidate.gender) ? 5 : 0;
  return scoreComponent({
    key: "gender",
    label: "Gender diversity",
    score,
    maxScore: 5,
    status: "CALCULATED",
    formula: "5 if the cycle-configured mapping applies; otherwise 0",
    detail: "Gender diversity applies only at the pre-PI stage.",
    sourceType: runtime.dataSourceType,
  });
}

function resultFromComponents(components: InstituteScoreComponent[], maxScore: number, missing: string[]): InstituteScoreResult {
  const complete = components.every((component) => component.score != null);
  return {
    status: complete ? "CALCULATED" : "DATA_REQUIRED",
    score: complete ? components.reduce((sum, component) => sum + (component.score ?? 0), 0) : null,
    maxScore,
    components,
    missingRuntimeData: missing,
  };
}

export function calculatePreInterview(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData = IIMB_EMPTY_RUNTIME_DATA,
): InstituteScoreResult {
  if (!evaluateEligibility(candidate).passed) {
    return { status: "NOT_REACHED", score: null, maxScore: 100, components: [], missingRuntimeData: [] };
  }
  const missing: string[] = [];
  const components = [
    ...catComponents(candidate, runtime, config.preInterviewWeights.cat, missing),
    boardComponent(candidate, runtime, "10", 10, missing),
    boardComponent(candidate, runtime, "12", 10, missing),
    bachelorComponent(candidate, runtime, 10, missing),
    workProfessionalComponent(candidate, runtime, "PRE", missing),
    genderComponent(candidate, runtime, missing),
  ];
  return resultFromComponents(components, 100, missing);
}

export function evaluateInterviewCall(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData = IIMB_EMPTY_RUNTIME_DATA,
  preInterview = calculatePreInterview(candidate, runtime),
): InstituteCallResult {
  const eligibility = evaluateEligibility(candidate);
  if (!eligibility.passed) {
    return { status: "NO_CALL", officialMinimumsPassed: false, benchmarkType: "NONE", benchmarkValue: null, margin: null, reason: "One or more official eligibility/CAT hard gates failed." };
  }
  if (candidate.iimbAutomaticPiQualification === "QUALIFIED") {
    return { status: "PREDICTED_CALL", officialMinimumsPassed: true, benchmarkType: "OFFICIAL_RESULT", benchmarkValue: null, margin: null, reason: "An external/admin flag confirms an official top-10 automatic PI route. The rank was not guessed by this application." };
  }
  if (preInterview.status === "DATA_REQUIRED") {
    return { status: "DATA_REQUIRED", officialMinimumsPassed: true, benchmarkType: "NONE", benchmarkValue: null, margin: null, reason: "Official minimums pass, but the pre-PI score needs non-public normalization data." };
  }
  if (runtime.callBenchmark && preInterview.score != null) {
    const margin = preInterview.score - runtime.callBenchmark.value;
    return {
      status: margin >= 0 ? "PREDICTED_CALL" : "NO_CALL",
      officialMinimumsPassed: true,
      benchmarkType: runtime.callBenchmark.benchmarkType,
      benchmarkValue: runtime.callBenchmark.value,
      margin,
      reason: `${runtime.callBenchmark.label} is used as a clearly labelled ${runtime.callBenchmark.benchmarkType.toLowerCase()} comparison, not a permanent official cutoff.`,
    };
  }
  return { status: "ELIGIBLE_FOR_RANKING", officialMinimumsPassed: true, benchmarkType: "NONE", benchmarkValue: null, margin: null, reason: "The official pre-PI score is available, but IIMB does not publish one fixed current-cycle call cutoff in advance." };
}

export function calculateFinalScore(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData = IIMB_EMPTY_RUNTIME_DATA,
): InstituteScoreResult {
  if (!evaluateEligibility(candidate).passed) {
    return { status: "NOT_REACHED", score: null, maxScore: 100, components: [], missingRuntimeData: [] };
  }
  const missing: string[] = [];
  const pi = candidate.normalizedPi != null && candidate.normalizedPi >= 0 && candidate.normalizedPi <= 1
    ? candidate.normalizedPi * 40
    : null;
  const wat = candidate.normalizedAwt != null && candidate.normalizedAwt >= 0 && candidate.normalizedAwt <= 1
    ? candidate.normalizedAwt * 10
    : null;
  if (pi == null) addMissing(missing, "candidate_input:normalizedPi_0_to_1");
  if (wat == null) addMissing(missing, "candidate_input:normalizedAwt_0_to_1");
  const components: InstituteScoreComponent[] = [
    scoreComponent({ key: "pi", label: "Personal Interview", score: pi, maxScore: 40, status: pi == null ? "DATA_REQUIRED" : "CALCULATED", formula: "Normalized PI x 40", detail: "PI is the largest final-selection component." }),
    scoreComponent({ key: "wat", label: "Written Ability Test", score: wat, maxScore: 10, status: wat == null ? "DATA_REQUIRED" : "CALCULATED", formula: "Normalized WAT x 10", detail: "WAT is evaluated on content and writing style." }),
    ...catComponents(candidate, runtime, config.finalWeights.cat, missing),
    boardComponent(candidate, runtime, "10", 5, missing),
    boardComponent(candidate, runtime, "12", 5, missing),
    bachelorComponent(candidate, runtime, 5, missing),
    workProfessionalComponent(candidate, runtime, "FINAL", missing),
  ];
  return resultFromComponents(components, 100, missing);
}

export function predictSeat(
  eligibility: InstituteEligibilityResult,
  call: InstituteCallResult,
  finalScore: InstituteScoreResult,
  runtime: IimbCycleRuntimeData = IIMB_EMPTY_RUNTIME_DATA,
) {
  return calculateInstituteSeatPrediction({
    eligibilityGate: eligibility.passed,
    callGate: call.status === "PREDICTED_CALL",
    finalScore: finalScore.score,
    benchmark: runtime.finalBenchmark,
    logisticSlope: runtime.logisticSlope,
  });
}

export function explainResult(args: {
  eligibility: InstituteEligibilityResult;
  preInterview: InstituteScoreResult;
  call: InstituteCallResult;
  final: InstituteScoreResult;
}): string[] {
  const usesModelNormalization = args.preInterview.components.some((component) => component.sourceType === "MODEL_ASSUMPTION");
  const lines = args.eligibility.passed
    ? ["Official degree and CAT first-shortlist minimums are satisfied."]
    : args.eligibility.failedRules;
  if (args.preInterview.status === "DATA_REQUIRED") {
    lines.push(`Pre-PI score is not estimated because ${args.preInterview.missingRuntimeData.length} required normalization inputs are missing.`);
  } else if (args.preInterview.score != null) {
    lines.push(usesModelNormalization
      ? `Test-model pre-PI estimate: ${args.preInterview.score.toFixed(2)} / 100. The official formula is used with synthetic normalization inputs.`
      : `Official pre-PI score: ${args.preInterview.score.toFixed(2)} / 100.`);
  }
  lines.push(args.call.reason);
  if (args.final.status === "DATA_REQUIRED") lines.push("Final score remains incomplete until all post-PI and normalization inputs are available.");
  if (args.final.score != null) lines.push(`Official post-PI composite: ${args.final.score.toFixed(2)} / 100.`);
  return lines;
}

export function predictIimbAdmission(
  candidate: CandidateInput,
  runtime: IimbCycleRuntimeData = IIMB_EMPTY_RUNTIME_DATA,
): InstitutePredictionResult {
  const eligibility = evaluateEligibility(candidate);
  const preInterview = calculatePreInterview(candidate, runtime);
  const call = evaluateInterviewCall(candidate, runtime, preInterview);
  const final = calculateFinalScore(candidate, runtime);
  const prediction = predictSeat(eligibility, call, final, runtime);
  const strengths: string[] = [];
  const gaps: string[] = [];
  const usesModelNormalization = preInterview.components.some((component) => component.sourceType === "MODEL_ASSUMPTION");
  if (eligibility.passed) strengths.push("All official IIMB degree and CAT minimums are satisfied.");
  else gaps.push(...eligibility.failedRules);
  const workScore = calculateIimbPreWorkExperience(candidate.workExperienceMonths);
  strengths.push(`Eligible work experience contributes ${workScore.toFixed(2)} / 10 before PI.`);
  if (preInterview.status === "DATA_REQUIRED") gaps.push("Normalization data required: the official pre-PI total cannot be calculated from public candidate inputs alone.");
  if (usesModelNormalization) gaps.push("Testing estimate only: synthetic normalization inputs and model benchmarks are being used, not IIMB applicant-pool statistics.");
  if (call.status === "ELIGIBLE_FOR_RANKING") gaps.push("No fixed current-cycle IIMB call boundary is published; the score can only be ranked against the actual applicant pool.");
  const nextSteps = usesModelNormalization
    ? ["Replace the synthetic testing fixture with actual cycle normalization data before treating the result as a real-candidate estimate."]
    : preInterview.missingRuntimeData.length
    ? ["Provide the listed IIMB board, qualifying-pool and discipline normalization datasets through cycle configuration."]
    : ["Use an actual call outcome or a clearly labelled benchmark before calculating seat probability."];
  return {
    institute: "IIMB",
    instituteName: config.instituteName,
    programme: config.programme,
    examYear: config.examYear,
    admissionBatch: config.admissionBatch,
    policyVersion: config.policyVersion,
    sourceUrl: "https://www.iimb.ac.in/sites/default/files/inline-files/PGP-2026-admissions-process.pdf",
    scoreLabel: "Pre-PI estimate",
    selectionStages: { interview: true, wat: true, groupDiscussion: false, directMerit: false },
    eligibility,
    preInterview,
    call,
    final,
    prediction,
    strengths,
    gaps,
    nextSteps,
    explanation: explainResult({ eligibility, preInterview, call, final }),
  };
}

export type { IimbCycleRuntimeData } from "./constants";
export type { ProfessionalQualification };
