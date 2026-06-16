import { redirect, notFound } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { sql } from "../../../../lib/db";
import { liveRole, fsAccess, adminRole } from "../../../../lib/roles";
import docs from "../../../../content/fs_docs.json";

export const dynamic = "force-dynamic";

const pdfName = (no) => no.replace(/[^A-Za-z0-9.\-]/g, "_") + ".pdf";
const SECNAME = {
  OBJECTIVE: "Objective", SCOPE: "Scope", RESPONSIBILITY: "Responsibilities", PROCEDURE: "Procedure",
  RECORDS: "Records", PURPOSE: "Purpose", "FIELDS / COLUMNS": "Fields / Columns",
  INSTRUCTIONS: "Instructions", "CHECKLIST ITEMS": "Checklist Items",
};

export default async function FsDocView({ params }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const role = await liveRole(s);
  if (!fsAccess(s, role)) redirect("/dashboard");
  const admin = adminRole(role);
  const no = decodeURIComponent(params.docno);
  // Admin edits live in the database and take precedence over the original content
  let d = docs[no] ? { ...docs[no] } : null;
  try {
    const rows = await sql`SELECT title, doctype, module, content, edited FROM fs_documents WHERE doc_no = ${no}`;
    if (rows[0]) {
      d = d || { sections: [] };
      d.title = rows[0].title || d.title;
      d.doctype = rows[0].doctype || d.doctype;
      d.module = rows[0].module ?? d.module;
      if (rows[0].content?.sections?.length) d.sections = rows[0].content.sections;
    }
  } catch {}
  if (!d) notFound();

  const rule = { border: "none", borderTop: "2px solid var(--green-dark)", margin: "10px 0" };
  const ctl = [
    ["Document No.", no], ["Revision", "Rev. 1 — June 2026"], ["Prepared By", ""],
    ["Approved By (Name / Title)", ""], ["Approval Signature / Date", ""], ["Next Review Date", ""],
  ];

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <p style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <a className="btn secondary" href="/foodsafety/documents">← Register</a>{" "}
        <a className="btn" href={`/fsdocs/${pdfName(no)}`} target="_blank">Printable PDF ↗</a>
        {admin && (
          <a href={`/foodsafety/documents/${encodeURIComponent(no)}/edit`}
            style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600 }}>✎ Edit document</a>
        )}
      </p>
      <div className="card" style={{ padding: "28px 36px" }}>
        {/* Running-header style strip */}
        <p style={{ margin: 0, fontSize: 12, borderBottom: "2px solid var(--green-dark)", paddingBottom: 6 }}>
          <b style={{ color: "var(--green-dark)" }}>Goodness Gardens</b> {d.title} — {no} Rev. 1
        </p>
        {/* Title block (GG-SAF format) */}
        <h2 style={{ textAlign: "center", color: "var(--green-dark)", letterSpacing: 1, margin: "26px 0 2px", fontSize: 24 }}>GOODNESS GARDENS</h2>
        <p style={{ textAlign: "center", fontStyle: "italic", margin: "0 0 10px" }}>Food Safety &amp; Quality Assurance Program</p>
        <hr style={rule} />
        <h3 style={{ textAlign: "center", color: "var(--ink)", fontSize: 19, margin: "8px 0", textTransform: "uppercase" }}>{d.title}</h3>
        <hr style={rule} />
        <p style={{ textAlign: "center", margin: "10px 0 18px" }}>
          Controlled Document — {d.doctype} — PrimusGFS Module {d.module}
        </p>
        <table style={{ maxWidth: 560, margin: "0 auto 18px" }}>
          <tbody>
            {ctl.map(([k, v]) => (
              <tr key={k}><th style={{ width: "42%" }}>{k}</th><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontStyle: "italic", fontSize: 13, color: "#444", margin: "0 0 18px" }}>
          This controlled document is maintained under the Goodness Gardens Food Safety &amp; Quality Management System
          and the PrimusGFS audit scheme. It must be reviewed at least annually, after any deviation or audit finding,
          and whenever processes, products, or regulations change. Printed copies are uncontrolled.
        </p>
        {d.sections.map(([heading, items], i) => (
          <div key={heading} style={{ marginBottom: 16 }}>
            <h3 style={{ color: "var(--green-dark)", fontSize: 17, margin: "0 0 6px" }}>
              {i + 1}. {SECNAME[heading] || heading}
            </h3>
            {items.length === 1 && ["OBJECTIVE", "SCOPE", "PURPOSE"].includes(heading) ? (
              <p style={{ margin: 0 }}>{items[0]}</p>
            ) : (
              <ul style={{ margin: "0 0 0 24px" }}>
                {items.map((it, j) => <li key={j} style={{ marginBottom: 5 }}>{it}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
