import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { liveRole, fsAccess } from "../../../lib/roles";
import register from "../../../content/fs_register.json";
import primus from "../../../content/primusgfs_v4_modules.json";
import sitesCfg from "../../../content/sites.json";
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";

export default async function FsDocuments() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!fsAccess(s, await liveRole(s))) redirect("/dashboard");
  return <RegisterClient docs={register.documents} modules={primus.modules} sites={sitesCfg.sites} />;
}
