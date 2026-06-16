"use client";
import { useState } from "react";

export default function Login() {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, pin }),
    });
    if (r.ok) { window.location.href = "/dashboard"; return; }
    setErr((await r.json().catch(() => ({}))).error || "Login failed");
    setBusy(false);
  }

  return (
    <div className="hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/gg-logo.png" alt="Goodness Gardens" style={{ height: 110, display: "block", marginBottom: 8 }} />
      <div className="wordmark"><span>FOOD SAFETY</span><span>MANAGEMENT SYSTEM</span></div>
      <form className="loginbox" onSubmit={submit}>
        <label>Employee ID / ID de Empleado</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="off" autoFocus />
        <label>PIN</label>
        <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} style={{ marginBottom: 12 }} />
        {err && <div className="error" style={{ color: "#ffd7d7" }}>{err}</div>}
        <button disabled={busy || !code || !pin}>{busy ? "…" : "Enter / Entrar"}</button>
        <p className="muted" style={{ marginTop: 10 }}>
          Accounts are issued by your Food Safety administrator. · Las cuentas las emite su administrador de Inocuidad.
        </p>
      </form>
    </div>
  );
}
