import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { liveRole, adminRole } from "../../../lib/roles";

export async function POST(req) {
  const s = await getSession();
  if (!s || !adminRole(await liveRole(s))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const b = await req.json();

  if (b.kind === "create") {
    const code = (b.code || "").trim();
    const name = (b.name || "").trim();
    if (!code || !name) return NextResponse.json({ error: "Employee ID and name are required" }, { status: 400 });
    const pin_hash = b.pin ? await bcrypt.hash(String(b.pin), 10) : null;
    const exists = await sql`SELECT id FROM employees WHERE lower(code) = lower(${code})`;
    if (exists[0]) return NextResponse.json({ error: "That Employee ID already exists" }, { status: 400 });
    await sql`INSERT INTO employees (code, name, pin_hash, role, department, site)
      VALUES (${code}, ${name}, ${pin_hash}, ${b.role || "employee"}, ${b.department || "Food Safety"}, ${(b.site || "").toUpperCase().slice(0, 2)})`;
    return NextResponse.json({ ok: true });
  }
  if (b.kind === "reset-pin") {
    if (!b.id || !b.pin) return NextResponse.json({ error: "PIN required" }, { status: 400 });
    await sql`UPDATE employees SET pin_hash = ${await bcrypt.hash(String(b.pin), 10)} WHERE id = ${b.id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.kind === "role") {
    await sql`UPDATE employees SET role = ${b.role} WHERE id = ${b.id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.kind === "toggle") {
    await sql`UPDATE employees SET active = NOT active WHERE id = ${b.id}`;
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
