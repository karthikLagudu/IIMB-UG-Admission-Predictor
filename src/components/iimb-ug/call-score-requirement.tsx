import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";
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

  return (
    <section className="ug-panel ug-call-score-panel" aria-labelledby="ug-call-score-heading">
      <div className="ug-panel-heading">
        <div><span>Category-specific published thresholds</span><h2 id="ug-call-score-heading">Your previous-cycle first-shortlist benchmark</h2></div>
        <IimbUgSourceBadge source="OFFICIAL_HISTORICAL" />
      </div>

      <div className="ug-call-score-notice">
        <strong>IIM Bangalore has not published a 2027 category-wise interview-call cutoff.</strong>
        <p>The values below were used for the UG Test 2025 first shortlist. Interview-call scores were higher. We cannot calculate a reliable personalized safe score from these thresholds, so no shared model score is shown as your cutoff.</p>
      </div>

      <div className="ug-category-cutoff">
        <div><span>{formatCategory(historical.resolvedCategory)} · aggregate benchmark</span><strong>{benchmark.aggregateCanonicalScoreFloor}<small> previous cycle</small></strong></div>
        <div><span>{formatCategory(historical.resolvedCategory)} · Section 3 QADI</span><strong>{benchmark.qadiPercentileFloor}<small>th percentile</small></strong></div>
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
