"use client";
import { useState } from "react";

const SITES = ["NY", "FL", "VA", "IN", "TX", "PA"];
const STATUS = ["C", "NC", "NA"];
const LABEL = { C: "Compliant", NC: "Non-Compliant", NA: "N/A" };

export default function AuditClient({ modules, history, defaultSite }) {
  const [moduleName, setModuleName] = useState("");
  const [site, setSite] = useState(defaultSite);
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const mod = modules.find((m) => m.name === moduleName);
  const setA = (q, field, value) => setAnswers({ ...answers, [q]: { ...(answers[q] || {}), [field]: value } });
  const answered = mod ? mod.questions.filter((qq) => answers[qq.q]?.status).length : 0;
  const ncCount = mod ? mod.questions.filter((qq) => answers[qq.q]?.status === "NC").length : 0;

  async function submit() {
    setBusy(true); setErr("");
    const r = await fetch("/api/foodsafety", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: moduleName, site, answers, notes }),
    });
    const data = await r.json();
    if (r.ok) setDone(data);
    else { setErr(data.error || "Failed"); setBusy(false); }
  }

  if (done) {
    return (
      <div className="card">
        <h2>✅ Self-audit recorded (#{done.id})</h2>
        <p style={{ fontSize: 20, fontWeight: 700 }}>
          {done.compliant} compliant · {done.noncompliant} non-compliant · {done.na} N/A — {done.pct}%
        </p>
        {done.deviationId && (
          <div className="notice">
            {done.noncompliant} non-compliance(s) were automatically opened as FS Deviation{" "}
            <a href={`/incidents/${done.deviationId}`}>#{done.deviationId}</a> with a CAPA assigned to the FSQA Manager.
          </div>
        )}
        <p>
          <a className="btn" href="/foodsafety/audit">New Audit</a>{" "}
          <a className="btn secondary" href="/foodsafety">FS Home</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Primus Self-Audit</h1>
      <div className="card">
        <div className="row">
          <div>
            <label>Audit module *</label>
            <select value={moduleName} onChange={(e) => { setModuleName(e.target.value); setAnswers({}); }}>
              <option value="">—</option>
              {modules.map((m) => <option key={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label>Site *</label>
            <select value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="">—</option>
              {SITES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
        </div>
      </div>

      {mod && (
        <div className="card">
          <h2>{mod.name} — {mod.questions.length} questions</h2>
          {mod.questions.map((qq) => (
            <div key={qq.q} className="q">
              <div className="stem">{qq.q} — {qq.text}</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                {STATUS.map((st) => (
                  <label key={st} style={{ fontWeight: answers[qq.q]?.status === st ? 700 : 400, display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="radio" name={qq.q} style={{ width: "auto", margin: 0 }}
                      checked={answers[qq.q]?.status === st} onChange={() => setA(qq.q, "status", st)} />
                    {LABEL[st]}
                  </label>
                ))}
                {answers[qq.q]?.status === "NC" && (
                  <input style={{ flex: 1, minWidth: 220, margin: 0 }} placeholder="Finding / evidence (required for NC)"
                    value={answers[qq.q]?.note || ""} onChange={(e) => setA(qq.q, "note", e.target.value)} />
                )}
              </div>
            </div>
          ))}
          <label>Auditor notes</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          {ncCount > 0 && (
            <div className="notice">
              {ncCount} non-compliance(s) will automatically open an FS Deviation with a CAPA on submit.
            </div>
          )}
          {err && <div className="error">{err}</div>}
          <button disabled={busy || !site || answered < mod.questions.length} onClick={submit}>
            {busy ? "…" : answered < mod.questions.length
              ? `Answer all questions (${answered}/${mod.questions.length})`
              : "Submit Self-Audit"}
          </button>
        </div>
      )}

      <div className="card">
        <h2>Audit History</h2>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Module</th><th>Site</th><th>Auditor</th><th>Result</th></tr></thead>
          <tbody>
            {history.map((h) => {
              const total = h.compliant + h.noncompliant;
              const pct = total ? Math.round((h.compliant / total) * 100) : 100;
              return (
                <tr key={h.id}>
                  <td>{h.id}</td>
                  <td>{new Date(h.created_at).toLocaleDateString()}</td>
                  <td>{h.module}</td>
                  <td>{h.site}</td>
                  <td>{h.auditor_name}</td>
                  <td>
                    {h.noncompliant === 0
                      ? <span className="pill good">{pct}% — clean</span>
                      : <span className="pill warn">{pct}% — {h.noncompliant} NC</span>}
                  </td>
                </tr>
              );
            })}
            {history.length === 0 && <tr><td colSpan={6}>No self-audits yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
