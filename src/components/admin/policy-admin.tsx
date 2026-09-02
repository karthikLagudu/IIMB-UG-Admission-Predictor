"use client";

import { useState } from "react";
import type { IimaPolicyConfig } from "@/types/iima";
import { ACADEMIC_CATEGORY_LABELS } from "@/lib/iima/academic-category";

interface VersionRow {
  id: string;
  policyVersion: string;
  name: string;
  catYear: number;
  active: boolean;
  verifiedDate: string;
  updatedAt: string;
}

export function PolicyAdmin({ defaultPolicy }: { defaultPolicy: IimaPolicyConfig }) {
  const [token, setToken] = useState("");
  const [configText, setConfigText] = useState(JSON.stringify(defaultPolicy, null, 2));
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [status, setStatus] = useState("Enter the ADMIN_TOKEN to load stored policy versions.");
  const [busy, setBusy] = useState(false);
  const [degreeName, setDegreeName] = useState("");
  const [degreeCategory, setDegreeCategory] = useState<keyof typeof ACADEMIC_CATEGORY_LABELS>("AC_4");
  const [mappings, setMappings] = useState<Array<{ id: string; degreeName: string; academicCategory: { code: string } }>>([]);

  const request = async (method: "GET" | "POST") => {
    setBusy(true);
    setStatus(method === "GET" ? "Loading…" : "Validating and saving…");
    try {
      const body = method === "POST" ? JSON.stringify({ config: JSON.parse(configText), activate: true }) : undefined;
      const response = await fetch("/api/iima/policy", {
        method,
        headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
        body,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed.");
      if (method === "GET") {
        setConfigText(JSON.stringify(payload.activePolicy, null, 2));
        setVersions(payload.versions);
        setStatus(payload.versions.length ? "Active database policy loaded." : "Database is not configured; showing bundled fallback policy.");
        const mappingResponse = await fetch("/api/iima/degree-mappings", { headers: { authorization: `Bearer ${token}` } });
        if (mappingResponse.ok) setMappings((await mappingResponse.json()).mappings);
      } else {
        setStatus(`Saved ${payload.saved.policyVersion}${payload.saved.active ? " and made it active" : ""}.`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveDegreeMapping = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/iima/degree-mappings", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ degreeName, academicCategory: degreeCategory, aliases: [] }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Mapping save failed.");
      setStatus(`Saved ${degreeName} → ${ACADEMIC_CATEGORY_LABELS[degreeCategory]}.`);
      setDegreeName("");
      const refreshed = await fetch("/api/iima/degree-mappings", { headers: { authorization: `Bearer ${token}` } });
      if (refreshed.ok) setMappings((await refreshed.json()).mappings);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Mapping save failed.");
    } finally {
      setBusy(false);
    }
  };

  const updateModelField = (field: "safetyMargin" | "logisticSlope", value: number) => {
    try {
      const config = JSON.parse(configText) as IimaPolicyConfig;
      config.model[field] = value;
      setConfigText(JSON.stringify(config, null, 2));
    } catch {
      setStatus("Fix the JSON before using the quick controls.");
    }
  };
  const updateModelWeight = (index: number, value: number) => {
    try {
      const config = JSON.parse(configText) as IimaPolicyConfig;
      config.model.benchmarkRecencyWeights[index] = value;
      setConfigText(JSON.stringify(config, null, 2));
    } catch {
      setStatus("Fix the JSON before using the quick controls.");
    }
  };
  let parsed: IimaPolicyConfig | null = null;
  try { parsed = JSON.parse(configText) as IimaPolicyConfig; } catch { parsed = null; }

  return (
    <div className="admin-grid">
      <section className="panel admin-card">
        <h2>Authorization & versions</h2>
        <p>Admin writes require a bearer token and PostgreSQL. Saving a version never rewrites old run snapshots.</p>
        <div className="field"><label htmlFor="admin-token">ADMIN_TOKEN</label><input id="admin-token" type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} /></div>
        <div className="form-actions"><button type="button" className="primary-button" disabled={busy || !token} onClick={() => request("GET")}>Load configuration</button></div>
        <div className="notice" role="status" style={{ marginTop: 14 }}>{status}</div>
        <h2 style={{ marginTop: 24 }}>Quick model controls</h2>
        <div className="field-grid">
          <div className="field"><label htmlFor="safety-margin">Safety margin</label><input id="safety-margin" type="number" min="0" max="1" step="0.001" value={parsed?.model.safetyMargin ?? ""} onChange={(event) => updateModelField("safetyMargin", Number(event.target.value))} /></div>
          <div className="field"><label htmlFor="logistic-slope">Logistic slope</label><input id="logistic-slope" type="number" min="0.1" max="500" step="0.1" value={parsed?.model.logisticSlope ?? ""} onChange={(event) => updateModelField("logisticSlope", Number(event.target.value))} /></div>
          {["2025–27 weight", "2024–26 weight", "2023–25 weight"].map((label, index) => <div className="field" key={label}><label htmlFor={`benchmark-weight-${index}`}>{label}</label><input id={`benchmark-weight-${index}`} type="number" min="0" max="1" step="0.05" value={parsed?.model.benchmarkRecencyWeights[index] ?? ""} onChange={(event) => updateModelWeight(index, Number(event.target.value))} /></div>)}
        </div>
        <p className="microcopy">Weights are normalized automatically by the model and must include at least one positive value.</p>
        <div className="version-list">
          {versions.map((version) => <div className="version-item" key={version.id}><strong>{version.policyVersion}{version.active ? " · ACTIVE" : ""}</strong><span>{version.name} · CAT {version.catYear} · updated {new Date(version.updatedAt).toLocaleString()}</span></div>)}
        </div>
        <h2 style={{ marginTop: 24 }}>Degree → Academic Category</h2>
        <p>Mappings assist administrators; ambiguous student degrees still require explicit confirmation.</p>
        <div className="field-grid">
          <div className="field field-full"><label htmlFor="mapping-degree">Degree name</label><input id="mapping-degree" value={degreeName} onChange={(event) => setDegreeName(event.target.value)} placeholder="e.g. Bachelor of Architecture" /></div>
          <div className="field field-full"><label htmlFor="mapping-category">Academic Category</label><select id="mapping-category" value={degreeCategory} onChange={(event) => setDegreeCategory(event.target.value as keyof typeof ACADEMIC_CATEGORY_LABELS)}>{Object.entries(ACADEMIC_CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        </div>
        <div className="form-actions"><button type="button" className="primary-button" disabled={busy || !token || degreeName.trim().length < 2} onClick={saveDegreeMapping}>Save mapping</button></div>
        <div className="version-list">{mappings.slice(0, 12).map((mapping) => <div className="version-item" key={mapping.id}><strong>{mapping.degreeName}</strong><span>{mapping.academicCategory.code.replaceAll("_", "-")}</span></div>)}</div>
      </section>
      <section className="panel admin-card">
        <h2>Complete versioned policy</h2>
        <p>All rule groups include effective year, source, source type, verification date and notes in the metadata register.</p>
        <label htmlFor="policy-json" className="sr-only">Policy JSON</label>
        <textarea id="policy-json" className="json-editor" spellCheck={false} value={configText} onChange={(event) => setConfigText(event.target.value)} />
        <div className="form-actions"><button type="button" className="primary-button" disabled={busy || !token} onClick={() => request("POST")}>Validate, save & activate version</button></div>
      </section>
    </div>
  );
}
