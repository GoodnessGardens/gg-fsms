"use client";
import { useState } from "react";

// Root-cause factor checkboxes — mirrors the paper Incident Report's RCA table
const FACTOR_GROUPS = [
  ["Performance", "Employee — Performance", ["Not following Safety Policy", "Rushing", "Lack of practice", "Improper risk taken / poor judgement / hazard analysis"]],
  ["Environment", "Environment — Work Area", ["Slippery surface", "Uneven surface", "Untidy area"]],
  ["Equipment", "Equipment — Machinery / Tools", ["Malfunction", "Improper use", "Moving vehicle", "Lack of necessary PPE"]],
  ["Management", "Management — Training and processes", ["Training not provided", "Lack of policy", "No enforcement or communication", "Training was insufficient or inadequate"]],
];
const ACTION_TYPES = [
  "Training / Retraining",
  "Procedure / Process change",
  "Equipment / Engineering fix",
  "Maintenance / Repair",
  "PPE",
  "Coaching / Discipline",
  "Communication / Signage",
  "Other",
];
const isClosed = (st) => ["closed", "completed", "verified"].includes(st);
// Auto-created entries (investigation + refresher) don't count as the real corrective action
const isAuto = (c) => c.action.startsWith("Investigate incident #") || c.action.startsWith("Training refresher");

const DEPT_COURSE = {
  Receiving: "GG-SAF-001", Inventory: "GG-SAF-002", "Quality Control": "GG-SAF-003", Packing: "GG-SAF-004",
  Shipping: "GG-SAF-005", Greenhouse: "GG-SAF-006", Maintenance: "GG-SAF-007", "Drivers / Transportation": "GG-SAF-008",
};

// Suggested corrective actions / training refreshers based on the incident
function suggestions(type, dept) {
  const course = DEPT_COURSE[dept];
  const s = [];
  if (course) s.push(`Training refresher: involved employee(s) retake ${course} (${dept} safety program) within 14 days`);
  if (type === "Injury" || type === "Illness")
    s.push(
      "Re-train involved employee(s) on the specific task procedure involved in this incident",
      "PPE check: verify required PPE is available, in good condition, and being worn at this station"
    );
  if (type === "Vehicle")
    s.push("Driver safety refresher: retake GG-SAF-008 and review backing, spotter, and defensive-driving procedures");
  if (type === "Chemical") {
    s.push("HazCom refresher: review the SDS for the chemical involved and re-train on handling and spill response");
    if (dept === "Greenhouse") s.push("Verify EPA WPS pesticide training is current for all handlers in this area");
  }
  if (type === "Near Miss" || type === "Accident")
    s.push("Inspect and correct the physical hazard identified (guarding, surface, lighting, signage, housekeeping)");
  if (type === "Non-Accident")
    s.push("Review the relevant company policy with the involved employee(s) and document the conversation");
  s.push("Toolbox talk: review this incident and its lessons with the whole crew at the next shift huddle");
  return s;
}

async function post(body) {
  const r = await fetch(`/api/incidents/${body.incidentId}/actions`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed");
  window.location.reload();
}

export default function InvestigateClient({ incidentId, status, rca, cas, witnesses, incidentType, incidentDept }) {
  const [whys, setWhys] = useState(rca?.whys?.length ? rca.whys : ["", "", "", "", ""]);
  const [problem, setProblem] = useState(rca?.problem || "");
  const [roots, setRoots] = useState(rca?.root_causes || "");
  const [factors, setFactors] = useState(rca?.factors || {});
  const [ca, setCa] = useState({ action: "", hierarchy: "Training / Retraining", owner: "", due_date: "" });
  const [wit, setWit] = useState({ witness_name: "", statement: "" });
  const [err, setErr] = useState("");

  const wrap = (fn) => async () => { setErr(""); try { await fn(); } catch (e) { setErr(e.message); } };
  const rcaDone = !!rca && (rca.root_causes || "").trim().length > 0;
  const openCAs = cas.filter((c) => !isClosed(c.status));
  const hasManual = cas.some((c) => !isAuto(c));
  const canClose = rcaDone && hasManual && openCAs.length === 0;
  const due14 = () => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const toggle = (group, opt) => {
    const cur = factors[group] || [];
    setFactors({ ...factors, [group]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] });
  };

  return (
    <div>
      {err && <div className="error">{err}</div>}

      {/* STEP 1 — Root Cause Analysis */}
      <div className="card">
        <h2>Step 1 — Root Cause Analysis {rcaDone ? <span className="pill good">Complete</span> : <span className="pill warn">Required first</span>}</h2>
        <label>Problem statement (direct cause)</label>
        <input value={problem} onChange={(e) => setProblem(e.target.value)} />
        {whys.map((w, i) => (
          <div key={i}>
            <label>Why {i + 1}{i === 4 ? " (continue until management-controllable)" : ""}</label>
            <input value={w} onChange={(e) => setWhys(whys.map((x, j) => (j === i ? e.target.value : x)))} />
          </div>
        ))}
        <h3 style={{ marginTop: 12 }}>Contributing factors (check all that apply)</h3>
        {FACTOR_GROUPS.map(([key, title, opts]) => (
          <div key={key} style={{ border: "1px solid #e0ddcf", borderRadius: 8, padding: "8px 12px", margin: "8px 0" }}>
            <b>{title}</b>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 4, marginTop: 4 }}>
              {opts.map((o) => (
                <label key={o} style={{ fontWeight: "normal", display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" style={{ width: "auto", margin: 0 }}
                    checked={(factors[key] || []).includes(o)} onChange={() => toggle(key, o)} />
                  {o}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Other:</span>
              <input style={{ margin: 0 }} value={factors[`${key}Other`] || ""}
                onChange={(e) => setFactors({ ...factors, [`${key}Other`]: e.target.value })} />
            </div>
          </div>
        ))}
        <label>Root cause(s) identified *</label>
        <textarea rows={2} value={roots} onChange={(e) => setRoots(e.target.value)} />
        <p className="muted">&apos;Employee error&apos; and &apos;didn&apos;t follow procedure&apos; are never final answers — was the procedure known, trained, practical, enforced?</p>
        <button onClick={wrap(() => post({ incidentId, kind: "rca", problem, whys, root_causes: roots, factors }))}>
          {rca ? "Update RCA" : "Save RCA"}
        </button>
      </div>

      {/* STEP 2 — Corrective / Preventative Action Plan */}
      <div className="card">
        <h2>Step 2 — Corrective Action Plan {cas.length > 0 && openCAs.length === 0 ? <span className="pill good">All closed</span> : <span className="pill warn">{openCAs.length} in progress</span>}</h2>
        <p className="muted">Every root cause needs at least one corrective action. An investigation action is opened automatically when the incident is reported.</p>
        <table>
          <thead><tr><th>Action</th><th>Type</th><th>Owner</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {cas.map((c) => (
              <tr key={c.id}>
                <td>{c.action}</td><td>{c.hierarchy}</td><td>{c.owner}</td><td>{c.due_date}</td>
                <td>{isClosed(c.status) ? <span className="pill good">Closed</span> : <span className="pill warn">In Progress</span>}</td>
                <td>
                  {!isClosed(c.status) && (
                    <button className="secondary" disabled={!rcaDone || !hasManual}
                      title={!rcaDone ? "Complete the RCA first" : !hasManual ? "Add your corrective action first" : ""}
                      onClick={wrap(() => post({ incidentId, kind: "ca-status", caId: c.id, status: "closed" }))}>Close action</button>
                  )}
                  {isClosed(c.status) && status !== "closed" && (
                    <button className="secondary" onClick={wrap(() => post({ incidentId, kind: "ca-status", caId: c.id, status: "open" }))}>Reopen</button>
                  )}
                </td>
              </tr>
            ))}
            {cas.length === 0 && <tr><td colSpan={6}>No corrective actions yet.</td></tr>}
          </tbody>
        </table>
        {!rcaDone && <div className="notice">Complete and save the Root Cause Analysis (Step 1) before closing corrective actions.</div>}
        {rcaDone && !hasManual && (
          <div className="notice">
            <b>Add at least one corrective action of your own before anything can be closed.</b> The auto-created
            investigation and refresher entries don&apos;t count — every root cause needs a real fix.
          </div>
        )}

        <h3 style={{ marginTop: 14 }}>Suggested actions for this incident ({incidentType} — {incidentDept})</h3>
        <p className="muted">Click one to fill in the form below, then adjust the owner and due date.</p>
        <ul style={{ margin: "6px 0 12px 22px" }}>
          {suggestions(incidentType, incidentDept).map((sg) => (
            <li key={sg} style={{ marginBottom: 6 }}>
              <a href="" onClick={(e) => { e.preventDefault(); setCa({ ...ca, action: sg, owner: ca.owner || "Supervisor", due_date: ca.due_date || due14() }); }}>
                {sg}
              </a>
            </li>
          ))}
        </ul>

        <h3 style={{ marginTop: 14 }}>Add corrective action</h3>
        <label>Action (SMART — specific, measurable, owned, realistic, time-bound)</label>
        <input value={ca.action} onChange={(e) => setCa({ ...ca, action: e.target.value })} />
        <div className="row">
          <div><label>Action type</label>
            <select value={ca.hierarchy} onChange={(e) => setCa({ ...ca, hierarchy: e.target.value })}>
              {ACTION_TYPES.map((h) => <option key={h}>{h}</option>)}
            </select></div>
          <div><label>Owner</label><input value={ca.owner} onChange={(e) => setCa({ ...ca, owner: e.target.value })} /></div>
          <div><label>Due date</label><input type="date" value={ca.due_date} onChange={(e) => setCa({ ...ca, due_date: e.target.value })} /></div>
        </div>
        <button disabled={!ca.action || !ca.owner || !ca.due_date}
          onClick={wrap(() => post({ incidentId, kind: "ca", ...ca }))}>Add Action</button>
      </div>

      <div className="card">
        <h2>Witness Statements</h2>
        {witnesses.map((w) => (
          <div className="q" key={w.id}><b>{w.witness_name}</b> — {new Date(w.created_at).toLocaleString()}<br />{w.statement}</div>
        ))}
        <label>Witness name</label>
        <input value={wit.witness_name} onChange={(e) => setWit({ ...wit, witness_name: e.target.value })} />
        <label>Statement (witness&apos;s own words; interview individually &amp; in private)</label>
        <textarea rows={3} value={wit.statement} onChange={(e) => setWit({ ...wit, statement: e.target.value })} />
        <button disabled={!wit.witness_name || !wit.statement}
          onClick={wrap(() => post({ incidentId, kind: "witness", ...wit }))}>Add Statement</button>
      </div>

      {/* STEP 3 — Close */}
      <div className="card">
        <h2>Step 3 — Close Incident</h2>
        <p className="muted">
          An incident can close only after the root cause analysis is complete and every corrective action is closed.
          Verify effectiveness 30–90 days after closing.
        </p>
        {status === "open" ? (
          <>
            {!canClose && (
              <div className="notice">
                {!rcaDone && <>• Root cause analysis not complete.<br /></>}
                {!hasManual && <>• No corrective action added yet (auto-created entries don&apos;t count).<br /></>}
                {openCAs.length > 0 && <>• {openCAs.length} corrective action(s) still in progress.</>}
              </div>
            )}
            <button disabled={!canClose} onClick={wrap(() => post({ incidentId, kind: "close" }))}>Close Incident</button>
          </>
        ) : (
          <button className="secondary" onClick={wrap(() => post({ incidentId, kind: "reopen" }))}>Reopen</button>
        )}
      </div>
    </div>
  );
}
