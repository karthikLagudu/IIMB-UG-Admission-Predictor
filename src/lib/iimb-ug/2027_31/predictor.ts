import type {
  AcademicWeightingStrategy,
  CalculationMode,
  FinalTestStrategy,
  IimbUgCandidateInput,
  IimbUgPolicyConfig,
  IimbUgPredictionResult,
  IimbUgRuntimeData,
  TestWeightingStrategy,
} from "@/types/iimb-ug";
import { IIMB_UG_ASSUMPTIONS, IIMB_UG_SOURCES } from "./sources";
import { EMPTY_IIMB_UG_RUNTIME_DATA, IIMB_UG_2027_POLICY } from "./policy";
import { calculateAcademicEligibility, calculateAgeEligibility, calculateClass12Eligibility } from "./eligibility";
import { calculateExamSection, calculateTotalRawScore, evaluatePositiveSectionGate } from "./exam-score";
import { evaluateHistoricalShortlist } from "./historical-cutoff";
import { calculatePrePi } from "./prepi";
import { calculatePostPi } from "./postpi";
import { calculateRequiredPi } from "./pi-solver";
import { calculateSensitivity } from "./sensitivity";
import { evaluateProgrammePreference } from "./programme-allocation";
import { calculateApplicationReadiness } from "./readiness";
import { IIMB_UG_PROBABILITY_DISABLED } from "./probability";
import { buildWarnings } from "./diagnostics";

function runtimeCategory(candidate: Pick<IimbUgCandidateInput, "category" | "pwd">) {
  return candidate.pwd ? "PWD" as const : candidate.category;
}

function resolveStrategies(args: {
  mode: CalculationMode;
  policy: IimbUgPolicyConfig;
  testWeightingStrategy?: TestWeightingStrategy;
  academicWeightingStrategy?: AcademicWeightingStrategy;
  finalTestStrategy?: FinalTestStrategy;
}) {
  return {
    test: args.testWeightingStrategy ?? (args.mode === "EXACT" ? "IIMB_STYLE_STANDARDIZATION" : args.policy.prePi.defaultTestStrategy),
    academic: args.academicWeightingStrategy ?? (args.mode === "EXACT" ? "IIMB_STYLE_STANDARDIZATION" : args.policy.prePi.defaultAcademicStrategy),
    finalTest: args.finalTestStrategy ?? (args.mode === "EXACT" ? "DATA_REQUIRED" : args.policy.postPi.defaultTestStrategy),
  };
}

function callOutlook(args: {
  eligible: boolean;
  positiveGate: boolean | null;
  historical: ReturnType<typeof evaluateHistoricalShortlist>;
  minimum: number | null;
  maximum: number | null;
  candidate: IimbUgCandidateInput;
  runtime: IimbUgRuntimeData;
}) {
  if (!args.eligible) return { label: "INELIGIBLE" as const, benchmark: null, gapMinimum: null, gapMaximum: null, explanation: "The primary current-cycle eligibility interpretation is not satisfied." };
  if (args.positiveGate === false) return { label: "SECTION_GATE_FAILED" as const, benchmark: null, gapMinimum: null, gapMaximum: null, explanation: "At least one section has a non-positive raw score; zero fails the first-shortlist gate." };
  if (args.historical.status === "FAIL") return { label: "BELOW_HISTORICAL_FIRST_SHORTLIST" as const, benchmark: null, gapMinimum: null, gapMaximum: null, explanation: "The profile does not clear every previous-cycle first-shortlist condition." };
  const benchmark = args.runtime.callBenchmark?.[runtimeCategory(args.candidate)] ?? null;
  if (benchmark == null) {
    return {
      label: "CURRENT_THRESHOLD_UNKNOWN" as const,
      benchmark: null,
      gapMinimum: null,
      gapMaximum: null,
      explanation: args.historical.status === "PASS"
        ? "The previous first-shortlist benchmark is cleared, but the current 2027 category-wise PI-call threshold is unavailable."
        : "The current 2027 PI-call threshold is unavailable and the historical comparison is incomplete.",
    };
  }
  if (args.minimum == null || args.maximum == null) return { label: "DATA_INSUFFICIENT" as const, benchmark, gapMinimum: null, gapMaximum: null, explanation: "The current benchmark is configured, but the candidate's Pre-PI score is incomplete." };
  const gapMinimum = args.minimum - benchmark;
  const gapMaximum = args.maximum - benchmark;
  const label = gapMinimum >= 5
    ? "STRONG_ESTIMATE" as const
    : gapMinimum >= 0
      ? "COMPETITIVE_ESTIMATE" as const
      : gapMaximum >= 0
        ? "BORDERLINE_ESTIMATE" as const
        : "DATA_INSUFFICIENT" as const;
  return {
    label,
    benchmark,
    gapMinimum,
    gapMaximum,
    explanation: "Planning comparison against an administrator-configured current benchmark; category ranking and applicant-pool effects still apply.",
  };
}

export function predictIimbUgAdmission(
  candidate: IimbUgCandidateInput,
  options: {
    policy?: IimbUgPolicyConfig;
    runtime?: IimbUgRuntimeData;
    calculationMode?: CalculationMode;
    targetFinalComposite?: number;
    testWeightingStrategy?: TestWeightingStrategy;
    academicWeightingStrategy?: AcademicWeightingStrategy;
    finalTestStrategy?: FinalTestStrategy;
  } = {},
): IimbUgPredictionResult {
  const policy = options.policy ?? IIMB_UG_2027_POLICY;
  const runtime = options.runtime ?? EMPTY_IIMB_UG_RUNTIME_DATA;
  const mode = options.calculationMode ?? "PLANNING";
  const strategies = resolveStrategies({
    mode,
    policy,
    testWeightingStrategy: options.testWeightingStrategy,
    academicWeightingStrategy: options.academicWeightingStrategy,
    finalTestStrategy: options.finalTestStrategy,
  });

  const age = calculateAgeEligibility(candidate.dateOfBirth, policy);
  const academics = calculateAcademicEligibility(candidate, policy);
  const class12 = calculateClass12Eligibility(candidate);
  const hardEligible = age.status === "PASS" && academics.primaryEligibility;
  const eligibilityStatus = !hardEligible
    ? "INELIGIBLE" as const
    : class12.status === "PROVISIONAL"
      ? "PROVISIONALLY_ELIGIBLE" as const
      : "ELIGIBLE" as const;

  const varc = calculateExamSection("VARC", candidate, policy);
  const lr = calculateExamSection("LR", candidate, policy);
  const qadi = calculateExamSection("QADI", candidate, policy);
  const sections = { varc, lr, qadi };
  const totals = calculateTotalRawScore([varc, lr, qadi]);
  const positiveGate = evaluatePositiveSectionGate([varc, lr, qadi]);
  const historicalShortlist = evaluateHistoricalShortlist({
    candidate,
    totalCanonical: totals.totalCanonical,
    positiveSectionGate: positiveGate,
    policy,
  });
  const prePi = calculatePrePi({
    candidate,
    sections,
    policy,
    runtime,
    testStrategy: strategies.test,
    academicStrategy: strategies.academic,
  });
  const outlook = callOutlook({
    eligible: hardEligible,
    positiveGate,
    historical: historicalShortlist,
    minimum: prePi.minimum,
    maximum: prePi.maximum,
    candidate,
    runtime,
  });
  const postPi = calculatePostPi({
    candidate,
    totalCanonical: totals.totalCanonical,
    prePiTest70: prePi.test70,
    policy,
    runtime,
    academicStrategy: strategies.academic,
    testStrategy: strategies.finalTest,
  });
  const requiredPi = calculateRequiredPi(
    options.targetFinalComposite ?? 70,
    postPi.fixedMinimum,
    policy.postPi.weights.pi,
  );
  const result: IimbUgPredictionResult = {
    policy: { policyId: policy.policyId, cycle: policy.admissionCycle, mode },
    eligibility: { status: eligibilityStatus, age, class12, academics },
    exam: { ...sections, ...totals, positiveGate },
    historicalShortlist,
    prePi,
    callOutlook: outlook,
    postPi,
    requiredPi,
    sensitivity: calculateSensitivity(policy),
    programmePreference: evaluateProgrammePreference(candidate, runtime),
    readiness: calculateApplicationReadiness(candidate, {
      agePass: age.status === "PASS",
      academicsPass: academics.primaryEligibility,
    }),
    probability: IIMB_UG_PROBABILITY_DISABLED,
    warnings: [],
    assumptions: [...IIMB_UG_ASSUMPTIONS],
    sources: IIMB_UG_SOURCES,
  };
  result.warnings = buildWarnings(result);
  return result;
}

export const SAMPLE_IIMB_UG_CANDIDATE: IimbUgCandidateInput = {
  targetProgrammes: ["DATA_SCIENCES", "ECONOMICS"],
  firstPreference: "DATA_SCIENCES",
  secondPreference: "ECONOMICS",
  dateOfBirth: "2007-04-10",
  category: "GENERAL",
  pwd: false,
  gender: "MALE",
  genderDiversityEligibility: "UNKNOWN",
  class10Board: "CBSE",
  class10OverallPercent: 93,
  class10MathPercent: 96,
  studiedMathClass11: true,
  studiedMathClass12: true,
  class12Status: "APPEARING",
  class12Board: "CBSE",
  varcCorrect: 12,
  varcWrong: 2,
  varcUnattempted: 1,
  lrCorrect: 11,
  lrWrong: 3,
  lrUnattempted: 1,
  qadiCorrect: 22,
  qadiWrong: 5,
  qadiUnattempted: 3,
  qadiPercentile: 92,
  piPerformancePercent: 70,
  sopReady: false,
  class10DocumentReady: true,
  class12DocumentReady: false,
  reference1Ready: false,
  reference2Ready: false,
};
