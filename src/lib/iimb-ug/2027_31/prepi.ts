import type {
  AcademicWeightingStrategy,
  ExamSectionKey,
  ExamSectionResult,
  IimbUgCandidateInput,
  IimbUgPolicyConfig,
  IimbUgRuntimeData,
  ScoreComponent,
  TestWeightingStrategy,
} from "@/types/iimb-ug";
import { IIMB_UG_SECTION_ORDER } from "./constants";
import { clamp, iimbStyleStandardize, linearPercentScore } from "./standardization";

function testComponent(
  section: ExamSectionKey,
  result: ExamSectionResult,
  candidate: IimbUgCandidateInput,
  policy: IimbUgPolicyConfig,
  runtime: IimbUgRuntimeData,
  strategy: TestWeightingStrategy,
): ScoreComponent {
  const weight = policy.prePi.weights.testSections[section];
  const directKey = section === "VARC" ? "varcWeighted20" : section === "LR" ? "lrWeighted30" : "qadiWeighted20";
  if (strategy === "DIRECT_OFFICIAL_WEIGHTED") {
    const weightedValue = candidate[directKey];
    return {
      key: `prepi-test-${section.toLowerCase()}`,
      label: section,
      rawValue: result.rawCanonical,
      weightedValue: weightedValue ?? null,
      maxScore: weight,
      status: weightedValue == null ? "DATA_REQUIRED" : "CALCULATED",
      formula: "Direct official weighted section score",
      sourceType: weightedValue == null ? "DATA_REQUIRED" : "OFFICIAL_CURRENT",
      explanation: weightedValue == null
        ? `An official ${section} weighted score out of ${weight} is required.`
        : "The supplied official weighted value is used without transformation.",
      missingInputs: weightedValue == null ? [directKey] : undefined,
    };
  }
  if (strategy === "LINEAR_RAW_PLANNING") {
    const weightedValue = result.rawCanonical == null
      ? null
      : clamp(result.rawCanonical / result.maxCanonical * weight, 0, weight);
    return {
      key: `prepi-test-${section.toLowerCase()}`,
      label: section,
      rawValue: result.rawCanonical,
      weightedValue,
      maxScore: weight,
      status: weightedValue == null ? "DATA_REQUIRED" : "ESTIMATED",
      formula: `${section} canonical / ${result.maxCanonical} × ${weight}`,
      sourceType: weightedValue == null ? "DATA_REQUIRED" : "DERIVED",
      sourceLabel: "Linear raw-score planning model",
      explanation: "IIMB publishes the section weight, but the UG raw-to-weighted transformation has not been confirmed.",
      missingInputs: weightedValue == null ? [`${section}.rawCanonical`] : undefined,
    };
  }
  if (strategy === "IIMB_STYLE_STANDARDIZATION") {
    const stats = runtime.testStats?.[section];
    const weightedValue = result.rawCanonical == null
      ? null
      : iimbStyleStandardize(result.rawCanonical, stats?.mean, stats?.sd, weight);
    const missingInputs = [
      result.rawCanonical == null ? `${section}.rawCanonical` : null,
      stats?.mean == null ? `testStats.${section}.mean` : null,
      stats?.sd == null || stats.sd <= 0 ? `testStats.${section}.sd` : null,
    ].filter((item): item is string => item != null);
    return {
      key: `prepi-test-${section.toLowerCase()}`,
      label: section,
      rawValue: result.rawCanonical,
      weightedValue,
      maxScore: weight,
      status: weightedValue == null ? "DATA_REQUIRED" : "ESTIMATED",
      formula: `max(0, min(${weight}, ${weight}/2 + ((v−μ)/σ)×${weight}/6))`,
      sourceType: weightedValue == null ? "DATA_REQUIRED" : "OFFICIAL_ANALOGUE",
      sourceLabel: runtime.sourceLabel,
      explanation: "Official IIMB PGP standardisation formula; its use for UG has not been confirmed.",
      missingInputs: missingInputs.length ? missingInputs : undefined,
    };
  }
  return {
    key: `prepi-test-${section.toLowerCase()}`,
    label: section,
    weightedValue: null,
    maxScore: weight,
    status: "DATA_REQUIRED",
    sourceType: "DATA_REQUIRED",
    formula: "No active test transformation",
    explanation: "Select a strategy or provide the current official transformation.",
    missingInputs: ["testWeightingStrategy"],
  };
}

export function calculateLinearTest70(
  sections: Record<Lowercase<ExamSectionKey>, ExamSectionResult>,
  policy: IimbUgPolicyConfig,
) {
  const components = IIMB_UG_SECTION_ORDER.map((section) => testComponent(
    section,
    sections[section.toLowerCase() as Lowercase<ExamSectionKey>],
    {} as IimbUgCandidateInput,
    policy,
    {},
    "LINEAR_RAW_PLANNING",
  ));
  return components.some((component) => component.weightedValue == null)
    ? null
    : components.reduce((sum, component) => sum + component.weightedValue!, 0);
}

function academicComponent(args: {
  key: "class10Overall" | "class10Math";
  label: string;
  value: number | undefined;
  weight: number;
  strategy: AcademicWeightingStrategy;
  stats: IimbUgRuntimeData["class10OverallStats"];
  runtime: IimbUgRuntimeData;
}): ScoreComponent {
  const { key, label, value, weight, strategy, stats, runtime } = args;
  if (strategy === "LINEAR_PLANNING") {
    const weightedValue = linearPercentScore(value, weight);
    return {
      key: `prepi-${key}`,
      label,
      rawValue: value ?? null,
      weightedValue,
      maxScore: weight,
      status: weightedValue == null ? "DATA_REQUIRED" : "ESTIMATED",
      formula: `${label} % / 100 × ${weight}`,
      sourceType: weightedValue == null ? "DATA_REQUIRED" : "MODEL_ASSUMPTION",
      explanation: "Linear academic planning score; not an official IIMB standardized score.",
      missingInputs: weightedValue == null ? [key] : undefined,
    };
  }
  if (strategy === "IIMB_STYLE_STANDARDIZATION") {
    const weightedValue = value == null ? null : iimbStyleStandardize(value, stats?.mean, stats?.sd, weight);
    const missingInputs = [
      value == null ? key : null,
      stats?.mean == null ? `${key}Stats.mean` : null,
      stats?.sd == null || stats.sd <= 0 ? `${key}Stats.sd` : null,
    ].filter((item): item is string => item != null);
    return {
      key: `prepi-${key}`,
      label,
      rawValue: value ?? null,
      weightedValue,
      maxScore: weight,
      status: weightedValue == null ? "DATA_REQUIRED" : "ESTIMATED",
      formula: `Std(${label}, μ, σ, ${weight})`,
      sourceType: weightedValue == null ? "DATA_REQUIRED" : "OFFICIAL_ANALOGUE",
      sourceLabel: runtime.sourceLabel,
      explanation: "Uses the IIMB PGP standardisation analogue; UG use is not confirmed.",
      missingInputs: missingInputs.length ? missingInputs : undefined,
    };
  }
  return {
    key: `prepi-${key}`,
    label,
    rawValue: value ?? null,
    weightedValue: null,
    maxScore: weight,
    status: "DATA_REQUIRED",
    sourceType: "DATA_REQUIRED",
    explanation: "No academic normalization strategy is active.",
    missingInputs: ["academicWeightingStrategy"],
  };
}

export function calculatePrePi(args: {
  candidate: IimbUgCandidateInput;
  sections: Record<Lowercase<ExamSectionKey>, ExamSectionResult>;
  policy: IimbUgPolicyConfig;
  runtime: IimbUgRuntimeData;
  testStrategy: TestWeightingStrategy;
  academicStrategy: AcademicWeightingStrategy;
}) {
  const { candidate, sections, policy, runtime, testStrategy, academicStrategy } = args;
  const testComponents = IIMB_UG_SECTION_ORDER.map((section) => testComponent(
    section,
    sections[section.toLowerCase() as Lowercase<ExamSectionKey>],
    candidate,
    policy,
    runtime,
    testStrategy,
  ));
  const overall = academicComponent({
    key: "class10Overall",
    label: "Class X Overall",
    value: candidate.class10OverallPercent,
    weight: policy.prePi.weights.class10Overall,
    strategy: academicStrategy,
    stats: runtime.class10OverallStats,
    runtime,
  });
  const math = academicComponent({
    key: "class10Math",
    label: "Class X Mathematics",
    value: candidate.class10MathPercent,
    weight: policy.prePi.weights.class10Math,
    strategy: academicStrategy,
    stats: runtime.class10MathStats,
    runtime,
  });
  const genderValue = candidate.genderDiversityEligibility === "ELIGIBLE"
    ? policy.prePi.weights.gender
    : candidate.genderDiversityEligibility === "NOT_ELIGIBLE" ? 0 : null;
  const gender: ScoreComponent = {
    key: "prepi-gender",
    label: "Gender Diversity",
    weightedValue: genderValue,
    maxScore: policy.prePi.weights.gender,
    status: genderValue == null ? "DATA_REQUIRED" : "CALCULATED",
    formula: `${policy.prePi.weights.gender} if policy-eligible; otherwise 0`,
    sourceType: genderValue == null ? "DATA_REQUIRED" : "USER_INPUT",
    explanation: genderValue == null
      ? "Eligibility is unknown, so a score range is shown instead of inferring from gender."
      : "Uses the candidate's explicit gender-diversity eligibility status.",
    missingInputs: genderValue == null ? ["genderDiversityEligibility"] : undefined,
  };
  const components = [...testComponents, overall, math, gender];
  const nonGender = components.filter((component) => component.key !== "prepi-gender");
  const baseComplete = nonGender.every((component) => component.weightedValue != null);
  const base = baseComplete ? nonGender.reduce((sum, component) => sum + component.weightedValue!, 0) : null;
  const test70 = testComponents.every((component) => component.weightedValue != null)
    ? testComponents.reduce((sum, component) => sum + component.weightedValue!, 0)
    : null;
  const minimum = base;
  const maximum = base == null ? null : base + (genderValue ?? policy.prePi.weights.gender);
  const prePi = base == null || genderValue == null ? null : base + genderValue;
  const estimated = components.some((component) => component.status === "ESTIMATED");
  return {
    strategy: testStrategy,
    academicStrategy,
    components,
    test70,
    prePi,
    minimum,
    maximum,
    status: !baseComplete ? "DATA_REQUIRED" as const : estimated || genderValue == null ? "ESTIMATED" as const : "CALCULATED" as const,
  };
}

