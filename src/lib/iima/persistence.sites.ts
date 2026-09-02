import type { CandidateInput, IimaPolicyConfig, IimaPredictionResult } from "@/types/iima";
import { IIMA_CAT_2025_POLICY } from "./constants";

export function databaseConfigured(): boolean {
  return false;
}

export async function loadActivePolicy(): Promise<IimaPolicyConfig> {
  return IIMA_CAT_2025_POLICY;
}

export async function persistPrediction(args: {
  candidate: CandidateInput;
  policy: IimaPolicyConfig;
  result: IimaPredictionResult;
}): Promise<{ persisted: boolean; runId: null; reason: string }> {
  void args;
  return {
    persisted: false,
    runId: null,
    reason: "Temporary deployment uses the bundled policy without storing candidate data.",
  };
}

export async function savePolicyVersion(
  policy: IimaPolicyConfig,
  activate: boolean,
): Promise<never> {
  void policy;
  void activate;
  throw new Error("Database-backed administration is disabled on this temporary deployment.");
}

export async function listPolicyVersions(): Promise<[]> {
  return [];
}
