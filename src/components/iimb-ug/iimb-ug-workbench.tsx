"use client";

import { useState, type FormEvent } from "react";
import type {
  CalculationMode,
  IimbUgCandidateInput,
  IimbUgPolicyConfig,
  IimbUgPredictionResult,
  IimbUgRuntimeData,
} from "@/types/iimb-ug";
import {
  predictIimbUgAdmission,
  SAMPLE_IIMB_UG_CANDIDATE,
} from "@/lib/iimb-ug/2027_31/predictor";
import {
  EMPTY_IIMB_UG_RUNTIME_DATA,
  IIMB_UG_2027_POLICY,
} from "@/lib/iimb-ug/2027_31/policy";
import { iimbUgPredictRequestSchema } from "@/validation/iimb-ug";
import { CandidateForm } from "./candidate-form";
import { EligibilityPanel } from "./eligibility-panel";
import { ExamScorePanel } from "./exam-score-panel";
import { HistoricalBenchmark } from "./historical-benchmark";
import { PrePiBreakdown } from "./prepi-breakdown";
import { CallOutlookPanel } from "./call-outlook";
import { PostPiBreakdown } from "./postpi-breakdown";
import { SensitivityAnalysis } from "./sensitivity-analysis";
import { ProgrammePreference } from "./programme-preference";
import { ReadinessPanel } from "./readiness-panel";
import { SourcesPanel } from "./sources-panel";

type PredictionResponse = IimbUgPredictionResult & {
  policyConfig: IimbUgPolicyConfig;
  runtimeData: IimbUgRuntimeData;
  persistence: { persisted: boolean; runId: string | null; reason?: string };
};

function freshSample(): IimbUgCandidateInput {
  return JSON.parse(JSON.stringify(SAMPLE_IIMB_UG_CANDIDATE)) as IimbUgCandidateInput;
}

function calculateStaticPrediction(
  candidate: IimbUgCandidateInput,
  calculationMode: CalculationMode,
  targetFinalComposite: number,
): PredictionResponse {
  const result = predictIimbUgAdmission(candidate, {
    policy: IIMB_UG_2027_POLICY,
    runtime: EMPTY_IIMB_UG_RUNTIME_DATA,
    calculationMode,
    targetFinalComposite,
  });
  return {
    ...result,
    policyConfig: IIMB_UG_2027_POLICY,
    runtimeData: EMPTY_IIMB_UG_RUNTIME_DATA,
    persistence: {
      persisted: false,
      runId: null,
      reason: "This static GitHub Pages deployment calculates locally and does not store candidate data.",
    },
  };
}

export function IimbUgWorkbench() {
  const [candidate, setCandidate] = useState<IimbUgCandidateInput>(freshSample);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{ path: string; message: string }>>([]);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setIssues([]);
    try {
      const parsedRequest = iimbUgPredictRequestSchema.safeParse({
        candidate,
        calculationMode: "PLANNING",
        targetFinalComposite: 70,
      });
      if (!parsedRequest.success) {
        setIssues(parsedRequest.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })));
        throw new Error("Validation failed. Please correct the highlighted candidate data.");
      }

      if (window.location.hostname.endsWith("github.io")) {
        setResult(calculateStaticPrediction(
          parsedRequest.data.candidate,
          parsedRequest.data.calculationMode,
          parsedRequest.data.targetFinalComposite,
        ));
        window.setTimeout(() => document.getElementById("ug-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        return;
      }
      const response = await fetch("/api/iimb-ug/predict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsedRequest.data),
      });
      const payload = await response.json();
      if (!response.ok) {
        setIssues(payload.issues ?? []);
        throw new Error(payload.error ?? "Prediction request failed.");
      }
      setResult(payload as PredictionResponse);
      window.setTimeout(() => document.getElementById("ug-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Prediction request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ug-workbench">
      <div className="ug-workbench-grid">
        <aside className="ug-form-panel">
          <CandidateForm candidate={candidate} setCandidate={setCandidate} busy={busy} onSubmit={submit} onLoadExample={() => { setCandidate(freshSample()); setError(null); setIssues([]); }} />
          {error && <div className="ug-form-error" role="alert"><strong>{error}</strong>{issues.length ? <ul>{issues.map((issue, index) => <li key={`${issue.path}-${index}`}><code>{issue.path || "request"}</code>: {issue.message}</li>)}</ul> : null}</div>}
        </aside>

        <div className="ug-results" id="ug-results" aria-live="polite">
          {!result ? (
            <section className="ug-empty-state"><span>Source-aware planning</span><h2>Your analysis will appear here</h2><p>Complete the candidate profile to check exact eligibility gates, calculate your raw score, compare it with the published previous cycle, and explore transparent Pre-PI and final-score scenarios.</p><div><strong>No fake probability</strong><strong>No hidden cutoff assumptions</strong><strong>Full formula provenance</strong></div></section>
          ) : (
            <>
              <EligibilityPanel result={result} />
              <ExamScorePanel result={result} />
              <HistoricalBenchmark result={result} />
              <PrePiBreakdown result={result} />
              <CallOutlookPanel result={result} />
              <PostPiBreakdown result={result} />
              <SensitivityAnalysis result={result} />
              <ProgrammePreference result={result} policy={result.policyConfig} />
              <ReadinessPanel result={result} />
              <SourcesPanel result={result} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
