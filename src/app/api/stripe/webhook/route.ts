import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Webhook — يمنح الوصول تلقائياً بعد نجاح الدفع */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const stripe = stripeClient();
  const sig = req.headers.get("stripe-signature") || "";
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const md = (session.metadata || {}) as Record<string, string>;
    const db = supabaseAdmin();

    if (md.kind === "donation") {
      await db.from("donations").insert({
        name: md.name || null,
        email: md.email || session.customer_details?.email || null,
        amount_cents: session.amount_total || 0,
        source: "stripe",
      });
    }

    if (md.kind === "course" && md.userId && md.courseId) {
      await db.from("access").upsert(
        { user_id: md.userId, course_id: md.courseId, source: "purchase" },
        { onConflict: "user_id,course_id,level_id" },
      );
    }

    if (md.kind === "package" && md.userId && md.packageId) {
      const { data: pkg } = await db.from("packages").select("course_ids,all_courses").eq("id", md.packageId).maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = pkg as any;
      let courseIds: string[] = [];
      if (p?.all_courses || !p?.course_ids) {
        const { data: all } = await db.from("courses").select("id").eq("is_published", true);
        courseIds = (all || []).map((x: { id: string }) => x.id);
      } else {
        courseIds = p.course_ids as string[];
      }
      if (courseIds.length > 0) {
        await db.from("access").upsert(
          courseIds.map((cid) => ({ user_id: md.userId, course_id: cid, source: "purchase" })),
          { onConflict: "user_id,course_id,level_id" },
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
