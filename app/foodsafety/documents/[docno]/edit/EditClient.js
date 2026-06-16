"use client";
import { useState } from "react";

export default function EditClient({ model }) {
  const [m, setM] = useState(model);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true); setErr(""); setSaved(false);
    const r = await fetch("/api/editfsdoc", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(data.error || "Save failed");
    setSaved(true);
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <h1>Edit FS Document — {m.doc_no}</h1>
      <div className="notice">
        Formatting: &quot;## SECTION HEADING&quot; starts a section (Objective, Scope, Procedure…) · &quot;- item&quot; or a plain line under it becomes a numbered/bulleted entry.
      </div>
      {err && <div className="error">{err}</div>}
      {saved && <div className="notice">✅ Saved. The document is updated immediately and protected from future setup overwrites. <a href={`/foodsafety/documents/${encodeURIComponent(m.doc_no)}`}>View it →</a></div>}

      <div className="card">
        <div className="row">
          <div><label>Document title</label>
            <input value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} /></div>
          <div style={{ maxWidth: 200 }}><label>Record type</label>
            <input value={m.doctype} onChange={(e) => setM({ ...m, doctype: e.target.value })} /></div>
        </div>
        <label>Document content</label>
        <textarea rows={24} value={m.text} onChange={(e) => setM({ ...m, text: e.target.value })}
          style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }} />
      </div>

      <p style={{ display: "flex", gap: 10 }}>
        <button onClick={save} disabled={busy}>{busy ? "Saving…" : "💾 Save changes"}</button>
        <a className="btn secondary" href={`/foodsafety/documents/${encodeURIComponent(m.doc_no)}`}>Cancel</a>
      </p>
      <p className="muted">Note: the printable PDF still shows the original version until we regenerate it — the in-app document is the controlled current copy.</p>
    </div>
  );
}
