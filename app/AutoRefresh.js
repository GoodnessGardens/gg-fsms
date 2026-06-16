"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keeps every page's data fresh without manual reloads:
// re-fetches server data when the tab regains focus and every 60 seconds.
export default function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const t = setInterval(refresh, 60000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(t);
    };
  }, [router]);
  return null;
}
