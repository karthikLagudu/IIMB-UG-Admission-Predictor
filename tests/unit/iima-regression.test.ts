import { describe, expect, it } from "vitest";
import { predictIimaAdmission, SAMPLE_CANDIDATE } from "@/lib/iima";

describe("IIMA regression contract after adding IIMB and IIMC", () => {
  it("preserves the existing sample result exactly", () => {
    const result = predictIimaAdmission(SAMPLE_CANDIDATE);
    expect(result.policyVersion).toBe("IIMA-CAT2025-v1.1.0");
    expect(result.applicationRating?.total).toBe(30.6);
    expect(result.compositeScore).toBe(0.7597832817337462);
    expect(result.callRoute).toBe("STAGE_1");
    expect(result.applicableCallThreshold).toBe(0.6112);
    expect(result.callMargin).toBe(0.14858328173374624);
    expect(result.finalSelection?.finalCompositeScore).toBe(0.7546130030959752);
    expect(result.finalSelection?.seatProbability).toBe(0.8334365887089185);
    expect(result.finalSelection?.predictionBand).toBe("STRONG");
  });
});
