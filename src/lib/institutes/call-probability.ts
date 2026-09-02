import type { InstituteCallStatus } from "@/types/institutes";

const CALL_CURVE_STEEPNESS = 16;
const MODEL_FLOOR = 0.005;
const MODEL_CEILING = 0.995;

export interface InterviewCallChance {
  probability: number | null;
  label: string;
  detail: string;
}

export function estimateInterviewCallChance(args: {
  eligible: boolean;
  score: number | null | undefined;
  maxScore: number;
  benchmark: number | null | undefined;
  status?: InstituteCallStatus;
  directMerit?: boolean;
}): InterviewCallChance {
  if (args.directMerit) {
    return {
      probability: 0,
      label: "0.0%",
      detail: "This programme uses direct merit ranking and has no interview-call stage, so its interview-call chance is zero.",
    };
  }

  if (!args.eligible) {
    return {
      probability: 0,
      label: "0.0%",
      detail: "An official eligibility or CAT hard gate is not cleared, so the call estimate is hard-gated to zero.",
    };
  }

  if (args.score != null && args.benchmark != null && args.maxScore > 0) {
    const normalizedMargin = (args.score - args.benchmark) / args.maxScore;
    const rawProbability = 1 / (1 + Math.exp(-CALL_CURVE_STEEPNESS * normalizedMargin));
    const probability = Math.min(MODEL_CEILING, Math.max(MODEL_FLOOR, rawProbability));
    return {
      probability,
      label: `${(probability * 100).toFixed(1)}%`,
      detail: "Model estimate from the profile's distance above or below the configured shortlist benchmark; it is not an official call probability.",
    };
  }

  if (args.status === "NO_CALL") {
    return {
      probability: 0,
      label: "0.0%",
      detail: "The configured rules do not predict an interview call for this profile.",
    };
  }

  const normalizedScore = args.score != null && args.maxScore > 0
    ? Math.min(1, Math.max(0, args.score / args.maxScore))
    : null;
  const probability = normalizedScore == null
    ? args.status === "PREDICTED_CALL" ? 0.75 : 0.5
    : Math.min(0.95, Math.max(0.5, 0.5 + 0.45 * normalizedScore));
  return {
    probability,
    label: `${(probability * 100).toFixed(1)}%`,
    detail: normalizedScore == null
      ? "Planning estimate used because the institute has not published a compatible fixed shortlist boundary."
      : "Planning estimate from the normalized shortlist score because the institute has not published a compatible fixed shortlist boundary.",
  };
}
