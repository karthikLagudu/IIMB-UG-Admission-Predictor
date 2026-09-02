import type {
  CandidateInput,
  FinalSelectionResult,
  IimaPolicyConfig,
  IimaPredictionResult,
  PredictionBand,
  PredictionStatus,
  SensitivityScenario,
  Stage1PoolContext,
} from "@/types/iima";
import { calculateApplicationRating } from "./application-rating";
import { evaluateC2 } from "./c1-c6";
import { calculateCompositeScore, requiredCatScaledScore } from "./composite-score";
import { estimateCat2025OverallPercentile } from "./cat-percentile";
import { IIMA_CAT_2025_POLICY, SOURCE_CLASSIFICATIONS } from "./constants";
import { evaluateBasicEligibility, evaluateCatEligibility } from "./eligibility";
import { buildPredictionDiagnostics } from "./diagnostics";
import { calculateFinalCompositeScore, requiredNormalizedPi } from "./final-score";
import { pooledPwdKey } from "./keys";
import { calculateCalibratedSeatProbability, predictionBand } from "./probability";
import { evaluateStage1 } from "./stage1";
import { evaluateStage2 } from "./stage2";

const emptySensitivity: SensitivityScenario[] = [];

function statusForBand(band: PredictionBand): PredictionStatus {
  if (band === "VERY_STRONG") return "VERY_STRONG_FINAL_CONVERSION_PROBABILITY";
  if (band === "STRONG") return "STRONG_FINAL_CONVERSION_PROBABILITY";
  if (band === "GOOD") return "GOOD_FINAL_CONVERSION_PROBABILITY";
  return "BORDERLINE_FINAL_CONVERSION";
}

function rejectedAtBasic(
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
): IimaPredictionResult {
  const basicEligibility = evaluateBasicEligibility(candidate, policy);
  return {
    policyVersion: policy.version,
    admissionCycle: policy.admissionCycle,
    basicEligibility,
    catEligibility: null,
    applicationRating: null,
    academicConsistency: null,
    compositeScore: null,
    stage1: null,
    stage2: null,
    callPrediction: false,
    callRoute: null,
    applicableCallThreshold: null,
    callMargin: null,
    requiredCatScaledScore: null,
    finalSelection: null,
    sensitivity: emptySensitivity,
    status: "NOT_ELIGIBLE",
    explanation: [
      "Basic eligibility failed.",
      ...basicEligibility.reasons,
      "No call or seat probability is calculated after a failed hard gate.",
    ],
    sourceClassifications: { ...SOURCE_CLASSIFICATIONS },
  };
}

function buildFinalSelection(args: {
  candidate: CandidateInput;
  applicationRating: number;
  eligibilityGate: boolean;
  callGate: boolean;
  policy: IimaPolicyConfig;
}): FinalSelectionResult | null {
  const { candidate, applicationRating, eligibilityGate, callGate, policy } = args;
  if (candidate.normalizedPi == null || candidate.normalizedAwt == null) return null;
  const normalizedAr = applicationRating / policy.arNormalizationDenominator;
  const normalizedCat = candidate.catOverallScaledScore / policy.catNormalizationDenominator;
  const finalCompositeScore = calculateFinalCompositeScore(
    {
      normalizedPi: candidate.normalizedPi,
      normalizedAwt: candidate.normalizedAwt,
      normalizedCat,
      normalizedAr,
    },
    policy,
  );
  const benchmarkKey = pooledPwdKey(candidate);
  const historicalBenchmark = policy.historicalFinalBenchmarks[benchmarkKey];
  if (historicalBenchmark == null) throw new Error(`Missing benchmark for ${benchmarkKey}`);
  const planningTarget = historicalBenchmark + policy.model.safetyMargin;
  const requiredPi = requiredNormalizedPi({
    target: planningTarget,
    normalizedAwt: candidate.normalizedAwt,
    normalizedCat,
    normalizedAr,
    policy,
  });
  const benchmarkSeries = policy.historicalFinalBenchmarkSeries[benchmarkKey];
  if (!benchmarkSeries?.length) {
    throw new Error(`Missing historical benchmark series for ${benchmarkKey}`);
  }
  const calibrated = calculateCalibratedSeatProbability({
    eligibilityGate,
    callGate,
    finalCompositeScore,
    benchmarks: benchmarkSeries,
    safetyMargin: policy.model.safetyMargin,
    logisticSlope: policy.model.logisticSlope,
    recencyWeights: policy.model.benchmarkRecencyWeights,
  });
  const seatProbability = calibrated.probability;
  return {
    normalizedAr,
    normalizedCat,
    normalizedPi: candidate.normalizedPi,
    normalizedAwt: candidate.normalizedAwt,
    finalCompositeScore,
    officialCurrentFinalCutoff: null,
    historicalBenchmark,
    planningTarget,
    targetDifference: finalCompositeScore - planningTarget,
    requiredNormalizedPi: requiredPi,
    piGap: candidate.normalizedPi - requiredPi,
    seatProbability,
    predictionBand: predictionBand(seatProbability, policy),
    calibration: calibrated.calibration,
  };
}

function predictCore(
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
  poolContext?: Stage1PoolContext,
): IimaPredictionResult {
  const basicEligibility = evaluateBasicEligibility(candidate, policy);
  if (!basicEligibility.passed) return rejectedAtBasic(candidate, policy);

  const catEligibility = evaluateCatEligibility(candidate, policy);
  if (!catEligibility.catEligible) {
    const failed = [
      !catEligibility.overallPass && "overall percentile",
      !catEligibility.varcPass && "VARC",
      !catEligibility.dilrPass && "DILR",
      !catEligibility.qaPass && "QA",
      !catEligibility.positiveRawScoresPass && "positive raw scores",
    ]
      .filter(Boolean)
      .join(", ");
    return {
      policyVersion: policy.version,
      admissionCycle: policy.admissionCycle,
      basicEligibility,
      catEligibility,
      applicationRating: null,
      academicConsistency: null,
      compositeScore: null,
      stage1: null,
      stage2: null,
      callPrediction: false,
      callRoute: null,
      applicableCallThreshold: null,
      callMargin: null,
      requiredCatScaledScore: null,
      finalSelection: null,
      sensitivity: emptySensitivity,
      status: "CAT_CUTOFF_FAILED",
      explanation: [
        "Basic eligibility is satisfied.",
        `CAT screening failed: ${failed}.`,
        "No later-stage score can override a failed CAT hard gate.",
      ],
      sourceClassifications: { ...SOURCE_CLASSIFICATIONS },
    };
  }

  const applicationRating = calculateApplicationRating(candidate, policy);
  const academicConsistency = evaluateC2(candidate, policy);
  const compositeScore = calculateCompositeScore(
    applicationRating.total,
    candidate.catOverallScaledScore,
    policy,
  );
  const stage1 = evaluateStage1({
    candidate,
    applicationRating,
    catEligibility,
    compositeScore,
    policy,
    poolContext,
    c2: academicConsistency,
  });
  const stage2 = stage1.predictedShortlist
    ? null
    : evaluateStage2({
        candidate,
        catEligibility,
        compositeScore,
        policy,
        c2: academicConsistency,
      });
  const callRoute = stage1.predictedShortlist
    ? "STAGE_1"
    : stage2?.predictedShortlist
      ? "STAGE_2"
      : null;
  const callPrediction = callRoute != null;
  const applicableCallThreshold =
    callRoute === "STAGE_1" ? stage1.threshold : (stage2?.threshold ?? null);
  const callMargin =
    applicableCallThreshold == null ? null : compositeScore - applicableCallThreshold;
  const stage2Threshold = policy.stage2Thresholds[
    candidate.pwd ? `PWD_${candidate.category}` : candidate.category
  ];
  const requiredCat = requiredCatScaledScore(
    applicationRating.total,
    stage2Threshold,
    candidate.catOverallScaledScore,
    policy,
  );
  const finalSelection = buildFinalSelection({
    candidate,
    applicationRating: applicationRating.total,
    eligibilityGate: basicEligibility.passed && catEligibility.catEligible,
    callGate: callPrediction,
    policy,
  });
  let status: PredictionStatus;
  if (!callPrediction) {
    status = !academicConsistency.passed ? "ACADEMIC_GATE_FAILED" : "STAGE_2_NOT_QUALIFIED";
  } else if (!finalSelection) {
    status = "AWT_PI_CALL_PREDICTED";
  } else {
    status = statusForBand(finalSelection.predictionBand);
  }

  const explanation = [
    "Basic degree eligibility and CAT hard gates are satisfied.",
    `Class 10/12 average is ${academicConsistency.average.toFixed(2)}% against ${academicConsistency.required?.toFixed(2)}%.`,
    `Application Rating is ${applicationRating.total.toFixed(1)}/${policy.arNormalizationDenominator}.`,
    `Composite Score is ${compositeScore.toFixed(6)}.`,
    stage1.reason,
  ];
  if (stage2) explanation.push(stage2.reason);
  if (callPrediction) {
    explanation.push(`AWT/PI call prediction: YES via ${callRoute === "STAGE_1" ? "Stage 1" : "Stage 2"}.`);
  } else {
    explanation.push("AWT/PI call prediction: NO. Final seat probability is hard-gated to 0%. ");
  }
  if (finalSelection) {
    explanation.push(
      `Final Composite Score is ${finalSelection.finalCompositeScore.toFixed(6)}.`,
      "Official current final cutoff: Not published.",
      `Historical benchmark is ${finalSelection.historicalBenchmark.toFixed(6)}; planning target is ${finalSelection.planningTarget.toFixed(6)}.`,
      `The calibrated model blends ${finalSelection.calibration.cycles.length} completed cycles; its weighted target is ${finalSelection.calibration.weightedTarget.toFixed(6)}.`,
      `Model probability is ${(finalSelection.seatProbability * 100).toFixed(1)}%, with a historical-cycle scenario range of ${(finalSelection.calibration.probabilityLow * 100).toFixed(1)}% to ${(finalSelection.calibration.probabilityHigh * 100).toFixed(1)}%. This is not an admission guarantee.`,
    );
  }
  return {
    policyVersion: policy.version,
    admissionCycle: policy.admissionCycle,
    basicEligibility,
    catEligibility,
    applicationRating,
    academicConsistency,
    compositeScore,
    stage1,
    stage2,
    callPrediction,
    callRoute,
    applicableCallThreshold,
    callMargin,
    requiredCatScaledScore: requiredCat,
    finalSelection,
    sensitivity: emptySensitivity,
    status,
    explanation,
    sourceClassifications: { ...SOURCE_CLASSIFICATIONS },
  };
}

function withSensitivity(
  base: IimaPredictionResult,
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
  poolContext?: Stage1PoolContext,
): IimaPredictionResult {
  if (!base.finalSelection) return base;
  const scenarios: Array<{ key: string; label: string; candidate: CandidateInput }> = [
    {
      key: "cat-plus-5",
      label: "CAT +5 scaled points",
      candidate: {
        ...candidate,
        catOverallScaledScore: Math.min(
          policy.catNormalizationDenominator,
          candidate.catOverallScaledScore + 5,
        ),
      },
    },
    {
      key: "cat-plus-10",
      label: "CAT +10 scaled points",
      candidate: {
        ...candidate,
        catOverallScaledScore: Math.min(
          policy.catNormalizationDenominator,
          candidate.catOverallScaledScore + 10,
        ),
      },
    },
    {
      key: "pi-plus-005",
      label: "PI +0.05 normalized",
      candidate: { ...candidate, normalizedPi: Math.min(1, (candidate.normalizedPi ?? 0) + 0.05) },
    },
    {
      key: "pi-plus-010",
      label: "PI +0.10 normalized",
      candidate: { ...candidate, normalizedPi: Math.min(1, (candidate.normalizedPi ?? 0) + 0.1) },
    },
    {
      key: "awt-plus-005",
      label: "AWT +0.05 normalized",
      candidate: { ...candidate, normalizedAwt: Math.min(1, (candidate.normalizedAwt ?? 0) + 0.05) },
    },
    {
      key: "workex-plus-6",
      label: "Work experience +6 months",
      candidate: {
        ...candidate,
        workExperienceMonths: Math.min(36, candidate.workExperienceMonths + 6),
      },
    },
  ];
  const sensitivity = scenarios.map((scenario): SensitivityScenario => {
    const result = predictCore(scenario.candidate, policy, poolContext);
    const final = result.finalSelection;
    const probability = final?.seatProbability ?? 0;
    return {
      key: scenario.key,
      label: scenario.label,
      finalCompositeScore: final?.finalCompositeScore ?? null,
      probability,
      probabilityDelta: probability - base.finalSelection!.seatProbability,
    };
  });
  return { ...base, sensitivity };
}

export function predictIimaAdmission(
  candidate: CandidateInput,
  policy: IimaPolicyConfig = IIMA_CAT_2025_POLICY,
  poolContext?: Stage1PoolContext,
): IimaPredictionResult {
  const result = withSensitivity(
    predictCore(candidate, policy, poolContext),
    candidate,
    policy,
    poolContext,
  );
  return { ...result, diagnostics: buildPredictionDiagnostics(candidate, result, policy) };
}

export const SAMPLE_CANDIDATE: CandidateInput = {
  category: "GENERAL",
  pwd: false,
  gender: "MALE",
  dateOfBirth: "2003-05-12",
  finalYearStudent: false,
  degreeName: "B.Tech Computer Science",
  degreeDurationYears: 4,
  class10Percent: 92,
  class10Board: "CBSE",
  class12Percent: 90,
  class12Board: "CBSE",
  class12Stream: "SCIENCE",
  academicCategory: "AC_4",
  bachelorPercent: 86,
  professionalQualification: "NONE",
  workExperienceMonths: 24,
  iimbAcademicDiscipline: "ENGINEERING_TECHNOLOGY",
  iimbAutomaticPiQualification: "UNKNOWN",
  iimbWorkExperienceQuality: 1,
  iimcAcademicProfile: "1",
  catOverallPercentile: estimateCat2025OverallPercentile(150),
  catVarcPercentile: 95,
  catDilrPercentile: 95,
  catQaPercentile: 95,
  catVarcScaledScore: 50,
  catDilrScaledScore: 50,
  catQaScaledScore: 50,
  catOverallScaledScore: 150,
  positiveRawVarc: true,
  positiveRawDilr: true,
  positiveRawQa: true,
  normalizedPi: 0.75,
  normalizedAwt: 0.75,
};
