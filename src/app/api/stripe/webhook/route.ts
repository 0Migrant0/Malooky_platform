import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { apiErrorResponse, apiRoute, failedApiOperation } from "@/lib/api-error";

export const dynamic = "force-dynamic";

/** Webhook — grants access only after every required persistence operation succeeds. */
async function postWebhook(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return apiErrorResponse(503, "not configured");

  const stripe = stripeClient();
  const sig = req.headers.get("stripe-signature") || "";
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch {
    return apiErrorResponse(400, "invalid signature");
  }

  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = (session.metadata || {}) as Record<string, string>;
  const db = supabaseAdmin();

  if (metadata.kind === "donation") {
    const { error } = await db.from("donations").insert({
      name: metadata.name || null,
      email: metadata.email || session.customer_details?.email || null,
      amount_cents: session.amount_total || 0,
      source: "stripe",
    });
    if (error) return failedApiOperation("/api/stripe/webhook", error);
  }

  if (metadata.kind === "course" && metadata.userId && metadata.courseId) {
    const { error } = await db.from("access").upsert(
      { user_id: metadata.userId, course_id: metadata.courseId, source: "purchase" },
      { onConflict: "user_id,course_id,level_id" },
    );
    if (error) return failedApiOperation("/api/stripe/webhook", error);
  }

  if (metadata.kind === "package" && metadata.userId && metadata.packageId) {
    const { data: pkg, error: packageError } = await db.from("packages")
      .select("course_ids,all_courses").eq("id", metadata.packageId).maybeSingle();
    if (packageError) return failedApiOperation("/api/stripe/webhook", packageError);
    if (!pkg) return apiErrorResponse(404, "الباقة غير موجودة");

    let courseIds: string[];
    if (pkg.all_courses || !pkg.course_ids) {
      const { data: courses, error: coursesError } = await db.from("courses")
        .select("id").eq("is_published", true);
      if (coursesError) return failedApiOperation("/api/stripe/webhook", coursesError);
      courseIds = (courses || []).map((course: { id: string }) => course.id);
    } else {
      courseIds = pkg.course_ids as string[];
    }

    if (courseIds.length > 0) {
      const { error } = await db.from("access").upsert(
        courseIds.map((courseId) => ({ user_id: metadata.userId, course_id: courseId, source: "purchase" })),
        { onConflict: "user_id,course_id,level_id" },
      );
      if (error) return failedApiOperation("/api/stripe/webhook", error);
    }
  }

  return NextResponse.json({ received: true });
}

export const POST = apiRoute("/api/stripe/webhook", postWebhook);
