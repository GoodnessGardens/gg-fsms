import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "change-me-in-vercel-env");

export async function createSession(user) {
  const token = await new SignJWT({
    id: user.id, code: user.code, name: user.name, role: user.role,
    department: user.department, site: user.site,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());
  cookies().set("session", token, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 2592000 });
}

export async function getSession() {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().set("session", "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function isSupervisor(s) { return s && (s.role === "supervisor" || s.role === "admin"); }
export function isAdmin(s) { return s && s.role === "admin"; }
