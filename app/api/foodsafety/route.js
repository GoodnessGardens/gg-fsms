import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { liveRole, fsAccess, canEdit } from "../../../lib/roles";
import primus from "../../../content/primusgfs_v4_modules.json";

// Lookup: question no -> { points, autofail, module }
const QMAP = {};
for (const m of primus.modules)
  for (const sec of m.sections)
    for (const q of sec.questions)
      QMAP[q.no] = { points: q.points || 0, autofail: !!q.autofail, module: m.module };

export async function POST(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const role = await liveRole(s);
  if (!fsAccess(s, role)) return NextResponse.json({ error: "Food Safety team only" }, { status: 403 });
  if (!canEdit(role)) return NextResponse.json({ error: "Auditor accounts are read-only" }, { status: 403 });

  const b = await req.json();
  if (!b.module_no || !b.site || !b.answers)
    return NextResponse.json({ error: "Module, site, and answers are required" }, { status: 400 });

  const moduleObj = primus.modules.find((m) => m.module === Number(b.module_no));
  const moduleTitle = moduleObj ? `Module ${moduleObj.module} — ${moduleObj.module_title}` : `Module ${b.module_no}`;

  const entries = Object.entries(b.answers);
  const compliant = entries.filter(([, a]) => a.status === "C").length;
  const noncompliant = entries.filter(([, a]) => a.status === "NC").length;
  const na = entries.filter(([, a]) => a.status === "NA").length;

  // Points-based score (PrimusGFS scores by points, not question count)
  let possible = 0, earned = 0, autofail = false;
  for (const [q, a] of entries) {
    const meta = QMAP[q];
    if (!meta) continue;
    if (a.status === "C") { possible += meta.points; earned += meta.points; }
    else if (a.status === "NC") {
      possible += meta.points;
      if (meta.autofail) autofail = true;
    }
  }
  const pct = possible ? Math.round((earned / possible) * 100) : 100;

  const rows = await sql`INSERT INTO fs_audits (module, module_no, site, auditor, answers, compliant, noncompliant, na, pct, autofail, notes)
    VALUES (${moduleTitle}, ${Number(b.module_no)}, ${b.site}, ${s.id}, ${JSON.stringify(b.answers)},
      ${compliant}, ${noncompliant}, ${na}, ${pct}, ${autofail}, ${b.notes || ""})
    RETURNING id`;
  const id = rows[0].id;

  // Non-compliances automatically open an FS Deviation with CAPA + RCA
  let deviationId = null;
  if (noncompliant > 0) {
    const ncList = entries.filter(([, a]) => a.status === "NC")
      .map(([q, a]) => `${q}${QMAP[q]?.autofail ? " [AUTO-FAIL]" : ""}: ${a.note || "non-compliant"}`).join("\n");
    const afNote = autofail ? "AUTOMATIC-FAILURE non-conformance present. " : "";
    const dev = await sql`INSERT INTO incidents
      (reported_by, incident_date, department, site, type, location, persons, description, details)
      VALUES (${s.id}, ${new Date().toISOString().slice(0, 10)}, 'Food Safety', ${b.site}, 'FS Deviation', '', '',
        ${`${afNote}Internal self-audit #${id} (${moduleTitle}) scored ${pct}% with ${noncompliant} non-conformance(s):\n${ncList}`},
        ${JSON.stringify({ source: "self-audit", audit_id: id, autofail })})
      RETURNING id`;
    deviationId = dev[0].id;
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    await sql`INSERT INTO corrective_actions (incident_id, action, hierarchy, owner, due_date)
      VALUES (${deviationId}, ${`Investigate incident #${deviationId} (audit non-conformances), complete root cause analysis, and implement corrective actions per 1.03.03.`},
        'administrative', 'FSQA Manager', ${due})`;
    await sql`INSERT INTO rca (incident_id, problem)
      VALUES (${deviationId}, ${`AUTO-OPENED (FS self-audit #${id}): ${noncompliant} non-conformance(s) in ${moduleTitle}`})`;
  }

  return NextResponse.json({ id, compliant, noncompliant, na, pct, autofail, deviationId });
}
