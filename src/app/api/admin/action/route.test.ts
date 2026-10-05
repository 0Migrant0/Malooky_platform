import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const mocks = vi.hoisted(() => ({
  db: null as FakeSupabase | null,
  user: { id: "admin-1", email: "admin@example.test", role: "admin" as const },
  createdUserId: "created-student-1",
  createUser: vi.fn(),
  captureAudit: vi.fn(),
  writeAudit: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: () => Object.assign(Object.create(mocks.db), {
    auth: { admin: { createUser: mocks.createUser } },
  }),
  getUserFromCookies: () => Promise.resolve(mocks.user),
  resolveUserSession: () => Promise.resolve({ user: mocks.user, refreshedSession: null }),
}));
vi.mock("@/lib/admin-audit", () => ({
  captureAdminAuditContext: mocks.captureAudit,
  writeAdminAuditLog: mocks.writeAudit,
}));

import { POST } from "./route";

const existingOrder = { id: "order-1", user_id: "student-1", email: "student@example.test", course_id: "course-1", level_id: null };
let newUserOrder = { ...existingOrder, id: "order-new-user", user_id: null as string | null };
const secret = "database credential detail";

function approvalDb(
  orders: Record<string, unknown>[] = [existingOrder],
  profiles: Record<string, unknown>[] = [{ id: "created-student-1", email: newUserOrder.email }],
  errors: Record<string, { message: string }> = {},
): FakeSupabase {
  return createFakeSupabase({ manual_orders: orders, profiles }, errors);
}

function request(id: string) {
  return POST(new Request("http://localhost/api/admin/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "approveOrder", payload: { id } }),
  }));
}

describe("POST /api/admin/action retired VIP operations", () => {
  beforeEach(() => {
    mocks.db = approvalDb();
    mocks.captureAudit.mockReset().mockResolvedValue(null);
    mocks.writeAudit.mockReset().mockResolvedValue(undefined);
  });

  async function requestAction(action: string, payload: Record<string, unknown>) {
    return POST(new Request("http://localhost/api/admin/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, payload }),
    }));
  }

  it.each([
    ["setVip", { enabled: true, title_ar: "retired offer" }, "إجراء غير معروف"],
    ["upsertCourse", { kind: "vip", title_ar: "retired offer" }, "نوع غير معروف"],
  ])("rejects %s VIP activation without database writes or audit operations", async (action, payload, error) => {
    const response = await requestAction(action, payload);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error });
    expect(mocks.db?.writes).toEqual([]);
    expect(mocks.db?.upserts).toEqual([]);
    expect(mocks.captureAudit).not.toHaveBeenCalled();
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });

  it("rejects updates to a stored VIP-kind course without changing the historical row", async () => {
    mocks.db = createFakeSupabase({ courses: [{ id: "legacy-vip", kind: "vip", is_published: false }] });

    const response = await requestAction("upsertCourse", { id: "legacy-vip", kind: "main", title_ar: "Renamed" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "نوع غير معروف" });
    expect(mocks.db.writes).toEqual([]);
    expect(mocks.db.upserts).toEqual([]);
    expect(mocks.captureAudit).toHaveBeenCalledOnce();
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });

  it("rejects attempts to publish a stored VIP-kind course without writing", async () => {
    mocks.db = createFakeSupabase({ courses: [{ id: "legacy-vip", kind: "vip", is_published: false }] });

    const response = await requestAction("setCoursePublished", { id: "legacy-vip", is_published: true });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "نوع غير معروف" });
    expect(mocks.db.writes).toEqual([]);
    expect(mocks.captureAudit).toHaveBeenCalledOnce();
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/action approveOrder", () => {
  beforeEach(() => {
    newUserOrder = { ...existingOrder, id: "order-new-user", user_id: null };
    mocks.db = approvalDb();
    mocks.createUser.mockReset().mockResolvedValue({ data: { user: { id: mocks.createdUserId } }, error: null });
    mocks.captureAudit.mockReset().mockImplementation(async (_db: unknown, action: string) => action === "approveOrder"
      ? { table: "manual_orders", entityType: "manual_order", filters: [["id", "order-1"]], before: [] }
      : null);
    mocks.writeAudit.mockReset().mockResolvedValue(undefined);
  });

  it.each([
    ["access grant", "access.upsert"],
    ["order status update", "manual_orders.update"],
  ])("does not report approval when the %s fails", async (_effect, failedOperation) => {
    mocks.db = approvalDb(undefined, undefined, { [failedOperation]: { message: secret } });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(existingOrder.id);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "حدث خطأ، حاول مرة أخرى" });
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
  });

  it("returns a successful approval with a safe warning when audit persistence fails afterward", async () => {
    const secret = "audit database credentials";
    mocks.writeAudit.mockImplementationOnce(async () => {
      const writes = mocks.db?.writes || [];
      expect(writes.findIndex(({ table, operation }) => table === "access" && operation === "upsert"))
        .toBeLessThan(writes.findIndex(({ table, operation, value }) => table === "manual_orders" && operation === "update" && (value as Record<string, unknown>).status === "approved"));
      throw new Error(secret);
    });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(existingOrder.id);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, id: existingOrder.id, userId: existingOrder.user_id, auditWarning: true });
    expect(JSON.stringify(body)).not.toContain(secret);
    expect(mocks.db?.writes.some(({ table, operation }) => table === "access" && operation === "upsert")).toBe(true);
    expect(mocks.db?.writes.some(({ table, operation, value }) => table === "manual_orders" && operation === "update" && (value as Record<string, unknown>).status === "approved")).toBe(true);
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
    expect(logger).toHaveBeenCalledWith("[api-error]", { route: "/api/admin/action", classification: "unexpected" });
  });

  it("returns the normal success shape only after both approval effects succeed", async () => {
    const response = await request(existingOrder.id);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, id: existingOrder.id, userId: existingOrder.user_id });
    expect(mocks.db?.writes.some(({ table, operation }) => table === "access" && operation === "upsert")).toBe(true);
    expect(mocks.db?.writes.some(({ table, operation }) => table === "manual_orders" && operation === "update")).toBe(true);
  });

  it.each(["access.upsert", "manual_orders.update"])("recovers a created user after %s fails, without creating a duplicate on retry", async (failedOperation) => {
    const faults: Record<string, { message: string }> = { [failedOperation]: { message: secret } };
    const profiles: Record<string, unknown>[] = [];
    mocks.db = approvalDb([newUserOrder], profiles, faults);
    mocks.createUser.mockImplementation(async ({ email }: { email: string }) => {
      profiles.push({ id: mocks.createdUserId, email });
      return { data: { user: { id: mocks.createdUserId } }, error: null };
    });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = await request(newUserOrder.id);

    expect(failed.status).toBe(500);
    const failureBody = await failed.json();
    expect(failureBody).toEqual({ error: "حدث خطأ، حاول مرة أخرى" });
    expect(mocks.createUser.mock.calls, JSON.stringify({ failureBody, writes: mocks.db?.writes })).toHaveLength(1);
    if (failedOperation === "access.upsert") {
      expect(mocks.db?.writes.find(({ table, operation }) => table === "manual_orders" && operation === "update")?.value)
        .toMatchObject({ user_id: mocks.createdUserId });
    }

    delete faults[failedOperation];
    const retried = await request(newUserOrder.id);
    expect(retried.status).toBe(200);
    expect(await retried.json()).toMatchObject({ ok: true, id: newUserOrder.id, userId: mocks.createdUserId });
    expect(mocks.createUser).toHaveBeenCalledOnce();
    expect(mocks.db?.writes.some(({ table, operation }) => table === "access" && operation === "upsert")).toBe(true);
    expect(mocks.db?.writes.some(({ table, operation, value }) => table === "manual_orders" && operation === "update" && (value as Record<string, unknown>).status === "approved")).toBe(true);
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
  });
});

describe("POST /api/admin/action constraint errors", () => {
  function requestAction(action: string, payload: Record<string, unknown>) {
    return POST(new Request("http://localhost/api/admin/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, payload }),
    }));
  }

  beforeEach(() => {
    mocks.captureAudit.mockReset().mockResolvedValue(null);
    mocks.writeAudit.mockReset().mockResolvedValue(undefined);
  });

  it("returns 409 with a clear message when the course slug already exists", async () => {
    mocks.db = createFakeSupabase({ courses: [] }, {
      "courses.upsert": { code: "23505", message: 'duplicate key value violates unique constraint "courses_slug_key"' },
    });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await requestAction("upsertCourse", { title_ar: "taken title", price_cents: 1000 });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "قيمة مكررة — هذا الرابط أو المعرّف مستخدم مسبقاً. اختر قيمة أخرى." });
    expect(logger).toHaveBeenCalledWith("[api-error]", { route: "/api/admin/action", classification: "conflict" });
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });

  it("returns 409 with a clear message when createUser hits an existing email", async () => {
    mocks.db = createFakeSupabase({});
    mocks.createUser.mockReset().mockResolvedValue({
      data: { user: null },
      error: { code: "email_exists", message: "User already registered", status: 422 },
    });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await requestAction("createUser", { email: "taken@example.test", password: "password123" });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "البريد الإلكتروني مستخدم مسبقاً." });
    expect(JSON.stringify(logger.mock.calls)).not.toContain("User already registered");
  });

  it("returns 400 with a clear message when a referenced row is missing (foreign key)", async () => {
    mocks.db = createFakeSupabase({ levels: [] }, {
      "levels.upsert": {
        code: "23503",
        message: 'insert or update on table "levels" violates foreign key constraint "levels_course_id_fkey"',
      },
    });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await requestAction("upsertLevel", { courseId: "missing-course", title_ar: "level" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "أحد السجلات المرتبطة غير موجود. حدّث الصفحة ثم أعد المحاولة." });
    expect(JSON.stringify(logger.mock.calls)).not.toContain("levels_course_id_fkey");
  });

  it("still returns a generic 500 for non-constraint database failures", async () => {
    mocks.db = createFakeSupabase({ courses: [] }, {
      "courses.upsert": { message: "connection to server failed" },
    });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await requestAction("upsertCourse", { title_ar: "any", price_cents: 1000 });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "حدث خطأ، حاول مرة أخرى" });
    expect(logger).toHaveBeenCalledWith("[api-error]", { route: "/api/admin/action", classification: "unexpected" });
  });
});

describe("POST /api/admin/action audit persistence", () => {
  it("returns success with auditWarning when the audit log cannot be written for a non-approveOrder action", async () => {
    mocks.db = createFakeSupabase({ coupons: [] });
    mocks.captureAudit.mockReset().mockResolvedValue({
      table: "coupons", entityType: "coupon", filters: [["code", "TEST"]], before: [],
    });
    mocks.writeAudit.mockReset().mockRejectedValue(new Error("audit unavailable"));
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(new Request("http://localhost/api/admin/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "upsertCoupon", payload: { code: "TEST", percent_off: 20, active: true } }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, code: "TEST", auditWarning: true });
    expect(mocks.db?.upserts.some(({ table }) => table === "coupons")).toBe(true);
    expect(logger).toHaveBeenCalledWith("[api-error]", { route: "/api/admin/action", classification: "unexpected" });
  });
});
