"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const I = (paths) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);

const ICONS = {
  home: I(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>),
  book: I(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>),
  clipboard: I(<><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 2h6v4H9z" /><path d="m9 14 2 2 4-4" /></>),
  calendar: I(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>),
  check: I(<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="m8 12 3 3 5-6" /></>),
  alert: I(<><path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9v5" /><path d="M12 17.5h.01" /></>),
  filetext: I(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></>),
  folder: I(<><path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>),
  quiz: I(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7" /><path d="M12 17h.01" /></>),
  user: I(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></>),
  shield: I(<><path d="M12 3 4.5 6v5c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10V6z" /><path d="m9 12 2 2 4-4" /></>),
  chart: I(<><path d="M4 20V10M10 20V4M16 20v-8M21 20H3" /></>),
  globe: I(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></>),
  logout: I(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>),
};

export default function Sidebar({ items, langHref, langLabel, logoutLabel, collapseLabel }) {
  const [collapsed, setCollapsed] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("gg-sb");
    if (saved === "1") setCollapsed(true);
    else if (saved === null && window.innerWidth < 760) setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try { localStorage.setItem("gg-sb", c ? "0" : "1"); } catch {}
      return !c;
    });
  };

  const active = (href) => (href === "/dashboard" ? path === "/dashboard" : path?.startsWith(href));

  return (
    <nav className={`sidebar${collapsed ? " sbcollapsed" : ""}`}>
      <button type="button" className="sblink sbtoggle" onClick={toggle}
        title={collapsed ? "Expand" : collapseLabel}>
        {I(collapsed
          ? <path d="m9 18 6-6-6-6" />
          : <path d="m15 18-6-6 6-6" />)}
        <span className="sblabel">{collapseLabel}</span>
      </button>

      {items.map((it) =>
        it.sec ? (
          <div key={it.sec} className="sbsec sblabel">{it.sec}</div>
        ) : (
          <a key={it.href} href={it.href} title={it.label}
            className={`sblink${active(it.href) ? " active" : ""}`}>
            {ICONS[it.icon] || ICONS.folder}
            <span className="sblabel">{it.label}</span>
          </a>
        )
      )}

      <div className="sbspacer" />
      <a href={langHref} className="sblink" title={langLabel}>
        {ICONS.globe}<span className="sblabel">{langLabel}</span>
      </a>
      <a href="/api/logout" className="sblink" title={logoutLabel}>
        {ICONS.logout}<span className="sblabel">{logoutLabel}</span>
      </a>
    </nav>
  );
}
