import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signUp: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabaseAuth: () => ({ auth: { signUp: mocks.signUp } }),
}));
vi.mock("@/lib/ratelimit", () => ({ rateLimit: () => ({ ok: true }), clientIp: () => "127.0.0.2" }));

import { POST } from "./route";

function request(body: string) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST", headers: { "content-type": "application/json" }, body,
  });
}

const session = { access_token: "access-token", refresh_token: "refresh-token" };

describe("POST /api/auth/signup", () => {
  beforeEach(() => mocks.signUp.mockReset());

  it.each([
    "{",
    JSON.stringify({ email: "not-an-email", password: "password123" }),
    JSON.stringify({ email: "person@example.test", password: "short" }),
    JSON.stringify({ email: "person@example.test", password: "x".repeat(129) }),
    JSON.stringify(["person@example.test", "password123"]),
  ])("rejects malformed or invalid signup details: %s", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "بيانات التسجيل غير صالحة" });
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("creates a student account and establishes the shared secure session cookies", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: "user-1" }, session }, error: null });

    const response = await POST(request(JSON.stringify({ email: " Person@Example.Test ", password: "password123" })));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, role: "student" });
    expect(mocks.signUp).toHaveBeenCalledWith({ email: "person@example.test", password: "password123" });
    const cookies = response.headers.getSetCookie().join("\n");
    expect(cookies).toContain("sb-access-token=access-token");
    expect(cookies).toContain("sb-refresh-token=refresh-token");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toContain("SameSite=lax");
  });

  it("reports email confirmation without issuing an unauthenticated session", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: "user-2" }, session: null }, error: null });

    const response = await POST(request(JSON.stringify({ email: "person@example.test", password: "password123" })));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, role: "student", confirmationRequired: true });
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("returns a safe message for duplicate-user and sanitized unexpected provider errors", async () => {
    mocks.signUp.mockResolvedValueOnce({
      data: { user: { id: "existing-user" }, session: null },
      error: { status: 422, code: "user_already_exists", message: "User already registered" },
    });
    const duplicate = await POST(request(JSON.stringify({ email: "person@example.test", password: "password123" })));
    expect(duplicate.status).toBe(400);
    expect(await duplicate.json()).toEqual({ error: "تعذّر إنشاء الحساب. تحقق من البيانات وحاول مجدداً." });

    const secret = "provider-secret=private";
    mocks.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: { status: 503, message: secret } });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = await POST(request(JSON.stringify({ email: "person@example.test", password: "password123" })));
    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ error: "تعذّر إنشاء الحساب، حاول مرة أخرى." });
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
    logger.mockRestore();
  });
});
