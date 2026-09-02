import { Prisma } from "@prisma/client";
import type { CandidateInput, IimaPolicyConfig, IimaPredictionResult } from "@/types/iima";
import { prisma } from "@/lib/db";
import { policyConfigSchema } from "@/lib/validation/iima";
import { IIMA_CAT_2025_POLICY } from "./constants";

function jsonSafe(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function loadActivePolicy(): Promise<IimaPolicyConfig> {
  if (!databaseConfigured()) return IIMA_CAT_2025_POLICY;
  try {
    const active = await prisma.admissionCycle.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
      select: { config: true },
    });
    if (!active) return IIMA_CAT_2025_POLICY;
    const parsed = policyConfigSchema.safeParse(active.config);
    return parsed.success ? (parsed.data as IimaPolicyConfig) : IIMA_CAT_2025_POLICY;
  } catch (error) {
    if (process.env.PERSIST_PREDICTIONS === "true") throw error;
    return IIMA_CAT_2025_POLICY;
  }
}

export async function persistPrediction(args: {
  candidate: CandidateInput;
  policy: IimaPolicyConfig;
  result: IimaPredictionResult;
}): Promise<{ persisted: boolean; runId: string | null; reason?: string }> {
  if (!databaseConfigured() || process.env.PERSIST_PREDICTIONS === "false") {
    return {
      persisted: false,
      runId: null,
      reason: databaseConfigured() ? "Persistence disabled by configuration." : "DATABASE_URL is not configured.",
    };
  }
  const { candidate, policy, result } = args;
  try {
    const run = await prisma.$transaction(async (tx) => {
      const metadata = policy.metadata.eligibility;
      const cycle = await tx.admissionCycle.upsert({
        where: { policyVersion: policy.version },
        update: { config: jsonSafe(policy) },
        create: {
          name: policy.admissionCycle,
          catYear: policy.catYear,
          policyVersion: policy.version,
          active: true,
          effectiveYear: metadata.effectiveYear,
          source: metadata.source,
          sourceType: metadata.sourceType,
          verifiedDate: new Date(`${metadata.verifiedDate}T00:00:00Z`),
          notes: metadata.notes,
          config: jsonSafe(policy),
        },
      });
      const candidateRecord = await tx.candidate.create({
        data: {
          category: candidate.category,
          pwd: candidate.pwd,
          inputSnapshot: jsonSafe(candidate),
        },
      });
      const predictionRun = await tx.predictionRun.create({
        data: {
          candidateId: candidateRecord.id,
          admissionCycleId: cycle.id,
          policyVersion: policy.version,
          candidateInputs: jsonSafe(candidate),
          policySnapshot: jsonSafe(policy),
          resultSnapshot: jsonSafe(result),
        },
      });
      await tx.predictionResult.create({
        data: {
          predictionRunId: predictionRun.id,
          status: result.status,
          callPrediction: result.callPrediction,
          callRoute: result.callRoute,
          compositeScore: result.compositeScore,
          finalCompositeScore: result.finalSelection?.finalCompositeScore,
          seatProbability: result.finalSelection?.seatProbability ?? 0,
          predictionBand: result.finalSelection?.predictionBand,
          explanation: jsonSafe(result.explanation),
        },
      });
      return predictionRun;
    });
    return { persisted: true, runId: run.id };
  } catch (error) {
    if (process.env.PERSIST_PREDICTIONS === "true") throw error;
    return {
      persisted: false,
      runId: null,
      reason: error instanceof Error ? error.message : "Persistence failed.",
    };
  }
}

export async function savePolicyVersion(
  policy: IimaPolicyConfig,
  activate: boolean,
): Promise<{ id: string; policyVersion: string; active: boolean }> {
  if (!databaseConfigured()) throw new Error("DATABASE_URL is required for admin writes.");
  const metadata = policy.metadata.eligibility;
  return prisma.$transaction(async (tx) => {
    if (activate) await tx.admissionCycle.updateMany({ data: { active: false } });
    return tx.admissionCycle.upsert({
      where: { policyVersion: policy.version },
      update: {
        config: jsonSafe(policy),
        active: activate,
        verifiedDate: new Date(`${metadata.verifiedDate}T00:00:00Z`),
        notes: metadata.notes,
      },
      create: {
        name: policy.admissionCycle,
        catYear: policy.catYear,
        policyVersion: policy.version,
        active: activate,
        effectiveYear: metadata.effectiveYear,
        source: metadata.source,
        sourceType: metadata.sourceType,
        verifiedDate: new Date(`${metadata.verifiedDate}T00:00:00Z`),
        notes: metadata.notes,
        config: jsonSafe(policy),
      },
      select: { id: true, policyVersion: true, active: true },
    });
  });
}

export async function listPolicyVersions() {
  if (!databaseConfigured()) return [];
  return prisma.admissionCycle.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      catYear: true,
      policyVersion: true,
      active: true,
      verifiedDate: true,
      updatedAt: true,
    },
  });
}
