import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api-error";

export const dynamic = "force-dynamic";

async function postLogout() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
  response.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });
  return response;
}

export const POST = apiRoute("/api/auth/logout", postLogout);
