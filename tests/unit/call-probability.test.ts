import { describe, expect, it } from "vitest";
import { estimateInterviewCallChance } from "@/lib/institutes/call-probability";

describe("interview-call chance", () => {
  it("is 50% at the configured shortlist benchmark", () => {
    const result = estimateInterviewCallChance({ eligible: true, score: 60, maxScore: 100, benchmark: 60 });
    expect(result.probability).toBe(0.5);
    expect(result.label).toBe("50.0%");
  });

  it("rises when the shortlist score is above the benchmark", () => {
    const result = estimateInterviewCallChance({ eligible: true, score: 70, maxScore: 100, benchmark: 60 });
    expect(result.probability).toBeGreaterThan(0.5);
  });

  it("hard-gates the estimate when eligibility fails", () => {
    const result = estimateInterviewCallChance({ eligible: false, score: 80, maxScore: 100, benchmark: 60 });
    expect(result.probability).toBe(0);
    expect(result.label).toBe("0.0%");
  });

  it("uses a numeric planning estimate without a fixed benchmark", () => {
    const result = estimateInterviewCallChance({ eligible: true, score: 80, maxScore: 100, benchmark: null, status: "ELIGIBLE_FOR_RANKING" });
    expect(result.probability).toBeCloseTo(0.86);
    expect(result.label).toBe("86.0%");
  });

  it("shows zero call chance for direct-merit programmes without interviews", () => {
    const result = estimateInterviewCallChance({ eligible: true, score: 90, maxScore: 100, benchmark: null, directMerit: true });
    expect(result.probability).toBe(0);
    expect(result.label).toBe("0.0%");
  });
});
