"use client";

import { useLang } from "@/components/LangProvider";

const COPY: Record<string, { ar: string; en: string; zh: string }> = {
  footer_brand: { ar: "أكاديمية الكاليجرافيتي العربي — نعلّم فن الحرف الحديث خطوة بخطوة، مع متابعة مباشرة من الأستاذ.", en: "Arabic calligraffiti academy — learn modern lettering step by step with direct instructor feedback.", zh: "阿拉伯书法涂鸦学院 — 循序渐进学习现代字母艺术，并获得导师的直接指导。" },
  footer_links: { ar: "روابط", en: "Explore", zh: "快速链接" },
  footer_security: { ar: "ملاحظة أمان", en: "Security note", zh: "安全说明" },
  footer_security_copy: { ar: "جميع الفيديوهات مشفّرة ومحمية بعلامة مائية لكل مشاهد — التحميل وإعادة النشر ممنوع ومحفوظ الحقوق.", en: "Videos are encrypted and watermarked for each viewer. Downloading and redistribution are prohibited.", zh: "所有视频均已加密，并为每位观看者添加水印。禁止下载和传播。" },
  footer_rights: { ar: "جميع الحقوق محفوظة", en: "All rights reserved", zh: "版权所有" },
  footer_courses: { ar: "الكورسات", en: "Courses", zh: "课程" },
  footer_vip: { ar: "دورة VIP", en: "VIP Live", zh: "VIP 直播课" },
  footer_consult: { ar: "استشارة", en: "Consulting", zh: "咨询" },
  footer_donate: { ar: "تبرع", en: "Donate", zh: "支持我们" },
  footer_login: { ar: "تسجيل الدخول", en: "Sign in", zh: "登录" },
};

export default function LocalizedText({ id }: { id: keyof typeof COPY }) {
  const { lang } = useLang();
  return <>{COPY[id][lang]}</>;
}
