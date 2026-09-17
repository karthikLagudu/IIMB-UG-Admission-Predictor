import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";
import { PRE_PI_CALL_PLANNING_BANDS } from "@/lib/iimb-ug/2027_31/predictor";
import { IimbUgSourceBadge } from "./source-badge";

const TEST_MAXIMUM = 70;
const CANONICAL_SECTION_MAXIMUMS = { varc: 45, lr: 45, qadi: 90 } as const;
const CATEGORY_ORDER = ["GENERAL", "NC_OBC", "EWS", "SC", "ST", "PWD"] as const;

function formatScore(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}

function formatCategory(category: IimbUgPredictionResult["historicalShortlist"]["resolvedCategory"]) {
  return category === "NC_OBC" ? "NC-OBC" : category === "PWD" ? "PwD" : category;
}

function profileStrength(score: number) {
  if (score >= 25) return { label: "Strong profile", tone: "strong" };
  if (score >= 20) return { label: "Good profile", tone: "good" };
  if (score >= 15) return { label: "Moderate profile", tone: "moderate" };
  return { label: "Limited profile contribution", tone: "limited" };
}

function balancedRawPlan(requiredTestScore: number) {
  const proportion = requiredTestScore / TEST_MAXIMUM;
  const varc = Math.ceil(CANONICAL_SECTION_MAXIMUMS.varc * proportion);
  const lr = Math.ceil(CANONICAL_SECTION_MAXIMUMS.lr * proportion);
  const qadi = Math.ceil(CANONICAL_SECTION_MAXIMUMS.qadi * proportion);
  return { varc, lr, qadi, total: varc + lr + qadi };
}

export function CallScoreRequirement({ result }: { result: IimbUgPredictionResult }) {
  const { prePi } = result;
  const profilePoints = prePi.prePi == null || prePi.test70 == null
    ? null
    : prePi.prePi - prePi.test70;
  const overallPoints = prePi.components.find((component) => component.key === "prepi-class10Overall")?.weightedValue;
  const mathPoints = prePi.components.find((component) => component.key === "prepi-class10Math")?.weightedValue;
  const diversityPoints = prePi.components.find((component) => component.key === "prepi-gender")?.weightedValue;
  const overallPercent = prePi.components.find((component) => component.key === "prepi-class10Overall")?.rawValue;
  const mathPercent = prePi.components.find((component) => component.key === "prepi-class10Math")?.rawValue;
  const historical = result.historicalShortlist;
  const safeRequiredTest = profilePoints == null
    ? null
    : Math.max(0, PRE_PI_CALL_PLANNING_BANDS.strong - profilePoints);
  const safeRawPlan = safeRequiredTest == null
    ? null
    : balancedRawPlan(safeRequiredTest);
  const historicalAggregateFloor = historical.benchmark.aggregateCanonicalScoreFloor;
  const recommendedRawTarget = safeRawPlan == null
    ? null
    : Math.max(safeRawPlan.total, historicalAggregateFloor);
  const recommendationBasis = safeRawPlan == null
    ? null
    : safeRawPlan.total >= historicalAggregateFloor
      ? "Your personalized safe-score plan is the higher requirement."
      : "The previous-cycle category benchmark is the higher requirement.";
  const strength = profilePoints == null ? null : profileStrength(profilePoints);

  return (
    <section className="ug-panel ug-call-score-panel" aria-labelledby="ug-call-score-heading">
      <div className="ug-panel-heading">
        <div><span>Category cutoff and planning estimate</span><h2 id="ug-call-score-heading">Your category’s published benchmark</h2></div>
        <IimbUgSourceBadge source="OFFICIAL_HISTORICAL" />
      </div>

      <div className="ug-call-score-notice">
        <strong>The 2027 category-wise interview-call cutoff has not been published.</strong>
        <p>These are the official previous-cycle first-shortlist thresholds, not guaranteed interview-call scores. The separate 80/100 Pre-PI planning band is an app assumption shared across categories.</p>
      </div>

      <div className="ug-category-cutoff">
        <div><span>{formatCategory(historical.resolvedCategory)} · previous-cycle first shortlist</span><strong>{historicalAggregateFloor}<small> aggregate benchmark</small></strong></div>
        <div><span>Section 3 (QADI) minimum</span><strong>{historical.benchmark.qadiPercentileFloor}<small>th percentile</small></strong></div>
      </div>
      <div className="ug-category-cutoff-table-wrap">
        <h3>Published thresholds by category</h3>
        <table className="ug-category-cutoff-table">
          <thead><tr><th scope="col">Category</th><th scope="col">QADI percentile</th><th scope="col">Aggregate benchmark</th></tr></thead>
          <tbody>{CATEGORY_ORDER.map((category) => {
            const benchmark = IIMB_UG_2027_POLICY.historical.thresholds[category];
            return <tr key={category} className={category === historical.resolvedCategory ? "selected" : undefined}><th scope="row">{formatCategory(category)}{category === historical.resolvedCategory ? " · Your category" : ""}</th><td>{benchmark.qadiPercentileFloor}th</td><td>{benchmark.aggregateCanonicalScoreFloor}</td></tr>;
          })}</tbody>
        </table>
      </div>

      {result.eligibility.status === "INELIGIBLE" ? (
        <div className="ug-call-score-blocked"><strong>No test score can compensate for failed eligibility.</strong><span>Review the eligibility panel before using the score targets.</span></div>
      ) : profilePoints == null ? (
        <div className="ug-call-score-blocked"><strong>More profile data is required.</strong><span>Complete the academic fields to calculate a personalized exam-score target.</span></div>
      ) : (
        <>
          <div className="ug-profile-score-hero">
            <div><span>Your academic/profile score</span>{strength && <b className={`ug-profile-strength ${strength.tone}`}>{strength.label}</b>}</div>
            <strong>{formatScore(profilePoints)} <small>/ 30</small></strong>
            <p>This represents your profile strength from academics and diversity. The exam contributes the remaining 70 points.</p>
          </div>
          <div className="ug-call-score-baseline">
            <div><span>Class X overall</span><strong>{overallPoints == null ? "Required" : `${formatScore(overallPoints)} / 15`}</strong></div>
            <div><span>Class X Mathematics</span><strong>{mathPoints == null ? "Required" : `${formatScore(mathPoints)} / 10`}</strong></div>
            <div><span>Diversity contribution</span><strong>{diversityPoints == null ? "Required" : `${formatScore(diversityPoints)} / 5`}</strong></div>
          </div>
          <div className="ug-benchmark-recommendation">
            <div className="ug-recommended-score">
              <span>Model planning score · not an official cutoff</span>
              <strong>{recommendedRawTarget} <small>/ 180</small></strong>
              <p>This estimate is the higher of your profile-based 80/100 plan and your category’s historical aggregate benchmark. It can be identical across categories when the common 80/100 plan is higher.</p>
            </div>
            <div className="ug-historical-guardrail">
              <div className="ug-historical-title"><span>Previous-cycle official benchmark</span><strong>{formatCategory(historical.resolvedCategory)}</strong></div>
              <dl>
                <div><dt>Aggregate floor</dt><dd>{historicalAggregateFloor} / 180</dd></div>
                <div><dt>QADI percentile</dt><dd>{historical.benchmark.qadiPercentileFloor} minimum</dd></div>
                <div><dt>Section rule</dt><dd>Positive in all sections</dd></div>
              </dl>
              <p>{recommendationBasis} The historical figures are not the confirmed 2027 interview-call cutoff.</p>
            </div>
          </div>
          <div className="ug-safe-formula-panel">
            <div className="ug-safe-formula-heading"><span>Calculation trail</span><h3>How your safe score was calculated</h3></div>
            <ol>
              <li>
                <b>1</b>
                <div><strong>Calculate profile strength out of 30</strong><code>({formatScore(overallPercent ?? 0)} ÷ 100 × 15) + ({formatScore(mathPercent ?? 0)} ÷ 100 × 10) + {formatScore(diversityPoints ?? 0)} diversity = {formatScore(profilePoints)} / 30</code><p>Class X overall contributes 15 points, Class X Mathematics contributes 10, and eligible gender diversity contributes 5.</p></div>
              </li>
              <li>
                <b>2</b>
                <div><strong>Find the safe weighted exam score</strong><code>{PRE_PI_CALL_PLANNING_BANDS.strong} strong target − {formatScore(profilePoints)} profile = {formatScore(safeRequiredTest ?? 0)} / 70 needed</code><p>The safe plan uses the stronger 80/100 Pre-PI band rather than the lower 70/100 competitive band.</p></div>
              </li>
              <li>
                <b>3</b>
                <div><strong>Convert it into a balanced raw-score plan</strong><code>Required performance = {formatScore(safeRequiredTest ?? 0)} ÷ 70 = {formatScore(((safeRequiredTest ?? 0) / 70) * 100)}%</code><p>Apply that rate to each section and round upward: VARC {safeRawPlan?.varc}/45 + LR {safeRawPlan?.lr}/45 + QADI {safeRawPlan?.qadi}/90 = {safeRawPlan?.total}/180.</p></div>
              </li>
              <li>
                <b>4</b>
                <div><strong>Apply the historical category guardrail</strong><code>max({safeRawPlan?.total} personalized raw plan, {historicalAggregateFloor} historical {formatCategory(historical.resolvedCategory)} floor) = {recommendedRawTarget} / 180</code><p>This produces the displayed safe-score recommendation. The separate QADI percentile and positive-section rules must still be satisfied.</p></div>
              </li>
            </ol>
          </div>
          <p className="ug-call-section-warning">In addition to the total target, the student must obtain a positive raw score in VARC, LR and QADI. Zero in any section fails the published first-shortlist gate.</p>
          <p className="ug-panel-note">“Safe” means a conservative planning buffer; it does not guarantee an interview call. Balanced raw plans distribute the required performance proportionally across VARC, LR and QADI and round each section upward. A different section mix can produce the same weighted score. QADI percentile cannot be converted reliably into marks until IIMB publishes the relevant score-to-percentile mapping. The UG raw-to-weighted transformation is also unconfirmed.</p>
        </>
      )}
    </section>
  );
}
