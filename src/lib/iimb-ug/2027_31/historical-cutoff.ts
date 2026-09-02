import type { IimbUgCandidateInput, IimbUgPolicyConfig } from "@/types/iimb-ug";

export function resolveHistoricalThreshold(
  candidate: Pick<IimbUgCandidateInput, "category" | "pwd">,
  policy: IimbUgPolicyConfig,
) {
  let resolvedCategory: keyof typeof policy.historical.thresholds = candidate.category;
  if (candidate.pwd && policy.historical.pwdResolution === "PWD_OVERRIDE") resolvedCategory = "PWD";
  if (candidate.pwd && (policy.historical.pwdResolution === "MORE_LENIENT" || policy.historical.pwdResolution === "MORE_STRINGENT")) {
    const base = policy.historical.thresholds[candidate.category];
    const pwd = policy.historical.thresholds.PWD;
    const lenient = policy.historical.pwdResolution === "MORE_LENIENT";
    const baseSum = base.qadiPercentileFloor + base.aggregateCanonicalScoreFloor;
    const pwdSum = pwd.qadiPercentileFloor + pwd.aggregateCanonicalScoreFloor;
    resolvedCategory = lenient ? (pwdSum <= baseSum ? "PWD" : candidate.category) : (pwdSum >= baseSum ? "PWD" : candidate.category);
  }
  return { resolvedCategory, benchmark: policy.historical.thresholds[resolvedCategory] };
}

export function evaluateHistoricalShortlist(args: {
  candidate: Pick<IimbUgCandidateInput, "category" | "pwd" | "qadiPercentile">;
  totalCanonical: number | null;
  positiveSectionGate: boolean | null;
  policy: IimbUgPolicyConfig;
}) {
  const { resolvedCategory, benchmark } = resolveHistoricalThreshold(args.candidate, args.policy);
  const qadiPercentile = args.candidate.qadiPercentile ?? null;
  const qadiPass = qadiPercentile == null ? null : qadiPercentile >= benchmark.qadiPercentileFloor;
  const aggregatePass = args.totalCanonical == null
    ? null
    : args.totalCanonical >= benchmark.aggregateCanonicalScoreFloor;
  const missing = args.positiveSectionGate == null || qadiPass == null || aggregatePass == null;
  const passed = !missing && args.positiveSectionGate && qadiPass && aggregatePass;
  return {
    status: missing ? "DATA_REQUIRED" as const : passed ? "PASS" as const : "FAIL" as const,
    benchmark,
    resolvedCategory,
    qadiPercentile,
    sectionGatePass: args.positiveSectionGate,
    qadiPass,
    aggregatePass,
    explanation: missing
      ? "QADI percentile and complete section scores are required; raw score is not converted to percentile without an exam-year map."
      : passed
        ? "The score clears the published previous-cycle first-shortlist benchmark. This is not the 2027 cutoff or an interview guarantee."
        : "One or more published previous-cycle first-shortlist conditions are not met.",
    sourceType: "OFFICIAL_HISTORICAL" as const,
  };
}

