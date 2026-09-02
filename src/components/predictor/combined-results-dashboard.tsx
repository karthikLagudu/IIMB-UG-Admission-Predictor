"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CalendarClock, ChevronDown, ChevronRight, ChevronUp, ListChecks, Sparkles } from "lucide-react";
import type { CandidateInput, IimaPolicyConfig, IimaPredictionResult } from "@/types/iima";
import type { InstituteKey, InstitutePredictionResult } from "@/types/institutes";
import { formatProbability, formatScore, formatScoreOutOf100, normalizeScoreOutOf100 } from "@/lib/utils";
import { callStatusLabel } from "@/lib/institutes/cat2025_2026_28/shared";
import {
  IIMA_HISTORICAL_STAGE2_CALL_RECORDS,
  iimaHistoricalCallCategoryLabel,
  iimaHistoricalCallThreshold,
} from "@/lib/iima/historical-call-records";
import { instituteHistoricalReference } from "@/lib/institutes/historical-references";
import { estimateInterviewCallChance } from "@/lib/institutes/call-probability";
import { ResultsDashboard } from "./results-dashboard";
import { InstituteResultsDashboard } from "./institute-results-dashboard";
import type { ReportNavigationRequest, ReportSection } from "./report-navigation";

export interface CombinedPredictionResults {
  IIMA: IimaPredictionResult;
  institutes: InstitutePredictionResult[];
}

type ChanceBand = "HIGH" | "MEDIUM" | "LOW";

interface ResultSummary {
  key: InstituteKey;
  name: string;
  programme: string;
  status: string;
  scoreLabel: string;
  score: string;
  chanceLabel: string;
  chance: string;
  chanceBand: ChanceBand;
  callChance: string;
  callChanceDetail: string;
  tone: "positive" | "negative" | "pending";
  note: string;
  callTiming: string;
  callBasis: string;
}

interface HistoricalComparisonSummary {
  key: InstituteKey;
  name: string;
  reference: string | null;
  referenceDetail: string;
  studentScore: string;
  sourceUrl: string;
  sourceLabel: string;
  years: HistoricalYearComparison[];
}

interface HistoricalYearComparison {
  batch: string;
  catYear: number;
  reference: string;
  studentPerformance: string;
  comparison: string;
  tone: "above" | "below" | "unavailable";
  note: string;
  sourceUrl?: string;
}

function seatChanceBand(probability: number | null | undefined): ChanceBand {
  if (probability != null && probability >= 0.7) return "HIGH";
  if (probability != null && probability >= 0.4) return "MEDIUM";
  return "LOW";
}

function iimaCallTiming(result: IimaPredictionResult): string {
  return result.callPrediction
    ? "At IIMA's shortlist release · Jan–Mar 2026 planning window"
    : "No call expected from the current profile";
}

function iimaCallBasis(result: IimaPredictionResult): string {
  const route = result.callRoute === "STAGE_1" ? "Stage 1" : result.callRoute === "STAGE_2" ? "Stage 2" : "shortlist";
  return `CAT gates + academic profile + ${route} composite`;
}

function instituteCallTiming(result: InstitutePredictionResult): string {
  if (result.selectionStages.directMerit) return "No interview call · watch the category merit-list release";
  if (result.call.status === "PREDICTED_CALL") return "At the institute shortlist release · Jan–Mar 2026 planning window";
  if (result.call.status === "NO_CALL") return "No call expected from the current profile";
  if (result.call.status === "SPECIAL_CASE_REVIEW_REQUIRED") return "After the institute completes its special-case review";
  if (result.call.status === "DATA_REQUIRED") return "After the institute publishes the required shortlist data";
  return "At the official shortlist release · timing depends on applicant-pool ranking";
}

function instituteCallBasis(result: InstitutePredictionResult): string {
  return result.selectionStages.directMerit
    ? "CAT eligibility + merit score"
    : "CAT eligibility + shortlist score";
}

export function CombinedResultsDashboard({
  candidate,
  results,
  policy,
  onEditDetails,
}: {
  candidate: CandidateInput;
  results: CombinedPredictionResults;
  policy: IimaPolicyConfig;
  onEditDetails?: () => void;
}) {
  const [activeDetail, setActiveDetail] = useState<InstituteKey | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [chanceFilter, setChanceFilter] = useState<ChanceBand | "ALL">("ALL");
  const [headerFilterHost, setHeaderFilterHost] = useState<HTMLElement | null>(null);
  const [reportNavigation, setReportNavigation] = useState<ReportNavigationRequest | null>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const navigateToReportSection = (section: ReportSection) => {
    setReportNavigation((current) => ({ section, requestId: (current?.requestId ?? 0) + 1 }));
  };
  const openInstituteDetail = (key: InstituteKey) => {
    setReportNavigation(null);
    setActiveDetail(key);
  };
  const iimaChance = results.IIMA.finalSelection?.seatProbability ?? 0;
  const iimaBasis = iimaCallBasis(results.IIMA);
  const iimaCallChance = estimateInterviewCallChance({
    eligible: results.IIMA.basicEligibility.passed && Boolean(results.IIMA.catEligibility?.catEligible) && Boolean(results.IIMA.academicConsistency?.passed),
    score: results.IIMA.compositeScore,
    maxScore: 1,
    benchmark: results.IIMA.applicableCallThreshold,
  });
  const summaries: ResultSummary[] = [
    {
      key: "IIMA",
      name: "IIM Ahmedabad",
      programme: "PGP 2026-28",
      status: results.IIMA.callPrediction ? "CALL PREDICTED" : "LESS LIKELY",
      scoreLabel: "Pre-PI / shortlist score",
      score: results.IIMA.compositeScore == null ? "Not calculated" : formatScoreOutOf100(results.IIMA.compositeScore, 1),
      chanceLabel: "Expected seat chance (model)",
      chance: formatProbability(iimaChance),
      chanceBand: seatChanceBand(iimaChance),
      callChance: iimaCallChance.label,
      callChanceDetail: iimaCallChance.detail,
      tone: results.IIMA.callPrediction ? "positive" : "negative",
      note: results.IIMA.callPrediction ? "Observed-boundary planning model" : "An official hard gate or shortlist boundary was not cleared",
      callTiming: iimaCallTiming(results.IIMA),
      callBasis: iimaBasis,
    },
    ...results.institutes.map((result): ResultSummary => {
      const basis = instituteCallBasis(result);
      const callChance = estimateInterviewCallChance({
        eligible: result.eligibility.passed,
        score: result.preInterview.score,
        maxScore: result.preInterview.maxScore,
        benchmark: result.call.benchmarkValue,
        status: result.call.status,
        directMerit: result.selectionStages.directMerit,
      });
      return {
        key: result.institute,
        name: result.instituteName,
        programme: result.programme,
        status: callStatusLabel(result.call.status, result.selectionStages.directMerit),
        scoreLabel: result.scoreLabel,
        score: result.preInterview.score == null
          ? result.preInterview.status === "DATA_REQUIRED" ? "Needs cycle data" : "Not calculated"
          : formatScoreOutOf100(result.preInterview.score, result.preInterview.maxScore),
        chanceLabel: "Expected seat chance (model)",
        chance: result.prediction.probability == null ? "Not estimated yet" : formatProbability(result.prediction.probability),
        chanceBand: seatChanceBand(result.prediction.probability),
        callChance: callChance.label,
        callChanceDetail: callChance.detail,
        tone: result.call.status === "NO_CALL" ? "negative" : result.call.status === "DATA_REQUIRED" ? "pending" : "positive",
        note: result.institute === "IIMB" && result.preInterview.components.some((component) => component.sourceType === "MODEL_ASSUMPTION")
          ? "Test model; synthetic normalization inputs"
          : result.prediction.benchmarkType === "MODEL"
            ? "Test model; official score with mock planning benchmarks"
            : result.call.reason,
        callTiming: instituteCallTiming(result),
        callBasis: basis,
      };
    }),
  ];
  const activeSummary = summaries.find((summary) => summary.key === activeDetail) ?? null;
  const chanceCounts: Record<ChanceBand | "ALL", number> = {
    ALL: summaries.length,
    HIGH: summaries.filter((summary) => summary.chanceBand === "HIGH").length,
    MEDIUM: summaries.filter((summary) => summary.chanceBand === "MEDIUM").length,
    LOW: summaries.filter((summary) => summary.chanceBand === "LOW").length,
  };
  const filteredSummaries = chanceFilter === "ALL"
    ? summaries
    : summaries.filter((summary) => summary.chanceBand === chanceFilter);
  const activeInstituteResult = activeDetail === "IIMA" ? null : results.institutes.find((result) => result.institute === activeDetail) ?? null;
  const latestIimaHistory = IIMA_HISTORICAL_STAGE2_CALL_RECORDS[0];
  const latestIimaThreshold = iimaHistoricalCallThreshold(latestIimaHistory, candidate);
  const currentIimaScoreOutOf100 = results.IIMA.compositeScore == null
    ? null
    : normalizeScoreOutOf100(results.IIMA.compositeScore, 1);
  const latestIimaThresholdOutOf100 = normalizeScoreOutOf100(latestIimaThreshold, 1)!;
  const historicalComparisons: HistoricalComparisonSummary[] = [
    {
      key: "IIMA",
      name: "IIM Ahmedabad",
      reference: `${formatScore(latestIimaThresholdOutOf100, 2)} / 100`,
      referenceDetail: `Official PGP ${latestIimaHistory.batch} Stage-2 minimum CS · ${iimaHistoricalCallCategoryLabel(candidate)} · normalized to 100`,
      studentScore: currentIimaScoreOutOf100 == null ? "Not calculated" : `${formatScore(currentIimaScoreOutOf100, 2)} / 100`,
      sourceUrl: latestIimaHistory.sourceUrl,
      sourceLabel: "Official record",
      years: IIMA_HISTORICAL_STAGE2_CALL_RECORDS.map((record) => {
        const threshold = iimaHistoricalCallThreshold(record, candidate);
        const thresholdOutOf100 = normalizeScoreOutOf100(threshold, 1)!;
        const gap = currentIimaScoreOutOf100 == null ? null : currentIimaScoreOutOf100 - thresholdOutOf100;
        return {
          batch: `PGP ${record.batch}`,
          catYear: Number(record.catYear),
          reference: `Stage-2 minimum CS ${formatScore(thresholdOutOf100, 2)} / 100`,
          studentPerformance: currentIimaScoreOutOf100 == null ? "Current CS not calculated" : `Current CS ${formatScore(currentIimaScoreOutOf100, 2)} / 100`,
          comparison: gap == null ? "Comparison unavailable" : `${gap >= 0 ? "+" : ""}${gap.toFixed(2)} points ${gap >= 0 ? "above" : "below"}`,
          tone: gap == null ? "unavailable" : gap >= 0 ? "above" : "below",
          note: `Official ${iimaHistoricalCallCategoryLabel(candidate)} Stage-2 interview-call record.`,
          sourceUrl: record.sourceUrl,
        };
      }),
    },
    ...results.institutes.map((result): HistoricalComparisonSummary => {
      const hasHistoricalNumber = (result.call.benchmarkType === "HISTORICAL" || result.call.benchmarkType === "OFFICIAL_RESULT")
        && result.call.benchmarkValue != null;
      const studentScore = result.preInterview.score;
      const normalizedStudentScore = studentScore == null
        ? null
        : normalizeScoreOutOf100(studentScore, result.preInterview.maxScore);
      const normalizedReference = hasHistoricalNumber
        ? normalizeScoreOutOf100(result.call.benchmarkValue!, result.preInterview.maxScore)
        : null;
      const historicalReference = instituteHistoricalReference(result.institute);
      return {
        key: result.institute,
        name: result.instituteName,
        reference: normalizedReference == null ? null : `${formatScore(normalizedReference, 2)} / 100`,
        referenceDetail: hasHistoricalNumber
          ? `Published ${result.call.benchmarkType.toLowerCase().replaceAll("_", " ")} call-score reference · normalized to 100`
          : "No fixed previous-cycle interview-call score is publicly configured",
        studentScore: normalizedStudentScore == null ? "Not calculated" : `${formatScore(normalizedStudentScore, 2)} / 100`,
        sourceUrl: result.sourceUrl,
        sourceLabel: hasHistoricalNumber ? "Official record" : "Official process",
        years: historicalReference.cycles.map((cycle) => {
          const screen = cycle.catScreen;
          const checks = screen == null ? [] : [
            { label: "Overall", student: candidate.catOverallPercentile, cutoff: screen.overall },
            { label: "VARC", student: candidate.catVarcPercentile, cutoff: screen.varc },
            { label: "DILR", student: candidate.catDilrPercentile, cutoff: screen.dilr },
            { label: "QA", student: candidate.catQaPercentile, cutoff: screen.qa },
          ].filter((item): item is { label: string; student: number; cutoff: number } => item.cutoff != null);
          const weakest = checks.length === 0
            ? null
            : checks.reduce((lowest, item) => item.student - item.cutoff < lowest.student - lowest.cutoff ? item : lowest);
          const weakestGap = weakest == null ? null : weakest.student - weakest.cutoff;
          const reference = screen == null
            ? cycle.noPriorCycle ? "No earlier admission cycle" : "No compatible numeric screen configured"
            : [
              screen.overall == null ? null : `Overall ${screen.overall}`,
              screen.varc == null ? null : `VARC ${screen.varc}`,
              screen.dilr == null ? null : `DILR ${screen.dilr}`,
              screen.qa == null ? null : `QA ${screen.qa}`,
            ].filter(Boolean).join(" · ");
          return {
            batch: cycle.batch,
            catYear: cycle.catYear,
            reference,
            studentPerformance: `Overall ${candidate.catOverallPercentile.toFixed(2)} · VARC ${candidate.catVarcPercentile.toFixed(2)} · DILR ${candidate.catDilrPercentile.toFixed(2)} · QA ${candidate.catQaPercentile.toFixed(2)}`,
            comparison: weakestGap == null
              ? "Official numeric comparison unavailable"
              : weakestGap >= 0
                ? `Clears every published screen · closest margin +${weakestGap.toFixed(2)} in ${weakest?.label}`
                : `Below the ${weakest?.label} screen by ${Math.abs(weakestGap).toFixed(2)} percentile points`,
            tone: weakestGap == null ? "unavailable" : weakestGap >= 0 ? "above" : "below",
            note: screen == null ? cycle.note : `${cycle.note} General-category screening reference; it is not the actual interview-call composite cutoff.`,
            sourceUrl: cycle.officialUrl,
          };
        }),
      };
    }),
  ];
  const visibleHistoricalComparisons = showAllHistory ? historicalComparisons : historicalComparisons.slice(0, 5);

  useEffect(() => {
    setHeaderFilterHost(document.getElementById("header-results-filter-host"));
  }, []);

  useEffect(() => {
    if (!activeDetail) return;
    const frame = window.requestAnimationFrame(() => detailHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [activeDetail]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("iim-results-visibility", { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent("iim-results-visibility", { detail: false }));
    };
  }, []);

  if (activeDetail && activeSummary) {
    const callOutlookPanel = (
      <section className="panel call-outlook-panel" aria-labelledby="call-outlook-heading">
        <div className="call-outlook-heading">
          <span>Interview-call outlook</span>
          <h2 id="call-outlook-heading">When could this student get a call—and why?</h2>
        </div>
        <div className="call-outlook-grid">
          <article>
            <CalendarClock size={21} aria-hidden="true" />
            <div>
              <span>Expected timing</span>
              <strong>{activeSummary.callTiming}</strong>
              <p>The month range is a planning estimate, not an official announcement. Always verify the institute portal and registered email.</p>
            </div>
          </article>
          <article>
            <ListChecks size={21} aria-hidden="true" />
            <div>
              <span>Basis for this result</span>
              <strong>{activeSummary.callBasis}</strong>
            </div>
          </article>
        </div>
      </section>
    );

    return (
      <div className="institute-focus-shell" aria-live="polite">
        <div className="institute-focus-toolbar">
          <button type="button" className="focus-back-button" onClick={() => setActiveDetail(null)}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to all IIM results
          </button>
          {onEditDetails && <button type="button" className="edit-profile-button" onClick={onEditDetails}>Edit candidate details</button>}
        </div>

        <header className={`institute-report-cover ${activeSummary.tone}`}>
          <div className="report-cover-copy">
            <span className="report-cover-kicker"><Sparkles size={14} aria-hidden="true" /> {activeSummary.key} · Focused admission report</span>
            <h1 ref={detailHeadingRef} tabIndex={-1}>{activeSummary.name}</h1>
            <p>{activeSummary.programme} · Candidate-specific call and seat analysis</p>
            <div className="report-cover-status-row">
              <strong>{activeSummary.status}</strong>
              <span>Mock data active</span>
            </div>
            <small>{activeSummary.note}</small>
          </div>
          <div className="report-cover-stats" aria-label={`${activeSummary.name} key results`}>
            <div>
              <span>{activeSummary.scoreLabel}</span>
              <strong>{activeSummary.score}</strong>
            </div>
            <div aria-label={`Expected interview-call chance ${activeSummary.callChance}. ${activeSummary.callChanceDetail}`}>
              <span>Expected interview-call chance</span>
              <strong>{activeSummary.callChance}</strong>
            </div>
            <div>
              <span>{activeSummary.chanceLabel}</span>
              <strong>{activeSummary.chance}</strong>
            </div>
          </div>
        </header>

        <section className="report-reading-guide" aria-label="Report guide">
          <button type="button" onClick={() => navigateToReportSection("quick")}><span>01</span><span><strong>Quick verdict</strong><small>Score and call outlook</small></span><ChevronDown size={15} aria-hidden="true" /></button>
          <button type="button" onClick={() => navigateToReportSection("strengths")}><span>02</span><span><strong>Strengths and gaps</strong><small>Positives and blockers</small></span><ChevronDown size={15} aria-hidden="true" /></button>
          <button type="button" onClick={() => navigateToReportSection("audit")}><span>03</span><span><strong>Detailed audit</strong><small>Every check and formula</small></span><ChevronDown size={15} aria-hidden="true" /></button>
          <button type="button" onClick={() => navigateToReportSection("history")}><span>04</span><span><strong>Historical comparison</strong><small>Previous-cycle context</small></span><ChevronDown size={15} aria-hidden="true" /></button>
          <p>Select a section to jump directly to it. Hidden detail panels open automatically.</p>
        </section>

        <section className="institute-focus-content" aria-label={`${activeDetail} detailed result`}>
          {activeDetail === "IIMA"
            ? <ResultsDashboard candidate={candidate} result={results.IIMA} policy={policy} afterScore={callOutlookPanel} navigationRequest={reportNavigation} />
            : activeInstituteResult && <InstituteResultsDashboard candidate={candidate} result={activeInstituteResult} afterScore={callOutlookPanel} navigationRequest={reportNavigation} />}
        </section>

        <button type="button" className="focus-back-button focus-back-footer" onClick={() => setActiveDetail(null)}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to all IIM results
        </button>
      </div>
    );
  }

  return (
    <div className="all-results-stack" aria-live="polite" data-iim-results-active="true">
      {headerFilterHost && createPortal(
        <ChanceBandFilters value={chanceFilter} counts={chanceCounts} onChange={setChanceFilter} className="header-chance-filters" />,
        headerFilterHost,
      )}
      <section className="panel results-overview-panel" aria-labelledby="results-overview-heading">
        <div className="results-overview-percentile">
          <span>Expected CAT percentile</span>
          <strong>{candidate.catOverallPercentile === 0 ? "—" : `${candidate.catOverallPercentile.toFixed(2)}%`}</strong>
        </div>
        <div className="results-overview-chances">
          <span>Your IIM chance summary</span>
          <h2 id="results-overview-heading">
            You have{" "}
            <button type="button" className="results-overview-filter high" aria-pressed={chanceFilter === "HIGH"} onClick={() => setChanceFilter((current) => current === "HIGH" ? "ALL" : "HIGH")}>{chanceCounts.HIGH} high {chanceCounts.HIGH === 1 ? "chance" : "chances"}</button>,{" "}
            <button type="button" className="results-overview-filter medium" aria-pressed={chanceFilter === "MEDIUM"} onClick={() => setChanceFilter((current) => current === "MEDIUM" ? "ALL" : "MEDIUM")}>{chanceCounts.MEDIUM} medium {chanceCounts.MEDIUM === 1 ? "chance" : "chances"}</button> and{" "}
            <button type="button" className="results-overview-filter low" aria-pressed={chanceFilter === "LOW"} onClick={() => setChanceFilter((current) => current === "LOW" ? "ALL" : "LOW")}>{chanceCounts.LOW} low {chanceCounts.LOW === 1 ? "chance" : "chances"}</button>.
          </h2>
        </div>
      </section>
      <section className="panel results-table-panel" aria-labelledby="all-results-heading">
        <h2 className="sr-only" id="all-results-heading">Your IIM results</h2>

        <ChanceBandFilters value={chanceFilter} counts={chanceCounts} onChange={setChanceFilter} className="results-chance-filters-mobile" />

        <div className="institute-results-table-wrap">
          <table className="institute-results-table">
            <thead>
              <tr>
                <th scope="col">Institute</th>
                <th scope="col">Programme</th>
                <th scope="col">Result</th>
                <th scope="col">Expected call chance</th>
                <th scope="col">Expected seat chance</th>
                <th scope="col">Expected call window</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.map((summary) => (
                <tr className={summary.tone} key={summary.key}>
                  <th scope="row">
                    <div className="result-table-institute-cell">
                      <strong>{summary.name}</strong>
                      <button
                        type="button"
                        className="result-table-detail-button"
                        onClick={() => openInstituteDetail(summary.key)}
                        aria-label={`View more details for ${summary.name}`}
                      >
                        <span>View more</span>
                        <ChevronRight size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </th>
                  <td>{summary.programme}</td>
                  <td><span className="result-table-status">{summary.status}</span></td>
                  <td className="result-table-call-chance">
                    <strong>{summary.callChance}</strong>
                  </td>
                  <td className="result-table-chance" aria-label={`Expected seat chance: ${summary.chanceBand.toLowerCase()}`}>
                    <small className={`seat-chance-band ${summary.chanceBand.toLowerCase()}`}>
                      {summary.chanceBand === "MEDIUM" ? "med" : summary.chanceBand.toLowerCase()}
                    </small>
                  </td>
                  <td className="result-table-timing">{summary.callTiming}</td>
                </tr>
              ))}
              {filteredSummaries.length === 0 && (
                <tr>
                  <td className="results-filter-empty" colSpan={6}>No IIMs match the selected seat-chance filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="call-window-disclaimer">Call windows are planning estimates for the active admissions cycle. Actual shortlist dates and decisions come only from each IIM through its official portal or registered communication channels.</p>
      </section>

      <section className="panel all-history-panel" aria-labelledby="all-history-heading">
        <div className="all-history-heading">
          <div>
            <span>Historical reference</span>
            <h2 id="all-history-heading">Previous interview-call scores vs this student</h2>
            <p>The student&apos;s current shortlist score is compared only where a compatible published previous-cycle score is available.</p>
          </div>
        </div>
        <div className="all-history-table-wrap" id="all-history-details">
          <table className="all-history-table">
            <thead>
              <tr>
                <th scope="col">Institute</th>
                <th scope="col">Previous-cycle reference (out of 100)</th>
                <th scope="col">Student&apos;s current score (out of 100)</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {visibleHistoricalComparisons.map((comparison) => (
                <HistoricalComparisonRows comparison={comparison} expanded={showAllHistory} key={comparison.key} />
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="all-history-toggle" aria-expanded={showAllHistory} aria-controls="all-history-details" onClick={() => setShowAllHistory((current) => !current)}>
          <span>{showAllHistory ? "Show less historical data" : `View more historical comparisons (${historicalComparisons.length - visibleHistoricalComparisons.length} more IIMs)`}</span>
          {showAllHistory ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
        </button>
        <p className="all-history-note"><strong>Important:</strong> All numeric scores in this table are normalized to a 100-point scale. “Not publicly published” is not a zero and does not indicate rejection. Mock planning benchmarks are excluded. Different IIMs still use different formulas, so this is not a cross-IIM ranking.</p>
      </section>

    </div>
  );
}

function ChanceBandFilters({
  value,
  counts,
  onChange,
  className,
}: {
  value: ChanceBand | "ALL";
  counts: Record<ChanceBand | "ALL", number>;
  onChange: (value: ChanceBand | "ALL") => void;
  className: string;
}) {
  const options: Array<{ value: ChanceBand | "ALL"; label: string }> = [
    { value: "ALL", label: "All" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
  ];

  return (
    <div className={`chance-filter-group ${className}`} role="group" aria-label="Filter IIMs by expected seat chance">
      {options.map((option) => (
        <button
          type="button"
          className={`chance-filter-button ${option.value.toLowerCase()} ${value === option.value ? "active" : ""}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          key={option.value}
        >
          <span>{option.label}</span>
          <strong className="chance-filter-count">{counts[option.value]}</strong>
        </button>
      ))}
    </div>
  );
}

function HistoricalComparisonRows({ comparison, expanded }: { comparison: HistoricalComparisonSummary; expanded: boolean }) {
  return (
    <>
      <tr>
        <th scope="row"><strong>{comparison.name}</strong></th>
        <td>
          <strong className={comparison.reference == null ? "history-unavailable" : ""}>{comparison.reference ?? "Not publicly published"}</strong>
          <small>{comparison.referenceDetail}</small>
        </td>
        <td className="history-student-score">{comparison.studentScore}</td>
        <td><a href={comparison.sourceUrl} target="_blank" rel="noreferrer">{comparison.sourceLabel}</a></td>
      </tr>
      {expanded && (
        <tr className="history-years-row">
          <td colSpan={4}>
            <div className="history-years-grid" aria-label={`${comparison.name} previous-year performance comparisons`}>
              {comparison.years.map((year) => (
                <article className="history-year-card" key={`${comparison.key}-${year.batch}-${year.catYear}`}>
                  <div className="history-year-heading"><div><strong>{year.batch}</strong><span>CAT {year.catYear}</span></div>{year.sourceUrl && <a href={year.sourceUrl} target="_blank" rel="noreferrer">Source</a>}</div>
                  <dl>
                    <div><dt>Historical reference</dt><dd>{year.reference}</dd></div>
                    <div><dt>This student</dt><dd>{year.studentPerformance}</dd></div>
                  </dl>
                  <strong className={`history-year-result ${year.tone}`}>{year.comparison}</strong>
                  <p>{year.note}</p>
                </article>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
