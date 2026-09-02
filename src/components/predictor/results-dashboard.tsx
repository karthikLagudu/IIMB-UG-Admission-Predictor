"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, Circle, Compass, X } from "lucide-react";
import type { CandidateInput, IimaPolicyConfig, IimaPredictionResult, PredictionInsight } from "@/types/iima";
import { SourceBadge } from "@/components/ui/source-badge";
import {
  IIMA_HISTORICAL_STAGE2_CALL_RECORDS,
  iimaHistoricalCallCategoryLabel,
  iimaHistoricalCallThreshold,
} from "@/lib/iima/historical-call-records";
import { formatProbability, formatScore, formatScoreOutOf100, humanize, normalizeScoreOutOf100 } from "@/lib/utils";
import { PiScoreSimulator } from "./pi-score-simulator";
import { REPORT_SECTION_IDS, type ReportNavigationRequest } from "./report-navigation";

type StepState = "pass" | "fail" | "current" | "neutral";

function sensitivityScenarioDetail(key: string, candidate: CandidateInput, policy: IimaPolicyConfig) {
  const currentPi = candidate.normalizedPi ?? 0;
  const currentAwt = candidate.normalizedAwt ?? 0;
  switch (key) {
    case "cat-plus-5": {
      const next = Math.min(policy.catNormalizationDenominator, candidate.catOverallScaledScore + 5);
      return {
        change: `CAT overall scaled score changes from ${candidate.catOverallScaledScore.toFixed(2)} to ${next.toFixed(2)}.`,
        basis: "CAT contributes 25% to IIMA's final Composite Score. Sectional percentiles, academics, PI and AWT stay unchanged.",
      };
    }
    case "cat-plus-10": {
      const next = Math.min(policy.catNormalizationDenominator, candidate.catOverallScaledScore + 10);
      return {
        change: `CAT overall scaled score changes from ${candidate.catOverallScaledScore.toFixed(2)} to ${next.toFixed(2)}.`,
        basis: "This is the larger CAT scenario. The gain is capped at the configured CAT normalization denominator; every non-CAT input stays fixed.",
      };
    }
    case "pi-plus-005":
      return {
        change: `Normalized PI changes from ${currentPi.toFixed(2)} to ${Math.min(1, currentPi + 0.05).toFixed(2)} (${(currentPi * 100).toFixed(0)}% to ${(Math.min(1, currentPi + 0.05) * 100).toFixed(0)}%).`,
        basis: "PI carries the largest final-selection weight at 50%, so even a small normalized improvement can materially change the final score.",
      };
    case "pi-plus-010":
      return {
        change: `Normalized PI changes from ${currentPi.toFixed(2)} to ${Math.min(1, currentPi + 0.10).toFixed(2)} (${(currentPi * 100).toFixed(0)}% to ${(Math.min(1, currentPi + 0.10) * 100).toFixed(0)}%).`,
        basis: "This is the stronger PI scenario. The value is capped at 1.00 and all CAT, academic, AWT and work-experience inputs stay fixed.",
      };
    case "awt-plus-005":
      return {
        change: `Normalized AWT changes from ${currentAwt.toFixed(2)} to ${Math.min(1, currentAwt + 0.05).toFixed(2)} (${(currentAwt * 100).toFixed(0)}% to ${(Math.min(1, currentAwt + 0.05) * 100).toFixed(0)}%).`,
        basis: "AWT contributes 10% to the final Composite Score. The scenario isolates writing-test improvement and leaves PI and the profile unchanged.",
      };
    case "workex-plus-6": {
      const next = Math.min(36, candidate.workExperienceMonths + 6);
      return {
        change: `Eligible work experience changes from ${candidate.workExperienceMonths} to ${next} completed months.`,
        basis: "Work experience can change the Application Rating and therefore both shortlist and final-score contributions. The scenario is capped at 36 rated months.",
      };
    }
    default:
      return { change: "One candidate input changes while all others stay fixed.", basis: "The model recalculates the complete result using the same gates, weights and planning benchmarks." };
  }
}

function PipelineStep({ label, value, state }: { label: string; value: string; state: StepState }) {
  return (
    <div className={`pipeline-step ${state}`}>
      <div className="pipeline-dot" aria-hidden="true">
        {state === "pass" ? <Check size={13} /> : state === "fail" ? <X size={13} /> : <Circle size={9} />}
      </div>
      <strong title={label}>{label}</strong>
      <small>{value}</small>
    </div>
  );
}

function Metric({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: string }) {
  return (
    <div className={`metric-card ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function AuditRow({
  label,
  value,
  explanation,
  state = "info",
}: {
  label: string;
  value: string;
  explanation: string;
  state?: "pass" | "fail" | "info";
}) {
  return (
    <div className={`audit-row ${state}`}>
      <div>
        <strong>{label}</strong>
        <p>{explanation}</p>
      </div>
      <span>{value}</span>
    </div>
  );
}

function InsightList({
  title,
  emptyMessage,
  insights,
  tone,
}: {
  title: string;
  emptyMessage: string;
  insights: PredictionInsight[];
  tone: "strength" | "gap";
}) {
  return (
    <article className={`insight-column ${tone}`}>
      <div className="insight-column-heading">
        <span className="insight-icon" aria-hidden="true">{tone === "strength" ? <Check size={15} /> : <X size={15} />}</span>
        <div>
          <h4>{title}</h4>
          <p>{tone === "strength" ? "Factors that support the prediction" : "Failed or binding conditions"}</p>
        </div>
      </div>
      {insights.length > 0 ? (
        <div className="insight-list">
          {insights.map((item) => (
            <div className="insight-item" key={`${item.title}-${item.metric}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <span className={`insight-metric ${item.importance.toLowerCase()}`}>{item.metric}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="insight-empty"><Check size={14} aria-hidden="true" />{emptyMessage}</div>
      )}
    </article>
  );
}

export function ResultsDashboard({
  candidate,
  result,
  policy,
  afterScore,
  navigationRequest,
}: {
  candidate: CandidateInput;
  result: IimaPredictionResult;
  policy: IimaPolicyConfig;
  afterScore?: ReactNode;
  navigationRequest?: ReportNavigationRequest | null;
}) {
  const [showMoreFeedback, setShowMoreFeedback] = useState(false);
  const [showDecisionAudit, setShowDecisionAudit] = useState(false);
  const handledNavigationRequestRef = useRef<number | null>(null);
  const final = result.finalSelection;
  const cat = result.catEligibility;
  const callLabel = result.callPrediction ? "CALL PREDICTED" : "LESS LIKELY";
  const route = result.callRoute ? humanize(result.callRoute) : "No route cleared";
  const rating = result.applicationRating;
  const diagnostics = result.diagnostics;
  const callMarginOutOf100 = normalizeScoreOutOf100(result.callMargin, 1);
  const topStrength = diagnostics?.strengths[0];
  const topGap = diagnostics?.gaps[0];
  const prePiArContribution = rating
    ? policy.compositeWeights.ar * rating.total / policy.arNormalizationDenominator
    : null;
  const prePiCatContribution = policy.compositeWeights.cat * candidate.catOverallScaledScore / policy.catNormalizationDenominator;
  const initialPiPercent = Math.round((candidate.normalizedPi ?? final?.normalizedPi ?? 0.75) * 100);
  const iimaOtherFinalContribution = final == null ? null : final.finalCompositeScore - policy.finalWeights.pi * final.normalizedPi;
  const iimaAcademicCriterion = result.stage1?.c2 ?? result.stage2?.c2 ?? result.academicConsistency;
  const iimaCallCriteria = [
    { label: "Bachelor eligibility", detail: `${candidate.bachelorPercent.toFixed(2)}% against ${result.basicEligibility.bachelorRequired.toFixed(0)}% minimum`, passed: result.basicEligibility.bachelorPass },
    { label: "CAT overall", detail: result.catEligibility == null ? "CAT screen not reached" : `${candidate.catOverallPercentile.toFixed(2)} percentile against ${result.catEligibility.cutoff.overall.toFixed(2)}`, passed: result.catEligibility?.overallPass ?? null },
    { label: "CAT sectionals", detail: result.catEligibility == null ? "Sectional screen not reached" : `VARC ${candidate.catVarcPercentile.toFixed(2)}/${result.catEligibility.cutoff.varc.toFixed(2)} · DILR ${candidate.catDilrPercentile.toFixed(2)}/${result.catEligibility.cutoff.dilr.toFixed(2)} · QA ${candidate.catQaPercentile.toFixed(2)}/${result.catEligibility.cutoff.qa.toFixed(2)}`, passed: result.catEligibility == null ? null : result.catEligibility.varcPass && result.catEligibility.dilrPass && result.catEligibility.qaPass },
    { label: "Academic consistency", detail: iimaAcademicCriterion == null || iimaAcademicCriterion.required == null ? "Academic gate not reached" : `${iimaAcademicCriterion.actual.toFixed(2)}% against ${iimaAcademicCriterion.required.toFixed(2)}%`, passed: iimaAcademicCriterion?.passed ?? null },
    { label: "Composite Score boundary", detail: result.applicableCallThreshold == null ? "No applicable shortlist boundary was reached" : `${result.compositeScore == null ? "Score unavailable" : result.compositeScore.toFixed(6)} against ${result.applicableCallThreshold.toFixed(6)}`, passed: result.callMargin == null ? null : result.callMargin >= 0 },
  ];
  useEffect(() => {
    setShowMoreFeedback(false);
    setShowDecisionAudit(false);
  }, [result]);

  useEffect(() => {
    if (!navigationRequest) return;
    if (handledNavigationRequestRef.current === navigationRequest.requestId) return;
    const needsMoreFeedback = navigationRequest.section !== "quick";
    if (needsMoreFeedback && !showMoreFeedback) {
      setShowMoreFeedback(true);
      return;
    }
    if (navigationRequest.section === "audit" && !showDecisionAudit) {
      setShowDecisionAudit(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(REPORT_SECTION_IDS[navigationRequest.section]);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
      handledNavigationRequestRef.current = navigationRequest.requestId;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [navigationRequest, showDecisionAudit, showMoreFeedback]);

  const pipeline: Array<{ label: string; value: string; state: StepState }> = [
    { label: "Eligibility", value: result.basicEligibility.passed ? "Passed" : "Failed", state: result.basicEligibility.passed ? "pass" : "fail" },
    { label: "CAT screen", value: result.catEligibility ? (result.catEligibility.catEligible ? "Passed" : "Failed") : "Not reached", state: result.catEligibility ? (result.catEligibility.catEligible ? "pass" : "fail") : "neutral" },
    { label: "Academic", value: result.academicConsistency ? (result.academicConsistency.passed ? "C2 passed" : "C2 failed") : "Not reached", state: result.academicConsistency ? (result.academicConsistency.passed ? "pass" : "fail") : "neutral" },
    { label: "Application rating", value: rating ? `${rating.total.toFixed(1)}/38` : "Not reached", state: rating ? "pass" : "neutral" },
    { label: "Stage 1", value: result.stage1?.predictedShortlist ? "Selected" : result.stage1 ? "Not selected" : "Not reached", state: result.stage1?.predictedShortlist ? "pass" : result.stage1 ? "fail" : "neutral" },
    { label: "Stage 2", value: result.stage2?.predictedShortlist ? "Selected" : result.stage2 ? "Not selected" : result.stage1?.predictedShortlist ? "Not required" : "Not reached", state: result.stage2?.predictedShortlist ? "pass" : result.stage2 ? "fail" : "neutral" },
    { label: "AWT / PI", value: result.callPrediction ? "Call predicted" : "No call", state: result.callPrediction ? (final ? "pass" : "current") : "fail" },
    { label: "Final model", value: final ? humanize(final.predictionBand) : result.callPrediction ? "Add PI & AWT" : "Hard-gated", state: final ? "current" : result.callPrediction ? "current" : "fail" },
  ];

  return (
    <div className="results-stack" aria-live="polite">
      <section id={REPORT_SECTION_IDS.quick} className="panel result-hero report-navigation-target" tabIndex={-1}>
        <div className="result-hero-main">
          <div className="result-score">
            <span className="result-score-label">Pre-PI / shortlist score</span>
            <strong>{result.compositeScore == null ? "Not calculated" : formatScoreOutOf100(result.compositeScore, 1)}</strong>
            <SourceBadge source="CALCULATED" />
            <div className="score-comparison">
              <div><span>Benchmark</span><b>{result.applicableCallThreshold == null ? "Not configured" : formatScoreOutOf100(result.applicableCallThreshold, 1)}</b></div>
              <div><span>Margin</span><b className={(callMarginOutOf100 ?? -1) >= 0 ? "positive-delta" : ""}>{callMarginOutOf100 == null ? "—" : `${callMarginOutOf100 >= 0 ? "+" : ""}${formatScore(callMarginOutOf100, 2)} pts`}</b></div>
            </div>
          </div>
        </div>
      </section>

      {afterScore}

      {diagnostics && (
        <section className="panel feedback-summary" aria-labelledby="feedback-summary-heading">
          <div className="section-heading compact-heading">
            <div>
              <h3 id="feedback-summary-heading">At a glance</h3>
              <p>The most important strength and concern in this profile.</p>
            </div>
          </div>
          <div className="feedback-snapshot-grid">
            <article className="feedback-snapshot strength">
              <span className="feedback-snapshot-label"><Check size={14} aria-hidden="true" /> Strongest area</span>
              <strong>{topStrength?.title ?? "No confirmed strength yet"}</strong>
              <p>{topStrength?.detail ?? "The profile stopped before a measurable strength could be confirmed."}</p>
              {topStrength && <small>{topStrength.metric}</small>}
            </article>
            <article className={`feedback-snapshot ${topGap ? "gap" : "clear"}`}>
              <span className="feedback-snapshot-label">{topGap ? <X size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />} Main concern</span>
              <strong>{topGap?.title ?? "No blocking issue"}</strong>
              <p>{topGap?.detail ?? "No deficiency currently blocks the predicted interview-call route."}</p>
              {topGap && <small>{topGap.metric}</small>}
            </article>
          </div>
        </section>
      )}

      <div className="feedback-disclosure">
        <button
          type="button"
          className="feedback-toggle"
          aria-expanded={showMoreFeedback}
          aria-controls="detailed-feedback"
          onClick={() => setShowMoreFeedback((current) => !current)}
        >
          <span>{showMoreFeedback ? "Show less feedback" : "More feedback"}</span>
          {showMoreFeedback ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
        </button>
      </div>

      {showMoreFeedback && (
        <div className="detailed-feedback" id="detailed-feedback">
      {diagnostics && (
        <section id={REPORT_SECTION_IDS.strengths} className="panel insight-panel report-navigation-target" tabIndex={-1} aria-labelledby="insight-heading">
          <div className="section-heading">
            <div>
              <h3 id="insight-heading">Profile strengths and gaps</h3>
              <p>{result.callPrediction ? "The strongest evidence supporting this qualification" : "The exact conditions helping and blocking this profile"}</p>
            </div>
            <SourceBadge source="CALCULATED" />
          </div>
          <div className="insight-grid">
            <InsightList
              title="Where this profile is strong"
              emptyMessage="No measurable strength was reached before the failed hard gate."
              insights={diagnostics.strengths}
              tone="strength"
            />
            <InsightList
              title="What is lacking or blocking"
              emptyMessage="No blocking deficiency was found in the interview-call criteria."
              insights={diagnostics.gaps}
              tone="gap"
            />
          </div>
          {diagnostics.nextSteps.length > 0 && (
            <div className="next-steps">
              <h4>{result.callPrediction ? "What to focus on next" : "How to improve this profile"}</h4>
              <ol>{diagnostics.nextSteps.map((step) => <li key={step}>{step}</li>)}</ol>
            </div>
          )}
        </section>
      )}

      <section className="panel pipeline-panel" aria-labelledby="pipeline-heading">
        <div className="section-heading">
          <div><h3 id="pipeline-heading">Candidate journey</h3><p>Every earlier gate remains binding.</p></div>
          <SourceBadge source="OFFICIAL_POLICY" />
        </div>
        <div className="pipeline">{pipeline.map((step) => <PipelineStep key={step.label} {...step} />)}</div>
        {!result.callPrediction && diagnostics && diagnostics.gaps.length > 0 && (
          <div className="journey-gaps" role="group" aria-labelledby="journey-gaps-heading">
            <div className="journey-gaps-heading">
              <span aria-hidden="true"><X size={14} /></span>
              <div>
                <h4 id="journey-gaps-heading">Where this profile is lagging</h4>
                <p>Exact failed conditions that prevented progression to an interview call</p>
              </div>
            </div>
            <div className="journey-gap-list">
              {diagnostics.gaps.map((gap) => (
                <div className="journey-gap-item" key={`${gap.title}-${gap.metric}`}>
                  <div>
                    <strong>{gap.title}</strong>
                    <p>{gap.detail}</p>
                  </div>
                  <span>{gap.metric}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {rating && (
        <div className="metric-grid">
          <Metric label="Application Rating" value={`${rating.total.toFixed(1)} / 38`} note="A + B + C + D + E" />
          <Metric label="Academic average" value={`${result.academicConsistency?.average.toFixed(2)}%`} note={`Required ${result.academicConsistency?.required?.toFixed(2)}%`} tone={result.academicConsistency?.passed ? "success" : "warning"} />
          <Metric label="Required CAT score" value={result.requiredCatScaledScore?.required.toFixed(2) ?? "—"} note={result.requiredCatScaledScore?.achievable ? "Stage-2 planning score" : "Raw requirement exceeds 204"} />
          <Metric label="CAT headroom" value={result.requiredCatScaledScore ? `${result.requiredCatScaledScore.gap >= 0 ? "+" : ""}${result.requiredCatScaledScore.gap.toFixed(2)}` : "—"} note="Current minus required" tone={(result.requiredCatScaledScore?.gap ?? -1) >= 0 ? "success" : "warning"} />
        </div>
      )}

      {rating && (
        <section className="panel detail-panel" aria-labelledby="iima-prepi-heading">
          <div className="section-heading">
            <div>
              <h3 id="iima-prepi-heading">Test-model pre-PI estimate breakdown</h3>
              <p>Official IIMA shortlist formula components using the current test profile; “test-model” describes the application mode, not an official IIMA label.</p>
            </div>
            <SourceBadge source="CALCULATED" />
          </div>
          <div className="component-list">
            <article className="component-row">
              <div>
                <strong>Application Rating contribution</strong>
                <p>{policy.compositeWeights.ar.toFixed(2)} × ({rating.total.toFixed(2)} ÷ {policy.arNormalizationDenominator})</p>
                <small>Application Rating combines Class 10, Class 12, bachelor/professional marks, work experience and gender diversity.</small>
              </div>
              <span>{formatScore(prePiArContribution)} / {policy.compositeWeights.ar.toFixed(2)}</span>
            </article>
            <article className="component-row">
              <div>
                <strong>CAT contribution</strong>
                <p>{policy.compositeWeights.cat.toFixed(2)} × ({candidate.catOverallScaledScore.toFixed(2)} ÷ {policy.catNormalizationDenominator})</p>
                <small>Uses the automatically calculated CAT overall scaled score from the three sectional scores.</small>
              </div>
              <span>{formatScore(prePiCatContribution)} / {policy.compositeWeights.cat.toFixed(2)}</span>
            </article>
          </div>
          <div className="generic-total"><span>Pre-PI shortlist Composite Score</span><strong>{formatScore(result.compositeScore)} / 1.000000</strong></div>
          <div className="call-summary-grid prepi-benchmark-summary">
            <div><span>Call benchmark</span><strong>{formatScore(result.applicableCallThreshold)}</strong></div>
            <div><span>Margin</span><strong>{result.callMargin == null ? "Not calculated" : `${result.callMargin >= 0 ? "+" : ""}${result.callMargin.toFixed(6)}`}</strong></div>
            <div><span>Interpretation</span><strong>{result.callPrediction ? "Call likely" : "Less likely"}</strong></div>
          </div>
        </section>
      )}

      {rating && (
        <div className="two-column-panels">
          <section className="panel detail-panel" aria-labelledby="rating-heading">
            <div className="section-heading"><div><h3 id="rating-heading">Application Rating</h3><p>Official component breakdown</p></div><SourceBadge source="OFFICIAL_POLICY" /></div>
            <div className="rating-list">
              {[
                ["Class 10", rating.class10, 10],
                ["Class 12", rating.class12, 10],
                ["Bachelor / professional", rating.bachelor, 10],
                ["Work experience", rating.workExperience, 5],
                ["Gender diversity", rating.gender, 3],
              ].map(([label, value, max]) => (
                <div className="rating-row" key={String(label)}>
                  <div><div className="rating-label"><span>{label}</span><span>max {max}</span></div><div className="rating-track"><div className="rating-fill" style={{ width: `${(Number(value) / Number(max)) * 100}%` }} /></div></div>
                  <span className="rating-value">{Number(value).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="panel detail-panel" aria-labelledby="call-heading">
            <div className="section-heading"><div><h3 id="call-heading">Stage 1 & Stage 2</h3><p>Separate routes, separately explained</p></div><SourceBadge source="OFFICIAL_OBSERVED_RESULT" /></div>
            <div className="call-detail">
              <div className="call-detail-row"><span>Stage 1 route</span><strong>{result.stage1?.route.replace("_", "-") ?? "—"}</strong></div>
              <div className="call-detail-row"><span>C3 / C6 graduation filter</span><strong>{result.stage1?.route === "ACRC" ? (result.stage1.c3.available ? `${result.stage1.c3.actual}% / ${result.stage1.c3.required}%` : "Not published") : (result.stage1?.c6.available ? `${result.stage1.c6.actual}% / ${result.stage1.c6.required}%` : "Not published")}</strong></div>
              <div className="call-detail-row"><span>Stage 1 observed minimum CS</span><strong>{formatScore(result.stage1?.threshold)}</strong></div>
              <div className="call-detail-row"><span>Stage 1 result</span><strong>{result.stage1?.predictedShortlist ? "Predicted shortlist" : "Not selected"}</strong></div>
              <div className="call-detail-row"><span>Stage 2 minimum CS</span><strong>{formatScore(result.stage2?.threshold ?? (result.callRoute === "STAGE_1" ? policy.stage2Thresholds[candidate.pwd ? `PWD_${candidate.category}` : candidate.category] : null))}</strong></div>
              <div className="call-detail-row"><span>Call route</span><strong>{route}</strong></div>
            </div>
          </section>
        </div>
      )}

      {final && (
        <section className="panel final-panel" aria-labelledby="final-heading">
          <div className="final-top">
            <div className="final-details">
              <div className="section-heading"><div><h3 id="final-heading">Final selection planning</h3><p>Official FCS formula; predictive threshold layer</p></div><SourceBadge source="MODEL_ASSUMPTION" /></div>
              <div className="metric-grid">
                <Metric label="Final Composite Score" value={formatScore(final.finalCompositeScore)} />
                <Metric label="Historical benchmark" value={formatScore(final.historicalBenchmark)} note="Not current cutoff" />
                <Metric label="Planning target" value={formatScore(final.planningTarget)} note="Benchmark + safety margin" />
                <Metric label="Calibrated target" value={formatScore(final.calibration.weightedTarget)} note="50% / 30% / 20% recency blend" />
                <Metric label="Historical scenario range" value={`${formatProbability(final.calibration.probabilityLow)}–${formatProbability(final.calibration.probabilityHigh)}`} note="Across three completed cycles" />
                <Metric label="Target difference" value={`${final.targetDifference >= 0 ? "+" : ""}${final.targetDifference.toFixed(6)}`} tone={final.targetDifference >= 0 ? "success" : "warning"} />
                <Metric label="Required normalized PI" value={final.requiredNormalizedPi.toFixed(4)} note={`Gap ${final.piGap >= 0 ? "+" : ""}${final.piGap.toFixed(4)}`} />
                <Metric label="Largest final weight" value="PI · 50%" note="AWT 10% · CAT 25% · AR 15%" />
              </div>
              <div className="disclosure"><strong>Official current final cutoff: Not published.</strong> The displayed probability blends three historical thresholds instead of relying on one year. Confidence remains limited because individual candidate outcomes and the current merit list are unavailable.</div>
              <div className="calibration-table-wrap">
                <table className="policy-table calibration-table">
                  <thead><tr><th>Completed batch</th><th>Minimum joined FCS</th><th>Model weight</th><th>Scenario probability</th></tr></thead>
                  <tbody>{final.calibration.cycles.map((cycle) => (
                    <tr key={cycle.batch}>
                      <td>{cycle.batch}</td>
                      <td>{formatScore(cycle.benchmark)}</td>
                      <td>{(cycle.weight * 100).toFixed(0)}%</td>
                      <td>{formatProbability(cycle.probability)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {final && result.sensitivity.length > 0 && (
        <section className="panel detail-panel sensitivity-panel" aria-labelledby="sensitivity-heading">
          <div className="section-heading"><div><h3 id="sensitivity-heading">What improves my chance?</h3><p>Each scenario changes one input only and recalculates the complete result</p></div><SourceBadge source="MODEL_ASSUMPTION" /></div>
          <div className="sensitivity-intro"><strong>Current baseline</strong><span>Final Composite Score {formatScore(final.finalCompositeScore)} · Estimated seat chance {formatProbability(final.seatProbability)}</span><p>Use these scenarios to see which improvement has the greatest modelled effect. They are planning comparisons, not promises of admission.</p></div>
          <div className="sensitivity-list">
            {result.sensitivity.map((scenario) => {
              const detail = sensitivityScenarioDetail(scenario.key, candidate, policy);
              const finalScoreDelta = scenario.finalCompositeScore == null ? null : scenario.finalCompositeScore - final.finalCompositeScore;
              const probabilityDeltaPoints = scenario.probabilityDelta * 100;
              const impact = probabilityDeltaPoints >= 5 ? "Strong impact" : probabilityDeltaPoints >= 2 ? "Moderate impact" : probabilityDeltaPoints > 0 ? "Small impact" : "No modelled gain";
              return (
                <article className="sensitivity-card" key={scenario.key}>
                  <div className="sensitivity-card-heading"><div><h4>{scenario.label}</h4><span>{impact}</span></div><strong>{scenario.probabilityDelta >= 0 ? "+" : ""}{probabilityDeltaPoints.toFixed(1)} percentage points</strong></div>
                  <p>{detail.change}</p>
                  <div className="sensitivity-card-metrics">
                    <div><span>New final score</span><strong>{formatScore(scenario.finalCompositeScore)}</strong><small>{finalScoreDelta == null ? "Change unavailable" : `${finalScoreDelta >= 0 ? "+" : ""}${finalScoreDelta.toFixed(6)} vs current`}</small></div>
                    <div><span>New seat chance</span><strong>{formatProbability(scenario.probability)}</strong><small>Current: {formatProbability(final.seatProbability)}</small></div>
                    <div><span>Chance improvement</span><strong className={scenario.probabilityDelta > 0 ? "positive-delta" : ""}>{scenario.probabilityDelta >= 0 ? "+" : ""}{probabilityDeltaPoints.toFixed(1)} pp</strong><small>{impact}</small></div>
                  </div>
                  <div className="sensitivity-track" role="img" aria-label={`${scenario.label} produces ${formatProbability(scenario.probability)} estimated seat chance`}><div className="sensitivity-fill" style={{ width: `${Math.min(100, scenario.probability * 100)}%` }} /></div>
                  <small className="sensitivity-basis"><strong>Why it matters:</strong> {detail.basis}</small>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="panel detail-panel" aria-labelledby="why-heading">
        <div className="section-heading"><div><h3 id="why-heading">Why this result?</h3><p>Generated from the exact gate sequence</p></div><SourceBadge source="CALCULATED" /></div>
        <ol className="explain-list">{result.explanation.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ol>
      </section>

      <section className="panel decision-audit-toggle-panel" aria-label="Detailed decision audit controls">
        <button
          type="button"
          className="decision-audit-toggle"
          aria-expanded={showDecisionAudit}
          aria-controls={REPORT_SECTION_IDS.audit}
          onClick={() => setShowDecisionAudit((current) => !current)}
        >
          <span>
            <strong>{showDecisionAudit ? "Hide detailed decision audit" : "View detailed decision audit"}</strong>
            <small>See every eligibility check, threshold, comparison and formula behind this result.</small>
          </span>
          {showDecisionAudit ? <ChevronUp size={20} aria-hidden="true" /> : <ChevronDown size={20} aria-hidden="true" />}
        </button>
      </section>

      {showDecisionAudit && (
        <section id={REPORT_SECTION_IDS.audit} className="panel detail-panel report-navigation-target" tabIndex={-1} aria-labelledby="audit-heading">
          <div className="section-heading">
            <div><h3 id="audit-heading">Detailed decision audit</h3><p>Every input, comparison and formula used in the result</p></div>
            <SourceBadge source="CALCULATED" />
          </div>
          <div className="audit-grid">
            <article className="audit-card">
              <h4>1. Basic eligibility</h4>
              <AuditRow
                label="Bachelor marks"
                value={`${candidate.bachelorPercent.toFixed(2)}% / ${result.basicEligibility.bachelorRequired.toFixed(0)}%`}
                explanation={`Your applicable minimum is ${result.basicEligibility.bachelorRequired}% based on category and PwD status.`}
                state={result.basicEligibility.bachelorPass ? "pass" : "fail"}
              />
              <AuditRow
                label="Age on cutoff date"
                value={result.basicEligibility.ageAtCutoff == null ? "Not provided" : `${result.basicEligibility.ageAtCutoff} years`}
                explanation={`When DOB is provided, the engine checks age ${policy.minimumAge}+ on ${policy.ageCutoffDate}.`}
                state={result.basicEligibility.agePass == null ? "info" : result.basicEligibility.agePass ? "pass" : "fail"}
              />
              <AuditRow
                label="Degree duration"
                value={candidate.degreeDurationYears == null ? "Not provided" : `${candidate.degreeDurationYears} years`}
                explanation={`The configured minimum duration after 10+2 is ${policy.minimumDegreeDurationYears} years.`}
                state={result.basicEligibility.degreeDurationPass == null ? "info" : result.basicEligibility.degreeDurationPass ? "pass" : "fail"}
              />
              <AuditRow
                label="Study status"
                value={result.basicEligibility.provisionalFinalYear ? "Final-year provisional" : "Degree completed"}
                explanation={result.basicEligibility.provisionalFinalYear ? `Completion is provisional and subject to the ${policy.finalYearCompletionDeadline} examination deadline.` : "The completed-degree eligibility route is applied."}
              />
            </article>

            {cat && (
              <article className="audit-card">
                <h4>2. CAT hard-gate screen</h4>
                <AuditRow label="Overall percentile" value={`${candidate.catOverallPercentile.toFixed(2)} / ${cat.cutoff.overall}`} explanation="Actual CAT overall percentile must meet or exceed the applicable category/PwD minimum." state={cat.overallPass ? "pass" : "fail"} />
                <AuditRow label="VARC percentile" value={`${candidate.catVarcPercentile.toFixed(2)} / ${cat.cutoff.varc}`} explanation="VARC is checked independently; a high overall percentile cannot compensate for failure here." state={cat.varcPass ? "pass" : "fail"} />
                <AuditRow label="DILR percentile" value={`${candidate.catDilrPercentile.toFixed(2)} / ${cat.cutoff.dilr}`} explanation="DILR must independently clear its sectional threshold." state={cat.dilrPass ? "pass" : "fail"} />
                <AuditRow label="QA percentile" value={`${candidate.catQaPercentile.toFixed(2)} / ${cat.cutoff.qa}`} explanation="QA must independently clear its sectional threshold." state={cat.qaPass ? "pass" : "fail"} />
                <AuditRow label="Positive raw scores" value={cat.positiveRawScoresPass ? "All three positive" : "One or more failed"} explanation="VARC, DILR and QA must each have a raw score above zero." state={cat.positiveRawScoresPass ? "pass" : "fail"} />
              </article>
            )}

            {rating && result.compositeScore != null && (
              <article className="audit-card">
                <h4>3. Composite Score construction</h4>
                <AuditRow label="Normalized AR" value={(rating.total / policy.arNormalizationDenominator).toFixed(6)} explanation={`AR ${rating.total.toFixed(1)} ÷ ${policy.arNormalizationDenominator}.`} />
                <AuditRow label="AR contribution" value={(policy.compositeWeights.ar * rating.total / policy.arNormalizationDenominator).toFixed(6)} explanation={`${(policy.compositeWeights.ar * 100).toFixed(0)}% × normalized AR.`} />
                <AuditRow label="Normalized CAT" value={(candidate.catOverallScaledScore / policy.catNormalizationDenominator).toFixed(6)} explanation={`Scaled score ${candidate.catOverallScaledScore.toFixed(2)} ÷ ${policy.catNormalizationDenominator}.`} />
                <AuditRow label="CAT contribution" value={(policy.compositeWeights.cat * candidate.catOverallScaledScore / policy.catNormalizationDenominator).toFixed(6)} explanation={`${(policy.compositeWeights.cat * 100).toFixed(0)}% × normalized CAT.`} />
                <AuditRow label="Final shortlist CS" value={result.compositeScore.toFixed(6)} explanation="AR contribution + CAT contribution. Comparisons use the unrounded value." state="pass" />
              </article>
            )}

            {result.stage1 && (
              <article className="audit-card">
                <h4>4. Stage 1 discipline route</h4>
                <AuditRow label="Route" value={result.stage1.route.replace("_", "-")} explanation={result.stage1.route === "ACRC" ? "The ACRC route applies C1, C2 and C3 before the observed CS/rank boundary." : "The small-category route applies C4, C5 and C6 before its CS/rank boundary."} />
                <AuditRow label={result.stage1.route === "ACRC" ? "C1 · CAT criteria" : "C4 · small-AC CAT criteria"} value={(result.stage1.route === "ACRC" ? result.stage1.c1 : result.stage1.c4) ? "Passed" : "Failed"} explanation="This reuses the applicable CAT gate; it is never bypassed." state={(result.stage1.route === "ACRC" ? result.stage1.c1 : result.stage1.c4) ? "pass" : "fail"} />
                <AuditRow label={result.stage1.route === "ACRC" ? "C2 · school consistency" : "C5 · school consistency"} value={result.stage1.route === "ACRC" ? `${result.stage1.c2.actual.toFixed(2)}% / ${result.stage1.c2.required?.toFixed(2)}%` : `${result.stage1.c5.actual.toFixed(2)}% / ${result.stage1.c5.required?.toFixed(2)}%`} explanation="The Class 10 and 12 average is compared with the applicable stream/category requirement." state={(result.stage1.route === "ACRC" ? result.stage1.c2.passed : result.stage1.c5.passed) ? "pass" : "fail"} />
                <AuditRow label={result.stage1.route === "ACRC" ? "C3 · graduation filter" : "C6 · graduation filter"} value={(result.stage1.route === "ACRC" ? result.stage1.c3.available : result.stage1.c6.available) ? `${(result.stage1.route === "ACRC" ? result.stage1.c3.actual : result.stage1.c6.actual).toFixed(2)}% / ${(result.stage1.route === "ACRC" ? result.stage1.c3.required : result.stage1.c6.required)?.toFixed(2)}%` : "Not published"} explanation="Observed CAT-cycle graduation boundary for the applicable Academic Category route; missing data is never treated as zero." state={(result.stage1.route === "ACRC" ? result.stage1.c3.passed : result.stage1.c6.passed) ? "pass" : "fail"} />
                <AuditRow label="Observed minimum CS" value={formatScore(result.stage1.threshold)} explanation={result.stage1.threshold == null ? "No observed threshold is available for this route, so Stage 1 cannot be asserted from a fabricated value." : `Your CS is compared against this route-specific boundary. Source: ${result.stage1.thresholdSource.toLowerCase().replace("_", " ")}.`} state={result.stage1.threshold == null ? "info" : result.stage1.compositeScore >= result.stage1.threshold ? "pass" : "fail"} />
                <AuditRow label="Stage 1 decision" value={result.stage1.predictedShortlist ? "Selected" : "Not selected"} explanation={result.stage1.reason} state={result.stage1.predictedShortlist ? "pass" : "fail"} />
              </article>
            )}

            {result.stage2 && (
              <article className="audit-card">
                <h4>5. Stage 2 additional shortlist</h4>
                <AuditRow label="C1 · CAT criteria" value={result.stage2.c1 ? "Passed" : "Failed"} explanation="Stage 2 still requires the complete CAT screen." state={result.stage2.c1 ? "pass" : "fail"} />
                <AuditRow label="C2 · school consistency" value={`${result.stage2.c2.actual.toFixed(2)}% / ${result.stage2.c2.required?.toFixed(2)}%`} explanation="The same official academic-consistency gate remains binding." state={result.stage2.c2.passed ? "pass" : "fail"} />
                <AuditRow label="CS threshold comparison" value={`${result.stage2.compositeScore.toFixed(6)} / ${result.stage2.threshold.toFixed(6)}`} explanation={`Margin = ${result.stage2.margin >= 0 ? "+" : ""}${result.stage2.margin.toFixed(6)}.`} state={result.stage2.margin >= 0 ? "pass" : "fail"} />
                <AuditRow label="Stage 2 decision" value={result.stage2.predictedShortlist ? "Selected" : "Not selected"} explanation={result.stage2.reason} state={result.stage2.predictedShortlist ? "pass" : "fail"} />
              </article>
            )}

            {rating && (
              <article className="audit-card outcome-audit-card">
                <h4>{result.stage2 ? "6" : "5"}. Overall call conclusion</h4>
                <AuditRow label="AWT/PI call" value={result.callPrediction ? `YES · ${route}` : "NO"} explanation={result.callPrediction ? "At least one official shortlist route clears all its hard gates and score boundary." : "Neither Stage 1 nor Stage 2 clears every required condition."} state={result.callPrediction ? "pass" : "fail"} />
                <AuditRow label="Applicable CS margin" value={result.callMargin == null ? "Unavailable" : `${result.callMargin >= 0 ? "+" : ""}${result.callMargin.toFixed(6)}`} explanation="Positive means the unrounded CS is above the boundary used for the successful/final route." state={result.callMargin == null ? "info" : result.callMargin >= 0 ? "pass" : "fail"} />
                <AuditRow label="Required CAT scaled score" value={result.requiredCatScaledScore ? result.requiredCatScaledScore.required.toFixed(2) : "Unavailable"} explanation={result.requiredCatScaledScore ? `At the current AR, Stage 2 requires approximately this CAT scaled score. Current score: ${result.requiredCatScaledScore.current.toFixed(2)}; gap: ${result.requiredCatScaledScore.gap >= 0 ? "+" : ""}${result.requiredCatScaledScore.gap.toFixed(2)}.` : "This calculation was not reached."} state={result.requiredCatScaledScore?.achievable ? (result.requiredCatScaledScore.gap >= 0 ? "pass" : "fail") : "info"} />
              </article>
            )}
          </div>
        </section>
      )}

      <PiScoreSimulator
        instituteName="IIM Ahmedabad"
        simulatorKey={`${result.policyVersion}-${result.compositeScore ?? "none"}`}
        initialPercent={initialPiPercent}
        piMaxScore={policy.finalWeights.pi * 100}
        finalMaxScore={1}
        scorePrecision={4}
        benchmarkLabel="Probability uses the existing historical-cycle planning model, not an official current cutoff."
        callPredictionLabel={callLabel}
        callPredictionReason={result.callPrediction ? `${route} clears the applicable shortlist boundary after all hard gates.` : diagnostics?.gaps[0]?.detail ?? "The profile does not clear every required interview-call condition."}
        callPredictionTone={result.callPrediction ? "positive" : "negative"}
        callCriteria={iimaCallCriteria}
        unavailableReason={final == null || iimaOtherFinalContribution == null ? "The other final-selection inputs, including AWT, must be available before a new final score can be calculated." : undefined}
        simulate={(piPercent) => {
          const normalizedPi = piPercent / 100;
          const finalScore = iimaOtherFinalContribution == null ? null : iimaOtherFinalContribution + policy.finalWeights.pi * normalizedPi;
          const seatProbability = finalScore == null
            ? null
            : result.callPrediction
              ? final!.calibration.cycles.reduce((sum, cycle) => sum + cycle.weight * (1 / (1 + Math.exp(-policy.model.logisticSlope * (finalScore - cycle.planningTarget)))), 0)
              : 0;
          const band = seatProbability == null
            ? null
            : policy.probabilityBands.find((item) => seatProbability < item.maxExclusive)?.band ?? "VERY_STRONG";
          return { piPoints: normalizedPi * policy.finalWeights.pi * 100, finalScore, seatProbability, band };
        }}
      />

      <section id={REPORT_SECTION_IDS.history} className="panel detail-panel historical-call-panel report-navigation-target" tabIndex={-1} aria-labelledby="historical-call-heading">
        <div className="section-heading">
          <div>
            <h3 id="historical-call-heading">Previous interview-call scores vs this profile</h3>
            <p>Official IIMA Stage-2 minimum Composite Scores for {iimaHistoricalCallCategoryLabel(candidate)}</p>
          </div>
          <SourceBadge source="OFFICIAL_OBSERVED_RESULT" />
        </div>
        <div className="historical-call-grid">
          {IIMA_HISTORICAL_STAGE2_CALL_RECORDS.map((record) => {
            const previousMinimum = iimaHistoricalCallThreshold(record, candidate);
            const gap = result.compositeScore == null ? null : result.compositeScore - previousMinimum;

            return (
              <article className="historical-call-card" key={record.batch}>
                <div className="historical-call-card-heading">
                  <div><span>PGP {record.batch}</span><small>CAT {record.catYear}</small></div>
                  <a href={record.sourceUrl} target="_blank" rel="noreferrer">Official record</a>
                </div>
                <div className="historical-call-score-row">
                  <div><span>Previous minimum CS</span><strong>{previousMinimum.toFixed(6)}</strong></div>
                  <div><span>Student&apos;s current CS</span><strong>{formatScore(result.compositeScore)}</strong></div>
                </div>
                <div className={`historical-call-gap ${gap == null ? "unavailable" : gap >= 0 ? "above" : "below"}`}>
                  {gap == null
                    ? "Comparison unavailable because the current Composite Score was not reached."
                    : `${gap >= 0 ? "+" : ""}${gap.toFixed(6)} · ${Math.abs(gap).toFixed(6)} ${gap >= 0 ? "above" : "below"} this previous minimum`}
                </div>
              </article>
            );
          })}
        </div>
        <div className="historical-call-note">
          <strong>What this comparison means:</strong> it compares the student&apos;s current shortlist Composite Score with prior scores used to issue AWT/PI interview calls. It does not compare interview performance or PI marks. Each cycle used its own CAT and Application Rating normalization, so the gap is a useful historical reference—not a guarantee that the same candidate would have received a call in that year.
        </div>
      </section>
        </div>
      )}

    </div>
  );
}

export function EmptyResults() {
  return (
    <section className="panel empty-results">
      <div><div className="empty-icon"><Compass size={26} /></div><h3>Your analysis appears here</h3><p>Enter the complete profile to see every official gate, score, threshold, margin and model assumption.</p></div>
    </section>
  );
}
