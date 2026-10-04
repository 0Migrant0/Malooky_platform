import { describe, expect, it } from "vitest";
import { readApiResponse } from "./client-api";

function response(status: number, body: string) {
  return new Response(body, { status, headers: { "content-type": "application/json" } });
}

describe("readApiResponse", () => {
  it("returns object responses only for successful HTTP statuses", async () => {
    await expect(readApiResponse(response(200, JSON.stringify({ ok: true }))))
      .resolves.toEqual({ ok: true, data: { ok: true } });
  });

  it("retains safe API error data for non-OK statuses", async () => {
    await expect(readApiResponse(response(429, JSON.stringify({ error: "rate limited" }))))
      .resolves.toEqual({ ok: false, error: "rate limited" });
  });

  it.each(["not json", "null", "[]", "\"text\""])("rejects malformed or non-object body %s", async (body) => {
    await expect(readApiResponse(response(200, body))).resolves.toEqual({ ok: false, error: undefined });
  });
});
