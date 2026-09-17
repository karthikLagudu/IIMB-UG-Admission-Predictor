// A transparent planning heuristic, not an IIMB admissions formula.
export const CALL_ESTIMATE_BUFFER_RATE = 0.15;
export const CALL_ESTIMATE_REFERENCE_PROFILE = 20;
export const CALL_ESTIMATE_RAW_MAXIMUM = 180;
export const CALL_ESTIMATE_TEST_WEIGHT = 70;

export function estimateCategoryRawTarget(historicalAggregateFloor: number, profilePoints: number) {
  const boundedProfile = Math.max(0, Math.min(30, profilePoints));
  const buffer = Math.ceil(historicalAggregateFloor * CALL_ESTIMATE_BUFFER_RATE);
  const profileAdjustment = Math.round(
    (CALL_ESTIMATE_REFERENCE_PROFILE - boundedProfile) * CALL_ESTIMATE_RAW_MAXIMUM / CALL_ESTIMATE_TEST_WEIGHT,
  );
  const provisional = historicalAggregateFloor + buffer + profileAdjustment;
  const target = Math.max(historicalAggregateFloor + 1, Math.min(CALL_ESTIMATE_RAW_MAXIMUM, provisional));

  return { target, buffer, profileAdjustment, provisional };
}
