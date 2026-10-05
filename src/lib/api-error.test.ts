import { afterEach, describe, expect, it, vi } from "vitest";
import { apiErrorResponse, classifyApiErrorStatus, logApiError, unexpectedApiError } from "./api-error";

afterEach(() => vi.restoreAllMocks());

describe("shared API error contract", () => {
  it("classifies common HTTP statuses", () => {
    expect(classifyApiErrorStatus(400)).toBe("validation");
    expect(classifyApiErrorStatus(401)).toBe("authentication");
    expect(classifyApiErrorStatus(403)).toBe("authorization");
    expect(classifyApiErrorStatus(404)).toBe("not_found");
    expect(classifyApiErrorStatus(409)).toBe("conflict");
    expect(classifyApiErrorStatus(429)).toBe("rate_limit");
    expect(classifyApiErrorStatus(503)).toBe("unavailable");
    expect(classifyApiErrorStatus(500)).toBe("unexpected");
  });

  it("preserves recognized client-safe messages and the exact status", async () => {
    const response = apiErrorResponse(429, "محاولات كثيرة، انتظر قليلاً", "login");

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "محاولات كثيرة، انتظر قليلاً" });
  });

  it("sanitizes unknown failures and logs only route path and classification", async () => {
    const secret = "provider token=super-secret database.internal";
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = unexpectedApiError("/api/stripe/checkout?token=private", new Error(secret), "checkout");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "تعذّر بدء عملية الدفع، حاول مرة أخرى." });
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
    expect(JSON.stringify(logger.mock.calls)).not.toContain("private");
    expect(logger).toHaveBeenCalledWith("[api-error]", {
      route: "/api/stripe/checkout",
      classification: "unexpected",
    });
  });

  it("maps a unique-constraint violation to 409 with a clear duplicate message", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const duplicate = { code: "23505", message: 'duplicate key value violates unique constraint "courses_slug_key"' };

    const response = unexpectedApiError("/api/admin/action", duplicate);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "قيمة مكررة — هذا الرابط أو المعرّف مستخدم مسبقاً. اختر قيمة أخرى." });
    expect(logger).toHaveBeenCalledWith("[api-error]", { route: "/api/admin/action", classification: "conflict" });
  });

  it("falls back to the error text when the SQLSTATE code is missing", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const duplicateWithoutCode = { message: "duplicate key value violates unique constraint \"coupons_pkey\"" };

    const response = unexpectedApiError("/api/admin/action", duplicateWithoutCode);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "قيمة مكررة — هذا الرابط أو المعرّف مستخدم مسبقاً. اختر قيمة أخرى." });
    expect(logger).toHaveBeenCalledWith("[api-error]", { route: "/api/admin/action", classification: "conflict" });
  });

  it("maps a foreign-key violation to 400 with a clear related-record message", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const missingParent = {
      code: "23503",
      message: 'insert or update on table "levels" violates foreign key constraint "levels_course_id_fkey"',
    };

    const response = unexpectedApiError("/api/admin/action", missingParent);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "أحد السجلات المرتبطة غير موجود. حدّث الصفحة ثم أعد المحاولة." });
    expect(logger).toHaveBeenCalledWith("[api-error]", { route: "/api/admin/action", classification: "validation" });
  });

  it("maps GoTrue's duplicate-email rejection to 409 without exposing provider text", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const emailExists = { code: "email_exists", message: "User already registered", status: 422 };

    const response = unexpectedApiError("/api/admin/action", emailExists);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "البريد الإلكتروني مستخدم مسبقاً." });
    expect(JSON.stringify(logger.mock.calls)).not.toContain("User already registered");
  });

  it("reports missing server configuration as a 503 with a safe localized message", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const configurationError = new Error("Supabase env missing");
    configurationError.name = "SupabaseConfigurationError";

    const response = unexpectedApiError("/api/admin/action", configurationError);

    expect(response.status).toBe(503);
    expect(classifyApiErrorStatus(response.status)).toBe("unavailable");
    expect(await response.json()).toEqual({ error: "الخدمة غير مهيأة حالياً، حاول مرة أخرى لاحقاً." });
    expect(logger).toHaveBeenCalledWith("[api-error]", { route: "/api/admin/action", classification: "unavailable" });
  });
});
