"use client";

import * as Slider from "@radix-ui/react-slider";
import { useMemo, useState } from "react";
import type { CandidateInput, IimaPolicyConfig } from "@/types/iima";
import { predictIimaAdmission } from "@/lib/iima";
import { formatProbability, formatScore } from "@/lib/utils";

export function ScenarioSimulator({
  candidate,
  policy,
}: {
  candidate: CandidateInput;
  policy: IimaPolicyConfig;
}) {
  const [cat, setCat] = useState(candidate.catOverallScaledScore);
  const [pi, setPi] = useState(candidate.normalizedPi ?? 0.7);
  const [awt, setAwt] = useState(candidate.normalizedAwt ?? 0.7);
  const result = useMemo(
    () => predictIimaAdmission({ ...candidate, catOverallScaledScore: cat, normalizedPi: pi, normalizedAwt: awt }, policy),
    [awt, candidate, cat, pi, policy],
  );

  const controls = [
    { label: "CAT scaled score", value: cat, set: setCat, min: 0, max: 204, step: 1, digits: 0 },
    { label: "Normalized PI", value: pi, set: setPi, min: 0, max: 1.5, step: 0.01, digits: 2 },
    { label: "Normalized AWT", value: awt, set: setAwt, min: 0, max: 1.5, step: 0.01, digits: 2 },
  ];

  return (
    <section className="panel scenario-panel" aria-labelledby="scenario-heading">
      <div className="section-heading">
        <div>
          <h3 id="scenario-heading">Live scenario simulator</h3>
          <p>Academic history stays immutable. Adjust only CAT, PI and AWT.</p>
        </div>
      </div>
      <div className="slider-grid">
        {controls.map((control) => (
          <div key={control.label}>
            <div className="slider-label"><span>{control.label}</span><strong>{control.value.toFixed(control.digits)}</strong></div>
            <Slider.Root
              className="slider-root"
              value={[control.value]}
              onValueChange={([value]) => control.set(value)}
              min={control.min}
              max={control.max}
              step={control.step}
              aria-label={control.label}
            >
              <Slider.Track className="slider-track"><Slider.Range className="slider-range" /></Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
          </div>
        ))}
      </div>
      <div className="scenario-summary" aria-live="polite">
        <span>Scenario FCS <strong>{formatScore(result.finalSelection?.finalCompositeScore)}</strong></span>
        <span>Seat probability <strong>{formatProbability(result.finalSelection?.seatProbability)}</strong></span>
        <span>Prediction <strong>{result.finalSelection?.predictionBand.replaceAll("_", " ") ?? "No final model"}</strong></span>
      </div>
    </section>
  );
}
