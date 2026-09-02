import { describe, expect, it } from "vitest";
import { estimateCat2025OverallPercentile, estimateCat2025OverallScaledScore, estimateCat2025SectionScaledScore } from "@/lib/iima";

describe("CAT 2025 expected overall percentile", () => {
  it.each([
    [0, 0],
    [36, 80],
    [59, 95],
    [80.5, 99],
    [106, 99.9],
    [204, 100],
  ])("maps score %s to percentile %s", (score, percentile) => {
    expect(estimateCat2025OverallPercentile(score)).toBe(percentile);
  });

  it("interpolates between published anchors", () => {
    expect(estimateCat2025OverallPercentile(53.75)).toBe(92.5);
  });

  it("inverts percentile anchors into internal planning scores", () => {
    expect(estimateCat2025OverallScaledScore(95)).toBe(59);
    expect(estimateCat2025SectionScaledScore(95)).toBe(19.67);
  });
});
