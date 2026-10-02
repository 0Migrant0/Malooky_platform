import { NextResponse } from "next/server";
import { stripeClient, stripeEnabled, siteUrl, currency } from "@/lib/stripe";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json(
      { error: "Stripe غير مهيأ — أضف STRIPE_SECRET_KEY و STRIPE_WEBHOOK_SECRET" },
      { status: 503 },
    );
  }

  const me = await getUserFromCookies().catch(() => null);
  const body = await req.json().catch(() => null);
  const type = String(body?.type || ""); // course | package | donation
  const db = supabaseAdmin();
  const stripe = stripeClient();
  const base = siteUrl();

  try {
    if (type === "donation") {
      const amountCents = Math.round(Number(body?.amountCents || 0));
      if (!amountCents || amountCents < 100) {
        return NextResponse.json({ error: "مبلغ غير صالح" }, { status: 400 });
      }
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

    if (!me) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });

    if (type === "course") {
      const courseId = String(body?.courseId || "");
      const { data: course } = await db.from("courses").select("id,title_ar,price_cents,is_free,stripe_price_id,is_free_preview").eq("id", courseId).maybeSingle();
      if (!course) return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = course as any;
      if (c.is_free) {
        // تسجيل مجاني فوري
        await db.from("access").upsert(
          { user_id: me.id, course_id: courseId, source: "free" },
          { onConflict: "user_id,course_id,level_id" },
        );
        return NextResponse.json({ url: `/my?enrolled=${courseId}` });
      }
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
      const { data: pkg } = await db.from("packages").select("*").eq("id", packageId).eq("is_active", true).maybeSingle();
      if (!pkg) return NextResponse.json({ error: "الباقة غير موجودة" }, { status: 404 });
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

    return NextResponse.json({ error: "نوع غير معروف" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
