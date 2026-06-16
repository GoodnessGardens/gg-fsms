import "./globals.css";
import { getSession } from "../lib/auth";
import { getLang, t } from "../lib/i18n";
import { liveRole, adminRole } from "../lib/roles";
import AutoRefresh from "./AutoRefresh";
import BackNav from "./BackNav";
import Sidebar from "./Sidebar";

export const metadata = { title: "Goodness Gardens — Food Safety Management System" };
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const s = await getSession();
  const role = s ? await liveRole(s) : null;
  const admin = s ? adminRole(role) : false;
  const lang = getLang();
  const S = t(lang);
  const other = lang === "es" ? "en" : "es";
  const G = (en, es) => (lang === "es" ? es : en);

  const items = s
    ? [
        { href: "/dashboard", label: S.home, icon: "home" },
        { sec: G("Food Safety", "Inocuidad") },
        { href: "/foodsafety/documents", label: G("Document Register", "Registro de Documentos"), icon: "folder" },
        { href: "/foodsafety/audit", label: G("Primus Self-Audits", "Auto-Auditorías Primus"), icon: "shield" },
        { href: "/foodsafety/deviations", label: G("Deviations & CAPA", "Desviaciones y CAPA"), icon: "alert" },
        { href: "/checklists", label: G("Checklists", "Listas de Verificación"), icon: "check" },
        { sec: G("My Account", "Mi Cuenta") },
        ...(admin ? [{ href: "/admin", label: S.admin, icon: "chart" }] : []),
      ]
    : [];

  return (
    <html lang={lang}>
      <body>
        <AutoRefresh />
        <div className="appwrap">
          {s && (
            <Sidebar items={items}
              langHref={`/api/lang?to=${other}`}
              langLabel={other === "es" ? "Español" : "English"}
              logoutLabel={S.logout}
              collapseLabel={G("Collapse", "Contraer")} />
          )}
          <div className="mainarea">
            <div className="topbar">
              <div style={{ width: 150 }} />
              <a href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/gg-logo.png" alt="Goodness Gardens" style={{ height: 46, display: "block" }} />
                <span style={{ fontWeight: 800, color: "var(--green-dark)", fontSize: 15, lineHeight: 1.1 }}>Food Safety<br />Management System</span>
              </a>
              {s ? (
                <a className="profilechip" href="/dashboard"
                  title={`${s.name} · ${s.department}${s.site ? ` · ${s.site}` : ""}`}>
                  <span className="avatar">{s.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
                  <span className="pname">{s.name.split(/\s+/)[0]}</span>
                </a>
              ) : <div style={{ width: 150 }} />}
            </div>
            <div className="shell">
              {s && <BackNav label={G("Back", "Regresar")} />}
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
