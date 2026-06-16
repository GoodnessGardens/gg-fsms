import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { sql } from "../../../lib/db";
import { liveRole, fsAccess } from "../../../lib/roles";

export const dynamic = "force-dynamic";

export default async function FsDeviations() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!fsAccess(s, await liveRole(s))) redirect("/dashboard");
  const list = await sql`SELECT i.*, e.name AS reporter,
      EXISTS (SELECT 1 FROM rca r WHERE r.incident_id = i.id AND COALESCE(r.root_causes,'') != '') AS rca_done,
      (SELECT count(*)::int FROM corrective_actions ca WHERE ca.incident_id = i.id AND ca.status NOT IN ('closed','completed','verified')) AS open_cas
    FROM incidents i JOIN employees e ON e.id = i.reported_by
    WHERE i.type = 'FS Deviation' ORDER BY i.created_at DESC LIMIT 200`;
  return (
    <div>
      <h1>FS Deviations &amp; CAPA</h1>
      <p>
        <a className="btn" href="/foodsafety/deviations/new">+ Report a Deviation</a>{" "}
        <a className="btn secondary" href="/foodsafety">FS Home</a>
      </p>
      <p className="muted" style={{ textAlign: "center" }}>
        Workflow per 1.03.03: Deviation → Root Cause Analysis → Corrective Actions (In Progress → Closed) → Close.
      </p>
      <div className="card">
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Category</th><th>Site</th><th>Reported By</th><th>Open CAs</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td>{i.id}</td>
                <td>{i.incident_date}</td>
                <td>{i.details?.category || (i.details?.source === "self-audit" ? "Self-audit NC" : "Deviation")}</td>
                <td>{i.site}</td>
                <td>{i.reporter}</td>
                <td>{i.open_cas > 0 ? <span className="pill warn">{i.open_cas}</span> : <span className="pill good">0</span>}</td>
                <td>{i.status !== "open" ? <span className="pill good">Closed</span> : i.rca_done ? <span className="pill warn">In Progress</span> : <span className="pill bad">Open — RCA needed</span>}</td>
                <td><a href={`/incidents/${i.id}`}>Investigate</a></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={8}>No deviations recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
