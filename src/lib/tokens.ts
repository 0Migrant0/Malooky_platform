/**
 * ============================================================
 * MALOOKY — DESIGN TOKENS (المصدر الوحيد للهوية البصرية)
 * ============================================================
 * الهوية مستوحاة الآن من الشعار المرفق: فحمي دافئ، رمادي حجري، وعاجي.
 * حافظ على الألوان أحادية وهادئة حتى يبقى شكل الخط العربي هو نقطة التركيز.
 */

export const brand = {
  nameAr: "ملوكي",
  nameEn: "Malooky",
  taglineAr: "أكاديمية الكاليجرافيتي العربي",
  taglineEn: "Academy of Arabic Calligraffiti",
  /** يُدار أيضاً من إعدادات DASH (site_settings.whatsapp) */
  whatsapp: "",
  logoUrl: "/malooky-logo.jpg",
} as const;

export const palette = {
  ink: "#403B3C",
  primary: "#575152",
  primaryDark: "#3C3738",
  primarySoft: "#EEEBEB",
  accent: "#8A8182",
  accentDark: "#6C6465",
  accentSoft: "#F0ECEC",
  bg: "#F7F5F4",
  surface: "#FFFDFC",
  border: "#E6E1E1",
  muted: "#777071",
  success: "#2E7D32",
  danger: "#C62828",
  warning: "#B26A00",
  gold: "#8E8586",
} as const;

export const radii = {
  sm: "8px",
  md: "14px",
  lg: "22px",
  pill: "999px",
} as const;

export const shadows = {
  card: "0 10px 30px rgba(53,47,49,.08)",
  pop: "0 18px 50px rgba(53,47,49,.16)",
} as const;

/**
 * إعدادات أمان الفيديو — Bunny Stream
 * الرابط موقّع وقصير الأجل، والتشفير HLS AES-128 يُفعَّل من إعدادات مكتبة Bunny
 * (Enable File DRM / HLS AES-128 + Token Authentication على الـ Pull Zone).
 */
export const videoSecurity = {
  tokenTtlSeconds: 60 * 60 * 4, // صلاحية رابط التشغيل الموقّع
  playbackTicketSeconds: 60 * 10, // صلاحية تذكرة المشغّل قبل تبديل الرابط
  hlsAes128: true, // تفعيل HLS AES-128 (File DRM) في Bunny
  drm: { enabled: false, widevine: true, fairplay: true }, // DRM اختياري لاحقاً
  tokenRateLimit: { limit: 60, windowMs: 60_000 },
} as const;

export const payments = {
  currency: "USD",
  manualTransfer: { requireProof: true, requireWhatsapp: true },
  donations: { presets: [5, 10, 25, 50, 100] },
} as const;
