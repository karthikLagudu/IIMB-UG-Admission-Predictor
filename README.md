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

## Deployment

The app is configured for GitHub Pages through `.github/workflows/deploy-pages.yml`.

This repository intentionally uses bundled policy/runtime data only. There is no database or server API required.
