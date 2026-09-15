"use client";

import { useState, type FormEvent } from "react";
import type {
  CalculationMode,
  IimbUgCandidateDraft,
  IimbUgCandidateInput,
  IimbUgPolicyConfig,
  IimbUgPredictionResult,
  IimbUgRuntimeData,
} from "@/types/iimb-ug";
import {
  predictIimbUgAdmission,
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
import { CallScoreRequirement } from "./call-score-requirement";
import { SensitivityAnalysis } from "./sensitivity-analysis";
import { SourcesPanel } from "./sources-panel";

type PredictionResponse = IimbUgPredictionResult & {
  policyConfig: IimbUgPolicyConfig;
  runtimeData: IimbUgRuntimeData;
  persistence: { persisted: boolean; runId: string | null; reason?: string };
};

const REQUIRED_FIELD_MESSAGES: Record<string, { label: string; message: string }> = {
  "candidate.dateOfBirth": { label: "Date of birth", message: "Enter a valid date of birth." },
  "candidate.category": { label: "Category", message: "Select a category." },
  "candidate.gender": { label: "Gender", message: "Select a gender." },
  "candidate.class10OverallPercent": { label: "Class X overall %", message: "Enter the Class X overall percentage." },
  "candidate.class10MathPercent": { label: "Class X Mathematics %", message: "Enter the Class X Mathematics percentage." },
  "candidate.class12Status": { label: "Class XII status", message: "Select the Class XII status." },
};

function freshCandidate(): IimbUgCandidateDraft {
  return {
    dateOfBirth: "",
    category: "",
    pwd: false,
    gender: "",
    studiedMathClass11: false,
    studiedMathClass12: false,
    class12Status: "",
  };
}

function withBlankAttemptsAsZero(candidate: IimbUgCandidateDraft) {
  const varcCorrect = candidate.varcCorrect ?? 0;
  const varcWrong = candidate.varcWrong ?? 0;
  const lrCorrect = candidate.lrCorrect ?? 0;
  const lrWrong = candidate.lrWrong ?? 0;
  const qadiCorrect = candidate.qadiCorrect ?? 0;
  const qadiWrong = candidate.qadiWrong ?? 0;
  return {
    ...candidate,
    varcCorrect,
    varcWrong,
    varcUnattempted: Math.max(15 - varcCorrect - varcWrong, 0),
    lrCorrect,
    lrWrong,
    lrUnattempted: Math.max(15 - lrCorrect - lrWrong, 0),
    qadiCorrect,
    qadiWrong,
    qadiUnattempted: Math.max(30 - qadiCorrect - qadiWrong, 0),
  };
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
  const [candidate, setCandidate] = useState<IimbUgCandidateDraft>(freshCandidate);
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
        candidate: withBlankAttemptsAsZero(candidate),
        calculationMode: "PLANNING",
        targetFinalComposite: 70,
      });
      if (!parsedRequest.success) {
        const validationIssues = parsedRequest.error.issues.map((issue) => {
          const path = issue.path.join(".");
          const requiredField = REQUIRED_FIELD_MESSAGES[path];
          return {
            path,
            message: requiredField?.message ?? issue.message,
          };
        });
        setIssues(validationIssues);
        const firstField = validationIssues[0]?.path.replace(/^candidate\./, "");
        if (firstField) {
          window.setTimeout(() => {
            const field = document.querySelector<HTMLElement>(`[data-field="${firstField}"]`);
            field?.scrollIntoView({ behavior: "smooth", block: "center" });
            field?.focus({ preventScroll: true });
          }, 50);
        }
        return;
      }

      setResult(calculateStaticPrediction(
        parsedRequest.data.candidate,
        parsedRequest.data.calculationMode,
        parsedRequest.data.targetFinalComposite,
      ));
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
          <CandidateForm candidate={candidate} setCandidate={setCandidate} issues={issues} clearIssue={(field) => setIssues((current) => current.filter((issue) => issue.path !== `candidate.${field}`))} busy={busy} onSubmit={submit} />
          {error && <div className="ug-form-error" role="alert"><strong>{error}</strong></div>}
        </aside>

        <div className="ug-results" id="ug-results" aria-live="polite">
          {!result ? (
            <section className="ug-empty-state"><span>Source-aware call planning</span><h2>Your interview-call analysis will appear here</h2><p>Complete the candidate profile to check eligibility, calculate your raw score, compare it with the published previous cycle, and see the personalized test score needed for a competitive call position.</p><div><strong>No fake probability</strong><strong>No hidden cutoff assumptions</strong><strong>Full formula provenance</strong></div></section>
          ) : (
            <>
              <CallOutlookPanel result={result} />
              <CallScoreRequirement result={result} />
              <EligibilityPanel result={result} />
              <ExamScorePanel result={result} />
              <PrePiBreakdown result={result} />
              <SensitivityAnalysis result={result} />
              <HistoricalBenchmark result={result} />
              <SourcesPanel result={result} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
