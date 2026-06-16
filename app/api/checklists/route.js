import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getSession } from "../../../lib/auth";

export async function POST(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id, site, shift, unit, results } = await req.json();
  if (!id || !Array.isArray(results) || results.some((r) => !r.status))
    return NextResponse.json({ error: "Complete all items" }, { status: 400 });
  const hasIssues = results.some((r) => r.status === "action");
  await sql`INSERT INTO checklist_submissions (checklist_id, employee_id, site, shift, unit, results, has_issues)
    VALUES (${id}, ${s.id}, ${site || ""}, ${shift || ""}, ${unit || ""}, ${JSON.stringify(results)}, ${hasIssues})`;
  return NextResponse.json({ ok: true, hasIssues });
}
