import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { liveRole, adminRole } from "../../../lib/roles";
import { textToSecs } from "../../../lib/content";

export async function POST(req) {
  const s = await getSession();
  if (!s || !adminRole(await liveRole(s))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const m = await req.json();
  if (!m.doc_no) return NextResponse.json({ error: "Bad payload" }, { status: 400 });

  const sections = textToSecs(m.text);
  if (sections.length === 0)
    return NextResponse.json({ error: "Document needs at least one '## SECTION' with content" }, { status: 400 });

  try {
    await sql`ALTER TABLE fs_documents ADD COLUMN IF NOT EXISTS content JSONB`;
    await sql`ALTER TABLE fs_documents ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT FALSE`;
  } catch {}

  await sql`UPDATE fs_documents SET
      title = ${(m.title || "").trim() || m.doc_no},
      doctype = ${(m.doctype || "SOP").trim()},
      content = ${JSON.stringify({ sections })},
      edited = TRUE
    WHERE doc_no = ${m.doc_no}`;
  return NextResponse.json({ ok: true });
}
