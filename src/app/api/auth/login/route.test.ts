import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: () => ({ auth: { signInWithPassword: mocks.signIn } }),
}));
vi.mock("@/lib/ratelimit", () => ({ rateLimit: () => ({ ok: true }), clientIp: () => "127.0.0.1" }));

import { POST } from "./route";

function request(body: string) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json" }, body,
  });
}

describe("POST /api/auth/login errors", () => {
  beforeEach(() => mocks.signIn.mockReset());

  it("rejects malformed JSON with a validation status", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "البريد وكلمة المرور مطلوبان" });
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("keeps invalid credentials as an authentication response", async () => {
    mocks.signIn.mockResolvedValue({ data: { session: null }, error: { status: 400, message: "Invalid credentials" } });
    const response = await POST(request(JSON.stringify({ email: "x@example.test", password: "wrong" })));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "بيانات الدخول غير صحيحة" });
  });

  it("sanitizes unexpected auth provider failures", async () => {
    const secret = "auth secret=provider-private";
    mocks.signIn.mockResolvedValue({ data: { session: null }, error: { status: 503, message: secret } });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(request(JSON.stringify({ email: "x@example.test", password: "password" })));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "تعذّر تسجيل الدخول، حاول مرة أخرى." });
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
  });
});
