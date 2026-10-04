import { describe, expect, it } from "vitest";
import { dict, dirFor, languages, localizedField, localizeApiError, openGraphLocale, pageDescription, pageMetadata, pageTitle, translate } from "./i18n";

describe("localization helpers", () => {
  it("prefers the selected authored language, then English, then Arabic", () => {
    expect(localizedField("zh", { zh: "中文", en: "English", ar: "العربية" })).toBe("中文");
    expect(localizedField("zh", { en: " English ", ar: "العربية" })).toBe(" English ");
    expect(localizedField("zh", { ar: "العربية" })).toBe("العربية");
    expect(localizedField("en", { en: "  ", ar: "العربية" })).toBe("العربية");
  });

  it("selects shared interface copy for all supported languages and preserves unknown source text", () => {
    expect(translate("ar", "الرئيسية")).toBe("الرئيسية");
    expect(translate("en", "الرئيسية")).toBe("Home");
    expect(translate("zh", "الرئيسية")).toBe("首页");
    expect(translate("ar", "ملوكي")).toBe("ملوكي");
    expect(translate("en", "ملوكي")).toBe("Malooky");
    expect(translate("zh", "ملوكي")).toBe("马卢基");
    expect(translate("en", "جميع الحقوق محفوظة")).toBe("All rights reserved");
    expect(translate("zh", "جميع الحقوق محفوظة")).toBe("版权所有");
    expect(translate("en", "Uncatalogued source")).toBe("Uncatalogued source");
    expect(Object.keys(dict)).toEqual(["ar", "en", "zh"]);
  });

  it("localizes known API errors, preserves raw Arabic details, and hides unknown errors behind contextual fallbacks", () => {
    const stripeError = "الدفع غير متاح حالياً، حاول مرة أخرى لاحقاً.";
    expect(localizeApiError("ar", stripeError, "checkout")).toBe(stripeError);
    expect(localizeApiError("en", stripeError, "checkout")).toBe("Payments are unavailable right now. Please try again later.");
    expect(localizeApiError("zh", stripeError, "checkout")).toBe("暂时无法付款，请稍后再试。");
    expect(localizeApiError("en", "Stripe غير مهيأ — أضف STRIPE_SECRET_KEY و STRIPE_WEBHOOK_SECRET", "checkout")).toBe("Could not start checkout. Please try again.");
    expect(localizeApiError("en", "database secret details", "checkout")).toBe("Could not start checkout. Please try again.");
    expect(localizeApiError("zh", "database secret details", "video")).toBe("无法加载视频，请重试。");
    expect(localizeApiError("en", "  ", "manual-order")).toBe("Could not submit the enrollment request. Please try again.");
    expect(localizeApiError("ar", undefined, "video")).toBe("تعذّر تشغيل الفيديو، حاول مرة أخرى.");
    expect(localizeApiError("ar", "  ", "checkout")).toBe("  ");
    expect(localizeApiError("en", "ارفع صورة إثبات التحويل واكتب رقم واتساب", "manual-order")).toBe("Upload proof of payment and enter your WhatsApp number.");
    expect(localizeApiError("zh", "بيانات الدخول غير صحيحة", "login")).toBe("邮箱或密码不正确");
    expect(localizeApiError("en", "الحقول مطلوبة", "consult")).toBe("Please complete the required fields.");
    expect(localizeApiError("zh", "أدخل مبلغاً صحيحاً", "donation")).toBe("请输入有效金额。");
    expect(localizeApiError("en", "unknown donation error", "donation")).toBe("Could not start the donation. Please try again.");
    expect(localizeApiError("en", "provider details", "signup")).toBe("Could not create your account. Please try again.");
    expect(localizeApiError("zh", "بيانات التسجيل غير صالحة", "signup")).toBe("注册信息无效");
  });

  it("keeps title, description, and Open Graph locale aligned for each site language", () => {
    for (const lang of ["ar", "en", "zh"] as const) {
      const metadata = pageMetadata(lang, "/login");
      expect(metadata.title).toBe(pageTitle(lang, "/login"));
      expect(metadata.description).toBe(pageDescription(lang));
      expect(metadata.locale).toBe(openGraphLocale(lang));
    }
    expect(pageMetadata("en", "/").title).toContain("Arabic Calligraffiti Academy");
    expect(pageMetadata("zh", "/").title).toContain("阿拉伯书法涂鸦学院");
    expect(pageMetadata("en", "/consult").title).toBe("Private lessons | Malooky");
    expect(pageMetadata("zh", "/consult").title).toBe("私人课程 | 马卢基");
    expect(pageMetadata("ar", "/consult").title).toBe("دروس خاصة | ملوكي");
    expect(openGraphLocale("ar")).toBe("ar_AR");
    expect(openGraphLocale("en")).toBe("en_US");
    expect(openGraphLocale("zh")).toBe("zh_CN");
    expect(new Set([pageDescription("ar"), pageDescription("en"), pageDescription("zh")]).size).toBe(3);
  });

  it("provides the language-selector options and matching document direction/title", () => {
    expect(languages.map(({ code, labelNative }) => [code, labelNative])).toEqual([
      ["ar", "العربية"],
      ["en", "English"],
      ["zh", "中文"],
    ]);
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
    expect(dirFor("zh")).toBe("ltr");
    expect(pageTitle("en", "/login")).toBe(`${dict.en.login} | Malooky`);
    expect(pageTitle("zh", "/dash")).toBe(`${dict.zh.dash} | 马卢基`);
  });
});
