import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { liveRole, fsAccess } from "../../../lib/roles";

export async function POST(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!fsAccess(s, await liveRole(s))) return NextResponse.json({ error: "Food Safety team only" }, { status: 403 });
  const b = await req.json();
  if (!b.module || !b.site || !b.answers)
    return NextResponse.json({ error: "Module, site, and answers are required" }, { status: 400 });

  const entries = Object.entries(b.answers);
  const compliant = entries.filter(([, a]) => a.status === "C").length;
  const noncompliant = entries.filter(([, a]) => a.status === "NC").length;
  const na = entries.filter(([, a]) => a.status === "NA").length;
  const scored = compliant + noncompliant;
  const pct = scored ? Math.round((compliant / scored) * 100) : 100;

  const rows = await sql`INSERT INTO fs_audits (module, site, auditor, answers, compliant, noncompliant, na, notes)
    VALUES (${b.module}, ${b.site}, ${s.id}, ${JSON.stringify(b.answers)}, ${compliant}, ${noncompliant}, ${na}, ${b.notes || ""})
    RETURNING id`;
  const id = rows[0].id;

  // Non-compliances automatically open an FS Deviation with CAPA + RCA
  let deviationId = null;
  if (noncompliant > 0) {
    const ncList = entries.filter(([, a]) => a.status === "NC")
      .map(([q, a]) => `${q}: ${a.note || "non-compliant"}`).join("\n");
    const dev = await sql`INSERT INTO incidents
      (reported_by, incident_date, department, site, type, location, persons, description, details)
      VALUES (${s.id}, ${new Date().toISOString().slice(0, 10)}, 'Food Safety', ${b.site}, 'FS Deviation', '', '',
        ${`Internal self-audit #${id} (${b.module}) found ${noncompliant} non-compliance(s):\n${ncList}`},
        ${JSON.stringify({ source: "self-audit", audit_id: id })})
      RETURNING id`;
    deviationId = dev[0].id;
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    await sql`INSERT INTO corrective_actions (incident_id, action, hierarchy, owner, due_date)
      VALUES (${deviationId}, ${`Investigate incident #${deviationId} (audit non-compliances), complete root cause analysis, and implement corrective actions per 1.03.03.`},
        'administrative', 'FSQA Manager', ${due})`;
    await sql`INSERT INTO rca (incident_id, problem)
      VALUES (${deviationId}, ${`AUTO-OPENED (FS self-audit #${id}): ${noncompliant} non-compliance(s) in ${b.module}`})`;
  }

  return NextResponse.json({ id, compliant, noncompliant, na, pct, deviationId });
}
