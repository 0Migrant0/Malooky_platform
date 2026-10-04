import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("retired product surfaces", () => {
  it("removes VIP Live from navigation and footer links", () => {
    expect(source("../components/SiteHeader.tsx")).not.toContain('href="/vip"');
    expect(source("../components/SiteFooter.tsx")).not.toContain('href="/vip"');
  });

  it("removes the VIP promotion and database dependency from the homepage", () => {
    const page = source("../app/(site)/page.tsx");
    const homePage = source("../components/LocalizedHomePage.tsx");
    const homeContent = source("../components/LocalizedHomeContent.tsx");

    expect(page).not.toContain("vip_config");
    expect(homePage).not.toContain("vip");
    expect(homeContent).not.toContain("vip");
    expect(homeContent).not.toContain("/vip");
  });

  it("removes the VIP activation tab and query from the admin UI", () => {
    const page = source("../app/(site)/dash/page.tsx");
    const dashboard = source("../components/LocalizedDashboard.tsx");

    expect(page).not.toContain("vip_config");
    expect(page).not.toContain("vip:");
    expect(dashboard).not.toContain('vip: "دورة VIP"');
    expect(dashboard).not.toContain("VipTab");
  });

  it("replaces database-backed consultation intake with the WhatsApp contact flow", () => {
    const page = source("../app/(site)/consult/page.tsx");

    expect(page).toContain("buildTrainerWhatsAppUrl");
    expect(page).toContain("process.env.NEXT_PUBLIC_TRAINER_WHATSAPP_NUMBER");
    expect(page).toContain("role=\"status\"");
    expect(page).toContain("whatsappUrl ? (");
    expect(page).toContain("نعتذر، خدمة حجز الدروس الخاصة عبر واتساب غير متاحة حالياً. يُرجى المحاولة لاحقاً.");
    expect(page).not.toContain("على مسؤول الموقع ضبط NEXT_PUBLIC_TRAINER_WHATSAPP_NUMBER");
    expect(page).not.toContain("لم يتم إعداد رقم واتساب صالح للأستاذ بعد.");
    expect(page).not.toContain(": <div role=\"status\"");
    expect(page).not.toContain("/api/consult");
    expect(page).not.toContain("<form");
  });
});
