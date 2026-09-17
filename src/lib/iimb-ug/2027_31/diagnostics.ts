import type { IimbUgPredictionResult } from "@/types/iimb-ug";

export function buildWarnings(result: Pick<IimbUgPredictionResult, "eligibility" | "historicalShortlist" | "prePi">): string[] {
  const warnings = [
    "This site's planning filter uses 38.4% in Class X overall and 60% in Mathematics. IIMB's published 2027 procedure requires 60% in Class X overall; passing the lower site filter does not establish official eligibility.",
    "The historical Aggregate column is treated as a canonical raw-score floor, not a percentile.",
    "Current 2027 first-shortlist and interview-call thresholds are not published.",
  ];
  if (result.prePi.status === "ESTIMATED") warnings.push("Pre-PI contains planning or analogue components and is not an official IIMB standardized score.");
  if (result.historicalShortlist.status === "PASS") warnings.push("Clearing the previous first-shortlist benchmark does not imply clearing the current cutoff.");
  return warnings;
}
