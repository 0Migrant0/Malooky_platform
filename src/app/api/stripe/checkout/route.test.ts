import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const mocks = vi.hoisted(() => ({
  db: null as FakeSupabase | null,
  user: { id: "student-1", email: "student@example.test", role: "student" } as { id: string; email: string; role: "student" } | null,
  stripeCreate: vi.fn(async () => ({ url: "https://stripe.example/session" })),
  siteOrigin: "https://academy.example" as string | null,
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: () => mocks.db,
  getUserFromCookies: () => Promise.resolve(mocks.user),
}));
vi.mock("@/lib/stripe", () => ({
  stripeEnabled: () => true,
  stripeClient: () => ({ checkout: { sessions: { create: mocks.stripeCreate } } }),
  siteUrl: () => mocks.siteOrigin,
  currency: () => "USD",
}));

import { POST } from "./route";

function request(body: string | object) {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    mocks.user = { id: "student-1", email: "student@example.test", role: "student" };
    mocks.db = createFakeSupabase({
      courses: [
        { id: "free-course", title_ar: "Free", is_free: true },
        { id: "paid-course", title_ar: "Paid", price_cents: 1200, is_free: false },
      ],
      packages: [{ id: "package-1", title_ar: "Bundle", price_cents: 2400, is_active: true }],
    });
    mocks.stripeCreate.mockClear();
    mocks.siteOrigin = "https://academy.example";
  });

  it("uses the configured canonical origin for checkout return URLs", async () => {
    await POST(request({ type: "donation", amountCents: 500 }));

    expect(mocks.stripeCreate).toHaveBeenCalledWith(expect.objectContaining({
      success_url: "https://academy.example/donate?thanks=1",
      cancel_url: "https://academy.example/donate",
    }));
  });

  it("does not create a checkout session when no canonical origin is configured", async () => {
    mocks.siteOrigin = null;

    const response = await POST(request({ type: "donation", amountCents: 500 }));

    expect(response.status).toBe(503);
    expect(mocks.stripeCreate).not.toHaveBeenCalled();
  });

  it.each([
    { body: { type: "course", courseId: "paid-course" }, label: "paid course" },
    { body: { type: "package", packageId: "package-1" }, label: "package" },
  ])("does not create a $label session without the configured origin", async ({ body }) => {
    mocks.siteOrigin = null;

    const response = await POST(request(body));

    expect(response.status).toBe(503);
    expect(mocks.stripeCreate).not.toHaveBeenCalled();
  });

  it("returns a shaped validation error for malformed JSON", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "نوع غير معروف" });
  });

  it.each(["", "abc", 99.5, Number.MAX_SAFE_INTEGER + 1])("rejects invalid donation amount %s", async (amountCents) => {
    const response = await POST(request({ type: "donation", amountCents }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "مبلغ غير صالح" });
    expect(mocks.stripeCreate).not.toHaveBeenCalled();
  });

  it("does not report free enrollment when the access write fails", async () => {
    const secret = "database-password=hidden";
    mocks.db = createFakeSupabase({ courses: [{ id: "free-course", is_free: true }] }, {
      "access.upsert": { message: secret },
    });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(request({ type: "course", courseId: "free-course" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "تعذّر بدء عملية الدفع، حاول مرة أخرى." });
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
  });

  it("does not create a session when the course lookup fails", async () => {
    const secret = "database-password=hidden";
    mocks.db = createFakeSupabase({}, { courses: { message: secret } });
    const response = await POST(request({ type: "course", courseId: "course-1" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "تعذّر بدء عملية الدفع، حاول مرة أخرى." });
    expect(mocks.stripeCreate).not.toHaveBeenCalled();
  });
});
