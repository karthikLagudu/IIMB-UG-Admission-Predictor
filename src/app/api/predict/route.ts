import { NextResponse } from "next/server";
import { predictIimaAdmission } from "@/lib/iima/predictor";
import { loadActivePolicy, persistPrediction } from "@/lib/iima/persistence.sites";
import { predictAllNonIimaInstitutes, predictInstituteAdmission } from "@/lib/institutes";
import type { InstituteKey } from "@/types/institutes";
import { institutePredictRequestSchema } from "@/lib/validation/institutes";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = institutePredictRequestSchema.safeParse(body);
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
    const { institute, candidate, poolContext, useTestModel } = parsed.data;
    if (institute === "IIMA") {
      const policy = await loadActivePolicy();
      const result = predictIimaAdmission(candidate, policy, poolContext);
      const persistence = await persistPrediction({ candidate, policy, result });
      return NextResponse.json({ resultKind: "IIMA", result, persistence, policyConfig: policy });
    }
    if (institute === "ALL") {
      return NextResponse.json({
        resultKind: "INSTITUTE_COLLECTION",
        results: predictAllNonIimaInstitutes(candidate, useTestModel),
        persistence: { persisted: false, runId: null, reason: "Non-IIMA storage is not enabled; existing IIMA saved-result behavior is unchanged." },
      });
    }
    return NextResponse.json({
      resultKind: "INSTITUTE",
      result: predictInstituteAdmission(institute as Exclude<InstituteKey, "IIMA">, candidate, useTestModel),
      persistence: { persisted: false, runId: null, reason: `${institute} storage is not enabled; existing IIMA saved-result behavior is unchanged.` },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prediction failed." },
      { status: 500 },
    );
  }
}
