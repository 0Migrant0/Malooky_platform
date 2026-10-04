import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPageData } from "./page-data";
import { loadRequiredPageQueries } from "./server-page-queries";
import { translate } from "./i18n";
import { SupabaseConfigurationError } from "./supabase";

describe("server page data failures", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps empty results distinct from query errors and missing configuration", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const empty = await loadPageData("courses", async () => []);
    const missing = await loadPageData("course-detail", async () => null);
    const queryFailure = await loadPageData("course-detail", () => loadRequiredPageQueries(async () => [
      { data: null, error: { message: "private database details" } },
    ]));
    const unconfigured = await loadPageData("vip", async () => { throw new SupabaseConfigurationError(); });

    expect(empty).toEqual({ ok: true, data: [] });
    expect(missing).toEqual({ ok: true, data: null });
    expect(queryFailure).toEqual({ ok: false, reason: "load-failed" });
    expect(unconfigured).toEqual({ ok: false, reason: "unconfigured" });
    expect(log.mock.calls).toEqual([["[page:course-detail] load-failed"], ["[page:vip] unconfigured"]]);
    expect(JSON.stringify(log.mock.calls)).not.toContain("private database details");
  });

  it.each([
    ["ar", "تعذّر تحميل هذه الصفحة، حاول مرة أخرى.", "إعادة المحاولة"],
    ["en", "Could not load this page. Please try again.", "Retry"],
    ["zh", "无法加载此页面，请重试。", "重试"],
  ] as const)("localizes operational failure and retry copy in %s", (lang, expected, retry) => {
    expect(translate(lang, "تعذّر تحميل هذه الصفحة، حاول مرة أخرى.")).toBe(expected);
    expect(translate(lang, "إعادة المحاولة")).toBe(retry);
  });
});
