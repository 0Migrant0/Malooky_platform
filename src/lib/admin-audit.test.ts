import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeSupabase } from "@/test/fake-supabase";
import { captureAdminAuditContext } from "./admin-audit";

const asClient = (db: unknown) => db as SupabaseClient;

describe("captureAdminAuditContext", () => {
  it("degrades the before snapshot instead of failing the admin action", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const db = asClient(createFakeSupabase({ coupons: [] }, { "coupons.select": { message: "read failed" } }));

      const context = await captureAdminAuditContext(db, "upsertCoupon", { code: "TEST" });

      expect(context).toMatchObject({ table: "coupons", entityType: "coupon", before: null });
      expect(logger).toHaveBeenCalledWith("[api-error]", { route: "/api/admin/action", classification: "unexpected" });
    } finally {
      logger.mockRestore();
    }
  });

  it("captures the before snapshot when the read succeeds", async () => {
    const db = asClient(createFakeSupabase({ coupons: [{ code: "TEST", percent_off: 10 }] }));

    const context = await captureAdminAuditContext(db, "upsertCoupon", { code: "TEST" });

    expect(context?.before).toEqual([{ code: "TEST", percent_off: 10 }]);
  });

  it("returns no context for actions that are not audited", async () => {
    const db = asClient(createFakeSupabase({}));

    await expect(captureAdminAuditContext(db, "not-an-action", {})).resolves.toBeNull();
  });
});
