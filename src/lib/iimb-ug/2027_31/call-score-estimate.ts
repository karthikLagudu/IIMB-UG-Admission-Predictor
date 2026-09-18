// Transparent planning heuristic. IIMB has not published a category-wise Pre-PI call cutoff.
export const CALL_ESTIMATE_BUFFER_RATE = 0.15;
export const CALL_ESTIMATE_REFERENCE_PROFILE = 20;
export const CALL_ESTIMATE_RAW_MAXIMUM = 180;
export const CALL_ESTIMATE_TEST_WEIGHT = 70;
export const THIS_YEAR_TARGET_INCREMENT_DIVISOR = 8;
export const PREVIOUS_YEAR_TARGET_ADJUSTMENT = 1.34;
export const SAFE_SCORE_BUFFER_RATE = 0.05;

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
  const previousYearCategoryTarget100 = roundUpHundredth(
    categoryTarget100 - PREVIOUS_YEAR_TARGET_ADJUSTMENT,
  );
  const thisYearCategoryTarget100 = roundUpHundredth(
    previousYearCategoryTarget100 + previousYearCategoryTarget100 / THIS_YEAR_TARGET_INCREMENT_DIVISOR,
  );
  const examTarget70 = Math.max(0, thisYearCategoryTarget100 - boundedProfile);
  const profileGap70 = roundUpHundredth(examTarget70);
  const examTarget180 = Math.ceil(examTarget70 * CALL_ESTIMATE_RAW_MAXIMUM / CALL_ESTIMATE_TEST_WEIGHT - 1e-9);
  const safeScore180 = Math.ceil(examTarget180 * (1 + SAFE_SCORE_BUFFER_RATE) - 1e-9);
  const estimatedPrePi100 = Math.round((boundedProfile + examTarget70) * 100) / 100;

  return {
    profilePoints: boundedProfile,
    categoryTarget100,
    previousYearCategoryTarget100,
    thisYearCategoryTarget100,
    profileGap70,
    examTarget70,
    examTarget180,
    safeScore180,
    estimatedPrePi100,
    buffer,
    bufferedAggregate,
    reachable: examTarget70 <= CALL_ESTIMATE_TEST_WEIGHT,
    safeScoreReachable: safeScore180 <= CALL_ESTIMATE_RAW_MAXIMUM,
  };
}
