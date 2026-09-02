import { NextResponse } from "next/server";
import { predictIimbUgAdmission } from "@/lib/iimb-ug/2027_31/predictor";
import { loadActiveIimbUgSnapshot, persistIimbUgPrediction } from "@/lib/iimb-ug/persistence.sites";
import { iimbUgPredictRequestSchema } from "@/validation/iimb-ug";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = iimbUgPredictRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }

  try {
    const snapshot = await loadActiveIimbUgSnapshot();
    const result = predictIimbUgAdmission(parsed.data.candidate, {
      policy: snapshot.policy,
      runtime: snapshot.runtime,
      calculationMode: parsed.data.calculationMode,
      targetFinalComposite: parsed.data.targetFinalComposite,
      testWeightingStrategy: parsed.data.testWeightingStrategy,
      academicWeightingStrategy: parsed.data.academicWeightingStrategy,
      finalTestStrategy: parsed.data.finalTestStrategy,
    });
    const persistence = await persistIimbUgPrediction({
      candidate: parsed.data.candidate,
      policy: snapshot.policy,
      runtime: snapshot.runtime,
      result,
      calculationMode: parsed.data.calculationMode,
      policyDatabaseId: snapshot.policyDatabaseId,
      runtimeDatabaseId: snapshot.runtimeDatabaseId,
    });
    return NextResponse.json({
      ...result,
      persistence,
      policyConfig: snapshot.policy,
      runtimeData: snapshot.runtime,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prediction failed." },
      { status: 500 },
    );
  }
}
