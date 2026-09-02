import type {
  CalculationMode,
  IimbUgCandidateInput,
  IimbUgPolicyConfig,
  IimbUgPredictionResult,
  IimbUgRuntimeData,
} from "@/types/iimb-ug";
import { EMPTY_IIMB_UG_RUNTIME_DATA, IIMB_UG_2027_POLICY } from "./2027_31/policy";

export function iimbUgDatabaseConfigured(): boolean {
  return false;
}

export async function loadActiveIimbUgSnapshot() {
  return {
    policy: IIMB_UG_2027_POLICY as IimbUgPolicyConfig,
    runtime: EMPTY_IIMB_UG_RUNTIME_DATA,
    policyDatabaseId: null,
    runtimeDatabaseId: null,
  };
}

export async function persistIimbUgPrediction(args: {
  candidate: IimbUgCandidateInput;
  policy: IimbUgPolicyConfig;
  runtime: IimbUgRuntimeData;
  result: IimbUgPredictionResult;
  calculationMode: CalculationMode;
  policyDatabaseId?: string | null;
  runtimeDatabaseId?: string | null;
}) {
  void args;
  return {
    persisted: false,
    runId: null,
    reason: "Temporary deployment uses versioned bundled policy data without storing candidate data.",
  };
}

export async function saveIimbUgPolicyVersion(): Promise<never> {
  throw new Error("Database-backed administration is disabled on this temporary deployment.");
}

export async function saveIimbUgRuntimeVersion(): Promise<never> {
  throw new Error("Database-backed administration is disabled on this temporary deployment.");
}

export async function listIimbUgVersions() {
  return { policies: [], runtimeDatasets: [] };
}
