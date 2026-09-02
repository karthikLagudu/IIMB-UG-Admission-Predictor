import type { CandidateInput, Category } from "@/types/iima";

export function categoryKey(category: Category): string {
  return category;
}

export function pwdCategoryKey(candidate: Pick<CandidateInput, "category" | "pwd">): string {
  return candidate.pwd ? `PWD_${candidate.category}` : candidate.category;
}

export function pooledPwdKey(candidate: Pick<CandidateInput, "category" | "pwd">): string {
  return candidate.pwd ? "PWD" : candidate.category;
}

export function academicKey(candidate: Pick<CandidateInput, "category" | "pwd" | "academicCategory">): string {
  return `${pooledPwdKey(candidate)}|${candidate.academicCategory}`;
}
