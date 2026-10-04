import { NextResponse } from "next/server";
import { stripeClient, stripeEnabled, siteUrl, currency } from "@/lib/stripe";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import { apiErrorResponse, apiRoute, failedApiOperation } from "@/lib/api-error";

export const dynamic = "force-dynamic";

async function postCheckout(req: Request) {
  if (!stripeEnabled()) {
    return apiErrorResponse(503, "الدفع غير متاح حالياً، حاول مرة أخرى لاحقاً.");
  }

  let body: Record<string, unknown> | null;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return apiErrorResponse(400, "نوع غير معروف", "checkout");
  }
  if (!body) return apiErrorResponse(400, "نوع غير معروف", "checkout");
  const type = String(body.type || "");
  if (type !== "donation" && type !== "course" && type !== "package") return apiErrorResponse(400, "نوع غير معروف", "checkout");
  try {
    const me = type === "donation" ? null : await getUserFromCookies({ throwOnError: true });
    const db = type === "donation" ? null : supabaseAdmin();
    const stripe = stripeClient();
    if (type === "donation") {
      const rawAmount = body.amountCents;
      const amountCents = typeof rawAmount === "number" ? rawAmount : NaN;
      if (!Number.isSafeInteger(amountCents) || amountCents < 100) {
        return apiErrorResponse(400, "مبلغ غير صالح", "donation");
      }
      const base = siteUrl();
      if (!base) return apiErrorResponse(503, undefined, "checkout");
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: currency().toLowerCase(),
              product_data: { name: "تبرع لدعم منصة ملوكي" },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata: { kind: "donation", name: String(body?.name || ""), email: String(body?.email || "") },
        success_url: `${base}/donate?thanks=1`,
        cancel_url: `${base}/donate`,
      });
      return NextResponse.json({ url: session.url });
    }

    if (!me) return apiErrorResponse(401, "تسجيل الدخول مطلوب", "checkout");

    if (type === "course") {
      const courseId = String(body?.courseId || "");
      const { data: course, error: courseError } = await db!.from("courses").select("id,title_ar,price_cents,is_free,stripe_price_id,is_free_preview").eq("id", courseId).maybeSingle();
      if (courseError) return failedApiOperation("/api/stripe/checkout", courseError, "checkout");
      if (!course) return apiErrorResponse(404, "الكورس غير موجود", "checkout");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = course as any;
      if (c.is_free) {
        // تسجيل مجاني فوري
        const { error: accessError } = await db!.from("access").upsert(
          { user_id: me.id, course_id: courseId, source: "free" },
          { onConflict: "user_id,course_id,level_id" },
        );
        if (accessError) return failedApiOperation("/api/stripe/checkout", accessError, "checkout");
        return NextResponse.json({ url: `/my?enrolled=${courseId}` });
      }
      const base = siteUrl();
      if (!base) return apiErrorResponse(503, undefined, "checkout");
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: c.stripe_price_id
          ? [{ price: c.stripe_price_id, quantity: 1 }]
          : [
              {
                price_data: {
                  currency: currency().toLowerCase(),
                  product_data: { name: c.title_ar },
                  unit_amount: c.price_cents ?? 0,
                },
                quantity: 1,
              },
            ],
        metadata: { kind: "course", courseId, userId: me.id },
        customer_email: me.email,
        success_url: `${base}/my?checkout=success`,
        cancel_url: `${base}/courses?checkout=cancel`,
      });
      return NextResponse.json({ url: session.url });
    }

    if (type === "package") {
      const packageId = String(body?.packageId || "");
      const { data: pkg, error: packageError } = await db!.from("packages").select("*").eq("id", packageId).eq("is_active", true).maybeSingle();
      if (packageError) return failedApiOperation("/api/stripe/checkout", packageError, "checkout");
      if (!pkg) return apiErrorResponse(404, "الباقة غير موجودة", "checkout");
      const base = siteUrl();
      if (!base) return apiErrorResponse(503, undefined, "checkout");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = pkg as any;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: p.stripe_price_id
          ? [{ price: p.stripe_price_id, quantity: 1 }]
          : [
              {
                price_data: {
                  currency: currency().toLowerCase(),
                  product_data: { name: p.title_ar },
                  unit_amount: p.price_cents,
                },
                quantity: 1,
              },
            ],
        metadata: { kind: "package", packageId, userId: me.id },
        customer_email: me.email,
        success_url: `${base}/my?checkout=success`,
        cancel_url: `${base}/courses?checkout=cancel`,
      });
      return NextResponse.json({ url: session.url });
    }

    return apiErrorResponse(400, "نوع غير معروف", "checkout");
  } catch (e) {
    return failedApiOperation("/api/stripe/checkout", e, type === "donation" ? "donation" : "checkout");
  }
}

export const POST = apiRoute("/api/stripe/checkout", postCheckout, "checkout");
