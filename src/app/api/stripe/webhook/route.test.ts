import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const donationEvent = {
  type: "checkout.session.completed",
  data: { object: { amount_total: 2500, metadata: { kind: "donation", name: "Ada", email: "ada@example.test" } } },
};
const courseEvent = {
  type: "checkout.session.completed",
  data: { object: { metadata: { kind: "course", userId: "student-1", courseId: "course-1" } } },
};
const mocks = vi.hoisted(() => ({ db: null as FakeSupabase | null, constructEvent: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabaseAdmin: () => mocks.db }));
vi.mock("@/lib/stripe", () => ({ stripeClient: () => ({ webhooks: { constructEvent: mocks.constructEvent } }) }));

import { POST } from "./route";

function request() {
  return POST({
    headers: { get: (name: string) => name === "stripe-signature" ? "signature" : null },
    text: async () => "{}",
  } as unknown as Request);
}

describe("POST /api/stripe/webhook persistence", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "test-secret";
    process.env.STRIPE_SECRET_KEY = "test-key";
    mocks.constructEvent.mockReset().mockReturnValue(donationEvent);
    mocks.db = createFakeSupabase({});
  });

  it.each([
    ["donation insert", "donations.insert", donationEvent],
    ["course access grant", "access.upsert", courseEvent],
  ] as const)("returns sanitized failure and no success acknowledgment when %s fails", async (_effect, operation, event) => {
    const secret = "provider detail with credentials";
    mocks.constructEvent.mockReturnValue(event);
    mocks.db = createFakeSupabase({}, { [operation]: { message: secret } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "حدث خطأ، حاول مرة أخرى" });
    expect(JSON.stringify(log.mock.calls)).not.toContain(secret);
  });

  it("acknowledges a completed donation only after its insert succeeds", async () => {
    const response = await request();
    expect(response.status, await response.clone().text()).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mocks.constructEvent).toHaveBeenCalledOnce();
    expect(mocks.db?.writes.map(({ table, operation }) => [table, operation])).toEqual([["donations", "insert"]]);
  });

});
