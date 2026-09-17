import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";
import { CALL_ESTIMATE_REFERENCE_PROFILE, estimateCategoryCallRequirement } from "@/lib/iimb-ug/2027_31/call-score-estimate";
import { IimbUgSourceBadge } from "./source-badge";

const CATEGORY_ORDER = ["GENERAL", "NC_OBC", "EWS", "SC", "ST", "PWD"] as const;

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
          <div className="ug-call-estimate-heading"><span>Estimated call-score gap · {formatCategory(historical.resolvedCategory)}</span><IimbUgSourceBadge source="MODEL_ASSUMPTION" /></div>
          <div className="ug-call-estimate-metrics">
            <div><span>Estimated {formatCategory(historical.resolvedCategory)} total target</span><strong>{formatScore(estimate.categoryTarget100)}<small> / 100</small></strong></div>
            <div><span>You already have from your profile</span><strong>{formatScore(estimate.profilePoints)}<small> / 30</small></strong></div>
            <div className="ug-call-estimate-needed"><span>Still needed from the UG Test</span><strong>{estimate.reachable ? formatScore(estimate.examTarget70) : "Above 70"}<small> / 70</small></strong></div>
          </div>
          <p>{estimate.reachable ? `You have an estimated ${formatScore(estimate.profilePoints)}/30 from your profile. For ${formatCategory(historical.resolvedCategory)}, aim for about ${formatScore(estimate.examTarget70)}/70 on the exam; together that is approximately ${formatScore(estimate.estimatedPrePi100)}/100.` : "The estimated category target cannot be reached with the 70-point exam maximum from this profile estimate."} This is not a guaranteed interview-call score.</p>
          <code>{formatScore(estimate.categoryTarget100)} estimated category total − {formatScore(estimate.profilePoints)} profile = {formatScore(estimate.profileGap70)} / 70 remaining; compare with {formatScore(estimate.historicalGate70)} / 70 approximate historical aggregate gate → aim for {formatScore(estimate.examTarget70)} / 70</code>
          <p>The fixed category target uses a {CALL_ESTIMATE_REFERENCE_PROFILE}/30 reference profile plus ({benchmark.aggregateCanonicalScoreFloor} historical aggregate + {estimate.buffer} assumed 15% buffer) × 70/180. Your profile is then subtracted. The 180-to-70 conversion is only a simplifying assumption; the QADI percentile and positive-section rules still apply separately.</p>
        </div>
      )}

      <div className="ug-category-cutoff">
        <div><span>{formatCategory(historical.resolvedCategory)} · previous-cycle aggregate benchmark</span><strong>{benchmark.aggregateCanonicalScoreFloor}<small> / 180</small></strong></div>
        <div><span>{formatCategory(historical.resolvedCategory)} · Section 3 QADI minimum</span><strong>{benchmark.qadiPercentileFloor}<small>th percentile</small></strong></div>
      </div>

      <div className="ug-category-cutoff-table-wrap">
        <h3>Published thresholds by category</h3>
        <table className="ug-category-cutoff-table">
          <thead><tr><th scope="col">Category</th><th scope="col">QADI percentile</th><th scope="col">Aggregate benchmark</th></tr></thead>
          <tbody>{CATEGORY_ORDER.map((category) => {
            const row = IIMB_UG_2027_POLICY.historical.thresholds[category];
            return <tr key={category} className={category === historical.resolvedCategory ? "selected" : undefined}><th scope="row">{formatCategory(category)}{category === historical.resolvedCategory ? " · Your category" : ""}</th><td>{row.qadiPercentileFloor}th</td><td>{row.aggregateCanonicalScoreFloor}</td></tr>;
          })}</tbody>
        </table>
      </div>

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
          <div className="ug-safe-formula-panel">
            <div className="ug-safe-formula-heading"><span>Calculation trail</span><h3>How the profile contribution is estimated</h3></div>
            <p className="ug-panel-note">Class X overall: {formatScore(overallPercent ?? 0)}% ÷ 100 × 15 = {formatScore(overallPoints ?? 0)}. Class X Mathematics: {formatScore(mathPercent ?? 0)}% ÷ 100 × 10 = {formatScore(mathPoints ?? 0)}. Diversity: {formatScore(diversityPoints ?? 0)}. Total: {formatScore(profilePoints)} / 30. IIMB uses standardized scores; this direct-percentage calculation is an estimate.</p>
          </div>
        </>
      )}

      <p className="ug-call-section-warning">The first shortlist also requires a positive score in VARC, LR and QADI. The QADI percentile and aggregate benchmark must both be considered; neither guarantees an interview call.</p>
    </section>
  );
}
