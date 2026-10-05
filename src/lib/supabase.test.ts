import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  return {
    cookieValues: new Map<string, string>(),
    getUser: vi.fn(),
    refreshSession: vi.fn(),
    role: "admin",
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mocks.cookieValues.has(name)
      ? { value: mocks.cookieValues.get(name) as string }
      : undefined,
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: mocks.getUser, refreshSession: mocks.refreshSession },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: mocks.role }, error: null }) }) }) }),
  }),
}));

import { getUserFromCookies, resolveUserSession, supabaseAdmin, supabaseAdminAuth } from "./supabase";

const admin = { id: "admin-1", email: "admin@example.test" };

function setTokens(accessToken?: string, refreshToken?: string): void {
  mocks.cookieValues.clear();
  if (accessToken) mocks.cookieValues.set("sb-access-token", accessToken);
  if (refreshToken) mocks.cookieValues.set("sb-refresh-token", refreshToken);
}

beforeEach(() => {
  setTokens();
  mocks.role = "admin";
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: admin }, error: null });
  mocks.refreshSession.mockReset();
});

describe("resolveUserSession", () => {
  it("uses a valid access token without refreshing", async () => {
    setTokens("valid-token", "refresh-token");

    const session = await resolveUserSession({ throwOnError: true, refresh: true });

    expect(session.user).toEqual({ id: "admin-1", email: "admin@example.test", role: "admin" });
    expect(session.refreshedSession).toBeNull();
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it("rotates an expired access token and returns the new cookies when refresh is allowed", async () => {
    setTokens("expired-token", "refresh-token");
    mocks.getUser.mockImplementation(async (token: string) => token === "expired-token"
      ? { data: { user: null }, error: { status: 401, message: "expired" } }
      : { data: { user: admin }, error: null });
    mocks.refreshSession.mockResolvedValue({
      data: { session: { access_token: "new-access", refresh_token: "new-refresh" }, user: admin },
      error: null,
    });

    const session = await resolveUserSession({ throwOnError: true, refresh: true });

    expect(mocks.refreshSession).toHaveBeenCalledWith({ refresh_token: "refresh-token" });
    expect(mocks.getUser).toHaveBeenLastCalledWith("new-access");
    expect(session.user).toMatchObject({ id: "admin-1", role: "admin" });
    expect(session.refreshedSession).toEqual({ access_token: "new-access", refresh_token: "new-refresh" });
  });

  it("never refreshes for plain cookie reads, because a server component cannot persist rotated tokens", async () => {
    setTokens("expired-token", "refresh-token");
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401, message: "expired" } });

    await expect(getUserFromCookies({ throwOnError: true })).resolves.toBeNull();
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it("reports no session when the refresh token is missing", async () => {
    setTokens("expired-token");
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401, message: "expired" } });

    await expect(resolveUserSession({ refresh: true })).resolves.toEqual({ user: null, refreshedSession: null });
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it("reports no session when the refresh token is rejected", async () => {
    setTokens("expired-token", "refresh-token");
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401, message: "expired" } });
    mocks.refreshSession.mockResolvedValue({ data: { session: null }, error: { status: 400, message: "invalid" } });

    await expect(resolveUserSession({ refresh: true })).resolves.toEqual({ user: null, refreshedSession: null });
  });

  it("returns nothing without touching the client when no session cookie exists", async () => {
    await expect(resolveUserSession({ refresh: true })).resolves.toEqual({ user: null, refreshedSession: null });
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("falls back to the student role for a profile that is not an admin", async () => {
    mocks.role = "student";
    setTokens("valid-token");

    const session = await resolveUserSession();

    expect(session.user).toMatchObject({ role: "student" });
  });
});

describe("client separation", () => {
  it("keeps the data client and the auth client as distinct cached instances", () => {
    // A session stored on the data client switches REST calls to the user token,
    // which makes admin writes fail with row-level security errors.
    expect(supabaseAdmin()).not.toBe(supabaseAdminAuth());
    expect(supabaseAdmin()).toBe(supabaseAdmin());
    expect(supabaseAdminAuth()).toBe(supabaseAdminAuth());
  });
});