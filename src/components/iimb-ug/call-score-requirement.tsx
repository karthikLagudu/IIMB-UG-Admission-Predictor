import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { PRE_PI_CALL_PLANNING_BANDS } from "@/lib/iimb-ug/2027_31/predictor";
import { IimbUgSourceBadge } from "./source-badge";

const TEST_MAXIMUM = 70;
const CANONICAL_SECTION_MAXIMUMS = { varc: 45, lr: 45, qadi: 90 } as const;

type CallTarget = {
  label: string;
  target: number;
  description: string;
  safe?: boolean;
};

const CALL_TARGETS: CallTarget[] = [
  {
    label: "Safe planning target",
    target: PRE_PI_CALL_PLANNING_BANDS.strong,
    description: "The app's conservative target for a strong interview-call position while the official cutoff is unavailable.",
    safe: true,
  },
  {
    label: "Competitive target",
    target: PRE_PI_CALL_PLANNING_BANDS.competitive,
    description: "A lower planning threshold that may be competitive, but carries less safety margin.",
  },
];

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

function TargetCard({ target, profilePoints }: {
  target: CallTarget;
  profilePoints: number;
}) {
  const requiredTestScore = Math.max(0, target.target - profilePoints);
  const unreachable = requiredTestScore > TEST_MAXIMUM;
  const plan = unreachable ? null : balancedRawPlan(requiredTestScore);

  return (
    <article className={`ug-call-target-card${target.safe ? " safe-target" : ""}${unreachable ? " target-unreachable" : ""}`}>
      <div className="ug-call-target-title">
        <div><span>{target.label}</span><strong>{target.target} / 100 Pre-PI</strong></div>
        <b>{unreachable ? "Not reachable by test alone" : target.safe ? `Safe exam aim: ${formatScore(requiredTestScore)} / 70` : `Need ${formatScore(requiredTestScore)} / 70`}</b>
      </div>
      {unreachable ? (
        <p className="ug-call-target-warning">Your academic and diversity contribution is too low to reach this planning target even with 70/70 from the test.</p>
      ) : (
        <>
          <div className="ug-required-test-score">
            <span>UG Admission Test score needed</span>
            <strong>{formatScore(requiredTestScore)} <small>/ 70 weighted</small></strong>
          </div>
          <p className="ug-call-equation">{formatScore(target.target)} target − {formatScore(profilePoints)} profile score = <strong>{formatScore(requiredTestScore)} exam score needed</strong></p>
          <dl className="ug-balanced-plan">
            <div><dt>Balanced raw plan</dt><dd>{plan!.total} / 180</dd></div>
            <div><dt>VARC</dt><dd>{plan!.varc} / 45</dd></div>
            <div><dt>LR</dt><dd>{plan!.lr} / 45</dd></div>
            <div><dt>QADI</dt><dd>{plan!.qadi} / 90</dd></div>
          </dl>
        </>
      )}
      <p>{target.description}</p>
    </article>
  );
}

export function CallScoreRequirement({ result }: { result: IimbUgPredictionResult }) {
  const { prePi } = result;
  const profilePoints = prePi.prePi == null || prePi.test70 == null
    ? null
    : prePi.prePi - prePi.test70;
  const overallPoints = prePi.components.find((component) => component.key === "prepi-class10Overall")?.weightedValue;
  const mathPoints = prePi.components.find((component) => component.key === "prepi-class10Math")?.weightedValue;
  const diversityPoints = prePi.components.find((component) => component.key === "prepi-gender")?.weightedValue;
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
        <div><span>Personal safe-score plan</span><h2 id="ug-call-score-heading">What is your safe score for an interview call?</h2></div>
        <IimbUgSourceBadge source="MODEL_ASSUMPTION" />
      </div>

      <div className="ug-call-score-notice">
        <strong>The exact 2027 interview-call cutoff has not been published.</strong>
        <p>Your safe score is therefore a conservative planning target, not a guarantee. It uses the 80/100 strong Pre-PI band and will never fall below the previous-cycle aggregate benchmark for your category.</p>
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
              <span>Your recommended safe raw score</span>
              <strong>{recommendedRawTarget} <small>/ 180</small></strong>
              <p>Aim for at least this score. It is the higher of your personalized 80/100 strong-score plan and the previous-cycle aggregate benchmark.</p>
            </div>
            <div className="ug-historical-guardrail">
              <div className="ug-historical-title"><span>Previous-cycle official benchmark</span><strong>{formatCategory(historical.resolvedCategory)}</strong></div>
              <dl>
                <div><dt>Aggregate floor</dt><dd>{historicalAggregateFloor} / 180</dd></div>
                <div><dt>QADI percentile</dt><dd>{historical.benchmark.qadiPercentileFloor} minimum</dd></div>
                <div><dt>Section rule</dt><dd>Positive in all sections</dd></div>
              </dl>
              <p>{recommendationBasis} The historical figures are context only and are not the confirmed 2027 cutoff.</p>
            </div>
          </div>
          <div className="ug-call-target-grid">
            {CALL_TARGETS.map((target) => <TargetCard key={target.target} target={target} profilePoints={profilePoints} />)}
          </div>
          <p className="ug-call-section-warning">In addition to the total target, the student must obtain a positive raw score in VARC, LR and QADI. Zero in any section fails the published first-shortlist gate.</p>
          <p className="ug-panel-note">“Safe” means a conservative planning buffer; it does not guarantee an interview call. Balanced raw plans distribute the required performance proportionally across VARC, LR and QADI and round each section upward. A different section mix can produce the same weighted score. QADI percentile cannot be converted reliably into marks until IIMB publishes the relevant score-to-percentile mapping. The UG raw-to-weighted transformation is also unconfirmed.</p>
        </>
      )}
    </section>
  );
}
