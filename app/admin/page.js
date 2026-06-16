import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { sql } from "../../lib/db";
import { liveRole, adminRole } from "../../lib/roles";
import UsersAdmin from "./UsersAdmin";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!adminRole(await liveRole(s))) redirect("/dashboard");

  const employees = await sql`SELECT id, code, name, role, department, site, active,
    (pin_hash IS NOT NULL) AS has_pin FROM employees ORDER BY name`;

  return (
    <div>
      <h1>Admin</h1>
      <UsersAdmin employees={JSON.parse(JSON.stringify(employees))} />
    </div>
  );
}
