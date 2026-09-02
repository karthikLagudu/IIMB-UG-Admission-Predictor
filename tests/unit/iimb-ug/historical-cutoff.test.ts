import { describe, expect, it } from "vitest";
import { evaluateHistoricalShortlist, IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31";

const evaluate = (category: "GENERAL" | "EWS" | "NC_OBC" | "SC" | "ST", qadiPercentile: number, totalCanonical: number, pwd = false) =>
  evaluateHistoricalShortlist({ candidate: { category, pwd, qadiPercentile }, totalCanonical, positiveSectionGate: true, policy: IIMB_UG_2027_POLICY });

describe("historical first-shortlist thresholds", () => {
  it("preserves exact General boundaries without rounding", () => {
    expect(evaluate("GENERAL", 79.999, 114).status).toBe("FAIL");
    expect(evaluate("GENERAL", 80, 113.999).status).toBe("FAIL");
    expect(evaluate("GENERAL", 80, 114).status).toBe("PASS");
  });

  it.each([
    ["NC_OBC", 75, 75],
    ["EWS", 75, 75],
    ["SC", 70, 51],
    ["ST", 70, 50],
  ] as const)("passes %s at its exact boundary", (category, qadi, aggregate) => {
    expect(evaluate(category, qadi, aggregate).status).toBe("PASS");
  });

  it("uses the horizontal PwD override while preserving the base category input", () => {
    const result = evaluate("SC", 70, 60, true);
    expect(result.resolvedCategory).toBe("PWD");
    expect(result.status).toBe("PASS");
    expect(result.benchmark.aggregateCanonicalScoreFloor).toBe(60);
  });

  it("requires QADI percentile instead of inventing a raw-to-percentile conversion", () => {
    const result = evaluateHistoricalShortlist({
      candidate: { category: "GENERAL", pwd: false, qadiPercentile: undefined },
      totalCanonical: 150,
      positiveSectionGate: true,
      policy: IIMB_UG_2027_POLICY,
    });
    expect(result.status).toBe("DATA_REQUIRED");
  });
});

