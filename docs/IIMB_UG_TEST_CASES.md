# IIMB UG Test Cases

## Unit boundaries

- Age: DOB 2006-08-01 fails; 2006-08-02 and 2007-08-01 pass.
- Academics: Class X overall 59.99 fails primary, 60 passes; missing Mathematics XI or XII fails; alternate FAQ interpretation is tested separately.
- Scoring: 12 correct and 2 wrong gives canonical 34 and unit `11⅓`; both scales remain equivalent.
- Section gate: −1 and 0 fail; 1 passes.
- Historical General: QADI 79.999 fails and 80 passes; aggregate 113.999 fails and 114 passes.
- Historical category/PwD rows: exact NC-OBC/EWS 75/75, SC 70/51, ST 70/50, and PwD 70/60 boundaries pass.
- Pre-PI section maxima sum to 70; total weights sum to 100.
- Standardisation: mean maps to half weight, bounds clamp, and absent or non-positive SD returns data required.
- Post-PI weights sum to 100; PI scenarios and required PI solver cover reachable, unreachable, already-above and missing-data states.
- Preferences reject duplicates and require rankings when both programmes are selected.
- Runtime and exact-mode gaps remain typed data-required states.
- Probability is always disabled.

## API and browser coverage

- Valid prediction request returns all independent result sections.
- Invalid attempt totals return HTTP 422 with field paths.
- Missing admin authentication returns HTTP 401.
- The worked example clears the previous General first-shortlist benchmark but does not claim the current threshold.
- A zero section fails the positive gate.
- An ineligible academic profile reports the exact failed rule.
- Formula provenance, PI slider/presets, programme preferences, source links, readiness, and the disclaimer are visible.
- Layout is checked at 320, 375, 390, 430, 768, 1024, and 1440 CSS pixels with no horizontal document overflow.

Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm test:e2e`.
