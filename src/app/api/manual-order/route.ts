import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = rateLimit(`manual:${clientIp(req)}`, 6, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "طلبات كثيرة" }, { status: 429 });

  const form = await req.formData();
  const courseId = String(form.get("courseId") || "");
  const packageId = String(form.get("packageId") || "");
  const levelId = String(form.get("levelId") || "");
  const whatsapp = String(form.get("whatsapp") || "").trim().slice(0, 40);
  const fullName = String(form.get("fullName") || "").trim().slice(0, 120);
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 160);
  const proof = form.get("proof") as File | null;

  if (!whatsapp || !proof || !email) {
    return NextResponse.json({ error: "الحقول والإثبات مطلوبة" }, { status: 400 });
  }
  if (proof.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم الصورة كبير (الحد 8MB)" }, { status: 400 });
  }

  const me = await getUserFromCookies().catch(() => null);
  const db = supabaseAdmin();

  // تخزين الإثبات في bucket خاص (private)
  const ext = (proof.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `proofs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await proof.arrayBuffer());
  const { error: upErr } = await db.storage
    .from("manual-proofs")
    .upload(path, buf, { contentType: proof.type || "image/jpeg" });
  if (upErr && !String(upErr.message).includes("exist")) {
    return NextResponse.json({ error: "تعذّر رفع الإثبات: " + upErr.message }, { status: 500 });
  }

  const { error } = await db.from("manual_orders").insert({
    user_id: me?.id || null,
    email,
    full_name: fullName || null,
    package_id: packageId || null,
    course_id: courseId || null,
    level_id: levelId || null,
    proof_url: path,
    whatsapp,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
