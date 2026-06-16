"use client";
import { useState } from "react";

const DRIVE = "https://drive.google.com/drive/u/0/folders/1tQ3LjXJb8VxUfDRixEWzOSTP3TxOIu29";

// Master FS Compliance Checklist category order
const ORDER = [
  "1 — Food Safety Management System",
  "2 — Traceability & Recall",
  "3 — Training",
  "4 — Farm Operations",
  "5 — Greenhouse",
  "6 — Facility GMP",
  "7 — Sanitation",
  "8 — Environmental Monitoring",
  "9 — Temperature & Calibration",
  "10 — Receiving & Shipping",
];

const pdfName = (no) => no.replace(/[^A-Za-z0-9.\-]/g, "_") + ".pdf";

export default function RegisterClient({ docs }) {
  const [fType, setFType] = useState("all");
  const [q, setQ] = useState("");
  const types = [...new Set(docs.map((d) => d.doctype))].sort();
  const match = (d) =>
    (fType === "all" || d.doctype === fType) &&
    (!q || d.doc_no.toLowerCase().includes(q.toLowerCase()) || d.title.toLowerCase().includes(q.toLowerCase()));
  const filtering = fType !== "all" || q.length > 0;

  return (
    <div>
      <h1>FS Document Register</h1>
      <p className="muted" style={{ textAlign: "center" }}>
        Organized per the Master FS Compliance Checklist. Click a category to open its records — every record is
        readable here and printable as PDF. Master files:{" "}
        <a href={DRIVE} target="_blank" rel="noreferrer">01 — Food Safety SOPs Drive folder ↗</a>
      </p>
      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
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

        {ORDER.map((cat) => {
          const items = docs.filter((d) => d.category === cat).filter(match)
            .sort((a, b) => a.doc_no.localeCompare(b.doc_no, undefined, { numeric: true }));
          if (items.length === 0) return null;
          return (
            <details key={cat} open={filtering}
              style={{ border: "1px solid #e0ddcf", borderRadius: 10, margin: "8px 0", background: "#fff" }}>
              <summary style={{ cursor: "pointer", padding: "12px 16px", fontWeight: 700, color: "var(--green-dark)", fontSize: 15 }}>
                {cat} <span className="muted" style={{ fontWeight: 400 }}>· {items.length} record{items.length === 1 ? "" : "s"}</span>
              </summary>
              <div style={{ padding: "0 12px 12px" }}>
                <table>
                  <thead><tr><th style={{ width: 150 }}>Doc No.</th><th>Title</th><th style={{ width: 95 }}>Type</th><th style={{ width: 60 }}>PDF</th></tr></thead>
                  <tbody>
                    {items.map((d) => (
                      <tr key={d.doc_no}>
                        <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{d.doc_no}</td>
                        <td><a href={`/foodsafety/documents/${encodeURIComponent(d.doc_no)}`}>{d.title}</a></td>
                        <td>{d.doctype}</td>
                        <td><a href={`/fsdocs/${pdfName(d.doc_no)}`} target="_blank" rel="noreferrer">PDF ↗</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
        <p className="muted" style={{ marginTop: 8 }}>{docs.filter(match).length} of {docs.length} records</p>
      </div>
    </div>
  );
}
