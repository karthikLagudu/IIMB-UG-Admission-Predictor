import type { CandidateInput, CatCutoff, IimcAcademicProfile } from "@/types/iima";
import type {
  InstituteCallResult,
  InstituteEligibilityResult,
  InstitutePredictionResult,
  InstituteScoreComponent,
  InstituteScoreResult,
} from "@/types/institutes";
import { calculateInstituteSeatPrediction } from "@/lib/institutes/prediction";
import {
  IIMC_CAT_2025_CONFIG,
  IIMC_EMPTY_CYCLE_DATA,
  type IimcCycleData,
} from "./constants";

const config = IIMC_CAT_2025_CONFIG;

function scoreComponent(args: Omit<InstituteScoreComponent, "sourceType">): InstituteScoreComponent {
  return { sourceType: "OFFICIAL_POLICY", ...args };
}

function cutoffFor(candidate: CandidateInput): CatCutoff {
  return config.catCutoffs[candidate.pwd ? "PWD" : candidate.category];
}

export function iimcClass10Points(percentage: number): number {
  if (percentage >= 80) return 10;
  if (percentage >= 75) return 8;
  if (percentage >= 70) return 6;
  if (percentage >= 65) return 4;
  if (percentage >= 60) return 2;
  return 0;
}

export function iimcClass12Points(percentage: number): number {
  if (percentage >= 80) return 15;
  if (percentage >= 75) return 12;
  if (percentage >= 70) return 9;
  if (percentage >= 65) return 6;
  if (percentage >= 60) return 3;
  return 0;
}

export function calculateIimcWorkExperience(months: number): number {
  if (months <= 6) return 0;
  if (months <= 24) return months / 3;
  if (months <= 36) return 8;
  if (months <= 48) return 26 - months / 2;
  return 2;
}

export function iimcAcademicDiversityPoints(profile: IimcAcademicProfile): number {
  return config.academicDiversityPoints[profile];
}

export function evaluateEligibility(candidate: CandidateInput): InstituteEligibilityResult {
  const cutoff = cutoffFor(candidate);
  const bachelorRequired = candidate.pwd || candidate.category === "SC" || candidate.category === "ST"
    ? config.degreeEligibility.RELAXED
    : config.degreeEligibility.STANDARD;
  const bachelorPass = candidate.bachelorPercent >= bachelorRequired;
  const overallPass = candidate.catOverallPercentile >= cutoff.overall;
  const varcPass = candidate.catVarcPercentile >= cutoff.varc;
  const dilrPass = candidate.catDilrPercentile >= cutoff.dilr;
  const qaPass = candidate.catQaPercentile >= cutoff.qa;
  const rawScoreGatePass = candidate.positiveRawVarc && candidate.positiveRawDilr && candidate.positiveRawQa;
  const failedRules: string[] = [];
  if (!bachelorPass) failedRules.push(`Bachelor marks are below the required ${bachelorRequired}%.`);
  if (!overallPass) failedRules.push(`Overall CAT percentile is below ${cutoff.overall}.`);
  if (!varcPass) failedRules.push(`VARC percentile is below ${cutoff.varc}.`);
  if (!dilrPass) failedRules.push(`DILR percentile is below ${cutoff.dilr}.`);
  if (!qaPass) failedRules.push(`QA percentile is below ${cutoff.qa}.`);
  if (!rawScoreGatePass) failedRules.push("Every CAT section must have a non-negative raw score.");
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

export function calculatePreInterview(candidate: CandidateInput): InstituteScoreResult {
  if (!evaluateEligibility(candidate).passed) {
    return { status: "NOT_REACHED", score: null, maxScore: 85, components: [], missingRuntimeData: [] };
  }
  const cat = (candidate.catOverallScaledScore / config.catMaxPossibleTotal) * 56;
  const class10 = iimcClass10Points(candidate.class10Percent);
  const class12 = iimcClass12Points(candidate.class12Percent);
  const gender = candidate.gender === "FEMALE" || candidate.gender === "TRANSGENDER" ? 4 : 0;
  const components: InstituteScoreComponent[] = [
    scoreComponent({ key: "cat", label: "CAT 2025", score: cat, maxScore: 56, status: "CALCULATED", formula: `(${candidate.catOverallScaledScore.toFixed(2)} / ${config.catMaxPossibleTotal}) x 56`, detail: "Uses CAT total overall scaled score, not percentile." }),
    scoreComponent({ key: "class10", label: "Class 10", score: class10, maxScore: 10, status: "CALCULATED", formula: "Official Class 10 slab table", detail: `${candidate.class10Percent.toFixed(2)}% maps to ${class10} points.` }),
    scoreComponent({ key: "class12", label: "Class 12", score: class12, maxScore: 15, status: "CALCULATED", formula: "Official Class 12 slab table", detail: `${candidate.class12Percent.toFixed(2)}% maps to ${class12} points.` }),
    scoreComponent({ key: "gender", label: "Gender diversity", score: gender, maxScore: 4, status: "CALCULATED", formula: "4 for female/transgender; otherwise 0", detail: `${gender} points apply to the selected gender category.` }),
  ];
  return {
    status: "CALCULATED",
    score: components.reduce((sum, component) => sum + (component.score ?? 0), 0),
    maxScore: 85,
    components,
    missingRuntimeData: [],
  };
}

export function evaluateInterviewCall(
  candidate: CandidateInput,
  cycleData: IimcCycleData = IIMC_EMPTY_CYCLE_DATA,
  preInterview = calculatePreInterview(candidate),
): InstituteCallResult {
  const eligibility = evaluateEligibility(candidate);
  if (!eligibility.passed) {
    return { status: "NO_CALL", officialMinimumsPassed: false, benchmarkType: "NONE", benchmarkValue: null, margin: null, reason: "One or more official Stage-I hard gates failed." };
  }
  if (cycleData.callBenchmark && preInterview.score != null) {
    const margin = preInterview.score - cycleData.callBenchmark.value;
    return {
      status: margin >= 0 ? "PREDICTED_CALL" : "NO_CALL",
      officialMinimumsPassed: true,
      benchmarkType: cycleData.callBenchmark.benchmarkType,
      benchmarkValue: cycleData.callBenchmark.value,
      margin,
      reason: `${cycleData.callBenchmark.label} is a ${cycleData.callBenchmark.benchmarkType.toLowerCase()} comparison, not the permanent Stage-II policy cutoff.`,
    };
  }
  return {
    status: "ELIGIBLE_FOR_RANKING",
    officialMinimumsPassed: true,
    benchmarkType: "NONE",
    benchmarkValue: null,
    margin: null,
    reason: "Stage-I passes and the official 85-point score is calculated. IIMC sets category-wise Stage-II cutoffs after seeing the applicant pool, so no call decision is invented.",
  };
}

export function calculateFinalScore(candidate: CandidateInput): InstituteScoreResult {
  if (!evaluateEligibility(candidate).passed) {
    return { status: "NOT_REACHED", score: null, maxScore: 100, components: [], missingRuntimeData: [] };
  }
  const missing: string[] = [];
  const pi = candidate.normalizedPi != null && candidate.normalizedPi >= 0 && candidate.normalizedPi <= 1
    ? candidate.normalizedPi * 48
    : null;
  const wat = candidate.normalizedAwt != null && candidate.normalizedAwt >= 0 && candidate.normalizedAwt <= 1
    ? candidate.normalizedAwt * 8
    : null;
  const profile = candidate.iimcAcademicProfile;
  const diversity = profile ? iimcAcademicDiversityPoints(profile) : null;
  if (pi == null) missing.push("candidate_input:normalizedPi_0_to_1");
  if (wat == null) missing.push("candidate_input:normalizedAwt_0_to_1");
  if (!profile) missing.push("candidate_input:iimcAcademicProfile");
  const cat = (candidate.catOverallScaledScore / config.catMaxPossibleTotal) * 30;
  const work = calculateIimcWorkExperience(candidate.workExperienceMonths);
  const components: InstituteScoreComponent[] = [
    scoreComponent({ key: "cat", label: "CAT 2025", score: cat, maxScore: 30, status: "CALCULATED", formula: `(${candidate.catOverallScaledScore.toFixed(2)} / ${config.catMaxPossibleTotal}) x 30`, detail: "Final CAT weight uses the same scaled-score basis as the shortlist formula." }),
    scoreComponent({ key: "pi", label: "Personal Interview", score: pi, maxScore: 48, status: pi == null ? "DATA_REQUIRED" : "CALCULATED", formula: "Normalized PI x 48", detail: "Requires a normalized PI value between 0 and 1." }),
    scoreComponent({ key: "wat", label: "Written Ability Test", score: wat, maxScore: 8, status: wat == null ? "DATA_REQUIRED" : "CALCULATED", formula: "Normalized WAT x 8", detail: "Requires a normalized WAT value between 0 and 1." }),
    scoreComponent({ key: "academic_diversity", label: "Academic diversity", score: diversity, maxScore: 6, status: diversity == null ? "DATA_REQUIRED" : "CALCULATED", formula: "Official academic-profile category table", detail: profile ? `Academic profile ${profile} receives ${diversity} points.` : "Select the matching academic profile category." }),
    scoreComponent({ key: "work_experience", label: "Work experience", score: work, maxScore: 8, status: "CALCULATED", formula: "Official completed-month piecewise function", detail: `${candidate.workExperienceMonths} eligible months produce ${work.toFixed(2)} points.` }),
  ];
  const complete = components.every((component) => component.score != null);
  return {
    status: complete ? "CALCULATED" : "DATA_REQUIRED",
    score: complete ? components.reduce((sum, component) => sum + (component.score ?? 0), 0) : null,
    maxScore: 100,
    components,
    missingRuntimeData: missing,
  };
}

export function predictSeat(
  eligibility: InstituteEligibilityResult,
  call: InstituteCallResult,
  finalScore: InstituteScoreResult,
  cycleData: IimcCycleData = IIMC_EMPTY_CYCLE_DATA,
) {
  return calculateInstituteSeatPrediction({
    eligibilityGate: eligibility.passed,
    callGate: call.status === "PREDICTED_CALL",
    finalScore: finalScore.score,
    benchmark: cycleData.finalBenchmark,
    logisticSlope: cycleData.logisticSlope,
  });
}

export function explainResult(args: {
  eligibility: InstituteEligibilityResult;
  preInterview: InstituteScoreResult;
  call: InstituteCallResult;
  final: InstituteScoreResult;
}): string[] {
  const lines = args.eligibility.passed
    ? ["Official bachelor and CAT Stage-I minimums are satisfied."]
    : args.eligibility.failedRules;
  if (args.preInterview.score != null) lines.push(`Official PI/WAT shortlist score: ${args.preInterview.score.toFixed(2)} / 85.`);
  lines.push(args.call.reason);
  if (args.final.score != null) lines.push(`Official final-selection composite: ${args.final.score.toFixed(2)} / 100.`);
  if (args.final.status === "DATA_REQUIRED") lines.push("The final score needs the missing interview or academic-profile input; no missing value is treated as zero.");
  return lines;
}

export function predictIimcAdmission(
  candidate: CandidateInput,
  cycleData: IimcCycleData = IIMC_EMPTY_CYCLE_DATA,
): InstitutePredictionResult {
  const eligibility = evaluateEligibility(candidate);
  const preInterview = calculatePreInterview(candidate);
  const call = evaluateInterviewCall(candidate, cycleData, preInterview);
  const final = calculateFinalScore(candidate);
  const prediction = predictSeat(eligibility, call, final, cycleData);
  const strengths: string[] = [];
  const gaps: string[] = [];
  if (eligibility.passed) strengths.push("All official IIMC bachelor and CAT Stage-I minimums are satisfied.");
  else gaps.push(...eligibility.failedRules);
  if (preInterview.score != null) strengths.push(`Official shortlist composite is ${preInterview.score.toFixed(2)} / 85.`);
  if (call.status === "ELIGIBLE_FOR_RANKING") gaps.push("The current category-wise Stage-II cutoff is not published in advance, so the application correctly stops at eligible for ranking.");
  if (call.benchmarkType === "MODEL") gaps.push("Testing estimate only: the interview-call and final benchmarks are mock-mode planning assumptions, not published IIMC cutoffs.");
  if (final.status === "DATA_REQUIRED") gaps.push("Final score needs the missing PI, WAT or academic-diversity input.");
  const nextSteps = call.benchmarkType === "MODEL"
    ? ["Use the percentage as a testing estimate only; replace the model benchmarks with an actual call outcome or verified cycle data when available."]
    : call.status === "ELIGIBLE_FOR_RANKING"
      ? ["Use the actual interview-call outcome or add a clearly labelled current/historical benchmark before estimating a call or seat chance."]
      : ["Address the listed hard-gate deficit before later-stage scoring matters."];
  return {
    institute: "IIMC",
    instituteName: config.instituteName,
    programme: config.programme,
    examYear: config.examYear,
    admissionBatch: config.admissionBatch,
    policyVersion: config.policyVersion,
    sourceUrl: "https://www.iimcal.ac.in/programs/pgp/admission/admission-policy/admission-procedure-for-domestic-candidates",
    scoreLabel: "PI/WAT shortlist score",
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

export type { IimcCycleData } from "./constants";
