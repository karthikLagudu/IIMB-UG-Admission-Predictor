import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { EMPTY_IIMB_UG_RUNTIME_DATA, IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";
import {
  listIimbUgVersions,
  loadActiveIimbUgSnapshot,
  saveIimbUgRuntimeVersion,
} from "@/lib/iimb-ug/persistence";
import { iimbUgRuntimeSchema } from "@/validation/iimb-ug";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const [snapshot, versions] = await Promise.all([
    loadActiveIimbUgSnapshot(),
    listIimbUgVersions(),
  ]);
  return NextResponse.json({
    activeRuntime: snapshot.runtime,
    fallbackRuntime: EMPTY_IIMB_UG_RUNTIME_DATA,
    policyVersion: snapshot.policy.version,
    versions: versions.runtimeDatasets,
  });
}

const bodySchema = z.object({
  data: iimbUgRuntimeSchema,
  policyVersion: z.string().min(1).default(IIMB_UG_2027_POLICY.version),
  activate: z.boolean().default(true),
});

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid IIMB UG runtime dataset.", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  try {
    const saved = await saveIimbUgRuntimeVersion({
      runtime: parsed.data.data,
      policyVersion: parsed.data.policyVersion,
      activate: parsed.data.activate,
    });
    return NextResponse.json({ saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Runtime update failed." },
      { status: 409 },
    );
  }
}
