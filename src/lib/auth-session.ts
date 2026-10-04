import type { Session } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";

export function setAuthSessionCookies(response: NextResponse, session: Pick<Session, "access_token" | "refresh_token">): void {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };

  response.cookies.set("sb-access-token", session.access_token, options);
  if (session.refresh_token) response.cookies.set("sb-refresh-token", session.refresh_token, options);
}
