import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { CALL_ESTIMATE_BUFFER_RATE, CALL_ESTIMATE_REFERENCE_PROFILE, PREVIOUS_YEAR_TARGET_ADJUSTMENT, SAFE_SCORE_BUFFER_RATE, THIS_YEAR_TARGET_INCREMENT_DIVISOR, estimateCategoryCallRequirement } from "@/lib/iimb-ug/2027_31/call-score-estimate";
import { IimbUgSourceBadge } from "./source-badge";

function formatScore(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}

function formatCategory(category: IimbUgPredictionResult["historicalShortlist"]["resolvedCategory"]) {
  return category === "NC_OBC" ? "NC-OBC" : category === "PWD" ? "PwD" : category === "GENERAL" ? "General" : category;
}

export function CallScoreRequirement({ result }: { result: IimbUgPredictionResult }) {
  const historical = result.historicalShortlist;
  const benchmark = historical.benchmark;
  const { prePi } = result;
  const profilePoints = prePi.prePi == null || prePi.test70 == null ? null : prePi.prePi - prePi.test70;
  const overallPoints = prePi.components.find((component) => component.key === "prepi-class10Overall")?.weightedValue;
  const mathPoints = prePi.components.find((component) => component.key === "prepi-class10Math")?.weightedValue;
  const diversityPoints = prePi.components.find((component) => component.key === "prepi-gender")?.weightedValue;
  const overallPercent = prePi.components.find((component) => component.key === "prepi-class10Overall")?.rawValue;
  const mathPercent = prePi.components.find((component) => component.key === "prepi-class10Math")?.rawValue;
  const estimate = profilePoints == null ? null : estimateCategoryCallRequirement(benchmark.aggregateCanonicalScoreFloor, profilePoints);

  return (
    <section className="ug-panel ug-call-score-panel" aria-labelledby="ug-call-score-heading">
      <div className="ug-panel-heading">
        <div><span>30% profile · 70% UG Test</span><h2 id="ug-call-score-heading">Your profile and estimated exam target</h2></div>
        <IimbUgSourceBadge source="OFFICIAL_HISTORICAL" />
      </div>

      <div className="ug-call-score-notice">
        <strong>IIM Bangalore has not published a 2027 category-wise interview-call cutoff.</strong>
        <p>IIMB publishes the 30-point profile and 70-point test weights, but not the 2027 Pre-PI score needed for a call. The category total below is a planning estimate anchored to the previous-cycle first-shortlist benchmark, not an official cutoff or guarantee.</p>
      </div>

      {estimate != null && result.eligibility.status !== "INELIGIBLE" && (
        <div className="ug-call-estimate">
          <div className="ug-call-estimate-heading"><span>Estimated score target · {formatCategory(historical.resolvedCategory)}</span><IimbUgSourceBadge source="MODEL_ASSUMPTION" /></div>
          <div className="ug-call-estimate-metrics">
            <div><span>This Year&apos;s Estimated Total Target · {formatCategory(historical.resolvedCategory)}</span><strong>{formatScore(estimate.thisYearCategoryTarget100)}<small> / 100</small></strong><em>This Year&apos;s Estimated Cut off</em></div>
            <div className="ug-call-estimate-primary"><span>Test score to aim for</span><strong>{estimate.reachable ? formatScore(estimate.examTarget180) : "Above 180"}<small> / 180</small></strong></div>
          </div>
          <div className="ug-safe-score-target">
            <div><span>Safe Score</span><strong>{estimate.safeScoreReachable ? formatScore(estimate.safeScore180) : "Above 180"}{estimate.safeScoreReachable && <small> / 180</small>}</strong></div>
            <code>ceil({formatScore(estimate.examTarget180)} + {formatScore(estimate.examTarget180)} × {formatScore(SAFE_SCORE_BUFFER_RATE * 100)}%) = {formatScore(estimate.safeScore180)}</code>
            <p>The safe score adds 5% to the test score to aim for and rounds upward to the next whole mark. It is a planning buffer, not an official cutoff or guarantee.</p>
          </div>
          <p>{estimate.reachable ? `Based on the selected profile and ${formatCategory(historical.resolvedCategory)} category, aim for approximately ${formatScore(estimate.examTarget180)}/180 on the test.` : "The estimated category target cannot be reached with the test maximum for this profile."} This is a planning estimate, not a guaranteed interview-call score. The full formula remains in the calculation trail below.</p>
        </div>
      )}

      {result.eligibility.status === "INELIGIBLE" && (
        <div className="ug-call-score-blocked"><strong>Eligibility requirements are not met.</strong><span>Meeting a historical cutoff cannot compensate for failed eligibility. Review the eligibility panel below.</span></div>
      )}

      {profilePoints != null && (
        <>
          <div className="ug-profile-score-hero">
            <div><span>Your estimated academic/profile contribution</span></div>
            <strong>{formatScore(profilePoints)} <small>/ 30</small></strong>
            <p>Class X overall, Class X Mathematics and diversity contribute to the later Pre-PI ranking. This does not change the published first-shortlist thresholds for your category.</p>
          </div>
          <div className="ug-call-score-baseline">
            <div><span>Class X overall</span><strong>{overallPoints == null ? "Required" : `${formatScore(overallPoints)} / 15`}</strong></div>
            <div><span>Class X Mathematics</span><strong>{mathPoints == null ? "Required" : `${formatScore(mathPoints)} / 10`}</strong></div>
            <div><span>Diversity contribution</span><strong>{diversityPoints == null ? "Required" : `${formatScore(diversityPoints)} / 5`}</strong></div>
          </div>
          {estimate != null && (
            <div className="ug-safe-formula-panel">
              <div className="ug-safe-formula-heading"><span>Full calculation trail</span><h3>How every score is derived</h3></div>
              <ol>
                <li><b>1</b><div><strong>Calculate your profile contribution / 30</strong><code>({formatScore(overallPercent ?? 0)} ÷ 100 × 15) + ({formatScore(mathPercent ?? 0)} ÷ 100 × 10) + {formatScore(diversityPoints ?? 0)} diversity = {formatScore(profilePoints)} / 30</code><p>The 15, 10 and 5 point weights are official. The site estimates academic points directly from Class X percentages and infers the diversity award from the selected gender. IIMB uses standardized academic scores, so actual profile points may differ.</p></div></li>
                <li><b>2</b><div><strong>Read your category’s previous-cycle benchmark</strong><code>{formatCategory(historical.resolvedCategory)}: aggregate {benchmark.aggregateCanonicalScoreFloor} / 180; QADI at least {benchmark.qadiPercentileFloor}th percentile</code><p>These are published first-shortlist thresholds for UG Test 2025, not the 2027 interview-call cutoff. The aggregate is interpreted as canonical marks because values such as 114 cannot be percentiles. QADI is a separate percentile rule, not points to add to the total.</p></div></li>
                <li><b>3</b><div><strong>Build the internal category baseline</strong><code>Buffer = ceil({benchmark.aggregateCanonicalScoreFloor} × {formatScore(CALL_ESTIMATE_BUFFER_RATE * 100)}%) = {estimate.buffer}; baseline = round up [{CALL_ESTIMATE_REFERENCE_PROFILE} + ({benchmark.aggregateCanonicalScoreFloor} + {estimate.buffer}) × 70 ÷ 180] = {formatScore(estimate.categoryTarget100)} / 100</code><p>The {CALL_ESTIMATE_REFERENCE_PROFILE}/30 reference profile, {formatScore(CALL_ESTIMATE_BUFFER_RATE * 100)}% buffer and conversion are planning assumptions used internally.</p></div></li>
                <li><b>4</b><div><strong>Calculate this year’s estimated total target</strong><code>Previous-year target = {formatScore(estimate.categoryTarget100)} − {PREVIOUS_YEAR_TARGET_ADJUSTMENT} = {formatScore(estimate.previousYearCategoryTarget100)}; this year = {formatScore(estimate.previousYearCategoryTarget100)} + ({formatScore(estimate.previousYearCategoryTarget100)} ÷ {THIS_YEAR_TARGET_INCREMENT_DIVISOR}) = {formatScore(estimate.thisYearCategoryTarget100)} / 100</code><p>The fixed 1.34 reduction and one-eighth uplift are planning assumptions. Only this year’s estimated target is displayed above.</p></div></li>
                <li><b>5</b><div><strong>Subtract the student’s profile score</strong><code>Y = {formatScore(estimate.thisYearCategoryTarget100)} − {formatScore(estimate.profilePoints)} = {formatScore(estimate.examTarget70)} / 70</code><p>The subtraction is completed before converting the result to the 180-point test scale.</p></div></li>
                <li><b>6</b><div><strong>Calculate the test score to aim for</strong><code>ceil({formatScore(estimate.examTarget70)} ÷ 70 × 180) = {formatScore(estimate.examTarget180)} / 180</code><p>The result is rounded upward to a whole test mark. This is a planning conversion, not an official IIMB score transformation.</p></div></li>
                <li><b>7</b><div><strong>Add the 5% safe-score buffer</strong><code>ceil({formatScore(estimate.examTarget180)} + {formatScore(estimate.examTarget180)} × {formatScore(SAFE_SCORE_BUFFER_RATE * 100)}%) = {formatScore(estimate.safeScore180)} / 180</code><p>The safe score is rounded upward to a whole mark. A value above 180 is displayed as “Above 180”.</p></div></li>
                <li><b>8</b><div><strong>See the estimated Pre-PI total</strong><code>{formatScore(estimate.profilePoints)} profile + {formatScore(estimate.examTarget70)} exam = {formatScore(estimate.estimatedPrePi100)} / 100</code><p>The exam has an official 70-point weight: QADI 30, LR 20 and VARC 20. A positive score in every section and the separate QADI percentile condition still matter. This total does not guarantee an interview call.</p></div></li>
              </ol>
            </div>
          )}
        </>
      )}

      <p className="ug-call-section-warning">The first shortlist also requires a positive score in VARC, LR and QADI. The QADI percentile and aggregate benchmark must both be considered; neither guarantees an interview call.</p>
    </section>
  );
}
