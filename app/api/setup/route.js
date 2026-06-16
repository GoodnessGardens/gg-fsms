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

  // Seed the controlled-document register (preserves any edits)
  for (const d of fsRegister.documents) {
    await sql`INSERT INTO fs_documents (doc_no, title, module, doctype)
      VALUES (${d.doc_no}, ${d.title}, ${d.module}, ${d.doctype})
      ON CONFLICT (doc_no) DO UPDATE SET title = EXCLUDED.title, module = EXCLUDED.module, doctype = EXCLUDED.doctype
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

  return NextResponse.json({
    ok: true,
    documents: fsRegister.documents.length,
    checklists: checklists.length,
    admin: "Admin ready — ID: admin, PIN: 0000. CHANGE THIS PIN in Admin > Users.",
  });
}
