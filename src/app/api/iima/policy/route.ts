import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { IIMA_CAT_2025_POLICY } from "@/lib/iima/constants";
import { listPolicyVersions, loadActivePolicy, savePolicyVersion } from "@/lib/iima/persistence.sites";
import { policyConfigSchema } from "@/lib/validation/iima";
import type { IimaPolicyConfig } from "@/types/iima";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const [activePolicy, versions] = await Promise.all([loadActivePolicy(), listPolicyVersions()]);
  return NextResponse.json({ activePolicy, versions, fallbackPolicy: IIMA_CAT_2025_POLICY });
}

const bodySchema = z.object({
  config: policyConfigSchema,
  activate: z.boolean().default(true),
});

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid policy configuration.", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  try {
    const saved = await savePolicyVersion(parsed.data.config as IimaPolicyConfig, parsed.data.activate);
    return NextResponse.json({ saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Policy update failed." },
      { status: 500 },
    );
  }
}
