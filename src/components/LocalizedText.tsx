"use client";

import { useLang } from "@/components/LangProvider";

const COPY = {
  footer_brand: "أكاديمية الكاليجرافيتي العربي — نعلّم فن الحرف الحديث خطوة بخطوة، مع متابعة مباشرة من الأستاذ.",
  footer_links: "روابط",
  footer_security: "ملاحظة أمان",
  footer_security_copy: "جميع الفيديوهات مشفّرة ومحمية بعلامة مائية لكل مشاهد — التحميل وإعادة النشر ممنوع ومحفوظ الحقوق.",
  footer_rights: "جميع الحقوق محفوظة",
  footer_courses: "الكورسات",
  footer_vip: "دورة VIP",
  footer_consult: "استشارة",
  footer_donate: "تبرع",
  footer_login: "تسجيل الدخول",
} as const;

export default function LocalizedText({ id }: { id: keyof typeof COPY }) {
  const { tr } = useLang();
  return <>{tr(COPY[id])}</>;
}
