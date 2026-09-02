"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { ArrowDown, RotateCcw } from "lucide-react";
import { formatProbability, formatScore, humanize } from "@/lib/utils";

export interface PiSimulationResult {
  piPoints: number;
  finalScore: number | null;
  seatProbability: number | null;
  band: string | null;
}

export interface PiCallCriterion {
  label: string;
  detail: string;
  passed: boolean | null;
}

function piSliderColor(percent: number): string {
  const red = [182, 59, 70] as const;
  const amber = [167, 101, 17] as const;
  const green = [20, 128, 93] as const;
  const progress = Math.min(100, Math.max(0, percent)) / 100;
  const from = progress <= 0.5 ? red : amber;
  const to = progress <= 0.5 ? amber : green;
  const amount = progress <= 0.5 ? progress * 2 : (progress - 0.5) * 2;
  const color = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
  return `rgb(${color.join(", ")})`;
}

export function PiScoreSimulator({
  instituteName,
  simulatorKey,
  initialPercent,
  piMaxScore,
  finalMaxScore,
  scorePrecision = 2,
  benchmarkLabel,
  callPredictionLabel,
  callPredictionReason,
  callPredictionTone,
  callCriteria,
  simulate,
  unavailableReason,
}: {
  instituteName: string;
  simulatorKey: string;
  initialPercent: number;
  piMaxScore: number;
  finalMaxScore: number;
  scorePrecision?: number;
  benchmarkLabel: string;
  callPredictionLabel: string;
  callPredictionReason: string;
  callPredictionTone: "positive" | "negative" | "neutral";
  callCriteria: PiCallCriterion[];
  simulate: (piPercent: number) => PiSimulationResult;
  unavailableReason?: string;
}) {
  const [piPercent, setPiPercent] = useState(initialPercent);
  const sliderId = useId();
  const inputId = useId();

  useEffect(() => setPiPercent(initialPercent), [initialPercent, simulatorKey]);

  const updatePi = (value: number) => {
    if (!Number.isFinite(value)) return;
    setPiPercent(Math.min(100, Math.max(0, value)));
  };
  const scenario = simulate(piPercent);
  const sliderStyle = {
    "--pi-slider-color": piSliderColor(piPercent),
    "--pi-slider-progress": `${piPercent}%`,
  } as CSSProperties;
  const studentPosition = Math.min(100, Math.max(0, initialPercent));
  const studentMarkerClass = studentPosition <= 8 ? "edge-start" : studentPosition >= 92 ? "edge-end" : "";

  return (
    <section className="panel pi-simulator" aria-labelledby={`${sliderId}-heading`}>
      <div className="pi-simulator-heading">
        <div>
          <span>Interactive final-selection simulator</span>
          <h3 id={`${sliderId}-heading`}>Try a different PI score for {instituteName}</h3>
          <p>Move the slider or type a PI performance from 0 to 100. Results update immediately.</p>
        </div>
        <button type="button" onClick={() => setPiPercent(initialPercent)}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
      </div>

      <div className={`pi-call-context ${callPredictionTone}`}>
        <div className="pi-call-prediction">
          <span>Interview-call prediction</span>
          <strong>{callPredictionLabel}</strong>
          <p>{callPredictionReason}</p>
        </div>
        <div className="pi-call-criteria">
          <span>Criteria applied for {instituteName}</span>
          <div>
            {callCriteria.map((criterion) => (
              <article className={criterion.passed == null ? "neutral" : criterion.passed ? "pass" : "fail"} key={criterion.label}>
                <i aria-hidden="true">{criterion.passed == null ? "•" : criterion.passed ? "✓" : "×"}</i>
                <div><strong>{criterion.label}</strong><small>{criterion.detail}</small></div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {unavailableReason ? (
        <div className="pi-simulator-unavailable"><strong>Numeric PI simulation is not available for this result.</strong><span>{unavailableReason}</span></div>
      ) : (
        <>
          <div className="pi-simulator-controls">
            <div className="pi-slider-field" style={sliderStyle}>
              <label htmlFor={sliderId}>PI performance</label>
              <div className="pi-range-wrap">
                <div className={`pi-student-marker ${studentMarkerClass}`} style={{ left: `${studentPosition}%` }} aria-label={`You may be here for ${instituteName}, at an estimated PI performance of ${studentPosition.toFixed(0)} percent`}>
                  <span>You may be here</span><ArrowDown size={15} aria-hidden="true" />
                </div>
                <input id={sliderId} type="range" min="0" max="100" step="1" value={piPercent} onChange={(event) => updatePi(Number(event.target.value))} />
              </div>
              <div className="pi-slider-scale"><span>0</span><strong>{piPercent.toFixed(0)}%</strong><span>100</span></div>
            </div>
            <div className="pi-number-field">
              <label htmlFor={inputId}>Type PI score (%)</label>
              <div><input id={inputId} type="number" inputMode="decimal" min="0" max="100" step="1" value={piPercent} onFocus={(event) => event.currentTarget.select()} onChange={(event) => updatePi(Number(event.target.value))} /><span>/ 100</span></div>
            </div>
          </div>

          <div className="pi-simulator-results" aria-live="polite">
            <article><span>PI contribution</span><strong>{formatScore(scenario.piPoints, 2)} / {formatScore(piMaxScore, 0)}</strong><small>Uses this IIM&apos;s PI weight</small></article>
            <article><span>Recalculated final score</span><strong>{scenario.finalScore == null ? "Needs other data" : `${formatScore(scenario.finalScore, scorePrecision)} / ${formatScore(finalMaxScore, scorePrecision)}`}</strong><small>All non-PI inputs stay unchanged</small></article>
            <article><span>Estimated seat chance</span><strong className={scenario.seatProbability === 0 ? "simulator-negative" : ""}>{scenario.seatProbability == null ? "Not estimated" : formatProbability(scenario.seatProbability)}</strong><small>{scenario.band == null ? benchmarkLabel : humanize(scenario.band)}</small></article>
          </div>
          <p className="pi-simulator-note"><strong>Scenario only:</strong> this does not alter the saved profile. PI affects final selection only after the candidate receives and attends an interview; it cannot override failed eligibility or shortlist gates. {benchmarkLabel}</p>
        </>
      )}
    </section>
  );
}
