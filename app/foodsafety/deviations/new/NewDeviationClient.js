"use client";
import { useState } from "react";

const CATEGORIES = [
  "CCP / Critical Limit Failure",
  "Sanitation / Pre-Op Failure",
  "Pest Activity",
  "Foreign Material",
  "Glass / Brittle Plastic Breakage",
  "Allergen / Chemical Control",
  "Water Test Failure",
  "Environmental Monitoring Positive",
  "Supplier / Incoming Goods",
  "Customer Complaint",
  "Temperature / Cold Chain",
  "Mock Recall / Traceability Gap",
  "Other",
];
const SITES = ["NY", "FL", "VA", "IN", "TX", "PA"];

export default function NewDeviationClient({ defaultSite }) {
  const [f, setF] = useState({
    category: "", site: defaultSite, location: "", description: "",
    product: "", lots: "", quantity: "", hold: "", immediate: "", doc_ref: "",
  });
  const [done, setDone] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/incidents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incident_date: new Date().toISOString().slice(0, 16).replace("T", " "),
        type: "FS Deviation",
        department: "Food Safety",
        site: f.site,
        location: f.location,
        description: f.description,
        immediate_actions: f.immediate,
        details: { category: f.category, product: f.product, lots: f.lots, quantity: f.quantity, hold: f.hold, doc_ref: f.doc_ref },
      }),
    });
    const data = await r.json();
    if (r.ok) setDone(data);
    else { setErr(data.error || "Failed"); setBusy(false); }
  }

  if (done) {
    return (
      <div className="card">
        <h2>✅ Deviation recorded (#{done.id})</h2>
        <div className="notice">
          A CAPA was automatically opened and assigned to the FSQA Manager (per 1.03.03), and a root cause analysis
          was opened — complete it before closing.
        </div>
        <p>
          <a className="btn" href={`/incidents/${done.id}`}>Open RCA &amp; CAPA →</a>{" "}
          <a className="btn secondary" href="/foodsafety/deviations">Back to Deviations</a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <h1>Report FS Deviation / Non-Conformance</h1>
      <div className="notice">
        Per 1.03.03 — Corrective Action and Non-Conformance Procedure. Hold and segregate affected product first;
        only QA disposition releases product.
      </div>
      <form className="card" onSubmit={submit}>
        <div className="row">
          <div>
            <label>Category *</label>
            <select value={f.category} onChange={set("category")} required>
              <option value="">—</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Site *</label>
            <select value={f.site} onChange={set("site")} required>
              <option value="">—</option>
              {SITES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div><label>Area / line / room</label><input value={f.location} onChange={set("location")} /></div>
        </div>
        <label>Description of the deviation *</label>
        <textarea rows={4} value={f.description} onChange={set("description")} required />
        <div className="row">
          <div><label>Product affected</label><input value={f.product} onChange={set("product")} /></div>
          <div><label>Lot number(s) / TLC</label><input value={f.lots} onChange={set("lots")} /></div>
          <div><label>Quantity affected</label><input value={f.quantity} onChange={set("quantity")} /></div>
        </div>
        <div className="row">
          <div>
            <label>Product placed on hold?</label>
            <select value={f.hold} onChange={set("hold")}>
              <option value="">—</option><option>Yes</option><option>No</option><option>N/A — no product affected</option>
            </select>
          </div>
          <div><label>Related SOP / doc number</label><input value={f.doc_ref} onChange={set("doc_ref")} placeholder="e.g. 5.09.02" /></div>
        </div>
        <label>Immediate action taken</label>
        <textarea rows={2} value={f.immediate} onChange={set("immediate")} />
        {err && <div className="error">{err}</div>}
        <button disabled={busy}>{busy ? "…" : "Submit Deviation"}</button>
      </form>
    </div>
  );
}
