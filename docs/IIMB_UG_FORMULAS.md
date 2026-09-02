# IIMB UG 2027–31 Formula Reference

All domain calculations live under `src/lib/iimb-ug/2027_31` and are pure TypeScript. Comparisons use full precision; rounding is display-only.

## Raw scores

For `C` correct and `W` wrong answers:

- Unit score: `C − W/3`
- Canonical score: `3C − W`
- Identity: `canonical = 3 × unit`
- Accuracy: `C / (C + W) × 100`; no attempted questions returns no accuracy rather than zero.

Canonical maxima are 45 VARC, 45 LR, 90 QADI, and 180 overall. A first-shortlist section passes only when its canonical score is strictly greater than zero.

## Historical comparison

The previous-cycle threshold resolver selects the candidate's base category or the PwD override according to policy. Passing requires all of:

1. positive VARC, LR, and QADI;
2. QADI percentile at or above the historical floor; and
3. total canonical score at or above the historical aggregate floor.

The aggregate values are modeled as canonical scores because the published General value, 114, cannot be a percentile. This ambiguity is surfaced in every result.

## Pre-PI score

Published weights are test 70, Class X overall 15, Class X Mathematics 10, and gender diversity 5. Test weights split into VARC 20, LR 30, and QADI 20.

Planning-mode section contribution:

`section canonical / section canonical maximum × section weight`

Planning-mode academic contribution:

`reported percentage / 100 × component weight`

The optional IIMB-style analogue is bounded to `[0, weight]`:

`weight/2 + ((value − mean) / standard deviation) × weight/6`

It returns `DATA_REQUIRED` when current UG means or standard deviations are missing. It is an official PGP analogue, not a confirmed UG formula. Unknown gender-diversity eligibility produces a 5-point Pre-PI range.

## Post-PI score

Published weights are Class X overall 10, Class X Mathematics 10, UG Test 40, and PI 40. Planning mode linearly rescales total canonical raw score:

`test40 = total canonical / 180 × 40`

`pi40 = PI performance percentage / 100 × 40`

`final composite = Class X overall + Class X Mathematics + test40 + pi40`

For target `T`, fixed score `F`, and PI weight `W`:

`required PI weighted = T − F`

`required PI percentage = (T − F) / W × 100`

Results distinguish already above target, reachable, unreachable, and data required.

## Planning tools

- Required section score reverses the section scaling formula.
- Score from accuracy uses expected correct and wrong counts for a chosen attempt count.
- Required accuracy algebraically solves the confirmed marking rule.
- Sensitivity compares one canonical raw-mark improvement per section. This is score leverage, not admission probability.

## Probability activation

Probability is intentionally disabled. To activate it responsibly, add multiple verified cycles of category/PwD-specific applicant-pool, shortlist, interview, offer, waitlist, normalization, and programme-allocation observations; document the cohort and missingness; choose and validate a calibration method out of sample; expose uncertainty and calibration diagnostics; version the model and inputs; and preserve all old snapshots. Never infer probability from a single cutoff or seat count.
