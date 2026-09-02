# IIM Bangalore UG Admissions Policy — 2027–31

Policy ID: `IIMB-UG-2027-31-v1.0.0`  
Exam year: 2026  
Admission year: 2027  
Programmes: B.Sc. (Honours) in Data Sciences and B.Sc. (Honours) in Economics

This document is the implementation contract for the standalone IIMB UG predictor. It is deliberately separate from the repository's CAT/IIMA/IIMB PGP engines. The system calculates a rule exactly only when the current UG material supplies the rule. Historical values remain historical, planning transformations are labelled, and unavailable quantities produce `DATA_REQUIRED`.

## Source hierarchy

1. Current-cycle IIMB UG Admissions Procedure for 2027–31.
2. Current-cycle IIMB UG Admissions FAQ for the 2027 batch.
3. Current IIMB UG admissions dates page.
4. Historical IIMB UG materials, used only for historical context.
5. IIMB PGP standardisation formula, used only as an explicitly labelled analogue.
6. Transparent mathematical derivations and planning assumptions.

Every score component carries a `SourceType`. Missing current thresholds, normalization statistics, gender-diversity definitions, percentile maps, programme closing scores, and applicant-pool data are never replaced with fabricated numbers.

## Programmes and preferences

Both programmes are four-year, full-time residential degrees. The published intake metadata is 40 places in Data Sciences and 40 in Economics; intake is not used to manufacture admission probability. A candidate may apply to either programme or both. For both, the first and second preference must be distinct. Programme allocation is kept separate from score calculation and returns `DATA_REQUIRED` until programme-level closing scores and allocation data exist.

## Current dates

- Applications open: 17 August 2026.
- Applications close: 15 October 2026 at 5:00 PM IST.
- UG Admission Test: 15 November 2026, tentative.
- Interviews: second and third week of January 2027, tentative.
- Offers and waitlist: third week of February 2027, tentative.

Dates are stored only in policy configuration.

## Eligibility

### Age

The candidate must be no more than 20 years old on 1 August 2027. Date comparison is exact. A date of birth on or after 2 August 2006 passes; 1 August 2006 fails.

### Academic source conflict

Two current-cycle official documents differ:

- The 2027–31 Admission Procedure requires at least 60% in Class X overall plus Mathematics in Classes XI and XII.
- The 2027 Admissions FAQ requires at least 60% in Class X Mathematics plus Mathematics in Classes XI and XII.

The engine therefore returns both `primaryEligibility` and `alternateEligibility` and marks `sourceConflict: true`. The Admission Procedure interpretation is primary because it is the formal cycle-specific procedure; the FAQ interpretation is preserved alongside it. Neither overwrites the other.

Class XII passed candidates are eligible when the remaining rules pass. Appearing or result-awaited candidates are provisionally eligible; admitted candidates must later submit the required certificate by the published deadline.

## Test structure and marking

- 60 multiple-choice questions in 135 minutes.
- VARC: 15 questions.
- LR: 15 questions.
- QADI: 30 questions.
- Current FAQ confirms one-third negative marking.

The unit scale is `+1` for correct and `-1/3` for wrong. The equivalent canonical scale is `+3` and `-1`, with maxima 45 VARC, 45 LR, 90 QADI, and 180 overall. For `C` correct and `W` wrong:

`unit = C - W/3`

`canonical = 3C - W = 3 × unit`

All three canonical section scores must be strictly greater than zero for first-shortlist consideration. Zero fails. Comparisons use full precision; rounding is display-only.

## Historical first-shortlist benchmark

The formal 2027–31 procedure republishes the UG Test 2025 / batch 2026–30 first-shortlist table:

| Category | QADI percentile floor | Aggregate canonical floor |
|---|---:|---:|
| General | 80 | 114 |
| NC-OBC | 75 | 75 |
| EWS | 75 | 75 |
| SC | 70 | 51 |
| ST | 70 | 50 |
| PwD | 70 | 60 |

The document labels the table as percentile requirements, but aggregate 114 cannot be a percentile. The engine models it as `aggregateCanonicalScoreFloor`, flags the ambiguity, and never presents this historical benchmark as the current cutoff. PwD is horizontal: the base category is preserved while the configurable resolver selects the historical PwD row by default.

## Pre-PI structure

Published weights total 100:

- UG Admission Test: 70 (VARC 20, LR 30, QADI 20).
- Class X overall standardized score: 15.
- Class X Mathematics standardized score: 10.
- Gender diversity: 5.

The public policy does not disclose the exact UG raw-to-weighted transformation or the qualifying-pool means and standard deviations. Three strategies are supported:

- Direct official weighted values, when available.
- Linear raw-score planning: each canonical section score is scaled to its published maximum weight and clamped.
- IIMB-style bounded standardisation, explicitly labelled as a PGP analogue, requiring current UG mean/SD inputs.

Academic planning mode linearly scales percentages to the published weights. Exact mode returns `DATA_REQUIRED` without current UG normalization statistics. If gender-diversity eligibility is unknown, the Pre-PI result is a 5-point range rather than a guessed category mapping. The actual current interview-call benchmark is null by default.

## Post-PI structure

Published weights total 100:

- Class X overall standardized score: 10.
- Class X Mathematics standardized score: 10.
- UG Admission Test: 40.
- Personal Interview: 40.

The test `/40` strategy is configurable: direct official value, total-raw linear planning, rescaling the Pre-PI test contribution, custom runtime transform, or `DATA_REQUIRED`. PI percentage maps linearly to `/40`. The simulator exposes 40% through 100% scenarios and solves the PI needed for a user-selected target, but no default final admission cutoff is invented.

## Probability and allocation

Probability is disabled by default because there is only one completed UG cycle and no defensible calibration dataset. The policy supports a future logistic model only after an administrator supplies verified calibration data. Programme allocation reports preferences now and returns `PROGRAMME_ALLOCATION_DATA_REQUIRED` until closing scores and reservation/allocation inputs are configured.

## Persistence and versioning

Policy changes create a new version. A prediction snapshot stores candidate input, complete policy snapshot, runtime dataset version and snapshot, complete result, and timestamp. Activating a future policy never changes an earlier run.

## Required disclosure

This is an independent admission-planning tool and is not affiliated with or endorsed by the Indian Institute of Management Bangalore.

IIM Bangalore may modify eligibility conditions, examination rules, standardisation procedures, shortlist thresholds, reservation implementation, programme allocation and final admission criteria.

Historical benchmarks and planning estimates do not guarantee an interview or admission.
