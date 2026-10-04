import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { apiErrorResponse, apiRoute, failedApiOperation } from "@/lib/api-error";

export const dynamic = "force-dynamic";

async function postConsult(req: Request) {
  const rl = rateLimit(`consult:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return apiErrorResponse(429, "طلبات كثيرة، انتظر قليلاً", "consult");

  let body: Record<string, unknown> | null;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return apiErrorResponse(400, "الحقول مطلوبة", "consult");
  }
  if (!body) return apiErrorResponse(400, "الحقول مطلوبة", "consult");
  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);
  const phone = String(body.phone || "").trim().slice(0, 40) || null;
  const message = String(body.message || "").trim().slice(0, 2000);
  if (!name || !email || !message) {
    return apiErrorResponse(400, "الحقول مطلوبة", "consult");
  }

  const db = supabaseAdmin();
  const { error } = await db.from("consult_requests").insert({ name, email, phone, message });
  if (error) return failedApiOperation("/api/consult", error, "consult");
  return NextResponse.json({ ok: true });
}

export const POST = apiRoute("/api/consult", postConsult, "consult");
