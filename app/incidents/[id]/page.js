import { redirect, notFound } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { sql } from "../../../lib/db";
import { liveRole, supRole, fsAccess } from "../../../lib/roles";
import InvestigateClient from "./InvestigateClient";

export const dynamic = "force-dynamic";

// Deviation detail: report + Root Cause Analysis + Corrective Actions (CAPA) + close.
export default async function DeviationDetail({ params }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const role = await liveRole(s);
  const id = Number(params.id);
  const inc = (await sql`SELECT i.*, e.name AS reporter FROM incidents i JOIN employees e ON e.id = i.reported_by WHERE i.id = ${id}`)[0];
  if (!inc) notFound();
  if (!(fsAccess(s, role) || supRole(role))) redirect("/foodsafety/deviations");

  const rca = (await sql`SELECT * FROM rca WHERE incident_id = ${id} ORDER BY id DESC LIMIT 1`)[0] || null;
  const cas = await sql`SELECT * FROM corrective_actions WHERE incident_id = ${id} ORDER BY id`;
  const witnesses = await sql`SELECT * FROM witness_statements WHERE incident_id = ${id} ORDER BY id`;

  return (
    <div>
      <p className="muted"><a href="/foodsafety/deviations">← Deviations &amp; CAPA</a></p>
      <h1>Deviation #{inc.id} — {inc.details?.category || "Deviation"} ({inc.status})</h1>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Report</h2>
        <table>
          <tbody>
            <tr><th style={{ width: "30%" }}>Date</th><td>{inc.incident_date}</td></tr>
            <tr><th>Department / Site</th><td>{inc.department}{inc.site ? ` / ${inc.site}` : ""}</td></tr>
            <tr><th>Location / area</th><td>{inc.location || "—"}</td></tr>
            <tr><th>Reported by</th><td>{inc.reporter} on {new Date(inc.created_at).toLocaleString()}</td></tr>
            <tr><th>Description</th><td>{inc.description}</td></tr>
            <tr><th>Immediate actions</th><td>{inc.immediate_actions || "—"}</td></tr>
          </tbody>
        </table>
      </div>
      <InvestigateClient incidentId={inc.id} status={inc.status} rca={rca} cas={cas} witnesses={witnesses}
        incidentType={inc.type} incidentDept={inc.department} />
    </div>
  );
}
