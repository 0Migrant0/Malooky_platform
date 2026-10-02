import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = rateLimit(`consult:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "طلبات كثيرة، انتظر قليلاً" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim().slice(0, 120);
  const email = String(body?.email || "").trim().slice(0, 160);
  const phone = String(body?.phone || "").trim().slice(0, 40) || null;
  const message = String(body?.message || "").trim().slice(0, 2000);
  if (!name || !email || !message) {
    return NextResponse.json({ error: "الحقول مطلوبة" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from("consult_requests").insert({ name, email, phone, message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
