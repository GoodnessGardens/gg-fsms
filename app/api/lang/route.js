import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") === "es" ? "es" : "en";
  cookies().set("lang", to, { path: "/", maxAge: 31536000 });
  return NextResponse.redirect(new URL(url.searchParams.get("back") || "/dashboard", req.url));
}
