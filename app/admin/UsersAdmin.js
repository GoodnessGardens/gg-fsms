"use client";
import { useState } from "react";

const DEPTS = ["Food Safety", "Quality Control", "Receiving", "Inventory", "Packing", "Shipping", "Greenhouse", "Maintenance", "Office / Admin"];
const SITES = ["NY", "FL", "VA", "IN", "TX", "PA"];

export default function UsersAdmin({ employees }) {
  const [f, setF] = useState({ code: "", name: "", pin: "", role: "employee", department: "Food Safety", site: "NY" });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function call(body) {
    setErr(""); setMsg("");
    const r = await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || "Failed"); return null; }
    return d;
  }
  async function add(e) {
    e.preventDefault(); setBusy(true);
    const ok = await call({ kind: "create", ...f });
    setBusy(false);
    if (ok) window.location.reload();
  }
  async function resetPin(id, name) {
    const pin = prompt(`New PIN for ${name} (4–6 digits):`);
    if (pin && (await call({ kind: "reset-pin", id, pin }))) setMsg(`PIN updated for ${name}.`);
  }
  async function toggle(id) { if (await call({ kind: "toggle", id })) window.location.reload(); }
  async function setRole(id, role) { if (await call({ kind: "role", id, role })) window.location.reload(); }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Users</h2>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Dept</th><th>Site</th><th>Login</th><th></th></tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} style={{ opacity: e.active ? 1 : 0.5 }}>
                <td>{e.code}</td>
                <td>{e.name}</td>
                <td>
                  <select value={e.role} onChange={(ev) => setRole(e.id, ev.target.value)} style={{ margin: 0, padding: "4px 6px" }}>
                    <option value="employee">employee</option>
                    <option value="supervisor">supervisor</option>
                    <option value="auditor">auditor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{e.department}</td>
                <td>{e.site || "—"}</td>
                <td>{e.has_pin ? "PIN set" : <span className="pill warn">No PIN</span>}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a style={{ cursor: "pointer" }} onClick={() => resetPin(e.id, e.name)}>Set PIN</a>{" · "}
                  <a style={{ cursor: "pointer" }} onClick={() => toggle(e.id)}>{e.active ? "Deactivate" : "Reactivate"}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="card" onSubmit={add}>
        <h2 style={{ marginTop: 0 }}>Add user</h2>
        <div className="row">
          <div><label>Employee ID *</label><input value={f.code} onChange={set("code")} required /></div>
          <div><label>Name *</label><input value={f.name} onChange={set("name")} required /></div>
          <div><label>PIN (optional)</label><input value={f.pin} onChange={set("pin")} inputMode="numeric" placeholder="leave blank to set later" /></div>
        </div>
        <div className="row">
          <div><label>Role</label>
            <select value={f.role} onChange={set("role")}>
              <option value="employee">employee</option>
              <option value="supervisor">supervisor</option>
              <option value="auditor">auditor (read-only, all sites)</option>
              <option value="admin">admin</option>
            </select></div>
          <div><label>Department</label>
            <select value={f.department} onChange={set("department")}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div><label>Site</label>
            <select value={f.site} onChange={set("site")}>{SITES.map((x) => <option key={x}>{x}</option>)}</select></div>
        </div>
        {err && <div className="error">{err}</div>}
        {msg && <div className="notice">{msg}</div>}
        <button disabled={busy}>{busy ? "…" : "Add User"}</button>
      </form>
    </div>
  );
}
