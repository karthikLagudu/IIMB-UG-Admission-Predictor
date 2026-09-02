import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { databaseConfigured } from "@/lib/iima/persistence.sites";
import { prisma } from "@/lib/db.sites";

const mappingSchema = z.object({
  degreeName: z.string().trim().min(2).max(160),
  academicCategory: z.enum([
    "AC_1_PART_I",
    "AC_1_PART_II",
    "AC_2",
    "AC_3",
    "AC_4",
    "AC_5",
    "AC_6",
  ]),
  aliases: z.array(z.string().trim().min(1).max(160)).max(30).default([]),
});

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ mappings: [] });
  const mappings = await prisma.degreeMapping.findMany({
    orderBy: { degreeName: "asc" },
    include: { academicCategory: { select: { code: true, label: true } } },
  });
  return NextResponse.json({ mappings });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "DATABASE_URL is required for mapping writes." }, { status: 503 });
  const parsed = mappingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid degree mapping.", issues: parsed.error.issues }, { status: 422 });
  const activeCategory = await prisma.academicCategory.findFirst({
    where: { code: parsed.data.academicCategory, admissionCycle: { active: true } },
    orderBy: { admissionCycle: { updatedAt: "desc" } },
  });
  if (!activeCategory) return NextResponse.json({ error: "Seed the active admission policy before adding degree mappings." }, { status: 409 });
  const normalizedName = parsed.data.degreeName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const mapping = await prisma.degreeMapping.upsert({
    where: {
      academicCategoryId_normalizedName: {
        academicCategoryId: activeCategory.id,
        normalizedName,
      },
    },
    update: { degreeName: parsed.data.degreeName, aliases: parsed.data.aliases, active: true },
    create: {
      academicCategoryId: activeCategory.id,
      degreeName: parsed.data.degreeName,
      normalizedName,
      aliases: parsed.data.aliases,
    },
  });
  return NextResponse.json({ mapping });
}
