import { redirect, notFound } from "next/navigation";
import { getSession } from "../../../../../lib/auth";
import { sql } from "../../../../../lib/db";
import { liveRole, adminRole } from "../../../../../lib/roles";
import { secsToText } from "../../../../../lib/content";
import docs from "../../../../../content/fs_docs.json";
import EditClient from "./EditClient";

export const dynamic = "force-dynamic";

export default async function EditFsDoc({ params }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const no = decodeURIComponent(params.docno);
  if (!adminRole(await liveRole(s))) redirect(`/foodsafety/documents/${encodeURIComponent(no)}`);

  let dbDoc = null;
  try {
    const rows = await sql`SELECT doc_no, title, doctype, module, content FROM fs_documents WHERE doc_no = ${no}`;
    dbDoc = rows[0] || null;
  } catch {}
  const fallback = docs[no];
  if (!dbDoc && !fallback) notFound();

  const sections = dbDoc?.content?.sections || fallback?.sections || [];
  const model = {
    doc_no: no,
    title: dbDoc?.title || fallback?.title || no,
    doctype: dbDoc?.doctype || fallback?.doctype || "SOP",
    text: secsToText(sections),
  };
  return <EditClient model={model} />;
}
