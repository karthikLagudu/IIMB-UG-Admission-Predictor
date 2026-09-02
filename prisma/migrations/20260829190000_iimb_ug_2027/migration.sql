-- Standalone IIM Bangalore UG 2027–31 domain. Existing CAT/MBA tables are unchanged.
CREATE TABLE "IimbUgPolicy" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "admissionCycle" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "effectiveYear" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "verifiedDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IimbUgPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IimbUgRuntimeDataset" (
    "id" TEXT NOT NULL,
    "iimbUgPolicyId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3),
    "verifiedDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IimbUgRuntimeDataset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IimbUgHistoricalCycle" (
    "id" TEXT NOT NULL,
    "iimbUgPolicyId" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "verifiedDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IimbUgHistoricalCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IimbUgPredictionRun" (
    "id" TEXT NOT NULL,
    "iimbUgPolicyId" TEXT NOT NULL,
    "iimbUgRuntimeDatasetId" TEXT,
    "policyVersion" TEXT NOT NULL,
    "runtimeVersion" TEXT,
    "calculationMode" TEXT NOT NULL,
    "candidateInputs" JSONB NOT NULL,
    "policySnapshot" JSONB NOT NULL,
    "runtimeSnapshot" JSONB NOT NULL,
    "resultSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IimbUgPredictionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IimbUgSource" (
    "id" TEXT NOT NULL,
    "iimbUgPolicyId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cycle" TEXT,
    "sourceType" TEXT NOT NULL,
    "verifiedDate" TIMESTAMP(3) NOT NULL,
    "supports" JSONB NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IimbUgSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IimbUgPolicy_version_key" ON "IimbUgPolicy"("version");
CREATE INDEX "IimbUgPolicy_active_updatedAt_idx" ON "IimbUgPolicy"("active", "updatedAt");
CREATE INDEX "IimbUgPolicy_policyId_idx" ON "IimbUgPolicy"("policyId");
CREATE UNIQUE INDEX "IimbUgRuntimeDataset_version_key" ON "IimbUgRuntimeDataset"("version");
CREATE INDEX "IimbUgRuntimeDataset_iimbUgPolicyId_active_idx" ON "IimbUgRuntimeDataset"("iimbUgPolicyId", "active");
CREATE UNIQUE INDEX "IimbUgHistoricalCycle_iimbUgPolicyId_cycle_key" ON "IimbUgHistoricalCycle"("iimbUgPolicyId", "cycle");
CREATE INDEX "IimbUgPredictionRun_policyVersion_createdAt_idx" ON "IimbUgPredictionRun"("policyVersion", "createdAt");
CREATE UNIQUE INDEX "IimbUgSource_iimbUgPolicyId_sourceKey_key" ON "IimbUgSource"("iimbUgPolicyId", "sourceKey");

ALTER TABLE "IimbUgRuntimeDataset" ADD CONSTRAINT "IimbUgRuntimeDataset_iimbUgPolicyId_fkey" FOREIGN KEY ("iimbUgPolicyId") REFERENCES "IimbUgPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IimbUgHistoricalCycle" ADD CONSTRAINT "IimbUgHistoricalCycle_iimbUgPolicyId_fkey" FOREIGN KEY ("iimbUgPolicyId") REFERENCES "IimbUgPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IimbUgPredictionRun" ADD CONSTRAINT "IimbUgPredictionRun_iimbUgPolicyId_fkey" FOREIGN KEY ("iimbUgPolicyId") REFERENCES "IimbUgPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IimbUgPredictionRun" ADD CONSTRAINT "IimbUgPredictionRun_iimbUgRuntimeDatasetId_fkey" FOREIGN KEY ("iimbUgRuntimeDatasetId") REFERENCES "IimbUgRuntimeDataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IimbUgSource" ADD CONSTRAINT "IimbUgSource_iimbUgPolicyId_fkey" FOREIGN KEY ("iimbUgPolicyId") REFERENCES "IimbUgPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
