import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { PRE_PI_CALL_PLANNING_BANDS } from "@/lib/iimb-ug/2027_31/predictor";
import { IimbUgSourceBadge } from "./source-badge";

const TEST_MAXIMUM = 70;
const CANONICAL_SECTION_MAXIMUMS = { varc: 45, lr: 45, qadi: 90 } as const;

type CallTarget = {
  label: string;
  target: number;
  description: string;
};

const CALL_TARGETS: CallTarget[] = [
  {
    label: "Competitive target",
    target: PRE_PI_CALL_PLANNING_BANDS.competitive,
    description: "The app's main planning threshold for a competitive interview-call position.",
  },
  {
    label: "Strong target",
    target: PRE_PI_CALL_PLANNING_BANDS.strong,
    description: "A higher planning buffer while the official category-wise cutoff is unavailable.",
  },
];

function formatScore(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}

function balancedRawPlan(requiredTestScore: number) {
  const proportion = requiredTestScore / TEST_MAXIMUM;
  const varc = Math.ceil(CANONICAL_SECTION_MAXIMUMS.varc * proportion);
  const lr = Math.ceil(CANONICAL_SECTION_MAXIMUMS.lr * proportion);
  const qadi = Math.ceil(CANONICAL_SECTION_MAXIMUMS.qadi * proportion);
  return { varc, lr, qadi, total: varc + lr + qadi };
}

function TargetCard({ target, profilePoints, currentTestScore }: {
  target: CallTarget;
  profilePoints: number;
  currentTestScore: number;
}) {
  const requiredTestScore = Math.max(0, target.target - profilePoints);
  const additionalNeeded = Math.max(0, requiredTestScore - currentTestScore);
  const unreachable = requiredTestScore > TEST_MAXIMUM;
  const alreadyThere = !unreachable && additionalNeeded === 0;
  const plan = unreachable ? null : balancedRawPlan(requiredTestScore);

  return (
    <article className={`ug-call-target-card${alreadyThere ? " target-met" : ""}${unreachable ? " target-unreachable" : ""}`}>
      <div className="ug-call-target-title">
        <div><span>{target.label}</span><strong>{target.target} / 100 Pre-PI</strong></div>
        <b>{alreadyThere ? "Target met" : unreachable ? "Not reachable by test alone" : `${formatScore(additionalNeeded)} more needed`}</b>
      </div>
      {unreachable ? (
        <p className="ug-call-target-warning">Your academic and diversity contribution is too low to reach this planning target even with 70/70 from the test.</p>
      ) : (
        <>
          <div className="ug-required-test-score">
            <span>UG Admission Test score needed</span>
            <strong>{formatScore(requiredTestScore)} <small>/ 70 weighted</small></strong>
          </div>
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

  return (
    <section className="ug-panel ug-call-score-panel" aria-labelledby="ug-call-score-heading">
      <div className="ug-panel-heading">
        <div><span>Personal score plan</span><h2 id="ug-call-score-heading">What test score is needed for a call?</h2></div>
        <IimbUgSourceBadge source="MODEL_ASSUMPTION" />
      </div>

      <div className="ug-call-score-notice">
        <strong>The exact 2027 interview-call cutoff has not been published.</strong>
        <p>These are personalized planning scores, not guaranteed call cutoffs. Eligibility and a positive raw score in every test section remain mandatory.</p>
      </div>

      {result.eligibility.status === "INELIGIBLE" ? (
        <div className="ug-call-score-blocked"><strong>No test score can compensate for failed eligibility.</strong><span>Review the eligibility panel before using the score targets.</span></div>
      ) : profilePoints == null || prePi.test70 == null ? (
        <div className="ug-call-score-blocked"><strong>More profile data is required.</strong><span>Complete the Class X and test fields to calculate a personalized score target.</span></div>
      ) : (
        <>
          <div className="ug-call-score-baseline">
            <div><span>Academics + diversity</span><strong>{formatScore(profilePoints)} / 30</strong></div>
            <div><span>Current test contribution</span><strong>{formatScore(prePi.test70)} / 70</strong></div>
            <div><span>Current Pre-PI estimate</span><strong>{formatScore(prePi.prePi!)} / 100</strong></div>
          </div>
          <div className="ug-call-target-grid">
            {CALL_TARGETS.map((target) => <TargetCard key={target.target} target={target} profilePoints={profilePoints} currentTestScore={prePi.test70!} />)}
          </div>
          {result.exam.positiveGate === false && <p className="ug-call-section-warning">Your current attempt has a non-positive raw score in at least one section. A positive raw score in VARC, LR and QADI is required in addition to the target above.</p>}
          <p className="ug-panel-note">Balanced raw plans distribute the required performance proportionally across VARC, LR and QADI and round each section upward. A different section mix can produce the same weighted score. The UG raw-to-weighted transformation is not yet confirmed, so use this as a planning guide.</p>
        </>
      )}
    </section>
  );
}
