import { describe, expect, it } from "vitest";
import { IIMB_UG_2027_POLICY, SAMPLE_IIMB_UG_CANDIDATE } from "@/lib/iimb-ug/2027_31";
import { iimbUgCandidateSchema, iimbUgPolicySchema } from "@/validation/iimb-ug";

describe("IIMB UG input validation", () => {
  it("accepts the documented sample", () => {
    expect(iimbUgCandidateSchema.safeParse(SAMPLE_IIMB_UG_CANDIDATE).success).toBe(true);
  });

  it("requires exact section question totals", () => {
    const parsed = iimbUgCandidateSchema.safeParse({ ...SAMPLE_IIMB_UG_CANDIDATE, varcUnattempted: 2 });
    expect(parsed.success).toBe(false);
  });

  it("rejects a supplied raw score inconsistent with attempts", () => {
    const parsed = iimbUgCandidateSchema.safeParse({ ...SAMPLE_IIMB_UG_CANDIDATE, varcCanonicalRaw: 30 });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues.map((issue) => issue.message).join(" ")).toContain("does not match supplied attempts");
  });

  it("rejects duplicate programme preferences", () => {
    expect(iimbUgCandidateSchema.safeParse({ ...SAMPLE_IIMB_UG_CANDIDATE, secondPreference: "DATA_SCIENCES" }).success).toBe(false);
  });

  it("validates policy weight totals", () => {
    expect(iimbUgPolicySchema.safeParse(IIMB_UG_2027_POLICY).success).toBe(true);
    expect(iimbUgPolicySchema.safeParse({
      ...IIMB_UG_2027_POLICY,
      prePi: { ...IIMB_UG_2027_POLICY.prePi, weights: { ...IIMB_UG_2027_POLICY.prePi.weights, gender: 6 } },
    }).success).toBe(false);
  });
});
