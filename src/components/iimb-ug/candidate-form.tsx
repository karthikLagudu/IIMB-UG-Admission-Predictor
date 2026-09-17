"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { IimbUgCandidateDraft } from "@/types/iimb-ug";

interface CandidateFormProps {
  candidate: IimbUgCandidateDraft;
  setCandidate: Dispatch<SetStateAction<IimbUgCandidateDraft>>;
  issues: Array<{ path: string; message: string }>;
  clearIssue: (field: string) => void;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CandidateForm(props: CandidateFormProps) {
  const { candidate, setCandidate } = props;
  const fieldIssue = (field: string) => props.issues.find((issue) => issue.path === `candidate.${field}`);
  const update = <K extends keyof IimbUgCandidateDraft>(key: K, value: IimbUgCandidateDraft[K]) => {
    setCandidate((current) => ({ ...current, [key]: value }));
    props.clearIssue(String(key));
  };
  const number = (key: keyof IimbUgCandidateDraft, raw: string) => {
    update(key, (raw === "" ? undefined : Number(raw)) as never);
  };
  return (
    <form className="ug-candidate-form" onSubmit={props.onSubmit} noValidate>
      <div className="ug-form-heading"><div><span>Candidate profile</span><h2>Check your category cutoff</h2><p className="ug-programme-scope">See the previous-cycle QADI percentile for your category and check basic eligibility for both UG programmes.</p></div></div>

      <fieldset>
        <legend>Eligibility</legend>
        <div className="ug-field-grid">
          <label className={fieldIssue("dateOfBirth") ? "has-error" : ""}><span>Date of birth</span><input data-field="dateOfBirth" aria-invalid={Boolean(fieldIssue("dateOfBirth"))} type="date" value={candidate.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} required />{fieldIssue("dateOfBirth") && <small className="ug-field-error">Please enter your date of birth.</small>}</label>
          <label className={fieldIssue("category") ? "has-error" : ""}><span>Category</span><select data-field="category" aria-invalid={Boolean(fieldIssue("category"))} value={candidate.category} onChange={(event) => update("category", event.target.value as IimbUgCandidateDraft["category"])} required><option value="" disabled>Select category</option><option value="GENERAL">General</option><option value="EWS">EWS</option><option value="NC_OBC">NC-OBC</option><option value="SC">SC</option><option value="ST">ST</option></select>{fieldIssue("category") && <small className="ug-field-error">Please select a category.</small>}</label>
          <label className={fieldIssue("gender") ? "has-error" : ""}><span>Gender</span><select data-field="gender" aria-invalid={Boolean(fieldIssue("gender"))} value={candidate.gender} onChange={(event) => update("gender", event.target.value as IimbUgCandidateDraft["gender"])} required><option value="" disabled>Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="TRANSGENDER">Transgender</option></select>{fieldIssue("gender") && <small className="ug-field-error">Please select a gender.</small>}</label>
          <label className={fieldIssue("class10OverallPercent") ? "has-error" : ""}><span>Class X overall %</span><input data-field="class10OverallPercent" aria-invalid={Boolean(fieldIssue("class10OverallPercent"))} type="number" min="0" max="100" step="0.01" value={candidate.class10OverallPercent ?? ""} onChange={(event) => number("class10OverallPercent", event.target.value)} required />{fieldIssue("class10OverallPercent") && <small className="ug-field-error">Please enter your Class X overall percentage.</small>}</label>
          <label className={fieldIssue("class10MathPercent") ? "has-error" : ""}><span>Class X Mathematics %</span><input data-field="class10MathPercent" aria-invalid={Boolean(fieldIssue("class10MathPercent"))} type="number" min="0" max="100" step="0.01" value={candidate.class10MathPercent ?? ""} onChange={(event) => number("class10MathPercent", event.target.value)} required />{fieldIssue("class10MathPercent") && <small className="ug-field-error">Please enter your Class X Mathematics percentage.</small>}</label>
          <label className={fieldIssue("class12Status") ? "has-error" : ""}><span>Class XII status</span><select data-field="class12Status" aria-invalid={Boolean(fieldIssue("class12Status"))} value={candidate.class12Status} onChange={(event) => update("class12Status", event.target.value as IimbUgCandidateDraft["class12Status"])} required><option value="" disabled>Select status</option><option value="PASSED">Passed</option><option value="APPEARING">Appearing</option><option value="RESULT_AWAITED">Result awaited</option></select>{fieldIssue("class12Status") && <small className="ug-field-error">Please select your Class XII status.</small>}</label>
          <label><span>Class XII % (optional)</span><input type="number" min="0" max="100" step="0.01" value={candidate.class12Percent ?? ""} onChange={(event) => number("class12Percent", event.target.value)} /></label>
        </div>
        <div className="ug-inline-checks"><label><input type="checkbox" checked={candidate.studiedMathClass11} onChange={(event) => update("studiedMathClass11", event.target.checked)} /> Mathematics in Class XI</label><label><input type="checkbox" checked={candidate.studiedMathClass12} onChange={(event) => update("studiedMathClass12", event.target.checked)} /> Mathematics in Class XII</label><label><input type="checkbox" checked={candidate.pwd} onChange={(event) => update("pwd", event.target.checked)} /> PwD candidate</label></div>
      </fieldset>

      <button className="ug-submit" type="submit" disabled={props.busy}>{props.busy ? "Checking…" : "Show percentile cutoff"}</button>
    </form>
  );
}
