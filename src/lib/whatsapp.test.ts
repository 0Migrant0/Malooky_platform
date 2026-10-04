import { describe, expect, it } from "vitest";
import { translate } from "./i18n";
import { buildTrainerWhatsAppUrl } from "./whatsapp";

describe("trainer WhatsApp contact", () => {
  it("builds an encoded wa.me link from the configured international number", () => {
    const message = translate("en", "مرحباً، أود الاستفسار عن حجز درس خاص.");
    const url = buildTrainerWhatsAppUrl("15551234567", message);

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin + parsed.pathname).toBe("https://wa.me/15551234567");
    expect(parsed.searchParams.get("text")).toBe(message);
  });

  it.each([undefined, "", "+15551234567", "1555 123 4567", "0015551234567", "1234567", "1234567890123456"]) (
    "does not create a link for invalid or missing phone configuration: %s",
    (phoneNumber) => {
      expect(buildTrainerWhatsAppUrl(phoneNumber, "Private lesson")).toBeNull();
    },
  );

  it("localizes the prefilled private-lesson message in all supported languages", () => {
    expect(translate("ar", "مرحباً، أود الاستفسار عن حجز درس خاص.")).toBe("مرحباً، أود الاستفسار عن حجز درس خاص.");
    expect(translate("en", "مرحباً، أود الاستفسار عن حجز درس خاص.")).toBe("Hello, I would like to ask about booking a private lesson.");
    expect(translate("zh", "مرحباً، أود الاستفسار عن حجز درس خاص.")).toBe("您好，我想咨询预约私人课程。");
  });

  it("provides localized user-friendly unavailable copy in all supported languages", () => {
    const unavailable = "نعتذر، خدمة حجز الدروس الخاصة عبر واتساب غير متاحة حالياً. يُرجى المحاولة لاحقاً.";

    expect(translate("ar", "تواصل عبر واتساب")).toBe("تواصل عبر واتساب");
    expect(translate("en", "تواصل عبر واتساب")).toBe("Contact on WhatsApp");
    expect(translate("zh", "تواصل عبر واتساب")).toBe("通过 WhatsApp 联系");
    expect(translate("ar", unavailable)).toBe(unavailable);
    expect(translate("en", unavailable)).toBe("Sorry, private lesson bookings via WhatsApp are currently unavailable. Please try again later.");
    expect(translate("zh", unavailable)).toBe("抱歉，目前无法通过 WhatsApp 预约私人课程，请稍后再试。");
  });
});
