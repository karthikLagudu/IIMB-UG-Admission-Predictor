# IIMB UG Assumptions and Uncertainty Register

## Explicit modeling assumptions

- The formal 2027 procedure is the primary eligibility interpretation; the contradictory current FAQ interpretation remains visible.
- The +3/−1 canonical score is exactly three times the confirmed +1/−⅓ unit score.
- The historical table's aggregate field is a canonical raw score because 114 cannot be a percentile.
- Linear raw-to-weighted and percentage-to-weight conversions are transparent planning transformations, not claimed official UG transformations.
- The IIMB PGP bounded mean/SD method is available only as an analogue and requires UG runtime statistics.
- Gender-diversity eligibility is never inferred from a gender label. An unknown selection yields a range.
- PwD defaults to the historical PwD row while retaining the base category. The resolver is policy-configurable.

## Missing current data

- Current first-shortlist thresholds.
- Current Pre-PI interview-call benchmarks.
- UG test and Class X normalization pools, means, and standard deviations.
- Current final-selection benchmark.
- Programme-specific closing scores and allocation data.
- Multi-cycle outcomes sufficient for probability calibration.

## Product behavior

Missing current data is a valid typed domain state, not a server error. Exact mode stops affected components at `DATA_REQUIRED`; planning mode may display an explicitly badged estimate. Historical values never become current values automatically. Probability remains disabled. Each persisted run keeps immutable input, policy, runtime, and result snapshots.
