"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CircleCheckBig, CircleMinus, CircleX, ListChecks } from "lucide-react";
import type { IimbUgCandidateDraft } from "@/types/iimb-ug";
import { IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";

interface CandidateFormProps {
  candidate: IimbUgCandidateDraft;
  setCandidate: Dispatch<SetStateAction<IimbUgCandidateDraft>>;
  issues: Array<{ path: string; message: string }>;
  clearIssue: (field: string) => void;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

type AttemptCountKey =
  | "varcCorrect"
  | "varcWrong"
  | "varcUnattempted"
  | "lrCorrect"
  | "lrWrong"
  | "lrUnattempted"
  | "qadiCorrect"
  | "qadiWrong"
  | "qadiUnattempted";

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
  const attemptNumber = (
    key: AttemptCountKey,
    raw: string,
    correctKey: AttemptCountKey,
    wrongKey: AttemptCountKey,
    unattemptedKey: AttemptCountKey,
    total: number,
  ) => {
    setCandidate((current) => {
      const next = { ...current, [key]: raw === "" ? undefined : Number(raw) };
      const correct = next[correctKey];
      const wrong = next[wrongKey];
      return {
        ...next,
        [unattemptedKey]: correct != null && wrong != null ? Math.max(total - correct - wrong, 0) : undefined,
      };
    });
    props.clearIssue(key);
  };
  const examSections = IIMB_UG_2027_POLICY.exam.sections;
  const attemptRows = [
    { label: "VARC", correct: "varcCorrect", wrong: "varcWrong", unattempted: "varcUnattempted", total: examSections.VARC.questions },
    { label: "LR", correct: "lrCorrect", wrong: "lrWrong", unattempted: "lrUnattempted", total: examSections.LR.questions },
    { label: "QADI", correct: "qadiCorrect", wrong: "qadiWrong", unattempted: "qadiUnattempted", total: examSections.QADI.questions },
  ] as const;
  const attemptTotals = attemptRows.reduce((totals, row) => {
    const correct = candidate[row.correct] ?? 0;
    const wrong = candidate[row.wrong] ?? 0;
    return {
      questions: totals.questions + row.total,
      correct: totals.correct + correct,
      wrong: totals.wrong + wrong,
      attempted: totals.attempted + correct + wrong,
      marks: totals.marks + (3 * correct - wrong),
    };
  }, { questions: 0, correct: 0, wrong: 0, attempted: 0, marks: 0 });

  return (
    <form className="ug-candidate-form" onSubmit={props.onSubmit} noValidate>
      <div className="ug-form-heading"><div><span>Candidate profile</span><h2>Build your planning snapshot</h2><p className="ug-programme-scope">One analysis for both B.Sc. (Hons) Data Sciences and B.Sc. (Hons) Economics.</p></div></div>

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

      <fieldset>
        <legend>UG Admission Test attempts</legend>
        <p className="ug-form-help">The table is optional. Any blank Correct or Wrong value is treated as 0.</p>
        <div className="ug-test-banner">
          <span><ListChecks size={17} aria-hidden="true" /><strong>{attemptTotals.questions}</strong> questions · <strong>{attemptTotals.questions * 3}</strong> marks</span>
          <span><CircleCheckBig size={17} aria-hidden="true" />Correct <strong>+3</strong></span>
          <span><CircleX size={17} aria-hidden="true" />Wrong <strong>−1</strong></span>
          <span><CircleMinus size={17} aria-hidden="true" />Unattempted <strong>0</strong></span>
        </div>
        <div className="ug-attempt-table-wrap">
          <table className="ug-attempt-table">
            <thead>
              <tr>
                <th scope="col">UG section</th>
                <th scope="col">Correct <span>+3</span></th>
                <th scope="col">Wrong <span>−1</span></th>
                <th scope="col">Attempted</th>
                <th scope="col">Expected marks</th>
              </tr>
            </thead>
            <tbody>
              {attemptRows.map((row) => {
                const correct = candidate[row.correct] ?? 0;
                const wrong = candidate[row.wrong] ?? 0;
                const attempted = correct + wrong;
                const marks = 3 * correct - wrong;
                return (
                  <tr key={row.label}>
                    <th scope="row"><strong>{row.label}</strong><span>{row.total} questions</span></th>
                    <td className={fieldIssue(row.correct) ? "has-error" : ""} data-label="Correct"><input data-field={row.correct} className="ug-answer-correct" aria-label={`${row.label} correct`} aria-invalid={Boolean(fieldIssue(row.correct))} type="number" min="0" max={row.total} value={candidate[row.correct] ?? ""} onChange={(event) => attemptNumber(row.correct, event.target.value, row.correct, row.wrong, row.unattempted, row.total)} />{fieldIssue(row.correct) && <small className="ug-field-error">{fieldIssue(row.correct)?.message}</small>}</td>
                    <td className={fieldIssue(row.wrong) ? "has-error" : ""} data-label="Wrong"><input data-field={row.wrong} className="ug-answer-wrong" aria-label={`${row.label} wrong`} aria-invalid={Boolean(fieldIssue(row.wrong))} type="number" min="0" max={row.total} value={candidate[row.wrong] ?? ""} onChange={(event) => attemptNumber(row.wrong, event.target.value, row.correct, row.wrong, row.unattempted, row.total)} />{fieldIssue(row.wrong) && <small className="ug-field-error">{fieldIssue(row.wrong)?.message}</small>}</td>
                    <td className="ug-attempted-cell" data-label="Attempted">{attempted} / {row.total}</td>
                    <td className={`ug-marks-cell ${marks < 0 ? "negative" : ""}`} data-label="Expected marks">{marks}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td data-label="Correct">{attemptTotals.correct} right</td>
                <td data-label="Wrong">{attemptTotals.wrong} wrong</td>
                <td data-label="Attempted">{attemptTotals.attempted} / {attemptTotals.questions}</td>
                <td className={attemptTotals.marks < 0 ? "negative" : ""} data-label="Expected marks">{attemptTotals.marks}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </fieldset>

      <button className="ug-submit" type="submit" disabled={props.busy}>{props.busy ? "Calculating…" : "Analyse my profile"}</button>
    </form>
  );
}
