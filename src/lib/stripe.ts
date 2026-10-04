import Stripe from "stripe";
import { configuredSiteOrigin } from "@/lib/site-origin";

let cached: Stripe | null = null;

export function stripeClient(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");
  cached = new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
  return cached;
}

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function siteUrl(): string | null {
  return configuredSiteOrigin();
}

export function currency(): string {
  return process.env.NEXT_PUBLIC_CURRENCY || "USD";
}
