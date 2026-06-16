"use client";
import { useState, useMemo } from "react";

const STATUS = ["C", "NC", "NA"];
const LABEL = { C: "Compliant", NC: "Non-Compliant", NA: "N/A" };

export default function AuditClient({ modules, sites, history, defaultSite, readOnly }) {
  const [site, setSite] = useState(sites.some((x) => x.code === defaultSite) ? defaultSite : "");
  const [moduleNo, setModuleNo] = useState("");
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const siteObj = sites.find((x) => x.code === site);
  const availableModules = modules.filter((m) => !siteObj || siteObj.modules.includes(m.module));
  const mod = modules.find((m) => String(m.module) === String(moduleNo));
  const allQuestions = useMemo(() => (mod ? mod.sections.flatMap((s) => s.questions) : []), [mod]);

  const setA = (q, field, value) => setAnswers((p) => ({ ...p, [q]: { ...(p[q] || {}), [field]: value } }));
  const setSectionAll = (sec, status) =>
    setAnswers((p) => { const n = { ...p }; sec.questions.forEach((q) => { n[q.no] = { ...(n[q.no] || {}), status }; }); return n; });

  const answered = allQuestions.filter((q) => answers[q.no]?.status).length;
  const total = allQuestions.length;
  const ncCount = allQuestions.filter((q) => answers[q.no]?.status === "NC").length;

  // Live points-based score preview
  const { earned, possible, autofail } = useMemo(() => {
    let earned = 0, possible = 0, autofail = false;
    for (const q of allQuestions) {
      const st = answers[q.no]?.status;
      if (st === "C") { earned += q.points || 0; possible += q.points || 0; }
      else if (st === "NC") { possible += q.points || 0; if (q.autofail) autofail = true; }
    }
    return { earned, possible, autofail };
  }, [answers, allQuestions]);
  const pct = possible ? Math.round((earned / possible) * 100) : 100;
  const ncMissingNote = allQuestions.some((q) => answers[q.no]?.status === "NC" && !answers[q.no]?.note?.trim());

  async function submit() {
    setBusy(true); setErr("");
    const r = await fetch("/api/foodsafety", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_no: mod.module, site, answers, notes }),
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
          Score {done.pct}% · {done.compliant} compliant · {done.noncompliant} non-conformance · {done.na} N/A
        </p>
        {done.autofail && <div className="error">⚠ An AUTOMATIC-FAILURE question was scored non-compliant. This would fail a PrimusGFS audit — prioritize this CAPA.</div>}
        {done.deviationId && (
          <div className="notice">
            {done.noncompliant} non-conformance(s) were automatically opened as FS Deviation{" "}
            <a href={`/incidents/${done.deviationId}`}>#{done.deviationId}</a> with a CAPA assigned to the FSQA Manager.
          </div>
        )}
        <p>
          <a className="btn" href="/foodsafety/audit">New Audit</a>{" "}
          <a className="btn secondary" href="/dashboard">Dashboard</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>PrimusGFS v4.0 Self-Audit</h1>
      {readOnly && <div className="notice">You are signed in as a read-only auditor. You can review audit history below but cannot submit a new audit.</div>}
      <div className="card">
        <div className="row">
          <div>
            <label>Site *</label>
            <select value={site} onChange={(e) => { setSite(e.target.value); setModuleNo(""); setAnswers({}); }}>
              <option value="">—</option>
              {sites.map((x) => <option key={x.code} value={x.code}>{x.code} — {x.name}</option>)}
            </select>
          </div>
          <div>
            <label>Audit module *</label>
            <select value={moduleNo} onChange={(e) => { setModuleNo(e.target.value); setAnswers({}); }} disabled={!site}>
              <option value="">{site ? "—" : "select a site first"}</option>
              {availableModules.map((m) => <option key={m.module} value={m.module}>Module {m.module} — {m.module_title}</option>)}
            </select>
          </div>
        </div>
        {site && siteObj && (
          <p className="muted" style={{ margin: 0 }}>
            {siteObj.name} is in scope for module{siteObj.modules.length > 1 ? "s" : ""} {siteObj.modules.join(", ")}.
          </p>
        )}
      </div>

      {mod && !readOnly && (
        <>
          <div className="card" style={{ position: "sticky", top: 8, zIndex: 5 }}>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <b>Module {mod.module} — {mod.module_title}</b>
              <span>Answered {answered}/{total}</span>
              <span>Score: <b style={{ color: autofail ? "#b91c1c" : "var(--green-dark)" }}>{pct}%</b> ({earned}/{possible} pts)</span>
              {autofail && <span className="pill warn">AUTO-FAIL flagged</span>}
            </div>
          </div>

          {mod.sections.map((sec) => {
            const secAns = sec.questions.filter((q) => answers[q.no]?.status).length;
            return (
              <div key={sec.section} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 16 }}>{sec.section} — {sec.title} <span className="muted" style={{ fontWeight: 400 }}>({secAns}/{sec.questions.length})</span></h2>
                  <span style={{ fontSize: 12 }}>
                    <a style={{ cursor: "pointer" }} onClick={() => setSectionAll(sec, "C")}>All Compliant</a>{" · "}
                    <a style={{ cursor: "pointer" }} onClick={() => setSectionAll(sec, "NA")}>All N/A</a>
                  </span>
                </div>
                {sec.questions.map((q) => (
                  <div key={q.no} className="q" style={{ borderTop: "1px solid #eee", paddingTop: 8, marginTop: 8 }}>
                    <div className="stem">
                      <b>{q.no}</b> — {q.question}{" "}
                      <span className="muted">[{q.points} pt{q.points === 1 ? "" : "s"}]</span>
                      {q.autofail && <span className="pill warn" style={{ marginLeft: 6 }}>AUTO-FAIL</span>}
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                      {STATUS.map((st) => (
                        <label key={st} style={{ fontWeight: answers[q.no]?.status === st ? 700 : 400, display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="radio" name={q.no} style={{ width: "auto", margin: 0 }}
                            checked={answers[q.no]?.status === st} onChange={() => setA(q.no, "status", st)} />
                          {LABEL[st]}
                        </label>
                      ))}
                      {answers[q.no]?.status === "NC" && (
                        <input style={{ flex: 1, minWidth: 220, margin: 0 }} placeholder="Finding / evidence (required)"
                          value={answers[q.no]?.note || ""} onChange={(e) => setA(q.no, "note", e.target.value)} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="card">
            <label>Auditor notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            {ncCount > 0 && (
              <div className="notice">{ncCount} non-conformance(s) will automatically open an FS Deviation with a CAPA on submit.</div>
            )}
            {err && <div className="error">{err}</div>}
            <button disabled={busy || answered < total || ncMissingNote} onClick={submit}>
              {busy ? "…" : ncMissingNote ? "Add a finding to each non-conformance"
                : answered < total ? `Answer all questions (${answered}/${total})`
                : "Submit Self-Audit"}
            </button>
          </div>
        </>
      )}

      <div className="card">
        <h2>Audit History</h2>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Module</th><th>Site</th><th>Auditor</th><th>Result</th></tr></thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>{h.id}</td>
                <td>{new Date(h.created_at).toLocaleDateString()}</td>
                <td>{h.module_no ? `M${h.module_no}` : h.module}</td>
                <td>{h.site}</td>
                <td>{h.auditor_name}</td>
                <td>
                  {h.autofail ? <span className="pill warn">{h.pct}% — AUTO-FAIL</span>
                    : h.noncompliant === 0 ? <span className="pill good">{h.pct}% — clean</span>
                    : <span className="pill warn">{h.pct}% — {h.noncompliant} NC</span>}
                </td>
              </tr>
            ))}
            {history.length === 0 && <tr><td colSpan={6}>No self-audits yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
