import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { sql } from "../../../lib/db";
import { liveRole, fsAccess, canEdit } from "../../../lib/roles";
import primus from "../../../content/primusgfs_v4_modules.json";
import sitesCfg from "../../../content/sites.json";
import AuditClient from "./AuditClient";

export const dynamic = "force-dynamic";

export default async function FsAudit() {
  const s = await getSession();
  if (!s) redirect("/login");
  const role = await liveRole(s);
  if (!fsAccess(s, role)) redirect("/dashboard");
  const history = await sql`SELECT a.id, a.module, a.module_no, a.site, a.compliant, a.noncompliant, a.na, a.pct, a.autofail, a.created_at, e.name AS auditor_name
    FROM fs_audits a JOIN employees e ON e.id = a.auditor ORDER BY a.created_at DESC LIMIT 50`;
  return (
    <AuditClient
      modules={primus.modules}
      sites={sitesCfg.sites}
      history={JSON.parse(JSON.stringify(history))}
      defaultSite={s.site || ""}
      readOnly={!canEdit(role)}
    />
  );
}
