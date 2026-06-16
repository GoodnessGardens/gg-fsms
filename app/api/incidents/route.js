import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { liveRole, canEdit } from "../../../lib/roles";

// Create a Food Safety deviation. Auto-opens a CAPA (to the FSQA Manager) and an RCA stub per 1.03.03.
export async function POST(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!canEdit(await liveRole(s))) return NextResponse.json({ error: "Auditor accounts are read-only" }, { status: 403 });
  const f = await req.json();
  if (!f.description || !f.site) return NextResponse.json({ error: "Site and description are required" }, { status: 400 });

  const rows = await sql`INSERT INTO incidents
    (reported_by, incident_date, department, site, type, location, persons, description, immediate_actions, details)
    VALUES (${s.id}, ${f.incident_date || new Date().toISOString().slice(0, 10)}, ${f.department || "Food Safety"},
      ${f.site}, ${f.type || "FS Deviation"}, ${f.location || ""}, ${f.persons || ""}, ${f.description},
      ${f.immediate_actions || ""}, ${JSON.stringify(f.details || {})})
    RETURNING id`;
  const id = rows[0].id;

  const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  await sql`INSERT INTO corrective_actions (incident_id, action, hierarchy, owner, due_date)
    VALUES (${id},
      ${`Investigate incident #${id}${f.details?.category ? ` — ${f.details.category}` : ""}, complete root cause analysis, and implement corrective actions per 1.03.03.`},
      'Procedure / Process change', 'FSQA Manager', ${due})`;
  await sql`INSERT INTO rca (incident_id, problem)
    VALUES (${id}, ${"AUTO-OPENED (FS Deviation): " + String(f.description).slice(0, 500)})`;

  return NextResponse.json({ id, rcaRequired: true, fs: true });
}
