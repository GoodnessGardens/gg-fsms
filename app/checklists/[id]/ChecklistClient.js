"use client";
import { useState } from "react";

export default function ChecklistClient({ id, items, itemsEn, defaultSite, strings }) {
  const T = strings;
  const [results, setResults] = useState(items.map(() => ({ status: "", note: "" })));
  const [site, setSite] = useState(defaultSite);
  const [shift, setShift] = useState("");
  const [unit, setUnit] = useState("");
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const complete = results.every((r) => r.status !== "");
  const set = (i, patch) => setResults(results.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function submit() {
    setBusy(true); setErr("");
    const r = await fetch("/api/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, site, shift, unit, results: results.map((r, i) => ({ item: itemsEn[i], ...r })) }),
    });
    const data = await r.json();
    if (r.ok) setDone(data);
    else { setErr(data.error || "Failed"); setBusy(false); }
  }

  if (done) {
    return (
      <div className="card">
        <h2>✅ {T.submitted}</h2>
        {done.hasIssues && <div className="notice"><b>{T.issuesWarn}</b></div>}
        <a className="btn" href="/checklists">{T.back}</a>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row">
        <div><label>{T.site}</label><input value={site} onChange={(e) => setSite(e.target.value)} placeholder="NY, FL, VA, IN, TX, PA" /></div>
        <div><label>{T.shift}</label><input value={shift} onChange={(e) => setShift(e.target.value)} /></div>
        <div><label>{T.unit}</label><input value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
      </div>
      {items.map((item, i) => (
        <div className="cl-item" key={i}>
          <span className="txt">{i + 1}. {item}</span>
          <select value={results[i].status} onChange={(e) => set(i, { status: e.target.value })}>
            <option value="">—</option>
            <option value="ok">{T.ok}</option>
            <option value="action">{T.action}</option>
            <option value="na">{T.na}</option>
          </select>
          {results[i].status === "action" && (
            <input placeholder={T.describeIssue} value={results[i].note}
              onChange={(e) => set(i, { note: e.target.value })} />
          )}
        </div>
      ))}
      {err && <div className="error">{err}</div>}
      <p style={{ marginTop: 14 }}>
        <button disabled={!complete || busy} onClick={submit}>{busy ? T.submitting : T.submit}</button>
      </p>
      {!complete && <p className="muted">{T.markEvery}</p>}
    </div>
  );
}
