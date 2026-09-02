import { describe, expect, it } from "vitest";
import {
  EMPTY_IIMB_UG_RUNTIME_DATA,
  IIMB_UG_2027_POLICY,
  IIMB_UG_TEST_RUNTIME_DATA,
  predictIimbUgAdmission,
  SAMPLE_IIMB_UG_CANDIDATE,
} from "@/lib/iimb-ug/2027_31";

describe("IIMB UG predictor orchestration", () => {
  it("keeps exam analytics available when eligibility fails", () => {
    const result = predictIimbUgAdmission({ ...SAMPLE_IIMB_UG_CANDIDATE, dateOfBirth: "2005-01-01" });
    expect(result.eligibility.status).toBe("INELIGIBLE");
    expect(result.exam.totalCanonical).toBe(125);
    expect(result.callOutlook.label).toBe("INELIGIBLE");
  });

  it("returns current threshold unknown rather than a fake call percentage", () => {
    const result = predictIimbUgAdmission(SAMPLE_IIMB_UG_CANDIDATE);
    expect(result.historicalShortlist.status).toBe("PASS");
    expect(result.callOutlook.label).toBe("CURRENT_THRESHOLD_UNKNOWN");
    expect(result.callOutlook.benchmark).toBeNull();
    expect(result.probability).toEqual(expect.objectContaining({ status: "DISABLED", value: null }));
  });

  it("returns DATA_REQUIRED in exact mode without normalization statistics", () => {
    const result = predictIimbUgAdmission(SAMPLE_IIMB_UG_CANDIDATE, {
      calculationMode: "EXACT",
      runtime: EMPTY_IIMB_UG_RUNTIME_DATA,
    });
    expect(result.prePi.status).toBe("DATA_REQUIRED");
    expect(result.postPi.status).toBe("DATA_REQUIRED");
    expect(result.prePi.components.some((component) => component.status === "DATA_REQUIRED")).toBe(true);
  });

  it("uses labelled synthetic data only when explicitly supplied", () => {
    const result = predictIimbUgAdmission(SAMPLE_IIMB_UG_CANDIDATE, {
      calculationMode: "EXACT",
      runtime: IIMB_UG_TEST_RUNTIME_DATA,
      finalTestStrategy: "TOTAL_RAW_LINEAR",
    });
    expect(result.prePi.status).toBe("ESTIMATED");
    expect(result.prePi.components.some((component) => component.sourceLabel?.includes("Synthetic"))).toBe(true);
  });

  it("keeps inaugural-cycle rules historical and separate from 2027 policy", () => {
    expect(IIMB_UG_2027_POLICY.exam.durationMinutes).toBe(135);
    expect(IIMB_UG_2027_POLICY.postPi.weights).toEqual({ class10Overall: 10, class10Math: 10, test: 40, pi: 40 });
    expect(IIMB_UG_2027_POLICY.exam.durationMinutes).not.toBe(120);
  });

  it("records programme preference without inventing allocation", () => {
    const result = predictIimbUgAdmission(SAMPLE_IIMB_UG_CANDIDATE);
    expect(result.programmePreference.preference1).toBe("DATA_SCIENCES");
    expect(result.programmePreference.preference2).toBe("ECONOMICS");
    expect(result.programmePreference.allocationStatus).toBe("PROGRAMME_ALLOCATION_DATA_REQUIRED");
  });
});

