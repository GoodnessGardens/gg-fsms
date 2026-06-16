import { NextResponse } from "next/server";
import { sql } from "../../../../../lib/db";
import { getSession } from "../../../../../lib/auth";
import { liveRole, supRole, fsAccess } from "../../../../../lib/roles";

export async function POST(req, { params }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const role = await liveRole(s);
  const id = Number(params.id);
  const incRows = await sql`SELECT type FROM incidents WHERE id = ${id}`;
  if (!incRows[0]) return NextResponse.json({ error: "Unknown incident" }, { status: 404 });
  const allowed = incRows[0].type === "FS Deviation" ? (fsAccess(s, role) || supRole(role)) : supRole(role);
  if (!allowed) return NextResponse.json({ error: "Supervisor access required" }, { status: 403 });
  const b = await req.json();

  if (b.kind === "rca") {
    // Update the latest RCA for this incident if one exists (e.g. auto-opened); otherwise create it
    const existing = await sql`SELECT id FROM rca WHERE incident_id = ${id} ORDER BY id DESC LIMIT 1`;
    if (existing[0]) {
      await sql`UPDATE rca SET problem = ${b.problem || ""}, whys = ${JSON.stringify(b.whys || [])},
        root_causes = ${b.root_causes || ""}, factors = ${JSON.stringify(b.factors || {})}, completed_by = ${s.id}
        WHERE id = ${existing[0].id}`;
    } else {
      await sql`INSERT INTO rca (incident_id, problem, whys, root_causes, factors, completed_by)
        VALUES (${id}, ${b.problem || ""}, ${JSON.stringify(b.whys || [])}, ${b.root_causes || ""}, ${JSON.stringify(b.factors || {})}, ${s.id})`;
    }
  } else if (b.kind === "ca") {
    if (!b.action || !b.owner || !b.due_date) return NextResponse.json({ error: "Action, owner, and due date required" }, { status: 400 });
    await sql`INSERT INTO corrective_actions (incident_id, action, hierarchy, owner, due_date)
      VALUES (${id}, ${b.action}, ${b.hierarchy || "Other"}, ${b.owner}, ${b.due_date})`;
  } else if (b.kind === "ca-status") {
    // Corrective actions can only be closed once the RCA is complete
    if (b.status === "closed") {
      const rcaRows = await sql`SELECT root_causes FROM rca WHERE incident_id = ${id} ORDER BY id DESC LIMIT 1`;
      if (!rcaRows[0] || !rcaRows[0].root_causes?.trim())
        return NextResponse.json({ error: "Complete the root cause analysis before closing corrective actions" }, { status: 400 });
      const manual = await sql`SELECT count(*)::int AS n FROM corrective_actions
        WHERE incident_id = ${id} AND action NOT LIKE 'Investigate incident #%' AND action NOT LIKE 'Training refresher%'`;
      if (manual[0].n === 0)
        return NextResponse.json({ error: "Add at least one corrective action before closing — the auto-created entries don't count" }, { status: 400 });
      await sql`UPDATE corrective_actions SET status = 'closed', verified_at = now() WHERE id = ${b.caId} AND incident_id = ${id}`;
    } else {
      await sql`UPDATE corrective_actions SET status = ${b.status}, verified_at = NULL WHERE id = ${b.caId} AND incident_id = ${id}`;
    }
  } else if (b.kind === "witness") {
    await sql`INSERT INTO witness_statements (incident_id, witness_name, statement) VALUES (${id}, ${b.witness_name}, ${b.statement})`;
  } else if (b.kind === "close") {
    // Workflow gate: RCA complete + every corrective action closed
    const rcaRows = await sql`SELECT root_causes FROM rca WHERE incident_id = ${id} ORDER BY id DESC LIMIT 1`;
    if (!rcaRows[0] || !rcaRows[0].root_causes?.trim())
      return NextResponse.json({ error: "Complete the root cause analysis first" }, { status: 400 });
    const open = await sql`SELECT count(*)::int AS n FROM corrective_actions
      WHERE incident_id = ${id} AND status NOT IN ('closed','completed','verified')`;
    if (open[0].n > 0)
      return NextResponse.json({ error: `${open[0].n} corrective action(s) still in progress` }, { status: 400 });
    const manual = await sql`SELECT count(*)::int AS n FROM corrective_actions
      WHERE incident_id = ${id} AND action NOT LIKE 'Investigate incident #%' AND action NOT LIKE 'Training refresher%'`;
    if (manual[0].n === 0)
      return NextResponse.json({ error: "At least one corrective action (beyond the auto-created entries) is required" }, { status: 400 });
    await sql`UPDATE incidents SET status = 'closed' WHERE id = ${id}`;
  } else if (b.kind === "reopen") {
    await sql`UPDATE incidents SET status = 'open' WHERE id = ${id}`;
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
