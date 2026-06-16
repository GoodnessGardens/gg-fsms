"use client";
import { useState } from "react";

const DRIVE = "https://drive.google.com/drive/u/0/folders/1tQ3LjXJb8VxUfDRixEWzOSTP3TxOIu29";
const pdfName = (no) => no.replace(/[^A-Za-z0-9.\-]/g, "_") + ".pdf";

export default function RegisterClient({ docs, modules, sites }) {
  const [site, setSite] = useState("all");
  const [fType, setFType] = useState("all");
  const [q, setQ] = useState("");
  const [showGaps, setShowGaps] = useState(false);

  const types = [...new Set(docs.map((d) => d.doctype))].sort();
  const siteObj = sites.find((x) => x.code === site);
  const inScope = (m) => !siteObj || siteObj.modules.includes(m.module);
  const searching = q.length > 0 || fType !== "all";
  const match = (d) =>
    (fType === "all" || d.doctype === fType) &&
    (!q || d.doc_no.toLowerCase().includes(q.toLowerCase()) || d.title.toLowerCase().includes(q.toLowerCase()));

  // Coverage across modules in scope
  const scopedModules = modules.filter(inScope);
  let totalQ = 0, coveredQ = 0;
  for (const m of scopedModules) {
    const refs = new Set(docs.filter((d) => d.module_no === m.module && d.primus_ref).map((d) => d.primus_ref));
    for (const sec of m.sections) for (const qq of sec.questions) { totalQ++; if (refs.has(qq.no)) coveredQ++; }
  }

  const DocRow = (d) => (
    <tr key={d.doc_no}>
      <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{d.doc_no}</td>
      <td><a href={`/foodsafety/documents/${encodeURIComponent(d.doc_no)}`}>{d.title}</a></td>
      <td>{d.doctype}</td>
      <td style={{ whiteSpace: "nowrap" }}>{d.primus_ref || d.section || "—"}</td>
      <td><a href={`/fsdocs/${pdfName(d.doc_no)}`} target="_blank" rel="noreferrer">PDF ↗</a></td>
    </tr>
  );

  return (
    <div>
      <h1>FS Document Register</h1>
      <p className="muted" style={{ textAlign: "center" }}>
        Keyed to <b>PrimusGFS v4.0</b> — every document is filed under the Module → Section it satisfies. Master files:{" "}
        <a href={DRIVE} target="_blank" rel="noreferrer">01 — Food Safety SOPs Drive folder ↗</a>
      </p>

      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <div>
            <label>Site</label>
            <select value={site} onChange={(e) => setSite(e.target.value)} style={{ margin: 0 }}>
              <option value="all">All sites</option>
              {sites.map((x) => <option key={x.code} value={x.code}>{x.code} — {x.name}</option>)}
            </select>
          </div>
          <div>
            <label>Record type</label>
            <select value={fType} onChange={(e) => setFType(e.target.value)} style={{ margin: 0 }}>
              <option value="all">All types</option>
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label>Search</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="number or title…" style={{ margin: 0 }} />
          </div>
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 400 }}>
          <input type="checkbox" style={{ width: "auto", margin: 0 }} checked={showGaps} onChange={(e) => setShowGaps(e.target.checked)} />
          Show PrimusGFS questions with no linked document (gaps)
        </label>
        <p className="muted" style={{ marginTop: 8 }}>
          Coverage in scope: <b>{coveredQ}</b> of <b>{totalQ}</b> PrimusGFS questions have a linked document.
          {siteObj ? ` Scope: ${siteObj.name} (modules ${siteObj.modules.join(", ")}).` : " Scope: all 6 modules."}
        </p>
      </div>

      {scopedModules.map((m) => {
        const mDocs = docs.filter((d) => d.module_no === m.module).filter(match);
        const refs = new Set(docs.filter((d) => d.module_no === m.module && d.primus_ref).map((d) => d.primus_ref));
        const mTotal = m.sections.reduce((a, sec) => a + sec.questions.length, 0);
        // Hide a module entirely if filtering and it has no matches
        if (searching && mDocs.length === 0) return null;
        const unsectioned = mDocs.filter((d) => !d.section);
        return (
          <details key={m.module} open={searching || site !== "all"}
            style={{ border: "1px solid #cfe0c7", borderRadius: 10, margin: "10px 0", background: "#fff" }}>
            <summary style={{ cursor: "pointer", padding: "12px 16px", fontWeight: 800, color: "var(--green-dark)", fontSize: 16 }}>
              Module {m.module} — {m.module_title}{" "}
              <span className="muted" style={{ fontWeight: 400 }}>· {mDocs.length} doc{mDocs.length === 1 ? "" : "s"} · {refs.size}/{mTotal} questions covered</span>
            </summary>
            <div style={{ padding: "0 12px 12px" }}>
              {m.sections.map((sec) => {
                const secDocs = mDocs.filter((d) => d.section === sec.section);
                const gapQs = (showGaps && !searching) ? sec.questions.filter((qq) => !refs.has(qq.no)) : [];
                if (secDocs.length === 0 && gapQs.length === 0) return null;
                return (
                  <div key={sec.section} style={{ margin: "10px 0" }}>
                    <div style={{ fontWeight: 700, color: "#3f5d36", fontSize: 14, margin: "6px 0" }}>{sec.section} — {sec.title}</div>
                    <table>
                      <thead><tr><th style={{ width: 150 }}>Doc No.</th><th>Title</th><th style={{ width: 95 }}>Type</th><th style={{ width: 80 }}>Satisfies</th><th style={{ width: 55 }}>PDF</th></tr></thead>
                      <tbody>
                        {secDocs.sort((a, b) => a.doc_no.localeCompare(b.doc_no, undefined, { numeric: true })).map(DocRow)}
                        {gapQs.map((qq) => (
                          <tr key={qq.no} style={{ background: "#fff7f5" }}>
                            <td style={{ whiteSpace: "nowrap", color: "#b91c1c", fontWeight: 600 }}>{qq.no}</td>
                            <td className="muted" style={{ fontStyle: "italic" }}>{qq.question}</td>
                            <td className="muted">— gap —</td>
                            <td>{qq.no}</td>
                            <td>—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              {unsectioned.length > 0 && (
                <div style={{ margin: "10px 0" }}>
                  <div style={{ fontWeight: 700, color: "#3f5d36", fontSize: 14, margin: "6px 0" }}>General (module-level)</div>
                  <table>
                    <thead><tr><th style={{ width: 150 }}>Doc No.</th><th>Title</th><th style={{ width: 95 }}>Type</th><th style={{ width: 80 }}>Satisfies</th><th style={{ width: 55 }}>PDF</th></tr></thead>
                    <tbody>{unsectioned.sort((a, b) => a.doc_no.localeCompare(b.doc_no, undefined, { numeric: true })).map(DocRow)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </details>
        );
      })}
      <p className="muted" style={{ marginTop: 8 }}>{docs.filter(match).length} of {docs.length} documents{searching ? " match" : ""}.</p>
    </div>
  );
}
