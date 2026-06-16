import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { sql } from "../../../lib/db";
import { liveRole, fsAccess } from "../../../lib/roles";
import audits from "../../../content/fs_audits.json";
import AuditClient from "./AuditClient";

export const dynamic = "force-dynamic";

export default async function FsAudit() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!fsAccess(s, await liveRole(s))) redirect("/dashboard");
  const history = await sql`SELECT a.id, a.module, a.site, a.compliant, a.noncompliant, a.na, a.created_at, e.name AS auditor_name
    FROM fs_audits a JOIN employees e ON e.id = a.auditor ORDER BY a.created_at DESC LIMIT 50`;
  return <AuditClient modules={audits.modules} history={JSON.parse(JSON.stringify(history))} defaultSite={s.site || ""} />;
}
