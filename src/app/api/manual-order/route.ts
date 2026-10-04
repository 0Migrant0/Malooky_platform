import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { apiErrorResponse, apiRoute, failedApiOperation } from "@/lib/api-error";

export const dynamic = "force-dynamic";

async function postManualOrder(req: Request) {
  const rl = rateLimit(`manual:${clientIp(req)}`, 6, 60_000);
  if (!rl.ok) return apiErrorResponse(429, "طلبات كثيرة", "manual-order");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiErrorResponse(400, "الحقول والإثبات مطلوبة", "manual-order");
  }
  const courseId = String(form.get("courseId") || "");
  const packageId = String(form.get("packageId") || "");
  const levelId = String(form.get("levelId") || "");
  const whatsapp = String(form.get("whatsapp") || "").trim().slice(0, 40);
  const fullName = String(form.get("fullName") || "").trim().slice(0, 120);
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 160);
  const proofValue = form.get("proof");
  const proof = proofValue instanceof File ? proofValue : null;

  if (!whatsapp || !proof || !email) {
    return apiErrorResponse(400, "الحقول والإثبات مطلوبة", "manual-order");
  }
  if (proof.size > 8 * 1024 * 1024) {
    return apiErrorResponse(400, "حجم الصورة كبير (الحد 8MB)", "manual-order");
  }

  const me = await getUserFromCookies({ throwOnError: true });
  const db = supabaseAdmin();

  // تخزين الإثبات في bucket خاص (private)
  const ext = (proof.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `proofs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await proof.arrayBuffer());
  const { error: upErr } = await db.storage
    .from("manual-proofs")
    .upload(path, buf, { contentType: proof.type || "image/jpeg" });
  if (upErr) return failedApiOperation("/api/manual-order", upErr, "manual-order");

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
  if (error) {
    await db.storage.from("manual-proofs").remove([path]).catch(() => undefined);
    return failedApiOperation("/api/manual-order", error, "manual-order");
  }

  return NextResponse.json({ ok: true });
}

export const POST = apiRoute("/api/manual-order", postManualOrder, "manual-order");
