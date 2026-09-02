"use client";

import { useState } from "react";
import type { IimbUgPolicyConfig, IimbUgRuntimeData } from "@/types/iimb-ug";

interface PolicyVersion { id: string; version: string; admissionCycle: string; active: boolean; createdAt: string }
interface RuntimeVersion { id: string; version: string; active: boolean; sourceLabel: string; createdAt: string; policy: { version: string } }

export function IimbUgPolicyAdmin({ defaultPolicy, defaultRuntime }: { defaultPolicy: IimbUgPolicyConfig; defaultRuntime: IimbUgRuntimeData }) {
  const [token, setToken] = useState("");
  const [policyText, setPolicyText] = useState(JSON.stringify(defaultPolicy, null, 2));
  const [runtimeText, setRuntimeText] = useState(JSON.stringify(defaultRuntime, null, 2));
  const [policyVersion, setPolicyVersion] = useState(defaultPolicy.version);
  const [policies, setPolicies] = useState<PolicyVersion[]>([]);
  const [runtimes, setRuntimes] = useState<RuntimeVersion[]>([]);
  const [status, setStatus] = useState("Enter the server-side ADMIN_TOKEN to load stored versions.");
  const [busy, setBusy] = useState(false);

  const headers = (hasBody = false) => ({
    authorization: `Bearer ${token}`,
    ...(hasBody ? { "content-type": "application/json" } : {}),
  });

  const load = async () => {
    setBusy(true);
    setStatus("Loading policy and runtime snapshots…");
    try {
      const [policyResponse, runtimeResponse] = await Promise.all([
        fetch("/api/iimb-ug/policy", { headers: headers() }),
        fetch("/api/iimb-ug/runtime", { headers: headers() }),
      ]);
      const [policyPayload, runtimePayload] = await Promise.all([policyResponse.json(), runtimeResponse.json()]);
      if (!policyResponse.ok) throw new Error(policyPayload.error ?? "Policy load failed.");
      if (!runtimeResponse.ok) throw new Error(runtimePayload.error ?? "Runtime load failed.");
      setPolicyText(JSON.stringify(policyPayload.activePolicy, null, 2));
      setRuntimeText(JSON.stringify(runtimePayload.activeRuntime, null, 2));
      setPolicyVersion(policyPayload.activePolicy.version);
      setPolicies(policyPayload.versions);
      setRuntimes(runtimePayload.versions);
      setStatus(policyPayload.versions.length ? "Active database snapshots loaded." : "No database is configured; showing the bundled policy and explicit empty runtime dataset.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setBusy(false);
    }
  };

  const savePolicy = async () => {
    setBusy(true);
    setStatus("Validating and saving a new immutable policy version…");
    try {
      const response = await fetch("/api/iimb-ug/policy", {
        method: "POST", headers: headers(true), body: JSON.stringify({ config: JSON.parse(policyText), activate: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Policy save failed.");
      setPolicyVersion(payload.saved.version);
      setStatus(`Saved and activated policy ${payload.saved.version}. Existing prediction snapshots were not changed.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Policy save failed.");
    } finally { setBusy(false); }
  };

  const saveRuntime = async () => {
    setBusy(true);
    setStatus("Validating and saving a new immutable runtime version…");
    try {
      const response = await fetch("/api/iimb-ug/runtime", {
        method: "POST", headers: headers(true), body: JSON.stringify({ data: JSON.parse(runtimeText), policyVersion, activate: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Runtime save failed.");
      setStatus(`Saved and activated runtime ${payload.saved.version}. Missing fields remain DATA_REQUIRED.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Runtime save failed.");
    } finally { setBusy(false); }
  };

  const setQuickRuntimeField = (path: "callBenchmark" | "finalBenchmark", value: string) => {
    try {
      const runtime = JSON.parse(runtimeText) as IimbUgRuntimeData;
      runtime[path] = value === "" ? undefined : { ...(runtime[path] ?? {}), GENERAL: Number(value) };
      setRuntimeText(JSON.stringify(runtime, null, 2));
    } catch { setStatus("Fix the runtime JSON before using quick controls."); }
  };
  let parsedRuntime: IimbUgRuntimeData | null = null;
  try { parsedRuntime = JSON.parse(runtimeText) as IimbUgRuntimeData; } catch { parsedRuntime = null; }

  return (
    <div className="ug-admin-grid">
      <section className="ug-panel">
        <div className="ug-panel-heading"><div><span>Protected access</span><h2>Version controls</h2></div></div>
        <p className="ug-panel-note">The token is sent only in the Authorization header. Every save requires a new version and never overwrites historical prediction snapshots.</p>
        <label className="ug-admin-field"><span>ADMIN_TOKEN</span><input type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" /></label>
        <button className="ug-submit ug-admin-button" type="button" disabled={!token || busy} onClick={load}>Load configuration</button>
        <div className="ug-admin-status" role="status">{status}</div>
        <h3>Quick runtime fields</h3>
        <div className="ug-field-grid"><label className="ug-admin-field"><span>General current PI-call benchmark</span><input type="number" min="0" max="100" step="0.01" value={parsedRuntime?.callBenchmark?.GENERAL ?? ""} onChange={(event) => setQuickRuntimeField("callBenchmark", event.target.value)} placeholder="Data required" /></label><label className="ug-admin-field"><span>General final benchmark</span><input type="number" min="0" max="100" step="0.01" value={parsedRuntime?.finalBenchmark?.GENERAL ?? ""} onChange={(event) => setQuickRuntimeField("finalBenchmark", event.target.value)} placeholder="Data required" /></label></div>
        <h3>Stored policy versions</h3><div className="ug-admin-versions">{policies.map((item) => <div key={item.id}><strong>{item.version}{item.active ? " · ACTIVE" : ""}</strong><span>{item.admissionCycle} · {new Date(item.createdAt).toLocaleString()}</span></div>)}</div>
        <h3>Stored runtime versions</h3><div className="ug-admin-versions">{runtimes.map((item) => <div key={item.id}><strong>{item.version}{item.active ? " · ACTIVE" : ""}</strong><span>{item.policy.version} · {item.sourceLabel}</span></div>)}</div>
      </section>
      <section className="ug-admin-editors">
        <article className="ug-panel"><div className="ug-panel-heading"><div><span>Official rule snapshot</span><h2>Policy JSON</h2></div></div><label className="sr-only" htmlFor="ug-policy-json">IIMB UG policy JSON</label><textarea id="ug-policy-json" className="ug-json-editor" value={policyText} onChange={(event) => setPolicyText(event.target.value)} spellCheck={false} /><button className="ug-submit ug-admin-button" type="button" disabled={!token || busy} onClick={savePolicy}>Validate, save & activate new policy</button></article>
        <article className="ug-panel"><div className="ug-panel-heading"><div><span>Current-cycle observations</span><h2>Runtime JSON</h2></div></div><label className="ug-admin-field"><span>Attach to policy version</span><input value={policyVersion} onChange={(event) => setPolicyVersion(event.target.value)} /></label><label className="sr-only" htmlFor="ug-runtime-json">IIMB UG runtime JSON</label><textarea id="ug-runtime-json" className="ug-json-editor ug-runtime-editor" value={runtimeText} onChange={(event) => setRuntimeText(event.target.value)} spellCheck={false} /><button className="ug-submit ug-admin-button" type="button" disabled={!token || busy} onClick={saveRuntime}>Validate, save & activate new runtime</button></article>
      </section>
    </div>
  );
}
