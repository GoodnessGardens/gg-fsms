import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { liveRole, fsAccess } from "../../../../lib/roles";
import NewDeviationClient from "./NewDeviationClient";

export const dynamic = "force-dynamic";

export default async function NewDeviation() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!fsAccess(s, await liveRole(s))) redirect("/dashboard");
  return <NewDeviationClient defaultSite={s.site || ""} />;
}
