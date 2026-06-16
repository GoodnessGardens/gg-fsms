import { sql } from "./db";

// Always read the CURRENT role from the database so admin role changes
// take effect immediately, without the user logging out and back in.
export async function liveRole(s) {
  if (!s) return null;
  try {
    const r = await sql`SELECT role FROM employees WHERE id = ${s.id} AND active = TRUE`;
    return r[0]?.role || s.role;
  } catch {
    return s.role;
  }
}

export const supRole = (r) => r === "supervisor" || r === "admin";
export const adminRole = (r) => r === "admin";

// This is a dedicated Food Safety app — every signed-in user has FS access.
export const fsAccess = (s) => !!s;

// Group scoping: a supervisor's group is their direct reports; fall back to department.
export async function teamIds(s) {
  try {
    const direct = await sql`SELECT id FROM employees WHERE manager_id = ${s.id} AND active = TRUE`;
    if (direct.length) return [s.id, ...direct.map((r) => r.id)];
    const dept = await sql`SELECT id FROM employees WHERE department = ${s.department} AND active = TRUE`;
    return [s.id, ...dept.map((r) => r.id)];
  } catch {
    return [s.id];
  }
}
