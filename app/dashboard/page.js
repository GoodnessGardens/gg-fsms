import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { sql } from "../../lib/db";
import { liveRole, adminRole } from "../../lib/roles";
import { getLang } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const s = await getSession();
  if (!s) redirect("/login");
  const admin = adminRole(await liveRole(s));
  const lang = getLang();
  const G = (en, es) => (lang === "es" ? es : en);

  let docs = 0, audits = 0, openDev = 0, openCA = 0, checklists = 0, subs7 = 0;
  try {
    [{ n: docs }] = await sql`SELECT count(*)::int AS n FROM fs_documents WHERE active = TRUE`;
    [{ n: audits }] = await sql`SELECT count(*)::int AS n FROM fs_audits`;
    [{ n: openDev }] = await sql`SELECT count(*)::int AS n FROM incidents WHERE type = 'FS Deviation' AND status = 'open'`;
    [{ n: openCA }] = await sql`SELECT count(*)::int AS n FROM corrective_actions ca JOIN incidents i ON i.id = ca.incident_id
      WHERE i.type = 'FS Deviation' AND ca.status NOT IN ('closed','completed','verified')`;
    [{ n: checklists }] = await sql`SELECT count(*)::int AS n FROM checklists`;
    [{ n: subs7 }] = await sql`SELECT count(*)::int AS n FROM checklist_submissions WHERE created_at > now() - interval '7 days'`;
  } catch {}

  const Stat = ({ value, label, color }) => (
    <div className="card" style={{ textAlign: "center", padding: "14px 10px" }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || "var(--green-dark)" }}>{value}</div>
      <div className="muted" style={{ fontSize: 12.5 }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div className="card green" style={{ textAlign: "center", marginTop: 14 }}>
        <h2 style={{ fontSize: 20 }}>{G("Goodness Gardens — Food Safety Management System", "Goodness Gardens — Sistema de Gestión de Inocuidad")}</h2>
        <p style={{ marginTop: 6, fontStyle: "italic" }}>FSQA · PrimusGFS</p>
      </div>

      {(openDev > 0 || openCA > 0) && (
        <div className="notice" style={{ textAlign: "center" }}>
          <b>{openDev}</b> {G("open deviation(s)", "desviación(es) abierta(s)")} · <b>{openCA}</b> {G("corrective action(s) in progress", "acción(es) correctiva(s) en curso")} → <a href="/foodsafety/deviations">{G("Deviations & CAPA", "Desviaciones y CAPA")}</a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, margin: "12px 0" }}>
        <Stat value={docs} label={G("Controlled documents", "Documentos controlados")} />
        <Stat value={audits} label={G("Self-audits completed", "Auto-auditorías")} />
        <Stat value={openDev} label={G("Open deviations", "Desviaciones abiertas")} color={openDev ? "#b91c1c" : undefined} />
        <Stat value={subs7} label={G("Checklist submissions (7d)", "Listas enviadas (7d)")} />
      </div>

      <div className="tiles">
        <a className="tile" href="/foodsafety/documents">{G("Document Register", "Registro de Documentos")}<small>{docs} {G("controlled documents — SOPs, logs, forms by Primus number", "documentos controlados — SOPs, registros y formularios")}</small></a>
        <a className="tile" href="/foodsafety/audit">{G("Primus Self-Audits", "Auto-Auditorías Primus")}<small>{G("PrimusGFS internal audit checklists — Modules 1–7, scored", "Listas de auditoría interna PrimusGFS — Módulos 1–7")}</small></a>
        <a className="tile" href="/foodsafety/deviations">{G("Deviations & CAPA", "Desviaciones y CAPA")}<small>{openDev} {G("open · report, root cause, corrective actions", "abiertas · reporte, causa raíz, acciones correctivas")}</small></a>
        <a className="tile" href="/foodsafety/deviations/new">{G("+ Report a Deviation", "+ Reportar una Desviación")}<small>{G("CCP failure, sanitation, pest, foreign material, complaint…", "Falla de PCC, sanitización, plagas, material extraño…")}</small></a>
        <a className="tile" href="/checklists">{G("Checklists", "Listas de Verificación")}<small>{checklists} {G("daily & inspection checks", "verificaciones diarias y de inspección")}</small></a>
        {admin && <a className="tile" href="/admin">{G("Admin", "Administración")}<small>{G("Users & system setup", "Usuarios y configuración")}</small></a>}
      </div>
    </div>
  );
}
