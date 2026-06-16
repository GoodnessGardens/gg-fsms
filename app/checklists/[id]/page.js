import { redirect, notFound } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { sql } from "../../../lib/db";
import { getLang, t } from "../../../lib/i18n";
import ChecklistClient from "./ChecklistClient";

export const dynamic = "force-dynamic";

export default async function ChecklistPage({ params }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const lang = getLang();
  const S = t(lang);
  const id = decodeURIComponent(params.id);
  const rows = await sql`SELECT * FROM checklists WHERE id = ${id}`;
  if (!rows[0]) notFound();
  const c = rows[0];
  const items = c.items.map((it) => (typeof it === "string" ? it : it[lang] || it.en));
  const itemsEn = c.items.map((it) => (typeof it === "string" ? it : it.en));
  const strings = {
    site: S.site, shift: S.shift, unit: S.unit, ok: S.ok, action: S.action, na: S.na,
    describeIssue: S.describeIssue, submit: S.submitChecklist, submitting: S.submitting,
    markEvery: S.markEvery, submitted: S.submitted, issuesWarn: S.issuesWarn, back: S.backChecklists,
  };
  return (
    <div>
      <h1>{lang === "es" && c.title_es ? c.title_es : c.title}</h1>
      <p className="muted">{lang === "es" && c.note_es ? c.note_es : c.note}</p>
      <ChecklistClient id={c.id} items={items} itemsEn={itemsEn} defaultSite={s.site || ""} strings={strings} />
    </div>
  );
}
