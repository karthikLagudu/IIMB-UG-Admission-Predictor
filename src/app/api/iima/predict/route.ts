import { NextResponse } from "next/server";
import { z } from "zod";
import { predictIimaAdmission } from "@/lib/iima/predictor";
import { loadActivePolicy, persistPrediction } from "@/lib/iima/persistence.sites";
import { candidateInputSchema, predictRequestSchema } from "@/lib/validation/iima";

const requestSchema = z.union([
  predictRequestSchema,
  candidateInputSchema.transform((candidate) => ({ candidate, poolContext: undefined })),
]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
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
    const policy = await loadActivePolicy();
    const result = predictIimaAdmission(parsed.data.candidate, policy, parsed.data.poolContext);
    const persistence = await persistPrediction({ candidate: parsed.data.candidate, policy, result });
    return NextResponse.json({ ...result, persistence, policyConfig: policy });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prediction failed." },
      { status: 500 },
    );
  }
}
