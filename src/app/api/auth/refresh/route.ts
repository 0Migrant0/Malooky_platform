import { NextResponse } from "next/server";
import { supabaseAdminAuth } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { apiRoute } from "@/lib/api-error";
import { setAuthSessionCookies } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

/** مسار رجوع داخلي فقط — يمنع أي تحويل لموقع خارجي (open redirect). */
function safeNext(raw: string | null): string {
  if (!raw) return "/dash";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/dash";
  return raw;
}

async function getRefresh(req: Request) {
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  const login = NextResponse.redirect(new URL("/login", req.url));
  const rl = rateLimit(`refresh:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return login;

  const { cookies } = await import("next/headers");
  const refreshToken = (await cookies()).get("sb-refresh-token")?.value || null;
  if (!refreshToken) return login;

  const { data, error } = await supabaseAdminAuth().auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return login;

  const response = NextResponse.redirect(new URL(next, req.url));
  setAuthSessionCookies(response, data.session);
  return response;
}

export const GET = apiRoute("/api/auth/refresh", getRefresh);
