import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "../../../lib/db";
import { createSession } from "../../../lib/auth";

export async function POST(req) {
  const { code, pin } = await req.json();
  if (!code || !pin) return NextResponse.json({ error: "Enter ID and PIN" }, { status: 400 });
  const rows = await sql`SELECT * FROM employees WHERE lower(code) = lower(${code.trim()}) AND active = TRUE`;
  const user = rows[0];
  if (user && !user.pin_hash)
    return NextResponse.json({ error: "Account not activated yet — ask your administrator to set your PIN." }, { status: 401 });
  if (!user || !(await bcrypt.compare(pin, user.pin_hash)))
    return NextResponse.json({ error: "Invalid ID or PIN" }, { status: 401 });
  await createSession(user);
  return NextResponse.json({ ok: true });
}
