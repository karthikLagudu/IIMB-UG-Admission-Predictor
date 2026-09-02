"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, Circle, Database, X } from "lucide-react";
import type { CandidateInput } from "@/types/iima";
import type { InstitutePredictionResult, InstituteScoreComponent } from "@/types/institutes";
import { SourceBadge } from "@/components/ui/source-badge";
import { formatProbability, formatScore, formatScoreOutOf100, humanize, normalizeScoreOutOf100 } from "@/lib/utils";
import { institutePredictionBand } from "@/lib/institutes/prediction";
import { instituteHistoricalReference } from "@/lib/institutes/historical-references";
import { PiScoreSimulator } from "./pi-score-simulator";
import { REPORT_SECTION_IDS, type ReportNavigationRequest } from "./report-navigation";

type StepState = "pass" | "fail" | "current" | "neutral";

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

function AuditRow({ label, value, explanation, state = "info" }: { label: string; value: string; explanation: string; state?: "pass" | "fail" | "info" }) {
  return (
    <div className={`audit-row ${state}`}>
      <div><strong>{label}</strong><p>{explanation}</p></div>
      <span>{value}</span>
    </div>
  );
}

function ComponentList({ components }: { components: InstituteScoreComponent[] }) {
  if (components.length === 0) return <p className="detail-empty">This stage was not reached because an earlier hard gate failed.</p>;
  return (
    <div className="component-list">
      {components.map((component) => (
        <article className={`component-row ${component.status === "DATA_REQUIRED" ? "missing" : ""}`} key={component.key}>
          <div><div className="component-row-heading"><strong>{component.label}</strong><SourceBadge source={component.sourceType} /></div><p>{component.formula}</p><small>{component.detail}</small></div>
          <span>{component.score == null ? "Required" : `${formatScore(component.score, 2)} / ${component.maxScore}`}</span>
        </article>
      ))}
    </div>
  );
}

function TextInsightList({ title, emptyMessage, items, tone }: { title: string; emptyMessage: string; items: string[]; tone: "strength" | "gap" }) {
  return (
    <article className={`insight-column ${tone}`}>
      <div className="insight-column-heading">
        <span className="insight-icon" aria-hidden="true">{tone === "strength" ? <Check size={15} /> : <X size={15} />}</span>
        <div><h4>{title}</h4><p>{tone === "strength" ? "Factors that support the prediction" : "Failed, uncertain or binding conditions"}</p></div>
      </div>
      {items.length > 0 ? (
        <div className="insight-list">
          {items.map((item, index) => (
            <div className="insight-item" key={`${index}-${item}`}>
              <div><strong>{item}</strong></div>
              <span className={`insight-metric ${tone === "strength" ? "medium" : "high"}`}>{tone === "strength" ? "Supports" : "Attention"}</span>
            </div>
          ))}
        </div>
      ) : <div className="insight-empty"><Check size={14} aria-hidden="true" />{emptyMessage}</div>}
    </article>
  );
}

export function InstituteResultsDashboard({ candidate, result, afterScore, navigationRequest }: { candidate: CandidateInput; result: InstitutePredictionResult; afterScore?: ReactNode; navigationRequest?: ReportNavigationRequest | null }) {
  const [showMore, setShowMore] = useState(false);
  const [showDecisionAudit, setShowDecisionAudit] = useState(false);
  const handledNavigationRequestRef = useRef<number | null>(null);
  useEffect(() => {
    setShowMore(false);
    setShowDecisionAudit(false);
  }, [result]);

  useEffect(() => {
    if (!navigationRequest) return;
    if (handledNavigationRequestRef.current === navigationRequest.requestId) return;
    const needsMoreFeedback = navigationRequest.section !== "quick";
    if (needsMoreFeedback && !showMore) {
      setShowMore(true);
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
  }, [navigationRequest, showDecisionAudit, showMore]);

  const callPredicted = result.call.status === "PREDICTED_CALL";
  const callNegative = result.call.status === "NO_CALL";
  const directMerit = result.selectionStages.directMerit;
  const callLabel = callPredicted
    ? "CALL PREDICTED"
    : result.call.status === "ELIGIBLE_FOR_RANKING"
      ? directMerit ? "ELIGIBLE FOR DIRECT MERIT" : "ELIGIBLE FOR RANKING"
      : result.call.status === "DATA_REQUIRED" ? "DATA REQUIRED" : result.call.status === "SPECIAL_CASE_REVIEW_REQUIRED" ? "REVIEW REQUIRED" : "LESS LIKELY";
  const topStrength = result.strengths[0] ?? "No confirmed strength yet.";
  const topGap = result.gaps[0] ?? "No blocking deficiency is currently identified.";
  const preUsesModel = result.preInterview.components.some((component) => component.sourceType === "MODEL_ASSUMPTION");
  const preSource = preUsesModel ? "MODEL_ASSUMPTION" as const : result.preInterview.status === "CALCULATED" ? "CALCULATED" as const : "OFFICIAL_POLICY" as const;
  const currentCallScore = result.preInterview.score;
  const callMarginOutOf100 = normalizeScoreOutOf100(result.call.margin, result.preInterview.maxScore);
  const scoreFallback = result.preInterview.status === "DATA_REQUIRED" ? "Needs cycle data" : "Not calculated";
  const probabilityFallback = "Not estimated yet";
  const marginFallback = result.call.benchmarkValue == null ? "No benchmark" : "Not calculated";
  const modelCallBenchmark = result.call.benchmarkType === "MODEL" ? result.call.benchmarkValue : null;
  const modelCallGap = currentCallScore != null && modelCallBenchmark != null ? currentCallScore - modelCallBenchmark : null;
  const probability = result.prediction.probability;
  const historicalReference = instituteHistoricalReference(result.institute);
  const historicalBenchmark = result.call.benchmarkType === "HISTORICAL" || result.call.benchmarkType === "OFFICIAL_RESULT"
    ? result.call.benchmarkValue
    : null;
  const historicalGap = currentCallScore != null && historicalBenchmark != null ? currentCallScore - historicalBenchmark : null;
  const piComponent = result.final.components.find((component) => component.key === "pi" || /personal interview/i.test(component.label));
  const nonPiComponents = result.final.components.filter((component) => component !== piComponent);
  const nonPiTotal = nonPiComponents.length > 0 && nonPiComponents.every((component) => component.score != null)
    ? nonPiComponents.reduce((sum, component) => sum + (component.score ?? 0), 0)
    : null;
  const initialPiPercent = Math.round((candidate.normalizedPi ?? (piComponent?.score != null && piComponent.maxScore > 0 ? piComponent.score / piComponent.maxScore : 0.75)) * 100);
  const cutoffText = (value: number | null) => value == null ? "Not applicable" : value.toFixed(2);
  const callCriteria = [
    { label: "Bachelor eligibility", detail: `${candidate.bachelorPercent.toFixed(2)}% against ${result.eligibility.bachelorRequired.toFixed(0)}% minimum`, passed: result.eligibility.bachelorPass },
    { label: "CAT overall", detail: `${candidate.catOverallPercentile.toFixed(2)} percentile against ${cutoffText(result.eligibility.cutoff.overall)}`, passed: result.eligibility.cutoff.overall == null ? null : result.eligibility.overallPass },
    { label: "CAT sectionals", detail: `VARC ${candidate.catVarcPercentile.toFixed(2)}/${cutoffText(result.eligibility.cutoff.varc)} · DILR ${candidate.catDilrPercentile.toFixed(2)}/${cutoffText(result.eligibility.cutoff.dilr)} · QA ${candidate.catQaPercentile.toFixed(2)}/${cutoffText(result.eligibility.cutoff.qa)}`, passed: result.eligibility.varcPass && result.eligibility.dilrPass && result.eligibility.qaPass },
    { label: "Section score condition", detail: result.institute === "IIMB" ? "Positive raw score required in VARC, DILR and QA" : "Institute-specific section score condition", passed: result.eligibility.rawScoreGatePass },
    { label: `${result.scoreLabel} boundary`, detail: result.call.benchmarkValue == null ? "No fixed public call boundary; applicant-pool ranking applies" : `${currentCallScore == null ? "Score unavailable" : formatScore(currentCallScore, 2)} against ${formatScore(result.call.benchmarkValue, 2)}`, passed: result.call.benchmarkValue == null || result.call.margin == null ? null : result.call.margin >= 0 },
  ];

  const pipeline: Array<{ label: string; value: string; state: StepState }> = [
    { label: "Eligibility", value: result.eligibility.bachelorPass ? "Passed" : "Failed", state: result.eligibility.bachelorPass ? "pass" : "fail" },
    { label: "CAT screen", value: result.eligibility.passed ? "Passed" : "Failed", state: result.eligibility.passed ? "pass" : "fail" },
    { label: "Academic profile", value: result.preInterview.status === "CALCULATED" ? "Evaluated" : humanize(result.preInterview.status), state: result.preInterview.status === "CALCULATED" ? "pass" : "neutral" },
    { label: result.scoreLabel, value: currentCallScore == null ? scoreFallback : `${formatScore(currentCallScore, 2)}/${result.preInterview.maxScore}`, state: currentCallScore == null ? "neutral" : "pass" },
    ...(result.selectionStages.interview ? [
      { label: "Call benchmark", value: result.call.benchmarkValue == null ? "Not published" : formatScore(result.call.benchmarkValue, 2), state: result.call.benchmarkValue == null ? "neutral" as StepState : callPredicted ? "pass" as StepState : callNegative ? "fail" as StepState : "current" as StepState },
      { label: "Interview call", value: callPredicted ? "Call predicted" : humanize(result.call.status), state: callPredicted ? "pass" as StepState : callNegative ? "fail" as StepState : "current" as StepState },
    ] : [
      { label: "Direct merit ranking", value: humanize(result.call.status), state: result.eligibility.passed ? "current" as StepState : "fail" as StepState },
    ]),
    { label: "Final score", value: result.final.score == null ? humanize(result.final.status) : `${formatScore(result.final.score, 2)}/${result.final.maxScore}`, state: result.final.score == null ? "neutral" : "pass" },
    { label: "Seat model", value: probability == null ? probabilityFallback : humanize(result.prediction.band ?? "BORDERLINE"), state: probability == null ? callNegative ? "fail" : "neutral" : "current" },
  ];

  return (
    <div className="results-stack" aria-live="polite">
      <section id={REPORT_SECTION_IDS.quick} className="panel result-hero report-navigation-target" tabIndex={-1}>
        <div className="result-hero-main">
          <div className="result-score">
            <span className="result-score-label">{result.scoreLabel}</span>
            <strong>{currentCallScore == null ? scoreFallback : formatScoreOutOf100(currentCallScore, result.preInterview.maxScore)}</strong>
            {preSource !== "MODEL_ASSUMPTION" && <SourceBadge source={preSource} />}
            <div className="score-comparison">
              <div><span>Benchmark</span><b>{result.call.benchmarkValue == null ? "Not configured" : formatScoreOutOf100(result.call.benchmarkValue, result.preInterview.maxScore)}</b></div>
              <div><span>Margin</span><b className={(callMarginOutOf100 ?? -1) >= 0 ? "positive-delta" : ""}>{callMarginOutOf100 == null ? marginFallback : `${callMarginOutOf100 >= 0 ? "+" : ""}${formatScore(callMarginOutOf100, 2)} pts`}</b></div>
            </div>
          </div>
        </div>
      </section>

      {afterScore}

      <section className="panel feedback-summary" aria-labelledby="institute-feedback-heading">
        <div className="section-heading compact-heading"><div><h3 id="institute-feedback-heading">At a glance</h3><p>The most important strength and concern in this profile.</p></div></div>
        <div className="feedback-snapshot-grid">
          <article className="feedback-snapshot strength">
            <span className="feedback-snapshot-label"><Check size={14} aria-hidden="true" /> Strongest area</span>
            <strong>{topStrength}</strong>
            <p>{result.eligibility.passed ? "This supports progression through the institute's official first-screen gates." : "The profile has positive evidence, but an earlier hard gate remains binding."}</p>
          </article>
          <article className={`feedback-snapshot ${result.gaps.length ? "gap" : "clear"}`}>
            <span className="feedback-snapshot-label">{result.gaps.length ? <X size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />} Main concern</span>
            <strong>{topGap}</strong>
            <p>{result.gaps.length ? "This is the most important limitation or uncertainty in the current result." : "No deficiency currently blocks the predicted interview-call route."}</p>
          </article>
        </div>
      </section>

      <div className="feedback-disclosure">
        <button type="button" className="feedback-toggle" aria-expanded={showMore} aria-controls="institute-detailed-feedback" onClick={() => setShowMore((current) => !current)}>
          <span>{showMore ? "Show less feedback" : "More feedback"}</span>
          {showMore ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
        </button>
      </div>

      {showMore && (
        <div className="detailed-feedback" id="institute-detailed-feedback">
          <section id={REPORT_SECTION_IDS.strengths} className="panel insight-panel report-navigation-target" tabIndex={-1} aria-labelledby="institute-insight-heading">
            <div className="section-heading"><div><h3 id="institute-insight-heading">Profile strengths and gaps</h3><p>{callPredicted ? "The strongest evidence supporting this qualification" : "The exact conditions helping and blocking this profile"}</p></div><SourceBadge source="CALCULATED" /></div>
            <div className="insight-grid">
              <TextInsightList title="Where this profile is strong" emptyMessage="No measurable strength was reached before the failed hard gate." items={result.strengths} tone="strength" />
              <TextInsightList title="What is lacking or blocking" emptyMessage="No blocking deficiency was found in the interview-call criteria." items={result.gaps} tone="gap" />
            </div>
            {result.nextSteps.length > 0 && <div className="next-steps"><h4>{callPredicted ? "What to focus on next" : "How to improve this profile"}</h4><ol>{result.nextSteps.map((step) => <li key={step}>{step}</li>)}</ol></div>}
          </section>

          <section className="panel pipeline-panel" aria-labelledby="institute-pipeline-heading">
            <div className="section-heading"><div><h3 id="institute-pipeline-heading">Candidate journey</h3><p>Every earlier gate remains binding.</p></div><SourceBadge source="OFFICIAL_POLICY" /></div>
            <div className="pipeline">{pipeline.map((step) => <PipelineStep key={step.label} {...step} />)}</div>
            {callNegative && result.gaps.length > 0 && (
              <div className="journey-gaps" role="group" aria-labelledby="institute-journey-gaps-heading">
                <div className="journey-gaps-heading"><span aria-hidden="true"><X size={14} /></span><div><h4 id="institute-journey-gaps-heading">Where this profile is lagging</h4><p>Exact failed conditions that prevented progression to an interview call</p></div></div>
                <div className="journey-gap-list">{result.gaps.map((gap) => <div className="journey-gap-item" key={gap}><div><strong>{gap}</strong><p>This condition remains binding for the current result.</p></div><span>Attention</span></div>)}</div>
              </div>
            )}
          </section>

          <div className="metric-grid">
            <Metric label={result.scoreLabel} value={currentCallScore == null ? scoreFallback : `${formatScore(currentCallScore, 2)} / ${result.preInterview.maxScore}`} note="Current selection-stage calculation" />
            <Metric label="Overall CAT percentile" value={candidate.catOverallPercentile.toFixed(2)} note={`Required ${cutoffText(result.eligibility.cutoff.overall)}`} tone={result.eligibility.overallPass ? "success" : "warning"} />
            <Metric label="Call benchmark" value={result.call.benchmarkValue == null ? "Not published" : formatScore(result.call.benchmarkValue, 2)} note={humanize(result.call.benchmarkType)} />
            <Metric label="Call margin" value={result.call.margin == null ? marginFallback : `${result.call.margin >= 0 ? "+" : ""}${result.call.margin.toFixed(2)}`} note="Current score minus benchmark" tone={(result.call.margin ?? -1) >= 0 ? "success" : "warning"} />
          </div>

          <section className="panel detail-panel" aria-labelledby="pre-score-heading">
            <div className="section-heading">
              <div><h3 id="pre-score-heading">{result.scoreLabel} breakdown</h3><p>{preUsesModel ? `Official ${result.institute} weights with clearly labelled synthetic normalization inputs and model benchmarks.` : result.institute === "IIMC" && result.call.benchmarkType === "MODEL" ? "Official IIMC 85-point score components; only the interview-call benchmark is a mock-model assumption." : "Every available official score component and formula."}</p></div>
              <SourceBadge source={preSource} />
            </div>
            {result.preInterview.missingRuntimeData.length > 0 && <div className="missing-data-box"><Database size={19} aria-hidden="true" /><div><strong>Normalization data required</strong><ul>{result.preInterview.missingRuntimeData.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}
            <ComponentList components={result.preInterview.components} />
            <div className="generic-total"><span>{result.scoreLabel}</span><strong>{currentCallScore == null ? humanize(result.preInterview.status) : `${formatScore(currentCallScore, 2)} / ${result.preInterview.maxScore}`}</strong></div>
            <div className="call-summary-grid prepi-benchmark-summary">
              <div><span>Call benchmark</span><strong>{result.call.benchmarkValue == null ? "Not configured" : `${formatScore(result.call.benchmarkValue, 2)} / ${result.preInterview.maxScore}`}</strong></div>
              <div><span>Margin</span><strong>{result.call.margin == null ? marginFallback : `${result.call.margin >= 0 ? "+" : ""}${result.call.margin.toFixed(2)}`}</strong></div>
              <div><span>Interpretation</span><strong>{callPredicted ? "Call predicted" : humanize(result.call.status)}</strong></div>
            </div>
          </section>

          <div className="two-column-panels">
            <section className="panel detail-panel" aria-labelledby="score-source-heading">
              <div className="section-heading"><div><h3 id="score-source-heading">Score components</h3><p>Official component breakdown</p></div><SourceBadge source={preSource} /></div>
              <div className="rating-list">{result.preInterview.components.map((component) => (
                <div className="rating-row" key={component.key}>
                  <div><div className="rating-label"><span>{component.label}</span><span>max {component.maxScore}</span></div><div className="rating-track"><div className="rating-fill" style={{ width: `${component.score == null || component.maxScore === 0 ? 0 : Math.min(100, component.score / component.maxScore * 100)}%` }} /></div></div>
                  <span className="rating-value">{component.score == null ? "—" : formatScore(component.score, 2)}</span>
                </div>
              ))}</div>
            </section>
            <section className="panel detail-panel" aria-labelledby="call-heading">
                <div className="section-heading"><div><h3 id="call-heading">{directMerit ? "Direct-merit decision" : "Interview-call decision"}</h3><p>Eligibility, benchmark and margin</p></div><SourceBadge source={result.call.benchmarkType === "MODEL" ? "MODEL_ASSUMPTION" : "OFFICIAL_POLICY"} /></div>
              <div className="call-detail">
                <div className="call-detail-row"><span>Official minimums</span><strong>{result.call.officialMinimumsPassed ? "Passed" : "Failed"}</strong></div>
                <div className="call-detail-row"><span>{result.scoreLabel}</span><strong>{currentCallScore == null ? scoreFallback : `${formatScore(currentCallScore, 2)} / ${result.preInterview.maxScore}`}</strong></div>
                <div className="call-detail-row"><span>Benchmark</span><strong>{result.call.benchmarkValue == null ? "Not published" : formatScore(result.call.benchmarkValue, 2)}</strong></div>
                <div className="call-detail-row"><span>Benchmark type</span><strong>{humanize(result.call.benchmarkType)}</strong></div>
                <div className="call-detail-row"><span>Margin</span><strong>{result.call.margin == null ? marginFallback : `${result.call.margin >= 0 ? "+" : ""}${result.call.margin.toFixed(2)}`}</strong></div>
                <div className="call-detail-row"><span>{directMerit ? "Merit result" : "Call result"}</span><strong>{callLabel}</strong></div>
              </div>
            </section>
          </div>

          <section className="panel final-panel" aria-labelledby="institute-final-heading">
            <div className="final-top">
              <div className="final-details">
                <div className="section-heading"><div><h3 id="institute-final-heading">Final selection planning</h3><p>Official final-score layer; predictive benchmark kept separate</p></div><SourceBadge source={result.prediction.benchmarkType === "MODEL" ? "MODEL_ASSUMPTION" : "OFFICIAL_POLICY"} /></div>
                <div className="metric-grid">
                  <Metric label="Final composite score" value={result.final.score == null ? humanize(result.final.status) : `${formatScore(result.final.score, 2)} / ${result.final.maxScore}`} />
                  <Metric label="Seat benchmark" value={result.prediction.benchmarkValue == null ? "Not configured" : formatScore(result.prediction.benchmarkValue, 2)} note={humanize(result.prediction.benchmarkType)} />
                  <Metric label="Prediction band" value={result.prediction.band == null ? probabilityFallback : humanize(result.prediction.band)} />
                  <Metric label="Expected seat chance" value={probability == null ? probabilityFallback : formatProbability(probability)} />
                </div>
                <div className="disclosure"><strong>Model estimate—not an admission guarantee.</strong> {result.prediction.disclaimer}</div>
                <ComponentList components={result.final.components} />
                <div className="generic-total"><span>Final-selection total</span><strong>{result.final.score == null ? humanize(result.final.status) : `${formatScore(result.final.score, 2)} / ${result.final.maxScore}`}</strong></div>
              </div>
            </div>
          </section>

          <section className="panel detail-panel" aria-labelledby="institute-why-heading">
            <div className="section-heading"><div><h3 id="institute-why-heading">Why this result?</h3><p>Generated from the exact gate sequence</p></div><SourceBadge source="CALCULATED" /></div>
            <ol className="explain-list">{result.explanation.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ol>
          </section>

          <section id={REPORT_SECTION_IDS.history} className="panel detail-panel historical-call-panel report-navigation-target" tabIndex={-1} aria-labelledby={`${result.institute.toLowerCase()}-historical-call-heading`}>
            <div className="section-heading"><div><h3 id={`${result.institute.toLowerCase()}-historical-call-heading`}>{directMerit ? "Previous selection records and this profile" : "Previous interview-call scores vs this profile"}</h3><p>{historicalReference.recordLabel}. Historical facts and test-model assumptions are kept separate.</p></div><SourceBadge source="OFFICIAL_POLICY" /></div>
            <div className={`historical-call-grid ${modelCallBenchmark == null ? "single" : ""}`}>
              <article className="historical-call-card historical-records-card">
                <div className="historical-current-comparison">
                  <div><span>{historicalReference.studentScoreLabel}</span><strong>{currentCallScore == null ? "—" : `${formatScore(currentCallScore, 2)} / ${result.preInterview.maxScore}`}</strong></div>
                  <div><span>{historicalReference.boundaryLabel}</span><strong className={historicalBenchmark == null ? "historical-call-not-published" : ""}>{historicalBenchmark == null ? "Not publicly published" : `${formatScore(historicalBenchmark, 2)} / ${result.preInterview.maxScore}`}</strong></div>
                </div>
                {historicalGap != null && <div className={`historical-call-gap ${historicalGap >= 0 ? "above" : "below"}`}>{`${historicalGap >= 0 ? "+" : ""}${historicalGap.toFixed(2)} · ${Math.abs(historicalGap).toFixed(2)} ${historicalGap >= 0 ? "above" : "below"} the published historical boundary`}</div>}
                <div className="historical-cycle-list">
                  {historicalReference.cycles.map((cycle) => (
                    <section className={`historical-cycle-row ${cycle.noPriorCycle ? "no-prior-cycle" : ""}`} key={`${cycle.batch}-${cycle.catYear}`}>
                      <div className="historical-cycle-heading">
                        <div><strong>{cycle.batch}</strong><span>CAT {cycle.catYear} · {cycle.recordLabel}</span></div>
                        {cycle.officialUrl && <a href={cycle.officialUrl} target="_blank" rel="noreferrer">Official source</a>}
                      </div>
                      {cycle.catScreen ? (
                        <div className="historical-screening-data">
                          <span>Published {cycle.catScreen.category} CAT screen</span>
                          <strong>{cycle.catScreen.overall == null ? "Overall not specified" : `Overall ${cycle.catScreen.overall}`}</strong>
                          <small>{[
                            cycle.catScreen.varc == null ? null : `VARC ${cycle.catScreen.varc}`,
                            cycle.catScreen.dilr == null ? null : `DILR ${cycle.catScreen.dilr}`,
                            cycle.catScreen.qa == null ? null : `QA ${cycle.catScreen.qa}`,
                          ].filter(Boolean).join(" · ") || "No sectional minimum published in this record"}</small>
                        </div>
                      ) : (
                        <div className="historical-screening-data unavailable"><span>Comparable numeric record</span><strong>{cycle.noPriorCycle ? "No earlier cycle exists" : "Not configured"}</strong></div>
                      )}
                      <p>{cycle.note}</p>
                    </section>
                  ))}
                </div>
              </article>
              {modelCallBenchmark != null && (
                <article className="historical-call-card model-reference-card">
                  <div className="historical-call-card-heading"><div><span>Current mock model</span><small>Testing reference only</small></div><span className="benchmark-badge benchmark-model">Model</span></div>
                  <div className="historical-call-score-row"><div><span>Model call benchmark</span><strong>{formatScore(modelCallBenchmark, 2)} / {result.preInterview.maxScore}</strong></div><div><span>{historicalReference.studentScoreLabel}</span><strong>{currentCallScore == null ? "—" : `${formatScore(currentCallScore, 2)} / ${result.preInterview.maxScore}`}</strong></div></div>
                  <div className={`historical-call-gap ${modelCallGap == null ? "unavailable" : modelCallGap >= 0 ? "above" : "below"}`}>{modelCallGap == null ? "Comparison unavailable because the current score was not calculated." : `${modelCallGap >= 0 ? "+" : ""}${modelCallGap.toFixed(2)} · ${Math.abs(modelCallGap).toFixed(2)} ${modelCallGap >= 0 ? "above" : "below"} this model benchmark`}</div>
                </article>
              )}
            </div>
            <div className="historical-call-note"><strong>How to read this history:</strong> published CAT screens are minimum eligibility or first-screen percentiles, not proof that a candidate received an interview call. The actual call depends on the institute&apos;s composite ranking and applicant pool. Any mock-model comparison is shown in a separate card and is not an official historical cutoff.</div>
          </section>

          <section className="panel decision-audit-toggle-panel" aria-label={`Detailed decision audit controls for ${result.instituteName}`}>
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
            <section id={REPORT_SECTION_IDS.audit} className="panel detail-panel report-navigation-target" tabIndex={-1} aria-labelledby="institute-audit-heading">
              <div className="section-heading"><div><h3 id="institute-audit-heading">Detailed decision audit</h3><p>Every input, comparison and formula used in the result</p></div><SourceBadge source="CALCULATED" /></div>
              <div className="audit-grid">
                <article className="audit-card">
                  <h4>1. Basic eligibility</h4>
                  <AuditRow label="Bachelor marks" value={`${candidate.bachelorPercent.toFixed(2)}% / ${result.eligibility.bachelorRequired.toFixed(0)}%`} explanation="The applicable bachelor minimum is based on the institute's published category rules." state={result.eligibility.bachelorPass ? "pass" : "fail"} />
                  <AuditRow label="Section score condition" value={result.eligibility.rawScoreGatePass ? "Satisfied" : "Failed"} explanation={result.institute === "IIMB" ? "All three CAT sections require positive raw scores." : "All three CAT sections must satisfy the institute's non-negative score condition."} state={result.eligibility.rawScoreGatePass ? "pass" : "fail"} />
                  <AuditRow label="Official minimums" value={result.eligibility.passed ? "Passed" : "Failed"} explanation="Degree and CAT minimums are binding before later-stage scoring matters." state={result.eligibility.passed ? "pass" : "fail"} />
                </article>
                <article className="audit-card">
                  <h4>2. CAT hard-gate screen</h4>
                  <AuditRow label="Overall percentile" value={`${candidate.catOverallPercentile.toFixed(2)} / ${cutoffText(result.eligibility.cutoff.overall)}`} explanation="The overall CAT percentile is checked when the institute publishes a threshold." state={result.eligibility.overallPass ? "pass" : "fail"} />
                  <AuditRow label="VARC percentile" value={`${candidate.catVarcPercentile.toFixed(2)} / ${cutoffText(result.eligibility.cutoff.varc)}`} explanation="VARC is checked independently when a sectional threshold exists." state={result.eligibility.varcPass ? "pass" : "fail"} />
                  <AuditRow label="DILR percentile" value={`${candidate.catDilrPercentile.toFixed(2)} / ${cutoffText(result.eligibility.cutoff.dilr)}`} explanation="DILR is checked independently when a sectional threshold exists." state={result.eligibility.dilrPass ? "pass" : "fail"} />
                  <AuditRow label="QA percentile" value={`${candidate.catQaPercentile.toFixed(2)} / ${cutoffText(result.eligibility.cutoff.qa)}`} explanation="QA is checked independently when a sectional threshold exists." state={result.eligibility.qaPass ? "pass" : "fail"} />
                </article>
                {result.preInterview.components.length > 0 && (
                  <article className="audit-card">
                    <h4>3. Shortlist score construction</h4>
                    {result.preInterview.components.map((component) => <AuditRow key={component.key} label={component.label} value={component.score == null ? "Required" : `${formatScore(component.score, 2)} / ${component.maxScore}`} explanation={`${component.formula}. ${component.detail}`} state={component.status === "CALCULATED" ? "pass" : component.status === "DATA_REQUIRED" ? "fail" : "info"} />)}
                  </article>
                )}
                <article className="audit-card outcome-audit-card">
                  <h4>4. Overall selection conclusion</h4>
                  <AuditRow label={directMerit ? "Direct merit status" : "Interview call"} value={callPredicted ? "YES · predicted" : humanize(result.call.status)} explanation={result.call.reason} state={callPredicted ? "pass" : callNegative ? "fail" : "info"} />
                  <AuditRow label="Applicable benchmark" value={result.call.benchmarkValue == null ? "Not published" : formatScore(result.call.benchmarkValue, 2)} explanation={`Benchmark source: ${humanize(result.call.benchmarkType)}.`} state={result.call.benchmarkValue == null ? "info" : "pass"} />
                  <AuditRow label="Applicable margin" value={result.call.margin == null ? "Unavailable" : `${result.call.margin >= 0 ? "+" : ""}${result.call.margin.toFixed(2)}`} explanation="Positive means the current shortlist score is above the configured boundary." state={result.call.margin == null ? "info" : result.call.margin >= 0 ? "pass" : "fail"} />
                </article>
              </div>
            </section>
          )}

          {result.selectionStages.interview && (
            <PiScoreSimulator
              instituteName={result.instituteName}
              simulatorKey={`${result.policyVersion}-${result.final.score ?? "none"}`}
              initialPercent={initialPiPercent}
              piMaxScore={piComponent?.maxScore ?? 0}
              finalMaxScore={result.final.maxScore}
              benchmarkLabel={result.prediction.benchmarkValue == null ? "No final-selection benchmark is configured, so a seat percentage cannot be estimated." : `Uses the active ${humanize(result.prediction.benchmarkType).toLowerCase()} final benchmark of ${formatScore(result.prediction.benchmarkValue, 2)}.`}
              callPredictionLabel={callLabel}
              callPredictionReason={result.call.reason}
              callPredictionTone={callPredicted ? "positive" : callNegative ? "negative" : "neutral"}
              callCriteria={callCriteria}
              unavailableReason={!piComponent ? "The published/configured final formula does not provide a numeric PI weight that can be varied safely." : nonPiTotal == null ? "One or more non-PI final-score components are still unavailable." : undefined}
              simulate={(piPercent) => {
                const piPoints = piComponent == null ? 0 : piPercent / 100 * piComponent.maxScore;
                const finalScore = piComponent == null || nonPiTotal == null ? null : nonPiTotal + piPoints;
                const callGate = result.call.status === "PREDICTED_CALL";
                const seatProbability = finalScore == null || result.prediction.benchmarkValue == null
                  ? null
                  : callGate
                    ? 1 / (1 + Math.exp(-0.35 * (finalScore - result.prediction.benchmarkValue)))
                    : 0;
                return {
                  piPoints,
                  finalScore,
                  seatProbability,
                  band: seatProbability == null ? null : institutePredictionBand(seatProbability),
                };
              }}
            />
          )}
        </div>
      )}

    </div>
  );
}
