import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, createTables } from "../../../lib/db";
import fsRegister from "../../../content/fs_register.json";
import checklists from "../../../content/checklists.json";

export const maxDuration = 60;

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN)
    return NextResponse.json({ error: "Bad or missing setup token" }, { status: 403 });

  await createTables();

  // Safety ALTERs so existing databases pick up the PrimusGFS keying columns
  try {
    await sql`ALTER TABLE fs_documents ADD COLUMN IF NOT EXISTS module_no INT`;
    await sql`ALTER TABLE fs_documents ADD COLUMN IF NOT EXISTS section TEXT`;
    await sql`ALTER TABLE fs_documents ADD COLUMN IF NOT EXISTS primus_ref TEXT`;
    await sql`ALTER TABLE fs_audits ADD COLUMN IF NOT EXISTS module_no INT`;
    await sql`ALTER TABLE fs_audits ADD COLUMN IF NOT EXISTS pct INT NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE fs_audits ADD COLUMN IF NOT EXISTS autofail BOOLEAN NOT NULL DEFAULT FALSE`;
  } catch {}

  // Seed the controlled-document register, keyed to PrimusGFS numbering (preserves any edits)
  for (const d of fsRegister.documents) {
    await sql`INSERT INTO fs_documents (doc_no, title, module, module_no, section, primus_ref, doctype)
      VALUES (${d.doc_no}, ${d.title}, ${d.module}, ${d.module_no ?? null}, ${d.section ?? null}, ${d.primus_ref ?? null}, ${d.doctype})
      ON CONFLICT (doc_no) DO UPDATE SET title = EXCLUDED.title, module = EXCLUDED.module,
        module_no = EXCLUDED.module_no, section = EXCLUDED.section, primus_ref = EXCLUDED.primus_ref, doctype = EXCLUDED.doctype
      WHERE fs_documents.edited IS DISTINCT FROM TRUE`;
  }

  // Seed operational checklists
  for (const c of checklists) {
    await sql`INSERT INTO checklists (id, department, title, title_es, note, note_es, items)
      VALUES (${c.id}, ${c.department || ""}, ${c.title.en}, ${c.title.es || ""}, ${c.note?.en || ""}, ${c.note?.es || ""}, ${JSON.stringify(c.items)})
      ON CONFLICT (id) DO UPDATE SET department = EXCLUDED.department, title = EXCLUDED.title, title_es = EXCLUDED.title_es,
        note = EXCLUDED.note, note_es = EXCLUDED.note_es, items = EXCLUDED.items`;
  }

  // First admin account
  const hash = await bcrypt.hash("0000", 10);
  await sql`INSERT INTO employees (code, name, pin_hash, role, department, site)
    VALUES ('admin', 'FSQA Administrator', ${hash}, 'admin', 'Food Safety', '')
    ON CONFLICT (code) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, role = 'admin', active = TRUE`;

  // Read-only auditor account (sees all sites, documents, and audits)
  const ahash = await bcrypt.hash("0000", 10);
  await sql`INSERT INTO employees (code, name, pin_hash, role, department, site)
    VALUES ('auditor', 'PrimusGFS Auditor', ${ahash}, 'auditor', 'Food Safety', '')
    ON CONFLICT (code) DO NOTHING`;

  return NextResponse.json({
    ok: true,
    documents: fsRegister.documents.length,
    checklists: checklists.length,
    admin: "Admin ready — ID: admin, PIN: 0000. CHANGE THIS PIN in Admin > Users.",
    auditor: "Read-only auditor login — ID: auditor, PIN: 0000.",
  });
}
