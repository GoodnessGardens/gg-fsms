import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { liveRole, fsAccess } from "../../../lib/roles";
import register from "../../../content/fs_register.json";
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";

export default async function FsDocuments() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!fsAccess(s, await liveRole(s))) redirect("/dashboard");
  return <RegisterClient docs={register.documents} />;
}
