import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ refreshSession: vi.fn(), cookieValues: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mocks.cookieValues.has(name) ? { value: mocks.cookieValues.get(name) as string } : undefined,
  }),
}));
vi.mock("@/lib/supabase", () => ({ supabaseAdminAuth: () => ({ auth: { refreshSession: mocks.refreshSession } }) }));
vi.mock("@/lib/ratelimit", () => ({ rateLimit: () => ({ ok: true }), clientIp: () => "127.0.0.1" }));

import { GET } from "./route";

function request(query: string) { return new Request("http://localhost/api/auth/refresh" + query); }

describe("GET /api/auth/refresh", () => {
  beforeEach(() => {
    mocks.cookieValues.clear();
    mocks.refreshSession.mockReset();
  });

  it("sends visitors without a refresh token to login", async () => {
    const response = await GET(request("?next=/dash"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it("rotates the session and continues to the requested internal page", async () => {
    mocks.cookieValues.set("sb-refresh-token", "refresh-token");
    mocks.refreshSession.mockResolvedValue({
      data: { session: { access_token: "new-access", refresh_token: "new-refresh" } },
      error: null,
    });

    const response = await GET(request("?next=/dash"));
    const cookieHeader = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dash");
    expect(mocks.refreshSession).toHaveBeenCalledWith({ refresh_token: "refresh-token" });
    expect(cookieHeader).toContain("sb-access-token=new-access");
    expect(cookieHeader).toContain("sb-refresh-token=new-refresh");
  });

  it("falls back to login when the refresh token is rejected", async () => {
    mocks.cookieValues.set("sb-refresh-token", "stale-token");
    mocks.refreshSession.mockResolvedValue({ data: { session: null }, error: { status: 400 } });

    const response = await GET(request("?next=/dash"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("never redirects off-site", async () => {
    mocks.cookieValues.set("sb-refresh-token", "refresh-token");
    mocks.refreshSession.mockResolvedValue({
      data: { session: { access_token: "new-access", refresh_token: "new-refresh" } },
      error: null,
    });

    const response = await GET(request("?next=https://evil.example"));

    expect(response.headers.get("location")).not.toContain("evil.example");
    expect(response.headers.get("location")).toContain("/dash");
  });
});