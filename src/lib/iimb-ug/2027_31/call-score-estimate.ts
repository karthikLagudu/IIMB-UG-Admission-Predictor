// Transparent planning heuristic. IIMB has not published a category-wise Pre-PI call cutoff.
export const CALL_ESTIMATE_BUFFER_RATE = 0.15;
export const CALL_ESTIMATE_REFERENCE_PROFILE = 20;
export const CALL_ESTIMATE_RAW_MAXIMUM = 180;
export const CALL_ESTIMATE_TEST_WEIGHT = 70;

function roundUpHundredth(value: number) {
  return Math.ceil(value * 100 - 1e-9) / 100;
}

export function estimateCategoryCallRequirement(historicalAggregateFloor: number, profilePoints: number) {
  const boundedProfile = Math.max(0, Math.min(30, profilePoints));
  const buffer = Math.ceil(historicalAggregateFloor * CALL_ESTIMATE_BUFFER_RATE);
  const bufferedAggregate = historicalAggregateFloor + buffer;
  // Hold this category target fixed across students; only the remaining exam need changes with profile.
  const categoryTarget100 = roundUpHundredth(
    CALL_ESTIMATE_REFERENCE_PROFILE + bufferedAggregate * CALL_ESTIMATE_TEST_WEIGHT / CALL_ESTIMATE_RAW_MAXIMUM,
  );
  const profileGap70 = roundUpHundredth(Math.max(0, categoryTarget100 - boundedProfile));
  const historicalGate70 = roundUpHundredth(
    historicalAggregateFloor * CALL_ESTIMATE_TEST_WEIGHT / CALL_ESTIMATE_RAW_MAXIMUM,
  );
  const examTarget70 = Math.max(profileGap70, historicalGate70);
  const estimatedPrePi100 = Math.round((boundedProfile + examTarget70) * 100) / 100;

  return {
    profilePoints: boundedProfile,
    categoryTarget100,
    profileGap70,
    historicalGate70,
    examTarget70,
    estimatedPrePi100,
    buffer,
    bufferedAggregate,
    reachable: examTarget70 <= CALL_ESTIMATE_TEST_WEIGHT,
  };
}
