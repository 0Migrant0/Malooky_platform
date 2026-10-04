import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { apiErrorResponse, apiRoute, failedApiOperation } from "@/lib/api-error";
import { setAuthSessionCookies } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

async function postLogin(req: Request) {
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return apiErrorResponse(429, "محاولات كثيرة، انتظر قليلاً", "login");

  let body: Record<string, unknown> | null;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return apiErrorResponse(400, "البريد وكلمة المرور مطلوبان", "login");
  }
  if (!body) return apiErrorResponse(400, "البريد وكلمة المرور مطلوبان", "login");
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  if (!email || !password) {
    return apiErrorResponse(400, "البريد وكلمة المرور مطلوبان", "login");
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 400 || error.status === 401) return apiErrorResponse(401, "بيانات الدخول غير صحيحة", "login");
    return failedApiOperation("/api/auth/login", error, "login");
  }
  if (!data.session) {
    return apiErrorResponse(401, "بيانات الدخول غير صحيحة", "login");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError) return failedApiOperation("/api/auth/login", profileError, "login");
  const role = profile?.role === "admin" ? "admin" : "student";

  const response = NextResponse.json({ ok: true, role });
  setAuthSessionCookies(response, data.session);
  return response;
}

export const POST = apiRoute("/api/auth/login", postLogin, "login");
