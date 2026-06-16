import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { sql } from "../../lib/db";
import { liveRole, fsAccess } from "../../lib/roles";

export const dynamic = "force-dynamic";

export default async function FoodSafetyHub() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!fsAccess(s, await liveRole(s))) redirect("/dashboard");

  const [docs] = await sql`SELECT count(*)::int AS n FROM fs_documents WHERE active = TRUE`;
  const [audits] = await sql`SELECT count(*)::int AS n FROM fs_audits`;
  const [openDev] = await sql`SELECT count(*)::int AS n FROM incidents WHERE type = 'FS Deviation' AND status = 'open'`;
  const [openCA] = await sql`SELECT count(*)::int AS n FROM corrective_actions ca JOIN incidents i ON i.id = ca.incident_id
    WHERE i.type = 'FS Deviation' AND ca.status NOT IN ('closed','completed','verified')`;

  return (
    <div>
      <h1>Food Safety &amp; Quality</h1>
      {(openDev.n > 0 || openCA.n > 0) && (
        <div className="notice" style={{ textAlign: "center" }}>
          <b>{openDev.n}</b> open deviation(s) · <b>{openCA.n}</b> corrective action(s) in progress →{" "}
          <a href="/foodsafety/deviations">Deviations &amp; CAPA</a>
        </div>
      )}
      <div className="tiles">
        <a className="tile" href="/foodsafety/audit">Primus Self-Audits<small>PrimusGFS internal audit checklists — Modules 1–7, scored, with history</small></a>
        <a className="tile" href="/foodsafety/deviations">Deviations &amp; CAPA<small>{openDev.n} open · report, root cause, corrective actions</small></a>
        <a className="tile" href="/foodsafety/documents">Document Register<small>{docs.n} controlled documents — SOPs, logs, forms by Primus number</small></a>
        <a className="tile" href="/foodsafety/deviations/new">+ Report a Deviation<small>CCP failure, sanitation, pest, foreign material, complaint…</small></a>
      </div>
      <div className="card green" style={{ textAlign: "center" }}>
        <h2>FSQA — Goodness Gardens</h2>
        <p style={{ marginTop: 6 }}>{audits.n} self-audits completed. Master documents live in the Drive folder — this register is the index the auditor sees first.</p>
      </div>
    </div>
  );
}
