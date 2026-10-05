import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({ resolveUserSession: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ resolveUserSession: mocks.resolveUserSession }));

import type { ResolvedSession } from "@/lib/supabase";
import { withSession } from "./auth-session";

const adminSession = { user: { id: "admin-1", email: "admin@example.test", role: "admin" }, refreshedSession: null };
const request = () => new Request("http://localhost/api/admin/action");

beforeEach(() => mocks.resolveUserSession.mockReset());

describe("withSession", () => {
  it("resolves a refreshable session once and hands it to the handler", async () => {
    mocks.resolveUserSession.mockResolvedValue(adminSession);
    const handler = vi.fn(async (_req: Request, session: ResolvedSession) => NextResponse.json({ role: session.user?.role }));

    const response = await withSession(handler)(request());

    expect(mocks.resolveUserSession).toHaveBeenCalledWith({ throwOnError: true, refresh: true });
    expect(handler).toHaveBeenCalledOnce();
    expect(await response.json()).toEqual({ role: "admin" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("persists rotated cookies on the response when the session was refreshed", async () => {
    mocks.resolveUserSession.mockResolvedValue({
      ...adminSession,
      refreshedSession: { access_token: "new-access", refresh_token: "new-refresh" },
    });
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const response = await withSession(handler)(request());

    const cookieHeader = response.headers.get("set-cookie") || "";
    expect(cookieHeader).toContain("sb-access-token=new-access");
    expect(cookieHeader).toContain("sb-refresh-token=new-refresh");
    expect(cookieHeader).toContain("HttpOnly");
  });

  it("does not touch cookies when no refresh happened", async () => {
    mocks.resolveUserSession.mockResolvedValue({ user: null, refreshedSession: null });
    const handler = vi.fn(async () => NextResponse.json({ user: null }));

    const response = await withSession(handler)(request());

    expect(await response.json()).toEqual({ user: null });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
