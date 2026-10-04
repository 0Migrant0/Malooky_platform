import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
}));

import VipPage from "./page";

describe("legacy VIP route", () => {
  it("redirects to private-lesson contact instead of rendering an offer", () => {
    expect(() => VipPage()).toThrow("redirect:/consult");
  });
});
