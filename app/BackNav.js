"use client";
import { usePathname, useRouter } from "next/navigation";

// Global back button — shown on every page except the dashboard and login.
export default function BackNav({ label }) {
  const router = useRouter();
  const path = usePathname();
  if (!path || path === "/" || path === "/dashboard" || path === "/login") return null;
  return (
    <button type="button" className="backnav"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push("/dashboard");
      }}>
      ← {label}
    </button>
  );
}
