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
