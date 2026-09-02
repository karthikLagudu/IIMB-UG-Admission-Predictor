# IIMB UG Admission Predictor

A standalone Next.js application for IIM Bangalore undergraduate admission planning for the 2027-31 cycle.

The app keeps the experience simple: eligibility checks, UG Admission Test scoring, historical benchmark context, Pre-PI analysis, final-score planning, programme preferences, and source-aware notes where official public data is unavailable.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Build

```bash
pnpm build
```

## API

`POST /api/iimb-ug/predict` accepts a candidate profile and returns the admission-planning result.

This repository intentionally uses bundled policy/runtime data only. There is no database setup required.
