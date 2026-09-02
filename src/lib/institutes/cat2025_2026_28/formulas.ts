import type { CandidateInput, Category } from "@/types/iima";
import type { InstituteCatCutoff } from "@/types/institutes";

export type CategoryCutoffTable = Record<Category | "PWD", InstituteCatCutoff>;

export function categoryKey(candidate: CandidateInput): Category | "PWD" {
  return candidate.pwd ? "PWD" : candidate.category;
}

export function cutoffFrom(table: CategoryCutoffTable, candidate: CandidateInput): InstituteCatCutoff {
  return table[categoryKey(candidate)];
}

export function cutoff(overall: number | null, varc: number | null, dilr = varc, qa = varc): InstituteCatCutoff {
  return { overall, varc, dilr, qa };
}

export function isFemaleOrTransgender(candidate: CandidateInput): boolean {
  return candidate.gender === "FEMALE" || candidate.gender === "TRANSGENDER";
}

export function isProfessional(candidate: CandidateInput): boolean {
  return ["CA", "ICWA", "CMA", "CS", "FIAI"].includes(candidate.professionalQualification);
}

export function isEngineering(candidate: CandidateInput): boolean {
  return candidate.academicCategory === "AC_4" || /\b(B\.?\s*Tech|B\.?\s*E\.?|engineering|technology)\b/i.test(candidate.degreeName);
}

export function pointsAtLeast(value: number, bands: Array<[number, number]>): number {
  for (const [minimum, score] of bands) if (value >= minimum) return score;
  return 0;
}

export function pointsAtMost(value: number, bands: Array<[number, number]>): number {
  for (const [maximum, score] of bands) if (value <= maximum) return score;
  return bands[bands.length - 1]?.[1] ?? 0;
}

export function ageOn(dateOfBirth: string | undefined, cutoffDate: string): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  const cutoff = new Date(`${cutoffDate}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(cutoff.getTime())) return null;
  let age = cutoff.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = cutoff.getUTCMonth() < birth.getUTCMonth()
    || (cutoff.getUTCMonth() === birth.getUTCMonth() && cutoff.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}
