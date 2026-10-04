import { NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { apiErrorResponse, apiRoute, failedApiOperation } from "@/lib/api-error";
import { setAuthSessionCookies } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function postSignup(req: Request) {
  const rl = rateLimit(`signup:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return apiErrorResponse(429, "محاولات كثيرة، انتظر قليلاً", "signup");

  let body: Record<string, unknown> | null;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return apiErrorResponse(400, "بيانات التسجيل غير صالحة", "signup");
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (email.length > 254 || !EMAIL_PATTERN.test(email) || password.length < 8 || password.length > 128) {
    return apiErrorResponse(400, "بيانات التسجيل غير صالحة", "signup");
  }

  const { data, error } = await supabaseAuth().auth.signUp({ email, password });
  if (error) {
    if (error.status === 400 || error.status === 422 || error.code === "user_already_exists") {
      return apiErrorResponse(400, "تعذّر إنشاء الحساب. تحقق من البيانات وحاول مجدداً.", "signup");
    }
    return failedApiOperation("/api/auth/signup", error, "signup");
  }
  if (!data.user) return failedApiOperation("/api/auth/signup", new Error("Signup returned no user"), "signup");

  if (!data.session) {
    return NextResponse.json({ ok: true, role: "student", confirmationRequired: true }, { status: 201 });
  }
  const response = NextResponse.json({ ok: true, role: "student" }, { status: 201 });
  setAuthSessionCookies(response, data.session);
  return response;
}

export const POST = apiRoute("/api/auth/signup", postSignup, "signup");
