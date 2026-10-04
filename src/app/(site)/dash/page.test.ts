import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditError: null as { message: string } | null,
  throwAudit: false,
  failingTable: "" as string,
}));

vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/lib/supabase", () => ({
  SupabaseConfigurationError: class SupabaseConfigurationError extends Error {},
  supabaseAdmin: () => ({
    from(table: string) {
      return {
        select() {
          if (table === "admin_audit_logs") {
            return {
              order() {
                return {
                  limit: async () => {
                    if (mocks.throwAudit) throw new Error("audit unavailable");
                    return { data: null, error: mocks.auditError };
                  },
                };
              },
            };
          }
          const result = {
            data: [],
            error: mocks.failingTable === table ? { message: "required query failed" } : null,
          };
          const query = {
            order() { return query; },
            limit() { return query; },
            eq() { return query; },
            maybeSingle() { return Promise.resolve({ data: null, error: result.error }); },
            then(resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) {
              return Promise.resolve(result).then(resolve, reject);
            },
          };
          return query;
        },
      };
    },
  }),
  getUserFromCookies: async () => ({ id: "admin-1", email: "admin@example.test", role: "admin" }),
}));
vi.mock("@/components/LocalizedDashboard", () => ({ default: () => null }));
vi.mock("@/components/LocalizedPageFailure", () => ({ default: (props: unknown) => props }));

import DashPage from "./page";

describe("dashboard optional audit log query", () => {
  beforeEach(() => {
    mocks.auditError = null;
    mocks.throwAudit = false;
    mocks.failingTable = "";
  });

  it.each([
    ["returns an error", false],
    ["throws", true],
  ])("renders the dashboard when the audit query %s", async (_description, shouldThrow) => {
    mocks.auditError = { message: "audit query failed" };
    mocks.throwAudit = shouldThrow;

    const result = await DashPage();

    expect((result as { props: Record<string, any> }).props.data).toMatchObject({
      auditLogs: [], auditLogsReady: false, courses: [],
    });
  });

  it("treats an empty successful audit result as available", async () => {
    const result = await DashPage();
    const data = (result as { props: { data: Record<string, unknown> } }).props.data;

    expect(data.auditLogs).toEqual([]);
    expect(data.auditLogsReady).toBe(true);
  });

  it("still shows the page failure when a required dashboard dataset fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.failingTable = "courses";

    try {
      const result = await DashPage();
      expect((result as { props: Record<string, unknown> }).props).toEqual({ reason: "load-failed" });
    } finally {
      log.mockRestore();
    }
  });
});
