import { redirect } from "next/navigation";
import { getSession, isSupervisor } from "../../lib/auth";
import { sql } from "../../lib/db";
import { getLang, t } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function Checklists() {
  const s = await getSession();
  if (!s) redirect("/login");
  const lang = getLang();
  const S = t(lang);
  const lists = await sql`SELECT id, title, title_es, department FROM checklists ORDER BY id`;
  const recent = await sql`
    SELECT cs.id, cs.created_at, cs.has_issues, cs.site, c.title, c.title_es, e.name
    FROM checklist_submissions cs
    JOIN checklists c ON c.id = cs.checklist_id
    JOIN employees e ON e.id = cs.employee_id
    ORDER BY cs.created_at DESC LIMIT ${isSupervisor(s) ? 50 : 10}`;
  const lt = (r) => (lang === "es" && r.title_es ? r.title_es : r.title);
  return (
    <div>
      <h1>{S.inspChecklists}</h1>
      <div className="card">
        <table>
          <thead><tr><th>{S.checklist}</th><th>{S.dept}</th><th></th></tr></thead>
          <tbody>
            {lists.map((c) => (
              <tr key={c.id}>
                <td>{lt(c)}</td><td>{c.department}</td>
                <td><a href={`/checklists/${encodeURIComponent(c.id)}`}>{S.start}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2>{S.recent}</h2>
        <table>
          <thead><tr><th>{S.date}</th><th>{S.checklist}</th><th>{S.by}</th><th>{S.site}</th><th>{S.status}</th></tr></thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString(lang === "es" ? "es-MX" : "en-US")}</td>
                <td>{lt(r)}</td><td>{r.name}</td><td>{r.site || "—"}</td>
                <td>{r.has_issues ? <span className="pill warn">{S.needsAction}</span> : <span className="pill good">{S.allOk}</span>}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={5}>{S.noSubs}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
