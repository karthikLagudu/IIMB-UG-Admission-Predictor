import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";
import { IIMB_UG_SOURCES } from "@/lib/iimb-ug/2027_31/sources";
import {
  listIimbUgVersions,
  loadActiveIimbUgSnapshot,
  saveIimbUgPolicyVersion,
} from "@/lib/iimb-ug/persistence";
import { iimbUgPolicySchema } from "@/validation/iimb-ug";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const [snapshot, versions] = await Promise.all([
    loadActiveIimbUgSnapshot(),
    listIimbUgVersions(),
  ]);
  return NextResponse.json({
    activePolicy: snapshot.policy,
    fallbackPolicy: IIMB_UG_2027_POLICY,
    sources: IIMB_UG_SOURCES,
    versions: versions.policies,
  });
}

const bodySchema = z.object({
  config: iimbUgPolicySchema,
  activate: z.boolean().default(true),
});

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid IIMB UG policy configuration.", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  try {
    const saved = await saveIimbUgPolicyVersion(parsed.data.config, parsed.data.activate);
    return NextResponse.json({ saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Policy update failed." },
      { status: 409 },
    );
  }
}
