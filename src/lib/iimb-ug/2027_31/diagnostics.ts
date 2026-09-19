import type { IimbUgPredictionResult } from "@/types/iimb-ug";

export function buildWarnings(result: Pick<IimbUgPredictionResult, "eligibility" | "historicalShortlist" | "prePi">): string[] {
  const warnings = [
    "The initial academic filter requires at least 60% in both Class X overall and Class X Mathematics.",
    "The historical Aggregate column is treated as a canonical raw-score floor, not a percentile.",
    "Current 2027 first-shortlist and interview-call thresholds are not published.",
  ];
  if (result.prePi.status === "ESTIMATED") warnings.push("Pre-PI contains planning or analogue components and is not an official IIMB standardized score.");
  if (result.historicalShortlist.status === "PASS") warnings.push("Clearing the previous first-shortlist benchmark does not imply clearing the current cutoff.");
  return warnings;
}
