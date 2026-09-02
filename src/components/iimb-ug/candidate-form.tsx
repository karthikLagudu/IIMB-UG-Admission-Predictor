"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CircleCheckBig, CircleMinus, CircleX, ListChecks } from "lucide-react";
import type { IimbUgCandidateInput, Programme } from "@/types/iimb-ug";
import { IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";

interface CandidateFormProps {
  candidate: IimbUgCandidateInput;
  setCandidate: Dispatch<SetStateAction<IimbUgCandidateInput>>;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onLoadExample: () => void;
}

const PROGRAMMES: Array<{ key: Programme; label: string }> = [
  { key: "DATA_SCIENCES", label: "B.Sc. (Hons) Data Sciences" },
  { key: "ECONOMICS", label: "B.Sc. (Hons) Economics" },
];

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
  const update = <K extends keyof IimbUgCandidateInput>(key: K, value: IimbUgCandidateInput[K]) => {
    setCandidate((current) => ({ ...current, [key]: value }));
  };
  const number = (key: keyof IimbUgCandidateInput, raw: string) => {
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
  };
  const toggleProgramme = (programme: Programme, checked: boolean) => {
    const targets = checked
      ? [...new Set([...candidate.targetProgrammes, programme])]
      : candidate.targetProgrammes.filter((item) => item !== programme);
    setCandidate((current) => ({
      ...current,
      targetProgrammes: targets,
      firstPreference: targets.length === 2 ? current.firstPreference ?? targets[0] : targets[0],
      secondPreference: targets.length === 2 ? targets.find((item) => item !== (current.firstPreference ?? targets[0])) : undefined,
    }));
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
      <div className="ug-form-heading"><div><span>Candidate profile</span><h2>Build your planning snapshot</h2></div><button type="button" onClick={props.onLoadExample}>Load worked example</button></div>

      <fieldset>
        <legend>Programme choices</legend>
        <div className="ug-check-grid">{PROGRAMMES.map((programme) => <label className="ug-check-card" key={programme.key}><input type="checkbox" checked={candidate.targetProgrammes.includes(programme.key)} onChange={(event) => toggleProgramme(programme.key, event.target.checked)} /><span>{programme.label}</span></label>)}</div>
      </fieldset>

      <fieldset>
        <legend>Eligibility</legend>
        <div className="ug-field-grid">
          <label><span>Date of birth</span><input type="date" value={candidate.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} required /></label>
          <label><span>Category</span><select value={candidate.category} onChange={(event) => update("category", event.target.value as IimbUgCandidateInput["category"])}><option value="GENERAL">General</option><option value="EWS">EWS</option><option value="NC_OBC">NC-OBC</option><option value="SC">SC</option><option value="ST">ST</option></select></label>
          <label><span>Gender</span><select value={candidate.gender} onChange={(event) => update("gender", event.target.value as IimbUgCandidateInput["gender"])}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="TRANSGENDER">Transgender</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></label>
          <label><span>Gender-diversity eligibility</span><select value={candidate.genderDiversityEligibility} onChange={(event) => update("genderDiversityEligibility", event.target.value as IimbUgCandidateInput["genderDiversityEligibility"])}><option value="UNKNOWN">Unknown</option><option value="ELIGIBLE">Eligible</option><option value="NOT_ELIGIBLE">Not eligible</option></select></label>
          <label><span>Class X overall %</span><input type="number" min="0" max="100" step="0.01" value={candidate.class10OverallPercent} onChange={(event) => number("class10OverallPercent", event.target.value)} required /></label>
          <label><span>Class X Mathematics %</span><input type="number" min="0" max="100" step="0.01" value={candidate.class10MathPercent ?? ""} onChange={(event) => number("class10MathPercent", event.target.value)} /></label>
          <label><span>Class XII status</span><select value={candidate.class12Status} onChange={(event) => update("class12Status", event.target.value as IimbUgCandidateInput["class12Status"])}><option value="PASSED">Passed</option><option value="APPEARING">Appearing</option><option value="RESULT_AWAITED">Result awaited</option></select></label>
          <label><span>Class XII % (optional)</span><input type="number" min="0" max="100" step="0.01" value={candidate.class12Percent ?? ""} onChange={(event) => number("class12Percent", event.target.value)} /></label>
        </div>
        <div className="ug-inline-checks"><label><input type="checkbox" checked={candidate.studiedMathClass11} onChange={(event) => update("studiedMathClass11", event.target.checked)} /> Mathematics in Class XI</label><label><input type="checkbox" checked={candidate.studiedMathClass12} onChange={(event) => update("studiedMathClass12", event.target.checked)} /> Mathematics in Class XII</label><label><input type="checkbox" checked={candidate.pwd} onChange={(event) => update("pwd", event.target.checked)} /> PwD candidate</label></div>
      </fieldset>

      <fieldset>
        <legend>UG Admission Test attempts</legend>
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
                    <td data-label="Correct"><input className="ug-answer-correct" aria-label={`${row.label} correct`} type="number" min="0" max={row.total} value={candidate[row.correct] ?? ""} onChange={(event) => attemptNumber(row.correct, event.target.value, row.correct, row.wrong, row.unattempted, row.total)} /></td>
                    <td data-label="Wrong"><input className="ug-answer-wrong" aria-label={`${row.label} wrong`} type="number" min="0" max={row.total} value={candidate[row.wrong] ?? ""} onChange={(event) => attemptNumber(row.wrong, event.target.value, row.correct, row.wrong, row.unattempted, row.total)} /></td>
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
        <div className="ug-field-grid"><label><span>PI scenario %</span><input type="number" min="0" max="100" step="1" value={candidate.piPerformancePercent ?? ""} onChange={(event) => number("piPerformancePercent", event.target.value)} /></label></div>
      </fieldset>

      <button className="ug-submit" type="submit" disabled={props.busy || candidate.targetProgrammes.length === 0}>{props.busy ? "Calculating…" : "Analyse my profile"}</button>
    </form>
  );
}
