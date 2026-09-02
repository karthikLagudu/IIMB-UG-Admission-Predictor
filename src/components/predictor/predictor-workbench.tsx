"use client";

import { useEffect, useState } from "react";
import type { CandidateInput, IimaPolicyConfig } from "@/types/iima";
import { IIMA_CAT_2025_POLICY, predictIimaAdmission } from "@/lib/iima";
import { predictAllNonIimaInstitutes } from "@/lib/institutes";
import { candidateInputSchema } from "@/lib/validation/iima";
import { CandidateForm, cloneSample, createEmptyCandidate } from "./candidate-form";
import { CombinedResultsDashboard, type CombinedPredictionResults } from "./combined-results-dashboard";

const MOCK_DATA_TEST_MODE = true;

function calculateLocalResults(candidate: CandidateInput, policy: IimaPolicyConfig): CombinedPredictionResults {
  return {
    IIMA: predictIimaAdmission(candidate, policy),
    institutes: predictAllNonIimaInstitutes(candidate, MOCK_DATA_TEST_MODE),
  };
}

export function PredictorWorkbench() {
  const initialCandidate = MOCK_DATA_TEST_MODE ? cloneSample() : createEmptyCandidate();
  const [candidate, setCandidate] = useState<CandidateInput>(initialCandidate);
  const policy: IimaPolicyConfig = IIMA_CAT_2025_POLICY;
  const [results, setResults] = useState<CombinedPredictionResults | null>(() => (
    MOCK_DATA_TEST_MODE ? calculateLocalResults(initialCandidate, IIMA_CAT_2025_POLICY) : null
  ));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileStep, setMobileStep] = useState(0);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    const editCandidate = () => {
      setShowForm(true);
      setMobileStep(0);
    };
    window.addEventListener("iim-edit-candidate", editCandidate);
    return () => window.removeEventListener("iim-edit-candidate", editCandidate);
  }, []);

  useEffect(() => {
    if (!showForm && results) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [showForm, results]);

  const analyze = async () => {
    const validated = candidateInputSchema.safeParse(candidate);
    if (!validated.success) {
      setError(validated.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" · "));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setCandidate(validated.data);
      setResults(calculateLocalResults(validated.data, policy));
      setShowForm(false);
      setMobileStep(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="institute-workbench">
      <div className={`workspace combined-workspace ${showForm ? "form-only" : "results-only"}`}>
        {showForm && (
          <CandidateForm
            institute="ALL"
            candidate={candidate}
            setCandidate={setCandidate}
            onAnalyze={analyze}
            loading={loading}
            error={error}
            mobileStep={mobileStep}
            setMobileStep={setMobileStep}
          />
        )}
        {!showForm && results && (
          <CombinedResultsDashboard
            candidate={candidate}
            results={results}
            policy={policy}
            onEditDetails={() => setShowForm(true)}
          />
        )}
      </div>
    </div>
  );
}
