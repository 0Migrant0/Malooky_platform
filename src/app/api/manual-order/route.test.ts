import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(async (): Promise<{ error: { message: string } | null }> => ({ error: null })),
  insert: vi.fn(async (): Promise<{ error: { message: string } | null }> => ({ error: null })),
  remove: vi.fn(async (): Promise<{ error: { message: string } | null }> => ({ error: null })),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: () => ({
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
    from: () => ({ insert: mocks.insert }),
  }),
  getUserFromCookies: () => Promise.resolve(null),
}));
vi.mock("@/lib/ratelimit", () => ({ rateLimit: () => ({ ok: true }), clientIp: () => "127.0.0.1" }));

import { POST } from "./route";

function formRequest() {
  const form = new FormData();
  form.set("email", "a@example.test");
  form.set("whatsapp", "+1000000000");
  form.set("proof", new File(["proof"], "proof.png", { type: "image/png" }));
  return new Request("http://localhost/api/manual-order", { method: "POST", body: form });
}

describe("POST /api/manual-order failures", () => {
  beforeEach(() => {
    mocks.upload.mockReset().mockResolvedValue({ error: null });
    mocks.insert.mockReset().mockResolvedValue({ error: null });
    mocks.remove.mockReset().mockResolvedValue({ error: null });
  });

  it("returns a shaped validation error for a non-multipart request", async () => {
    const response = await POST(new Request("http://localhost/api/manual-order", { method: "POST", body: "not multipart" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "الحقول والإثبات مطلوبة" });
  });

  it("does not insert an order when proof upload fails", async () => {
    mocks.upload.mockResolvedValue({ error: { message: "storage secret=hidden" } });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(formRequest());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "تعذّر إرسال الطلب، حاول مرة أخرى." });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(JSON.stringify(logger.mock.calls)).not.toContain("storage secret=hidden");
  });

  it("removes uploaded proof if order persistence fails", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "db secret=hidden" } });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(formRequest());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "تعذّر إرسال الطلب، حاول مرة أخرى." });
    expect(mocks.remove).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logger.mock.calls)).not.toContain("db secret=hidden");
  });
});
