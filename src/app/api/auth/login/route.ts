import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "محاولات كثيرة، انتظر قليلاً" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").toLowerCase().trim();
  const password = String(body?.password || "");
  if (!email || !password) {
    return NextResponse.json({ error: "البريد وكلمة المرور مطلوبان" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  const role = profile?.role === "admin" ? "admin" : "student";

  const res = NextResponse.json({ ok: true, role });
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
  res.cookies.set("sb-access-token", data.session.access_token, opts);
  if (data.session.refresh_token) {
    res.cookies.set("sb-refresh-token", data.session.refresh_token, opts);
  }
  return res;
}
