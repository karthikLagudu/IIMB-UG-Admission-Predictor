# IIMB UG Admission Predictor

Standalone Next.js application for IIM Bangalore Undergraduate Admission planning for the 2027-31 cycle.

It covers eligibility gates, UG Admission Test scoring, historical benchmark context, transparent Pre-PI and Post-PI planning, programme preferences, source provenance, and explicit `DATA_REQUIRED` states where official current-cycle data is not public.

## Run Locally

Prerequisites: Node.js 20+, pnpm, and Docker Desktop if you want local persistence.

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`.

## API

`POST /api/iimb-ug/predict` accepts a candidate profile and returns source-aware admission planning results.

Protected version APIs are:

- `GET|POST /api/iimb-ug/policy`
- `GET|POST /api/iimb-ug/runtime`

## Source Audit

- `docs/IIMB_UG_2027_POLICY.md`
- `docs/IIMB_UG_FORMULAS.md`
- `docs/IIMB_UG_SOURCES.md`
- `docs/IIMB_UG_ASSUMPTIONS.md`
- `docs/IIMB_UG_TEST_CASES.md`
