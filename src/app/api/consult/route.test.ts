import { afterEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const mocks = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@/lib/supabase", () => ({ supabaseAdmin: () => mocks.db }));
vi.mock("@/lib/ratelimit", () => ({ rateLimit: () => ({ ok: true }), clientIp: () => "127.0.0.1" }));

import { POST } from "./route";

afterEach(() => vi.restoreAllMocks());

function request(body: string) {
  return new Request("http://localhost/api/consult", {
    method: "POST", headers: { "content-type": "application/json" }, body,
  });
}

describe("POST /api/consult errors", () => {
  it("returns a 400 { error } response for malformed JSON", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "الحقول مطلوبة" });
  });

  it("sanitizes persistence errors and does not claim success", async () => {
    const secret = "database-password=hidden";
    mocks.db = createFakeSupabase({}, { consult_requests: { message: secret } });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(request(JSON.stringify({ name: "A", email: "a@example.test", message: "Hello" })));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "تعذّر إرسال الطلب، حاول مرة أخرى." });
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
    expect(mocks.db?.writes).toHaveLength(1);
    expect(mocks.db?.writes[0]).toMatchObject({ table: "consult_requests", operation: "insert" });
  });
});
