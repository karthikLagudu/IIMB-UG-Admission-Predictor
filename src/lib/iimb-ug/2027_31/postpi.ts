import type {
  AcademicWeightingStrategy,
  FinalTestStrategy,
  IimbUgCandidateInput,
  IimbUgPolicyConfig,
  IimbUgRuntimeData,
  ScoreComponent,
} from "@/types/iimb-ug";
import { calculatePiWeightedScore } from "./pi-solver";
import { iimbStyleStandardize, linearPercentScore } from "./standardization";

function academicFinalComponent(args: {
  key: string;
  label: string;
  value: number | undefined;
  weight: number;
  strategy: AcademicWeightingStrategy;
  stats: IimbUgRuntimeData["class10OverallStats"];
  runtime: IimbUgRuntimeData;
}): ScoreComponent {
  const planning = args.strategy === "LINEAR_PLANNING";
  const weightedValue = planning
    ? linearPercentScore(args.value, args.weight)
    : args.strategy === "IIMB_STYLE_STANDARDIZATION" && args.value != null
      ? iimbStyleStandardize(args.value, args.stats?.mean, args.stats?.sd, args.weight)
      : null;
  return {
    key: args.key,
    label: args.label,
    rawValue: args.value ?? null,
    weightedValue,
    maxScore: args.weight,
    status: weightedValue == null ? "DATA_REQUIRED" : "ESTIMATED",
    formula: planning
      ? `${args.label} % / 100 × ${args.weight}`
      : `Std(${args.label}, μ, σ, ${args.weight})`,
    sourceType: weightedValue == null ? "DATA_REQUIRED" : planning ? "MODEL_ASSUMPTION" : "OFFICIAL_ANALOGUE",
    sourceLabel: args.runtime.sourceLabel,
    explanation: planning
      ? "Linear planning component; not an official standardized score."
      : "IIMB PGP standardisation analogue; UG use has not been confirmed.",
    missingInputs: weightedValue == null ? [args.key, `${args.key}Stats.mean`, `${args.key}Stats.sd`] : undefined,
  };
}

export function calculateFinalTest40(args: {
  strategy: FinalTestStrategy;
  candidate: IimbUgCandidateInput;
  totalCanonical: number | null;
  prePiTest70: number | null;
  policy: IimbUgPolicyConfig;
  runtime: IimbUgRuntimeData;
}): ScoreComponent {
  const weight = args.policy.postPi.weights.test;
  let weightedValue: number | null = null;
  let sourceType: ScoreComponent["sourceType"] = "DATA_REQUIRED";
  let formula = "Current UG Test /40 transformation required";
  let explanation = "IIMB publishes the final test weight but not the full public transformation.";
  if (args.strategy === "DIRECT_OFFICIAL_40") {
    weightedValue = args.candidate.testWeighted40 ?? null;
    sourceType = weightedValue == null ? "DATA_REQUIRED" : "OFFICIAL_CURRENT";
    formula = "Direct official UG Test /40";
    explanation = weightedValue == null ? "Supply the official weighted test score." : "Uses the supplied official weighted score directly.";
  } else if (args.strategy === "TOTAL_RAW_LINEAR") {
    weightedValue = args.totalCanonical == null
      ? null
      : args.totalCanonical / args.policy.exam.totalMaxCanonical * weight;
    sourceType = weightedValue == null ? "DATA_REQUIRED" : "DERIVED";
    formula = `Total canonical / ${args.policy.exam.totalMaxCanonical} × ${weight}`;
    explanation = "Transparent total-raw planning conversion; not confirmed as IIMB's official final-test transformation.";
  } else if (args.strategy === "RESCALE_PREPI_TEST") {
    weightedValue = args.prePiTest70 == null
      ? null
      : args.prePiTest70 * weight / args.policy.prePi.weights.test;
    sourceType = weightedValue == null ? "DATA_REQUIRED" : "MODEL_ASSUMPTION";
    formula = `Test70 × ${weight} / ${args.policy.prePi.weights.test}`;
    explanation = "Alternative planning rescale; not an official IIMB conversion.";
  } else if (args.strategy === "CUSTOM_RUNTIME") {
    weightedValue = args.runtime.customFinalTestScore ?? null;
    sourceType = weightedValue == null ? "DATA_REQUIRED" : args.runtime.sourceType ?? "ADMIN_CONFIGURED";
    formula = "Configured runtime UG Test /40 transform";
    explanation = weightedValue == null ? "A custom runtime result is required." : "Uses the configured runtime result and its supplied provenance.";
  }
  return {
    key: "postpi-test",
    label: "UG Admission Test",
    rawValue: args.totalCanonical,
    weightedValue,
    maxScore: weight,
    status: weightedValue == null ? "DATA_REQUIRED" : args.strategy === "DIRECT_OFFICIAL_40" ? "CALCULATED" : "ESTIMATED",
    formula,
    sourceType,
    sourceLabel: args.runtime.sourceLabel,
    explanation,
    missingInputs: weightedValue == null ? ["finalTestStrategyInputs"] : undefined,
  };
}

export function calculatePostPi(args: {
  candidate: IimbUgCandidateInput;
  totalCanonical: number | null;
  prePiTest70: number | null;
  policy: IimbUgPolicyConfig;
  runtime: IimbUgRuntimeData;
  academicStrategy: AcademicWeightingStrategy;
  testStrategy: FinalTestStrategy;
}) {
  const { candidate, policy, runtime, academicStrategy } = args;
  const overall = academicFinalComponent({
    key: "postpi-class10Overall",
    label: "Class X Overall",
    value: candidate.class10OverallPercent,
    weight: policy.postPi.weights.class10Overall,
    strategy: academicStrategy,
    stats: runtime.class10OverallStats,
    runtime,
  });
  const math = academicFinalComponent({
    key: "postpi-class10Math",
    label: "Class X Mathematics",
    value: candidate.class10MathPercent,
    weight: policy.postPi.weights.class10Math,
    strategy: academicStrategy,
    stats: runtime.class10MathStats,
    runtime,
  });
  const test = calculateFinalTest40({ ...args, strategy: args.testStrategy });
  const components = [overall, math, test];
  const complete = components.every((component) => component.weightedValue != null);
  const fixed = complete ? components.reduce((sum, component) => sum + component.weightedValue!, 0) : null;
  const scenarios = policy.postPi.piScenarioPercents.map((piPerformancePercent) => {
    const piWeightedScore = calculatePiWeightedScore(piPerformancePercent, policy.postPi.weights.pi);
    return {
      piPerformancePercent,
      piWeightedScore,
      finalCompositeMinimum: fixed == null ? null : fixed + piWeightedScore,
      finalCompositeMaximum: fixed == null ? null : fixed + piWeightedScore,
    };
  });
  const selectedPiPercent = candidate.piWeightedScore != null
    ? candidate.piWeightedScore / policy.postPi.weights.pi * 100
    : candidate.piPerformancePercent ?? 70;
  const selectedPiWeighted = candidate.piWeightedScore
    ?? calculatePiWeightedScore(selectedPiPercent, policy.postPi.weights.pi);
  const selectedFinal = fixed == null ? null : fixed + selectedPiWeighted;
  return {
    components,
    fixedMinimum: fixed,
    fixedMaximum: fixed,
    test40: test.weightedValue ?? null,
    scenarios,
    selectedPiPercent,
    selectedFinalMinimum: selectedFinal,
    selectedFinalMaximum: selectedFinal,
    status: !complete ? "DATA_REQUIRED" as const : components.some((component) => component.status === "ESTIMATED") ? "ESTIMATED" as const : "CALCULATED" as const,
  };
}

