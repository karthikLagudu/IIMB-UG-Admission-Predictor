import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  CalculationMode,
  IimbUgCandidateInput,
  IimbUgPolicyConfig,
  IimbUgPredictionResult,
  IimbUgRuntimeData,
} from "@/types/iimb-ug";
import { iimbUgPolicySchema, iimbUgRuntimeSchema } from "@/validation/iimb-ug";
import { EMPTY_IIMB_UG_RUNTIME_DATA, IIMB_UG_2027_POLICY } from "./2027_31/policy";

const BUNDLED_POLICY_SOURCE = "IIMB UG Admission Procedure 2027–31";
const BUNDLED_VERIFIED_DATE = new Date("2026-08-29T00:00:00Z");

function jsonSafe(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function iimbUgDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export interface IimbUgLoadedSnapshot {
  policy: IimbUgPolicyConfig;
  runtime: IimbUgRuntimeData;
  policyDatabaseId: string | null;
  runtimeDatabaseId: string | null;
}

export async function loadActiveIimbUgSnapshot(): Promise<IimbUgLoadedSnapshot> {
  const fallback: IimbUgLoadedSnapshot = {
    policy: IIMB_UG_2027_POLICY,
    runtime: EMPTY_IIMB_UG_RUNTIME_DATA,
    policyDatabaseId: null,
    runtimeDatabaseId: null,
  };
  if (!iimbUgDatabaseConfigured()) return fallback;

  try {
    const activePolicy = await prisma.iimbUgPolicy.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
      include: {
        runtimeDatasets: {
          where: { active: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });
    if (!activePolicy) return fallback;
    const policy = iimbUgPolicySchema.safeParse(activePolicy.config);
    if (!policy.success) return fallback;
    const runtimeRow = activePolicy.runtimeDatasets[0];
    const runtime = runtimeRow ? iimbUgRuntimeSchema.safeParse(runtimeRow.data) : null;
    return {
      policy: policy.data,
      runtime: runtime?.success ? runtime.data as IimbUgRuntimeData : EMPTY_IIMB_UG_RUNTIME_DATA,
      policyDatabaseId: activePolicy.id,
      runtimeDatabaseId: runtime?.success && runtimeRow ? runtimeRow.id : null,
    };
  } catch (error) {
    if (process.env.PERSIST_PREDICTIONS === "true") throw error;
    return fallback;
  }
}

async function ensurePolicyRecord(policy: IimbUgPolicyConfig): Promise<string> {
  const existing = await prisma.iimbUgPolicy.findUnique({ where: { version: policy.version } });
  if (existing) return existing.id;
  const created = await prisma.iimbUgPolicy.create({
    data: {
      policyId: policy.policyId,
      version: policy.version,
      admissionCycle: policy.admissionCycle,
      active: true,
      effectiveYear: policy.admissionYear,
      source: BUNDLED_POLICY_SOURCE,
      sourceType: "OFFICIAL_CURRENT",
      verifiedDate: BUNDLED_VERIFIED_DATE,
      notes: "Bundled policy inserted when persisting the first UG prediction.",
      config: jsonSafe(policy),
    },
  });
  return created.id;
}

export async function persistIimbUgPrediction(args: {
  candidate: IimbUgCandidateInput;
  policy: IimbUgPolicyConfig;
  runtime: IimbUgRuntimeData;
  result: IimbUgPredictionResult;
  calculationMode: CalculationMode;
  policyDatabaseId?: string | null;
  runtimeDatabaseId?: string | null;
}): Promise<{ persisted: boolean; runId: string | null; reason?: string }> {
  if (!iimbUgDatabaseConfigured() || process.env.PERSIST_PREDICTIONS === "false") {
    return {
      persisted: false,
      runId: null,
      reason: iimbUgDatabaseConfigured()
        ? "Persistence disabled by configuration."
        : "DATABASE_URL is not configured.",
    };
  }
  try {
    const policyId = args.policyDatabaseId ?? await ensurePolicyRecord(args.policy);
    const run = await prisma.iimbUgPredictionRun.create({
      data: {
        iimbUgPolicyId: policyId,
        iimbUgRuntimeDatasetId: args.runtimeDatabaseId ?? null,
        policyVersion: args.policy.version,
        runtimeVersion: args.runtime.version ?? null,
        calculationMode: args.calculationMode,
        candidateInputs: jsonSafe(args.candidate),
        policySnapshot: jsonSafe(args.policy),
        runtimeSnapshot: jsonSafe(args.runtime),
        resultSnapshot: jsonSafe(args.result),
      },
    });
    return { persisted: true, runId: run.id };
  } catch (error) {
    if (process.env.PERSIST_PREDICTIONS === "true") throw error;
    return {
      persisted: false,
      runId: null,
      reason: error instanceof Error ? error.message : "Prediction persistence failed.",
    };
  }
}

export async function saveIimbUgPolicyVersion(
  policy: IimbUgPolicyConfig,
  activate: boolean,
): Promise<{ id: string; version: string; active: boolean }> {
  if (!iimbUgDatabaseConfigured()) throw new Error("DATABASE_URL is required for admin writes.");
  return prisma.$transaction(async (tx) => {
    const existing = await tx.iimbUgPolicy.findUnique({ where: { version: policy.version } });
    if (existing) throw new Error(`Policy version ${policy.version} already exists. Use a new version identifier.`);
    if (activate) await tx.iimbUgPolicy.updateMany({ where: { active: true }, data: { active: false } });
    return tx.iimbUgPolicy.create({
      data: {
        policyId: policy.policyId,
        version: policy.version,
        admissionCycle: policy.admissionCycle,
        active: activate,
        effectiveYear: policy.admissionYear,
        source: BUNDLED_POLICY_SOURCE,
        sourceType: "ADMIN_CONFIGURED",
        verifiedDate: new Date(),
        notes: "Versioned administrator policy snapshot.",
        config: jsonSafe(policy),
      },
      select: { id: true, version: true, active: true },
    });
  });
}

export async function saveIimbUgRuntimeVersion(args: {
  runtime: IimbUgRuntimeData;
  policyVersion: string;
  activate: boolean;
}): Promise<{ id: string; version: string; active: boolean }> {
  if (!iimbUgDatabaseConfigured()) throw new Error("DATABASE_URL is required for admin writes.");
  if (!args.runtime.version || args.runtime.version === "EMPTY") {
    throw new Error("A new, non-empty runtime version identifier is required.");
  }
  const runtimeVersion = args.runtime.version;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.iimbUgRuntimeDataset.findUnique({ where: { version: runtimeVersion } });
    if (existing) throw new Error(`Runtime version ${runtimeVersion} already exists. Use a new version identifier.`);
    const policy = await tx.iimbUgPolicy.findUnique({ where: { version: args.policyVersion } });
    if (!policy) throw new Error(`Policy version ${args.policyVersion} was not found.`);
    if (args.activate) {
      await tx.iimbUgRuntimeDataset.updateMany({
        where: { iimbUgPolicyId: policy.id, active: true },
        data: { active: false },
      });
    }
    return tx.iimbUgRuntimeDataset.create({
      data: {
        iimbUgPolicyId: policy.id,
        version: runtimeVersion,
        active: args.activate,
        data: jsonSafe(args.runtime),
        sourceType: args.runtime.sourceType ?? "ADMIN_CONFIGURED",
        sourceLabel: args.runtime.sourceLabel ?? "Administrator-configured runtime data",
        observedAt: args.runtime.observedAt ? new Date(args.runtime.observedAt) : null,
        verifiedDate: new Date(),
        notes: "Versioned runtime dataset. Null fields remain explicitly unavailable.",
      },
      select: { id: true, version: true, active: true },
    });
  });
}

export async function listIimbUgVersions() {
  if (!iimbUgDatabaseConfigured()) return { policies: [], runtimeDatasets: [] };
  const [policies, runtimeDatasets] = await Promise.all([
    prisma.iimbUgPolicy.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, version: true, admissionCycle: true, active: true, verifiedDate: true, createdAt: true },
    }),
    prisma.iimbUgRuntimeDataset.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, version: true, active: true, sourceLabel: true, verifiedDate: true, createdAt: true, policy: { select: { version: true } } },
    }),
  ]);
  return { policies, runtimeDatasets };
}
